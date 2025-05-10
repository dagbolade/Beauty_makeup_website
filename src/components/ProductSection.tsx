import React from 'react';
import { Star } from 'lucide-react';

const products = [
  {
    id: 1,
    name: "Luminous Foundation",
    price: 39.99,
    image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    category: "Makeup"
  },
  {
    id: 2,
    name: "Rose Gold Palette",
    price: 45.99,
    image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    category: "Makeup"
  },
  {
    id: 3,
    name: "Hydrating Serum",
    price: 29.99,
    image: "https://images.unsplash.com/photo-1570194065650-d99fb4b8ccb0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    category: "Skincare"
  },
  {
    id: 4,
    name: "Velvet Lipstick",
    price: 19.99,
    image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    category: "Makeup"
  }
];

export default function ProductSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
              <div className="relative pb-[100%]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-current" />
                  ))}
                </div>
                <h3 className="text-lg font-semibold mb-1">{product.name}</h3>
                <p className="text-gray-600 mb-2">{product.category}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-pink-600">${product.price}</span>
                  <button className="bg-pink-600 text-white px-4 py-2 rounded-full text-sm hover:bg-pink-700 transition-colors">
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}