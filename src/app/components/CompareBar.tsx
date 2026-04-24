import { Link } from "react-router";
import { X, ArrowRight, Scale } from "lucide-react";
import { useCompare } from "../context/CompareContext";
import { Button } from "./ui/button";

export default function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();

  if (compareList.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t z-40 p-4">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-[#D4AF37]" />
          <span className="font-medium">Compare ({compareList.length}/4)</span>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto">
          {compareList.map((product) => (
            <div 
              key={product.id} 
              className="relative flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5"
            >
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-8 h-8 object-cover rounded-full"
              />
              <span className="text-sm truncate max-w-[100px] whitespace-nowrap">
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

        <div className="flex items-center gap-2">
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