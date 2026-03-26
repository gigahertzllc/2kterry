import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const ADMIN_SECRET = process.env.ADMIN_API_SECRET || 'TerryMods2025!';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16' as any,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Simple admin auth
  const auth = req.headers.authorization?.replace('Bearer ', '');
  if (auth !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { name, description, price, imageUrl, downloadUrl, r2Key } = req.body;

    if (!name || !price || price <= 0) {
      return res.status(400).json({ error: 'Name and price (> 0) are required' });
    }

    const stripe = getStripe();

    // 1. Create the Stripe Product
    const product = await stripe.products.create({
      name,
      description: description || undefined,
      images: imageUrl ? [imageUrl] : undefined,
      metadata: {
        r2_key: r2Key || '',
        download_url: downloadUrl || '',
        source: '2kterrysmods-admin',
      },
    });

    // 2. Create a Price for the product
    const stripePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(price * 100), // Stripe uses cents
      currency: 'usd',
    });

    // 3. Create a Payment Link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: stripePrice.id,
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
        product_name: name,
      },
    });

    return res.status(200).json({
      stripeProductId: product.id,
      stripePriceId: stripePrice.id,
      stripePaymentLink: paymentLink.url,
      paymentLinkId: paymentLink.id,
    });
  } catch (error: any) {
    console.error('Create product error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create Stripe product' });
  }
}
