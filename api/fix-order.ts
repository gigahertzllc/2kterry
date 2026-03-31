import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const orderKey = 'order:4ac86d8f-106c-42be-81cc-5483536b52ea';
  const correctSkinPackId = '1774829130105';

  // Fetch the order
  const { data, error: fetchErr } = await supabase
    .from('kv_store_832015f7')
    .select('key, value')
    .eq('key', orderKey)
    .single();

  if (fetchErr || !data) {
    return res.json({ error: 'Order not found', fetchErr });
  }

  const val = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
  const oldId = val.skinPackId;

  // Update the skinPackId
  val.skinPackId = correctSkinPackId;

  const { error: updateErr } = await supabase
    .from('kv_store_832015f7')
    .update({ value: val })
    .eq('key', orderKey);

  if (updateErr) {
    return res.json({ error: 'Failed to update', updateErr });
  }

  return res.json({
    success: true,
    orderKey,
    oldSkinPackId: oldId,
    newSkinPackId: correctSkinPackId,
    order: val,
  });
}
