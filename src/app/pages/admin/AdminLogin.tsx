import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Lock, Mail } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useAdmin } from "../../context/AdminContext";
import { toast } from "sonner";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, isAdminLoggedIn, storeProfile, setupAdmin, adminUid, isAdminDataLoaded } = useAdmin();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(true);

  useEffect(() => {
    if (isAdminDataLoaded && adminUid) {
      setIsSetupMode(false);
    }
  }, [isAdminDataLoaded, adminUid]);

  useEffect(() => {
    if (isAdminLoggedIn) {
      navigate("/admin");
    }
  }, [isAdminLoggedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log("Form submitted, isSetupMode:", isSetupMode);

    if (!formData.email || !formData.password) {
      toast.error("Please enter email and password");
      setIsLoading(false);
      return;
    }

    // Safety timeout - reset loading after 15 seconds
    const timeoutId = setTimeout(() => {
      console.log("Timeout reached, resetting loading state");
      setIsLoading(false);
    }, 15000);

    try {
      let success: boolean;
      if (isSetupMode) {
        console.log("Calling setupAdmin...");
        success = await setupAdmin(formData.email, formData.password);
        console.log("setupAdmin result:", success);
      } else {
        success = await login(formData.email, formData.password);
      }

      clearTimeout(timeoutId);

      if (success) {
        toast.success(isSetupMode ? "Admin account created!" : "Login successful!");
        navigate("/admin");
      } else {
        toast.error("Invalid credentials or not authorized as admin");
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Login error:", error);
      toast.error("An error occurred. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="text-white">{storeProfile.storeName}</span>
            <span className="text-[#D4AF37]"> {storeProfile.storeNameAccent}</span>
          </h1>
          <p className="text-gray-400">Admin Login</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-black" />
            </div>
            <h2 className="text-2xl font-bold">
              {isSetupMode ? "Setup Admin" : "Admin Access"}
            </h2>
            <p className="text-gray-600 text-sm mt-2">
              {isSetupMode 
                ? "Create your admin account to get started"
                : "Enter your credentials to continue"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="pl-10"
                  placeholder="admin@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="pl-10"
                  placeholder="Enter password"
                  autoComplete={isSetupMode ? "new-password" : "current-password"}
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-black hover:bg-[#D4AF37] text-white"
              disabled={isLoading}
            >
              {isLoading 
                ? "Please wait..." 
                : isSetupMode 
                  ? "Create Admin Account" 
                  : "Login to Dashboard"}
            </Button>
          </form>

          {!isSetupMode && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 font-semibold mb-2">
                Security Notice:
              </p>
              <p className="text-xs text-gray-600">
                This admin panel is protected. Only authorized users can access.
              </p>
            </div>
          )}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Website
          </button>
        </div>
      </div>
    </div>
  );
}
