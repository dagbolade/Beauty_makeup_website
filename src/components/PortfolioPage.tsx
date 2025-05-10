import React from 'react';

const portfolioItems = [
  {
    category: "Bridal",
    images: [
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1595515538281-89b2648103d9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    category: "Special Events",
    images: [
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1457972729786-0411a3b2b626?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    category: "Photoshoots",
    images: [
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1542596768-5d1d21f1cf98?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ]
  }
];

export default function PortfolioPage() {
  return (
    <div className="pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Portfolio</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explore our collection of stunning transformations and captured moments.
          </p>
        </div>

        {portfolioItems.map((category, index) => (
          <div key={index} className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">{category.category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {category.images.map((image, imageIndex) => (
                <div key={imageIndex} className="relative overflow-hidden rounded-lg shadow-lg group">
                  <img
                    src={image}
                    alt={`${category.category} ${imageIndex + 1}`}
                    className="w-full h-64 object-cover transform transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="text-white text-lg font-semibold">View Details</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}