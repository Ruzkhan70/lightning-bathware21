import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { db } from "../../firebase";
import { collection, addDoc, onSnapshot, query, orderBy, where, deleteDoc, doc, updateDoc, getDocs } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: "offer" | "terms" | "product" | "general";
  createdAt: any;
  expiresAt?: any;
  isActive: boolean;
  createdBy: string;
}

interface AnnouncementContextType {
  currentAnnouncement: Announcement | null;
  isLoading: boolean;
  createAnnouncement: (data: { title: string; message: string; type: Announcement["type"]; expiresInHours?: number }) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  expireAnnouncement: (id: string) => Promise<void>;
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined);

const DISMISSAL_KEY = "announcement_dismissed";
const DISMISSAL_TIME_KEY = "announcement_dismissed_time";

export function AnnouncementProvider({ children }: { children: ReactNode }) {
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkDismissed = (announcement: Announcement) => {
      const dismissedId = localStorage.getItem(DISMISSAL_KEY);
      const dismissedTime = localStorage.getItem(DISMISSAL_TIME_KEY);
      
      if (dismissedId === announcement.id && dismissedTime) {
        const dismissedAt = parseInt(dismissedTime);
        const hoursSinceDismissed = (Date.now() - dismissedAt) / (1000 * 60 * 60);
        if (hoursSinceDismissed < 24) {
          return false;
        }
      }
      return true;
    };

    const checkExpired = (announcement: Announcement) => {
      // Default to true if isActive is undefined
      const isActive = announcement.isActive === undefined ? true : announcement.isActive;
      if (!isActive) return false;
      if (announcement.expiresAt) {
        const expiresAt = announcement.expiresAt.toDate ? announcement.expiresAt.toDate() : new Date(announcement.expiresAt);
        if (expiresAt < new Date()) return false;
      }
      return true;
    };

    // Simple query without orderBy to avoid needing composite index
    const unsubscribe = onSnapshot(collection(db, "announcements"), (snapshot) => {
      if (snapshot.empty) {
        setCurrentAnnouncement(null);
        setIsLoading(false);
        return;
      }

      const announcementsList: Announcement[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        // Ensure isActive defaults to true if not present
        return {
          id: docSnap.id,
          ...data,
          isActive: data.isActive === undefined ? true : data.isActive
        } as Announcement;
      });

      // Filter for active and not expired, then sort by createdAt client-side
      const activeAnnouncements = announcementsList
        .filter(a => checkExpired(a) && checkDismissed(a))
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
          const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
          return bTime - aTime;
        });

      setCurrentAnnouncement(activeAnnouncements[0] || null);
      setIsLoading(false);
    }, (error) => {
      console.error("Announcements error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createAnnouncement = async (data: { title: string; message: string; type: Announcement["type"]; expiresInHours?: number }) => {
    try {
      const q = query(
        collection(db, "announcements"),
        where("isActive", "==", true)
      );
      const snapshot = await getDocs(q);
      
      for (const docSnap of snapshot.docs) {
        await updateDoc(doc(db, "announcements", docSnap.id), { isActive: false });
      }

      const expiresAt = data.expiresInHours
        ? new Date(Date.now() + data.expiresInHours * 60 * 60 * 1000)
        : null;

      await addDoc(collection(db, "announcements"), {
        title: data.title,
        message: data.message,
        type: data.type,
        isActive: true,
        createdAt: serverTimestamp(),
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
        createdBy: "admin",
      });
    } catch (error) {
      console.error("Error creating announcement:", error);
      throw error;
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      await deleteDoc(doc(db, "announcements", id));
    } catch (error) {
      console.error("Error deleting announcement:", error);
      throw error;
    }
  };

  const expireAnnouncement = async (id: string) => {
    try {
      await updateDoc(doc(db, "announcements", id), { isActive: false });
    } catch (error) {
      console.error("Error expiring announcement:", error);
      throw error;
    }
  };

  return (
    <AnnouncementContext.Provider
      value={{
        currentAnnouncement,
        isLoading,
        createAnnouncement,
        deleteAnnouncement,
        expireAnnouncement,
      }}
    >
      {children}
    </AnnouncementContext.Provider>
  );
}

export function useAnnouncement() {
  const context = useContext(AnnouncementContext);
  if (!context) {
    throw new Error("useAnnouncement must be used within AnnouncementProvider");
  }
  return context;
}
