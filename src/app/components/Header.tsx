import { Link, useNavigate, useLocation, useSearchParams } from "react-router";
import { ShoppingCart, Heart, Menu, User, X, ChevronDown, Home, Package, Grid3X3, Tag, Wrench, Info, Phone, LogOut, UserCircle, ChevronRight } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useUser } from "../context/UserContext";
import { useAdmin } from "../context/AdminContext";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
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

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const lowerQuery = searchQuery.toLowerCase();
    return safeProducts.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);
  }, [searchQuery, safeProducts]);

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
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
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
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchStartX.current - touchX;
    const deltaY = Math.abs(touchY - touchStartY.current);
    const screenWidth = window.innerWidth;

    if (touchStartX.current >= screenWidth - 50 && deltaX > 0 && deltaY < 100) {
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
      setDrawerTranslate(0);
    } else if (drawerTranslate > 0) {
      setDrawerOpen(false);
      setDrawerTranslate(0);
    }
  }, [drawerTranslate, drawerWidth]);

  const getDrawerTransform = useMemo(() => {
    if (isDragging) {
      if (drawerOpen) return `translateX(${drawerTranslate}px)`;
      if (drawerTranslate > 0) return `translateX(${drawerWidth - drawerTranslate}px)`;
    }
    return drawerOpen ? 'translateX(0)' : 'translateX(100%)';
  }, [isDragging, drawerOpen, drawerTranslate]);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
    setMobileMenuOpen(false);
  }, []);

  const handleNavClick = useCallback(() => {
    setDrawerOpen(false);
    setMobileMenuOpen(false);
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

  const getCategoryColor = useCallback((name: string) => {
    return categoryColorMap[name] || { bg: "bg-gray-100", text: "text-gray-600" };
  }, []);

  const getCategoryInitial = useCallback((name: string) => {
    return name.charAt(0).toUpperCase();
  }, []);

  return (
    <>
      <div 
        className="fixed inset-0 z-[60] pointer-events-none md:hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      <div 
        ref={overlayRef}
        className={`fixed inset-0 bg-black/50 z-[70] transition-opacity duration-300 md:hidden ${
          drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleDrawerClose}
      />

      <div 
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-[85%] max-w-[340px] bg-gray-50 z-[80] transform md:hidden ${
          isDragging ? 'transition-none' : 'transition-transform duration-300 ease-out'
        } ${drawerOpen || drawerTranslate > 0 ? 'shadow-2xl' : 'shadow-none'}`}
        style={{ transform: getDrawerTransform() }}
      >
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-5 pt-6 pb-5">
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
            <button onClick={handleDrawerClose} className="p-2 hover:bg-white/10 rounded-full">
              <X className="w-5 h-5 text-white/80" />
            </button>
          </div>

          {isLoggedIn && user && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mt-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#B8962E] rounded-full flex items-center justify-center text-black font-bold text-lg">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{user.name}</p>
                  <p className="text-sm text-white/60 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {!isLoggedIn && (
            <Link to="/account" onClick={handleNavClick} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 mt-2">
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

        <nav className="flex-1 overflow-y-auto pt-2 pb-4">
          <div className="px-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Menu</p>
            <div className="space-y-0.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={handleNavClick}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                      isActive(link.path)
                        ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                        : 'text-gray-700 hover:bg-white hover:shadow-sm'
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

          <div className="mx-4 my-4"><div className="h-px bg-gray-200" /></div>

          <div className="px-4">
            <div className="flex items-center justify-between px-3 mb-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Categories</p>
              <Link to="/categories" onClick={handleNavClick} className="text-xs text-[#D4AF37] hover:text-[#B8962E] font-medium">
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
                    className="flex items-center gap-2.5 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all"
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

          <div className="mx-4 my-4"><div className="h-px bg-gray-200" /></div>

          <div className="px-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Account</p>
            {isLoggedIn ? (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <Link to="/account" onClick={handleNavClick} className={`flex items-center gap-3 px-4 py-3.5 ${isActive("/account") ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'text-gray-700'}`}>
                  <div className="p-2 bg-gray-100 rounded-lg"><UserCircle className="w-5 h-5" /></div>
                  <span className="font-medium">My Account</span>
                </Link>
                <Link to="/wishlist" onClick={handleNavClick} className={`flex items-center gap-3 px-4 py-3.5 ${isActive("/wishlist") ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'text-gray-700'}`}>
                  <div className="p-2 bg-gray-100 rounded-lg"><Heart className="w-5 h-5" /></div>
                  <span className="font-medium">Wishlist</span>
                  {wishlist.length > 0 && <span className="ml-auto bg-[#D4AF37] text-black text-xs font-bold px-2 py-0.5 rounded-full">{wishlist.length}</span>}
                </Link>
                <div className="h-px bg-gray-100 mx-4" />
                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3.5 text-red-600 hover:bg-red-50 w-full">
                  <div className="p-2 bg-red-50 rounded-lg"><LogOut className="w-5 h-5" /></div>
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            ) : (
              <Link to="/account" onClick={handleNavClick} className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#B8962E] rounded-xl text-black font-semibold">
                <UserCircle className="w-5 h-5" />
                <span>Login / Register</span>
              </Link>
            )}
          </div>
        </nav>
      </div>

      <header className="sticky top-0 z-50 bg-black text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3">
              {storeProfile.storeLogo ? (
                <>
                  <img src={storeProfile.storeLogo} alt={`${storeProfile.storeName}`} className="h-10 md:h-12 w-auto object-contain" />
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

            <div className="hidden md:flex flex-1 max-w-2xl relative" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <input
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
                        type="button"
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

              <button onClick={() => setDrawerOpen(true)} className="md:hidden hover:text-[#D4AF37] transition-colors p-1">
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="md:hidden mt-4 relative" ref={mobileSearchRef}>
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-4 pr-4 py-5 bg-white text-black border-0 rounded-full"
              />
            </form>
          </div>
        </div>

        <nav className="border-t border-gray-800 hidden md:block">
          <div className="container mx-auto px-4">
            <ul className="flex items-center justify-center gap-8 py-3">
              {navLinks.map((link) => {
                if (link.name === "Categories") {
                  return (
                    <li key={link.path} className="relative h-full">
                      <div 
                        className="relative h-full flex items-center"
                        ref={categoriesRef}
                        onMouseEnter={() => setShowCategoriesDropdown(true)}
                        onMouseLeave={() => {
                          dropdownTimeoutRef.current = setTimeout(() => setShowCategoriesDropdown(false), 100);
                        }}
                      >
                        <button className={`transition-colors font-medium relative group flex items-center gap-1 h-full py-1 ${isActive(link.path) ? "text-[#D4AF37]" : "text-white hover:text-[#D4AF37]"}`}>
                          {link.name}
                          <ChevronDown className={`w-4 h-4 transition-transform ${showCategoriesDropdown ? 'rotate-180' : ''}`} />
                          <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#D4AF37] transition-all ${isActive(link.path) ? "w-full" : "w-0 group-hover:w-full"}`} />
                        </button>

                        <div className={`absolute left-1/2 -translate-x-1/2 top-full w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden transition-all z-50 ${showCategoriesDropdown ? "opacity-100 translate-y-0 pointer-events-auto mt-1" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
                          <div className="py-2">
                            {safeCategories.length > 0 ? (
                              safeCategories.filter(cat => cat.isActive).map((category) => {
                                const color = getCategoryColor(category.name);
                                return (
                                  <Link
                                    key={category.id}
                                    to={`/products?category=${encodeURIComponent(category.name)}`}
                                    onClick={() => setShowCategoriesDropdown(false)}
                                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37]"
                                  >
                                    {category.image ? (
                                      <img src={category.image} alt={category.name} className="w-10 h-10 rounded-lg object-cover" />
                                    ) : (
                                      <span className={`w-10 h-10 rounded-lg ${color.bg} flex items-center justify-center ${color.text} font-bold text-lg`}>{getCategoryInitial(category.name)}</span>
                                    )}
                                    <span className="font-medium">{category.name}</span>
                                  </Link>
                                );
                              })
                            ) : (
                              <>
                                <Link to="/products?category=Lighting" onClick={() => setShowCategoriesDropdown(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37]">
                                  <span className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold text-lg">L</span>
                                  <span className="font-medium">Lighting</span>
                                </Link>
                                <Link to="/products?category=Bathroom+Fittings" onClick={() => setShowCategoriesDropdown(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37]">
                                  <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">B</span>
                                  <span className="font-medium">Bathroom Fittings</span>
                                </Link>
                              </>
                            )}
                          </div>
                          <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                            <Link to="/categories" onClick={() => setShowCategoriesDropdown(false)} className="text-sm text-[#D4AF37] hover:text-[#B8962E] font-medium flex items-center gap-1">
                              View All Categories <span>→</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                }
                return (
                  <li key={link.path}>
                    <Link to={link.path} className={`transition-colors font-medium relative group ${isActive(link.path) ? "text-[#D4AF37]" : "text-white hover:text-[#D4AF37]"}`}>
                      {link.name}
                      <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#D4AF37] transition-all ${isActive(link.path) ? "w-full" : "w-0 group-hover:w-full"}`} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </header>
    </>
  );
}
