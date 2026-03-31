import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'DELETE') {
    // Delete specific order by key
    const { key } = req.body || {};
    if (!key) return res.status(400).json({ error: 'key required' });
    const { error } = await supabase
      .from('kv_store_832015f7')
      .delete()
      .eq('key', key);
    return res.json({ deleted: key, error: error?.message });
  }

  // GET: list all orders
  const { data, error } = await supabase
    .from('kv_store_832015f7')
    .select('key, value')
    .like('key', 'order:%');

  const orders = (data || []).map(o => {
    const val = typeof o.value === 'string' ? JSON.parse(o.value) : o.value;
    return {
      key: o.key,
      id: val.id,
      customerEmail: val.customerEmail,
      skinPackName: val.skinPackName,
      amount: val.amount,
      status: val.status,
      createdAt: val.createdAt,
    };
  });

  return res.json({ count: orders.length, orders });
}
