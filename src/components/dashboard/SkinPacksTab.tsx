import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Plus, X, Image as ImageIcon, Package, Trash2, Pencil, CheckCircle2, AlertCircle, Cloud, Loader2, Eye, EyeOff, GripVertical, RefreshCw, DollarSign } from 'lucide-react';
import { Game, SkinPack } from '../../types';
import * as api from '../../utils/api';
import { toast } from 'sonner';
import { UploadProgress } from '../ui/UploadProgress';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { uploadFileWithProgress, validateFile, formatFileSize } from '../../utils/storage';

// Admin token is now set dynamically after login via api.setAdminToken()

interface SkinPacksTabProps {
  games: Game[];
  skinPacks: SkinPack[];
  onAddSkinPack: (skinPack: SkinPack) => void;
  onUpdateSkinPack: (id: string, skinPack: Omit<SkinPack, 'id'>) => void;
  onDeleteSkinPack: (id: string) => void;
}

// Upload file directly to R2 via presigned URL
async function uploadToR2(file: File, onProgress?: (progress: number) => void): Promise<{ r2Key: string; publicUrl: string }> {
  // Step 1: Get presigned upload URL from our API
  const response = await fetch('/api/upload-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${api.getAdminToken()}`,
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || 'application/zip',
      fileSize: file.size,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Failed to get upload URL' }));
    throw new Error(err.error || 'Failed to get upload URL');
  }

  const { uploadUrl, r2Key, publicUrl } = await response.json();

  // Step 2: Upload file directly to R2 using presigned URL (with progress)
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100;
        onProgress?.(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ r2Key, publicUrl });
      } else {
        reject(new Error(`R2 PUT failed: status ${xhr.status} - ${xhr.responseText || xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error uploading to R2 (possibly CORS). Check R2 bucket CORS settings.')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/zip');
    xhr.send(file);
  });
}

// Auto-create Stripe product + payment link
async function createStripeProduct(data: {
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  downloadUrl?: string;
  r2Key?: string;
  skinPackId?: string;
}): Promise<{ stripePaymentLink: string; stripeProductId: string; stripePriceId: string }> {
  const response = await fetch('/api/create-product', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${api.getAdminToken()}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Failed to create product' }));
    throw new Error(err.error || 'Failed to create Stripe product');
  }

  return response.json();
}

// Update existing Stripe product when price or details change
async function updateStripeProduct(data: {
  stripeProductId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  downloadUrl?: string;
  r2Key?: string;
  skinPackId?: string;
}): Promise<{ stripePaymentLink: string; stripeProductId: string; stripePriceId: string }> {
  const response = await fetch('/api/update-product', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${api.getAdminToken()}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Failed to update product' }));
    throw new Error(err.error || 'Failed to update Stripe product');
  }

  return response.json();
}

export function SkinPacksTab({ games, skinPacks, onAddSkinPack, onUpdateSkinPack, onDeleteSkinPack }: SkinPacksTabProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingSkinPack, setEditingSkinPack] = useState<SkinPack | null>(null);
  // Track purchases per skin pack from actual orders
  const [purchasesMap, setPurchasesMap] = useState<Record<string, { count: number; revenue: number }>>({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    gameId: '',
    fileSizeValue: '',
    fileSizeUnit: 'MB',
    featured: false,
  });

  // Fetch orders and build purchases map
  useEffect(() => {
    api.getOrders().then((orders: any[]) => {
      const map: Record<string, { count: number; revenue: number }> = {};
      for (const order of orders) {
        if (order.status === 'completed' && order.skinPackId) {
          if (!map[order.skinPackId]) {
            map[order.skinPackId] = { count: 0, revenue: 0 };
          }
          map[order.skinPackId].count += 1;
          map[order.skinPackId].revenue += order.amount || 0;
        }
      }
      setPurchasesMap(map);
    }).catch(() => {
      // Orders may not be loaded yet
    });
  }, [skinPacks]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedImagePaths, setUploadedImagePaths] = useState<string[]>([]);
  const [imageUploadProgress, setImageUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Mod file state
  const [modFile, setModFile] = useState<File | null>(null);
  const [modFileR2Key, setModFileR2Key] = useState<string | null>(null);
  const [modFilePublicUrl, setModFilePublicUrl] = useState<string | null>(null);
  const [modFileProgress, setModFileProgress] = useState(0);
  const [isUploadingModFile, setIsUploadingModFile] = useState(false);
  const [modFileUploaded, setModFileUploaded] = useState(false);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenEditModal = (skin: SkinPack) => {
    setEditingSkinPack(skin);

    const fileSizeMatch = skin.fileSize.match(/^(\d+(?:\.\d+)?)\s*([A-Z]+)$/i);
    const fileSizeValue = fileSizeMatch ? fileSizeMatch[1] : '';
    const fileSizeUnit = fileSizeMatch ? fileSizeMatch[2].toUpperCase() : 'MB';

    setFormData({
      name: skin.name,
      description: skin.description || '',
      price: skin.price.toString(),
      gameId: skin.gameId,
      fileSizeValue,
      fileSizeUnit,
      featured: skin.featured || false,
    });
    setUploadedImages(skin.images);
    setUploadedImagePaths(skin.images);
    if (skin.downloadUrl) {
      setModFilePublicUrl(skin.downloadUrl);
      setModFileUploaded(true);
    }
    if (skin.r2Key) {
      setModFileR2Key(skin.r2Key);
    }
    setShowUploadModal(true);
  };

  const handleCloseModal = () => {
    setShowUploadModal(false);
    setEditingSkinPack(null);
    setFormData({ name: '', description: '', price: '', gameId: '', fileSizeValue: '', fileSizeUnit: 'MB', featured: false });
    setUploadedImages([]);
    setUploadedImagePaths([]);
    setModFile(null);
    setModFileR2Key(null);
    setModFilePublicUrl(null);
    setModFileProgress(0);
    setIsUploadingModFile(false);
    setModFileUploaded(false);
    setIsSubmitting(false);
    setSubmitStep('');
  };

  // Handle mod file selection — immediately upload to R2
  const handleModFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Allow zip and rar files up to 500MB
    if (file.size > 500 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 500MB.');
      return;
    }

    setModFile(file);
    setIsUploadingModFile(true);
    setModFileProgress(0);
    setModFileUploaded(false);

    try {
      toast.info(`Uploading ${file.name} to cloud storage...`);

      const { r2Key, publicUrl } = await uploadToR2(file, (progress) => {
        setModFileProgress(progress);
      });

      setModFileR2Key(r2Key);
      setModFilePublicUrl(publicUrl);
      setModFileUploaded(true);
      setIsUploadingModFile(false);

      // Auto-fill file size
      const sizeMB = (file.size / (1024 * 1024)).toFixed(0);
      setFormData(prev => ({ ...prev, fileSizeValue: sizeMB, fileSizeUnit: 'MB' }));

      toast.success(`${file.name} uploaded to R2 successfully!`);
    } catch (error) {
      console.error('R2 upload error:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsUploadingModFile(false);
      setModFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.gameId || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!modFilePublicUrl && !editingSkinPack?.downloadUrl) {
      toast.error('Please upload a mod file first');
      return;
    }

    setIsSubmitting(true);
    const price = parseFloat(formData.price);
    const game = games.find(g => g.id === formData.gameId);
    const imagesToStore = uploadedImagePaths.length > 0 ? uploadedImagePaths : [game?.image || ''];
    // Generate ID once upfront so Stripe metadata and DB record use the same value
    const skinPackId = editingSkinPack?.id || Date.now().toString();

    let downloadUrl = modFilePublicUrl || editingSkinPack?.downloadUrl || '';
    let stripePaymentLink = editingSkinPack?.stripePaymentLink;
    let stripeProductId = editingSkinPack?.stripeProductId;
    let stripePriceId = editingSkinPack?.stripePriceId;

    try {
      const imageUrl = (() => {
        const img = imagesToStore[0];
        if (!img) return undefined;
        if (img.startsWith('http')) return img;
        return `https://dxquofsanirdfonsnrqu.supabase.co/storage/v1/object/public/make-832015f7-images/${img}`;
      })();

      const priceChanged = editingSkinPack && editingSkinPack.price !== price;
      const nameChanged = editingSkinPack && editingSkinPack.name !== formData.name;

      if (price > 0 && !stripePaymentLink) {
        // New paid mod — create Stripe product from scratch
        setSubmitStep('Creating Stripe product & payment link...');
        toast.info('Setting up Stripe payment...');

        try {
          const stripeResult = await createStripeProduct({
            name: formData.name,
            description: formData.description,
            price,
            imageUrl,
            downloadUrl,
            r2Key: modFileR2Key || undefined,
            skinPackId,
          });

          stripePaymentLink = stripeResult.stripePaymentLink;
          stripeProductId = stripeResult.stripeProductId;
          stripePriceId = stripeResult.stripePriceId;

          toast.success('Stripe product created automatically!');
        } catch (stripeErr) {
          console.error('Stripe error:', stripeErr);
          toast.error(`Stripe setup failed: ${stripeErr instanceof Error ? stripeErr.message : 'Unknown error'}. You can add the payment link manually later.`);
        }
      } else if (price > 0 && stripeProductId && (priceChanged || nameChanged)) {
        // Existing paid mod with price or name change — update Stripe
        setSubmitStep('Updating Stripe price...');
        toast.info('Updating Stripe payment link...');

        try {
          const stripeResult = await updateStripeProduct({
            stripeProductId,
            name: formData.name,
            description: formData.description,
            price,
            imageUrl,
            downloadUrl,
            r2Key: modFileR2Key || editingSkinPack?.r2Key || undefined,
            skinPackId,
          });

          stripePaymentLink = stripeResult.stripePaymentLink;
          stripeProductId = stripeResult.stripeProductId;
          stripePriceId = stripeResult.stripePriceId;

          toast.success('Stripe price updated!');
        } catch (stripeErr) {
          console.error('Stripe update error:', stripeErr);
          toast.error(`Stripe update failed: ${stripeErr instanceof Error ? stripeErr.message : 'Unknown error'}. The old price may still be active on Stripe.`);
        }
      }

      setSubmitStep('Saving skin pack...');

      const newSkinPack: SkinPack = {
        id: skinPackId,
        name: formData.name,
        description: formData.description,
        price,
        gameId: formData.gameId,
        gameName: game?.name || '',
        images: imagesToStore,
        thumbnail: imagesToStore[0] || game?.image || '',
        downloads: editingSkinPack?.downloads || 0,
        rating: editingSkinPack?.rating || 5.0,
        dateAdded: editingSkinPack?.dateAdded || new Date().toISOString().split('T')[0],
        fileSize: `${formData.fileSizeValue} ${formData.fileSizeUnit}`,
        featured: formData.featured,
        active: editingSkinPack?.active !== false ? true : editingSkinPack.active,
        downloadUrl,
        stripePaymentLink,
        stripeProductId,
        stripePriceId,
        r2Key: modFileR2Key || editingSkinPack?.r2Key,
      };

      if (editingSkinPack) {
        onUpdateSkinPack(editingSkinPack.id, newSkinPack);
        toast.success('Skin pack updated!');
      } else {
        onAddSkinPack(newSkinPack);
        toast.success('Skin pack created!');
      }

      handleCloseModal();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to save skin pack. Please try again.');
    } finally {
      setIsSubmitting(false);
      setSubmitStep('');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploadingImages(true);

    const files = Array.from(e.target.files);
    const newProgress: { [key: string]: number } = {};

    try {
      const blobUrls = files.map(file => URL.createObjectURL(file));
      const uploadPromises = files.map(async (file) => {
        const fileKey = `${file.name}-${file.size}`;
        newProgress[fileKey] = 0;
        setImageUploadProgress({ ...newProgress });

        try {
          return await uploadFileWithProgress(file, 'upload-image', {
            onProgress: (progress) => {
              newProgress[fileKey] = progress;
              setImageUploadProgress({ ...newProgress });
            }
          });
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          return { path: URL.createObjectURL(file) };
        }
      });

      const uploadResults = await Promise.all(uploadPromises);
      const paths = uploadResults.map(result => result.path);

      setUploadedImages(prev => [...prev, ...blobUrls]);
      setUploadedImagePaths(prev => [...prev, ...paths]);
      setImageUploadProgress({});
      setIsUploadingImages(false);
      toast.success(`${files.length} image(s) uploaded`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
      setIsUploadingImages(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setUploadedImagePaths(prev => prev.filter((_, i) => i !== index));
  };

  // Drag-to-reorder state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverItem.current = index;
  };

  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const from = dragItem.current;
    const to = dragOverItem.current;

    setUploadedImages(prev => {
      const copy = [...prev];
      const [removed] = copy.splice(from, 1);
      copy.splice(to, 0, removed);
      return copy;
    });
    setUploadedImagePaths(prev => {
      const copy = [...prev];
      const [removed] = copy.splice(from, 1);
      copy.splice(to, 0, removed);
      return copy;
    });

    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleSyncStripe = async () => {
    setIsSyncing(true);
    try {
      const result = await api.syncStripeProducts();
      toast.success(`Synced ${result.synced} of ${result.total} products to Stripe`);
    } catch (error) {
      toast.error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteClick = (skinId: string) => {
    setDeleteTargetId(skinId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      onDeleteSkinPack(deleteTargetId);
      toast.success('Skin pack deleted');
    } catch (error) {
      toast.error('Failed to delete skin pack');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    }
  };

  const isPaid = parseFloat(formData.price) > 0;

  return (
    <>
      {/* Header with Create Button */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl mb-2">Skin Pack Management</h2>
          <p className="text-gray-400">Create, edit, and manage your skin packs</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSyncStripe}
            disabled={isSyncing}
            className="px-5 py-4 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
            title="Sync all product images & descriptions to Stripe checkout pages"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync to Stripe'}</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-3"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Pack</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-orange-400" />
            <span className="text-sm text-gray-400">Total Packs</span>
          </div>
          <div className="text-3xl">{skinPacks.length}</div>
        </div>

        <div className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Upload className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-400">Total Downloads</span>
          </div>
          <div className="text-3xl">
            {skinPacks.reduce((sum, skin) => sum + skin.downloads, 0).toLocaleString()}
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-400">Total Purchases</span>
          </div>
          <div className="text-3xl">
            {Object.values(purchasesMap).reduce((sum, p) => sum + p.count, 0)}
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-gray-400">Total Revenue</span>
          </div>
          <div className="text-3xl">
            ${Object.values(purchasesMap).reduce((sum, p) => sum + p.revenue, 0).toFixed(2)}
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-gray-400">Avg Rating</span>
          </div>
          <div className="text-3xl">
            {skinPacks.length > 0 ? (skinPacks.reduce((sum, skin) => sum + skin.rating, 0) / skinPacks.length).toFixed(1) : '0.0'}
          </div>
        </div>
      </div>

      {/* Skin Packs Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3>Your Skin Packs</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Pack</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Game</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Price</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Downloads</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Purchases</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Revenue</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Rating</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Date</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Visible</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {skinPacks.map((skin, index) => (
                <tr
                  key={skin.id}
                  className={`${index % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'} hover:bg-slate-800/50 transition-colors`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={skin.thumbnail}
                        alt={skin.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div>
                        <div className="mb-1">{skin.name}</div>
                        <div className="text-sm text-gray-400">{skin.fileSize}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-orange-400">{skin.gameName}</td>
                  <td className="px-6 py-4">
                    {skin.price === 0 ? (
                      <span className="text-green-400">Free</span>
                    ) : (
                      <span>${skin.price}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{skin.downloads.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={purchasesMap[skin.id]?.count ? 'text-green-400' : 'text-gray-500'}>
                      {purchasesMap[skin.id]?.count || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={purchasesMap[skin.id]?.revenue ? 'text-orange-400' : 'text-gray-500'}>
                      ${(purchasesMap[skin.id]?.revenue || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">{skin.rating}</td>
                  <td className="px-6 py-4 text-gray-400">{new Date(skin.dateAdded).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        const updated = { ...skin, active: skin.active === false ? true : false };
                        const { id, ...rest } = updated;
                        onUpdateSkinPack(id, rest);
                        toast.success(updated.active ? `${skin.name} is now visible` : `${skin.name} is now hidden`);
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all ${
                        skin.active !== false
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-slate-700/50 text-gray-500 border border-slate-600'
                      }`}
                    >
                      {skin.active !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {skin.active !== false ? 'Live' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEditModal(skin)}
                        className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors group"
                      >
                        <Pencil className="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(skin.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <h2>{editingSkinPack ? 'Edit Skin Pack' : 'Create New Skin Pack'}</h2>
              <button
                onClick={() => handleCloseModal()}
                className="w-10 h-10 hover:bg-slate-800 rounded-lg flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Pack Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="e.g., Lakers Championship Pack"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Game <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.gameId}
                    onChange={(e) => setFormData({ ...formData, gameId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                    required
                  >
                    <option value="">Select a game</option>
                    {games.map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Price (USD) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="0 for free, or 9.99 for paid"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {isPaid ? '💰 Stripe payment link will be auto-created' : '🎁 Free — direct download from R2'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">File Size</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.fileSizeValue}
                      onChange={(e) => setFormData({ ...formData, fileSizeValue: e.target.value })}
                      className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                      placeholder="Auto-filled on upload"
                    />
                    <select
                      value={formData.fileSizeUnit}
                      onChange={(e) => setFormData({ ...formData, fileSizeUnit: e.target.value })}
                      className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                    >
                      <option value="KB">KB</option>
                      <option value="MB">MB</option>
                      <option value="GB">GB</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-orange-500 transition-colors h-24 resize-none"
                  placeholder="Describe what's included in this skin pack..."
                />
              </div>

              {/* Mod File Upload — Direct to R2 */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">
                  Mod File <span className="text-red-400">*</span>
                </label>

                {modFileUploaded && modFile ? (
                  <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/30 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Cloud className="w-6 h-6 text-green-400" />
                      <div>
                        <div className="text-sm font-medium text-green-300">{modFile.name}</div>
                        <div className="text-xs text-gray-400">
                          {formatFileSize(modFile.size)} — Uploaded to R2
                        </div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setModFile(null);
                        setModFileR2Key(null);
                        setModFilePublicUrl(null);
                        setModFileUploaded(false);
                      }}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                ) : modFileUploaded && !modFile && modFilePublicUrl ? (
                  /* Editing existing pack with existing R2 file */
                  <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/30 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Cloud className="w-6 h-6 text-blue-400" />
                      <div>
                        <div className="text-sm font-medium text-blue-300">Existing file on R2</div>
                        <div className="text-xs text-gray-400 truncate max-w-md">{modFilePublicUrl}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => document.getElementById('mod-file-upload')?.click()}
                      className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    >
                      Replace
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => document.getElementById('mod-file-upload')?.click()}
                    disabled={isUploadingModFile}
                    className="w-full px-4 py-10 border-2 border-dashed border-slate-700 hover:border-orange-500 rounded-lg transition-colors flex flex-col items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Cloud className="w-10 h-10 text-gray-400 group-hover:text-orange-400 transition-colors" />
                    <div className="text-center">
                      <span className="text-gray-400 group-hover:text-orange-400 transition-colors block">
                        {isUploadingModFile ? 'Uploading to R2...' : 'Drop your mod file here'}
                      </span>
                      <span className="text-xs text-gray-500 mt-1 block">
                        .zip files up to 500MB — uploads directly to Cloudflare R2
                      </span>
                    </div>
                  </button>
                )}

                <input
                  type="file"
                  id="mod-file-upload"
                  accept=".zip,.rar,.7z"
                  onChange={handleModFileSelect}
                  className="hidden"
                  disabled={isUploadingModFile}
                />

                {/* Upload Progress */}
                {isUploadingModFile && (
                  <div className="mt-4">
                    <UploadProgress
                      fileName={modFile?.name || 'mod-file.zip'}
                      progress={modFileProgress}
                      status={modFileProgress >= 100 ? 'processing' : 'uploading'}
                    />
                  </div>
                )}
              </div>

              {/* Image Upload Section */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Gallery Images</label>

                {uploadedImages.length > 0 && (
                  <p className="text-xs text-gray-500 mb-2">Drag images to reorder. First image becomes the thumbnail.</p>
                )}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {uploadedImages.map((image, index) => (
                    <div
                      key={`${index}-${image.slice(-20)}`}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={handleDrop}
                      className="relative aspect-video rounded-lg overflow-hidden bg-slate-800 border border-slate-700 cursor-grab active:cursor-grabbing group"
                    >
                      <img src={image} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                      {index === 0 && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded">
                          THUMBNAIL
                        </span>
                      )}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/70 px-2 py-1 rounded flex items-center gap-1">
                          <GripVertical className="w-3 h-3 text-white" />
                          <span className="text-[10px] text-white">Drag</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  disabled={isUploadingImages}
                  className="w-full px-4 py-6 border-2 border-dashed border-slate-700 hover:border-orange-500 rounded-lg transition-colors flex flex-col items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ImageIcon className="w-6 h-6 text-gray-400 group-hover:text-orange-400 transition-colors" />
                  <span className="text-sm text-gray-400 group-hover:text-orange-400 transition-colors">
                    {isUploadingImages ? 'Uploading...' : 'Upload gallery images'}
                  </span>
                </button>
                <input
                  type="file"
                  id="image-upload"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploadingImages}
                />

                {Object.keys(imageUploadProgress).length > 0 && (
                  <div className="mt-4 space-y-2">
                    {Object.entries(imageUploadProgress).map(([key, progress]) => (
                      <UploadProgress
                        key={key}
                        fileName={key.split('-')[0]}
                        progress={progress}
                        status={progress === 100 ? 'complete' : 'uploading'}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Price indicator */}
              <div className={`mb-6 p-4 rounded-lg border ${isPaid
                ? 'bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20'
                : 'bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isPaid ? 'bg-purple-400' : 'bg-green-400'}`}></div>
                  <span className={`text-sm font-medium ${isPaid ? 'text-purple-400' : 'text-green-400'}`}>
                    {isPaid
                      ? `Paid Mod — $${formData.price} • Stripe product & payment link will be created automatically`
                      : 'Free Mod — Users download directly from R2, no payment needed'
                    }
                  </span>
                </div>
              </div>

              {/* Featured Checkbox */}
              <div className="mb-6 p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/10 border border-orange-500/20 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-5 h-5 bg-slate-800 border-2 border-orange-500/50 rounded cursor-pointer accent-orange-500"
                  />
                  <div>
                    <div className="text-orange-400 group-hover:text-orange-300 transition-colors">
                      Add to Hero Slider
                    </div>
                    <div className="text-xs text-gray-400">
                      Display this skin pack in the homepage carousel
                    </div>
                  </div>
                </label>
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingModFile}
                  className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{submitStep || 'Processing...'}</span>
                    </>
                  ) : (
                    <span>{editingSkinPack ? 'Update Skin Pack' : 'Create Skin Pack'}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleCloseModal()}
                  disabled={isSubmitting}
                  className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        title="Delete Skin Pack"
        message="Are you sure you want to delete this skin pack? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        isOpen={showDeleteConfirm}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeleteTargetId(null);
        }}
        isLoading={isDeleting}
      />
    </>
  );
}
