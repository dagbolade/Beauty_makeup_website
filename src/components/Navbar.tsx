import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-md fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-pink-600">Yemisi Artistry</Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`${isActive('/') ? 'text-pink-600' : 'text-gray-700'} hover:text-pink-600`}
            >
              Home
            </Link>
            <Link 
              to="/services" 
              className={`${isActive('/services') ? 'text-pink-600' : 'text-gray-700'} hover:text-pink-600`}
            >
              Services
            </Link>
            <Link 
              to="/portfolio" 
              className={`${isActive('/portfolio') ? 'text-pink-600' : 'text-gray-700'} hover:text-pink-600`}
            >
              Portfolio
            </Link>
            <Link 
              to="/about" 
              className={`${isActive('/about') ? 'text-pink-600' : 'text-gray-700'} hover:text-pink-600`}
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className={`${isActive('/contact') ? 'text-pink-600' : 'text-gray-700'} hover:text-pink-600`}
            >
              Contact
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link 
              to="/services" 
              className="bg-pink-600 text-white px-4 py-2 rounded-full text-sm hover:bg-pink-700 transition-colors flex items-center"
            >
              <Calendar size={16} className="mr-2" />
              Book Now
            </Link>
            <button 
              className="md:hidden text-gray-700"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-pink-600 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/services"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-pink-600 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </Link>
            <Link
              to="/portfolio"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-pink-600 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Portfolio
            </Link>
            <Link
              to="/about"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-pink-600 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              to="/contact"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-pink-600 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}