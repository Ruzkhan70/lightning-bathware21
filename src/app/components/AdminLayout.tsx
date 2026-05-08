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
  Sun,
  Moon,
  Receipt,
} from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { useTheme } from "../context/ThemeContext";
import ScrollToTop from "./ScrollToTop";
import SessionWarning from "./admin/SessionWarning";
import { useAdminTimeout } from "../hooks/useAdminTimeout";

export default function AdminLayout() {
  const { isAdminLoggedIn, isDataLoaded, logout, triggerLogout, products, storeProfile, messages } = useAdmin();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);
  const isSwiping = useRef(false);

  const { showWarning, remainingTime, resetTimer, logoutNow, isRememberMe, setRememberMe } = useAdminTimeout(
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

  useEffect(() => {
    const checkScreenSize = () => setIsDesktop(window.innerWidth >= 768);
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;

    const deltaX = Math.abs(touchEndX.current - touchStartX.current);
    const deltaY = Math.abs(touchEndY.current - touchStartY.current);

    if (deltaY > deltaX && deltaY > 10) {
      isSwiping.current = false;
    } else if (deltaX > 10) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;

    const swipeThreshold = 60;
    const diff = touchEndX.current - touchStartX.current;

    if (mobileMenuOpen) {
      if (diff < -swipeThreshold) {
        closeMobileMenu();
      }
    } else {
      if (diff > swipeThreshold) {
        setMobileMenuOpen(true);
      }
    }

    touchStartX.current = 0;
    touchStartY.current = 0;
    touchEndX.current = 0;
    touchEndY.current = 0;
    isSwiping.current = false;
  };

  const handleMainContentTouchStart = (e: React.TouchEvent) => {
    if (isDesktop) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  const handleMainContentTouchMove = (e: React.TouchEvent) => {
    if (isDesktop) return;
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;

    const deltaX = Math.abs(touchEndX.current - touchStartX.current);
    const deltaY = Math.abs(touchEndY.current - touchStartY.current);

    if (deltaY > deltaX && deltaY > 10) {
      isSwiping.current = false;
    } else if (deltaX > 10) {
      isSwiping.current = true;
    }
  };

  const handleMainContentTouchEnd = () => {
    if (isDesktop) return;
    if (!isSwiping.current) return;

    const swipeThreshold = 60;
    const diff = touchEndX.current - touchStartX.current;

    if (diff > swipeThreshold) {
      setMobileMenuOpen(true);
    }

    touchStartX.current = 0;
    touchStartY.current = 0;
    touchEndX.current = 0;
    touchEndY.current = 0;
    isSwiping.current = false;
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
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
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
      icon: Receipt,
      label: "Invoice Generator",
      path: "/admin/invoice-generator",
    },
    {
      icon: FileText,
      label: "Invoices",
      path: "/admin/invoices",
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
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-black dark:bg-gray-900 text-white z-50 flex items-center justify-between px-4">
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
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileMenu}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      )}

      <div className="min-h-screen bg-muted dark:bg-gray-950">
        <ScrollToTop />
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-56 bg-black dark:bg-gray-900 text-white flex-col">
          <div className="p-4 border-b border-gray-800 flex-shrink-0">
            <h1 className="text-lg font-bold flex items-center gap-1">
              <span className="text-white">{storeProfile.storeName}</span>
              <span className="text-[#D4AF37]"> {storeProfile.storeNameAccent}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Admin Panel</p>
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
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-300 hover:bg-gray-800 hover:text-white transition-colors w-full"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
              <span className="text-sm">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
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
        className={`lg:hidden fixed left-0 top-0 h-screen w-72 bg-black dark:bg-gray-900 text-white flex flex-col z-50 transition-transform duration-300 ease-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ boxShadow: mobileMenuOpen ? "4px 0 25px rgba(0,0,0,0.5)" : "none", touchAction: "pan-y" }}
      >
          <div className="p-4 border-b border-gray-800 flex-shrink-0 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold flex items-center gap-1">
                <span className="text-white">{storeProfile.storeName}</span>
                <span className="text-[#D4AF37]"> {storeProfile.storeNameAccent}</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-1">Admin Panel</p>
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
                    <Link to={item.path} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${
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
        </aside>

        {/* Main Content */}
        <main
          className="lg:ml-56 pt-16 lg:pt-0 overflow-auto min-h-screen"
          onTouchStart={handleMainContentTouchStart}
          onTouchMove={handleMainContentTouchMove}
          onTouchEnd={handleMainContentTouchEnd}
        >
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
