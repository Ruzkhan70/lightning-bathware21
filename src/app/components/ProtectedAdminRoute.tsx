import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAdmin } from "../context/AdminContext";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { isAdminLoggedIn, isAdminDataLoaded } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (isAdminDataLoaded) {
      setAuthChecked(true);
    }
  }, [isAdminDataLoaded]);

  useEffect(() => {
    if (!authChecked) return;
    
    if (!isAdminLoggedIn) {
      navigate("/admin/login", { 
        replace: true,
        state: { from: location.pathname }
      });
    }
  }, [isAdminLoggedIn, authChecked, navigate, location.pathname]);

  if (!authChecked || !isAdminDataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md mx-auto p-8">
          <ShieldAlert className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You are not authorized to access the admin portal. This area is restricted to authorized administrators only.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Return to Website
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
