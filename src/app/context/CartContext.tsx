import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { db } from "../../firebase";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  isAvailable: boolean;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Omit<CartItem, "quantity">) => void;
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
          const merged = mergeCarts(cartItems, firebaseCart);
          setCartItems(merged);
          await setDoc(cartRef, {
            items: merged,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }
      } else {
        await setDoc(cartRef, {
          items: cartItems,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (error) {
      console.error("Error syncing cart with Firebase:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [cartItems]);

  const saveCartToFirebase = useCallback(async (userId: string, items: CartItem[]) => {
    if (!userId) return;
    try {
      const cartRef = doc(db, "carts", userId);
      await setDoc(cartRef, {
        items,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.error("Error saving cart to Firebase:", error);
    }
  }, []);

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        if (user?.id) {
          saveCartToFirebase(user.id, cartItems);
        }
      } catch (error) {
        console.error("Error getting user ID for cart sync:", error);
      }
    }
  }, [cartItems, saveCartToFirebase]);

  const addToCart = (product: Omit<CartItem, "quantity">) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
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
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

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
