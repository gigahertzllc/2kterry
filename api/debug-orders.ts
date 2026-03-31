import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { data } = await supabase
    .from('kv_store_832015f7')
    .select('key, value')
    .like('key', 'order:%');

  const orders = (data || []).map(o => {
    const val = typeof o.value === 'string' ? JSON.parse(o.value) : o.value;
    return {
      key: o.key,
      id: val.id,
      customerEmail: val.customerEmail || '',
      customerName: val.customerName || '',
      skinPackName: val.skinPackName || '',
      skinPackId: val.skinPackId || '',
      amount: val.amount,
      status: val.status,
      createdAt: val.createdAt,
      // Include full value so we can see everything
      raw: val,
    };
  });

  // Sort newest first
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const action = req.query.action as string;
  const keysParam = req.query.keys as string; // comma-separated keys to delete

  if (action === 'delete' && keysParam) {
    const keysToDelete = keysParam.split(',').map(k => k.trim());
    const deleted: string[] = [];
    for (const key of keysToDelete) {
      const { error } = await supabase
        .from('kv_store_832015f7')
        .delete()
        .eq('key', key);
      if (!error) deleted.push(key);
    }
    const remaining = orders.filter(o => !deleted.includes(o.key));
    return res.json({
      action: 'delete',
      deletedCount: deleted.length,
      deleted,
      remainingCount: remaining.length,
      remaining: remaining.map(o => ({
        key: o.key, email: o.customerEmail, pack: o.skinPackName,
        amount: o.amount, status: o.status, created: o.createdAt,
      })),
    });
  }

  // Default: list all with full detail
  return res.json({
    count: orders.length,
    orders: orders.map(o => ({
      key: o.key,
      email: o.customerEmail,
      name: o.customerName,
      pack: o.skinPackName,
      packId: o.skinPackId,
      amount: o.amount,
      status: o.status,
      created: o.createdAt,
    })),
  });
}
