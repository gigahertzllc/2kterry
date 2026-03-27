import type { VercelRequest, VercelResponse } from '@vercel/node';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const ADMIN_SECRET = process.env.ADMIN_API_SECRET || '';

function getS3Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
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
    const { filename, contentType, fileSize } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    // Sanitize filename — keep it readable but URL-safe
    const timestamp = Date.now();
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const r2Key = `mods/${timestamp}-${safeName}`;

    const s3 = getS3Client();
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || '2kterry',
      Key: r2Key,
      ContentType: contentType || 'application/zip',
    });

    // Generate presigned URL valid for 1 hour
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    // The public URL for this file (once uploaded)
    const publicUrl = `https://pub-4b707c2cf1c14592b9bcf9e26fad42d6.r2.dev/${encodeURIComponent(r2Key).replace(/%2F/g, '/')}`;

    return res.status(200).json({
      uploadUrl,
      r2Key,
      publicUrl,
    });
  } catch (error: any) {
    console.error('Upload URL error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate upload URL' });
  }
}
