import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

/**
 * GET /api/test-checkout
 * Creates a test Stripe Checkout Session for the Angel Reese skin pack.
 * Uses TEST mode keys. Redirects to checkout.
 * DELETE THIS after testing.
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const testKey = process.env.STRIPE_TEST_SECRET_KEY;
  if (!testKey) {
    return res.status(500).json({ error: 'STRIPE_TEST_SECRET_KEY not configured' });
  }

  const stripe = new Stripe(testKey, { apiVersion: '2023-10-16' as any });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: 500, // $5.00
            product_data: {
              name: 'Angel Reese (TEST)',
              description: 'Chicago Sky\'s Angel Reese — TEST PURCHASE',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        skin_pack_id: '1774829130105',
        skin_pack_name: 'Angel Reese',
        r2_key: 'mods/1774829089358-2kTerrysMods-NBA2k26-pay-Chicago_Sky_Angel_Reese.zip',
        product_name: 'Angel Reese',
      },
      success_url: 'https://2kterrysmods.com/#checkout/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://2kterrysmods.com/',
    });

    // Redirect to checkout
    return res.redirect(303, session.url!);
  } catch (err: any) {
    console.error('Test checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
}
