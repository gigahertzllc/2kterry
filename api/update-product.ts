import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { validateAdmin, setCorsHeaders } from './_lib/auth.js';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16' as any,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(req, res, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = await validateAdmin(req);
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { stripeProductId, name, description, price, imageUrl, downloadUrl, r2Key, skinPackId } = req.body;

    if (!stripeProductId || !price || price <= 0) {
      return res.status(400).json({ error: 'stripeProductId and price (> 0) are required' });
    }

    const stripe = getStripe();

    // Update the product name/description/images if changed
    await stripe.products.update(stripeProductId, {
      name: name || undefined,
      description: description || undefined,
      images: imageUrl ? [imageUrl] : undefined,
      metadata: {
        r2_key: r2Key || '',
        download_url: downloadUrl || '',
        skin_pack_id: skinPackId || '',
        skin_pack_name: name || '',
        source: '2kterrysmods-admin',
      },
    });

    // Create a new Price (Stripe prices are immutable — you can't change them, only create new ones)
    const newPrice = await stripe.prices.create({
      product: stripeProductId,
      unit_amount: Math.round(price * 100),
      currency: 'usd',
    });

    // Create a new Payment Link with the updated price
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: newPrice.id,
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `https://2kterrysmods.com/#checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        },
      },
      metadata: {
        r2_key: r2Key || '',
        download_url: downloadUrl || '',
        product_name: name || '',
        skin_pack_id: skinPackId || '',
        skin_pack_name: name || '',
      },
    });

    return res.status(200).json({
      stripeProductId,
      stripePriceId: newPrice.id,
      stripePaymentLink: paymentLink.url,
      paymentLinkId: paymentLink.id,
    });
  } catch (error: any) {
    console.error('Update product error:', error);
    return res.status(500).json({ error: 'Failed to update Stripe product' });
  }
}
