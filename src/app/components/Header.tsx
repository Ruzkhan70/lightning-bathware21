import { Link, useNavigate, useSearchParams, useLocation } from "react-router";
import { ShoppingCart, Heart, Menu, User, X, ChevronDown, Home, Package, Grid3X3, Tag, Wrench, Info, Phone, Settings, LogOut, UserCircle, FileText, ChevronRight } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useUser } from "../context/UserContext";
import { useAdmin } from "../context/AdminContext";
import { Input } from "./ui/input";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const { isLoggedIn, user, logout } = useUser();
  const { products, storeProfile, categories } = useAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Swipe gesture refs
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const drawerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

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

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Touch handlers for swipe gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchX - touchStartX.current;
    const deltaY = Math.abs(touchY - touchStartY.current);

    // Only trigger swipe right from left edge (within 30px) and mostly horizontal movement
    if (touchStartX.current <= 30 && deltaX > 50 && deltaY < 100) {
      setDrawerOpen(true);
    }
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setMobileMenuOpen(false);
  };

  const handleNavClick = () => {
    setDrawerOpen(false);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully!");
    handleNavClick();
    navigate("/");
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
    <>
      {/* Swipe Detection Layer - Mobile Only */}
      <div 
        className="fixed inset-0 z-[60] pointer-events-none md:hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      />

      {/* Drawer Overlay */}
      <div 
        ref={overlayRef}
        className={`fixed inset-0 bg-black/50 z-[70] transition-opacity duration-300 md:hidden ${
          drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleDrawerClose}
      />

      {/* Mobile Drawer */}
      <div 
        ref={drawerRef}
        className={`fixed top-0 left-0 h-full w-[85%] max-w-[320px] bg-white z-[80] transform transition-transform duration-300 ease-out shadow-2xl md:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Link to="/" className="flex items-center gap-2" onClick={handleNavClick}>
            {storeProfile.storeLogo ? (
              <img src={storeProfile.storeLogo} alt="Logo" className="h-8 w-auto" />
            ) : (
              <div className="text-lg font-bold">
                <span className="text-black">{storeProfile.storeName}</span>
                <span className="text-[#D4AF37]"> {storeProfile.storeNameAccent}</span>
              </div>
            )}
          </Link>
          <button 
            onClick={handleDrawerClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* User Section */}
        {isLoggedIn && user && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D4AF37] rounded-full flex items-center justify-center text-black font-bold">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          <div className="px-3 py-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Menu</p>
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors ${
                    isActive(link.path)
                      ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.name}</span>
                  {isActive(link.path) && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </div>

          {/* Categories */}
          <div className="px-3 py-1 mt-2 border-t pt-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Categories</p>
            {safeCategories.filter(cat => cat.isActive).slice(0, 5).map((category) => {
              const color = getCategoryColor(category.name);
              return (
                <Link
                  key={category.id}
                  to={`/products?category=${encodeURIComponent(category.name)}`}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors text-gray-700 hover:bg-gray-100`}
                >
                  {category.image ? (
                    <img src={category.image} alt={category.name} className="w-6 h-6 rounded object-cover" />
                  ) : (
                    <span className={`w-6 h-6 rounded flex items-center justify-center ${color.bg} ${color.text} font-bold text-xs`}>
                      {getCategoryInitial(category.name)}
                    </span>
                  )}
                  <span className="text-sm">{category.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Account Section */}
          <div className="px-3 py-1 mt-2 border-t pt-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Account</p>
            {isLoggedIn ? (
              <>
                <Link
                  to="/account"
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors ${
                    isActive("/account")
                      ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <UserCircle className="w-5 h-5" />
                  <span>My Account</span>
                </Link>
                <Link
                  to="/wishlist"
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors ${
                    isActive("/wishlist")
                      ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Heart className="w-5 h-5" />
                  <span>Wishlist ({wishlist.length})</span>
                </Link>
                <Link
                  to="/orders"
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors ${
                    isActive("/orders")
                      ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span>My Orders</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors text-red-600 hover:bg-red-50 w-full"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/account"
                onClick={handleNavClick}
                className="flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors text-gray-700 hover:bg-gray-100"
              >
                <UserCircle className="w-5 h-5" />
                <span>Login / Register</span>
              </Link>
            )}
          </div>
        </nav>
      </div>

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
                onClick={() => setDrawerOpen(true)}
                className="md:hidden hover:text-[#D4AF37] transition-colors p-1"
              >
                <Menu className="w-6 h-6" />
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

                        {/* Categories Dropdown */}
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

        {/* Old Mobile Menu - Hidden, replaced by drawer */}
      </header>
    </>
  );
}
