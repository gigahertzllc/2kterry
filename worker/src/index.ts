/**
 * 2K Terry's Mods — Download Worker
 *
 * Sits in front of R2 to serve mod files.
 * - Free mods: Served directly via R2 public URL (no worker needed)
 * - Paid mods: Requires a valid download token generated after Stripe payment
 *
 * Routes:
 *   GET /download/:token  — Verify token and stream paid file from R2
 *   POST /webhook/stripe   — Stripe webhook to generate download tokens after payment
 *   GET /health            — Health check
 */

export interface Env {
  BUCKET: R2Bucket;
  DOWNLOAD_TOKENS: KVNamespace;
  STRIPE_WEBHOOK_SECRET: string;
  CORS_ORIGIN: string;
}

// Simple token generation (crypto-safe)
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// CORS headers
function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const cors = corsHeaders(env.CORS_ORIGIN || '*');

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // ─── PAID DOWNLOAD: Verify token, stream file from R2 ───
    if (url.pathname.startsWith('/download/')) {
      const token = url.pathname.split('/download/')[1];
      if (!token) {
        return new Response(JSON.stringify({ error: 'Missing download token' }), {
          status: 400,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      // Look up token in KV
      const tokenData = await env.DOWNLOAD_TOKENS.get(token, 'json') as {
        r2Key: string;
        filename: string;
        expiresAt: number;
        maxDownloads: number;
        downloadCount: number;
      } | null;

      if (!tokenData) {
        return new Response(JSON.stringify({ error: 'Invalid or expired download token' }), {
          status: 403,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      // Check expiration (tokens last 24 hours)
      if (Date.now() > tokenData.expiresAt) {
        await env.DOWNLOAD_TOKENS.delete(token);
        return new Response(JSON.stringify({ error: 'Download link has expired' }), {
          status: 410,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      // Check download limit (3 downloads per token)
      if (tokenData.downloadCount >= tokenData.maxDownloads) {
        return new Response(JSON.stringify({ error: 'Download limit reached for this token' }), {
          status: 429,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      // Get file from R2
      const object = await env.BUCKET.get(tokenData.r2Key);
      if (!object) {
        return new Response(JSON.stringify({ error: 'File not found' }), {
          status: 404,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      // Increment download count
      tokenData.downloadCount += 1;
      const remainingTTL = Math.max(1, Math.floor((tokenData.expiresAt - Date.now()) / 1000));
      await env.DOWNLOAD_TOKENS.put(token, JSON.stringify(tokenData), {
        expirationTtl: remainingTTL,
      });

      // Stream file to user
      const headers = new Headers(cors);
      headers.set('Content-Type', 'application/zip');
      headers.set('Content-Disposition', `attachment; filename="${tokenData.filename}"`);
      if (object.size) {
        headers.set('Content-Length', object.size.toString());
      }

      return new Response(object.body, { headers });
    }

    // ─── STRIPE WEBHOOK: Generate download token after payment ───
    if (url.pathname === '/webhook/stripe' && request.method === 'POST') {
      try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature');

        // For now, we do a simple signature check
        // In production, use Stripe's webhook signature verification
        if (!signature && env.STRIPE_WEBHOOK_SECRET) {
          return new Response(JSON.stringify({ error: 'Missing signature' }), {
            status: 401,
            headers: { ...cors, 'Content-Type': 'application/json' },
          });
        }

        const event = JSON.parse(body);

        // Handle checkout.session.completed or payment_link.completed
        if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
          const session = event.data.object;

          // Extract the R2 key and filename from metadata
          // When creating Stripe Payment Links, add metadata: { r2_key: "filename.zip", display_name: "Pack Name" }
          const r2Key = session.metadata?.r2_key;
          const filename = session.metadata?.display_name || r2Key || 'download.zip';
          const customerEmail = session.customer_email || session.customer_details?.email;

          if (!r2Key) {
            console.error('No r2_key in payment metadata');
            return new Response(JSON.stringify({ error: 'Missing file metadata' }), {
              status: 400,
              headers: { ...cors, 'Content-Type': 'application/json' },
            });
          }

          // Generate a download token
          const token = generateToken();
          const tokenData = {
            r2Key,
            filename,
            customerEmail,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            maxDownloads: 3,
            downloadCount: 0,
            paymentId: session.id,
          };

          // Store in KV with 24-hour TTL
          await env.DOWNLOAD_TOKENS.put(token, JSON.stringify(tokenData), {
            expirationTtl: 86400, // 24 hours in seconds
          });

          // Return the download URL
          // The frontend success page will use this to show the download button
          const downloadUrl = `${url.origin}/download/${token}`;

          return new Response(JSON.stringify({
            received: true,
            downloadUrl,
            token,
          }), {
            headers: { ...cors, 'Content-Type': 'application/json' },
          });
        }

        // Acknowledge other events
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Webhook error:', error);
        return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
          status: 500,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
    }

    // ─── GENERATE TOKEN (admin endpoint — for manual token creation) ───
    if (url.pathname === '/admin/generate-token' && request.method === 'POST') {
      try {
        const { r2Key, filename, adminSecret } = await request.json() as {
          r2Key: string;
          filename: string;
          adminSecret: string;
        };

        // Simple admin auth — check against env secret
        // In production, use proper auth
        if (!adminSecret || adminSecret !== env.STRIPE_WEBHOOK_SECRET) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...cors, 'Content-Type': 'application/json' },
          });
        }

        // Verify file exists in R2
        const object = await env.BUCKET.head(r2Key);
        if (!object) {
          return new Response(JSON.stringify({ error: 'File not found in R2' }), {
            status: 404,
            headers: { ...cors, 'Content-Type': 'application/json' },
          });
        }

        const token = generateToken();
        const tokenData = {
          r2Key,
          filename: filename || r2Key,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          maxDownloads: 3,
          downloadCount: 0,
          manual: true,
        };

        await env.DOWNLOAD_TOKENS.put(token, JSON.stringify(tokenData), {
          expirationTtl: 86400,
        });

        return new Response(JSON.stringify({
          token,
          downloadUrl: `${url.origin}/download/${token}`,
          expiresIn: '24 hours',
          maxDownloads: 3,
        }), {
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to generate token' }), {
          status: 500,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
    }

    // 404 for everything else
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  },
};
