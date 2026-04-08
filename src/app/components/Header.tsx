import { Link } from "react-router";
import { ShoppingCart, Heart, Menu } from "lucide-react";
import { useState } from "react";

export default function Header() {
  console.log("[Header] Simple render");
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setDrawerOpen(!drawerOpen)}
        className="md:hidden fixed top-4 right-4 z-[100] bg-black p-2"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {drawerOpen && (
        <div className="fixed inset-0 bg-black/50 z-[90] md:hidden">
          <div className="absolute right-0 top-0 h-full w-64 bg-gray-900 p-4">
            <button 
              onClick={() => setDrawerOpen(false)}
              className="text-white mb-4"
            >
              Close X
            </button>
            <nav className="space-y-2">
              <Link to="/" className="block text-white py-2">Home</Link>
              <Link to="/products" className="block text-white py-2">Products</Link>
              <Link to="/categories" className="block text-white py-2">Categories</Link>
              <Link to="/offers" className="block text-white py-2">Offers</Link>
              <Link to="/contact" className="block text-white py-2">Contact</Link>
            </nav>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-black text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold">
              <span className="text-white">Lightning</span>
              <span className="text-[#D4AF37]"> Bathware</span>
            </Link>

            <div className="flex items-center gap-4">
              <Link to="/wishlist" className="hidden md:block">
                <Heart className="w-6 h-6" />
              </Link>
              <Link to="/cart">
                <ShoppingCart className="w-6 h-6" />
              </Link>
            </div>
          </div>
        </div>

        <nav className="border-t border-gray-800 hidden md:block">
          <div className="container mx-auto px-4">
            <ul className="flex items-center justify-center gap-8 py-3">
              <li><Link to="/" className="text-white hover:text-[#D4AF37]">Home</Link></li>
              <li><Link to="/products" className="text-white hover:text-[#D4AF37]">Products</Link></li>
              <li><Link to="/categories" className="text-white hover:text-[#D4AF37]">Categories</Link></li>
              <li><Link to="/offers" className="text-white hover:text-[#D4AF37]">Offers</Link></li>
              <li><Link to="/services" className="text-white hover:text-[#D4AF37]">Services</Link></li>
              <li><Link to="/about" className="text-white hover:text-[#D4AF37]">About</Link></li>
              <li><Link to="/contact" className="text-white hover:text-[#D4AF37]">Contact</Link></li>
            </ul>
          </div>
        </nav>
      </header>
    </>
  );
}
