import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * GET /api/customer-download?token=<download_token>
 *
 * Validates the download token against the DB, then generates a fresh
 * R2 signed URL (valid 1 hour) and redirects the customer to it.
 * Tokens never expire — customers can re-download forever.
 */

function getSupabase() {
  const url = process.env.SUPABASE_URL || 'https://dxquofsanirdfonsnrqu.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  return createClient(url, key);
}

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials not configured');
  }
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.query.token as string;
  if (!token) {
    return res.status(400).json({ error: 'Missing download token' });
  }

  try {
    const supabase = getSupabase();

    // Look up the download token
    const { data, error } = await supabase
      .from('kv_store_832015f7')
      .select('value')
      .eq('key', `download-token:${token}`)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Invalid or expired download link' });
    }

    const tokenData = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    const { r2Key, skinPackName, orderId } = tokenData;

    if (!r2Key) {
      return res.status(400).json({ error: 'No file associated with this download' });
    }

    // Log the download access
    console.log(`Download access: order=${orderId}, pack=${skinPackName}, token=${token.slice(0, 8)}...`);

    // Update last download timestamp
    await supabase
      .from('kv_store_832015f7')
      .update({
        value: { ...tokenData, lastDownloadedAt: new Date().toISOString() },
      })
      .eq('key', `download-token:${token}`);

    // Generate a fresh signed R2 URL (valid 1 hour)
    const r2 = getR2Client();
    const bucketName = process.env.R2_BUCKET_NAME || '2kterry';
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: r2Key,
    });
    const signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

    // Redirect the customer to the signed URL
    return res.redirect(302, signedUrl);
  } catch (err: any) {
    console.error('Customer download error:', err);
    return res.status(500).json({ error: 'Failed to process download' });
  }
}
