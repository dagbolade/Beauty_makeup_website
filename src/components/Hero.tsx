import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { getPublicImageUrl } from '../lib/supabase';
import { Link } from 'react-router-dom';

const slides = [
  {
    image: getPublicImageUrl('yemisi-artistry/oyin.JPG'),
    title: "Welcome to Yemisi Artistry",
    subtitle: "Where Beauty Meets Perfection"
  },
  {
    image: getPublicImageUrl('yemisi-artistry/makeup.PNG'),
    title: "Flawless Makeup",
    subtitle: "Your Special Day, Your Perfect Look"
  },
  {
    image: getPublicImageUrl('yemisi-artistry/kanyin1.JPG'),
    title: "Professional Photoshoots",
    subtitle: "Capture Your Beautiful Moments"
  },
  {
    image: getPublicImageUrl('yemisi-artistry/kanyin.PNG'),
    title: "Our Passion for Beauty",
    subtitle: "Transforming You into Your Best Self"
  },
];

export default function Hero() {
  return (
    <Swiper
      modules={[Autoplay, Pagination]}
      pagination={{ 
        clickable: true,
        bulletActiveClass: 'swiper-pagination-bullet-active bg-pink-500' 
      }}
      autoplay={{ delay: 5000, disableOnInteraction: false }}
      loop={true}
      className="h-screen w-full"
    >
      {slides.map((slide, index) => (
        <SwiperSlide key={index} className="relative h-full">
          {/* Full size background image */}
          <div className="absolute inset-0 bg-black">
            <img
              src={slide.image}
              onError={(e) => e.currentTarget.src = '/fallback.jpg'}
              className="w-full h-full object-cover object-center"
              alt={slide.title}
            />
          </div>
          
          {/* Gradient overlay with pink tint for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
          
          {/* Pink accent bar */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-pink-500" />
          
          {/* Content positioned at the bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-6 py-10 sm:py-16 text-white z-10">
            <div className="container mx-auto">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-2 drop-shadow-lg">
                {slide.title}
              </h1>
              <p className="text-xl sm:text-2xl mb-4 drop-shadow-lg text-pink-200">
                {slide.subtitle}
              </p>
              <p className="max-w-md text-sm sm:text-base mb-6 drop-shadow-lg">
                Specialising in flawless, long-lasting makeup for all occasions, ensuring you look and feel your best.
              </p>
              <Link
                to="/enquiry"
                className="inline-block bg-pink-500 text-white font-semibold py-3 px-6 rounded hover:bg-pink-600 transition duration-300"
              >
                Enquire Now
              </Link>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}