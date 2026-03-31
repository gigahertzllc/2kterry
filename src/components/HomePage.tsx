import { SkinPack, Testimonial, SiteContent } from '../types';
import { useState, useEffect } from 'react';
import { Download, Star, ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { TestimonialsSlider } from './TestimonialsSlider';

interface HomePageProps {
  siteContent: SiteContent;
  latestSkins: SkinPack[];
  featuredSkins: SkinPack[];
  testimonials: Testimonial[];
  onNavigate: (page: string, skinId?: string) => void;
}

export function HomePage({ siteContent, latestSkins, featuredSkins, testimonials, onNavigate }: HomePageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Slides: static welcome slide + one slide per featured pack
  const totalSlides = 1 + featuredSkins.length;

  // Auto-advance slides
  useEffect(() => {
    if (totalSlides <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 6000);
    return () => clearInterval(interval);
  }, [currentSlide, totalSlides]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Slider */}
      <div className="relative h-screen flex items-center overflow-hidden">

        {/* Slide 0: Static Welcome */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${currentSlide === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-[#0b1c23]" />
          <img
            src="/images/brand/hero.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center 15%' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/30 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950"></div>

          <div className="relative z-10 h-full flex items-center">
            <div className="text-left px-6 lg:px-16 max-w-3xl">
              <h1 className="mb-4 text-5xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
                {siteContent.heroHeading}
              </h1>
              <p className="text-xl lg:text-2xl text-gray-300 mb-8 max-w-lg">
                {siteContent.heroSubheading}
              </p>
              <button
                onClick={() => onNavigate('shop')}
                className="px-8 py-4 bg-orange-500 hover:bg-orange-600 rounded-lg transition-all flex items-center gap-2 group text-white font-semibold"
              >
                <span>{siteContent.heroCtaText}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic slides from featured packs */}
        {featuredSkins.map((skin, index) => {
          const slideIndex = index + 1; // offset by 1 for the welcome slide
          return (
            <div
              key={skin.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${currentSlide === slideIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              {/* Cover image */}
              <img
                src={skin.thumbnail}
                alt={skin.name}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>

              {/* Text overlay */}
              <div className="relative z-10 h-full flex items-end pb-32">
                <div className="text-left px-6 lg:px-16 max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full mb-4">
                    <Sparkles className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-300">
                      {skin.price === 0 ? 'FREE Download' : `$${skin.price}`}
                    </span>
                  </div>
                  <h1 className="mb-4 text-4xl lg:text-6xl font-bold text-white leading-tight tracking-tight uppercase">
                    {skin.name}
                  </h1>
                  <p className="text-lg text-gray-300 mb-6 max-w-lg">
                    {skin.description}
                  </p>
                  <button
                    onClick={() => onNavigate('skin', skin.id)}
                    className="px-8 py-4 bg-orange-500 hover:bg-orange-600 rounded-lg transition-all flex items-center gap-2 group text-white font-semibold"
                  >
                    <span>{skin.price === 0 ? 'Download Free' : 'View Pack'}</span>
                    <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Slider Controls — only show if more than 1 slide */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-slate-900/80 hover:bg-orange-500/20 backdrop-blur border border-orange-500/20 rounded-full flex items-center justify-center transition-all hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-slate-900/80 hover:bg-orange-500/20 backdrop-blur border border-orange-500/20 rounded-full flex items-center justify-center transition-all hover:scale-110"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-slate-900/80 backdrop-blur px-4 py-3 rounded-full border border-orange-500/20">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentSlide
                      ? 'w-8 bg-gradient-to-r from-orange-500 to-orange-400'
                      : 'w-2 bg-slate-600 hover:bg-slate-500'
                  }`}
                />
              ))}
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
                <div className="text-xs text-orange-400 mb-2">{skin.gameName}</div>
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
                  <div className="text-xl bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
                    {skin.price === 0 ? 'FREE' : `$${skin.price}`}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Testimonials Section */}
      <TestimonialsSlider
        heading={siteContent.testimonialsHeading}
        subheading={siteContent.testimonialsSubheading}
        testimonials={testimonials}
      />

      {/* Features Section */}
      <div className="bg-gradient-to-b from-orange-500/10 to-transparent py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-slate-900/50 backdrop-blur border border-orange-500/20">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8" />
              </div>
              <h4 className="mb-2">{siteContent.feature1Title}</h4>
              <p className="text-gray-400">{siteContent.feature1Description}</p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-slate-900/50 backdrop-blur border border-orange-500/20">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8" />
              </div>
              <h4 className="mb-2">{siteContent.feature2Title}</h4>
              <p className="text-gray-400">{siteContent.feature2Description}</p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-slate-900/50 backdrop-blur border border-orange-500/20">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="w-8 h-8" />
              </div>
              <h4 className="mb-2">{siteContent.feature3Title}</h4>
              <p className="text-gray-400">{siteContent.feature3Description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
