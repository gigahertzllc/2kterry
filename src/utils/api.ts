import { projectId, publicAnonKey } from './supabase/info';
import { Game, SkinPack } from '../types';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-832015f7`;

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
          name: 'NBA 2K25',
          slug: 'nba2k25',
          image: 'https://images.unsplash.com/photo-1653191584476-9b7b47f9a8c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYmElMjBiYXNrZXRiYWxsJTIwcGxheWVyfGVufDF8fHx8MTc2NTI0NDQyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
        },
        {
          id: '2',
          name: 'Madden 26',
          slug: 'madden26',
          image: 'https://images.unsplash.com/photo-1763479177586-efdf53f9001b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb290YmFsbCUyMGdhbWUlMjBhY3Rpb248ZW58MXx8fHwxNzY1MjQ0NDIyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
        },
        {
          id: '3',
          name: 'FC 25',
          slug: 'fc25',
          image: 'https://images.unsplash.com/photo-1759701547036-bf7d7b05cc52?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlc3BvcnRzJTIwZ2FtaW5nJTIwc2V0dXB8ZW58MXx8fHwxNzY1MTYyMzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
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
    return { skinPacks: data.skinPacks || [] };
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
    return data.skinPack;
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