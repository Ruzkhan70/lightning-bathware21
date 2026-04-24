import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ShoppingCart, Minus, Plus, Truck, Package, Check } from "lucide-react";
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
  const displayPrice = discount.hasDiscount ? (discount.discountedPrice || product.price) : product.price;

  const hasVariants = product.has_variants && product.variants && product.variants.length > 0;
  const hasSizes = product.has_sizes && product.sizes && product.sizes.length > 0;
  const variants = product.variants || [];
  const sizes = product.sizes || [];
  
  const [selectedColor, setSelectedColor] = useState<string>(variants[0]?.color || "");
  const [selectedSize, setSelectedSize] = useState<string>(sizes[0]?.size || "");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const currentVariant = variants.find(v => v.color === selectedColor);
  const currentImages = currentVariant?.images || (product.image ? [product.image] : []);
  const displayImage = currentImages[currentImageIndex] || currentImages[0] || product.image;

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setQuantity(1);
    setCurrentImageIndex(0);
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    setQuantity(1);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleMouseEnter = () => setIsZooming(true);
  const handleMouseLeave = () => setIsZooming(false);

  const handleAddToCart = () => {
    if (hasVariants && hasSizes) {
      toast.error("Please select a color OR size, not both");
      return;
    }
    
    if (hasVariants) {
      const variant = variants.find(v => v.color === selectedColor);
      const image = variant?.images?.[0] || product.image;
      addToCart({
        id: product.id,
        product_id: product.id,
        name: product.name,
        price: displayPrice,
        image: image,
        quantity: quantity,
        isAvailable: product.isAvailable,
        selected_color: selectedColor,
      });
      toast.success(`${quantity} x ${product.name} (${selectedColor}) added to cart!`);
    } else if (hasSizes) {
      addToCart({
        id: product.id,
        product_id: product.id,
        name: product.name,
        price: displayPrice,
        image: product.image,
        quantity: quantity,
        isAvailable: product.isAvailable,
        selected_size: selectedSize,
      });
      toast.success(`${quantity} x ${product.name} (${selectedSize}) added to cart!`);
    } else {
      addToCart({
        id: product.id,
        product_id: product.id,
        name: product.name,
        price: displayPrice,
        image: product.image,
        quantity: quantity,
        isAvailable: product.isAvailable,
      });
      toast.success(`${quantity} x ${product.name} added to cart!`);
    }
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

  const modalContent = (
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
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
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
              <div 
                className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative cursor-crosshair"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onMouseMove={handleMouseMove}
              >
                <img
                  src={displayImage}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-200"
                  style={{
                    transform: isZooming ? `scale(2)` : 'scale(1)',
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  }}
                />
              </div>

              {/* Image Thumbnails */}
              {currentImages.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto">
                  {currentImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === currentImageIndex ? "border-[#D4AF37]" : "border-transparent"
                      }`}
                    >
                      <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

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
              <h2 className="text-3xl font-bold text-black mb-2">
                {product.name}
              </h2>

              {/* Product Code */}
              {product.product_code && (
                <p className="text-sm text-gray-500 mb-4">
                  Code: {product.product_code}
                </p>
              )}

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
                    Rs. {displayPrice.toLocaleString()}
                  </div>
                )}
              </div>

              {/* Color Variants Selector */}
              {hasVariants && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">Select Color:</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {variants.map((variant) => (
                      <button
                        key={variant.color}
                        onClick={() => handleColorSelect(variant.color)}
                        className={`px-4 py-2 rounded-full border-2 transition-all ${
                          selectedColor === variant.color
                            ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {variant.color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Variants Selector */}
              {hasSizes && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">Select Size:</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {sizes.map((sz) => (
                      <button
                        key={sz.size}
                        onClick={() => handleSizeSelect(sz.size)}
                        className={`px-4 py-2 rounded-full border-2 transition-all ${
                          selectedSize === sz.size
                            ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {sz.size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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

              {/* Quantity Selector (for non-variant or variant mode) */}
              {product.isAvailable && (hasVariants || hasSizes) && (
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
                {product.isAvailable 
                  ? `Add to Cart - Rs. ${(displayPrice * quantity).toLocaleString()}`
                  : "Not Available"
                }
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

  return createPortal(modalContent, document.body);
}
