import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://2kterrysmods.com');

  // Only expose whether services are ready — never reveal which specific env vars exist
  const r2Ready = !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
  const webhookReady = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const emailReady = !!process.env.RESEND_API_KEY;

  return res.status(200).json({
    status: 'ok',
    services: { r2Ready, webhookReady, emailReady },
  });
}
