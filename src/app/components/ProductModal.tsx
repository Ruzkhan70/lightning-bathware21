import { useState, useEffect } from "react";
import { X, ShoppingCart, Minus, Plus, Truck, Package } from "lucide-react";
import { Product, useAdmin } from "../context/AdminContext";
import { useCart } from "../context/CartContext";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ReviewsDisplay from "./ReviewsDisplay";

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { storeProfile, getProductDiscount } = useAdmin();
  
  const discount = getProductDiscount(product.id);
  const displayPrice = discount.hasDiscount ? discount.discountedPrice : product.price;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    toast.success(`${quantity} x ${product.name} added to cart!`);
    onClose();
  };

  const incrementQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto z-10"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
            {/* Image */}
            <div className="relative">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Availability Badge */}
              {!product.isAvailable && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold">
                  Not Available
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col">
              {/* Category */}
              <div className="text-sm text-[#D4AF37] font-semibold mb-2">
                {product.category}
              </div>

              {/* Product Name */}
              <h2 className="text-3xl font-bold text-black mb-4">
                {product.name}
              </h2>

              {/* Price */}
              <div className="mb-6">
                {discount.hasDiscount ? (
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-green-600">
                      Rs. {displayPrice.toLocaleString()}
                    </span>
                    <span className="text-xl text-gray-400 line-through">
                      Rs. {product.price.toLocaleString()}
                    </span>
                    <span className="px-2 py-1 bg-red-100 text-red-600 text-sm font-semibold rounded">
                      -{discount.discountPercentage}%
                    </span>
                  </div>
                ) : (
                  <div className="text-4xl font-bold text-black">
                    Rs. {product.price.toLocaleString()}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Availability Status */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-[#D4AF37]" />
                  <span className="font-semibold">Availability:</span>
                </div>
                <div
                  className={`font-bold ${
                    product.isAvailable ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {product.isAvailable ? "Available" : "Not Available"}
                </div>
              </div>

              {/* Delivery Options */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="w-5 h-5 text-[#D4AF37]" />
                  <span className="font-semibold">Delivery Options:</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>• Delivery within Colombo</span>
                    <span className="font-semibold text-black">Rs. {(storeProfile?.deliveryColomboPrice || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>• Islandwide delivery</span>
                    <span className="font-semibold text-black">Rs. {(storeProfile?.deliveryIslandwidePrice || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Quantity Selector */}
              {product.isAvailable && (
                <div className="mb-6">
                  <label className="block font-semibold mb-3">Quantity:</label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border-2 border-gray-300 rounded-lg">
                      <button
                        onClick={decrementQuantity}
                        disabled={quantity <= 1}
                        className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="px-6 font-bold text-xl">{quantity}</span>
                      <button
                        onClick={incrementQuantity}
                        className="p-3 hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <Button
                onClick={handleAddToCart}
                disabled={!product.isAvailable}
                className="w-full py-6 text-lg bg-black hover:bg-[#D4AF37] text-white transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {product.isAvailable ? `Add to Cart - Rs. ${(product.price * quantity).toLocaleString()}` : "Not Available"}
              </Button>
            </div>
          </div>

          {/* Reviews Section - Full Width */}
          <div className="px-6 md:px-8 pb-8">
            <ReviewsDisplay productId={product.id} productName={product.name} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
