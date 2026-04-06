import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Lock, Mail, AlertCircle, Shield, User, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useAdmin } from "../../context/AdminContext";
import { toast } from "sonner";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAdminLoggedIn, storeProfile, setupAdmin, isAdminDataLoaded, adminExists } = useAdmin();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isAdminDataLoaded) {
      setIsReady(true);
    }
  }, [isAdminDataLoaded]);

  useEffect(() => {
    if (isAdminLoggedIn) {
      navigate("/admin", { replace: true });
    }
  }, [isAdminLoggedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    if (!formData.email || !formData.password) {
      setErrorMessage("Please enter both email and password");
      toast.error("Please enter email and password");
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage("Please enter a valid email address");
      toast.error("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      let result: { success: boolean; error?: string };
      
      // If no admin exists, this is a setup
      // If admin exists, this is a login
      if (!adminExists) {
        if (!formData.displayName.trim()) {
          setErrorMessage("Please enter your name");
          toast.error("Please enter your name");
          setIsLoading(false);
          return;
        }
        result = await setupAdmin(formData.email, formData.password, formData.displayName);
      } else {
        result = await login(formData.email, formData.password);
      }

      if (result.success) {
        toast.success(!adminExists ? "Admin account created!" : "Login successful!");
        const from = (location.state as { from?: string })?.from || "/admin";
        navigate(from, { replace: true });
      } else {
        setErrorMessage(result.error || "Authentication failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#D4AF37] mx-auto" />
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const isSetupMode = !adminExists;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="text-white">{storeProfile.storeName}</span>
            <span className="text-[#D4AF37]"> {storeProfile.storeNameAccent}</span>
          </h1>
          <p className="text-gray-400">Admin Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-black" />
            </div>
            <h2 className="text-2xl font-bold">
              {isSetupMode ? "Setup Admin Account" : "Admin Login"}
            </h2>
            <p className="text-gray-600 text-sm mt-2">
              {isSetupMode 
                ? "Create your admin credentials to get started. This will be the only admin account." 
                : "Enter your admin credentials to access the dashboard."}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Only show name field during setup */}
            {isSetupMode && (
              <div>
                <Label htmlFor="displayName">Full Name</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="displayName"
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => {
                      setFormData({ ...formData, displayName: e.target.value });
                      setErrorMessage(null);
                    }}
                    className="pl-10"
                    placeholder="John Doe"
                    autoComplete="name"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setErrorMessage(null);
                  }}
                  className="pl-10"
                  placeholder={isSetupMode ? "admin@example.com" : "admin@yourdomain.com"}
                  autoComplete="email"
                  disabled={isLoading}
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
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setErrorMessage(null);
                  }}
                  className="pl-10"
                  placeholder="Enter password"
                  autoComplete={isSetupMode ? "new-password" : "current-password"}
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-black hover:bg-[#D4AF37] text-white transition-colors"
              disabled={isLoading}
            >
              {isLoading 
                ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {isSetupMode ? "Creating Account..." : "Logging in..."}
                  </span>
                ) 
                : isSetupMode 
                  ? "Create Admin Account" 
                  : "Login to Dashboard"}
            </Button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-600 font-semibold mb-1">
                  {isSetupMode ? "First-Time Setup" : "Secure Access"}
                </p>
                <p className="text-xs text-gray-600">
                  {isSetupMode 
                    ? "This creates the only admin account. After setup, only this email can access the admin portal."
                    : "This admin portal is secured. Only the authorized administrator can access. All login attempts are logged."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← Back to Website
          </button>
        </div>
      </div>
    </div>
  );
}
