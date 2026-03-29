import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/track-download
 * Body: { skinPackId: string, type: 'free' | 'paid' }
 *
 * Increments the download counter for a skin pack.
 * Called by the frontend when a user clicks "Download Free"
 * or after a paid checkout redirect.
 */

function getSupabase() {
  const url = process.env.SUPABASE_URL || 'https://dxquofsanirdfonsnrqu.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  }
  return createClient(url, key);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { skinPackId } = req.body;

    if (!skinPackId) {
      return res.status(400).json({ error: 'skinPackId is required' });
    }

    const supabase = getSupabase();

    // Fetch the current skin pack from KV store
    const { data, error: fetchError } = await supabase
      .from('kv_store_832015f7')
      .select('value')
      .eq('key', `skinpack:${skinPackId}`)
      .single();

    if (fetchError) {
      console.error('Error fetching skin pack:', fetchError);
      return res.status(404).json({ error: 'Skin pack not found' });
    }

    const skinPack = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;

    const newDownloads = (skinPack.downloads || 0) + 1;

    const updatedSkinPack = {
      ...skinPack,
      downloads: newDownloads,
      updatedAt: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('kv_store_832015f7')
      .update({ value: updatedSkinPack })
      .eq('key', `skinpack:${skinPackId}`);

    if (updateError) {
      console.error('Error updating download count:', updateError);
      return res.status(500).json({ error: 'Failed to update download count' });
    }

    console.log(`Download tracked for skinpack:${skinPackId} — now at ${newDownloads}`);

    return res.status(200).json({
      success: true,
      downloads: newDownloads,
    });
  } catch (error: any) {
    console.error('Track download error:', error);
    return res.status(500).json({ error: error.message || 'Failed to track download' });
  }
}
