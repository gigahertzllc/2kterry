import { SkinPack } from '../types';
import { useState, useEffect } from 'react';
import { Download, Star, ArrowRight, ChevronLeft, ChevronRight, Sparkles, TrendingUp } from 'lucide-react';

interface HomePageProps {
  latestSkins: SkinPack[];
  featuredSkins: SkinPack[];
  onNavigate: (page: string, skinId?: string) => void;
}

export function HomePage({ latestSkins, featuredSkins, onNavigate }: HomePageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Use featured skins if available, otherwise use latest skins for hero
  const heroSlides = featuredSkins.length > 0 ? featuredSkins : latestSkins.slice(0, 3);

  // Auto-advance slides
  useEffect(() => {
    if (heroSlides.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Slider */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        {heroSlides.length > 0 ? (
          <>
            {/* Slider Background */}
            {heroSlides.map((skin, index) => (
              <div
                key={skin.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${skin.images[0] || skin.thumbnail})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/70 to-slate-950"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80"></div>
                </div>
              </div>
            ))}

            {/* Slider Content - Enhanced Layout */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left: Text Content */}
                {heroSlides.map((skin, index) => (
                  <div
                    key={`content-${skin.id}`}
                    className={`transition-all duration-1000 ${
                      index === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 absolute -translate-x-8 pointer-events-none'
                    }`}
                  >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full mb-6">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-purple-300">Featured Skin Pack</span>
                    </div>
                    
                    <h1 className="mb-4 text-5xl lg:text-6xl bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent leading-tight">
                      {skin.name}
                    </h1>
                    
                    <div className="flex items-center gap-3 mb-6">
                      <span className="px-4 py-2 bg-slate-900/80 backdrop-blur border border-purple-500/20 rounded-lg text-purple-400">
                        {skin.gameName}
                      </span>
                      <span className="px-4 py-2 bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-lg text-gray-400">
                        {skin.fileSize}
                      </span>
                    </div>

                    <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-xl">
                      {skin.description || 'Transform your gaming experience with this exclusive, professionally crafted skin pack featuring stunning visuals and attention to detail.'}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-6 mb-8 text-sm">
                      <div className="flex items-center gap-2">
                        <Download className="w-5 h-5 text-purple-400" />
                        <span className="text-gray-400">{skin.downloads.toLocaleString()} downloads</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-gray-400">{skin.rating} rating</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        <span className="text-gray-400">Trending</span>
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => onNavigate('skin', skin.id)}
                        className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-3 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                      >
                        <span className="text-lg">Get Now</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                      
                      <div className="flex items-center gap-3 px-6 py-4 bg-slate-900/90 backdrop-blur border border-purple-500/20 rounded-xl">
                        <span className="text-sm text-gray-400">Only</span>
                        <span className="text-3xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          ${skin.price}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Right: Preview Image */}
                {heroSlides.map((skin, index) => (
                  <div
                    key={`preview-${skin.id}`}
                    className={`hidden lg:block transition-all duration-1000 ${
                      index === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 absolute translate-x-8 pointer-events-none'
                    }`}
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-3xl opacity-20"></div>
                      <img
                        src={skin.images[0] || skin.thumbnail}
                        alt={skin.name}
                        className="relative rounded-2xl border border-purple-500/20 shadow-2xl w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Slider Controls */}
            {heroSlides.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-slate-900/80 hover:bg-purple-500/20 backdrop-blur border border-purple-500/20 rounded-full flex items-center justify-center transition-all hover:scale-110"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-slate-900/80 hover:bg-purple-500/20 backdrop-blur border border-purple-500/20 rounded-full flex items-center justify-center transition-all hover:scale-110"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Slide Indicators */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-slate-900/80 backdrop-blur px-4 py-3 rounded-full border border-purple-500/20">
                  {heroSlides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentSlide 
                          ? 'w-8 bg-gradient-to-r from-purple-500 to-pink-500' 
                          : 'w-2 bg-slate-600 hover:bg-slate-500'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1664092815283-19c6196f5319?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBuZW9uJTIwbGlnaHRzfGVufDF8fHx8MTc2NTI0NDQyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950"></div>
            </div>

            <div className="relative z-10 text-center px-6 max-w-5xl">
              <h1 className="mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Welcome to 2K Terry's Mods
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Enhance Your 2K Experience with premium cyberfaces, jerseys, courts, and roster mods
              </p>
              <button
                onClick={() => onNavigate('shop')}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2 mx-auto group"
              >
                <span>Browse Mods</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </>
        )}

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent"></div>
      </div>

      {/* Latest Skins Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="mb-2">Latest Mods</h2>
            <p className="text-gray-400">New mods just dropped</p>
          </div>
          <button
            onClick={() => onNavigate('shop')}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all flex items-center gap-2"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestSkins.map((skin) => (
            <button
              key={skin.id}
              onClick={() => onNavigate('skin', skin.id)}
              className="group relative overflow-hidden rounded-2xl bg-slate-900 hover:scale-[1.02] transition-all duration-300"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={skin.thumbnail}
                  alt={skin.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="text-xs text-purple-400 mb-2">{skin.gameName}</div>
                <h3 className="mb-3 text-left">{skin.name}</h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      <span>{skin.downloads.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{skin.rating}</span>
                    </div>
                  </div>
                  <div className="text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    ${skin.price}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-b from-purple-500/10 to-transparent py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-slate-900/50 backdrop-blur border border-purple-500/20">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8" />
              </div>
              <h4 className="mb-2">Instant Download</h4>
              <p className="text-gray-400">Get your skin packs immediately after purchase</p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-slate-900/50 backdrop-blur border border-purple-500/20">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8" />
              </div>
              <h4 className="mb-2">HD Cyberfaces</h4>
              <p className="text-gray-400">Realistic player faces crafted with attention to detail</p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-slate-900/50 backdrop-blur border border-purple-500/20">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="w-8 h-8" />
              </div>
              <h4 className="mb-2">Easy Installation</h4>
              <p className="text-gray-400">Simple setup guides included with every pack</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}