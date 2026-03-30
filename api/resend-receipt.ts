import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { sendReceiptEmail } from './send-receipt';

/**
 * POST /api/resend-receipt
 * Body: { orderId: string }
 *
 * Admin action: looks up an existing order, finds or creates a download token,
 * and re-sends the receipt email to the customer.
 */

const ADMIN_SECRET = process.env.ADMIN_API_SECRET || '';

function getSupabase() {
  const url = process.env.SUPABASE_URL || 'https://dxquofsanirdfonsnrqu.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  return createClient(url, key);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = req.headers.authorization?.replace('Bearer ', '');
  if (auth !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    const supabase = getSupabase();

    // Look up the order
    const { data: orderData, error: orderError } = await supabase
      .from('kv_store_832015f7')
      .select('value')
      .eq('key', `order:${orderId}`)
      .single();

    if (orderError || !orderData) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = typeof orderData.value === 'string' ? JSON.parse(orderData.value) : orderData.value;

    // Find existing download token for this order, or create one
    const { data: tokenRows } = await supabase
      .from('kv_store_832015f7')
      .select('key, value')
      .like('key', 'download-token:%')
      .limit(1000);

    let downloadToken = '';
    if (tokenRows) {
      for (const row of tokenRows) {
        const val = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
        if (val.orderId === orderId) {
          downloadToken = val.token;
          break;
        }
      }
    }

    // If no token exists, create one
    if (!downloadToken) {
      const { randomUUID } = await import('crypto');
      downloadToken = randomUUID();

      // Get R2 key from skin pack
      let r2Key = '';
      const { data: packData } = await supabase
        .from('kv_store_832015f7')
        .select('value')
        .eq('key', `skinpack:${order.skinPackId}`)
        .single();

      if (packData) {
        const pack = typeof packData.value === 'string' ? JSON.parse(packData.value) : packData.value;
        r2Key = pack.r2Key || '';
      }

      await supabase.from('kv_store_832015f7').insert({
        key: `download-token:${downloadToken}`,
        value: {
          token: downloadToken,
          orderId,
          skinPackId: order.skinPackId,
          skinPackName: order.skinPackName,
          customerEmail: order.customerEmail,
          r2Key,
          createdAt: new Date().toISOString(),
          lastDownloadedAt: null,
        },
      });
    }

    // Send the receipt email
    await sendReceiptEmail({
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      skinPackName: order.skinPackName,
      amount: order.amount,
      orderId,
      downloadToken,
    });

    return res.status(200).json({ success: true, message: `Receipt re-sent to ${order.customerEmail}` });
  } catch (err: any) {
    console.error('Resend receipt error:', err);
    return res.status(500).json({ error: err.message || 'Failed to resend receipt' });
  }
}
