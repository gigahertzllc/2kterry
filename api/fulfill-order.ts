import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { sendReceiptEmail } from './_lib/send-receipt.js';

/**
 * POST /api/fulfill-order
 * Body: { orderId, skinPackDbId }
 * Manually fulfills an order: creates download token + sends receipt email.
 * Temporary endpoint — delete after use.
 */

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://dxquofsanirdfonsnrqu.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Accept GET (query params) or POST (body)
    const orderId = (req.query.orderId as string) || req.body?.orderId;
    const skinPackDbId = (req.query.skinPackDbId as string) || req.body?.skinPackDbId;

    // Get the order
    const { data: orderData, error: orderErr } = await supabase
      .from('kv_store_832015f7')
      .select('value')
      .eq('key', `order:${orderId}`)
      .single();

    if (orderErr || !orderData) {
      return res.status(404).json({ error: 'Order not found', details: orderErr?.message });
    }

    const order = typeof orderData.value === 'string' ? JSON.parse(orderData.value) : orderData.value;

    // Get the skin pack using the CORRECT DB id
    const { data: packData, error: packErr } = await supabase
      .from('kv_store_832015f7')
      .select('value')
      .eq('key', `skinpack:${skinPackDbId}`)
      .single();

    if (packErr || !packData) {
      return res.status(404).json({ error: 'Skin pack not found', details: packErr?.message });
    }

    const skinPack = typeof packData.value === 'string' ? JSON.parse(packData.value) : packData.value;
    const r2Key = skinPack.r2Key || '';

    // Create download token
    const token = randomUUID();
    const tokenData = {
      token,
      orderId,
      skinPackId: skinPackDbId,
      skinPackName: order.skinPackName || skinPack.name,
      customerEmail: order.customerEmail,
      r2Key,
      createdAt: new Date().toISOString(),
      lastDownloadedAt: null,
    };

    const { error: insertErr } = await supabase
      .from('kv_store_832015f7')
      .insert({ key: `download-token:${token}`, value: tokenData });

    if (insertErr) {
      return res.status(500).json({ error: 'Failed to create download token', details: insertErr.message });
    }

    // Send receipt email
    await sendReceiptEmail({
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      skinPackName: order.skinPackName || skinPack.name,
      amount: order.amount,
      orderId,
      downloadToken: token,
    });

    return res.status(200).json({
      success: true,
      message: `Order fulfilled! Email sent to ${order.customerEmail}`,
      downloadToken: token,
    });
  } catch (err: any) {
    console.error('Fulfill error:', err);
    return res.status(500).json({ error: err.message });
  }
}
