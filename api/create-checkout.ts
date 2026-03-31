import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY || '';
  return new Stripe(key, { apiVersion: '2023-10-16' as any });
}

interface CartItem {
  skinPackId: string;
  skinPackName: string;
  price: number;
  r2Key: string;
  stripePriceId?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { items } = req.body as { items: CartItem[] };

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }

    const stripe = getStripe();

    // Build line items — use existing Stripe price IDs if available, otherwise create ad-hoc prices
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of items) {
      if (item.stripePriceId) {
        // Use existing Stripe price
        lineItems.push({
          price: item.stripePriceId,
          quantity: 1,
        });
      } else {
        // Create ad-hoc price data
        lineItems.push({
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(item.price * 100),
            product_data: {
              name: item.skinPackName,
            },
          },
          quantity: 1,
        });
      }
    }

    // Store all item metadata as JSON in the session metadata
    // The webhook will use this to create orders for each item
    const itemsMeta = items.map(i => ({
      id: i.skinPackId,
      name: i.skinPackName,
      price: i.price,
      r2Key: i.r2Key,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      metadata: {
        cart_items: JSON.stringify(itemsMeta),
        is_cart_checkout: 'true',
        // For single-item carts, also set individual fields for backward compat
        ...(items.length === 1 ? {
          skin_pack_id: items[0].skinPackId,
          skin_pack_name: items[0].skinPackName,
          r2_key: items[0].r2Key,
        } : {}),
      },
      success_url: `https://2kterrysmods.com/#checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: 'https://2kterrysmods.com/#shop',
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Create checkout error:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
