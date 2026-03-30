import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { initializeStorage, uploadImage, uploadSkinPackFile, getSignedUrl, getPublicUrl, deleteFile, BUCKET_NAME, IMAGES_BUCKET_NAME } from "./storage.tsx";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const app = new Hono();

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize storage on startup
initializeStorage();

// Auto-fix storage on every request - PERMANENT FIX
async function ensureStorageIsPublic() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const imagesBucket = buckets?.find(b => b.name === IMAGES_BUCKET_NAME);
    
    // If bucket doesn't exist or isn't public, fix it immediately
    if (!imagesBucket) {
      console.log(`⚠️ Images bucket missing! Creating PUBLIC bucket...`);
      await supabase.storage.createBucket(IMAGES_BUCKET_NAME, {
        public: true,
        fileSizeLimit: 1024 * 1024 * 10
      });
      console.log(`✅ Created PUBLIC images bucket`);
    } else if (!imagesBucket.public) {
      console.log(`⚠️ Images bucket is PRIVATE! Forcing to PUBLIC...`);
      await supabase.storage.updateBucket(IMAGES_BUCKET_NAME, {
        public: true,
        fileSizeLimit: 1024 * 1024 * 10
      });
      console.log(`✅ Forced images bucket to PUBLIC`);
    }
  } catch (error) {
    console.error('❌ Error ensuring storage is public:', error);
  }
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS — locked to trusted origins only
app.use(
  "/*",
  cors({
    origin: (origin) => {
      const allowed = ['https://2kterrysmods.com', 'https://www.2kterrysmods.com'];
      if (!origin) return 'https://2kterrysmods.com';
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return origin;
      return allowed.includes(origin) ? origin : 'https://2kterrysmods.com';
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// JWT-based admin auth middleware — validates Supabase token + admin record
const requireAdmin = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ error: 'Unauthorized — no token provided' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return c.json({ error: 'Unauthorized — invalid token' }, 401);
    }

    // Verify user is an admin
    const adminData = await kv.get(`admin:${user.id}`);
    if (!adminData) {
      return c.json({ error: 'Forbidden — not an admin' }, 403);
    }

    // Attach admin info to context for downstream handlers
    c.set('admin', adminData);
    await next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return c.json({ error: 'Authentication failed' }, 401);
  }
};

// Health check endpoint
app.get("/make-server-832015f7/health", (c) => {
  return c.json({ status: "ok" });
});

// DIAGNOSTIC: Check storage bucket status (admin only)
app.get("/make-server-832015f7/admin/check-storage", requireAdmin, async (c) => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    
    const imagesBucket = buckets?.find(b => b.name === IMAGES_BUCKET_NAME);
    const filesBucket = buckets?.find(b => b.name === BUCKET_NAME);
    
    // List a few files from images bucket to test
    let sampleFiles = [];
    if (imagesBucket) {
      const { data: files } = await supabase.storage.from(IMAGES_BUCKET_NAME).list('', { limit: 5 });
      sampleFiles = files || [];
    }
    
    return c.json({
      imagesBucket: imagesBucket ? {
        name: imagesBucket.name,
        public: imagesBucket.public,
        id: imagesBucket.id
      } : null,
      filesBucket: filesBucket ? {
        name: filesBucket.name,
        public: filesBucket.public,
        id: filesBucket.id
      } : null,
      sampleFiles: sampleFiles.map(f => ({
        name: f.name,
        publicUrl: getPublicUrl(IMAGES_BUCKET_NAME, f.name)
      })),
      supabaseUrl: supabaseUrl
    });
  } catch (error) {
    console.error('Storage check error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ADMIN: Force fix storage buckets
app.post("/make-server-832015f7/admin/fix-storage", requireAdmin, async (c) => {
  try {
    console.log('=== FORCING STORAGE FIX ===');
    
    const { data: buckets } = await supabase.storage.listBuckets();
    console.log('Current buckets:', buckets?.map(b => ({ name: b.name, public: b.public })));
    
    const imagesBucket = buckets?.find(b => b.name === IMAGES_BUCKET_NAME);
    
    if (imagesBucket) {
      // Force update to public
      console.log(`Forcing ${IMAGES_BUCKET_NAME} to be PUBLIC...`);
      const { data, error } = await supabase.storage.updateBucket(IMAGES_BUCKET_NAME, {
        public: true,
        fileSizeLimit: 1024 * 1024 * 10
      });
      
      if (error) {
        console.error('Error updating bucket:', error);
        return c.json({ error: `Failed to update bucket: ${error.message}` }, 500);
      }
      
      console.log('Bucket updated successfully:', data);
    } else {
      // Create new public bucket
      console.log(`Creating new PUBLIC bucket: ${IMAGES_BUCKET_NAME}`);
      const { data, error } = await supabase.storage.createBucket(IMAGES_BUCKET_NAME, {
        public: true,
        fileSizeLimit: 1024 * 1024 * 10
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
        return c.json({ error: `Failed to create bucket: ${error.message}` }, 500);
      }
      
      console.log('Bucket created successfully:', data);
    }
    
    // Verify it worked
    const { data: updatedBuckets } = await supabase.storage.listBuckets();
    const verifyBucket = updatedBuckets?.find(b => b.name === IMAGES_BUCKET_NAME);
    
    return c.json({ 
      success: true, 
      message: 'Storage fixed!',
      bucket: {
        name: verifyBucket?.name,
        public: verifyBucket?.public,
        id: verifyBucket?.id
      }
    });
  } catch (error) {
    console.error('Fix storage error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ADMIN: Migrate existing products to use public URLs
app.post("/make-server-832015f7/admin/migrate-to-public-urls", requireAdmin, async (c) => {
  try {
    console.log('Starting migration to public URLs...');
    
    // Get all skin packs
    const skinPacks = await kv.getByPrefix('skinpack:');
    console.log(`Found ${skinPacks.length} skin packs to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const pack of skinPacks) {
      try {
        // Check if images need migration (they're storage paths, not full URLs)
        const needsMigration = pack.images.some((img: string) => 
          !img.startsWith('http') && !img.startsWith('blob:')
        ) || (!pack.thumbnail.startsWith('http') && !pack.thumbnail.startsWith('blob:'));
        
        if (needsMigration) {
          console.log(`Migrating product: ${pack.name}`);
          
          // Images are already in storage, just need to reference them with public URLs
          // The paths are correct, we just return them as-is
          // The GET endpoints will convert them to public URLs automatically
          
          migratedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`Error migrating pack ${pack.id}:`, error);
      }
    }
    
    return c.json({ 
      success: true, 
      message: `Migration complete. ${migratedCount} products ready, ${skippedCount} already up-to-date.`,
      migrated: migratedCount,
      skipped: skippedCount
    });
  } catch (error) {
    console.error('Migration error:', error);
    return c.json({ error: 'Migration failed' }, 500);
  }
});

// ADMIN: Export all products as JSON backup
app.get("/make-server-832015f7/admin/export-products", requireAdmin, async (c) => {
  try {
    const skinPacks = await kv.getByPrefix('skinpack:');
    const games = await kv.getByPrefix('game:');
    
    const backup = {
      exportDate: new Date().toISOString(),
      products: skinPacks,
      games: games
    };
    
    return c.json(backup);
  } catch (error) {
    console.error('Error exporting products:', error);
    return c.json({ error: 'Export failed' }, 500);
  }
});

// Admin authentication endpoints

// First-time admin setup (only works if no admins exist)
// Requires email, password, and name in the request body
app.post("/make-server-832015f7/admin/setup", async (c) => {
  try {
    // Check if any admins exist — if so, block this endpoint entirely
    const existingAdmins = await kv.getByPrefix('admin:');

    if (existingAdmins.length > 0) {
      return c.json({ error: 'Admin accounts already exist. Use the dashboard to create new admins.' }, 400);
    }

    // Require credentials in request body — no hardcoded defaults
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: 'email, password, and name are required' }, 400);
    }

    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'admin' }
    });

    if (error) {
      return c.json({ error: error.message }, 400);
    }

    // Store admin info in KV store
    await kv.set(`admin:${data.user.id}`, {
      id: data.user.id,
      email: data.user.email,
      name,
      role: 'admin',
      createdAt: new Date().toISOString()
    });

    return c.json({
      success: true,
      message: 'Admin account created. Log in with your credentials.',
    });
  } catch (error) {
    console.error('Error in admin setup:', error);
    return c.json({ error: 'Setup failed' }, 500);
  }
});

// Admin signup — requires existing admin auth
app.post("/make-server-832015f7/admin/signup", requireAdmin, async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since we don't have email server configured
      user_metadata: { name, role: 'admin' }
    });
    
    if (error) {
      return c.json({ error: error.message }, 400);
    }
    
    // Store admin info in KV store
    await kv.set(`admin:${data.user.id}`, {
      id: data.user.id,
      email: data.user.email,
      name,
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    
    return c.json({ success: true, admin: { id: data.user.id, email, name } });
  } catch (error) {
    console.error('Error creating admin:', error);
    return c.json({ error: 'Failed to create admin account' }, 500);
  }
});

// Admin login
app.post("/make-server-832015f7/admin/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Verify user is an admin
    const adminData = await kv.get(`admin:${data.user.id}`);
    
    if (!adminData) {
      return c.json({ error: 'Not authorized as admin' }, 403);
    }
    
    return c.json({ 
      success: true, 
      session: data.session,
      admin: adminData
    });
  } catch (error) {
    console.error('Error during admin login:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Get current admin session
app.get("/make-server-832015f7/admin/session", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'No authorization header' }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return c.json({ error: 'Invalid session' }, 401);
    }
    
    const adminData = await kv.get(`admin:${user.id}`);
    
    if (!adminData) {
      return c.json({ error: 'Not authorized as admin' }, 403);
    }
    
    return c.json({ success: true, admin: adminData });
  } catch (error) {
    console.error('Error verifying session:', error);
    return c.json({ error: 'Session verification failed' }, 500);
  }
});

// Reset admin password (admin only)
app.post("/make-server-832015f7/admin/reset-password", requireAdmin, async (c) => {
  try {
    const { email, newPassword } = await c.req.json();
    
    if (!email || !newPassword) {
      return c.json({ error: 'Email and new password are required' }, 400);
    }
    
    // Find user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      return c.json({ error: 'Failed to find user' }, 500);
    }
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Update password
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword
    });
    
    if (error) {
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return c.json({ error: 'Failed to reset password' }, 500);
  }
});

// Get all admins (admin only)
app.get("/make-server-832015f7/admin/list", requireAdmin, async (c) => {
  try {
    const admins = await kv.getByPrefix('admin:');
    return c.json({ success: true, admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return c.json({ error: 'Failed to fetch admins' }, 500);
  }
});

// Customer management endpoints

// Create customer (admin only — also called by webhook via service role)
app.post("/make-server-832015f7/customers", requireAdmin, async (c) => {
  try {
    const { name, email, phone } = await c.req.json();
    
    const customerId = Date.now().toString();
    const customer = {
      id: customerId,
      name,
      email,
      phone: phone || '',
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString()
    };
    
    await kv.set(`customer:${customerId}`, customer);
    
    return c.json({ success: true, customer });
  } catch (error) {
    console.error('Error creating customer:', error);
    return c.json({ error: 'Failed to create customer' }, 500);
  }
});

// Get all customers (admin only)
app.get("/make-server-832015f7/customers", requireAdmin, async (c) => {
  try {
    const customers = await kv.getByPrefix('customer:');
    return c.json({ success: true, customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return c.json({ error: 'Failed to fetch customers' }, 500);
  }
});

// Order management endpoints

// Create order (admin only)
app.post("/make-server-832015f7/orders", requireAdmin, async (c) => {
  try {
    const { customerId, customerName, customerEmail, skinPackId, skinPackName, amount } = await c.req.json();
    
    const orderId = `ORD-${Date.now()}`;
    const order = {
      id: orderId,
      customerId,
      customerName,
      customerEmail,
      skinPackId,
      skinPackName,
      amount,
      status: 'completed',
      createdAt: new Date().toISOString()
    };
    
    await kv.set(`order:${orderId}`, order);
    
    // Update customer stats
    const customer = await kv.get(`customer:${customerId}`);
    if (customer) {
      customer.totalOrders = (customer.totalOrders || 0) + 1;
      customer.totalSpent = (customer.totalSpent || 0) + amount;
      await kv.set(`customer:${customerId}`, customer);
    }
    
    return c.json({ success: true, order });
  } catch (error) {
    console.error('Error creating order:', error);
    return c.json({ error: 'Failed to create order' }, 500);
  }
});

// Get all orders (admin only)
app.get("/make-server-832015f7/orders", requireAdmin, async (c) => {
  try {
    const orders = await kv.getByPrefix('order:');
    // Sort by date descending
    const sortedOrders = orders.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return c.json({ success: true, orders: sortedOrders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

// Update order status (admin only)
app.put("/make-server-832015f7/orders/:id", requireAdmin, async (c) => {
  try {
    const orderId = c.req.param('id');
    const { status } = await c.req.json();
    
    const order = await kv.get(`order:${orderId}`);
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }
    
    order.status = status;
    await kv.set(`order:${orderId}`, order);
    
    return c.json({ success: true, order });
  } catch (error) {
    console.error('Error updating order:', error);
    return c.json({ error: 'Failed to update order' }, 500);
  }
});

// Get all games
app.get("/make-server-832015f7/games", async (c) => {
  try {
    const games = await kv.getByPrefix('game:');
    return c.json({ games });
  } catch (error) {
    console.error('Error fetching games:', error);
    return c.json({ error: 'Failed to fetch games' }, 500);
  }
});

// Create a new game (admin only)
app.post("/make-server-832015f7/games", requireAdmin, async (c) => {
  try {
    const game = await c.req.json();
    const gameId = `game:${game.id}`;
    await kv.set(gameId, game);
    return c.json({ success: true, game });
  } catch (error) {
    console.error('Error creating game:', error);
    return c.json({ error: 'Failed to create game' }, 500);
  }
});

// Get all skin packs
app.get("/make-server-832015f7/skin-packs", async (c) => {
  try {
    // AUTO-FIX: Ensure storage is public before serving images
    await ensureStorageIsPublic();
    
    const skinPacks = await kv.getByPrefix('skinpack:');
    
    // Fix broken skin packs with blob URLs by replacing with game images
    const fixedSkinPacks = await Promise.all(
      skinPacks.map(async (pack: any) => {
        const hasBlobImages = pack.images.some((img: string) => img.startsWith('blob:'));
        const hasBlobThumbnail = pack.thumbnail.startsWith('blob:');
        
        if (hasBlobImages || hasBlobThumbnail) {
          console.log(`Fixing broken skin pack: ${pack.id} - ${pack.name}`);
          
          // Get the game to use its image as fallback
          const game = await kv.get(`game:${pack.gameId}`);
          const fallbackImage = game?.image || '/images/brand/fog-court.jpg';
          
          // Replace broken images with fallback
          const fixedPack = {
            ...pack,
            images: pack.images.map((img: string) => 
              img.startsWith('blob:') ? fallbackImage : img
            ),
            thumbnail: pack.thumbnail.startsWith('blob:') ? fallbackImage : pack.thumbnail
          };
          
          // Save the fixed pack back to database
          await kv.set(`skinpack:${pack.id}`, fixedPack);
          
          return fixedPack;
        }
        
        return pack;
      })
    );
    
    // Get signed URLs for images
    const skinPacksWithUrls = await Promise.all(
      fixedSkinPacks.map(async (pack: any) => {
        try {
          const imagesWithUrls = pack.images.map((imagePath: string) => {
            // Skip full URLs (http/https/blob) and local web paths (start with /)
            if (imagePath.startsWith('http') || imagePath.startsWith('blob:') || imagePath.startsWith('/')) {
              return imagePath;
            }
            // Only convert storage-relative paths to public URLs
            const publicUrl = getPublicUrl(IMAGES_BUCKET_NAME, imagePath);
            console.log(`Generated public URL for ${imagePath}: ${publicUrl}`);
            return publicUrl;
          });

          let thumbnailUrl = pack.thumbnail;
          if (!pack.thumbnail.startsWith('http') && !pack.thumbnail.startsWith('blob:') && !pack.thumbnail.startsWith('/')) {
            thumbnailUrl = getPublicUrl(IMAGES_BUCKET_NAME, pack.thumbnail);
            console.log(`Generated public URL for thumbnail ${pack.thumbnail}: ${thumbnailUrl}`);
          }
          
          return {
            ...pack,
            images: imagesWithUrls,
            thumbnail: thumbnailUrl
          };
        } catch (error) {
          console.error('Error getting public URLs for skin pack:', error);
          return pack;
        }
      })
    );
    
    return c.json({ skinPacks: skinPacksWithUrls });
  } catch (error) {
    console.error('Error fetching skin packs:', error);
    return c.json({ error: 'Failed to fetch skin packs' }, 500);
  }
});

// Get a single skin pack by ID
app.get("/make-server-832015f7/skin-packs/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const skinPack = await kv.get(`skinpack:${id}`);
    
    if (!skinPack) {
      return c.json({ error: 'Skin pack not found' }, 404);
    }
    
    // Get PUBLIC URLs for images (no expiration)
    const imagesWithUrls = skinPack.images.map((imagePath: string) => {
      // Skip full URLs, blob URLs, and local web paths (start with /)
      if (imagePath.startsWith('http') || imagePath.startsWith('blob:') || imagePath.startsWith('/')) {
        return imagePath;
      }
      return getPublicUrl(IMAGES_BUCKET_NAME, imagePath);
    });

    let thumbnailUrl = skinPack.thumbnail;
    if (!skinPack.thumbnail.startsWith('http') && !skinPack.thumbnail.startsWith('blob:') && !skinPack.thumbnail.startsWith('/')) {
      thumbnailUrl = getPublicUrl(IMAGES_BUCKET_NAME, skinPack.thumbnail);
    }
    
    return c.json({ 
      skinPack: {
        ...skinPack,
        images: imagesWithUrls,
        thumbnail: thumbnailUrl
      }
    });
  } catch (error) {
    console.error('Error fetching skin pack:', error);
    return c.json({ error: 'Failed to fetch skin pack' }, 500);
  }
});

// Create a new skin pack (admin only)
app.post("/make-server-832015f7/skin-packs", requireAdmin, async (c) => {
  try {
    const skinPack = await c.req.json();
    const skinPackId = `skinpack:${skinPack.id}`;
    await kv.set(skinPackId, skinPack);
    return c.json({ success: true, skinPack });
  } catch (error) {
    console.error('Error creating skin pack:', error);
    return c.json({ error: 'Failed to create skin pack' }, 500);
  }
});

// Update skin pack (admin only)
app.put("/make-server-832015f7/skin-packs/:id", requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const skinPack = await c.req.json();
    await kv.set(`skinpack:${id}`, skinPack);
    return c.json({ success: true, skinPack });
  } catch (error) {
    console.error('Error updating skin pack:', error);
    return c.json({ error: 'Failed to update skin pack' }, 500);
  }
});

// Delete skin pack (admin only)
app.delete("/make-server-832015f7/skin-packs/:id", requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const skinPack = await kv.get(`skinpack:${id}`);
    
    if (!skinPack) {
      return c.json({ error: 'Skin pack not found' }, 404);
    }
    
    // Delete associated files from storage
    try {
      if (skinPack.filePath && !skinPack.filePath.startsWith('http')) {
        await deleteFile(BUCKET_NAME, skinPack.filePath);
      }
      
      // Delete images
      if (skinPack.images) {
        await Promise.all(
          skinPack.images.map(async (imagePath: string) => {
            if (!imagePath.startsWith('http')) {
              try {
                await deleteFile(IMAGES_BUCKET_NAME, imagePath);
              } catch (error) {
                console.error('Error deleting image:', error);
              }
            }
          })
        );
      }
    } catch (error) {
      console.error('Error deleting files from storage:', error);
    }
    
    await kv.del(`skinpack:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting skin pack:', error);
    return c.json({ error: 'Failed to delete skin pack' }, 500);
  }
});

// Upload image (admin only)
app.post('/make-server-832015f7/upload-image', requireAdmin, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }
    
    // Validate file type - only allow images
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedImageTypes.includes(file.type.toLowerCase())) {
      return c.json({ error: `Invalid file type. Allowed types: ${allowedImageTypes.join(', ')}` }, 400);
    }
    
    // Validate file size - max 10MB for images
    const maxImageSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxImageSize) {
      return c.json({ error: 'File too large. Maximum size is 10MB for images' }, 400);
    }
    
    // Sanitize filename - remove path traversal attempts and special characters
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.\./g, '');
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const fileName = `${Date.now()}-${sanitizedName}`;
    
    const path = await uploadImage(fileName, uint8Array, file.type);
    
    // Return ONLY the path, not a signed URL
    // The frontend will use this path, and we'll generate signed URLs when fetching
    return c.json({ success: true, path, url: path });
  } catch (error) {
    console.error('Error uploading image:', error);
    return c.json({ error: 'Failed to upload image' }, 500);
  }
});

// Upload skin pack file (admin only)
app.post("/make-server-832015f7/upload-file", requireAdmin, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }
    
    // Validate file type - only allow ZIP files
    const allowedFileTypes = ['application/zip', 'application/x-zip-compressed', 'application/x-zip'];
    if (!allowedFileTypes.includes(file.type.toLowerCase()) && !file.name.toLowerCase().endsWith('.zip')) {
      return c.json({ error: 'Invalid file type. Only ZIP files are allowed' }, 400);
    }
    
    // Validate file size - max 500MB for skin pack files
    const maxFileSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxFileSize) {
      return c.json({ error: 'File too large. Maximum size is 500MB' }, 400);
    }
    
    // Sanitize filename - remove path traversal attempts and special characters
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.\./g, '');
    
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const fileName = `${Date.now()}-${sanitizedName}`;
    
    const path = await uploadSkinPackFile(fileName, uint8Array);
    
    return c.json({ success: true, path });
  } catch (error) {
    console.error('Error uploading file:', error);
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

// Get download URL for skin pack file
app.get("/make-server-832015f7/download/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const skinPack = await kv.get(`skinpack:${id}`);

    if (!skinPack || !skinPack.filePath) {
      return c.json({ error: 'Skin pack file not found' }, 404);
    }

    const signedUrl = await getSignedUrl(BUCKET_NAME, skinPack.filePath, 300); // 5 min expiry
    return c.json({ url: signedUrl });
  } catch (error) {
    console.error('Error getting download URL:', error);
    return c.json({ error: 'Failed to get download URL' }, 500);
  }
});

