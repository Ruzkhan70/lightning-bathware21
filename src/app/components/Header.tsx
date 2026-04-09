import { Link, useNavigate, useLocation } from "react-router";
import { ShoppingCart, Heart, Menu, User } from "lucide-react";
import { useState, useCallback } from "react";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
  }, [searchQuery, navigate]);

  return (
    <header className="sticky top-0 z-50 bg-black text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="text-2xl font-bold">
            <span className="text-white">Lightning</span>
            <span className="text-[#D4AF37]"> Bathware</span>
          </Link>

          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-xl mx-8">
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-4 py-3 bg-white text-black border-0 rounded-full"
            />
          </form>

          <div className="flex items-center gap-4">
            <Link to="/account" className="hidden md:block">
              <User className="w-6 h-6" />
            </Link>
            <Link to="/cart" className="relative">
              <ShoppingCart className="w-6 h-6" />
            </Link>
            <button onClick={() => navigate("/products")} className="md:hidden">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="md:hidden mt-4">
          <form onSubmit={handleSearchSubmit} className="flex w-full">
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-4 py-3 bg-white text-black border-0 rounded-full"
            />
          </form>
        </div>
      </div>

      <nav className="border-t border-gray-800 hidden md:block">
        <div className="container mx-auto px-4">
          <ul className="flex items-center justify-center gap-8 py-3">
            <li><Link to="/" className="hover:text-[#D4AF37]">Home</Link></li>
            <li><Link to="/products" className="hover:text-[#D4AF37]">Products</Link></li>
            <li><Link to="/categories" className="hover:text-[#D4AF37]">Categories</Link></li>
            <li><Link to="/offers" className="hover:text-[#D4AF37]">Offers</Link></li>
            <li><Link to="/services" className="hover:text-[#D4AF37]">Services</Link></li>
            <li><Link to="/about" className="hover:text-[#D4AF37]">About</Link></li>
            <li><Link to="/contact" className="hover:text-[#D4AF37]">Contact</Link></li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
