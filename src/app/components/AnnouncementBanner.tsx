import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { X, Bell, Tag, FileText, Package, Info } from "lucide-react";
import { useAnnouncement, Announcement } from "../context/AnnouncementContext";
import { useAdmin } from "../context/AdminContext";

const DISMISSAL_KEY = "announcement_dismissed";
const DISMISSAL_TIME_KEY = "announcement_dismissed_time";

export default function AnnouncementBanner() {
  const navigate = useNavigate();
  const { currentAnnouncement, isLoading } = useAnnouncement();
  const { isAdminLoggedIn } = useAdmin();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    console.log('[Announcement] Debug:', {
      isLoading,
      currentAnnouncement,
      isAdminLoggedIn,
      localDismissed: localStorage.getItem(DISMISSAL_KEY)
    });
    
    if (!isLoading && currentAnnouncement && !isAdminLoggedIn) {
      const dismissedId = localStorage.getItem(DISMISSAL_KEY);
      const dismissedTime = localStorage.getItem(DISMISSAL_TIME_KEY);
      
      console.log('[Announcement] Checking dismissed:', { dismissedId, currentId: currentAnnouncement.id });
      
      if (dismissedId === currentAnnouncement.id && dismissedTime) {
        const dismissedAt = parseInt(dismissedTime);
        const hoursSinceDismissed = (Date.now() - dismissedAt) / (1000 * 60 * 60);
        console.log('[Announcement] Hours since dismissed:', hoursSinceDismissed);
        if (hoursSinceDismissed < 24) {
          setIsDismissed(true);
          return;
        }
      }
      
      console.log('[Announcement] Setting visible');
      setIsVisible(true);
    }
  }, [currentAnnouncement, isLoading, isAdminLoggedIn]);

  const handleDismiss = () => {
    if (currentAnnouncement) {
      localStorage.setItem(DISMISSAL_KEY, currentAnnouncement.id);
      localStorage.setItem(DISMISSAL_TIME_KEY, Date.now().toString());
    }
    setIsVisible(false);
    setIsDismissed(true);
  };

  const handleClick = () => {
    switch (currentAnnouncement?.type) {
      case "offer":
        navigate("/offers");
        break;
      case "terms":
        navigate("/terms");
        break;
      case "product":
        navigate("/products");
        break;
      default:
        navigate("/");
    }
  };

  const getTypeConfig = (type: Announcement["type"]) => {
    switch (type) {
      case "offer":
        return {
          bg: "bg-gradient-to-r from-[#D4AF37] to-[#B8962E]",
          text: "text-black",
          icon: <Tag className="w-5 h-5" />,
          label: "OFFER"
        };
      case "terms":
        return {
          bg: "bg-gradient-to-r from-purple-600 to-purple-700",
          text: "text-white",
          icon: <FileText className="w-5 h-5" />,
          label: "UPDATE"
        };
      case "product":
        return {
          bg: "bg-gradient-to-r from-blue-600 to-blue-700",
          text: "text-white",
          icon: <Package className="w-5 h-5" />,
          label: "NEW"
        };
      default:
        return {
          bg: "bg-gradient-to-r from-gray-800 to-gray-900",
          text: "text-white",
          icon: <Info className="w-5 h-5" />,
          label: "ANNOUNCEMENT"
        };
    }
  };

  if (isLoading || !isVisible || !currentAnnouncement || isDismissed || isAdminLoggedIn) {
    if (!isLoading && currentAnnouncement && isAdminLoggedIn) {
      console.log('[Announcement] Hidden because admin is logged in');
    }
    return null;
  }

  if (!currentAnnouncement.message || !currentAnnouncement.message.trim()) {
    console.log('[Announcement] Hidden because message is empty');
    return null;
  }

  const config = getTypeConfig(currentAnnouncement.type);

  return (
    <div className={`${config.bg} ${config.text} relative overflow-hidden`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handleClick}
            className="flex items-center gap-3 flex-1 text-left group"
          >
            <div className="flex-shrink-0 p-2 bg-white/20 rounded-lg">
              {config.icon}
            </div>
            <div className="flex-shrink-0 hidden sm:block px-2 py-1 bg-white/20 rounded text-xs font-bold uppercase tracking-wider">
              {config.label}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate group-hover:underline">
                {currentAnnouncement.title}
              </p>
              <p className="text-sm opacity-90 truncate hidden sm:block">
                {currentAnnouncement.message}
              </p>
            </div>
            <Bell className="w-5 h-5 flex-shrink-0 opacity-70" />
          </button>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Dismiss announcement"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
