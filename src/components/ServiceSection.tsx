import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import BookingModal from './BookingModal';
import { supabase } from '../lib/supabase';

export default function ServiceSection() {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase.from('service_types').select('*');
      if (error) {
        console.error(error);
      } else {
        setServices(data);
      }
    };
    fetchServices();
  }, []);

  const handleBooking = (service, option) => {
    setSelectedService(service);
    setSelectedOption(option);
    setIsModalOpen(true);
  };

  return (
    <section className="py-16 bg-white" id="services">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Services</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            All prices are negotiable and might change depending on location.
            Professional photography services are available with all packages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service) => (
            <div 
              key={service.id}
              className="bg-gray-50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                
                <div className="space-y-3 mb-6">
                  {service.options.map((option) => (
                    <div key={option.name} className="flex justify-between items-center">
                      <span className="text-gray-700">{option.name}</span>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold">£{option.price}</span>
                        <button
                          onClick={() => handleBooking(service, option.name)}
                          className="text-sm bg-pink-600 text-white px-3 py-1 rounded-full hover:bg-pink-700 transition-colors"
                        >
                          Enquire
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center text-gray-600">
                  <MapPin size={16} className="mr-2" />
                  <span>London</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedService !== null && (
          <BookingModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            serviceId={selectedService.id} // 👈 This is now the real UUID
            serviceName={selectedService.name}
            serviceOption={selectedOption}
          />
        )}
      </div>
    </section>
  );
}
