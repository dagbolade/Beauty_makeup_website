import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { getPublicImageUrl } from '../lib/supabase';

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
  }
];

export default function Hero() {
  return (
    <div className="h-screen">
      <Swiper
        modules={[Autoplay, Pagination]}
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000 }}
        loop={true}
        className="h-full"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <div 
              className="relative h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <img 
                src={slide.image} 
                onError={(e) => e.currentTarget.src = '/fallback.jpg'} 
                className="hidden" 
                alt={slide.title} 
              />
              <div className="absolute inset-0 bg-black bg-opacity-40" />
              <div className="absolute inset-0 flex items-center justify-center text-center">
                <div className="text-white max-w-3xl px-4">
                  <h1 className="text-5xl md:text-6xl font-bold mb-4">{slide.title}</h1>
                  <p className="text-xl md:text-2xl mb-8">{slide.subtitle}</p>
                  <p className="text-lg mb-8">Specializing in flawless, long-lasting makeup for all occasions, ensuring you look and feel your best.</p>
                  <button className="bg-pink-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-pink-700 transition-colors">
                    Book Appointment
                  </button>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
