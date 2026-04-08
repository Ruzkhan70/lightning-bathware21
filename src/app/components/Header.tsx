import { Link, useNavigate, useLocation } from "react-router";
import { ShoppingCart, Heart, Menu, User } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAdmin } from "../context/AdminContext";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";

export default function Header() {
  console.log("[Header] Rendering...");
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const { storeProfile, categories } = useAdmin();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [drawerTranslate, setDrawerTranslate] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const drawerWidth = 320;

  const safeCategories = categories || [];

  const isActive = useCallback((path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  }, [location.pathname]);

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
    const touch = e.touches[0];
    (e.currentTarget as any).startX = touch.clientX;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaX = (e.currentTarget as any).startX - touch.clientX;
    const screenWidth = window.innerWidth;
    if ((e.currentTarget as any).startX >= screenWidth - 50 && deltaX > 0) {
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

  const getDrawerTransform = useMemo(() => {
    if (isDragging) {
      if (drawerOpen) return `translateX(${drawerTranslate}px)`;
      if (drawerTranslate > 0) return `translateX(${drawerWidth - drawerTranslate}px)`;
    }
    return drawerOpen ? 'translateX(0)' : 'translateX(100%)';
  }, [isDragging, drawerOpen, drawerTranslate]);

  const handleDrawerClose = useCallback(() => setDrawerOpen(false), []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: "Categories", path: "/categories" },
    { name: "Offers", path: "/offers" },
    { name: "Services", path: "/services" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  try {
    return (
      <>
        {/* Swipe Detection Layer - Mobile Only */}
        <div 
          className="fixed inset-0 z-[60] pointer-events-none md:hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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
          className={`fixed top-0 right-0 h-full w-[85%] max-w-[340px] bg-gray-50 z-[80] transform transition-shadow md:hidden ${
            isDragging ? 'transition-none' : 'transition-transform duration-300 ease-out'
          } ${drawerOpen || drawerTranslate > 0 ? 'shadow-2xl' : 'shadow-none'}`}
          style={{ transform: getDrawerTransform() }}
        >
          <div className="bg-gray-900 px-5 pt-6 pb-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xl font-bold text-white">
                {storeProfile.storeName}
                <span className="text-[#D4AF37]"> {storeProfile.storeNameAccent}</span>
              </span>
              <button 
                onClick={handleDrawerClose}
                className="p-2 hover:bg-white/10 rounded-full"
              >
                <span className="w-5 h-5 text-white/80">X</span>
              </button>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto pt-2 pb-4 px-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setDrawerOpen(false)}
                className={`block py-3 px-3 rounded-lg transition-colors ${
                  isActive(link.path) ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-gray-700'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        <header className="sticky top-0 z-50 bg-black text-white shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <Link to="/" className="flex items-center gap-3">
                <span className="text-2xl font-bold">
                  <span className="text-white">{storeProfile.storeName}</span>
                  <span className="text-[#D4AF37]"> {storeProfile.storeNameAccent}</span>
                </span>
              </Link>

              <div className="flex items-center gap-4">
                <Link to="/wishlist" className="hidden md:block relative">
                  <Heart className="w-6 h-6 hover:text-[#D4AF37]" />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {wishlist.length}
                    </span>
                  )}
                </Link>

                <Link to="/cart" className="relative">
                  <ShoppingCart className="w-6 h-6 hover:text-[#D4AF37]" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </Link>

                <button
                  onClick={() => setDrawerOpen(true)}
                  className="md:hidden hover:text-[#D4AF37]"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          <nav className="border-t border-gray-800 hidden md:block">
            <div className="container mx-auto px-4">
              <ul className="flex items-center justify-center gap-8 py-3">
                {navLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className={`transition-colors font-medium ${
                        isActive(link.path) ? "text-[#D4AF37]" : "text-white hover:text-[#D4AF37]"
                      }`}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </header>
      </>
    );
  } catch (error) {
    console.error("[Header] Render error:", error);
    return (
      <header className="sticky top-0 z-50 bg-black text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="text-center">
            <p className="text-[#D4AF37]">Loading...</p>
          </div>
        </div>
      </header>
    );
  }
}
