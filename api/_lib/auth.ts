import { createClient } from '@supabase/supabase-js';
import type { VercelRequest } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Validates admin authentication by verifying the Supabase JWT token
 * and checking that the user has an admin record in the KV store.
 *
 * Returns the admin user data if authenticated, or null if not.
 */
export async function validateAdmin(req: VercelRequest): Promise<{ userId: string; email: string } | null> {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Supabase credentials not configured');
    return null;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    // Verify user is an admin by checking KV store
    const { data: adminRecord } = await supabase
      .from('kv_store_832015f7')
      .select('value')
      .eq('key', `admin:${user.id}`)
      .single();

    if (!adminRecord) {
      return null;
    }

    return { userId: user.id, email: user.email || '' };
  } catch (err) {
    console.error('Auth validation error:', err);
    return null;
  }
}

/**
 * Gets the allowed CORS origin. Returns the requesting origin if it's trusted,
 * otherwise returns the primary domain.
 */
export function getCorsOrigin(req: VercelRequest): string {
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    'https://2kterrysmods.com',
    'https://www.2kterrysmods.com',
  ];

  // Allow localhost in development
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
    return origin;
  }

  if (allowedOrigins.includes(origin)) {
    return origin;
  }

  return 'https://2kterrysmods.com';
}

/**
 * Sets secure CORS headers on the response.
 */
export function setCorsHeaders(req: VercelRequest, res: any, methods: string = 'POST, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}
