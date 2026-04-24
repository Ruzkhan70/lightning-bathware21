import { Scale, X, ShoppingCart, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useCompare } from "../context/CompareContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAdmin } from "../context/AdminContext";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

export default function ComparePage() {
  const { compareList, clearCompare, removeFromCompare } = useCompare();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const { getProductDiscount } = useAdmin();
  const navigate = useNavigate();

  const handleAddToCart = (product: any) => {
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  const handleAddToWishlist = (productId: string) => {
    addToWishlist(productId);
    toast.success("Added to wishlist!");
  };

  if (compareList.length < 2) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Scale className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Add Products to Compare</h2>
          <p className="text-gray-600 mb-4">
            You need at least 2 products to compare. Browse products and click the compare button.
          </p>
          <Button asChild className="bg-[#D4AF37] hover:bg-[#B8962E] text-black">
            <Link to="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="w-6 h-6 text-[#D4AF37]" />
            Compare Products ({compareList.length})
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={clearCompare}>Clear All</Button>
            <Button asChild className="bg-[#D4AF37] hover:bg-[#B8962E] text-black">
              <Link to="/products">Add More</Link>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow">
            <thead>
              <tr>
                <th className="p-4 text-left bg-gray-50 w-40"></th>
                {compareList.map((product) => (
                  <th key={product.id} className="p-4 text-center border-l">
                    <div className="relative">
                      <button
                        onClick={() => removeFromCompare(product.id)}
                        className="absolute -top-2 -right-2 p-1 bg-gray-100 rounded-full hover:bg-red-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-32 h-32 object-cover rounded-lg mx-auto mb-2 cursor-pointer"
                        onClick={() => navigate(`/products?search=${product.name}`)}
                      />
                      <Link 
                        to={`/products?search=${product.name}`}
                        className="font-medium text-sm hover:text-[#D4AF37] line-clamp-2"
                      >
                        {product.name}
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-4 font-medium bg-gray-50">Price</td>
                {compareList.map((product) => {
                  const discount = getProductDiscount(product.id);
                  const displayPrice = discount.hasDiscount ? discount.discountedPrice : product.price;
                  return (
                    <td key={product.id} className="p-4 text-center border-l">
                      <div className="text-xl font-bold">
                        Rs. {displayPrice?.toLocaleString()}
                      </div>
                      {discount.hasDiscount && (
                        <div className="text-sm text-gray-500 line-through">
                          Rs. {product.price.toLocaleString()}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-t">
                <td className="p-4 font-medium bg-gray-50">Category</td>
                {compareList.map((product) => (
                  <td key={product.id} className="p-4 text-center border-l">
                    {product.category}
                  </td>
                ))}
              </tr>
              <tr className="border-t">
                <td className="p-4 font-medium bg-gray-50">Availability</td>
                {compareList.map((product) => (
                  <td key={product.id} className="p-4 text-center border-l">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      product.isAvailable 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    }`}>
                      {product.isAvailable ? "In Stock" : "Out of Stock"}
                    </span>
                  </td>
                ))}
              </tr>
              {compareList[0]?.has_variants && (
                <tr className="border-t">
                  <td className="p-4 font-medium bg-gray-50">Colors</td>
                  {compareList.map((product) => (
                    <td key={product.id} className="p-4 text-center border-l">
                      {product.variants?.map(v => v.color).join(", ") || "-"}
                    </td>
                  ))}
                </tr>
              )}
              {compareList[0]?.has_sizes && (
                <tr className="border-t">
                  <td className="p-4 font-medium bg-gray-50">Sizes</td>
                  {compareList.map((product) => (
                    <td key={product.id} className="p-4 text-center border-l">
                      {product.sizes?.map(s => s.size).join(", ") || "-"}
                    </td>
                  ))}
                </tr>
              )}
              <tr className="border-t">
                <td className="p-4 font-medium bg-gray-50">Description</td>
                {compareList.map((product) => (
                  <td key={product.id} className="p-4 text-center border-l text-sm text-gray-600">
                    {product.description.substring(0, 100)}...
                  </td>
                ))}
              </tr>
              <tr className="border-t">
                <td className="p-4 font-medium bg-gray-50">Actions</td>
                {compareList.map((product) => (
                  <td key={product.id} className="p-4 text-center border-l">
                    <div className="flex flex-col gap-2 items-center">
                      <Button
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.isAvailable}
                        className="w-full"
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Add to Cart
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleAddToWishlist(product.id)}
                        className="w-full"
                      >
                        <Heart className={`w-4 h-4 mr-1 ${isInWishlist(product.id) ? "fill-red-500 text-red-500" : ""}`} />
                        {isInWishlist(product.id) ? "In Wishlist" : "Wishlist"}
                      </Button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}