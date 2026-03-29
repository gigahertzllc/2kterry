import { Resend } from 'resend';

/**
 * Shared receipt email sender — used by the Stripe webhook.
 * Not a standalone endpoint; exported for import.
 */

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@2kterrysmods.com';
const SITE_URL = process.env.SITE_URL || 'https://2kterrysmods.com';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY not configured');
  return new Resend(key);
}

export interface ReceiptEmailData {
  customerEmail: string;
  customerName: string;
  skinPackName: string;
  amount: number;
  orderId: string;
  downloadToken: string;
}

export async function sendReceiptEmail(data: ReceiptEmailData): Promise<void> {
  const resend = getResend();
  const downloadUrl = `${SITE_URL}/api/customer-download?token=${data.downloadToken}`;

  const { error } = await resend.emails.send({
    from: `2K Terry's Mods <${FROM_EMAIL}>`,
    to: [data.customerEmail],
    subject: `Your download is ready — ${data.skinPackName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <h1 style="margin: 0; font-size: 28px; color: #fb923c; letter-spacing: -0.5px;">
                2K TERRY'S MODS
              </h1>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 40px;">

              <!-- Thank You -->
              <h2 style="margin: 0 0 8px; font-size: 24px; color: #f8fafc;">
                Thank you for your purchase!
              </h2>
              <p style="margin: 0 0 32px; font-size: 16px; color: #94a3b8;">
                Hey ${data.customerName}, your mod is ready to download.
              </p>

              <!-- Order Details -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; border-radius: 12px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom: 12px; color: #64748b; font-size: 13px;">ORDER ID</td>
                        <td style="padding-bottom: 12px; color: #e2e8f0; font-size: 13px; text-align: right;">${data.orderId.slice(0, 8).toUpperCase()}</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px; color: #64748b; font-size: 13px;">ITEM</td>
                        <td style="padding-bottom: 12px; color: #e2e8f0; font-size: 13px; text-align: right;">${data.skinPackName}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-size: 13px;">TOTAL</td>
                        <td style="color: #fb923c; font-size: 18px; font-weight: 700; text-align: right;">$${data.amount.toFixed(2)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Download Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${downloadUrl}"
                       style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #f97316, #ea580c); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 10px;">
                      Download Your Mod
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 13px; color: #64748b; text-align: center;">
                This link is just for you and never expires. You can re-download anytime.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #475569;">
                Need help? Reply to this email or reach out on
                <a href="https://discord.gg/fmx8F4Ue" style="color: #fb923c; text-decoration: none;">Discord</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #334155;">
                &copy; 2026 2K Terry's Mods &mdash; All sales are final. No refunds.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });

  if (error) {
    console.error('Resend error:', error);
    throw new Error(`Failed to send receipt email: ${error.message}`);
  }

  console.log(`Receipt email sent to ${data.customerEmail} for order ${data.orderId}`);
}
