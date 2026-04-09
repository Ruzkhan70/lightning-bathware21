import { Link } from "react-router";
import { X, GitCompare, ArrowRight } from "lucide-react";
import { useComparison } from "../context/ComparisonContext";
import { useAdmin } from "../context/AdminContext";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { useMemo } from "react";

export default function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useComparison();
  const { products } = useAdmin();

  const compareProducts = useMemo(
    () => compareList
      .map(id => products.find(p => p.id === id))
      .filter(Boolean),
    [compareList, products]
  );

  if (compareList.length < 2) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-[#D4AF37]" />
                <span className="font-semibold">
                  Compare ({compareList.length})
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {compareProducts.map((product) => (
                  <div
                    key={product!.id}
                    className="relative group flex-shrink-0"
                  >
                    <img
                      src={product!.image}
                      alt={product!.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <button
                      onClick={() => removeFromCompare(product!.id)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={clearCompare}
                variant="ghost"
                size="sm"
              >
                Clear
              </Button>
              <Link to="/compare">
                <Button className="bg-[#D4AF37] hover:bg-[#C5A028] text-black">
                  Compare Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
