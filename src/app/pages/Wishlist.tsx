import { Link } from "react-router";
import { Heart, ShoppingCart, X } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useAdmin } from "../context/AdminContext";
import { useCart } from "../context/CartContext";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { useMemo, useCallback } from "react";

export default function Wishlist() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { products } = useAdmin();
  const { addToCart } = useCart();

  const safeProducts = products || [];
  
  // Memoize wishlist products filtering
  const wishlistProducts = useMemo(
    () => safeProducts.filter((product) => wishlist.includes(product.id)),
    [safeProducts, wishlist]
  );

  const handleAddToCart = useCallback((productId: string, productName: string) => {
    addToCart(productId);
    toast.success(`${productName} added to cart!`);
  }, [addToCart]);

  const handleRemoveFromWishlist = useCallback((productId: string, productName: string) => {
    removeFromWishlist(productId);
    toast.success(`${productName} removed from wishlist!`);
  }, [removeFromWishlist]);

  if (wishlistProducts.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Heart className="w-24 h-24 mx-auto text-gray-300 mb-6" />
          <h2 className="text-3xl font-bold mb-4">Your Wishlist is Empty</h2>
          <p className="text-gray-600 mb-8 max-w-md">
            Start adding products to your wishlist by clicking the heart icon on
            any product.
          </p>
          <Link to="/products">
            <Button
              size="lg"
              className="bg-black hover:bg-[#D4AF37] text-white"
            >
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">My Wishlist</h1>
          <p className="text-gray-600">
            {wishlistProducts.length}{" "}
            {wishlistProducts.length === 1 ? "item" : "items"} saved
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <button
                  onClick={() =>
                    handleRemoveFromWishlist(product.id, product.name)
                  }
                  className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  title="Remove from wishlist"
                >
                  <X className="w-5 h-5" />
                </button>
                {!product.isAvailable && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      Not Available
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="mb-2">
                  <span className="text-xs text-gray-500 font-medium">
                    {product.category}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-2 line-clamp-2 min-h-[3.5rem]">
                  {product.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {product.description}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-[#D4AF37]">
                      Rs. {product.price.toLocaleString()}
                    </span>
                  </div>
                  <div className={`text-sm font-semibold ${product.isAvailable ? "text-green-600" : "text-red-600"}`}>
                    {product.isAvailable ? "Available" : "Not Available"}
                  </div>
                </div>

                <Button
                  onClick={() => handleAddToCart(product.id, product.name)}
                  disabled={!product.isAvailable}
                  className="w-full bg-black hover:bg-[#D4AF37] text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {product.isAvailable ? "Add to Cart" : "Not Available"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
