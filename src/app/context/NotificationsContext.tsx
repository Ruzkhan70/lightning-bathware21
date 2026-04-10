import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { db } from "../../firebase";
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { useUser } from "./UserContext";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "product" | "offer" | "terms" | "update" | "order";
  targetId?: string;
  createdAt: Timestamp | Date | null;
  isActive: boolean;
}

interface NotificationsContextType {
  notifications: Notification[];
  activeBanner: Notification | null;
  isLoading: boolean;
  dismissBanner: (notificationId: string) => void;
  addNotification: (notification: Omit<Notification, "id" | "createdAt" | "isActive">) => Promise<void>;
  hideBanner: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const BANNER_DISMISSED_KEY = "banner_dismissed_ids";
const TRACKED_NOTIFICATIONS_KEY = "tracked_notification_ids";

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeBanner, setActiveBanner] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoggedIn } = useUser();
  const [trackedIds, setTrackedIds] = useState<string[]>([]);

  // Load dismissed IDs from localStorage
  const getDismissedIds = useCallback((): string[] => {
    try {
      const stored = localStorage.getItem(BANNER_DISMISSED_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  // Save dismissed ID to localStorage
  const addDismissedId = useCallback((id: string) => {
    try {
      const dismissed = getDismissedIds();
      if (!dismissed.includes(id)) {
        dismissed.push(id);
        localStorage.setItem(BANNER_DISMISSED_KEY, JSON.stringify(dismissed));
      }
    } catch (e) {
      console.error("Error saving dismissed ID:", e);
    }
  }, [getDismissedIds]);

  // Load tracked notification IDs from localStorage
  const getTrackedIds = useCallback((): string[] => {
    try {
      const stored = localStorage.getItem(TRACKED_NOTIFICATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  // Save tracked ID to localStorage
  const addTrackedId = useCallback((id: string) => {
    try {
      const tracked = getTrackedIds();
      if (!tracked.includes(id)) {
        tracked.push(id);
        localStorage.setItem(TRACKED_NOTIFICATIONS_KEY, JSON.stringify(tracked));
      }
    } catch (e) {
      console.error("Error saving tracked ID:", e);
    }
  }, [getTrackedIds]);

  useEffect(() => {
    if (!isLoggedIn) {
      setNotifications([]);
      setActiveBanner(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const notificationsRef = collection(db, "notifications");
    const q = query(notificationsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const notifs: Notification[] = [];
      const dismissedIds = getDismissedIds();
      const previouslyTracked = getTrackedIds();
      
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.isActive !== false) {
          notifs.push({
            id: docSnap.id,
            ...data,
          } as Notification);
        }
      });

      setNotifications(notifs);
      setTrackedIds(previouslyTracked);

      // Find the most recent notification that hasn't been dismissed or shown as banner
      const newNotifications = notifs.filter(n => 
        !dismissedIds.includes(n.id) && 
        !previouslyTracked.includes(n.id)
      );

      if (newNotifications.length > 0) {
        // Show the most recent one as banner
        const newest = newNotifications[0];
        setActiveBanner(newest);
        
        // Mark it as tracked so it won't be shown again
        addTrackedId(newest.id);
        setTrackedIds(prev => [...prev, newest.id]);
      }
      
      setIsLoading(false);
    }, (error) => {
      console.error("Notifications error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isLoggedIn, user?.id, getDismissedIds, getTrackedIds, addTrackedId]);

  const dismissBanner = useCallback((notificationId: string) => {
    setActiveBanner(null);
    addDismissedId(notificationId);
  }, [addDismissedId]);

  const hideBanner = useCallback(() => {
    setActiveBanner(null);
  }, []);

  const addNotification = async (notification: Omit<Notification, "id" | "createdAt" | "isActive">) => {
    try {
      const notificationsRef = collection(db, "notifications");
      const docRef = await addDoc(notificationsRef, {
        ...notification,
        isActive: true,
        createdAt: serverTimestamp(),
      });
      
      // Mark this new notification as tracked immediately so it won't show as banner
      // (it will show through the real-time listener for other users)
      addTrackedId(docRef.id);
      setTrackedIds(prev => [...prev, docRef.id]);
      
      toast.success("Notification sent to all users!");
    } catch (error) {
      console.error("Error adding notification:", error);
      toast.error("Failed to create notification");
    }
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        activeBanner,
        isLoading,
        dismissBanner,
        addNotification,
        hideBanner,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return context;
}

export function createNotification(
  type: Notification["type"],
  title: string,
  message: string,
  targetId?: string
) {
  return { type, title, message, targetId };
}
