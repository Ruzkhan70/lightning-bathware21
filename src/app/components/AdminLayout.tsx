import { useEffect, useState, useRef, useCallback } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  PlusCircle,
  BarChart3,
  Settings,
  LogOut,
  Tag,
  List,
  RefreshCw,
  AlertTriangle,
  Menu,
  X,
  Mail,
  Star,
  Users,
  FileText,
  Shield,
  Bell,
} from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import ScrollToTop from "./ScrollToTop";
import SessionWarning from "./admin/SessionWarning";
import { useAdminTimeout } from "../hooks/useAdminTimeout";

export default function AdminLayout() {
  const { isAdminLoggedIn, isDataLoaded, logout, triggerLogout, products, storeProfile, messages } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const { showWarning, remainingTime, resetTimer, logoutNow } = useAdminTimeout(
    isAdminLoggedIn,
    logout
  );

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    const diff = touchEndX.current - touchStartX.current;
    const startPosition = touchStartX.current;
    
    if (mobileMenuOpen) {
      if (diff < -swipeThreshold) {
        closeMobileMenu();
      }
    } else {
      if (startPosition <= 30 && diff > swipeThreshold) {
        setMobileMenuOpen(true);
      }
    }
  };

  const unavailableProducts = (products || []).filter(p => !p.isAvailable);
  const newMessages = (messages || []).filter(m => m.status === "new").length;

  useEffect(() => {
    if (!isAdminLoggedIn) {
      navigate("/admin/login");
    }
  }, [isAdminLoggedIn, navigate]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleStayLoggedIn = () => {
    resetTimer();
  };

  const handleWarningLogout = () => {
    logoutNow();
    navigate("/admin/login");
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  if (!isAdminLoggedIn) {
    return null;
  }

  // Show loading screen while Firebase data is loading
  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/admin",
    },
    {
      icon: Package,
      label: "Products",
      path: "/admin/products",
      badge: unavailableProducts.length > 0 ? unavailableProducts.length : undefined,
      badgeColor: "bg-red-500",
    },
    {
      icon: List,
      label: "Categories",
      path: "/admin/categories",
    },
    {
      icon: ShoppingCart,
      label: "Orders",
      path: "/admin/orders",
    },
    {
      icon: Mail,
      label: "Messages",
      path: "/admin/messages",
      badge: newMessages > 0 ? newMessages : undefined,
      badgeColor: "bg-red-500",
    },
    {
      icon: Tag,
      label: "Offers",
      path: "/admin/offers",
    },
    {
      icon: Bell,
      label: "Announcements",
      path: "/admin/announcements",
    },
    {
      icon: Star,
      label: "Reviews",
      path: "/admin/reviews",
    },
    {
      icon: PlusCircle,
      label: "Add Product",
      path: "/admin/add-product",
    },
    {
      icon: BarChart3,
      label: "Statistics",
      path: "/admin/statistics",
    },
    {
      icon: Users,
      label: "Customers",
      path: "/admin/customers",
    },
    {
      icon: FileText,
      label: "Activity Logs",
      path: "/admin/activity-logs",
    },
    {
      icon: Shield,
      label: "Login Attempts",
      path: "/admin/login-attempts",
    },
    {
      icon: Settings,
      label: "Settings",
      path: "/admin/settings",
    },
  ];

  return (
    <>
      <SessionWarning
        show={showWarning}
        remainingTime={remainingTime}
        onStayLoggedIn={handleStayLoggedIn}
        onLogout={handleWarningLogout}
      />

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-black text-white z-50 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
        <div>
          <span className="text-white font-bold">{storeProfile.storeName}</span>
          <span className="text-[#D4AF37] font-bold"> {storeProfile.storeNameAccent}</span>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="min-h-screen bg-gray-100">
        <ScrollToTop />
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-56 bg-black text-white flex-col">
          <div className="p-4 border-b border-gray-800 flex-shrink-0">
            <h1 className="text-lg font-bold flex items-center gap-1">
              <span className="text-white">{storeProfile.storeName}</span>
              <span className="text-[#D4AF37]"> {storeProfile.storeNameAccent}</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
          </div>

          <nav className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 ${isActive
                          ? "bg-[#D4AF37] text-black font-semibold"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm">{item.label}</span>
                      {item.badge && (
                        <span className={`${item.badgeColor || 'bg-red-500'} text-white text-xs font-bold px-1.5 py-0.5 rounded-full ml-auto`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex-shrink-0 p-2 border-t border-gray-800 space-y-1">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-blue-400 hover:bg-gray-800 hover:text-blue-300 transition-colors w-full"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="text-sm">{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <aside
          ref={drawerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`lg:hidden fixed left-0 top-0 h-screen w-64 bg-black text-white flex flex-col z-50 will-change-transform shadow-2xl ${
            mobileMenuOpen 
              ? "translate-x-0" 
              : "-translate-x-full"
          } transition-[transform] duration-[350ms] ease-in-out ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4 border-b border-gray-800 flex-shrink-0 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold flex items-center gap-1">
                <span className="text-white">{storeProfile.storeName}</span>
                <span className="text-[#D4AF37]"> {storeProfile.storeNameAccent}</span>
              </h1>
              <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${
                        isActive
                          ? "bg-[#D4AF37] text-black font-semibold"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm">{item.label}</span>
                      {item.badge && (
                        <span className={`${item.badgeColor || 'bg-red-500'} text-white text-xs font-bold px-1.5 py-0.5 rounded-full ml-auto`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex-shrink-0 p-2 border-t border-gray-800 space-y-1">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-blue-400 hover:bg-gray-800 hover:text-blue-300 transition-colors w-full"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="text-sm">{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors w-full"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Logout</span>
            </button>
          </div>

          <div className="p-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 text-center">Swipe right to close</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:ml-56 pt-16 lg:pt-0 overflow-auto min-h-screen">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