// Testimonials endpoints

// Get all testimonials (with optional approved filter)
app.get("/make-server-832015f7/testimonials", async (c) => {
  try {
    const approvedFilter = c.req.query('approved');
    const testimonials = await kv.getByPrefix('testimonial:');

    let filtered = testimonials;
    if (approvedFilter === 'true') {
      filtered = testimonials.filter((t: any) => t.approved === true);
    }

    // Sort by createdAt descending
    const sorted = filtered.sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return c.json({ testimonials: sorted });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return c.json({ error: 'Failed to fetch testimonials' }, 500);
  }
});

// Create a new testimonial (admin only)
app.post("/make-server-832015f7/testimonials", requireAdmin, async (c) => {
  try {
    const { customerName, gamertag, content, rating, avatar, featured, approved } = await c.req.json();

    if (!customerName || !content || !rating) {
      return c.json({ error: 'customerName, content, and rating are required' }, 400);
    }

    const id = crypto.randomUUID();
    const testimonial = {
      id,
      customerName,
      gamertag: gamertag || null,
      content,
      rating,
      avatar: avatar || null,
      featured: featured || false,
      approved: approved !== undefined ? approved : true,
      createdAt: new Date().toISOString()
    };

    await kv.set(`testimonial:${id}`, testimonial);

    return c.json({ testimonial });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    return c.json({ error: 'Failed to create testimonial' }, 500);
  }
});

