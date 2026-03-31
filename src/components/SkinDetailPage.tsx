import { useState } from 'react';
import { ArrowLeft, Download, Star, ShoppingCart, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { SkinPack } from '../types';
import { toast } from 'sonner';
import { trackDownload } from '../utils/api';
import { useCart } from '../context/CartContext';

interface SkinDetailPageProps {
  skin: SkinPack;
  onNavigate: (page: string) => void;
  onDownloadTracked?: (skinPackId: string, newCount: number) => void;
}

export function SkinDetailPage({ skin, onNavigate, onDownloadTracked }: SkinDetailPageProps) {
  const { addItem, isInCart } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [downloadCount, setDownloadCount] = useState(skin.downloads);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % skin.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + skin.images.length) % skin.images.length);
  };

  const handleCheckout = async () => {
    // Free mods: Direct download + track
    if (skin.price === 0) {
      if (skin.downloadUrl) {
        window.open(skin.downloadUrl, '_blank');
        // Track the download (non-blocking)
        const result = await trackDownload(skin.id);
        if (result.success) {
          setDownloadCount(result.downloads);
          onDownloadTracked?.(skin.id, result.downloads);
        }
      } else {
        toast.info('Download link coming soon!');
      }
      return;
    }

    // Paid mods: Stripe Payment Link
    if (skin.stripePaymentLink) {
      window.open(skin.stripePaymentLink, '_blank');
      // Note: paid downloads are tracked by the Stripe webhook on payment completion.
      // No client-side tracking needed here — the webhook handles it.
    } else {
      toast.info('This mod will be available for purchase soon!');
    }
  };

  return (
    <div className="min-h-screen pt-20 relative">
      {/* Subtle Texture Background */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      ></div>

      {/* Content */}
      <div className="relative z-10">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <button
          onClick={() => onNavigate('shop')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Mods</span>
        </button>
      </div>

      {/* Main Gallery */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image Gallery */}
          <div className="lg:col-span-2">
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-slate-900 group">
              <img
                src={skin.images[currentImageIndex]}
                alt={`${skin.name} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setIsFullscreen(true)}
              />

              {/* Navigation Arrows */}
              {skin.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-slate-950/80 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-slate-950/80 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              <div className="absolute bottom-4 right-4 px-3 py-1 bg-slate-950/80 backdrop-blur rounded-full text-sm">
                {currentImageIndex + 1} / {skin.images.length}
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              {skin.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                    currentImageIndex === index
                      ? 'border-orange-500 scale-105'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Details Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div>
                <div className="text-sm text-orange-400 mb-2">{skin.gameName}</div>
                <h2 className="mb-4">{skin.name}</h2>
                <p className="text-gray-400 mb-6">{skin.description}</p>

                <div className="flex items-center gap-6 mb-6 text-gray-400">
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    <span>{downloadCount.toLocaleString()} downloads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span>{skin.rating} rating</span>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
                    {skin.price === 0 ? 'FREE' : `$${skin.price}`}
                  </span>
                  {skin.price !== 0 && <span className="text-gray-400">USD</span>}
                </div>

                {skin.price === 0 ? (
                  <button
                    onClick={handleCheckout}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-3 group mb-4"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download Free</span>
                  </button>
                ) : (
                  <div className="flex gap-3 mb-4">
                    <button
                      onClick={() => {
                        if (!isInCart(skin.id)) {
                          addItem(skin);
                          toast.success(`${skin.name} added to cart`);
                        }
                      }}
                      className={`flex-1 py-4 rounded-lg flex items-center justify-center gap-3 transition-all ${
                        isInCart(skin.id)
                          ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                          : 'bg-slate-800 border border-slate-700 text-white hover:border-orange-500/30 hover:bg-slate-700'
                      }`}
                    >
                      {isInCart(skin.id) ? (
                        <>
                          <Check className="w-5 h-5" />
                          <span>In Cart</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCheckout}
                      className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-3"
                    >
                      <span>Buy Now — ${skin.price}</span>
                    </button>
                  </div>
                )}

              </div>

              <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
                <h4 className="mb-4">Pack Details</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">File Size</span>
                    <span>{skin.fileSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date Added</span>
                    <span>{new Date(skin.dateAdded).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Format</span>
                    <span>ZIP Archive</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Installation</span>
                    <span>Guide Included</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 w-12 h-12 bg-slate-950/80 backdrop-blur rounded-full flex items-center justify-center hover:scale-110 transition-all z-10"
          >
            <span className="text-2xl">&times;</span>
          </button>

          <img
            src={skin.images[currentImageIndex]}
            alt={skin.name}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {skin.images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-6 w-16 h-16 bg-slate-950/80 backdrop-blur rounded-full flex items-center justify-center hover:scale-110 transition-all"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-6 w-16 h-16 bg-slate-950/80 backdrop-blur rounded-full flex items-center justify-center hover:scale-110 transition-all"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
}