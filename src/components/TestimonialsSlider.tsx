import { Testimonial } from '../types';
import { Star, Quote } from 'lucide-react';

interface TestimonialsSliderProps {
  testimonials: Testimonial[];
  heading?: string;
  subheading?: string;
}

export function TestimonialsSlider({ testimonials, heading = 'What Modders Are Saying', subheading = 'Join thousands of satisfied modders' }: TestimonialsSliderProps) {
  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating
            ? 'fill-orange-400 text-orange-400'
            : 'text-slate-600'
        }`}
      />
    ));
  };

  return (
    <div className="py-20 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-2">{heading}</h2>
          <p className="text-gray-400">{subheading}</p>
        </div>

        {/* Testimonials Slider Container */}
        <div className="relative overflow-hidden">
          <style>{`
            @keyframes marquee {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-100%);
              }
            }

            .testimonials-track {
              animation: marquee 40s linear infinite;
            }

            .testimonials-track:hover {
              animation-play-state: paused;
            }
          `}</style>

          <div className="flex gap-6 testimonials-track">
            {/* First set of testimonials */}
            {testimonials.map((testimonial) => (
              <div
                key={`${testimonial.id}-1`}
                className="min-w-[400px] md:min-w-[500px] flex-shrink-0 group"
              >
                <div className="relative h-full p-8 bg-slate-900 rounded-2xl border border-slate-800 hover:border-orange-500/50 transition-all duration-300">
                  {/* Quote icon */}
                  <div className="absolute top-6 right-6">
                    <Quote className="w-5 h-5 text-orange-500/30" />
                  </div>

                  {/* Content */}
                  <p className="text-gray-300 mb-6 leading-relaxed pr-8">
                    "{testimonial.content}"
                  </p>

                  {/* Rating */}
                  <div className="flex gap-1 mb-6">
                    {renderStars(testimonial.rating)}
                  </div>

                  {/* Author Info */}
                  <div className="flex items-center gap-3">
                    {testimonial.avatar && (
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.customerName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    {!testimonial.avatar && (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold">
                        {testimonial.customerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-white">
                        {testimonial.customerName}
                      </div>
                      {testimonial.gamertag && (
                        <div className="text-sm text-orange-400">
                          @{testimonial.gamertag}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Duplicate set for seamless loop */}
            {testimonials.map((testimonial) => (
              <div
                key={`${testimonial.id}-2`}
                className="min-w-[400px] md:min-w-[500px] flex-shrink-0 group"
              >
                <div className="relative h-full p-8 bg-slate-900 rounded-2xl border border-slate-800 hover:border-orange-500/50 transition-all duration-300">
                  {/* Quote icon */}
                  <div className="absolute top-6 right-6">
                    <Quote className="w-5 h-5 text-orange-500/30" />
                  </div>

                  {/* Content */}
                  <p className="text-gray-300 mb-6 leading-relaxed pr-8">
                    "{testimonial.content}"
                  </p>

                  {/* Rating */}
                  <div className="flex gap-1 mb-6">
                    {renderStars(testimonial.rating)}
                  </div>

                  {/* Author Info */}
                  <div className="flex items-center gap-3">
                    {testimonial.avatar && (
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.customerName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    {!testimonial.avatar && (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold">
                        {testimonial.customerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-white">
                        {testimonial.customerName}
                      </div>
                      {testimonial.gamertag && (
                        <div className="text-sm text-orange-400">
                          @{testimonial.gamertag}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gradient fade edges */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-950 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
}
