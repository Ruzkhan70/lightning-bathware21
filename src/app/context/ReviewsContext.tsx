import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { db } from "../../firebase";
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";

export interface Review {
  id: string;
  productId: string;
  userName: string;
  userEmail?: string;
  rating: number;
  comment: string;
  status?: "pending" | "approved" | "rejected";
  isApproved?: boolean;
  createdAt: string;
}

interface ReviewsContextType {
  reviews: Review[];
  getProductReviews: (productId: string) => Review[];
  getProductRating: (productId: string) => { average: number; count: number };
  addReview: (review: Omit<Review, "id" | "createdAt" | "status">) => Promise<void>;
  loading: boolean;
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export function ReviewsProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const reviewsRef = collection(db, "reviews");
      const q = query(reviewsRef, orderBy("createdAt", "desc"));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const reviewsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Review[];
        setReviews(reviewsData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching reviews:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up reviews listener:", error);
      setLoading(false);
    }
  }, []);

  const isReviewApproved = (review: Review): boolean => {
    if (review.status === "approved") return true;
    if (review.status === "rejected") return false;
    if (review.status === "pending") return false;
    if (review.isApproved === true) return true;
    return false;
  };

  const getProductReviews = (productId: string): Review[] => {
    return reviews.filter(r => r.productId === productId && isReviewApproved(r));
  };

  const getProductRating = (productId: string): { average: number; count: number } => {
    const productReviews = reviews.filter(r => r.productId === productId && isReviewApproved(r));
    if (productReviews.length === 0) return { average: 0, count: 0 };
    
    const total = productReviews.reduce((sum, r) => sum + r.rating, 0);
    return {
      average: Math.round((total / productReviews.length) * 10) / 10,
      count: productReviews.length
    };
  };

  const addReview = async (review: Omit<Review, "id" | "createdAt" | "status">) => {
    try {
      const reviewsRef = collection(db, "reviews");
      await addDoc(reviewsRef, {
        ...review,
        status: "pending",
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
