import { useState } from "react";
import { Star, ThumbsUp, ChevronDown, ChevronUp } from "lucide-react";
import { useAdmin, Review } from "../context/AdminContext";
import ReviewSubmission from "./ReviewSubmission";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface ReviewsDisplayProps {
  productId: string;
  productName?: string;
}

export default function ReviewsDisplay({ productId, productName }: ReviewsDisplayProps) {
  const { getApprovedReviewsByProduct, getAverageRating } = useAdmin();
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [showCount, setShowCount] = useState(5);

  const reviews = getApprovedReviewsByProduct(productId);
  const { average, count } = getAverageRating(productId);

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "highest":
        return b.rating - a.rating;
      case "lowest":
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  const visibleReviews = sortedReviews.slice(0, showCount);
  const hasMore = sortedReviews.length > showCount;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const renderStars = (rating: number, size: "sm" | "md" = "sm") => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${
            size === "sm" ? "w-4 h-4" : "w-5 h-5"
          } ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );

  const renderRatingBars = () => {
    const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: reviews.filter(r => r.rating === rating).length,
      percentage: reviews.length > 0 
        ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 
        : 0,
    }));

    return (
      <div className="space-y-2">
        {ratingCounts.map(({ rating, count, percentage }) => (
          <div key={rating} className="flex items-center gap-2">
            <span className="text-sm text-gray-600 w-12">{rating} star</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
          </div>
        ))}
      </div>
    );
  };

  if (reviews.length === 0) {
    return (
      <div className="border-t pt-8">
        <h3 className="text-lg font-semibold mb-4">Customer Reviews</h3>
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Star className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 mb-2">No reviews yet for this product</p>
          <p className="text-sm text-gray-500 mb-4">Be the first to share your experience!</p>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#D4AF37] hover:bg-[#b8962f] text-black"
          >
            Write a Review
          </Button>
        </div>
        
        {showForm && (
          <div className="mt-6 p-4 bg-white border rounded-lg shadow-sm">
            <ReviewSubmission
              productId={productId}
              productName={productName}
              onSuccess={() => setShowForm(false)}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border-t pt-8">
      <h3 className="text-lg font-semibold mb-4">Customer Reviews ({count})</h3>
      
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="text-center p-6 bg-[#D4AF37]/10 rounded-lg">
          <p className="text-5xl font-bold text-[#D4AF37] mb-2">
            {average.toFixed(1)}
          </p>
          <div className="flex justify-center mb-2">
            {renderStars(Math.round(average), "md")}
          </div>
          <p className="text-sm text-gray-600">
            Based on {count} review{count !== 1 ? "s" : ""}
          </p>
        </div>
        
        <div className="md:col-span-2 p-4 bg-gray-50 rounded-lg">
          {renderRatingBars()}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="highest">Highest Rated</SelectItem>
            <SelectItem value="lowest">Lowest Rated</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          onClick={() => setShowForm(!showForm)}
          variant="outline"
          className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
        >
          {showForm ? "Cancel" : "Write a Review"}
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-white border rounded-lg shadow-sm">
          <ReviewSubmission
            productId={productId}
            productName={productName}
            onSuccess={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="space-y-4">
        {visibleReviews.map((review) => (
          <ReviewCard key={review.id} review={review} renderStars={renderStars} formatDate={formatDate} />
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-6">
          <Button
            onClick={() => setShowCount(prev => prev + 5)}
            variant="outline"
            className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
          >
            Load More Reviews ({sortedReviews.length - showCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ 
  review, 
  renderStars, 
  formatDate 
}: { 
  review: Review; 
  renderStars: (rating: number, size?: "sm" | "md") => JSX.Element;
  formatDate: (date: string) => string;
}) {
  const [helpful, setHelpful] = useState(0);
  const [showFullComment, setShowFullComment] = useState(false);

  const isLongComment = review.comment.length > 300;
  const displayComment = isLongComment && !showFullComment 
    ? review.comment.slice(0, 300) + "..." 
    : review.comment;

  return (
    <div className="bg-white border rounded-lg p-4 md:p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-semibold text-gray-600">
            {review.userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{review.userName}</p>
            <div className="flex items-center gap-2">
              {renderStars(review.rating)}
              <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-gray-700 leading-relaxed">
        {displayComment}
        {isLongComment && (
          <button
            onClick={() => setShowFullComment(!showFullComment)}
            className="text-[#D4AF37] hover:underline ml-1"
          >
            {showFullComment ? "Show less" : "Read more"}
          </button>
        )}
      </p>
      
      <div className="flex items-center gap-4 mt-4 pt-4 border-t">
        <button
          onClick={() => setHelpful(prev => prev + 1)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#D4AF37] transition-colors"
        >
          <ThumbsUp className="w-4 h-4" />
          Helpful ({helpful})
        </button>
      </div>
    </div>
  );
}
