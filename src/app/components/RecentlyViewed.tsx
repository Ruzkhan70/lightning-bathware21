import { Link } from "react-router";
import { Clock, X, Eye } from "lucide-react";
import { useRecentlyViewed, RecentlyViewedProduct } from "../context/RecentlyViewedContext";
import { useAdmin } from "../context/AdminContext";
import LazyImage from "./LazyImage";

export default function RecentlyViewed() {
  const { products, clearHistory } = useRecentlyViewed();
  const { products: allProducts } = useAdmin();

  if (products.length === 0) return null;

  const validProducts = products
    .map(rv => {
      const fullProduct = allProducts.find(p => p.id === rv.id);
      if (!fullProduct) return null;
      return { ...fullProduct, viewedAt: rv.viewedAt };
    })
    .filter(Boolean) as RecentlyViewedProduct[];

  if (validProducts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#D4AF37]" />
          <h3 className="text-lg font-bold">Recently Viewed</h3>
        </div>
        <button
          onClick={clearHistory}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <X className="w-4 h-4" />
          Clear
        </button>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {validProducts.slice(0, 6).map((product) => (
          <Link
            key={product.id}
            to={`/products?search=${encodeURIComponent(product.name)}`}
            className="flex-shrink-0 w-40 group"
          >
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
              <LazyImage
                src={product.image}
                alt={product.name}
                className="w-full h-full group-hover:scale-105 transition-transform"
              />
            </div>
            <p className="text-sm font-medium line-clamp-2 group-hover:text-[#D4AF37] transition-colors">
              {product.name}
            </p>
            <p className="text-sm font-bold text-[#D4AF37]">
              Rs. {product.price.toLocaleString()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function RecentlyViewedInline() {
  const { products } = useRecentlyViewed();
  const { products: allProducts } = useAdmin();

  if (products.length === 0) return null;

  const validProducts = products
    .map(rv => {
      const fullProduct = allProducts.find(p => p.id === rv.id);
      if (!fullProduct) return null;
      return { ...fullProduct, viewedAt: rv.viewedAt };
    })
    .filter(Boolean) as RecentlyViewedProduct[];

  if (validProducts.length === 0) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <Eye className="w-4 h-4" />
      <span>{validProducts.length} recently viewed</span>
    </div>
  );
}
