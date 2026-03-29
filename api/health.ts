import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const config = {
    r2AccountId: !!process.env.R2_ACCOUNT_ID,
    r2AccessKeyId: !!process.env.R2_ACCESS_KEY_ID,
    r2SecretAccessKey: !!process.env.R2_SECRET_ACCESS_KEY,
    r2BucketName: process.env.R2_BUCKET_NAME || '2kterry (default)',
    adminApiSecret: !!process.env.ADMIN_API_SECRET,
    stripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    supabaseUrl: !!process.env.SUPABASE_URL,
    supabaseServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    resendApiKey: !!process.env.RESEND_API_KEY,
  };

  return res.status(200).json({
    status: 'ok',
    envVarsConfigured: config,
    allR2Ready: config.r2AccountId && config.r2AccessKeyId && config.r2SecretAccessKey,
    webhookReady: config.stripeSecretKey && config.stripeWebhookSecret && config.supabaseServiceRoleKey,
    emailReady: !!config.resendApiKey,
  });
}
