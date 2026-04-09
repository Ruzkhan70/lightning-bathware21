import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Bell, Package, Tag, FileText, RefreshCw, X, Check, TrendingUp } from "lucide-react";
import { useNotifications, Notification } from "../context/NotificationsContext";
import { useUser } from "../context/UserContext";

export default function NotificationBell() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUser();
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismissNotification, isRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isLoggedIn) return null;

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "product":
        return <Package className="w-5 h-5 text-blue-500" />;
      case "offer":
        return <Tag className="w-5 h-5 text-green-500" />;
      case "terms":
        return <FileText className="w-5 h-5 text-purple-500" />;
      case "update":
        return <RefreshCw className="w-5 h-5 text-orange-500" />;
      case "order":
        return <TrendingUp className="w-5 h-5 text-emerald-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "product":
        return "bg-blue-50 border-blue-200";
      case "offer":
        return "bg-green-50 border-green-200";
      case "terms":
        return "bg-purple-50 border-purple-200";
      case "update":
        return "bg-orange-50 border-orange-200";
      case "order":
        return "bg-emerald-50 border-emerald-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    
    switch (notification.type) {
      case "product":
        if (notification.targetId) {
          navigate(`/products`);
        } else {
          navigate("/products");
        }
        break;
      case "offer":
        navigate("/offers");
        break;
      case "terms":
        navigate("/terms");
        break;
      case "order":
        navigate("/account");
        break;
      default:
        navigate("/");
    }
    
    setIsOpen(false);
  };

  const formatTimeAgo = (createdAt: any) => {
    if (!createdAt) return "Just now";
    
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-white/10 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center min-w-[20px] min-h-[20px]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8962E] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-black">
              <Bell className="w-5 h-5" />
              <h3 className="font-bold">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-black text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
                className="text-xs text-black/70 hover:text-black flex items-center gap-1 bg-black/10 px-2 py-1 rounded-full"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">We'll notify you when something new happens</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`relative p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer ${!isRead(notification.id) ? "bg-blue-50/50" : ""}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {!isRead(notification.id) && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                  
                  <div className="flex gap-3 pl-4">
                    <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                      {getIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(notification.id);
                          }}
                          className="p-1 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                          aria-label="Dismiss notification"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 10 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/notifications");
                }}
                className="text-sm text-[#D4AF37] hover:underline font-medium"
              >
                View all {notifications.length} notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
