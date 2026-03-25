import { useEffect, useState } from "react";
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
} from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import ScrollToTop from "./ScrollToTop";
import { toast } from "sonner";

export default function AdminLayout() {
  const { isAdminLoggedIn, logout } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isAdminLoggedIn) {
      navigate("/admin/login");
    }
  }, [isAdminLoggedIn, navigate]);

  if (!isAdminLoggedIn) {
    return null;
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
      icon: Tag,
      label: "Offers",
      path: "/admin/offers",
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
      icon: Settings,
      label: "Settings",
      path: "/admin/settings",
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Reload the page without logging out
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <ScrollToTop />
      {/* Sidebar */}
      <aside className="w-64 bg-black text-white flex-shrink-0">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">
            <span className="text-white">Lightning</span>
            <span className="text-[#D4AF37]"> Bathware</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">Admin Panel</p>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                        ? "bg-[#D4AF37] text-black font-semibold"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-800 space-y-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-blue-400 hover:bg-gray-800 hover:text-blue-300 transition-colors w-full"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}