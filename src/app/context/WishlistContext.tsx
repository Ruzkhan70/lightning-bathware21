import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { useUser } from "./UserContext";
import { toast } from "sonner";

interface WishlistContextType {
  wishlist: string[];
  addToWishlist: (id: string) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  isLoading: boolean;
  isWishlistConfirmed: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn } = useUser();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWishlistConfirmed, setIsWishlistConfirmed] = useState(false);

  // Load initial wishlist and set up real-time listener
  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
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
      setIsLoading(false);
      setIsWishlistConfirmed(true); // localStorage is instant confirmation
      return;
    }

    // Logged in: Get authoritative server data FIRST, then set up listener
    const wishlistRef = doc(db, "wishlist", user.id);
    
    const loadWishlist = async () => {
      try {
        // Get authoritative server data FIRST (not from cache)
        const wishlistDoc = await getDoc(wishlistRef);
        
        if (wishlistDoc.exists() && wishlistDoc.data().items) {
          setWishlist(wishlistDoc.data().items);
        } else {
          // Initialize empty wishlist for new users
          await setDoc(wishlistRef, { items: [] }, { merge: true });
          setWishlist([]);
        }
        
        // NOW set as confirmed - we have authoritative data
        setIsLoading(false);
        setIsWishlistConfirmed(true);
        
        // Set up real-time listener for future updates
        const unsubscribe = onSnapshot(wishlistRef, (snapshot) => {
          if (snapshot.exists() && snapshot.data().items) {
            setWishlist(snapshot.data().items);
          }
        }, (error) => {
          console.error("Error in wishlist listener:", error);
        });

        return unsubscribe;
      } catch (error) {
        console.error("Error loading wishlist:", error);
        setIsLoading(false);
        setIsWishlistConfirmed(true); // Confirm on error to avoid infinite loading
        return () => {};
      }
    };

    const unsubscribePromise = loadWishlist();
    
    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe());
    };
  }, [isLoggedIn, user?.id]);

  // Sync to localStorage when not logged in
  useEffect(() => {
    if (!isLoggedIn && wishlist.length >= 0) {
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    }
  }, [wishlist, isLoggedIn]);

  const addToWishlist = (id: string) => {
    if (isLoggedIn && user?.id) {
      const newWishlist = wishlist.includes(id) ? wishlist : [...wishlist, id];
      setDoc(doc(db, "wishlist", user.id), { items: newWishlist }, { merge: true }).catch(err => {
        console.error("Error saving wishlist:", err);
        toast.error("Failed to save wishlist");
      });
    } else {
      setWishlist((prev) => {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      });
    }
  };

  const removeFromWishlist = (id: string) => {
    if (isLoggedIn && user?.id) {
      const newWishlist = wishlist.filter((item) => item !== id);
      setDoc(doc(db, "wishlist", user.id), { items: newWishlist }, { merge: true }).catch(err => {
        console.error("Error saving wishlist:", err);
        toast.error("Failed to save wishlist");
      });
    } else {
      setWishlist((prev) => prev.filter((item) => item !== id));
    }
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
        isWishlistConfirmed,
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
