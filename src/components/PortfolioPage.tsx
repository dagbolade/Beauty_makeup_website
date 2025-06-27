import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string; // Changed from media_url to match your database
  category: string;
  is_featured: boolean;
  display_order: number;
  created_at: string;
}

const PortfolioPage: React.FC = () => {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Category configuration with proper labels
  const categoryConfig = {
    'all': { label: 'All Work', description: 'Complete portfolio showcase' },
    'Photoshoots': { label: 'Photoshoots', description: 'Professional photography sessions' },
    'Evening Glam': { label: 'Evening Glam', description: 'Sophisticated evening looks' },
    'Bridal': { label: 'Bridal', description: 'Wedding day perfection' },
    'Natural': { label: 'Natural Beauty', description: 'Everyday elegance' },
    'Special Events': { label: 'Special Events', description: 'Memorable occasions' }
  };

  // Fetch portfolio items
  const fetchPortfolioItems = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_images')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Fetched portfolio items:', data); // Debug log
      setPortfolioItems(data || []);
    } catch (error) {
      console.error('Error fetching portfolio items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioItems();
  }, []);

  // Get filtered items by category
  const getFilteredItems = (category: string) => {
    if (category === 'all') return portfolioItems;
    return portfolioItems.filter(item => item.category === category);
  };

  // Get available categories (only show categories that have items)
  const getAvailableCategories = () => {
    const categoriesWithItems = [...new Set(portfolioItems.map(item => item.category))];
    return ['all', ...categoriesWithItems].filter(cat => 
      cat === 'all' || getFilteredItems(cat).length > 0
    );
  };

  // Navigation functions for lightbox
  const navigateItem = (direction: 'next' | 'prev') => {
    if (!selectedItem) return;
    
    const currentItems = getFilteredItems(selectedCategory);
    const currentIndex = currentItems.findIndex(item => item.id === selectedItem.id);
    
    let newIndex;
    if (direction === 'next') {
      newIndex = currentIndex < currentItems.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : currentItems.length - 1;
    }
    
    setSelectedItem(currentItems[newIndex]);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedItem) return;
      
      if (e.key === 'Escape') {
        setSelectedItem(null);
      } else if (e.key === 'ArrowLeft') {
        navigateItem('prev');
      } else if (e.key === 'ArrowRight') {
        navigateItem('next');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedItem, selectedCategory]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  const availableCategories = getAvailableCategories();
  const currentItems = getFilteredItems(selectedCategory);
  const featuredItems = portfolioItems.filter(item => item.is_featured);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Portfolio</h1>
          <p className="text-xl text-pink-100 max-w-2xl mx-auto">
            Explore our collection of stunning transformations and captured moments
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Category Filter */}
        {availableCategories.length > 1 && (
          <div className="flex flex-wrap justify-center mb-8 gap-3">
            {availableCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-full transition-all duration-300 font-medium ${
                  selectedCategory === category
                    ? 'bg-pink-500 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 hover:bg-pink-50 hover:text-pink-600 shadow-md'
                }`}
              >
                {categoryConfig[category as keyof typeof categoryConfig]?.label || category}
              </button>
            ))}
          </div>
        )}

        {/* Featured Section (only show on 'all' view) */}
        {selectedCategory === 'all' && featuredItems.length > 0 && (
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Work</h2>
              <p className="text-gray-600">Our most stunning transformations</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredItems.slice(0, 6).map((item) => (
                <div
                  key={`featured-${item.id}`}
                  className="relative group cursor-pointer overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  onClick={() => setSelectedItem(item)}
                >
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      console.error('Failed to load featured image:', item.image_url);
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-200">{item.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="absolute top-3 right-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    ⭐ Featured
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Content */}
        <div className="mb-12">
          {selectedCategory !== 'all' && (
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {categoryConfig[selectedCategory as keyof typeof categoryConfig]?.label || selectedCategory}
              </h2>
              <p className="text-gray-600">
                {categoryConfig[selectedCategory as keyof typeof categoryConfig]?.description || `Beautiful ${selectedCategory} looks`}
              </p>
            </div>
          )}

          {currentItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {selectedCategory === 'all' ? 'No portfolio items yet' : `No ${categoryConfig[selectedCategory as keyof typeof categoryConfig]?.label} items yet`}
              </h3>
              <p className="text-gray-600">
                {selectedCategory === 'all' ? 'Portfolio items will appear here once uploaded.' : 'Items in this category will appear here once uploaded.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {currentItems.map((item) => (
                <div
                  key={item.id}
                  className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 bg-white"
                  onClick={() => setSelectedItem(item)}
                >
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      console.error('Failed to load portfolio image:', item.image_url);
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity duration-300 flex items-center justify-center">
                    <div className="text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <h3 className="text-sm font-semibold">{item.title}</h3>
                    </div>
                  </div>
                  
                  {item.is_featured && selectedCategory !== 'all' && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
                      ⭐
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl p-8">
          <h3 className="text-2xl font-bold mb-4">Ready for Your Transformation?</h3>
          <p className="text-pink-100 mb-6 max-w-2xl mx-auto">
            Book your appointment today and let us create your perfect look for any occasion
          </p>
          <a
            href="/enquiry"
            className="inline-block bg-white text-pink-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors duration-300"
          >
            Book Your Session
          </a>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            {/* Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 z-10"
            >
              <X size={32} />
            </button>

            {/* Navigation Buttons */}
            {currentItems.length > 1 && (
              <>
                <button
                  onClick={() => navigateItem('prev')}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  onClick={() => navigateItem('next')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}

            {/* Media Content */}
            <img
              src={selectedItem.image_url}
              alt={selectedItem.title}
              className="max-w-full max-h-[80vh] object-contain"
              onError={(e) => {
                console.error('Failed to load lightbox image:', selectedItem.image_url);
                e.currentTarget.src = 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=800&q=80';
              }}
            />

            {/* Media Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-6">
              <h3 className="text-xl font-semibold mb-2">{selectedItem.title}</h3>
              {selectedItem.description && (
                <p className="text-gray-300 mb-2">{selectedItem.description}</p>
              )}
              <div className="flex items-center gap-2">
                <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-xs">
                  {categoryConfig[selectedItem.category as keyof typeof categoryConfig]?.label || selectedItem.category}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioPage;