import { Link, useNavigate } from "react-router";
import { ArrowLeft, X, ShoppingCart, Check, Star } from "lucide-react";
import { useComparison } from "../context/ComparisonContext";
import { useAdmin } from "../context/AdminContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { useMemo, useCallback } from "react";
import { setMetaTags } from "../utils/seo";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Compare() {
  const navigate = useNavigate();
  const { compareList, removeFromCompare, clearCompare, isInCompare, addToCompare } = useComparison();
  const { products } = useAdmin();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    setMetaTags(
      "Compare Products | Lightning Bathware",
      "Compare products side by side to make the best choice"
    );
  }, []);

  const safeProducts = products || [];

  const compareProducts = useMemo(
    () => compareList
      .map(id => safeProducts.find(p => p.id === id))
      .filter(Boolean),
    [compareList, safeProducts]
  ) as typeof safeProducts;

  const handleAddToCart = useCallback((productId: string, productName: string) => {
    addToCart(productId);
    toast.success(`${productName} added to cart!`);
  }, [addToCart]);

  const handleToggleWishlist = useCallback((productId: string, productName: string) => {
    if (isInWishlist(productId)) {
      toast.success(`${productName} removed from wishlist!`);
    } else {
      addToWishlist(productId);
      toast.success(`${productName} added to wishlist!`);
    }
  }, [addToWishlist, isInWishlist]);

  if (compareProducts.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-16">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Compare Products</h1>
            <p className="text-gray-600 mb-8">
              No products to compare. Add products from the products page.
            </p>
            <Link to="/products">
              <Button className="bg-black hover:bg-[#D4AF37] text-white">
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/products" className="flex items-center gap-2 text-gray-600 hover:text-[#D4AF37] mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Products
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold">Compare Products</h1>
            <p className="text-gray-600 mt-2">
              {compareProducts.length} of 4 products being compared
            </p>
          </div>
          <Button
            onClick={clearCompare}
            variant="outline"
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            Clear All
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
            <thead>
              <tr>
                <th className="p-4 text-left bg-gray-50 w-48 sticky left-0 z-10">
                  <span className="text-gray-500 text-sm">Product</span>
                </th>
                {compareProducts.map((product) => (
                  <th key={product.id} className="p-4 min-w-64">
                    <div className="relative">
                      <button
                        onClick={() => removeFromCompare(product.id)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="font-bold text-lg mb-1 line-clamp-2">{product.name}</h3>
                      <p className="text-xs text-gray-500 mb-2">{product.category}</p>
                      {product.brand && (
                        <p className="text-sm text-gray-600 mb-2">Brand: {product.brand}</p>
                      )}
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < (product.rating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        {product.rating && (
                          <span className="text-sm text-gray-600 ml-1">({product.rating})</span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-[#D4AF37] mb-4">
                        Rs. {product.price.toLocaleString()}
                      </p>
                      <div className="space-y-2">
                        <Button
                          onClick={() => handleAddToCart(product.id, product.name)}
                          disabled={!product.isAvailable}
                          className="w-full bg-black hover:bg-[#D4AF37] text-white disabled:bg-gray-300"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {product.isAvailable ? "Add to Cart" : "Not Available"}
                        </Button>
                        <Button
                          onClick={() => handleToggleWishlist(product.id, product.name)}
                          variant="outline"
                          className="w-full"
                        >
                          {isInWishlist(product.id) ? (
                            <>
                              <Check className="w-4 h-4 mr-2 text-green-600" />
                              In Wishlist
                            </>
                          ) : (
                            "Add to Wishlist"
                          )}
                        </Button>
                      </div>
                    </div>
                  </th>
                ))}
                {Array.from({ length: 4 - compareProducts.length }).map((_, i) => (
                  <th key={`empty-${i}`} className="p-4 min-w-64 border-l border-gray-200">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center h-full flex items-center justify-center">
                      <div>
                        <p className="text-gray-400 mb-2">Add more products</p>
                        <Link to="/products">
                          <Button variant="outline" size="sm">
                            Browse Products
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-4 bg-gray-50 font-medium sticky left-0">Description</td>
                {compareProducts.map((product) => (
                  <td key={product.id} className="p-4 text-sm text-gray-600">
                    {product.description}
                  </td>
                ))}
                {Array.from({ length: 4 - compareProducts.length }).map((_, i) => (
                  <td key={`empty-desc-${i}`} className="p-4"></td>
                ))}
              </tr>
              <tr className="border-t">
                <td className="p-4 bg-gray-50 font-medium sticky left-0">Availability</td>
                {compareProducts.map((product) => (
                  <td key={product.id} className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      product.isAvailable
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {product.isAvailable ? "In Stock" : "Out of Stock"}
                    </span>
                  </td>
                ))}
                {Array.from({ length: 4 - compareProducts.length }).map((_, i) => (
                  <td key={`empty-avail-${i}`} className="p-4"></td>
                ))}
              </tr>
              <tr className="border-t">
                <td className="p-4 bg-gray-50 font-medium sticky left-0">Category</td>
                {compareProducts.map((product) => (
                  <td key={product.id} className="p-4 text-sm">
                    {product.category}
                  </td>
                ))}
                {Array.from({ length: 4 - compareProducts.length }).map((_, i) => (
                  <td key={`empty-cat-${i}`} className="p-4"></td>
                ))}
              </tr>
              <tr className="border-t">
                <td className="p-4 bg-gray-50 font-medium sticky left-0">Price</td>
                {compareProducts.map((product) => (
                  <td key={product.id} className="p-4 font-bold text-[#D4AF37]">
                    Rs. {product.price.toLocaleString()}
                  </td>
                ))}
                {Array.from({ length: 4 - compareProducts.length }).map((_, i) => (
                  <td key={`empty-price-${i}`} className="p-4"></td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {compareProducts.length < 4 && (
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">
              You can compare up to 4 products. Add more from the products page.
            </p>
            <Link to="/products">
              <Button className="bg-black hover:bg-[#D4AF37] text-white">
                Add More Products
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
