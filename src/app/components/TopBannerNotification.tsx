import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { X, Package, Tag, FileText, RefreshCw, TrendingUp, Bell, Info } from "lucide-react";
import { useAnnouncement, Announcement } from "../context/AnnouncementContext";
import { useUser } from "../context/UserContext";

const getTypeConfig = (type: Announcement["type"]) => {
  switch (type) {
    case "product":
      return {
        bgColor: "bg-gradient-to-r from-blue-500 to-blue-600",
        icon: Package,
        navigateTo: "/products",
      };
    case "offer":
      return {
        bgColor: "bg-gradient-to-r from-green-500 to-green-600",
        icon: Tag,
        navigateTo: "/offers",
      };
    case "terms":
      return {
        bgColor: "bg-gradient-to-r from-orange-500 to-orange-600",
        icon: FileText,
        navigateTo: "/terms",
      };
    case "update":
      return {
        bgColor: "bg-gradient-to-r from-gray-600 to-gray-700",
        icon: RefreshCw,
        navigateTo: "/products",
      };
    case "order":
      return {
        bgColor: "bg-gradient-to-r from-emerald-500 to-emerald-600",
        icon: TrendingUp,
        navigateTo: "/account",
      };
    case "general":
      return {
        bgColor: "bg-gradient-to-r from-gray-700 to-gray-800",
        icon: Info,
        navigateTo: "/",
      };
    default:
      return {
        bgColor: "bg-gradient-to-r from-gray-700 to-gray-800",
        icon: Bell,
        navigateTo: "/",
      };
  }
};

const DISMISSAL_KEY = "announcement_dismissed";

export default function TopBannerNotification() {
  const navigate = useNavigate();
  const { currentAnnouncement, expireAnnouncement, isLoading } = useAnnouncement();
  const { isLoggedIn } = useUser();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (currentAnnouncement && isLoggedIn && !isLoading) {
      // Check if dismissed
      const dismissedId = localStorage.getItem(DISMISSAL_KEY);
      const dismissedTime = localStorage.getItem(`${DISMISSAL_KEY}_time`);
      
      let shouldShow = true;
      if (dismissedId === currentAnnouncement.id && dismissedTime) {
        const dismissedAt = parseInt(dismissedTime);
        const hoursSinceDismissed = (Date.now() - dismissedAt) / (1000 * 60 * 60);
        if (hoursSinceDismissed < 24) {
          shouldShow = false;
        }
      }
      
      if (shouldShow) {
        requestAnimationFrame(() => {
          setIsVisible(true);
          setIsAnimating(true);
        });
      }
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentAnnouncement, isLoggedIn, isLoading]);

  const handleBannerClick = () => {
    if (!currentAnnouncement) return;
    
    const config = getTypeConfig(currentAnnouncement.type);
    navigate(config.navigateTo);
    // Dismiss banner
    localStorage.setItem(DISMISSAL_KEY, currentAnnouncement.id);
    localStorage.setItem(`${DISMISSAL_KEY}_time`, Date.now().toString());
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentAnnouncement) {
      localStorage.setItem(DISMISSAL_KEY, currentAnnouncement.id);
      localStorage.setItem(`${DISMISSAL_KEY}_time`, Date.now().toString());
    }
  };

  if (!isLoggedIn || !isVisible || !currentAnnouncement) {
    return null;
  }

  const config = getTypeConfig(currentAnnouncement.type);
  const Icon = config.icon;

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-[9999] 
        ${config.bgColor} 
        text-white 
        shadow-lg
        transition-transform duration-300 ease-out
        ${isAnimating ? "translate-y-0" : "-translate-y-full"}
      `}
    >
      <div 
        className="container mx-auto px-4 py-3 cursor-pointer hover:opacity-95 transition-opacity"
        onClick={handleBannerClick}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left: Icon */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Icon className="w-5 h-5" />
            </div>
          </div>

          {/* Center: Message */}
          <div className="flex-1 min-w-0 text-center">
            <p className="font-semibold text-sm sm:text-base truncate">
              {currentAnnouncement.title}
            </p>
            <p className="text-xs sm:text-sm opacity-90 truncate">
              {currentAnnouncement.message}
            </p>
          </div>

          {/* Right: Dismiss Button */}
          <div className="flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors backdrop-blur-sm"
              aria-label="Dismiss notification"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
