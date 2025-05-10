import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import BookingModal from './BookingModal';

const services = [
  {
    id: 1,
    name: "Bridal Glam",
    options: [
      { name: "Full Bridal Glam", price: 300 },
      { name: "Two-Day Bridal Glam (Two Looks)", price: 500 },
      { name: "One Day | 2 Outfits", price: 370 },
      { name: "One Day | 3 Outfits", price: 450 }
    ],
    description: "Complete bridal makeup service with consultation",
    image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 2,
    name: "Party Guest Makeup",
    options: [
      { name: "Studio Service", price: 80 },
      { name: "Home Service", price: 100 }
    ],
    description: "Perfect for weddings and special ceremonies",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 3,
    name: "Birthday Photoshoot Package",
    options: [
      { name: "Full Makeup Glam (Studio)", price: 70 },
      { name: "Full Makeup Glam (Home)", price: 100 },
      { name: "Makeup + Photoshoot (Studio)", price: 150 },
      { name: "Makeup + Photoshoot (Home)", price: 180 }
    ],
    description: "Professional makeup with optional photoshoot using Canon G7X II",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
  }
];

export default function ServiceSection() {
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBooking = (serviceId: number, optionName: string) => {
    setSelectedService(serviceId);
    setSelectedOption(optionName);
    setIsModalOpen(true);
  };

  return (
    <section className="py-16 bg-white" id="services">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Services</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            All prices are negotiable and might change depending on location.
            Professional photography services available with all packages.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service) => (
            <div 
              key={service.id}
              className="bg-gray-50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="relative pb-[66%]">
                <img
                  src={service.image}
                  alt={service.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
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
                          onClick={() => handleBooking(service.id, option.name)}
                          className="text-sm bg-pink-600 text-white px-3 py-1 rounded-full hover:bg-pink-700 transition-colors"
                        >
                          Book
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

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-4">Important Notes</h3>
          <ul className="text-gray-600 space-y-2 max-w-2xl mx-auto">
            <li>• All prices are subject to change based on location and specific requirements</li>
            <li>• Professional photography services include high-quality edited photos</li>
            <li>• Home service prices may vary depending on location within London</li>
            <li>• Booking confirmation requires a deposit</li>
          </ul>
        </div>
      </div>

      {selectedService !== null && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          serviceId={selectedService}
          serviceName={services.find(s => s.id === selectedService)?.name || ''}
          serviceOption={selectedOption}
        />
      )}
    </section>
  );
}