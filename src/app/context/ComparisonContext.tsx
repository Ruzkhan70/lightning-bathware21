import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useUser } from "./UserContext";

const MAX_COMPARISON = 4;
const COMPARISON_KEY = "product_comparison";

interface ComparisonContextType {
  compareList: string[];
  addToCompare: (id: string) => boolean;
  removeFromCompare: (id: string) => void;
  isInCompare: (id: string) => boolean;
  clearCompare: () => void;
  isLoading: boolean;
  canAddMore: boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn } = useUser();
  const [compareList, setCompareList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    const loadComparison = async () => {
      if (isLoggedIn && user?.id) {
        try {
          const compareDoc = await getDoc(doc(db, "comparison", user.id));
          if (compareDoc.exists() && compareDoc.data().items) {
            setCompareList(compareDoc.data().items);
          }
        } catch (error) {
          console.error("Error loading comparison:", error);
        }
      } else {
        const saved = localStorage.getItem(COMPARISON_KEY);
        if (saved) {
          try {
            setCompareList(JSON.parse(saved));
          } catch {
            setCompareList([]);
          }
        }
      }
      setIsLoading(false);
      setInitialLoadDone(true);
    };

    loadComparison();
  }, [isLoggedIn, user?.id]);

  useEffect(() => {
    if (isLoggedIn && user?.id && initialLoadDone) {
      setDoc(doc(db, "comparison", user.id), { items: compareList }, { merge: true }).catch(err => {
        console.error("Error saving comparison:", err);
      });
    } else if (!isLoggedIn && initialLoadDone) {
      localStorage.setItem(COMPARISON_KEY, JSON.stringify(compareList));
    }
  }, [compareList, isLoggedIn, user?.id, initialLoadDone]);

  const addToCompare = useCallback((id: string): boolean => {
    if (compareList.includes(id)) return true;
    if (compareList.length >= MAX_COMPARISON) return false;
    
    setCompareList(prev => [...prev, id]);
    return true;
  }, [compareList]);

  const removeFromCompare = useCallback((id: string) => {
    setCompareList(prev => prev.filter(item => item !== id));
  }, []);

  const isInCompare = useCallback((id: string) => {
    return compareList.includes(id);
  }, [compareList]);

  const clearCompare = useCallback(() => {
    setCompareList([]);
  }, []);

  const canAddMore = compareList.length < MAX_COMPARISON;

  return (
    <ComparisonContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        isInCompare,
        clearCompare,
        isLoading,
        canAddMore,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error("useComparison must be used within ComparisonProvider");
  }
  return context;
}

export default ComparisonProvider;
