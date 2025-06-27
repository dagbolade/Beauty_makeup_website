import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
}

// Beautiful fallback slides
const fallbackSlides: HeroSlide[] = [
  {
    id: 'fallback-1',
    image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=2070&q=80",
    title: "Welcome to Yemisi Artistry",
    subtitle: "Where Beauty Meets Perfection"
  },
  {
    id: 'fallback-2',
    image: "https://images.unsplash.com/photo-1594736797933-d0ac2019f1ec?auto=format&fit=crop&w=2070&q=80", 
    title: "Bridal Perfection",
    subtitle: "Your Dream Wedding Look"
  },
  {
    id: 'fallback-3',
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=2070&q=80",
    title: "Professional Artistry", 
    subtitle: "Transforming Beauty Into Art"
  },
  {
    id: 'fallback-4',
    image: "https://images.unsplash.com/photo-1499887142886-791eca5918cd?auto=format&fit=crop&w=2070&q=80",
    title: "Glamorous Events",
    subtitle: "Make Every Moment Unforgettable"
  }
];

export default function Hero() {
  const [slides, setSlides] = useState<HeroSlide[]>(fallbackSlides);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  console.log('New Hero component rendering...');

  // Fetch featured images from database
  useEffect(() => {
    const fetchHeroImages = async () => {
      try {
        console.log('Fetching featured images...');
        
        const { data, error } = await supabase
          .from('portfolio_images')
          .select('*')
          .eq('is_featured', true)
          .order('display_order', { ascending: true })
          .limit(8);

        if (error) {
          console.error('Database error:', error);
          throw error;
        }

        console.log('Fetched data:', data);

        if (data && data.length > 0) {
          const heroSlides: HeroSlide[] = data.map((img, index) => ({
            id: img.id,
            image: img.image_url,
            title: index === 0 ? "Welcome to Yemisi Artistry" : img.title,
            subtitle: index === 0 ? "Where Beauty Meets Perfection" : 
                     img.description || "Professional Makeup Artistry"
          }));

          console.log('Setting hero slides:', heroSlides);
          setSlides(heroSlides);
        }
      } catch (error) {
        console.error('Error fetching images:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHeroImages();
  }, []);

  // Auto-advance slides
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length, isPaused]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-[70vh] bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500 mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600 font-medium">Preparing your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-[70vh] lg:h-[85vh] xl:h-[90vh] overflow-hidden group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides Container */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentSlide 
                ? 'opacity-100 scale-100' 
                : 'opacity-0 scale-105'
            }`}
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover object-center"
                loading={index === 0 ? "eager" : "lazy"}
                onError={(e) => {
                  console.error('Image failed to load:', slide.image);
                  e.currentTarget.src = fallbackSlides[0].image;
                }}
                onLoad={() => console.log(`Image loaded: ${slide.title}`)}
              />
              {/* Enhanced gradient overlays for desktop */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-black/20 lg:from-black/60 lg:via-black/20 lg:to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent lg:from-black/80 lg:via-black/20 lg:to-transparent"></div>
            </div>

            {/* Content - Positioned at bottom left */}
            <div className="relative z-10 flex items-end h-full">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8 lg:pb-12">
                <div className="max-w-2xl lg:max-w-3xl">
                  <div className="space-y-4 lg:space-y-6 text-white">
                    {/* Title */}
                    <h1 className="text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                      <span className="block">{slide.title}</span>
                    </h1>
                    
                    {/* Subtitle */}
                    <p className="text-lg sm:text-xl lg:text-3xl xl:text-4xl text-pink-200 font-light leading-relaxed">
                      {slide.subtitle}
                    </p>
                    
                    {/* Description */}
                    <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-gray-200 max-w-xl lg:max-w-3xl leading-relaxed">
                      Specialising in flawless, long-lasting makeup for all occasions. 
                      From bridal elegance to glamorous events, we bring your vision to life.
                    </p>
                    
                    {/* Single CTA Button - View Portfolio */}
                    <div className="pt-2 lg:pt-4">
                      <Link
                        to="/portfolio"
                        className="inline-flex items-center justify-center px-8 py-4 lg:px-10 lg:py-5 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-lg lg:rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-base lg:text-lg xl:text-xl"
                      >
                        View Portfolio
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 lg:w-16 lg:h-16 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 opacity-0 group-hover:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} className="lg:w-8 lg:h-8" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 lg:w-16 lg:h-16 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 opacity-0 group-hover:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRight size={24} className="lg:w-8 lg:h-8" />
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 lg:bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 lg:w-4 lg:h-4 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-pink-500 scale-125'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {slides.length > 1 && !isPaused && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-black/20 z-20">
          <div 
            className="h-full bg-pink-500 transition-all duration-100 ease-linear"
            style={{ 
              width: `${((currentSlide + 1) / slides.length) * 100}%` 
            }}
          />
        </div>
      )}

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-pink-500/20 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl"></div>
    </div>
  );
}