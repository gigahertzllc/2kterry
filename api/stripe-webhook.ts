import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://dxquofsanirdfonsnrqu.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Disable automatic body parsing since we need the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(data);
    });
    req.on('error', reject);
  });
}

async function getCustomerIdByEmail(email: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('kv_store_832015f7')
      .select('key, value')
      .like('key', `customer:%`)
      .limit(1000);

    if (error) {
      console.error('Error fetching customers:', error);
      return null;
    }

    if (!data) return null;

    for (const row of data) {
      const value = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
      if (value.email === email) {
        // Extract customer ID from key (format: customer:{id})
        return row.key.split(':')[1];
      }
    }

    return null;
  } catch (error) {
    console.error('Error looking up customer by email:', error);
    return null;
  }
}

async function getOrCreateCustomer(
  email: string,
  name: string,
  amount: number
): Promise<string> {
  try {
    // Check if customer exists by email
    const existingCustomerId = await getCustomerIdByEmail(email);

    if (existingCustomerId) {
      // Update existing customer
      const { data: existingData, error: fetchError } = await supabase
        .from('kv_store_832015f7')
        .select('value')
        .eq('key', `customer:${existingCustomerId}`)
        .single();

      if (fetchError) {
        console.error('Error fetching existing customer:', fetchError);
        throw fetchError;
      }

      const customer = typeof existingData.value === 'string'
        ? JSON.parse(existingData.value)
        : existingData.value;

      const updatedCustomer = {
        ...customer,
        totalOrders: (customer.totalOrders || 0) + 1,
        totalSpent: (customer.totalSpent || 0) + amount,
        updatedAt: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('kv_store_832015f7')
        .update({
          value: updatedCustomer,
        })
        .eq('key', `customer:${existingCustomerId}`);

      if (updateError) {
        console.error('Error updating customer:', updateError);
        throw updateError;
      }

      return existingCustomerId;
    } else {
      // Create new customer
      const customerId = randomUUID();

      const newCustomer = {
        id: customerId,
        name,
        email,
        totalOrders: 1,
        totalSpent: amount,
        createdAt: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('kv_store_832015f7')
        .insert({
          key: `customer:${customerId}`,
          value: newCustomer,
        });

      if (insertError) {
        console.error('Error creating customer:', insertError);
        throw insertError;
      }

      return customerId;
    }
  } catch (error) {
    console.error('Error in getOrCreateCustomer:', error);
    throw error;
  }
}

async function createOrder(
  customerId: string,
  customerName: string,
  customerEmail: string,
  skinPackId: string,
  skinPackName: string,
  amount: number
): Promise<string> {
  try {
    const orderId = randomUUID();

    const order = {
      id: orderId,
      customerId,
      customerName,
      customerEmail,
      skinPackId,
      skinPackName,
      amount,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('kv_store_832015f7')
      .insert({
        key: `order:${orderId}`,
        value: order,
      });

    if (error) {
      console.error('Error creating order:', error);
      throw error;
    }

    return orderId;
  } catch (error) {
    console.error('Error in createOrder:', error);
    throw error;
  }
}

async function incrementSkinPackDownloads(skinPackId: string): Promise<void> {
  try {
    const { data, error: fetchError } = await supabase
      .from('kv_store_832015f7')
      .select('value')
      .eq('key', `skinpack:${skinPackId}`)
      .single();

    if (fetchError) {
      console.error('Error fetching skin pack:', fetchError);
      throw fetchError;
    }

    const skinPack = typeof data.value === 'string'
      ? JSON.parse(data.value)
      : data.value;

    const updatedSkinPack = {
      ...skinPack,
      downloads: (skinPack.downloads || 0) + 1,
      updatedAt: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('kv_store_832015f7')
      .update({
        value: updatedSkinPack,
      })
      .eq('key', `skinpack:${skinPackId}`);

    if (updateError) {
      console.error('Error updating skin pack downloads:', updateError);
      throw updateError;
    }
  } catch (error) {
    console.error('Error in incrementSkinPackDownloads:', error);
    throw error;
  }
}

async function resolveMetadata(
  session: Stripe.Checkout.Session
): Promise<{ skinPackId: string; skinPackName: string }> {
  // 1. Try session.metadata first (set when using direct Checkout Sessions)
  const sessionMeta = session.metadata || {};
  let skinPackId = sessionMeta.skin_pack_id || sessionMeta.skinPackId || '';
  let skinPackName = sessionMeta.skin_pack_name || sessionMeta.skinPackName || '';

  if (skinPackId) {
    return { skinPackId, skinPackName };
  }

  // 2. Try payment link metadata (Payment Links don't copy metadata to session)
  if (session.payment_link) {
    try {
      const paymentLinkId = typeof session.payment_link === 'string'
        ? session.payment_link
        : session.payment_link.id;
      const paymentLink = await stripe.paymentLinks.retrieve(paymentLinkId);
      const plMeta = paymentLink.metadata || {};
      skinPackId = plMeta.skin_pack_id || plMeta.skinPackId || '';
      skinPackName = plMeta.skin_pack_name || plMeta.skinPackName || '';
      if (skinPackId) {
        console.log('Resolved metadata from payment link:', { skinPackId, skinPackName });
        return { skinPackId, skinPackName };
      }
    } catch (err) {
      console.error('Error fetching payment link metadata:', err);
    }
  }

  // 3. Try line items → product metadata as last resort
  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ['data.price.product'],
    });
    for (const item of lineItems.data) {
      const product = (item.price as any)?.product as Stripe.Product | undefined;
      if (product && typeof product !== 'string' && product.metadata) {
        skinPackId = product.metadata.skin_pack_id || product.metadata.skinPackId || '';
        skinPackName = product.metadata.skin_pack_name || product.metadata.skinPackName || product.name || '';
        if (skinPackId) {
          console.log('Resolved metadata from product:', { skinPackId, skinPackName });
          return { skinPackId, skinPackName };
        }
      }
    }
  } catch (err) {
    console.error('Error fetching line items metadata:', err);
  }

  return { skinPackId, skinPackName };
}

async function handleCheckoutSessionCompleted(
  event: Stripe.CheckoutSessionCompletedEvent
): Promise<void> {
  try {
    const session = event.data.object as Stripe.Checkout.Session;

    // Extract customer info
    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name;
    const amount = session.amount_total ? session.amount_total / 100 : 0; // Convert from cents

    // Resolve metadata from session, payment link, or product (in that order)
    const { skinPackId, skinPackName } = await resolveMetadata(session);

    if (!customerEmail || !skinPackId) {
      console.error('Missing required fields in checkout session', {
        customerEmail,
        skinPackId,
        sessionId: session.id,
        paymentLink: session.payment_link,
      });
      return;
    }

    // Get or create customer
    const customerId = await getOrCreateCustomer(
      customerEmail,
      customerName || 'Customer',
      amount
    );

    // Create order
    await createOrder(
      customerId,
      customerName || 'Customer',
      customerEmail,
      skinPackId,
      skinPackName || 'Unknown Skin Pack',
      amount
    );

    // Note: download count is incremented by the frontend via /api/track-download
    // when the user lands on the checkout success page. This avoids double-counting.

    console.log('Checkout session completed:', {
      customerId,
      customerEmail,
      skinPackId,
      amount,
    });
  } catch (error) {
    console.error('Error handling checkout.session.completed:', error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(
  event: Stripe.PaymentIntentSucceededEvent
): Promise<void> {
  try {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    console.log('Payment intent succeeded:', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      metadata: paymentIntent.metadata,
    });

    // Payment intent succeeded - can be used for additional logging or processing
  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error);
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate webhook secret is configured
    if (!WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    // Read raw body
    const rawBody = await getRawBody(req);

    // Get signature from headers
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
    } catch (signatureError: any) {
      console.error('Webhook signature verification failed:', signatureError.message);
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    // Handle specific event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(
          event as Stripe.CheckoutSessionCompletedEvent
        );
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event as Stripe.PaymentIntentSucceededEvent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success response
    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: error.message || 'Webhook processing failed' });
  }
}
