import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import BookingModal from './BookingModal';
import { supabase } from '../lib/supabase';

export default function ServiceSection() {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) {
        console.error(error);
      } else {
        setServices(data || []);
      }
    };

    fetchServices();
  }, []);

  const handleBooking = (service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  // Group by category
  const grouped = services.reduce((acc, service) => {
    acc[service.category] = acc[service.category] || [];
    acc[service.category].push(service);
    return acc;
  }, {});

  return (
    <section className="py-16 bg-white" id="services">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Services</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            All prices are negotiable and may vary depending on location.
            Photography add-ons available upon request.
          </p>
        </div>

        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="mb-12">
            <h3 className="text-2xl font-semibold mb-6 text-pink-600">{category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map(service => (
                <div
                  key={service.id}
                  className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition"
                >
                  <div className="p-6">
                    <h4 className="text-lg font-semibold mb-2">{service.name}</h4>
                    <p className="text-gray-600 mb-3 text-sm">{service.description}</p>
                    
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xl font-bold text-pink-600">
                        £{(service.price / 100).toFixed(0)}
                      </span>
                      <button
                        onClick={() => handleBooking(service)}
                        className="text-sm bg-pink-600 text-white px-4 py-1 rounded-full hover:bg-pink-700 transition"
                      >
                        Enquire
                      </button>
                    </div>

                    <div className="flex items-center text-gray-500 text-sm">
                      <MapPin size={14} className="mr-1" />
                      {service.location || 'London'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {selectedService && (
          <BookingModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            serviceId={selectedService.id}
            serviceName={selectedService.name}
            serviceOption={selectedService.name} // 👈 Just pass name as the option
          />
        )}
      </div>
    </section>
  );
}
