import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/debug-skinpacks
 * Lists all skin pack keys in the DB. Temporary — delete after debugging.
 */

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://dxquofsanirdfonsnrqu.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://2kterrysmods.com');

  const { data, error } = await supabase
    .from('kv_store_832015f7')
    .select('key, value')
    .like('key', 'skinpack:%')
    .limit(100);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const packs = (data || []).map(r => {
    const val = typeof r.value === 'string' ? JSON.parse(r.value) : r.value;
    return {
      key: r.key,
      id: val.id,
      name: val.name,
      price: val.price,
      r2Key: val.r2Key,
      stripePaymentLink: val.stripePaymentLink,
    };
  });

  return res.status(200).json({ count: packs.length, packs });
}
