import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export interface RecentlyViewedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  viewedAt: number;
}

interface RecentlyViewedContextType {
  products: RecentlyViewedProduct[];
  addProduct: (product: Omit<RecentlyViewedProduct, "viewedAt">) => void;
  clearHistory: () => void;
}

const RECENTLY_VIEWED_KEY = "recently_viewed_products";
const MAX_PRODUCTS = 10;

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (stored) {
      try {
        setProducts(JSON.parse(stored));
      } catch {
        setProducts([]);
      }
    }
  }, []);

  const saveToStorage = useCallback((items: RecentlyViewedProduct[]) => {
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(items));
  }, []);

  const addProduct = useCallback((product: Omit<RecentlyViewedProduct, "viewedAt">) => {
    setProducts(prev => {
      const existing = prev.findIndex(p => p.id === product.id);
      
      let updated: RecentlyViewedProduct[];
      
      if (existing !== -1) {
        updated = prev.filter(p => p.id !== product.id);
      } else {
        updated = [...prev];
      }
      
      const newProduct: RecentlyViewedProduct = {
        ...product,
        viewedAt: Date.now(),
      };
      
      updated.unshift(newProduct);
      
      if (updated.length > MAX_PRODUCTS) {
        updated = updated.slice(0, MAX_PRODUCTS);
      }
      
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const clearHistory = useCallback(() => {
    setProducts([]);
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
  }, []);

  return (
    <RecentlyViewedContext.Provider value={{ products, addProduct, clearHistory }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error("useRecentlyViewed must be used within RecentlyViewedProvider");
  }
  return context;
}

export default RecentlyViewedProvider;
