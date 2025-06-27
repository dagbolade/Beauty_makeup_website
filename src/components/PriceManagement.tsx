import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Pencil, Save, X, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

interface Service {
  id: number;
  category: string;
  name: string;
  description: string;
  price: number;
  location: string;
  is_active: boolean;
  display_order: number;
}

interface EditingService extends Partial<Service> {
  id?: number;
}

export default function PriceManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingService, setEditingService] = useState<EditingService>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Fetch services from database
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `£${(price / 100).toFixed(0)}`;
  };

  const parsePrice = (priceStr: string) => {
    // Remove £ symbol and convert to pence
    const cleaned = priceStr.replace(/[£,]/g, '');
    return Math.round(parseFloat(cleaned) * 100);
  };

  const startEditing = (service: Service) => {
    setEditingId(service.id);
    setEditingService({
      ...service,
      price: service.price / 100 // Convert to pounds for editing
    });
  };

  const startAddingNew = () => {
    setIsAddingNew(true);
    setEditingService({
      category: 'Bridal Glam',
      name: '',
      description: '',
      price: 0,
      location: 'London',
      is_active: true,
      display_order: services.length + 1
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingService({});
    setIsAddingNew(false);
  };

 const saveService = async () => {
  try {
    // Remove id from update payload to avoid 428C9 error
    const { id, ...fieldsToUpdate } = {
      ...editingService,
      price: parsePrice(editingService.price?.toString() || '0')
    };

    if (isAddingNew) {
      const { error } = await supabase
        .from('services')
        .insert(fieldsToUpdate); // ✅ No need to remove id here since it's not set

      if (error) throw error;
      setIsAddingNew(false);
    } else {
      const { error } = await supabase
        .from('services')
        .update(fieldsToUpdate) // ✅ id excluded
        .eq('id', editingService.id); // ✅ id used only for WHERE clause

      if (error) throw error;
      setEditingId(null);
    }

    setEditingService({});
    fetchServices(); // 🔄 Refresh list
  } catch (error) {
    console.error('Error saving service:', error);
    setError('Failed to save service');
  }
};


  const deleteService = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      setError('Failed to delete service');
    }
  };

  const toggleActive = async (service: Service) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id);

      if (error) throw error;
      fetchServices();
    } catch (error) {
      console.error('Error toggling service status:', error);
      setError('Failed to update service status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  const categories = [...new Set(services.map(s => s.category))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">Price Management</h3>
        <button
          onClick={startAddingNew}
          className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Service
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {isAddingNew && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">Add New Service</h4>
          <ServiceForm
            service={editingService}
            onServiceChange={setEditingService}
            onSave={saveService}
            onCancel={cancelEditing}
            categories={categories}
          />
        </div>
      )}

      {categories.map(category => (
        <div key={category} className="bg-white border border-gray-200 rounded-lg">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h4 className="font-medium text-gray-900">{category}</h4>
          </div>
          
          <div className="divide-y divide-gray-200">
            {services
              .filter(service => service.category === category)
              .map(service => (
                <div key={service.id} className="p-4">
                  {editingId === service.id ? (
                    <ServiceForm
                      service={editingService}
                      onServiceChange={setEditingService}
                      onSave={saveService}
                      onCancel={cancelEditing}
                      categories={categories}
                    />
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h5 className="font-medium text-gray-900">{service.name}</h5>
                          <span className="text-2xl font-bold text-pink-600">
                            {formatPrice(service.price)}
                          </span>
                          {!service.is_active && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-1">{service.description}</p>
                        <p className="text-gray-500 text-xs">📍 {service.location}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => toggleActive(service)}
                          className={`p-2 rounded-lg transition-colors ${
                            service.is_active
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:bg-gray-50'
                          }`}
                          title={service.is_active ? 'Hide service' : 'Show service'}
                        >
                          {service.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        
                        <button
                          onClick={() => startEditing(service)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit service"
                        >
                          <Pencil size={16} />
                        </button>
                        
                        <button
                          onClick={() => deleteService(service.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete service"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Service form component for editing/adding
interface ServiceFormProps {
  service: EditingService;
  onServiceChange: (service: EditingService) => void;
  onSave: () => void;
  onCancel: () => void;
  categories: string[];
}

function ServiceForm({ service, onServiceChange, onSave, onCancel, categories }: ServiceFormProps) {
  const updateField = (field: keyof EditingService, value: any) => {
    onServiceChange({ ...service, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={service.category || ''}
            onChange={(e) => updateField('category', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
            <option value="Party Guest Makeup">Party Guest Makeup</option>
            <option value="Special Events">Special Events</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Service Name
          </label>
          <input
            type="text"
            value={service.name || ''}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="e.g., Full Bridal Glam"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price (£)
          </label>
          <input
            type="number"
            value={service.price || ''}
            onChange={(e) => updateField('price', parseFloat(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="300"
            min="0"
            step="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            value={service.location || ''}
            onChange={(e) => updateField('location', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="London"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={service.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
          rows={2}
          placeholder="Brief description of the service"
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={service.is_active || false}
            onChange={(e) => updateField('is_active', e.target.checked)}
            className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
          />
          Active (visible on website)
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onSave}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Save size={16} />
          Save
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <X size={16} />
          Cancel
        </button>
      </div>
    </div>
  );
}