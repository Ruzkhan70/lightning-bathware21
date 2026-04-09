import { useState, useEffect } from "react";
import { X, Info } from "lucide-react";
import { useAnnouncement, Announcement } from "../context/AnnouncementContext";
import { useAdmin } from "../context/AdminContext";

const DISMISSAL_KEY = "announcement_dismissed";
const DISMISSAL_TIME_KEY = "announcement_dismissed_time";

export default function AnnouncementBanner() {
  const { currentAnnouncement, isLoading } = useAnnouncement();
  const { isAdminLoggedIn } = useAdmin();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!isLoading && currentAnnouncement && !isAdminLoggedIn) {
      const dismissedId = localStorage.getItem(DISMISSAL_KEY);
      const dismissedTime = localStorage.getItem(DISMISSAL_TIME_KEY);
      
      if (dismissedId === currentAnnouncement.id && dismissedTime) {
        const dismissedAt = parseInt(dismissedTime);
        const hoursSinceDismissed = (Date.now() - dismissedAt) / (1000 * 60 * 60);
        if (hoursSinceDismissed < 24) {
          setIsDismissed(true);
          return;
        }
      }
      
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

  if (isLoading || !isVisible || !currentAnnouncement || isDismissed || isAdminLoggedIn) {
    return null;
  }

  if (!currentAnnouncement.message || !currentAnnouncement.message.trim()) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white relative overflow-hidden">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Info className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">
              <span className="font-semibold">{currentAnnouncement.title}</span>
              {currentAnnouncement.message && " — "}
              <span className="opacity-90">{currentAnnouncement.message}</span>
            </p>
          </div>
          
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
