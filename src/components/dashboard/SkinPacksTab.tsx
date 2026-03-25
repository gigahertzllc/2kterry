import { useState } from 'react';
import { Upload, Plus, X, Image as ImageIcon, Package, Trash2, Pencil } from 'lucide-react';
import { Game, SkinPack } from '../../types';
import * as api from '../../utils/api';

interface SkinPacksTabProps {
  games: Game[];
  skinPacks: SkinPack[];
  onAddSkinPack: (skinPack: Omit<SkinPack, 'id'>) => void;
  onUpdateSkinPack: (id: string, skinPack: Omit<SkinPack, 'id'>) => void;
  onDeleteSkinPack: (id: string) => void;
}

export function SkinPacksTab({ games, skinPacks, onAddSkinPack, onUpdateSkinPack, onDeleteSkinPack }: SkinPacksTabProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingSkinPack, setEditingSkinPack] = useState<SkinPack | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    gameId: '',
    fileSizeValue: '',
    fileSizeUnit: 'MB',
    featured: false,
    downloadUrl: '',
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedImagePaths, setUploadedImagePaths] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);

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
      downloadUrl: (skin as any).downloadUrl || '',
    });
    setUploadedImages(skin.images);
    setUploadedImagePaths(skin.images);
    setShowUploadModal(true);
  };

  const handleCloseModal = () => {
    setShowUploadModal(false);
    setEditingSkinPack(null);
    setFormData({ name: '', description: '', price: '', gameId: '', fileSizeValue: '', fileSizeUnit: 'MB', featured: false, downloadUrl: '' });
    setUploadedImages([]);
    setUploadedImagePaths([]);
    setUploadedFile(null);
    setUploadedFilePath(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.gameId || !formData.price) {
      alert('Please fill in all required fields');
      return;
    }

    const game = games.find(g => g.id === formData.gameId);
    const imagesToStore = uploadedImagePaths.length > 0 ? uploadedImagePaths : [game?.image || ''];
    
    const newSkinPack: Omit<SkinPack, 'id'> = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      gameId: formData.gameId,
      gameName: game?.name || '',
      images: imagesToStore,
      thumbnail: imagesToStore[0] || game?.image || '',
      downloads: 0,
      rating: 5.0,
      dateAdded: new Date().toISOString().split('T')[0],
      fileSize: `${formData.fileSizeValue} ${formData.fileSizeUnit}`,
      featured: formData.featured,
      downloadUrl: formData.downloadUrl || undefined,
    };

    if (editingSkinPack) {
      onUpdateSkinPack(editingSkinPack.id, newSkinPack);
    } else {
      onAddSkinPack(newSkinPack);
    }

    handleCloseModal();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploadingImages(true);

    const files = Array.from(e.target.files);

    try {
      const blobUrls = files.map(file => URL.createObjectURL(file));
      const uploadPromises = files.map(async (file) => {
        try {
          return await api.uploadImage(file);
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          // If upload fails, use blob URL as fallback
          return { path: URL.createObjectURL(file) };
        }
      });

      const uploadResults = await Promise.all(uploadPromises);
      const paths = uploadResults.map(result => result.path);

      setUploadedImages(prev => [...prev, ...blobUrls]);
      setUploadedImagePaths(prev => [...prev, ...paths]);
      setIsUploadingImages(false);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert(`Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsUploadingImages(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setUploadedImagePaths(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploadingFile(true);

    const file = e.target.files[0];
    
    try {
      const uploadResult = await api.uploadSkinPackFile(file);
      const path = uploadResult.path;
      
      setUploadedFilePath(path);
      setUploadedFile(file.name);
      setIsUploadingFile(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
      setIsUploadingFile(false);
    }
  };

  return (
    <>
      {/* Header with Create Button */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl mb-2">Skin Pack Management</h2>
          <p className="text-gray-400">Create, edit, and manage your skin packs</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-3"
        >
          <Plus className="w-5 h-5" />
          <span>Create New Pack</span>
        </button>
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

        <div className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-gray-400">Total Revenue</span>
          </div>
          <div className="text-3xl">
            ${(skinPacks.reduce((sum, skin) => sum + (skin.price * skin.downloads), 0) / 1000).toFixed(1)}k
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
                <th className="px-6 py-4 text-left text-sm text-gray-400">Rating</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Date</th>
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
                  <td className="px-6 py-4">${skin.price}</td>
                  <td className="px-6 py-4">{skin.downloads.toLocaleString()}</td>
                  <td className="px-6 py-4">{skin.rating}</td>
                  <td className="px-6 py-4 text-gray-400">{new Date(skin.dateAdded).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEditModal(skin)}
                        className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors group"
                      >
                        <Pencil className="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
                      </button>
                      <button
                        onClick={() => onDeleteSkinPack(skin.id)}
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
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="14.99"
                    required
                  />
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
                      placeholder="235"
                    />
                    <select
                      value={formData.fileSizeUnit}
                      onChange={(e) => setFormData({ ...formData, fileSizeUnit: e.target.value })}
                      className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                    >
                      <option value="KB">KB</option>
                      <option value="MB">MB</option>
                      <option value="GB">GB</option>
                      <option value="TB">TB</option>
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

              {/* Image Upload Section */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Gallery Images</label>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-slate-800">
                      <img src={image} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className="w-full px-4 py-8 border-2 border-dashed border-slate-700 hover:border-orange-500 rounded-lg transition-colors flex flex-col items-center justify-center gap-2 group"
                >
                  <ImageIcon className="w-8 h-8 text-gray-400 group-hover:text-orange-400 transition-colors" />
                  <span className="text-gray-400 group-hover:text-orange-400 transition-colors">
                    Click to upload images
                  </span>
                  <span className="text-xs text-gray-500">Accepts .jpg, .png, .gif</span>
                </button>
                <input
                  type="file"
                  id="image-upload"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {isUploadingImages && <p className="text-sm text-gray-400 mt-2">Uploading...</p>}
              </div>

              {/* Download URL Section */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Download URL (Optional)</label>
                <p className="text-xs text-gray-500 mb-2">Provide an external download link (Google Drive, Mega, etc.)</p>
                <input
                  type="text"
                  value={formData.downloadUrl}
                  onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-orange-500 transition-colors mb-6"
                  placeholder="https://drive.google.com/file/d/..."
                />
              </div>

              {/* File Upload Section (Secondary Option) */}
              <details className="mb-6">
                <summary className="text-sm text-gray-400 cursor-pointer hover:text-orange-400 transition-colors">Or upload directly (max 50MB)</summary>
                <div className="mt-4">
                  {uploadedFile && (
                    <div className="mb-4 p-4 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-orange-400" />
                        <div>
                          <div className="text-sm">{uploadedFile}</div>
                          <div className="text-xs text-gray-400">Uploaded successfully</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setUploadedFile(null); setUploadedFilePath(null); }}
                        className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="w-full px-4 py-8 border-2 border-dashed border-slate-700 hover:border-orange-500 rounded-lg transition-colors flex flex-col items-center justify-center gap-2 group"
                  >
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-orange-400 transition-colors" />
                    <span className="text-gray-400 group-hover:text-orange-400 transition-colors">
                      Click to upload skin pack file
                    </span>
                    <span className="text-xs text-gray-500">Accepts .zip files</span>
                  </button>
                  <input
                    type="file"
                    id="file-upload"
                    accept="application/zip"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {isUploadingFile && <p className="text-sm text-gray-400 mt-2">Uploading...</p>}
                </div>
              </details>

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
                      Display this skin pack in the full-screen hero carousel on the homepage
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
                >
                  {editingSkinPack ? 'Update Skin Pack' : 'Create Skin Pack'}
                </button>
                <button
                  type="button"
                  onClick={() => handleCloseModal()}
                  className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
