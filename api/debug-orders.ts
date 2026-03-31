import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GET: list all orders, optionally clean test orders
  const { data, error } = await supabase
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
    };
  });

  const action = req.query.action as string;

  if (action === 'clean-test') {
    // Identify test orders: email contains "test", or skinPackName contains "TEST",
    // or email is one of the known test emails
    const testOrders = orders.filter(o => {
      const email = (o.customerEmail || '').toLowerCase();
      const name = (o.skinPackName || '').toLowerCase();
      return (
        email.includes('test') ||
        name.includes('test') ||
        email === '' ||
        email.includes('@example.com')
      );
    });

    const deleted: string[] = [];
    for (const order of testOrders) {
      const { error: delErr } = await supabase
        .from('kv_store_832015f7')
        .delete()
        .eq('key', order.key);
      if (!delErr) deleted.push(order.key);
    }

    const remaining = orders.filter(o => !deleted.includes(o.key));
    return res.json({
      action: 'clean-test',
      deletedCount: deleted.length,
      deleted: testOrders.map(o => ({ key: o.key, email: o.customerEmail, pack: o.skinPackName, amount: o.amount })),
      remainingCount: remaining.length,
      remaining: remaining.map(o => ({ key: o.key, email: o.customerEmail, pack: o.skinPackName, amount: o.amount, status: o.status })),
    });
  }

  if (action === 'delete-all-test') {
    // More aggressive: delete ALL non-real orders. Keep only orders from real customer emails.
    // You can add known real emails here
    const realEmails = ['walid.johnson@gmail.com'];

    const testOrders = orders.filter(o => !realEmails.includes((o.customerEmail || '').toLowerCase()));

    const deleted: string[] = [];
    for (const order of testOrders) {
      const { error: delErr } = await supabase
        .from('kv_store_832015f7')
        .delete()
        .eq('key', order.key);
      if (!delErr) deleted.push(order.key);
    }

    const remaining = orders.filter(o => !deleted.includes(o.key));
    return res.json({
      action: 'delete-all-test',
      deletedCount: deleted.length,
      deleted: testOrders.map(o => ({ key: o.key, email: o.customerEmail, pack: o.skinPackName, amount: o.amount })),
      remainingCount: remaining.length,
      remaining: remaining.map(o => ({ key: o.key, email: o.customerEmail, pack: o.skinPackName, amount: o.amount, status: o.status })),
    });
  }

  return res.json({ count: orders.length, orders });
}
