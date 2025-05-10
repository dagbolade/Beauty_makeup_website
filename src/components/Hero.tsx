import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

const slides = [
  {
    image: "https://images.unsplash.com/photo-1457972729786-0411a3b2b626?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80",
    title: "Welcome to Yemisi Artistry",
    subtitle: "Where Beauty Meets Perfection"
  },
  {
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80",
    title: "Flawless Bridal Makeup",
    subtitle: "Your Special Day, Your Perfect Look"
  },
  {
    image: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80",
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