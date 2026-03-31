import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { db } from "../../firebase";
import { collection, addDoc, getDocs, query, orderBy, where } from "firebase/firestore";

export interface Review {
  id: string;
  productId: string;
  userName: string;
  userEmail?: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

interface ReviewsContextType {
  reviews: Review[];
  getProductReviews: (productId: string) => Review[];
  getProductRating: (productId: string) => { average: number; count: number };
  addReview: (review: Omit<Review, "id" | "createdAt" | "isApproved">) => Promise<void>;
  loading: boolean;
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export function ReviewsProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const reviewsRef = collection(db, "reviews");
        const q = query(reviewsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const reviewsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Review[];
        setReviews(reviewsData);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const getProductReviews = (productId: string): Review[] => {
    return reviews.filter(r => r.productId === productId && r.isApproved);
  };

  const getProductRating = (productId: string): { average: number; count: number } => {
    const productReviews = reviews.filter(r => r.productId === productId && r.isApproved);
    if (productReviews.length === 0) return { average: 0, count: 0 };
    
    const total = productReviews.reduce((sum, r) => sum + r.rating, 0);
    return {
      average: Math.round((total / productReviews.length) * 10) / 10,
      count: productReviews.length
    };
  };

  const addReview = async (review: Omit<Review, "id" | "createdAt" | "isApproved">) => {
    try {
      const reviewsRef = collection(db, "reviews");
      await addDoc(reviewsRef, {
        ...review,
        isApproved: false,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error adding review:", error);
      throw error;
    }
  };

  return (
    <ReviewsContext.Provider value={{ reviews, getProductReviews, getProductRating, addReview, loading }}>
      {children}
    </ReviewsContext.Provider>
  );
}

export function useReviews() {
  const context = useContext(ReviewsContext);
  if (!context) {
    throw new Error("useReviews must be used within ReviewsProvider");
  }
  return context;
}

export default ReviewsProvider;