// Update a testimonial (admin only)
app.put("/make-server-832015f7/testimonials/:id", requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();

    const testimonial = await kv.get(`testimonial:${id}`);
    if (!testimonial) {
      return c.json({ error: 'Testimonial not found' }, 404);
    }

    const updated = {
      ...testimonial,
      ...updates,
      id: testimonial.id,
      createdAt: testimonial.createdAt
    };

    await kv.set(`testimonial:${id}`, updated);

    return c.json({ testimonial: updated });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    return c.json({ error: 'Failed to update testimonial' }, 500);
  }
});

// Delete a testimonial (admin only)
app.delete("/make-server-832015f7/testimonials/:id", requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');

    const testimonial = await kv.get(`testimonial:${id}`);
    if (!testimonial) {
      return c.json({ error: 'Testimonial not found' }, 404);
    }

    await kv.del(`testimonial:${id}`);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return c.json({ error: 'Failed to delete testimonial' }, 500);
  }
});

// Increment download count for a skin pack
app.post("/make-server-832015f7/skin-packs/:id/download", async (c) => {
  try {
    const id = c.req.param('id');
    const skinPack = await kv.get(`skinpack:${id}`);

    if (!skinPack) {
      return c.json({ error: 'Skin pack not found' }, 404);
    }

    const newCount = (skinPack.downloads || 0) + 1;
    skinPack.downloads = newCount;

    await kv.set(`skinpack:${id}`, skinPack);

    return c.json({ downloads: newCount });
  } catch (error) {
    console.error('Error incrementing download count:', error);
    return c.json({ error: 'Failed to increment download count' }, 500);
  }
});

