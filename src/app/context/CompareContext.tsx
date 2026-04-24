import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product } from "./AdminContext";

interface CompareContextType {
  compareList: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;
  toggleCompare: (product: Product) => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareList, setCompareList] = useState<Product[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("compareList");
    if (saved) {
      try {
        setCompareList(JSON.parse(saved));
      } catch {
        setCompareList([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("compareList", JSON.stringify(compareList));
  }, [compareList]);

  const addToCompare = (product: Product) => {
    setCompareList(prev => {
      if (prev.length >= 4) return prev;
      if (prev.find(p => p.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  const removeFromCompare = (productId: string) => {
    setCompareList(prev => prev.filter(p => p.id !== productId));
  };

  const isInCompare = (productId: string) => {
    return compareList.some(p => p.id === productId);
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  const toggleCompare = (product: Product) => {
    if (isInCompare(product.id)) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  };

  return (
    <CompareContext.Provider value={{
      compareList,
      addToCompare,
      removeFromCompare,
      isInCompare,
      clearCompare,
      toggleCompare,
    }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within CompareProvider");
  }
  return context;
}