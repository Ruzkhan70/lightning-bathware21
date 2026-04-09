import { Link, useNavigate, useLocation } from "react-router";
import { ShoppingCart, Heart, User, Home, Package, Grid3X3, Tag, Wrench, Info, Phone, ChevronDown } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useUser } from "../context/UserContext";
import { useAdmin } from "../context/AdminContext";
import { useState, useCallback, useRef, useEffect } from "react";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const { isLoggedIn } = useUser();
  const { storeProfile, categories } = useAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);

  const safeCategories = categories || [];

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/products");
    }
  }, [searchQuery, navigate]);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { name: "Home", path: "/", icon: Home },
    { name: "Products", path: "/products", icon: Package },
    { name: "Categories", path: "/categories", icon: Grid3X3 },
    { name: "Offers", path: "/offers", icon: Tag },
    { name: "Services", path: "/services", icon: Wrench },
    { name: "About", path: "/about", icon: Info },
    { name: "Contact", path: "/contact", icon: Phone },
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target as Node)) {
        setShowCategoriesDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-4 py-3 bg-white text-black border-0 rounded-full"
              />
            </form>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/account" className="hidden md:block hover:text-[#D4AF37]">
              <User className="w-6 h-6" />
            </Link>

            <Link to="/wishlist" className="hidden md:block relative hover:text-[#D4AF37]">
              <Heart className="w-6 h-6" />
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link to="/cart" className="relative hover:text-[#D4AF37]">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="md:hidden mt-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
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
            {navLinks.map((link) => {
              const Icon = link.icon;
              
              if (link.name === "Categories") {
                return (
                  <li key={link.path} className="relative" ref={categoriesRef}>
                    <button
                      onClick={() => setShowCategoriesDropdown(!showCategoriesDropdown)}
                      className={`flex items-center gap-2 transition-colors font-medium ${
                        isActive(link.path) ? "text-[#D4AF37]" : "text-white hover:text-[#D4AF37]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.name}
                      <ChevronDown className={`w-4 h-4 transition-transform ${showCategoriesDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showCategoriesDropdown && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-xl shadow-xl overflow-hidden">
                        {safeCategories.filter(cat => cat.isActive).slice(0, 6).map((category) => (
                          <Link
                            key={category.id}
                            to={`/products?category=${encodeURIComponent(category.name)}`}
                            onClick={() => setShowCategoriesDropdown(false)}
                            className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37] border-b border-gray-100 last:border-0"
                          >
                            {category.name}
                          </Link>
                        ))}
                        <Link
                          to="/categories"
                          onClick={() => setShowCategoriesDropdown(false)}
                          className="block px-4 py-3 text-center text-sm text-[#D4AF37] hover:bg-gray-50 bg-gray-50"
                        >
                          View All Categories
                        </Link>
                      </div>
                    )}
                  </li>
                );
              }

              return (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    className={`flex items-center gap-2 transition-colors font-medium ${
                      isActive(link.path) ? "text-[#D4AF37]" : "text-white hover:text-[#D4AF37]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </header>
  );
}
