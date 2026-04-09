import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { db } from "../../firebase";
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { useUser } from "./UserContext";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "product" | "offer" | "terms" | "update" | "order";
  targetId?: string;
  createdAt: any;
  isActive: boolean;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (notificationId: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, "id" | "createdAt" | "isActive">) => Promise<void>;
  isRead: (notificationId: string) => boolean;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userReadNotifications, setUserReadNotifications] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoggedIn } = useUser();

  useEffect(() => {
    if (!isLoggedIn) {
      setNotifications([]);
      setUserReadNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const notificationsRef = collection(db, "notifications");
    const q = query(notificationsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const notifs: Notification[] = [];
      
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

      const userNotifRef = doc(db, "userNotifications", user.id);
      const userNotifDoc = await getDoc(userNotifRef);
      
      if (userNotifDoc.exists()) {
        setUserReadNotifications(userNotifDoc.data().readNotifications || []);
      } else {
        setUserReadNotifications([]);
      }
      
      setIsLoading(false);
    }, (error) => {
      console.error("Notifications error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isLoggedIn, user?.id]);

  const isRead = useCallback((notificationId: string) => {
    return userReadNotifications.includes(notificationId);
  }, [userReadNotifications]);

  const unreadCount = notifications.filter(n => !isRead(n.id)).length;

  const markAsRead = async (notificationId: string) => {
    if (!user || isRead(notificationId)) return;

    try {
      const userNotifRef = doc(db, "userNotifications", user.id);
      await setDoc(userNotifRef, {
        readNotifications: arrayUnion(notificationId),
        lastUpdated: serverTimestamp(),
      }, { merge: true });
      
      setUserReadNotifications(prev => [...prev, notificationId]);
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const unreadIds = notifications.filter(n => !isRead(n.id)).map(n => n.id);
      
      if (unreadIds.length === 0) return;

      const userNotifRef = doc(db, "userNotifications", user.id);
      await setDoc(userNotifRef, {
        readNotifications: [...new Set([...userReadNotifications, ...unreadIds])],
        lastUpdated: serverTimestamp(),
      }, { merge: true });
      
      setUserReadNotifications(prev => [...new Set([...prev, ...unreadIds])]);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    if (!user) return;

    try {
      const userNotifRef = doc(db, "userNotifications", user.id);
      await setDoc(userNotifRef, {
        dismissedNotifications: arrayUnion(notificationId),
        lastUpdated: serverTimestamp(),
      }, { merge: true });
      
      await markAsRead(notificationId);
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  const addNotification = async (notification: Omit<Notification, "id" | "createdAt" | "isActive">) => {
    try {
      const notificationsRef = collection(db, "notifications");
      await addDoc(notificationsRef, {
        ...notification,
        isActive: true,
        createdAt: serverTimestamp(),
      });
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
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        addNotification,
        isRead,
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
