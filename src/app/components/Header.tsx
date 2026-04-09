import { Link, useNavigate, useLocation, useSearchParams } from "react-router";
import { ShoppingCart, Heart, Menu, User, X, ChevronDown, Home, Package, Grid3X3, Tag, Wrench, Info, Phone, LogOut, UserCircle, ChevronRight } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useUser } from "../context/UserContext";
import { useAdmin } from "../context/AdminContext";
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
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  
  const touchStartX = useRef(0);
  const drawerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [drawerTranslate, setDrawerTranslate] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const drawerWidth = 320;

  const safeCategories = categories || [];
  const safeProducts = products || [];

  const isActive = useCallback((path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  const suggestions = safeProducts.filter(p => 
    searchQuery.trim() && (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ).slice(0, 5);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setShowSuggestions(value.length > 0);
  }, []);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/products");
    }
    setShowSuggestions(false);
  }, [searchQuery, navigate]);

  const handleSuggestionClick = useCallback((productName: string) => {
    setSearchQuery(productName);
    setShowSuggestions(false);
    navigate(`/products?search=${encodeURIComponent(productName)}`);
  }, [navigate]);

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
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const touchX = e.touches[0].clientX;
    const deltaX = touchStartX.current - touchX;
    const screenWidth = window.innerWidth;

    if (touchStartX.current >= screenWidth - 50 && deltaX > 0) {
      setDrawerTranslate(Math.min(deltaX, drawerWidth));
    }
    if (drawerOpen && deltaX < 0) {
      setDrawerTranslate(Math.max(0, Math.min(drawerWidth + deltaX, drawerWidth)));
    }
  }, [isDragging, drawerOpen, drawerWidth]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (drawerTranslate > drawerWidth * 0.4) {
      setDrawerOpen(true);
    } else {
      setDrawerOpen(false);
    }
    setDrawerTranslate(0);
  }, [drawerTranslate, drawerWidth]);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const handleNavClick = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    toast.success("Logged out successfully!");
    handleNavClick();
    navigate("/");
  }, [logout, handleNavClick, navigate]);

  const navLinks = [
    { name: "Home", path: "/", icon: Home },
    { name: "Products", path: "/products", icon: Package },
    { name: "Categories", path: "/categories", icon: Grid3X3 },
    { name: "Offers", path: "/offers", icon: Tag },
    { name: "Services", path: "/services", icon: Wrench },
    { name: "About", path: "/about", icon: Info },
    { name: "Contact", path: "/contact", icon: Phone },
  ];

  const categoryColorMap: Record<string, { bg: string; text: string }> = {
    "Lighting": { bg: "bg-yellow-100", text: "text-yellow-600" },
    "Bathroom Fittings": { bg: "bg-blue-100", text: "text-blue-600" },
    "Plumbing": { bg: "bg-green-100", text: "text-green-600" },
    "Electrical Hardware": { bg: "bg-orange-100", text: "text-orange-600" },
    "Construction Tools": { bg: "bg-red-100", text: "text-red-600" },
  };

  const getCategoryColor = (name: string) => {
    return categoryColorMap[name] || { bg: "bg-gray-100", text: "text-gray-600" };
  };

  const getCategoryInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const drawerTransform = isDragging
    ? `translateX(${drawerOpen ? drawerTranslate : drawerWidth - drawerTranslate}px)`
    : drawerOpen ? 'translateX(0)' : 'translateX(100%)';

  return (
    <>
      {/* Touch detection overlay for mobile */}
      <div 
        className="fixed inset-0 z-[60] pointer-events-none hidden max-md:block"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Overlay */}
      <div 
        ref={overlayRef}
        className={`fixed inset-0 bg-black/50 z-[70] transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleDrawerClose}
      />

      {/* Mobile Drawer */}
      <div 
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-[85%] max-w-[340px] bg-gray-50 z-[80] transition-transform duration-300 ease-out`}
        style={{ transform: drawerTransform }}
      >
        <div className="h-full flex flex-col">
          {/* Drawer Header */}
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-5 pt-6 pb-5 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <Link to="/" className="flex items-center gap-2" onClick={handleNavClick}>
                {storeProfile.storeLogo ? (
                  <img src={storeProfile.storeLogo} alt="Logo" className="h-10 w-auto" />
                ) : (
                  <div className="text-xl font-bold">
                    <span className="text-white">{storeProfile.storeName}</span>
                    <span className="text-[#D4AF37]"> {storeProfile.storeNameAccent}</span>
                  </div>
                )}
              </Link>
              <button 
                onClick={handleDrawerClose} 
                className="p-2.5 hover:bg-white/10 rounded-full active:bg-white/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white/80" />
              </button>
            </div>

            {/* User Info */}
            {isLoggedIn && user ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#B8962E] rounded-full flex items-center justify-center text-black font-bold text-lg">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{user.name}</p>
                    <p className="text-sm text-white/60 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            ) : (
              <Link 
                to="/account" 
                onClick={handleNavClick} 
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 active:bg-white/20 transition-colors"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#B8962E] rounded-full flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-black" />
                </div>
                <div>
                  <p className="font-semibold text-white">Welcome</p>
                  <p className="text-sm text-white/60">Login or create account</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/60 ml-auto" />
              </Link>
            )}
          </div>

          {/* Drawer Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            {/* Menu Section */}
            <div className="px-4 mb-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Menu</p>
              <div className="space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={handleNavClick}
                      className={`flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all min-h-[48px] ${
                        isActive(link.path)
                          ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                          : 'text-gray-700 active:bg-gray-100'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isActive(link.path) ? 'bg-[#D4AF37]/20' : 'bg-gray-100'}`}>
                        <Icon className={`w-5 h-5 ${isActive(link.path) ? 'text-[#D4AF37]' : 'text-gray-500'}`} />
                      </div>
                      <span className="font-medium">{link.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="mx-4 my-2"><div className="h-px bg-gray-200" /></div>

            {/* Categories Section */}
            <div className="px-4 mb-4">
              <div className="flex items-center justify-between px-3 mb-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Categories</p>
                <Link 
                  to="/categories" 
                  onClick={handleNavClick} 
                  className="text-xs text-[#D4AF37] hover:text-[#B8962E] font-medium active:scale-95 transition-transform"
                >
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {safeCategories.filter(cat => cat.isActive).slice(0, 4).map((category) => {
                  const color = getCategoryColor(category.name);
                  return (
                    <Link
                      key={category.id}
                      to={`/products?category=${encodeURIComponent(category.name)}`}
                      onClick={handleNavClick}
                      className="flex items-center gap-2.5 p-3 bg-white rounded-xl shadow-sm active:scale-[0.98] transition-transform min-h-[56px]"
                    >
                      {category.image ? (
                        <img src={category.image} alt={category.name} className="w-9 h-9 rounded-lg object-cover" />
                      ) : (
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color.bg}`}>
                          <span className={`${color.text} font-bold text-sm`}>{getCategoryInitial(category.name)}</span>
                        </div>
                      )}
                      <span className="text-xs font-medium text-gray-700 line-clamp-1">{category.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="mx-4 my-2"><div className="h-px bg-gray-200" /></div>

            {/* Account Section */}
            <div className="px-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Account</p>
              {isLoggedIn ? (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <Link 
                    to="/account" 
                    onClick={handleNavClick} 
                    className={`flex items-center gap-3 px-4 py-3.5 min-h-[48px] ${isActive("/account") ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'text-gray-700 active:bg-gray-50'}`}
                  >
                    <div className="p-2 bg-gray-100 rounded-lg"><UserCircle className="w-5 h-5" /></div>
                    <span className="font-medium">My Account</span>
                  </Link>
                  <Link 
                    to="/wishlist" 
                    onClick={handleNavClick} 
                    className={`flex items-center gap-3 px-4 py-3.5 min-h-[48px] ${isActive("/wishlist") ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'text-gray-700 active:bg-gray-50'}`}
                  >
                    <div className="p-2 bg-gray-100 rounded-lg"><Heart className="w-5 h-5" /></div>
                    <span className="font-medium">Wishlist</span>
                    {wishlist.length > 0 && (
                      <span className="ml-auto bg-[#D4AF37] text-black text-xs font-bold px-2 py-0.5 rounded-full">
                        {wishlist.length}
                      </span>
                    )}
                  </Link>
                  <div className="h-px bg-gray-100 mx-4" />
                  <button 
                    onClick={handleLogout} 
                    className="flex items-center gap-3 px-4 py-3.5 text-red-600 active:bg-red-50 w-full min-h-[48px]"
                  >
                    <div className="p-2 bg-red-50 rounded-lg"><LogOut className="w-5 h-5" /></div>
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              ) : (
                <Link 
                  to="/account" 
                  onClick={handleNavClick} 
                  className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#B8962E] rounded-xl text-black font-semibold active:scale-[0.98] transition-transform min-h-[48px]"
                >
                  <UserCircle className="w-5 h-5" />
                  <span>Login / Register</span>
                </Link>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-50 bg-white shadow-sm md:hidden">
        {/* Mobile Top Row */}
        <div className="px-4">
          <div className="flex items-center justify-between h-14">
            {/* Hamburger Menu */}
            <button 
              onClick={() => setDrawerOpen(true)} 
              className="p-2.5 hover:bg-gray-100 rounded-full active:bg-gray-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              {storeProfile.storeLogo ? (
                <img src={storeProfile.storeLogo} alt={storeProfile.storeName} className="h-8 w-auto" />
              ) : (
                <div className="text-lg font-bold text-center">
                  <span className="text-black">{storeProfile.storeName}</span>
                  <span className="text-[#D4AF37]"> {storeProfile.storeNameAccent}</span>
                </div>
              )}
            </Link>

            {/* Icons */}
            <div className="flex items-center gap-1">
              <Link 
                to="/account" 
                className="p-2.5 hover:bg-gray-100 rounded-full active:bg-gray-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <User className="w-5 h-5 text-gray-700" />
              </Link>

              <Link 
                to="/cart" 
                className="p-2.5 hover:bg-gray-100 rounded-full active:bg-gray-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center relative"
              >
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 bg-[#D4AF37] text-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="px-4 pb-3" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-4 pr-12 py-3 bg-gray-100 text-black border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
            />
            <button 
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-[#D4AF37] rounded-full active:bg-[#C5A028] transition-colors"
            >
              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                {suggestions.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSuggestionClick(product.name)}
                    className="w-full text-left px-4 py-3 active:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
                  >
                    <div className="font-medium text-sm text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-500">{product.category}</div>
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>
      </header>

      {/* DESKTOP HEADER */}
      <header className="sticky top-0 z-50 bg-white shadow-sm hidden md:block">
        {/* Top Row */}
        <div className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center h-16">
              {/* Logo - Fixed Width */}
              <div className="w-48 flex-shrink-0 pl-2">
                <Link to="/" className="flex items-center">
                  {storeProfile.storeLogo ? (
                    <img src={storeProfile.storeLogo} alt={storeProfile.storeName} className="h-10 w-auto" />
                  ) : (
                    <div className="text-xl font-bold">
                      <span className="text-black">{storeProfile.storeName}</span>
                      <span className="text-[#D4AF37]"> {storeProfile.storeNameAccent}</span>
                    </div>
                  )}
                </Link>
              </div>

              {/* Search Bar - Centered */}
              <div className="flex-1 flex justify-center px-8" ref={searchRef}>
                <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xl">
                  <input
                    type="text"
                    placeholder="Search for products..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                    className="w-full pl-5 pr-14 py-2.5 bg-gray-100 text-black border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 transition-all placeholder:text-gray-400"
                  />
                  <button 
                    type="submit"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-[#D4AF37] rounded-full hover:bg-[#C5A028] transition-colors"
                  >
                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                      {suggestions.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleSuggestionClick(product.name)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
                        >
                          <div className="font-medium text-sm text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.category}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </form>
              </div>

              {/* Icons - Fixed Width */}
              <div className="w-48 flex-shrink-0 flex items-center justify-end gap-3 pr-2">
                <Link to="/account" className="p-2.5 hover:bg-gray-100 rounded-full transition-colors group">
                  <User className="w-5 h-5 text-gray-700 group-hover:text-[#D4AF37] transition-colors" />
                </Link>

                <Link to="/wishlist" className="p-2.5 hover:bg-gray-100 rounded-full transition-colors group relative">
                  <Heart className="w-5 h-5 text-gray-700 group-hover:text-[#D4AF37] transition-colors" />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[#D4AF37] text-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {wishlist.length}
                    </span>
                  )}
                </Link>

                <Link to="/cart" className="p-2.5 hover:bg-gray-100 rounded-full transition-colors group relative">
                  <ShoppingCart className="w-5 h-5 text-gray-700 group-hover:text-[#D4AF37] transition-colors" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[#D4AF37] text-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Navigation */}
        <div className="bg-black">
          <div className="max-w-7xl mx-auto px-6">
            <nav className="flex items-center justify-center">
              <ul className="flex items-center">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isCategories = link.name === "Categories";
                  
                  return (
                    <li key={link.path} className="relative" ref={isCategories ? categoriesRef : null}>
                      {isCategories ? (
                        <div 
                          className="relative"
                          ref={categoriesRef}
                          onMouseEnter={() => setShowCategoriesDropdown(true)}
                          onMouseLeave={() => setShowCategoriesDropdown(false)}
                        >
                          <button 
                            className={`flex items-center gap-2 px-6 py-5 text-sm font-medium transition-colors ${
                              isActive(link.path) ? "text-[#D4AF37]" : "text-white hover:text-[#D4AF37]"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {link.name}
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showCategoriesDropdown ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {showCategoriesDropdown && (
                            <div 
                              className="absolute left-1/2 -translate-x-1/2 top-full w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 mt-0.5"
                            >
                              <div className="py-2">
                                {safeCategories.filter(cat => cat.isActive).map((category) => {
                                  const color = getCategoryColor(category.name);
                                  return (
                                    <Link
                                      key={category.id}
                                      to={`/products?category=${encodeURIComponent(category.name)}`}
                                      onClick={() => setShowCategoriesDropdown(false)}
                                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37] transition-colors"
                                    >
                                      {category.image ? (
                                        <img src={category.image} alt={category.name} className="w-10 h-10 rounded-lg object-cover" />
                                      ) : (
                                        <span className={`w-10 h-10 rounded-lg ${color.bg} flex items-center justify-center ${color.text} font-bold`}>
                                          {getCategoryInitial(category.name)}
                                        </span>
                                      )}
                                      <span className="font-medium text-sm">{category.name}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                              <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                                <Link 
                                  to="/categories" 
                                  onClick={() => setShowCategoriesDropdown(false)} 
                                  className="text-sm text-[#D4AF37] hover:text-[#B8962E] font-medium flex items-center justify-between"
                                >
                                  View All Categories
                                  <ChevronRight className="w-4 h-4" />
                                </Link>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link 
                          to={link.path} 
                          className={`flex items-center gap-2 px-6 py-5 text-sm font-medium transition-colors ${
                            isActive(link.path) ? "text-[#D4AF37]" : "text-white hover:text-[#D4AF37]"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {link.name}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
