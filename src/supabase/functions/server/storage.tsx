import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = 'make-832015f7-skin-packs';
const IMAGES_BUCKET_NAME = 'make-832015f7-images';

// Initialize storage buckets
export async function initializeStorage() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    
    // Create skin packs bucket if it doesn't exist
    const skinPacksBucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    if (!skinPacksBucketExists) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 1024 * 1024 * 500 // 500MB limit
      });
      console.log(`Created bucket: ${BUCKET_NAME}`);
    }
    
    // Handle images bucket - update to public if it exists, create if it doesn't
    const imagesBucket = buckets?.find(bucket => bucket.name === IMAGES_BUCKET_NAME);
    if (imagesBucket) {
      // Update existing bucket to be public
      if (!imagesBucket.public) {
        console.log(`Updating ${IMAGES_BUCKET_NAME} to public...`);
        await supabase.storage.updateBucket(IMAGES_BUCKET_NAME, {
          public: true,
          fileSizeLimit: 1024 * 1024 * 10 // 10MB limit per image
        });
        console.log(`Updated bucket ${IMAGES_BUCKET_NAME} to public`);
      } else {
        console.log(`Bucket ${IMAGES_BUCKET_NAME} is already public`);
      }
    } else {
      // Create new public bucket
      await supabase.storage.createBucket(IMAGES_BUCKET_NAME, {
        public: true, // PUBLIC bucket for product images - no expiration needed
        fileSizeLimit: 1024 * 1024 * 10 // 10MB limit per image
      });
      console.log(`Created public bucket: ${IMAGES_BUCKET_NAME}`);
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

// Upload file to skin packs bucket
export async function uploadSkinPackFile(fileName: string, fileData: Uint8Array) {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, fileData, {
      contentType: 'application/zip',
      upsert: false
    });
  
  if (error) {
    throw error;
  }
  
  return data.path;
}

// Upload image to images bucket
export async function uploadImage(fileName: string, fileData: Uint8Array, contentType: string) {
  const { data, error } = await supabase.storage
    .from(IMAGES_BUCKET_NAME)
    .upload(fileName, fileData, {
      contentType,
      upsert: false
    });
  
  if (error) {
    throw error;
  }
  
  return data.path;
}

// Get signed URL for file
export async function getSignedUrl(bucketName: string, filePath: string, expiresIn: number = 3600) {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(filePath, expiresIn);
  
  if (error) {
    throw error;
  }
  
  return data.signedUrl;
}

// Get public URL for file (no expiration - for product images)
export function getPublicUrl(bucketName: string, filePath: string) {
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

// Delete file
export async function deleteFile(bucketName: string, filePath: string) {
  const { error } = await supabase.storage
    .from(bucketName)
    .remove([filePath]);
  
  if (error) {
    throw error;
  }
}

export { BUCKET_NAME, IMAGES_BUCKET_NAME };