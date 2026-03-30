import { projectId, publicAnonKey } from './supabase/info';
import { Game, SkinPack, Testimonial, SiteContent } from '../types';
import { defaultSiteContent } from '../data/defaultSiteContent';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-832015f7`;

// Pattern: the edge function wrongly converts local paths like /images/brand/foo.jpg
// into Supabase storage URLs. This regex catches those and extracts the original path.
const BROKEN_STORAGE_URL = new RegExp(
  `https://${projectId}\\.supabase\\.co/storage/v1/object/public/[^/]+(/images/.+)$`
);

// Fix image URLs that the edge function mangled from local paths into broken storage URLs
function fixImageUrl(url: string): string {
  if (!url) return url;
  const match = url.match(BROKEN_STORAGE_URL);
  if (match) {
    // Extract the original local path like /images/brand/foo.jpg
    return match[1];
  }
  return url;
}

function fixPackImages(pack: SkinPack): SkinPack {
  return {
    ...pack,
    thumbnail: fixImageUrl(pack.thumbnail),
    images: (pack.images || []).map(fixImageUrl),
  };
}

const headers = {
  'Authorization': `Bearer ${publicAnonKey}`,
  'Content-Type': 'application/json',
};

// Initialize database with default games if needed
export async function initializeDatabase() {
  try {
    const { games } = await getGames();
    
    if (games.length === 0) {
      // Add default games
      const defaultGames: Game[] = [
        {
          id: '1',
          name: 'NBA 2K26',
          slug: 'nba2k26',
          image: '/images/brand/fog-court.jpg'
        },
        {
          id: '2',
          name: 'NBA 2K25',
          slug: 'nba2k25',
          image: '/images/brand/poster-silhouettes.jpg'
        }
      ];

      for (const game of defaultGames) {
        await createGame(game);
      }
      
      console.log('Database initialized with default games');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Games API
export async function getGames(): Promise<{ games: Game[] }> {
  try {
    const response = await fetch(`${API_URL}/games`, { headers });
    const data = await response.json();
    return { games: data.games || [] };
  } catch (error) {
    console.error('Error fetching games from API:', error);
    return { games: [] };
  }
}

export async function createGame(game: Game): Promise<Game> {
  const response = await fetch(`${API_URL}/games`, {
    method: 'POST',
    headers,
    body: JSON.stringify(game),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create game');
  }
  
  const data = await response.json();
  return data.game;
}

// Skin Packs API
export async function getSkinPacks(): Promise<{ skinPacks: SkinPack[] }> {
  try {
    const response = await fetch(`${API_URL}/skin-packs`, { headers });
    const data = await response.json();
    // Fix any image URLs mangled by the edge function
    const packs = (data.skinPacks || []).map(fixPackImages);
    return { skinPacks: packs };
  } catch (error) {
    console.error('Error fetching skin packs from API:', error);
    return { skinPacks: [] };
  }
}

export async function getSkinPack(id: string): Promise<SkinPack | null> {
  try {
    const response = await fetch(`${API_URL}/skin-packs/${id}`, { headers });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    // Fix any image URLs mangled by the edge function
    return data.skinPack ? fixPackImages(data.skinPack) : null;
  } catch (error) {
    console.error('Error fetching skin pack from API:', error);
    return null;
  }
}

export async function createSkinPack(skinPack: SkinPack): Promise<SkinPack> {
  const response = await fetch(`${API_URL}/skin-packs`, {
    method: 'POST',
    headers,
    body: JSON.stringify(skinPack),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create skin pack');
  }
  
  const data = await response.json();
  return data.skinPack;
}

export async function updateSkinPack(skinPack: SkinPack): Promise<SkinPack> {
  const response = await fetch(`${API_URL}/skin-packs/${skinPack.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(skinPack),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update skin pack');
  }
  
  const data = await response.json();
  return data.skinPack;
}

export async function deleteSkinPack(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/skin-packs/${id}`, {
    method: 'DELETE',
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete skin pack');
  }
}

// ADMIN: Migrate products to use public URLs
export async function migrateToPublicUrls(): Promise<{ message: string; migrated: number; skipped: number }> {
  const response = await fetch(`${API_URL}/admin/migrate-to-public-urls`, {
    method: 'POST',
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to migrate products');
  }
  
  const data = await response.json();
  return { message: data.message, migrated: data.migrated, skipped: data.skipped };
}

// ADMIN: Export all products as backup
export async function exportProducts(): Promise<any> {
  const response = await fetch(`${API_URL}/admin/export-products`, {
    headers,
  });
  
  if (!response.ok) {
    throw new Error('Failed to export products');
  }
  
  return await response.json();
}

// File Upload API
export async function uploadImage(file: File): Promise<{ path: string; url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_URL}/upload-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload image');
  }
  
  const data = await response.json();
  return { path: data.path, url: data.url };
}

export async function uploadSkinPackFile(file: File): Promise<{ path: string }> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_URL}/upload-file`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload file');
  }
  
  const data = await response.json();
  return { path: data.path };
}

export async function getDownloadUrl(id: string): Promise<string> {
  const response = await fetch(`${API_URL}/download/${id}`, { headers });
  
  if (!response.ok) {
    throw new Error('Failed to get download URL');
  }
  
  const data = await response.json();
  return data.url;
}

// Admin authentication API
export async function adminSetup() {
  const response = await fetch(`${API_URL}/admin/setup`, {
    method: 'POST',
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Setup failed');
  }
  
  const data = await response.json();
  return data;
}

export async function adminSignup(email: string, password: string, name: string) {
  const response = await fetch(`${API_URL}/admin/signup`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password, name }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create admin');
  }
  
  const data = await response.json();
  return data;
}

export async function adminLogin(email: string, password: string) {
  const response = await fetch(`${API_URL}/admin/login`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Login failed');
  }
  
  const data = await response.json();
  return data;
}

export async function getAdminSession(token: string) {
  const response = await fetch(`${API_URL}/admin/session`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Session expired');
  }
  
  const data = await response.json();
  return data;
}

export async function resetAdminPassword(email: string, newPassword: string) {
  const response = await fetch(`${API_URL}/admin/reset-password`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, newPassword }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to reset password');
  }
  
  const data = await response.json();
  return data;
}

export async function getAdmins() {
  const response = await fetch(`${API_URL}/admin/list`, { headers });
  
  if (!response.ok) {
    throw new Error('Failed to fetch admins');
  }
  
  const data = await response.json();
  return data;
}

// Storage diagnostic APIs
export async function checkStorage() {
  const response = await fetch(`${API_URL}/admin/check-storage`, { headers });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to check storage');
  }
  
  const data = await response.json();
  return data;
}

export async function fixStorage() {
  const response = await fetch(`${API_URL}/admin/fix-storage`, {
    method: 'POST',
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fix storage');
  }
  
  const data = await response.json();
  return data;
}

// Customer management API
export async function createCustomer(name: string, email: string, phone?: string) {
  const response = await fetch(`${API_URL}/customers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, email, phone }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create customer');
  }
  
  const data = await response.json();
  return data;
}

export async function getCustomers() {
  const response = await fetch(`${API_URL}/customers`, { headers });
  
  if (!response.ok) {
    throw new Error('Failed to fetch customers');
  }
  
  const data = await response.json();
  return data;
}

// Order management API
export async function createOrder(orderData: {
  customerId: string;
  customerName: string;
  customerEmail: string;
  skinPackId: string;
  skinPackName: string;
  amount: number;
}) {
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(orderData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create order');
  }
  
  const data = await response.json();
  return data;
}

export async function getOrders() {
  const response = await fetch(`${API_URL}/orders`, { headers });
  
  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }
  
  const data = await response.json();
  return data;
}

