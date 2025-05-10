import React, { useState } from 'react';
import { MapPin, Phone, Mail, Instagram } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  return (
    <div className="pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600">Get in touch for inquiries and bookings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                <textarea
                  id="message"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-pink-600 text-white px-6 py-3 rounded-md hover:bg-pink-700 transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <MapPin className="w-6 h-6 text-pink-600 mt-1" />
                <div className="ml-4">
                  <h3 className="font-medium">Location</h3>
                  <p className="text-gray-600">London, United Kingdom</p>
                </div>
              </div>
              <div className="flex items-start">
                <Phone className="w-6 h-6 text-pink-600 mt-1" />
                <div className="ml-4">
                  <h3 className="font-medium">Phone</h3>
                  <p className="text-gray-600">Available upon booking</p>
                </div>
              </div>
              <div className="flex items-start">
                <Mail className="w-6 h-6 text-pink-600 mt-1" />
                <div className="ml-4">
                  <h3 className="font-medium">Email</h3>
                  <p className="text-gray-600">info@yemisiartistry.com</p>
                </div>
              </div>
              <div className="flex items-start">
                <Instagram className="w-6 h-6 text-pink-600 mt-1" />
                <div className="ml-4">
                  <h3 className="font-medium">Instagram</h3>
                  <p className="text-gray-600">@yemisiartistry</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Business Hours</h2>
              <ul className="space-y-2 text-gray-600">
                <li>Monday - Friday: 9:00 AM - 7:00 PM</li>
                <li>Saturday: 9:00 AM - 6:00 PM</li>
                <li>Sunday: By appointment only</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}