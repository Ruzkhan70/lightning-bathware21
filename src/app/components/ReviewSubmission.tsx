import { useState } from "react";
import { Star, Send, User, Mail } from "lucide-react";
import { useReviews } from "../context/ReviewsContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";

interface ReviewSubmissionProps {
  productId: string;
  productName?: string;
  onSuccess?: () => void;
}

export default function ReviewSubmission({ productId, productName, onSuccess }: ReviewSubmissionProps) {
  const { addReview } = useReviews();
  const [formData, setFormData] = useState({
    userName: "",
    userEmail: "",
    comment: "",
  });
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = (email: string) => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    
    if (formData.userEmail && !validateEmail(formData.userEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    
    if (!formData.comment.trim() || formData.comment.trim().length < 10) {
      toast.error("Please write a review (at least 10 characters)");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await addReview({
        productId,
        productName,
        userName: formData.userName.trim(),
        userEmail: formData.userEmail.trim() || undefined,
        rating,
        comment: formData.comment.trim(),
      });
      
      setIsSubmitted(true);
      setFormData({ userName: "", userEmail: "", comment: "" });
      setRating(0);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-green-800 mb-2">Thank You!</h3>
        <p className="text-green-700 mb-4">
          Your review has been submitted and will be visible after approval.
        </p>
        <Button
          onClick={() => setIsSubmitted(false)}
          variant="outline"
          className="border-green-300 text-green-700 hover:bg-green-100"
        >
          Write Another Review
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Name *
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Enter your name"
            value={formData.userName}
            onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email (optional)
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="email"
            placeholder="Enter your email"
            value={formData.userEmail}
            onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
            className="pl-10"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Your email will not be displayed publicly</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating *
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  star <= (hoverRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-gray-600">
              {rating === 1 && "(Poor)"}
              {rating === 2 && "(Fair)"}
              {rating === 3 && "(Good)"}
              {rating === 4 && "(Very Good)"}
              {rating === 5 && "(Excellent)"}
            </span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Review *
        </label>
        <Textarea
          placeholder="Share your experience with this product..."
          value={formData.comment}
          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
          rows={4}
          required
          minLength={10}
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.comment.length < 10 
            ? `${formData.comment.length}/10 characters minimum`
            : `${formData.comment.length} characters`}
        </p>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || rating === 0 || formData.comment.length < 10}
        className="w-full bg-[#D4AF37] hover:bg-[#b8962f] text-black disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Submitting...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Submit Review
          </>
        )}
      </Button>
    </form>
  );
}
