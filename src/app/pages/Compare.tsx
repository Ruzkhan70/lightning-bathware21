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

  const compareRows = [
    { label: "Price", render: (product: any) => {
      const discount = getProductDiscount(product.id);
      const displayPrice = discount.hasDiscount ? discount.discountedPrice : product.price;
      return (
        <div>
          <div className="text-xl font-bold">Rs. {displayPrice?.toLocaleString()}</div>
          {discount.hasDiscount && (
            <div className="text-sm text-gray-500 line-through">Rs. {product.price.toLocaleString()}</div>
          )}
        </div>
      );
    }},
    { label: "Category", render: (product: any) => product.category },
    { label: "Availability", render: (product: any) => (
      <span className={`px-2 py-1 rounded-full text-sm ${product.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
        {product.isAvailable ? "In Stock" : "Out of Stock"}
      </span>
    )},
    { label: "Colors", render: (product: any) => product.variants?.map((v: any) => v.color).join(", ") || "-", show: compareList[0]?.has_variants },
    { label: "Sizes", render: (product: any) => product.sizes?.map((s: any) => s.size).join(", ") || "-", show: compareList[0]?.has_sizes },
    { label: "Description", render: (product: any) => product.description.substring(0, 100) + "..." },
  ].filter(r => r.show !== false);

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Scale className="w-5 h-5 md:w-6 md:h-6 text-[#D4AF37]" />
            Compare Products ({compareList.length})
          </h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={clearCompare} className="flex-1 sm:flex-none">Clear All</Button>
            <Button asChild className="bg-[#D4AF37] hover:bg-[#B8962E] text-black flex-1 sm:flex-none">
              <Link to="/products">Add More</Link>
            </Button>
          </div>
        </div>

        {/* Desktop: Table View */}
        <div className="hidden md:block overflow-x-auto">
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
              {compareRows.map((row, i) => (
                <tr key={row.label} className={i === 0 ? "" : "border-t"}>
                  <td className="p-4 font-medium bg-gray-50">{row.label}</td>
                  {compareList.map((product) => (
                    <td key={product.id} className="p-4 text-center border-l text-sm text-gray-600">
                      {row.render(product)}
                    </td>
                  ))}
                </tr>
              ))}
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

        {/* Mobile: Card View */}
        <div className="md:hidden space-y-4">
          {compareList.map((product) => {
            const discount = getProductDiscount(product.id);
            const displayPrice = discount.hasDiscount ? discount.discountedPrice : product.price;
            return (
              <div key={product.id} className="bg-white rounded-xl shadow overflow-hidden">
                <div className="relative p-4 bg-gray-50">
                  <button
                    onClick={() => removeFromCompare(product.id)}
                    className="absolute top-3 right-3 p-1.5 bg-white rounded-full shadow hover:bg-red-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-4">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg cursor-pointer"
                      onClick={() => navigate(`/products?search=${product.name}`)}
                    />
                    <div className="min-w-0">
                      <Link to={`/products?search=${product.name}`} className="font-semibold text-sm hover:text-[#D4AF37] line-clamp-2">
                        {product.name}
                      </Link>
                      <div className="text-lg font-bold mt-1">Rs. {displayPrice?.toLocaleString()}</div>
                      {discount.hasDiscount && (
                        <div className="text-xs text-gray-500 line-through">Rs. {product.price.toLocaleString()}</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Category</span>
                    <span className="font-medium">{product.category}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Availability</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${product.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {product.isAvailable ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                  {product.has_variants && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Colors</span>
                      <span className="font-medium">{product.variants?.map((v: any) => v.color).join(", ") || "-"}</span>
                    </div>
                  )}
                  {product.has_sizes && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Sizes</span>
                      <span className="font-medium">{product.sizes?.map((s: any) => s.size).join(", ") || "-"}</span>
                    </div>
                  )}
                  <div className="text-sm">
                    <span className="text-gray-500 block mb-1">Description</span>
                    <p className="text-gray-600">{product.description.substring(0, 100)}...</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.isAvailable}
                      className="flex-1 min-h-[44px]"
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Cart
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleAddToWishlist(product.id)}
                      className="flex-1 min-h-[44px]"
                    >
                      <Heart className={`w-4 h-4 mr-1 ${isInWishlist(product.id) ? "fill-red-500 text-red-500" : ""}`} />
                      {isInWishlist(product.id) ? "Wishlist" : "Wishlist"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}