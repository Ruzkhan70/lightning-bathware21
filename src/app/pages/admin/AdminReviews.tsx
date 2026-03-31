import { useState } from "react";
import { Star, Check, X, Trash2, Edit2, Search, CheckCircle, XCircle, Clock, Database, RefreshCw, Square, CheckSquare, SquareCheck } from "lucide-react";
import { useAdmin, Review } from "../../context/AdminContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";

export default function AdminReviews() {
  const { 
    reviews, 
    products,
    updateReview, 
    deleteReview, 
    approveReview, 
    rejectReview,
    seedDemoReviews
  } = useAdmin();
  
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedingProgress, setSeedingProgress] = useState({ current: 0, total: 0 });
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [editForm, setEditForm] = useState({
    userName: "",
    rating: 5,
    comment: "",
  });

  const filteredReviews = reviews.filter(r => {
    const matchesFilter = 
      filter === "all" || 
      r.status === filter;
    
    const matchesSearch = 
      r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      r.productId.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const pendingCount = reviews.filter(r => r.status === "pending").length;
  const approvedCount = reviews.filter(r => r.status === "approved").length;
  const rejectedCount = reviews.filter(r => r.status === "rejected").length;

  const selectedCount = selectedReviews.size;

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || product?.productName || `Product ${productId}`;
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setEditForm({
      userName: review.userName,
      rating: review.rating,
      comment: review.comment,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingReview) return;
    
    try {
      await updateReview(editingReview.id, {
        userName: editForm.userName.trim(),
        rating: editForm.rating,
        comment: editForm.comment.trim(),
      });
      setEditingReview(null);
      toast.success("Review updated successfully");
    } catch (error) {
      toast.error("Failed to update review");
    }
  };

  const handleDelete = async () => {
    if (!deletingReview) return;
    
    try {
      await deleteReview(deletingReview.id);
      setDeletingReview(null);
      setSelectedReviews(prev => {
        const newSet = new Set(prev);
        newSet.delete(deletingReview.id);
        return newSet;
      });
    } catch (error) {
      toast.error("Failed to delete review");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReviews.size === 0) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedReviews.size} review(s)? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      const deletePromises = Array.from(selectedReviews).map(id => deleteReview(id));
      await Promise.all(deletePromises);
      toast.success(`Successfully deleted ${selectedReviews.size} reviews`);
      setSelectedReviews(new Set());
    } catch (error) {
      toast.error("Failed to delete some reviews");
    }
  };

  const handleApprove = async (reviewId: string) => {
    try {
      await approveReview(reviewId);
    } catch (error) {
      toast.error("Failed to approve review");
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      await rejectReview(reviewId);
    } catch (error) {
      toast.error("Failed to reject review");
    }
  };

  const handleSeedReviews = async () => {
    if (products.length === 0) {
      toast.error("No products found. Please add products first.");
      return;
    }
    
    setIsSeeding(true);
    setSeedingProgress({ current: 0, total: products.length });
    
    try {
      await seedDemoReviews();
      toast.success("Demo reviews seeded successfully!");
    } catch (error) {
      toast.error("Failed to seed demo reviews");
    } finally {
      setIsSeeding(false);
      setSeedingProgress({ current: 0, total: 0 });
    }
  };

  const handleCancelSeeding = () => {
    setIsSeeding(false);
    setSeedingProgress({ current: 0, total: 0 });
    toast.info("Seeding cancelled");
  };

  const toggleSelectAll = () => {
    if (selectedReviews.size === filteredReviews.length) {
      setSelectedReviews(new Set());
    } else {
      setSelectedReviews(new Set(filteredReviews.map(r => r.id)));
    }
  };

  const toggleSelectReview = (reviewId: string) => {
    setSelectedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const renderStars = (rating: number, interactive: boolean = false, onRate?: (r: number) => void) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onRate?.(star)}
          className={`${interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}`}
          disabled={!interactive}
        >
          <Star
            className={`w-5 h-5 ${
              star <= rating 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSelectAllIcon = () => {
    if (filteredReviews.length === 0) {
      return <Square className="w-5 h-5 text-gray-400" />;
    }
    if (selectedReviews.size === filteredReviews.length) {
      return <CheckSquare className="w-5 h-5 text-[#D4AF37]" />;
    }
    if (selectedReviews.size > 0) {
      return <SquareCheck className="w-5 h-5 text-[#D4AF37]" />;
    }
    return <Square className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Customer Reviews</h1>
          <p className="text-gray-600">Manage and moderate customer reviews</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="text-center px-3 py-1 bg-yellow-100 rounded-lg">
            <p className="text-xl font-bold text-yellow-700">{pendingCount}</p>
            <p className="text-xs text-yellow-600">Pending</p>
          </div>
          <div className="text-center px-3 py-1 bg-green-100 rounded-lg">
            <p className="text-xl font-bold text-green-700">{approvedCount}</p>
            <p className="text-xs text-green-600">Approved</p>
          </div>
          <div className="text-center px-3 py-1 bg-red-100 rounded-lg">
            <p className="text-xl font-bold text-red-700">{rejectedCount}</p>
            <p className="text-xs text-red-600">Rejected</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reviews ({reviews.length})</SelectItem>
              <SelectItem value="pending">Pending ({pendingCount})</SelectItem>
              <SelectItem value="approved">Approved ({approvedCount})</SelectItem>
              <SelectItem value="rejected">Rejected ({rejectedCount})</SelectItem>
            </SelectContent>
          </Select>
          
          {isSeeding ? (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex-1 md:flex-none">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#D4AF37]" />
                  <span className="text-sm text-gray-600">
                    Seeding reviews...
                  </span>
                </div>
              </div>
              <Button
                onClick={handleCancelSeeding}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50 w-full md:w-auto"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleSeedReviews}
              className="bg-[#D4AF37] hover:bg-[#b8962f] text-black w-full md:w-auto"
            >
              <Database className="w-4 h-4 mr-2" />
              Seed Demo Reviews
            </Button>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedCount > 0 && (
          <div className="mt-4 p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[#D4AF37]" />
              <span className="font-medium">{selectedCount} review(s) selected</span>
            </div>
            <Button
              onClick={handleBulkDelete}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete Selected
            </Button>
          </div>
        )}
      </div>

      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 text-center">
          <Star className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg mb-2">
            {searchQuery ? "No reviews found matching your search" : "No reviews yet"}
          </p>
          <p className="text-gray-400 text-sm">
            {searchQuery ? "Try adjusting your search or filter" : "Customer reviews will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header with Select All */}
          <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 hover:bg-gray-200 p-2 rounded transition-colors"
            >
              {getSelectAllIcon()}
              <span className="font-medium text-sm">Select All ({filteredReviews.length})</span>
            </button>
            {selectedCount > 0 && (
              <button
                onClick={() => setSelectedReviews(new Set())}
                className="text-sm text-blue-600 hover:underline ml-2"
              >
                Clear Selection
              </button>
            )}
          </div>

          {filteredReviews.map((review) => {
            const isSelected = selectedReviews.has(review.id);
            return (
              <div 
                key={review.id} 
                className={`bg-white rounded-lg shadow-sm p-4 md:p-6 ${
                  review.status === "pending" ? "border-l-4 border-yellow-400" : ""
                } ${review.status === "rejected" ? "opacity-60" : ""} ${
                  isSelected ? "ring-2 ring-[#D4AF37]" : ""
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Checkbox */}
                  <div className="flex items-start pt-1">
                    <button
                      onClick={() => toggleSelectReview(review.id)}
                      className="hover:bg-gray-100 p-1 rounded transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-[#D4AF37]" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#D4AF37] rounded-full flex items-center justify-center text-black font-bold">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{review.userName}</p>
                        <p className="text-sm text-gray-500">{review.userEmail || "Guest"}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        {renderStars(review.rating)}
                        {getStatusBadge(review.status)}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500 mb-2">
                      Product: <span className="font-medium text-gray-700">{getProductName(review.productId)}</span>
                    </p>
                    
                    <p className="text-gray-700 mb-3">{review.comment}</p>
                    
                    <p className="text-xs text-gray-400">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                    {review.status === "pending" && (
                      <>
                        <Button
                          onClick={() => handleApprove(review.id)}
                          className="bg-green-500 hover:bg-green-600 text-white text-sm"
                          size="sm"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReject(review.id)}
                          variant="outline"
                          className="text-red-500 hover:bg-red-50 text-sm"
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    
                    <Button
                      onClick={() => handleEdit(review)}
                      variant="outline"
                      className="text-blue-600 hover:bg-blue-50 text-sm"
                      size="sm"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => setDeletingReview(review)}
                      variant="outline"
                      className="text-red-500 hover:bg-red-50 text-sm"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Review Dialog */}
      <Dialog open={!!editingReview} onOpenChange={() => setEditingReview(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
          </DialogHeader>
          {editingReview && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Customer Name</label>
                <Input
                  value={editForm.userName}
                  onChange={(e) => setEditForm({ ...editForm, userName: e.target.value })}
                  placeholder="Customer name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex items-center gap-4">
                  {renderStars(editForm.rating, true, (r) => setEditForm({ ...editForm, rating: r }))}
                  <span className="text-sm text-gray-500">({editForm.rating}/5)</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Review Comment</label>
                <Textarea
                  value={editForm.comment}
                  onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                  placeholder="Review comment"
                  rows={4}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setEditingReview(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#b8962f] text-black"
                  disabled={!editForm.userName.trim() || !editForm.comment.trim()}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingReview} onOpenChange={() => setDeletingReview(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete this review from <strong>{deletingReview?.userName}</strong>? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeletingReview(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
