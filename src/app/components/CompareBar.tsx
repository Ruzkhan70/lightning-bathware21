import { Link } from "react-router";
import { X, ArrowRight, Scale } from "lucide-react";
import { useCompare } from "../context/CompareContext";
import { useAdmin } from "../context/AdminContext";
import { Button } from "./ui/button";

export default function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const { storeProfile } = useAdmin();

  const enableCompare = storeProfile?.enableCompareFeature === true;

  if (!enableCompare || compareList.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t z-40 p-3 md:p-4">
      <div className="container mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#D4AF37]" />
            <span className="font-medium text-sm">Compare ({compareList.length}/4)</span>
          </div>
          <Button variant="outline" size="sm" onClick={clearCompare} className="sm:hidden min-h-[44px]">
            Clear
          </Button>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {compareList.map((product) => (
            <div 
              key={product.id} 
              className="relative flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 flex-shrink-0"
            >
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-8 h-8 object-cover rounded-full"
              />
              <span className="text-sm truncate max-w-[80px] md:max-w-[100px]">
                {product.name}
              </span>
              <button
                onClick={() => removeFromCompare(product.id)}
                className="p-1 hover:bg-gray-200 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearCompare}
          >
            Clear
          </Button>
          <Button 
            asChild
            className="bg-[#D4AF37] hover:bg-[#B8962E] text-black"
            disabled={compareList.length < 2}
          >
            <Link to="/compare">
              Compare <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}