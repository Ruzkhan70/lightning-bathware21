import { useState, memo, useCallback, useMemo } from "react";
import { Heart, ShoppingCart, Eye, Sparkles, GitCompare } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useComparison } from "../context/ComparisonContext";
import { Product, useAdmin } from "../context/AdminContext";
import { toast } from "sonner";
import ProductModal from "./ProductModal";
import { AnimatePresence } from "framer-motion";
import LazyImage from "./LazyImage";

interface ProductCardProps {
  product: Product;
}

const ProductCardComponent = memo(function ProductCardComponent({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCompare, removeFromCompare, isInCompare, canAddMore } = useComparison();
  const { getProductDiscount } = useAdmin();
  const [showModal, setShowModal] = useState(false);
  
  const discount = getProductDiscount(product.id);
  const displayPrice = discount.hasDiscount
    ? discount.discountedPrice
    : product.price;
  
  const inWishlist = isInWishlist(product.id);
  const inCompare = isInCompare(product.id);

  const handleAddToCart = useCallback(() => {
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  }, [addToCart, product]);

  const handleWishlist = useCallback(() => {
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist(product.id);
      toast.success("Added to wishlist");
    }
  }, [inWishlist, addToWishlist, removeFromWishlist, product.id]);

  const handleOpenModal = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleToggleCompare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (inCompare) {
      removeFromCompare(product.id);
      toast.success("Removed from comparison");
    } else {
      if (canAddMore) {
        addToCompare(product.id);
        toast.success("Added to comparison");
      } else {
        toast.error("Maximum 4 products can be compared");
      }
    }
  }, [inCompare, canAddMore, addToCompare, removeFromCompare, product.id]);

  return (
    <>
      <div className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-2xl hover:-translate-y-2 sm:active:shadow-xl active:translate-y-0 transition-all duration-300">
        <div 
          className="relative aspect-square overflow-hidden bg-gray-100 cursor-pointer"
          onClick={handleOpenModal}
        >
          <LazyImage
            src={product.image}
            alt={product.name}
            className="w-full h-full group-hover:scale-110 transition-transform duration-500"
          />

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 sm:group-active:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
            <Button
              onClick={handleOpenModal}
              size="sm"
              className="bg-white text-black hover:bg-[#D4AF37] hover:text-white active:scale-95 transform hover:scale-110 transition-all"
            >
              <Eye className="w-4 h-4 mr-1" />
              Quick View
            </Button>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleWishlist();
            }}
            className="absolute top-3 right-3 p-2.5 min-w-[44px] min-h-[44px] bg-white rounded-full hover:bg-[#D4AF37] active:scale-90 hover:scale-110 transition-all group/heart z-10 flex items-center justify-center"
          >
            <Heart
              className={`w-5 h-5 ${
                inWishlist
                  ? "fill-red-500 text-red-500"
                  : "text-black group-hover/heart:text-white"
              }`}
            />
          </button>

          <button
            onClick={handleToggleCompare}
            className={`absolute top-3 left-3 p-2 min-w-[36px] min-h-[36px] rounded-lg transition-all z-10 flex items-center justify-center ${
              inCompare
                ? "bg-[#D4AF37] text-black"
                : "bg-white/90 hover:bg-[#D4AF37] text-black"
            }`}
            title={inCompare ? "Remove from comparison" : "Add to comparison"}
          >
            <GitCompare className="w-4 h-4" />
          </button>

          {discount.hasDiscount && discount.discountPercentage && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
              -{discount.discountPercentage}% OFF
            </div>
          )}

          {!product.isAvailable && (
            <div className="absolute top-3 left-3 bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-bold">
              Not Available
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="text-xs text-[#D4AF37] font-semibold mb-1">
            {product.category}
          </div>

          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 h-12">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2 mb-3">
            {discount.hasDiscount ? (
              <>
                <div className="text-2xl font-bold text-[#D4AF37]">
                  Rs. {Math.round(displayPrice || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 line-through">
                  Rs. {product.price.toLocaleString()}
                </div>
              </>
            ) : (
              <div className="text-2xl font-bold text-black">
                Rs. {product.price.toLocaleString()}
              </div>
            )}
          </div>

          {discount.hasDiscount && discount.offerTitle && (
            <div className="text-xs text-red-600 font-semibold mb-3 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {discount.offerTitle}
            </div>
          )}

          <Button
            onClick={handleAddToCart}
            disabled={!product.isAvailable}
            className="w-full min-h-[48px] bg-black hover:bg-[#D4AF37] text-white active:scale-[0.98] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {product.isAvailable ? "Add to Cart" : "Not Available"}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <ProductModal
            key="product-modal"
            product={product}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </>
  );
});

export default ProductCardComponent;
