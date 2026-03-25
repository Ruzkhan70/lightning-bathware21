import { useState, useEffect } from "react";
import { X, ShoppingCart, Minus, Plus, Truck, Package } from "lucide-react";
import { Product } from "../context/AdminContext";
import { useCart } from "../context/CartContext";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

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
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
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

              {/* Stock Badge */}
              {product.stock < 10 && product.stock > 0 && (
                <div className="absolute top-4 left-4 bg-orange-500 text-white px-4 py-2 rounded-full font-bold">
                  Only {product.stock} left!
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
              <div className="text-4xl font-bold text-black mb-6">
                Rs. {product.price.toLocaleString()}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Stock Availability */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-[#D4AF37]" />
                  <span className="font-semibold">Stock Availability:</span>
                </div>
                <div
                  className={`font-bold ${
                    product.stock > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {product.stock > 0
                    ? `${product.stock} units available`
                    : "Out of Stock"}
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
                    <span className="font-semibold text-black">Rs. 500</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>• Islandwide delivery</span>
                    <span className="font-semibold text-black">Rs. 1,000</span>
                  </div>
                </div>
              </div>

              {/* Quantity Selector */}
              {product.stock > 0 && (
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
                        disabled={quantity >= product.stock}
                        className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="text-gray-600">
                      Max: {product.stock} units
                    </div>
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full py-6 text-lg bg-black hover:bg-[#D4AF37] text-white transition-colors"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart - Rs.{" "}
                {(product.price * quantity).toLocaleString()}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
