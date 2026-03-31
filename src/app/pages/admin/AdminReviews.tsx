import { useState } from "react";
import { Star, Check, X, Eye, Trash2 } from "lucide-react";
import { db } from "../../../firebase";
import { collection, getDocs, updateDoc, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { useEffect } from "react";

interface Review {
  id: string;
  productId: string;
  userName: string;
  userEmail?: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");

  const fetchReviews = async () => {
    setLoading(true);
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

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleApprove = async (reviewId: string) => {
    try {
      await updateDoc(doc(db, "reviews", reviewId), { isApproved: true });
      toast.success("Review approved!");
      fetchReviews();
    } catch (error) {
      toast.error("Failed to approve review");
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
      toast.success("Review rejected and deleted!");
      fetchReviews();
    } catch (error) {
      toast.error("Failed to reject review");
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (filter === "pending") return !r.isApproved;
    if (filter === "approved") return r.isApproved;
    return true;
  });

  const pendingCount = reviews.filter(r => !r.isApproved).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Customer Reviews</h1>
          <p className="text-gray-600">
            Manage and moderate customer reviews
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-semibold">
            {pendingCount} pending review{pendingCount > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "pending"
              ? "bg-[#D4AF37] text-black"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "approved"
              ? "bg-[#D4AF37] text-black"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Approved ({reviews.filter(r => r.isApproved).length})
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "all"
              ? "bg-[#D4AF37] text-black"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All ({reviews.length})
        </button>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading reviews...</div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500">No {filter === "all" ? "" : filter} reviews found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center text-black font-bold text-lg">
                      {review.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{review.userName}</p>
                      <p className="text-sm text-gray-500">{review.userEmail || "Guest"}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{review.comment}</p>
                  
                  <p className="text-sm text-gray-500">
                    Product ID: <code className="bg-gray-100 px-2 py-1 rounded">{review.productId}</code>
                  </p>
                </div>

                {!review.isApproved && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => handleApprove(review.id)}
                      className="bg-green-500 hover:bg-green-600 text-white"
                      size="sm"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(review.id)}
                      variant="outline"
                      className="text-red-500 hover:bg-red-50"
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}

                {review.isApproved && (
                  <Button
                    onClick={() => handleReject(review.id)}
                    variant="outline"
                    className="text-red-500 hover:bg-red-50"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
