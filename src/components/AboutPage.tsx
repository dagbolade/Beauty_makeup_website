import React from 'react';

export default function AboutPage() {
  return (
    <div className="pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">About Yemisi Artistry</h1>
          <p className="text-xl text-gray-600">Where Beauty Meets Perfection</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <img
              src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
              alt="Makeup Artist at Work"
              className="rounded-lg shadow-lg"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-4">Our Story</h2>
            <p className="text-gray-600 mb-6">
              Yemisi Artistry was founded with a passion for bringing out the natural beauty in every client. 
              With years of experience in the beauty industry, we've developed a unique approach that combines 
              traditional techniques with modern trends.
            </p>
            <p className="text-gray-600 mb-6">
              Our mission is to enhance your natural beauty while ensuring you feel confident and comfortable. 
              We believe that every face tells a story, and our job is to help you tell that story in the most 
              beautiful way possible.
            </p>
            <h3 className="text-xl font-bold mb-3">Why Choose Us?</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Professional and experienced makeup artists</li>
              <li>• High-quality, premium products</li>
              <li>• Personalized service for every client</li>
              <li>• Flexible booking options</li>
              <li>• Professional photography services</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}