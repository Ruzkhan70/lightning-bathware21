import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { useUser } from "./UserContext";

interface WishlistContextType {
  wishlist: string[];
  addToWishlist: (id: string) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  isLoading: boolean;
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

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        isLoading,
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
