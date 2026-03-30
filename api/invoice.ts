import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { validateAdmin, setCorsHeaders } from './_lib/auth.js';

/**
 * GET  /api/invoice?orderId=xxx         → Returns HTML invoice for browser viewing/printing
 * POST /api/invoice  { orderId: string } → Sends invoice to customer via Resend
 *
 * Both require admin auth via Authorization header (Supabase JWT).
 */

function getSupabase() {
  const url = process.env.SUPABASE_URL || 'https://dxquofsanirdfonsnrqu.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  return createClient(url, key);
}

function generateInvoiceHtml(order: any): string {
  const orderRef = order.id.slice(0, 8).toUpperCase();
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; background: #fff; padding: 48px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; border-bottom: 3px solid #f97316; padding-bottom: 24px; }
    .brand { font-size: 24px; font-weight: 800; color: #f97316; letter-spacing: -0.5px; }
    .brand-sub { font-size: 11px; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; }
    .invoice-title { font-size: 32px; font-weight: 700; color: #0f172a; text-align: right; }
    .invoice-ref { font-size: 14px; color: #64748b; text-align: right; margin-top: 4px; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 11px; font-weight: 600; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px; }
    .info-label { font-size: 12px; color: #94a3b8; margin-bottom: 4px; }
    .info-value { font-size: 14px; color: #1e293b; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #f8fafc; padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #e2e8f0; }
    td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .amount { text-align: right; }
    .total-row td { border-top: 2px solid #0f172a; font-weight: 700; font-size: 18px; padding-top: 16px; }
    .total-amount { color: #f97316; }
    .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center; }
    .footer p { font-size: 12px; color: #94a3b8; line-height: 1.8; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-completed { background: #dcfce7; color: #16a34a; }
    .status-pending { background: #fef9c3; color: #ca8a04; }
    @media print { body { padding: 24px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">2K Terry's Mods</div>
      <div class="brand-sub">Premium 2K Modifications</div>
    </div>
    <div>
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-ref">#${orderRef}</div>
    </div>
  </div>

  <div class="info-grid">
    <div>
      <div class="section-title">Bill To</div>
      <div class="info-value">${order.customerName}</div>
      <div class="info-value" style="color: #64748b; font-weight: 400;">${order.customerEmail}</div>
    </div>
    <div style="text-align: right;">
      <div class="section-title">Invoice Details</div>
      <div style="margin-bottom: 8px;">
        <div class="info-label">Date</div>
        <div class="info-value">${orderDate}</div>
      </div>
      <div style="margin-bottom: 8px;">
        <div class="info-label">Status</div>
        <span class="status-badge status-${order.status || 'completed'}">${(order.status || 'completed').toUpperCase()}</span>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Description</th>
        <th class="amount">Qty</th>
        <th class="amount">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-weight: 600;">${order.skinPackName}</td>
        <td style="color: #64748b;">Digital mod pack — NBA 2K</td>
        <td class="amount">1</td>
        <td class="amount">$${order.amount.toFixed(2)}</td>
      </tr>
      <tr class="total-row">
        <td colspan="3" class="amount" style="font-size: 14px;">Total</td>
        <td class="amount total-amount">$${order.amount.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <p>
      2K Terry's Mods &bull; 2kterrysmods.com<br>
      All sales are final. No refunds.<br>
      Thank you for your purchase!
    </p>
  </div>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(req, res, 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Validate admin via Supabase JWT — header only, no query param auth
  const admin = await validateAdmin(req);
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const orderId = req.method === 'GET'
    ? (req.query.orderId as string)
    : req.body?.orderId;

  if (!orderId) return res.status(400).json({ error: 'orderId is required' });

  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('kv_store_832015f7')
      .select('value')
      .eq('key', `order:${orderId}`)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    const invoiceHtml = generateInvoiceHtml(order);

    // GET = return HTML invoice for browser viewing/printing
    if (req.method === 'GET') {
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(invoiceHtml);
    }

    // POST = send invoice to customer via email
    if (req.method === 'POST') {
      const { Resend } = await import('resend');
      const resendKey = process.env.RESEND_API_KEY;
      if (!resendKey) return res.status(500).json({ error: 'RESEND_API_KEY not configured' });

      const resend = new Resend(resendKey);
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@2kterrysmods.com';

      const { error: sendError } = await resend.emails.send({
        from: `2K Terry's Mods <${fromEmail}>`,
        to: [order.customerEmail],
        subject: `Invoice #${order.id.slice(0, 8).toUpperCase()} — 2K Terry's Mods`,
        html: invoiceHtml,
      });

      if (sendError) {
        console.error('Invoice send error:', sendError);
        return res.status(500).json({ error: 'Failed to send invoice' });
      }

      return res.status(200).json({ success: true, message: `Invoice sent to ${order.customerEmail}` });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Invoice error:', err);
    return res.status(500).json({ error: 'Failed to process invoice' });
  }
}
