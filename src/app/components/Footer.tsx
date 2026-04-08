import { Link } from "react-router";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black text-white border-t border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">
              <span className="text-white">Lightning</span>
              <span className="text-[#D4AF37]"> Bathware</span>
            </h3>
            <p className="text-gray-400 mb-4">
              Sri Lanka's premier destination for quality hardware products.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-[#D4AF37]">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#D4AF37]">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#D4AF37]">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-[#D4AF37]">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/products" className="text-gray-400 hover:text-[#D4AF37]">Products</Link></li>
              <li><Link to="/categories" className="text-gray-400 hover:text-[#D4AF37]">Categories</Link></li>
              <li><Link to="/services" className="text-gray-400 hover:text-[#D4AF37]">Services</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-[#D4AF37]">About Us</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-[#D4AF37]">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-[#D4AF37]">Categories</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/products?category=Lighting" className="hover:text-[#D4AF37]">Lighting</Link></li>
              <li><Link to="/products?category=Bathroom+Fittings" className="hover:text-[#D4AF37]">Bathroom Fittings</Link></li>
              <li><Link to="/products?category=Plumbing" className="hover:text-[#D4AF37]">Plumbing</Link></li>
              <li><Link to="/products?category=Electrical+Hardware" className="hover:text-[#D4AF37]">Electrical Hardware</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-[#D4AF37]">Contact Us</h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-5 h-5 mt-1 text-[#D4AF37]" />
                <span>Sri Lanka</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-[#D4AF37]" />
                <span>+94 XX XXX XXXX</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#D4AF37]" />
                <span>info@lightningbathware.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Lightning Bathware. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
