// Complete working PortfolioImageManager.tsx that matches your table structure
// Replace your entire PortfolioImageManager.tsx with this:

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Upload, X, Star, Edit, Trash2, StarOff, Play, Image, Video } from 'lucide-react';

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category: string;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  media_type: string;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  is_featured: boolean;
  media_type: 'image' | 'video';
}

const PortfolioImageManager: React.FC = () => {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  
  // Form state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: 'general',
    is_featured: false,
    media_type: 'image'
  });

  // Categories with proper labels
  const categories = [
    { value: 'general', label: 'General' },
    { value: 'bridal', label: 'Bridal' },
    { value: 'evening', label: 'Evening Glam' },
    { value: 'natural', label: 'Natural Beauty' },
    { value: 'special-events', label: 'Special Events' },
    { value: 'photoshoot', label: 'Photoshoots' }
  ];

  // Fetch portfolio items
  const fetchPortfolioItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('portfolio_images')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPortfolioItems(data || []);
    } catch (error) {
      console.error('Error fetching portfolio items:', error);
      toast.error('Failed to load portfolio items');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioItems();
  }, []);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 50MB for videos, 5MB for images)
      const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`File size should be less than ${file.type.startsWith('video/') ? '50MB' : '5MB'}`);
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error('Please select an image or video file');
        return;
      }

      // Set media type based on file
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      setFormData(prev => ({ ...prev, media_type: mediaType }));
      setMediaFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setMediaPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Upload media to Supabase Storage
  const uploadMediaToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `portfolio-${Date.now()}.${fileExt}`;
    const bucket = 'yemisi-artistry';
    const filePath = `portfolio/${fileName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  };

  // Add/Edit portfolio item
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mediaFile && !editingItem) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      let imageUrl = editingItem?.image_url;

      // Upload new media if file is selected
      if (mediaFile) {
        imageUrl = await uploadMediaToStorage(mediaFile);
      }

      // Use the exact column names from your table
      const itemData = {
        title: formData.title,
        description: formData.description,
        image_url: imageUrl,
        category: formData.category,
        is_featured: formData.is_featured,
        display_order: portfolioItems.length,
        media_type: formData.media_type
      };

      let result;
      if (editingItem) {
        // Update existing item
        result = await supabase
          .from('portfolio_images')
          .update(itemData)
          .eq('id', editingItem.id);
      } else {
        // Add new item
        result = await supabase
          .from('portfolio_images')
          .insert([itemData]);
      }

      if (result.error) {
        console.error('Database error:', result.error);
        throw result.error;
      }

      toast.success(editingItem ? 'Item updated successfully!' : 'Item added successfully!');
      resetForm();
      fetchPortfolioItems();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (id: string, imageUrl: string, title: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      // Delete from database
      const { error } = await supabase
        .from('portfolio_images')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Delete from storage
      if (imageUrl && imageUrl.includes('supabase')) {
        const path = imageUrl.split('/').slice(-2).join('/');
        await supabase.storage
          .from('yemisi-artistry')
          .remove([path]);
      }

      toast.success('Item deleted successfully!');
      fetchPortfolioItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  // Toggle featured status
  const handleToggleFeatured = async (id: string, currentStatus: boolean, title: string) => {
    try {
      const { error } = await supabase
        .from('portfolio_images')
        .update({ is_featured: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      const action = currentStatus ? 'removed from featured' : 'added to featured';
      toast.success(`"${title}" ${action}`);
      fetchPortfolioItems();
    } catch (error) {
      console.error('Error updating featured status:', error);
      toast.error('Failed to update featured status');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'general',
      is_featured: false,
      media_type: 'image'
    });
    setMediaFile(null);
    setMediaPreview('');
    setShowAddModal(false);
    setEditingItem(null);
  };

  // Start editing
  const startEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      category: item.category,
      is_featured: item.is_featured,
      media_type: (item.media_type as 'image' | 'video') || 'image'
    });
    setMediaPreview(item.image_url);
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Manager</h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage your portfolio images and videos. Featured items appear in the hero carousel and prominently on the portfolio page.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 flex items-center gap-2 transition-colors"
        >
          <Upload size={16} />
          Add Media
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <Image className="text-blue-500" size={20} />
            <span className="text-sm font-medium text-gray-600">Total Items</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{portfolioItems.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <Star className="text-yellow-500" size={20} />
            <span className="text-sm font-medium text-gray-600">Featured</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{portfolioItems.filter(item => item.is_featured).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <Image className="text-green-500" size={20} />
            <span className="text-sm font-medium text-gray-600">Images</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{portfolioItems.filter(item => item.media_type === 'image').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <Video className="text-purple-500" size={20} />
            <span className="text-sm font-medium text-gray-600">Videos</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{portfolioItems.filter(item => item.media_type === 'video').length}</p>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading portfolio items...</p>
          </div>
        ) : portfolioItems.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
            <Upload size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No portfolio items yet</h3>
            <p className="text-sm mb-4">Upload your first image or video to get started!</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition-colors"
            >
              Add Your First Item
            </button>
          </div>
        ) : (
          portfolioItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                {item.media_type === 'video' ? (
                  <div className="relative">
                    <video
                      src={item.image_url}
                      className="w-full h-48 object-cover"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                      <Play className="text-white" size={24} />
                    </div>
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Video size={12} />
                      VIDEO
                    </div>
                  </div>
                ) : (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                
                {item.is_featured && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    <Star size={12} fill="white" />
                    Featured
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1 line-clamp-1">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description || 'No description'}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                    {categories.find(c => c.value === item.category)?.label || item.category}
                  </span>
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                    item.media_type === 'video' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {item.media_type === 'video' ? 'VIDEO' : 'IMAGE'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {/* Edit Button */}
                    <button
                      onClick={() => startEdit(item)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                      title="Edit item details"
                    >
                      <Edit size={16} />
                    </button>
                    
                    {/* Feature/Unfeature Button */}
                    <button
                      onClick={() => handleToggleFeatured(item.id, item.is_featured, item.title)}
                      className={`p-2 rounded transition-colors ${
                        item.is_featured 
                          ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50' 
                          : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                      }`}
                      title={item.is_featured ? "Remove from featured" : "Add to featured"}
                    >
                      {item.is_featured ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteItem(item.id, item.image_url, item.title)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                      title="Delete item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h3>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700 p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Media File {!editingItem && '*'}
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Images: max 5MB | Videos: max 50MB
                </p>
                
                {mediaPreview && (
                  <div className="mt-2">
                    {formData.media_type === 'video' ? (
                      <video
                        src={mediaPreview}
                        className="w-full h-32 object-cover rounded"
                        controls
                        muted
                      />
                    ) : (
                      <img
                        src={mediaPreview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="e.g., Bridal Elegance"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  rows={3}
                  placeholder="Brief description of the look or video..."
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Featured */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-900">
                  Featured item (appears in hero carousel and prominently on portfolio page)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-pink-500 text-white py-2 px-4 rounded hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? 'Saving...' : (editingItem ? 'Update Item' : 'Add Item')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioImageManager;