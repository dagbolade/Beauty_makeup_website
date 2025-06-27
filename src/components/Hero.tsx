import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { supabase} from '../lib/supabase';
import { Link } from 'react-router-dom';

interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
}

// Fallback slides in case no database images are available
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
    title: "Flawless Makeup",
    subtitle: "Your Special Day, Your Perfect Look"
  },
  {
    id: 'fallback-3',
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=2070&q=80",
    title: "Professional Photoshoots", 
    subtitle: "Capture Your Beautiful Moments"
  },
  {
    id: 'fallback-4',
    image: "https://images.unsplash.com/photo-1499887142886-791eca5918cd?auto=format&fit=crop&w=2070&q=80",
    title: "Our Passion for Beauty",
    subtitle: "Transforming You into Your Best Self"
  },
];

export default function Hero() {
  const [slides, setSlides] = useState<HeroSlide[]>(fallbackSlides);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch hero images from database
  useEffect(() => {
    const fetchHeroImages = async () => {
      try {
        const { data, error } = await supabase
          .from('portfolio_images')
          .select('*')
          .eq('is_featured', true)
          .order('display_order', { ascending: true })
          .limit(6); // Get up to 6 featured images for the carousel

        if (error) throw error;

        if (data && data.length > 0) {
          // Transform database images to hero slides
          const heroSlides: HeroSlide[] = data.map((img, index) => {
            // Database already stores full URLs, so use them directly
            const imageUrl = img.image_url;
            
            console.log('Processing image:', img.image_url);
            console.log('Using direct URL:', imageUrl);
            
            return {
              id: img.id,
              image: imageUrl,
              title: index === 0 ? "Welcome to Yemisi Artistry" : img.title,
              subtitle: index === 0 ? "Where Beauty Meets Perfection" : 
                       img.description || "Professional Makeup Artistry"
            };
          });

          setSlides(heroSlides);
        } else {
          // No featured images found, use fallback
          console.log('No featured images found, using fallback slides');
          setSlides(fallbackSlides);
        }
      } catch (error) {
        console.error('Error fetching hero images:', error);
        // Use fallback slides on error
        setSlides(fallbackSlides);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHeroImages();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] xl:h-[90vh] bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full hero-container relative">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        pagination={{ 
          clickable: true,
          dynamicBullets: true,
          bulletActiveClass: 'swiper-pagination-bullet-active',
          bulletClass: 'swiper-pagination-bullet'
        }}
        navigation={{
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        }}
        autoplay={{ 
          delay: 5000, 
          disableOnInteraction: false,
          pauseOnMouseEnter: true 
        }}
        loop={slides.length > 1}
        speed={1000}
        className="w-full h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] xl:h-[90vh]"
        style={{
          '--swiper-pagination-color': '#ec4899',
          '--swiper-pagination-bullet-inactive-color': '#ffffff',
          '--swiper-pagination-bullet-inactive-opacity': '0.5',
          '--swiper-navigation-color': '#ec4899',
        } as React.CSSProperties}
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id} className="relative">
            {/* Image container with responsive height */}
            <div className="relative w-full h-full">
              {/* Background image */}
              <img
                src={slide.image}
                onError={(e) => {
                  console.error('Image failed to load:', slide.image);
                  // Fallback to a default image if image fails to load
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=2070&q=80';
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', slide.image);
                }}
                className="absolute inset-0 w-full h-full object-cover"
                alt={slide.title}
                loading="lazy"
              />
              
              {/* Gradient overlays for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              
              {/* Content container */}
              <div className="absolute inset-0 flex items-end">
                <div className="w-full p-4 sm:p-6 md:p-8 lg:p-10 text-white z-10">
                  <div className="container mx-auto max-w-7xl">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-2 sm:mb-3 md:mb-4 leading-tight">
                      {slide.title}
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-2 sm:mb-3 md:mb-4 text-pink-200 leading-relaxed">
                      {slide.subtitle}
                    </p>
                    <p className="text-sm sm:text-base md:text-lg mb-4 sm:mb-6 md:mb-8 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl opacity-90 leading-relaxed">
                      Specialising in flawless, long-lasting makeup for all occasions, ensuring you look and feel your best.
                    </p>
                    <Link
                      to="/enquiry"
                      className="inline-block bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 sm:py-3 sm:px-6 md:py-4 md:px-8 rounded-lg transition-all duration-300 text-sm sm:text-base md:text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Enquire Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
        
        {/* Custom navigation buttons */}
        {slides.length > 1 && (
          <>
            <div className="swiper-button-prev !w-12 !h-12 !mt-0 !top-1/2 !left-4 !transform !-translate-y-1/2 !bg-white/20 !backdrop-blur-sm !rounded-full !text-white hover:!bg-white/30 !transition-all !duration-300"></div>
            <div className="swiper-button-next !w-12 !h-12 !mt-0 !top-1/2 !right-4 !transform !-translate-y-1/2 !bg-white/20 !backdrop-blur-sm !rounded-full !text-white hover:!bg-white/30 !transition-all !duration-300"></div>
          </>
        )}
      </Swiper>
      
      {/* Pink accent bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-pink-500 z-20" />
    </div>
  );
}