// Site Content API
app.get("/make-server-832015f7/site-content", async (c) => {
  try {
    const content = await kv.get('site-content');

    if (!content) {
      // Return default content if not set
      return c.json({
        content: {
          heroHeading: 'WELCOME TO\n2K TERRYS MODS',
          heroSubheading: 'Enhance Your 2K Experience',
          heroCtaText: 'Browse Mods',
          heroImagePath: '/images/brand/hero.jpg',
          aboutHeading: 'About 2K Terry\'s Mods',
          aboutText: '2K Terry\'s Mods is a community-driven platform dedicated to providing premium NBA 2K mods. From HD cyberfaces to custom courts and roster updates, we craft the highest quality modifications for the serious 2K community. Our mods enhance your gaming experience with attention to detail and realistic aesthetics.',
          donationHeading: 'Support 2K Terry\'s Mods',
          donationText: 'Love our mods? Consider supporting the project to help us continue creating premium content for the NBA 2K community. Your donation helps fund development, server costs, and enables us to bring you more amazing mods.',
          donationUrl: 'https://buymeacoffee.com/2kterrysmods',
          donationButtonText: 'Donate Now',
          footerBrandName: '2kTerrysMods',
          footerDescription: 'Premium NBA 2K mods — cyberfaces, jerseys, courts, and more.',
          footerCopyright: '© Copyright 2026 All Rights Reserved.',
          footerContactEmail: 'team@gigahertzcompany.com',
          footerRefundPolicy: 'All sales are final. No refunds.',
          footerDiscordUrl: 'https://discord.gg/fmx8F4Ue',
          footerDiscordText: 'Leave your Comments in the Discord',
          footerDonationUrl: 'https://buymeacoffee.com/2kterrysmods',
          footerDonationText: 'Support Us',
          feature1Title: 'HD Cyberfaces',
          feature1Description: 'High-definition player faces with realistic details and textures.',
          feature2Title: 'Custom Courts',
          feature2Description: 'Beautifully designed custom courts and arenas for immersive gameplay.',
          feature3Title: 'Roster Updates',
          feature3Description: 'Keep your game current with the latest roster changes and updates.',
          testimonialsHeading: 'What Modders Are Saying',
          testimonialsSubheading: 'Join thousands of satisfied modders'
        }
      });
    }

    return c.json({ content });
  } catch (error) {
    console.error('Error fetching site content:', error);
    return c.json({ error: 'Failed to fetch site content' }, 500);
  }
});

app.put("/make-server-832015f7/site-content", requireAdmin, async (c) => {
  try {
    const content = await c.req.json();

    if (!content) {
      return c.json({ error: 'Content is required' }, 400);
    }

    await kv.set('site-content', content);

    return c.json({ success: true, content });
  } catch (error) {
    console.error('Error updating site content:', error);
    return c.json({ error: 'Failed to update site content' }, 500);
  }
});

Deno.serve(app.fetch);