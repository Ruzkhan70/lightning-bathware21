import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { useUser } from "./UserContext";

interface WishlistContextType {
  wishlist: string[];
  addToWishlist: (id: string) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  isLoading: boolean;
  shareWishlist: () => string;
  addMultipleToWishlist: (ids: string[]) => void;
  getShareableUrl: () => string;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn } = useUser();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Load initial wishlist
  useEffect(() => {
    const loadWishlist = async () => {
      if (isLoggedIn && user?.id) {
        // Logged in: load from Firebase
        try {
          const wishlistDoc = await getDoc(doc(db, "wishlist", user.id));
          if (wishlistDoc.exists() && wishlistDoc.data().items) {
            setWishlist(wishlistDoc.data().items);
          } else {
            // Initialize empty wishlist in Firebase for new users
            await setDoc(doc(db, "wishlist", user.id), { items: [] }, { merge: true });
            setWishlist([]);
          }
        } catch (error) {
          console.error("Error loading wishlist:", error);
          setWishlist([]);
        }
      } else {
        // Not logged in: load from localStorage
        const saved = localStorage.getItem("wishlist");
        if (saved) {
          try {
            setWishlist(JSON.parse(saved));
          } catch {
            setWishlist([]);
          }
        } else {
          setWishlist([]);
        }
      }
      setIsLoading(false);
      setInitialLoadDone(true);
    };

    loadWishlist();
  }, [isLoggedIn, user?.id]);

  // Sync to Firebase when logged in
  useEffect(() => {
    if (isLoggedIn && user?.id && initialLoadDone && wishlist.length >= 0) {
      setDoc(doc(db, "wishlist", user.id), { items: wishlist }, { merge: true }).catch(err => {
        console.error("Error saving wishlist:", err);
      });
    }
  }, [wishlist, isLoggedIn, user?.id, initialLoadDone]);

  // Sync to localStorage when not logged in
  useEffect(() => {
    if (!isLoggedIn && initialLoadDone) {
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    }
  }, [wishlist, isLoggedIn, initialLoadDone]);

  const addToWishlist = (id: string) => {
    setWishlist((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  };

  const removeFromWishlist = (id: string) => {
    setWishlist((prev) => prev.filter((item) => item !== id));
  };

  const isInWishlist = (id: string) => {
    return wishlist.includes(id);
  };

  const getShareableUrl = useCallback(() => {
    if (wishlist.length === 0) return "";
    const baseUrl = window.location.origin;
    const encodedIds = btoa(wishlist.join(","));
    return `${baseUrl}?wishlist=${encodedIds}`;
  }, [wishlist]);

  const shareWishlist = useCallback(async () => {
    if (wishlist.length === 0) return "";
    
    const url = getShareableUrl();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Wishlist",
          text: "Check out my wishlist from Lightning Bathware!",
          url: url,
        });
        return url;
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          await navigator.clipboard.writeText(url);
          return url;
        }
      }
    } else {
      await navigator.clipboard.writeText(url);
      return url;
    }
    return url;
  }, [wishlist, getShareableUrl]);

  const addMultipleToWishlist = useCallback((ids: string[]) => {
    setWishlist((prev) => {
      const uniqueIds = ids.filter((id) => !prev.includes(id));
      if (uniqueIds.length === 0) return prev;
      return [...prev, ...uniqueIds];
    });
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        isLoading,
        shareWishlist,
        addMultipleToWishlist,
        getShareableUrl,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
}
