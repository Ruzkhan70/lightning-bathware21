import { useState } from "react";
import { Heart, ShoppingCart, Eye } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { Product, useAdmin } from "../context/AdminContext";
import { toast } from "sonner";
import ProductModal from "./ProductModal";
import { AnimatePresence } from "framer-motion";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { getProductDiscount } = useAdmin();
  const [showModal, setShowModal] = useState(false);
  const inWishlist = isInWishlist(product.id);

  const discount = getProductDiscount(product.id);
  const displayPrice = discount.hasDiscount
    ? discount.discountedPrice
    : product.price;

  const handleAddToCart = () => {
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  const handleWishlist = () => {
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist(product.id);
      toast.success("Added to wishlist");
    }
  };

  return (
    <>
      <div className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
        {/* Image */}
        <div 
          className="relative aspect-square overflow-hidden bg-gray-100 cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {/* Overlay Buttons */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
            <Button
              onClick={() => setShowModal(true)}
              size="sm"
              className="bg-white text-black hover:bg-[#D4AF37] hover:text-white transform hover:scale-110 transition-all"
            >
              <Eye className="w-4 h-4 mr-1" />
              Quick View
            </Button>
          </div>

          {/* Wishlist Icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleWishlist();
            }}
            className="absolute top-3 right-3 p-2 bg-white rounded-full hover:bg-[#D4AF37] hover:scale-110 transition-all group/heart z-10"
          >
            <Heart
              className={`w-5 h-5 ${
                inWishlist
                  ? "fill-red-500 text-red-500"
                  : "text-black group-hover/heart:text-white"
              }`}
            />
          </button>

          {/* Discount Badge */}
          {discount.hasDiscount && discount.discountPercentage && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
              -{discount.discountPercentage}% OFF
            </div>
          )}

          {/* Availability Badge */}
          {!product.isAvailable && (
            <div className="absolute top-3 left-3 bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-bold">
              Not Available
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category */}
          <div className="text-xs text-[#D4AF37] font-semibold mb-1">
            {product.category}
          </div>

          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 h-12">
            {product.name}
          </h3>

          {/* Price */}
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

          {/* Offer Tag */}
          {discount.hasDiscount && discount.offerTitle && (
            <div className="text-xs text-red-600 font-semibold mb-3">
              🎉 {discount.offerTitle}
            </div>
          )}

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={!product.isAvailable}
            className="w-full bg-black hover:bg-[#D4AF37] text-white transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {product.isAvailable ? "Add to Cart" : "Not Available"}
          </Button>
        </div>
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {showModal && (
          <ProductModal
            key="product-modal"
            product={product}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}