import { useState, useEffect } from "react";
import { X, Tag, Plus, FileText, Info } from "lucide-react";
import { useAnnouncement, Announcement } from "../context/AnnouncementContext";

const DISMISSAL_KEY = "announcement_dismissed";
const DISMISSAL_TIME_KEY = "announcement_dismissed_time";

const getTypeConfig = (type: string) => {
  switch (type) {
    case "offer":
      return {
        gradient: "from-[#D4AF37] to-[#B8962E]",
        icon: Tag,
        label: "OFFER"
      };
    case "product":
      return {
        gradient: "from-blue-600 to-blue-700",
        icon: Plus,
        label: "NEW"
      };
    case "general":
      return {
        gradient: "from-orange-500 to-orange-600",
        icon: Info,
        label: "NEW"
      };
    default:
      return {
        gradient: "from-gray-800 to-gray-900",
        icon: FileText,
        label: "NOTICE"
      };
  }
};

export default function AnnouncementBanner() {
  const { currentAnnouncement, isLoading } = useAnnouncement();
  const [isVisible, setIsVisible] = useState(false);

  const config = currentAnnouncement ? getTypeConfig(currentAnnouncement.type) : null;
  const TypeIcon = config?.icon || Info;

  useEffect(() => {
    if (!isLoading && currentAnnouncement) {
      const dismissedId = localStorage.getItem(DISMISSAL_KEY);
      const dismissedTime = localStorage.getItem(DISMISSAL_TIME_KEY);
      
      if (dismissedId === currentAnnouncement.id && dismissedTime) {
        const dismissedAt = parseInt(dismissedTime);
        const hoursSinceDismissed = (Date.now() - dismissedAt) / (1000 * 60 * 60);
        
        const announcementCreatedAt = currentAnnouncement.createdAt?.toDate?.()?.getTime() || Date.now();
        const dismissedBeforeCreated = dismissedAt > announcementCreatedAt;
        
        if (hoursSinceDismissed < 24 && !dismissedBeforeCreated) {
          setIsVisible(false);
          return;
        }
      }
      
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [currentAnnouncement, isLoading]);

  const handleDismiss = () => {
    if (currentAnnouncement) {
      localStorage.setItem(DISMISSAL_KEY, currentAnnouncement.id);
      localStorage.setItem(DISMISSAL_TIME_KEY, Date.now().toString());
    }
    setIsVisible(false);
  };

  if (isLoading || !isVisible || !currentAnnouncement) {
    return null;
  }

  if (!currentAnnouncement.message || !currentAnnouncement.message.trim()) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r ${config?.gradient} text-white relative overflow-hidden`}>
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <TypeIcon className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm truncate">
              <span className="font-semibold">{currentAnnouncement.title}</span>
              {currentAnnouncement.message && " — "}
              <span className="opacity-90">{currentAnnouncement.message}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {config?.label && (
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-medium hidden sm:inline-block">
                {config.label}
              </span>
            )}
            <button
              onClick={handleDismiss}
              className="p-1.5 hover:bg-white/20 rounded transition-colors"
              aria-label="Dismiss announcement"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
