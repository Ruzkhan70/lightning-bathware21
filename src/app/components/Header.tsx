import { Link, useNavigate, useSearchParams, useLocation } from "react-router";
import { ShoppingCart, Heart, Menu, User, X, ChevronDown } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useUser } from "../context/UserContext";
import { useAdmin } from "../context/AdminContext";
import { Input } from "./ui/input";
import { useState, useRef, useEffect, useCallback } from "react";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const { isLoggedIn } = useUser();
  const { products, storeProfile, categories } = useAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const safeCategories = categories || [];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const safeProducts = products || [];

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(`/products`);
    }
    setShowSuggestions(false);
  };

  const suggestions = searchQuery.trim()
    ? safeProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleSuggestionClick = (productName: string) => {
    setSearchQuery(productName);
    setShowSuggestions(false);
    navigate(`/products?search=${encodeURIComponent(productName)}`);
  };

  const handleCategoriesMouseEnter = useCallback(() => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setShowCategoriesDropdown(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (categoriesRef.current && !categoriesRef.current.contains(e.target as Node)) {
        setShowCategoriesDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: "Categories", path: "/categories" },
    { name: "Offers", path: "/offers" },
    { name: "Services", path: "/services" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  const getCategoryColor = (name: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      "Lighting": { bg: "bg-yellow-100", text: "text-yellow-600" },
      "Bathroom Fittings": { bg: "bg-blue-100", text: "text-blue-600" },
      "Plumbing": { bg: "bg-green-100", text: "text-green-600" },
      "Electrical Hardware": { bg: "bg-orange-100", text: "text-orange-600" },
      "Construction Tools": { bg: "bg-red-100", text: "text-red-600" },
    };
    return colors[name] || { bg: "bg-gray-100", text: "text-gray-600" };
  };

  const getCategoryInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 bg-black text-white shadow-lg">
      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            {storeProfile.storeLogo ? (
              <>
                <img 
                  src={storeProfile.storeLogo} 
                  alt={`${storeProfile.storeName} ${storeProfile.storeNameAccent}`}
                  className="h-10 md:h-12 w-auto object-contain"
                />
                <div className="text-xl md:text-2xl font-bold hidden sm:block">
                  <span className="text-white">{storeProfile.storeName}</span>
                  <span className="text-[#D4AF37]"> {storeProfile.storeNameAccent}</span>
                </div>
              </>
            ) : (
              <div className="text-2xl md:text-3xl font-bold">
                <span className="text-white">{storeProfile.storeName}</span>
                <span className="text-[#D4AF37]"> {storeProfile.storeNameAccent}</span>
              </div>
            )}
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                className="w-full pl-4 pr-12 py-6 bg-white text-black border-0 rounded-full"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg z-50 overflow-hidden">
                  {suggestions.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSuggestionClick(product.name)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 text-black border-b border-gray-100 last:border-0"
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.category}</div>
                    </button>
                  ))}
                </div>
              )}
            </form>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-4">
            <Link
              to="/account"
              className="hidden md:block relative hover:text-[#D4AF37] transition-colors"
            >
              <User className="w-6 h-6" />
            </Link>

            <Link
              to="/wishlist"
              className="hidden md:block relative hover:text-[#D4AF37] transition-colors"
            >
              <Heart className="w-6 h-6" />
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              className="relative hover:text-[#D4AF37] transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden hover:text-[#D4AF37] transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Search Bar - Mobile */}
        <div className="md:hidden mt-4 relative" ref={searchRef}>
          <div className="relative w-full">
            <Input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
              className="w-full pl-4 pr-4 py-5 bg-white text-black border-0 rounded-full"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg z-50 overflow-hidden">
                {suggestions.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSuggestionClick(product.name)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 text-black border-b border-gray-100 last:border-0"
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.category}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation - Desktop */}
      <nav className="border-t border-gray-800 hidden md:block">
        <div className="container mx-auto px-4">
          <ul className="flex items-center justify-center gap-8 py-3">
            {navLinks.map((link) => {
              if (link.name === "Categories") {
                return (
                  <li 
                    key={link.path} 
                    className="relative h-full"
                    ref={categoriesRef as any}
                  >
                    {/* Wrapper for hover - includes button and dropdown */}
                    <div 
                      className="relative h-full flex items-center"
                      onMouseEnter={() => {
                        if (dropdownTimeoutRef.current) {
                          clearTimeout(dropdownTimeoutRef.current);
                        }
                        setShowCategoriesDropdown(true);
                      }}
                      onMouseLeave={() => {
                        dropdownTimeoutRef.current = setTimeout(() => {
                          setShowCategoriesDropdown(false);
                        }, 100);
                      }}
                    >
                      <button
                        className={`transition-colors font-medium relative group flex items-center gap-1 h-full py-1 ${
                          isActive(link.path)
                            ? "text-[#D4AF37]"
                            : "text-white hover:text-[#D4AF37]"
                        }`}
                      >
                        {link.name}
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showCategoriesDropdown ? 'rotate-180' : ''}`} />
                        <span
                          className={`absolute -bottom-1 left-0 h-0.5 bg-[#D4AF37] transition-all duration-300 ${
                            isActive(link.path) ? "w-full" : "w-0 group-hover:w-full"
                          }`}
                        />
                      </button>

                      {/* Categories Dropdown - Desktop - positioned directly below */}
                      <div
                        className={`absolute left-1/2 -translate-x-1/2 top-full w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-200 z-50 ${
                          showCategoriesDropdown 
                            ? "opacity-100 translate-y-0 pointer-events-auto mt-1" 
                            : "opacity-0 -translate-y-2 pointer-events-none"
                        }`}
                      >
                        <div className="py-2">
                          {safeCategories.length > 0 ? (
                            safeCategories.filter(cat => cat.isActive).map((category) => {
                              const color = getCategoryColor(category.name);
                              return (
                                <Link
                                  key={category.id}
                                  to={`/products?category=${encodeURIComponent(category.name)}`}
                                  onClick={() => setShowCategoriesDropdown(false)}
                                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37] transition-colors"
                                >
                                  {category.image ? (
                                    <img 
                                      src={category.image} 
                                      alt={category.name}
                                      className="w-10 h-10 rounded-lg object-cover"
                                    />
                                  ) : (
                                    <span className={`w-10 h-10 rounded-lg ${color.bg} flex items-center justify-center ${color.text} font-bold text-lg`}>
                                      {getCategoryInitial(category.name)}
                                    </span>
                                  )}
                                  <span className="font-medium">{category.name}</span>
                                </Link>
                              );
                            })
                          ) : (
                            <>
                              <Link
                                to="/products?category=Lighting"
                                onClick={() => setShowCategoriesDropdown(false)}
                                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37] transition-colors"
                              >
                                <span className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold text-lg">L</span>
                                <span className="font-medium">Lighting</span>
                              </Link>
                              <Link
                                to="/products?category=Bathroom+Fittings"
                                onClick={() => setShowCategoriesDropdown(false)}
                                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37] transition-colors"
                              >
                                <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">B</span>
                                <span className="font-medium">Bathroom Fittings</span>
                              </Link>
                              <Link
                                to="/products?category=Plumbing"
                                onClick={() => setShowCategoriesDropdown(false)}
                                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37] transition-colors"
                              >
                                <span className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600 font-bold text-lg">P</span>
                                <span className="font-medium">Plumbing</span>
                              </Link>
                              <Link
                                to="/products?category=Electrical+Hardware"
                                onClick={() => setShowCategoriesDropdown(false)}
                                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37] transition-colors"
                              >
                                <span className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">E</span>
                                <span className="font-medium">Electrical Hardware</span>
                              </Link>
                              <Link
                                to="/products?category=Construction+Tools"
                                onClick={() => setShowCategoriesDropdown(false)}
                                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37] transition-colors"
                              >
                                <span className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 font-bold text-lg">C</span>
                                <span className="font-medium">Construction Tools</span>
                              </Link>
                            </>
                          )}
                        </div>
                        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                          <Link
                            to="/categories"
                            onClick={() => setShowCategoriesDropdown(false)}
                            className="text-sm text-[#D4AF37] hover:text-[#B8962E] font-medium transition-colors flex items-center gap-1"
                          >
                            View All Categories
                            <span>→</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              }
              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`transition-colors font-medium relative group ${
                      isActive(link.path)
                        ? "text-[#D4AF37]"
                        : "text-white hover:text-[#D4AF37]"
                    }`}
                  >
                    {link.name}
                    <span
                      className={`absolute -bottom-1 left-0 h-0.5 bg-[#D4AF37] transition-all duration-300 ${
                        isActive(link.path) ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-black">
          <nav className="container mx-auto px-4 py-4">
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block py-2 transition-colors font-medium ${
                      isActive(link.path)
                        ? "text-[#D4AF37]"
                        : "hover:text-[#D4AF37]"
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
              
              {/* Mobile Categories Grid */}
              <li className="pt-2 border-t border-gray-800">
                <p className="text-gray-400 text-sm mb-2">Categories</p>
                <div className="grid grid-cols-2 gap-2">
                  {safeCategories.filter(cat => cat.isActive).map((category) => {
                    const color = getCategoryColor(category.name);
                    return (
                      <Link
                        key={category.id}
                        to={`/products?category=${encodeURIComponent(category.name)}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 py-2 px-3 bg-gray-800 rounded-lg text-white hover:text-[#D4AF37] transition-colors text-sm"
                      >
                        <span className={`w-6 h-6 rounded ${color.bg} flex items-center justify-center ${color.text} font-bold text-xs`}>
                          {getCategoryInitial(category.name)}
                        </span>
                        <span>{category.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </li>
              
              <li>
                <Link
                  to="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 py-2 transition-colors ${
                    isActive("/account")
                      ? "text-[#D4AF37]"
                      : "hover:text-[#D4AF37]"
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span>Account</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 py-2 transition-colors ${
                    isActive("/wishlist")
                      ? "text-[#D4AF37]"
                      : "hover:text-[#D4AF37]"
                  }`}
                >
                  <Heart className="w-5 h-5" />
                  <span>Wishlist ({wishlist.length})</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
