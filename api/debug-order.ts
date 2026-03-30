import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/debug-order?event_id=evt_xxx&skin_pack_id=xxx
 * Temporary diagnostic endpoint — checks DB state for a webhook event.
 * DELETE THIS after debugging.
 */

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://dxquofsanirdfonsnrqu.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://2kterrysmods.com');

  const eventId = req.query.event_id as string;
  const skinPackId = req.query.skin_pack_id as string;

  const results: Record<string, any> = {
    envCheck: {
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || '(not set — will default to noreply@2kterrysmods.com)',
      SITE_URL: process.env.SITE_URL || '(not set — will default to https://2kterrysmods.com)',
    },
  };

  // Check if idempotency key exists
  if (eventId) {
    const { data: eventData, error: eventError } = await supabase
      .from('kv_store_832015f7')
      .select('key, value')
      .eq('key', `webhook-event:${eventId}`)
      .single();
    results.idempotencyKey = eventData ? { exists: true, value: eventData.value } : { exists: false, error: eventError?.message };
  }

  // Check if skin pack exists
  if (skinPackId) {
    const { data: packData, error: packError } = await supabase
      .from('kv_store_832015f7')
      .select('key, value')
      .eq('key', `skinpack:${skinPackId}`)
      .single();
    results.skinPack = packData ? { exists: true, id: skinPackId, hasR2Key: !!(typeof packData.value === 'object' ? packData.value : JSON.parse(packData.value)).r2Key } : { exists: false, error: packError?.message };
  }

  // Check for any orders with this customer email
  const { data: orderRows } = await supabase
    .from('kv_store_832015f7')
    .select('key, value')
    .like('key', 'order:%')
    .limit(100);

  const orders = (orderRows || [])
    .map(r => ({ key: r.key, value: typeof r.value === 'string' ? JSON.parse(r.value) : r.value }))
    .filter(r => r.value.customerEmail === 'walid.johnson@gmail.com');
  results.ordersForEmail = orders.map(o => ({ key: o.key, skinPackId: o.value.skinPackId, skinPackName: o.value.skinPackName, amount: o.value.amount, status: o.value.status, createdAt: o.value.createdAt }));

  // Check for download tokens
  const { data: tokenRows } = await supabase
    .from('kv_store_832015f7')
    .select('key, value')
    .like('key', 'download-token:%')
    .limit(100);

  const tokens = (tokenRows || [])
    .map(r => ({ key: r.key, value: typeof r.value === 'string' ? JSON.parse(r.value) : r.value }))
    .filter(r => r.value.customerEmail === 'walid.johnson@gmail.com');
  results.downloadTokens = tokens.map(t => ({ key: t.key, skinPackId: t.value.skinPackId, skinPackName: t.value.skinPackName, r2Key: t.value.r2Key, createdAt: t.value.createdAt }));

  return res.status(200).json(results);
}