export async function updateOrderStatus(orderId: string, status: string) {
  const response = await fetch(`${API_URL}/orders/${orderId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update order');
  }

  const data = await response.json();
  return data;
}

// Stripe Checkout API
export async function createCheckoutSession(params: {
  skinPackId: string;
  skinPackName: string;
  priceInCents: number;
  customerEmail?: string;
}) {
  const response = await fetch(`${API_URL}/checkout/create-session`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create checkout session');
  }

  const data = await response.json();
  return { sessionId: data.sessionId, clientSecret: data.clientSecret };
}

// Admin: Resend receipt email to customer
export async function resendReceipt(orderId: string): Promise<{ success: boolean; message: string }> {
  const adminToken = localStorage.getItem('adminToken') || '';
  const response = await fetch('/api/resend-receipt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ orderId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to resend receipt');
  }

  return await response.json();
}

// Admin: Get invoice HTML (opens in new tab for print/save as PDF)
export function getInvoiceUrl(orderId: string): string {
  const adminToken = localStorage.getItem('adminToken') || '';
  return `/api/invoice?orderId=${encodeURIComponent(orderId)}&auth=${encodeURIComponent(adminToken)}`;
}

// Admin: Send invoice email to customer
export async function sendInvoice(orderId: string): Promise<{ success: boolean; message: string }> {
  const adminToken = localStorage.getItem('adminToken') || '';
  const response = await fetch('/api/invoice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ orderId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to send invoice');
  }

  return await response.json();
}

// Download Tracking API (Vercel serverless function — works independently of edge function)
export async function trackDownload(skinPackId: string): Promise<{ success: boolean; downloads: number }> {
  try {
    const response = await fetch('/api/track-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skinPackId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Track download failed:', errorData);
      return { success: false, downloads: 0 };
    }

    return await response.json();
  } catch (error) {
    // Non-blocking — don't let tracking failure break the user's download
    console.error('Error tracking download:', error);
    return { success: false, downloads: 0 };
  }
}

// Testimonials API
export async function getTestimonials(): Promise<{ testimonials: Testimonial[] }> {
  try {
    const response = await fetch(`${API_URL}/testimonials`, { headers });
    const data = await response.json();
    return { testimonials: data.testimonials || [] };
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return { testimonials: [] };
  }
}

export async function getApprovedTestimonials(): Promise<{ testimonials: Testimonial[] }> {
  try {
    const response = await fetch(`${API_URL}/testimonials?approved=true`, { headers });
    const data = await response.json();
    return { testimonials: data.testimonials || [] };
  } catch (error) {
    console.error('Error fetching approved testimonials:', error);
    return { testimonials: [] };
  }
}

export async function createTestimonial(
  testimonial: Omit<Testimonial, 'id'>
): Promise<any> {
  const response = await fetch(`${API_URL}/testimonials`, {
    method: 'POST',
    headers,
    body: JSON.stringify(testimonial),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create testimonial');
  }

  const data = await response.json();
  return data;
}

export async function updateTestimonial(
  id: string,
  data: Partial<Testimonial>
): Promise<any> {
  const response = await fetch(`${API_URL}/testimonials/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update testimonial');
  }

  return await response.json();
}

export async function deleteTestimonial(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/testimonials/${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete testimonial');
  }
}

// Site Content API
export async function getSiteContent(): Promise<SiteContent> {
  try {
    const response = await fetch(`${API_URL}/site-content`, { headers });
    if (!response.ok) {
      return defaultSiteContent;
    }
    const data = await response.json();
    return data.content || defaultSiteContent;
  } catch (error) {
    console.error('Error fetching site content:', error);
    return defaultSiteContent;
  }
}

export async function updateSiteContent(content: SiteContent): Promise<void> {
  const response = await fetch(`${API_URL}/site-content`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(content),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update site content');
  }
}