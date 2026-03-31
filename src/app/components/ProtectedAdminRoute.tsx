import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Loader2 } from "lucide-react";
import { useAdmin } from "../context/AdminContext";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { isAdminLoggedIn, isAdminDataLoaded } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isAdminDataLoaded && !isAdminLoggedIn) {
      navigate("/admin/login", { replace: true });
    } else if (isAdminLoggedIn) {
      setShowContent(true);
    }
  }, [isAdminLoggedIn, isAdminDataLoaded, navigate]);

  if (!isAdminDataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return showContent ? <>{children}</> : null;
}
