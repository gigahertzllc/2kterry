import { useState } from 'react';
import { ArrowLeft, Download, Star, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { SkinPack } from '../types';

interface SkinDetailPageProps {
  skin: SkinPack;
  onNavigate: (page: string) => void;
}

export function SkinDetailPage({ skin, onNavigate }: SkinDetailPageProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % skin.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + skin.images.length) % skin.images.length);
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
          <span>Back to Shop</span>
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
                      ? 'border-purple-500 scale-105'
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
                <div className="text-sm text-purple-400 mb-2">{skin.gameName}</div>
                <h2 className="mb-4">{skin.name}</h2>
                <p className="text-gray-400 mb-6">{skin.description}</p>

                <div className="flex items-center gap-6 mb-6 text-gray-400">
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    <span>{skin.downloads.toLocaleString()} downloads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span>{skin.rating} rating</span>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    ${skin.price}
                  </span>
                  <span className="text-gray-400">USD</span>
                </div>

                <button className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-3 group mb-4">
                  <ShoppingCart className="w-5 h-5" />
                  <span>Add to Cart</span>
                </button>

                <button className="w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all flex items-center justify-center gap-3">
                  <Download className="w-5 h-5" />
                  <span>Download Preview</span>
                </button>
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