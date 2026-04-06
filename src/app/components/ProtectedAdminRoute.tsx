import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Loader2, ShieldAlert, Lock, AlertTriangle, UserX } from "lucide-react";
import { useAdmin } from "../context/AdminContext";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { isAdminLoggedIn, isAdminDataLoaded, firebaseUser } = useAdmin();
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#D4AF37]" />
          <p className="mt-4 text-gray-400">Verifying access credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAdminLoggedIn) {
    const isCustomerUser = firebaseUser !== null;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
        <div className="text-center max-w-lg mx-auto p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            {isCustomerUser ? (
              <UserX className="w-10 h-10 text-red-400" />
            ) : (
              <ShieldAlert className="w-10 h-10 text-red-400" />
            )}
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-3">Access Denied</h2>
          
          <p className="text-gray-400 mb-6">
            {isCustomerUser 
              ? "You are logged in as a customer account. The admin portal is restricted to administrators only."
              : "You are not authorized to access the admin portal. This area is restricted to authorized administrators only."
            }
          </p>
          
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-300">
                <p className="font-semibold mb-1">Security Notice</p>
                <p>This incident has been logged. Only the authorized administrator can access this portal.</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Return to Website
            </button>
            <button
              onClick={() => navigate("/admin/login")}
              className="px-6 py-3 bg-[#D4AF37] hover:bg-[#C5A028] text-black font-medium rounded-lg transition-colors"
            >
              Admin Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
