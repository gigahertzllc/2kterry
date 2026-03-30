import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { validateAdmin, setCorsHeaders } from './_lib/auth.js';

const KV_TABLE = 'kv_store_832015f7';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const IMAGES_BUCKET = 'make-832015f7-images';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16' as any,
  });
}

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

function resolveImageUrl(imagePath: string): string {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('blob:') || imagePath.startsWith('/')) return '';
  return `${SUPABASE_URL}/storage/v1/object/public/${IMAGES_BUCKET}/${imagePath}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(req, res, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Validate admin via Supabase JWT
  const admin = await validateAdmin(req);
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const stripe = getStripe();
    const supabase = getSupabase();

    // Fetch all skin packs from KV store
    const { data: rows, error } = await supabase
      .from(KV_TABLE)
      .select('key, value')
      .like('key', 'skinpack:%');

    if (error) throw new Error(`Failed to fetch skin packs: ${error.message}`);

    const results: { name: string; productId: string; status: string; imageUrl?: string }[] = [];

    for (const row of rows || []) {
      const pack = row.value;
      if (!pack.stripeProductId) {
        results.push({ name: pack.name, productId: 'none', status: 'skipped — no Stripe product' });
        continue;
      }

      try {
        const imageUrl = resolveImageUrl(pack.thumbnail || (pack.images && pack.images[0]) || '');

        const updateData: Stripe.ProductUpdateParams = {
          name: pack.name,
          description: pack.description || undefined,
        };

        if (imageUrl && imageUrl.startsWith('https://')) {
          updateData.images = [imageUrl];
        }

        await stripe.products.update(pack.stripeProductId, updateData);

        results.push({
          name: pack.name,
          productId: pack.stripeProductId,
          status: 'updated',
          imageUrl: imageUrl || 'no image',
        });
      } catch (err: any) {
        results.push({
          name: pack.name,
          productId: pack.stripeProductId,
          status: `error: ${err.message}`,
        });
      }
    }

    return res.status(200).json({
      success: true,
      synced: results.filter(r => r.status === 'updated').length,
      total: results.length,
      results,
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    return res.status(500).json({ error: 'Failed to sync products' });
  }
}
