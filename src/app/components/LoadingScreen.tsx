import { useEffect, useState } from "react";
import { useAdmin } from "../context/AdminContext";

export default function LoadingScreen() {
  const { storeProfile } = useAdmin();
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? "" : d + ".");
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">
          <span className="text-black">{storeProfile.storeName}</span>
          <span className="text-[#D4AF37]"> {storeProfile.storeNameAccent}</span>
        </h1>
        
        <div className="flex items-center justify-center gap-1">
          <div className="w-3 h-3 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-3 h-3 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-3 h-3 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        
        <p className="mt-6 text-gray-500 text-sm">
          Loading{dots}
        </p>
      </div>
    </div>
  );
}
