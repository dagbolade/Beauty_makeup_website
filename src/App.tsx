import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ServiceSection from './components/ServiceSection';
import AdminPanel from './components/AdminPanel';
import AboutPage from './components/AboutPage';
import PortfolioPage from './components/PortfolioPage';
import ContactPage from './components/ContactPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Navbar />
        <Routes>
          <Route path="/" element={
            <main>
              <Hero />
              <ServiceSection />
            </main>
          } />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Yemisi Artistry</h3>
                <p className="text-gray-400">Where beauty meets perfection. Professional makeup artistry and photography services in London.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li><a href="/services" className="text-gray-400 hover:text-white">Services</a></li>
                  <li><a href="/portfolio" className="text-gray-400 hover:text-white">Portfolio</a></li>
                  <li><a href="/contact" className="text-gray-400 hover:text-white">Contact</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4">Contact Us</h3>
                <ul className="space-y-2 text-gray-400">
                  <li>London, United Kingdom</li>
                  <li>Email: info@yemisiartistry.com</li>
                  <li>Instagram: @yemisiartistry</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
              <p>&copy; 2024 Yemisi Artistry. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;