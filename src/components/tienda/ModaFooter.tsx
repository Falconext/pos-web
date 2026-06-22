import React from 'react';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';

interface ModaFooterProps {
  tiendaNombre: string;
}

export default function ModaFooter({ tiendaNombre }: ModaFooterProps) {
  return (
    <footer className="w-full bg-white pt-20 pb-10 overflow-hidden relative" style={{ fontFamily: '"Inter", sans-serif' }}>
      
      {/* Background Huge Text Overlay */}
      <div className="absolute bottom-10 right-[-2%] text-[150px] md:text-[250px] lg:text-[280px] font-bold text-[#2B2B2B] leading-none select-none pointer-events-none z-0 tracking-tighter" style={{ bottom: '2rem' }}>
        {tiendaNombre || 'Styliq'}<span style={{ color: '#D1BCA6' }}>.</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 xl:px-8 relative z-10">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-20 border-b border-gray-100 pb-16">
          
          {/* Left: Newsletter */}
          <div className="md:col-span-5 flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-gray-900 leading-tight mb-3">
              Stay Connected & Step<br/>Into Style
            </h2>
            <p className="text-sm text-gray-600 mb-6 max-w-sm font-medium">
              Would you like me to make it sound more luxury-brand elegant or friendly and youthful for your website tone?
            </p>
            <div className="relative max-w-sm">
              <input 
                type="email" 
                placeholder="Enter Email Address" 
                className="w-full border border-gray-300 rounded-full py-3.5 pl-5 pr-12 text-sm focus:outline-none focus:border-gray-900 transition-colors bg-transparent"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-700 hover:text-black transition-colors">
                <Icon icon="solar:arrow-right-linear" width={20} />
              </button>
            </div>
          </div>

          {/* Middle: Reviews & Payments */}
          <div className="md:col-span-4 flex flex-col justify-center items-start md:items-center">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <Icon key={i} icon="solar:star-bold" className="text-gray-900" width={18} />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-900">4.9 Based on 3623 Reviews</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Simulated payment icons using custom svgs or colored divs if proper icons aren't available, we'll use iconify generic ones */}
                <Icon icon="logos:mastercard" width={32} />
                <Icon icon="logos:visa" width={36} />
                <Icon icon="logos:amex" width={32} />
                <Icon icon="logos:paypal" width={48} />
              </div>
            </div>
          </div>

          {/* Right: Visit Us */}
          <div className="md:col-span-3 flex flex-col justify-center items-start md:items-end text-left md:text-right">
            <div className="w-40 h-32 rounded-2xl overflow-hidden mb-4 bg-gray-100">
              <img 
                src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=400" 
                alt="Store" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-1 mb-2 font-bold text-sm text-gray-900 w-full md:justify-end cursor-pointer group">
              Visit Us <Icon icon="solar:arrow-right-linear" className="group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-gray-500 w-full md:text-right">
              715 Broadway, New York, NY<br/>10003, USA
            </p>
          </div>

        </div>

        {/* Links Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24 max-w-2xl">
          
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-gray-900 text-sm mb-1">Shop</h4>
            <Link to="#" className="text-xs text-gray-500 font-medium hover:text-gray-900 transition-colors">New Arrivals</Link>
            <Link to="#" className="text-xs text-gray-500 font-medium hover:text-gray-900 transition-colors">Essentials</Link>
            <Link to="#" className="text-xs text-gray-500 font-medium hover:text-gray-900 transition-colors">Best Sellers</Link>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-gray-900 text-sm mb-1">About Us</h4>
            <Link to="#" className="text-xs text-gray-500 font-medium hover:text-gray-900 transition-colors">Our Story</Link>
            <Link to="#" className="text-xs text-gray-500 font-medium hover:text-gray-900 transition-colors">Sustainability</Link>
            <Link to="#" className="text-xs text-gray-500 font-medium hover:text-gray-900 transition-colors">Help & FAQ</Link>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-gray-900 text-sm mb-1">Lookbook</h4>
            <Link to="#" className="text-xs text-gray-500 font-medium hover:text-gray-900 transition-colors">Capsule '25</Link>
            <Link to="#" className="text-xs text-gray-500 font-medium hover:text-gray-900 transition-colors">Lifestyle Edits</Link>
            <Link to="#" className="text-xs text-gray-500 font-medium hover:text-gray-900 transition-colors">Journal</Link>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-gray-900 text-sm mb-1">Terms & Policy</h4>
            <Link to="#" className="text-xs text-gray-500 font-medium hover:text-gray-900 transition-colors">Privacy Policy</Link>
            <Link to="#" className="text-xs text-gray-500 font-medium hover:text-gray-900 transition-colors">Terms of Use</Link>
            <Link to="#" className="text-xs text-gray-500 font-medium hover:text-gray-900 transition-colors">Accessibility</Link>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between border-t border-gray-100 pt-6">
          <p className="text-xs text-gray-500 font-medium mb-4 md:mb-0">
            © 2025 {tiendaNombre}. — Wear less. Choose better.
          </p>
          <div className="flex items-center gap-6">
            <Link to="#" className="text-xs text-gray-500 font-medium hover:text-gray-900 transition-colors">Instagram</Link>
            <Link to="#" className="text-xs text-gray-500 font-medium hover:text-gray-900 transition-colors">Facebook</Link>
            <Link to="#" className="text-xs text-gray-500 font-medium hover:text-gray-900 transition-colors">Pinterest</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
