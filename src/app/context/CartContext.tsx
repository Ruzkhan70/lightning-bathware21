import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from "react";
import { db } from "../../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export interface CartItem {
  id: string;
  product_id?: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  isAvailable: boolean;
  selected_color?: string;
  selected_size?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  syncCartWithFirebase: (userId: string) => Promise<void>;
  isSyncing: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("cartItems");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as CartItem[];
        return parsed.map((item) => ({
          ...item,
          price: Number(item.price),
          quantity: Number(item.quantity),
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  const [isSyncing, setIsSyncing] = useState(false);
  
  // Ref for debounced Firebase sync
  const firebaseSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cartItemsRef = useRef(cartItems);
  
  // Keep ref updated with latest cartItems
  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const mergeCarts = (localCart: CartItem[], firebaseCart: CartItem[]): CartItem[] => {
    const mergedMap = new Map<string, CartItem>();

    for (const item of localCart) {
      mergedMap.set(item.id, item);
    }

    for (const fbItem of firebaseCart) {
      const existing = mergedMap.get(fbItem.id);
      if (existing) {
        mergedMap.set(fbItem.id, {
          ...fbItem,
          quantity: Math.max(existing.quantity, fbItem.quantity),
        });
      } else {
        mergedMap.set(fbItem.id, fbItem);
      }
    }

    return Array.from(mergedMap.values());
  };

  const syncCartWithFirebase = useCallback(async (userId: string): Promise<void> => {
    if (!userId) return;

    setIsSyncing(true);
    try {
      const cartRef = doc(db, "carts", userId);
      const cartDoc = await getDoc(cartRef);

      if (cartDoc.exists()) {
        const firebaseCart = cartDoc.data().items as CartItem[];
        if (firebaseCart && Array.isArray(firebaseCart)) {
          const merged = mergeCarts(cartItemsRef.current, firebaseCart);
          setCartItems(merged);
          await setDoc(cartRef, {
            items: merged,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }
      } else {
        await setDoc(cartRef, {
          items: cartItemsRef.current,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (error) {
      console.error("Error syncing cart with Firebase:", error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const saveCartToFirebaseDebounced = useCallback((userId: string, items: CartItem[]) => {
    // Clear existing timeout
    if (firebaseSyncTimeoutRef.current) {
      clearTimeout(firebaseSyncTimeoutRef.current);
    }
    
    // Set new timeout - debounce by 1.5 seconds
    firebaseSyncTimeoutRef.current = setTimeout(async () => {
      try {
        const cartRef = doc(db, "carts", userId);
        await setDoc(cartRef, {
          items,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (error) {
        console.error("Error saving cart to Firebase:", error);
      }
    }, 1500);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (firebaseSyncTimeoutRef.current) {
        clearTimeout(firebaseSyncTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        if (user?.id) {
          saveCartToFirebaseDebounced(user.id, cartItems);
        }
      } catch (error) {
        console.error("Error getting user ID for cart sync:", error);
      }
    }
  }, [cartItems, saveCartToFirebaseDebounced]);

  const addToCart = (product: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    const qty = product.quantity || 1;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { ...product, quantity: qty }];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  };

  const clearCart = () => {
    // Clear pending sync
    if (firebaseSyncTimeoutRef.current) {
      clearTimeout(firebaseSyncTimeoutRef.current);
    }
    
    setCartItems([]);
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        if (user?.id) {
          const cartRef = doc(db, "carts", user.id);
          setDoc(cartRef, { items: [], updatedAt: new Date().toISOString() }, { merge: true });
        }
      } catch (error) {
        console.error("Error clearing Firebase cart:", error);
      }
    }
  };

  // Memoize cartTotal and cartCount to prevent recalculation on every render
  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        syncCartWithFirebase,
        isSyncing,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
