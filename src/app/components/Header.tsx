import { Link, useNavigate } from "react-router";
import { ShoppingCart, Heart, Menu, User, ChevronDown } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAdmin } from "../context/AdminContext";
import { useState } from "react";

export default function Header() {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const { storeProfile, categories } = useAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/products");
    }
  };

  const safeCategories = categories || [];

  return (
    <header className="sticky top-0 z-50 bg-black text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="text-2xl md:text-3xl font-bold">
              <span className="text-white">{storeProfile.storeName}</span>
              <span className="text-[#D4AF37]"> {storeProfile.storeNameAccent}</span>
            </div>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl relative">
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 min-w-0 px-3 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive w-full pl-4 pr-12 py-6 bg-white text-black border-0 rounded-full"
            />
          </form>

          <div className="flex items-center gap-4">
            <Link to="/account" className="hidden md:block relative hover:text-[#D4AF37] transition-colors">
              <User className="w-6 h-6" />
            </Link>

            <Link to="/wishlist" className="hidden md:block relative hover:text-[#D4AF37] transition-colors">
              <Heart className="w-6 h-6" />
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link to="/cart" className="relative hover:text-[#D4AF37] transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            <button onClick={() => navigate("/products")} className="md:hidden hover:text-[#D4AF37] transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="md:hidden mt-4 relative">
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 min-w-0 px-3 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive w-full pl-4 pr-4 py-5 bg-white text-black border-0 rounded-full"
            />
          </form>
        </div>
      </div>

      <nav className="border-t border-gray-800 hidden md:block">
        <div className="container mx-auto px-4">
          <ul className="flex items-center justify-center gap-8 py-3">
            <li>
              <Link to="/" className="transition-colors font-medium relative group text-[#D4AF37]">
                Home
                <span className="absolute -bottom-1 left-0 h-0.5 bg-[#D4AF37] transition-all duration-300 w-full"></span>
              </Link>
            </li>
            <li>
              <Link to="/products" className="transition-colors font-medium relative group text-white hover:text-[#D4AF37]">
                Products
                <span className="absolute -bottom-1 left-0 h-0.5 bg-[#D4AF37] transition-all duration-300 w-0 group-hover:w-full"></span>
              </Link>
            </li>
            <li className="relative h-full">
              <div 
                className="relative h-full flex items-center"
                onMouseEnter={() => setShowCategoriesDropdown(true)}
                onMouseLeave={() => setShowCategoriesDropdown(false)}
              >
                <button className="transition-colors font-medium relative group flex items-center gap-1 h-full py-1 text-white hover:text-[#D4AF37]">
                  Categories
                  <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                  <span className="absolute -bottom-1 left-0 h-0.5 bg-[#D4AF37] transition-all duration-300 w-0 group-hover:w-full"></span>
                </button>
                <div className={`absolute left-1/2 -translate-x-1/2 top-full w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-200 z-50 ${showCategoriesDropdown ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
                  <div className="py-2">
                    {safeCategories.filter(cat => cat.isActive).map((category) => (
                      <Link
                        key={category.id}
                        to={`/products?category=${encodeURIComponent(category.name)}`}
                        onClick={() => setShowCategoriesDropdown(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37] transition-colors"
                      >
                        {category.image ? (
                          <img alt={category.name} className="w-10 h-10 rounded-lg object-cover" src={category.image} />
                        ) : (
                          <span className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center font-bold">{category.name.charAt(0)}</span>
                        )}
                        <span className="font-medium">{category.name}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                    <Link to="/categories" onClick={() => setShowCategoriesDropdown(false)} className="text-sm text-[#D4AF37] hover:text-[#B8962E] font-medium transition-colors flex items-center gap-1">
                      View All Categories<span>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            </li>
            <li>
              <Link to="/offers" className="transition-colors font-medium relative group text-white hover:text-[#D4AF37]">
                Offers
                <span className="absolute -bottom-1 left-0 h-0.5 bg-[#D4AF37] transition-all duration-300 w-0 group-hover:w-full"></span>
              </Link>
            </li>
            <li>
              <Link to="/services" className="transition-colors font-medium relative group text-white hover:text-[#D4AF37]">
                Services
                <span className="absolute -bottom-1 left-0 h-0.5 bg-[#D4AF37] transition-all duration-300 w-0 group-hover:w-full"></span>
              </Link>
            </li>
            <li>
              <Link to="/about" className="transition-colors font-medium relative group text-white hover:text-[#D4AF37]">
                About
                <span className="absolute -bottom-1 left-0 h-0.5 bg-[#D4AF37] transition-all duration-300 w-0 group-hover:w-full"></span>
              </Link>
            </li>
            <li>
              <Link to="/contact" className="transition-colors font-medium relative group text-white hover:text-[#D4AF37]">
                Contact
                <span className="absolute -bottom-1 left-0 h-0.5 bg-[#D4AF37] transition-all duration-300 w-0 group-hover:w-full"></span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
