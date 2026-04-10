import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { User, LogOut, Package, MapPin, Phone, Mail, Eye, EyeOff, ArrowLeft, Loader2, X, Truck, ShoppingBag, FileText, RefreshCw } from "lucide-react";
import { useUser } from "../context/UserContext";
import { useAdmin } from "../context/AdminContext";
import { useCart } from "../context/CartContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import emailjs from "@emailjs/browser";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { Order } from "../context/AdminContext";
import { cn } from "../../lib/utils";
import ContentLoader from "../components/ContentLoader";

const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "";
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "";
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "";

export default function Account() {
  const navigate = useNavigate();
  const { user, isLoggedIn, login, register, logout, resetPassword, updateProfile } = useUser();
  const { orders, invoices, storeProfile, getInvoiceByOrderId, isDataLoaded } = useAdmin();
  const { syncCartWithFirebase, isSyncing } = useCart();
  const safeOrders = orders || [];
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Forgot password steps
  const [forgotStep, setForgotStep] = useState<"email" | "verify" | "reset">("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [showForgotPasswordField, setShowForgotPasswordField] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  // Login/Register form state
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerAddress, setRegisterAddress] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const previousOrderStatuses = useRef<Record<string, string>>({});
  
  // Local state for user orders with real-time sync
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);

  // Real-time orders listener - sets up immediately after login
  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
      setUserOrders([]);
      return;
    }

    setIsOrdersLoading(true);
    const ordersRef = collection(db, "orders");
    
    // Query with orderBy only first, then filter by userId in memory
    // This avoids needing a composite index
    const q = query(ordersRef, orderBy("date", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Filter orders by userId in memory
      const userOrdersList: Order[] = [];
      
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data() as Order;
        if (data.userId === user.id) {
          const order = { ...data, id: data.id || docSnap.id };
          
          // Check for status changes
          const previousStatus = previousOrderStatuses.current[order.id];
          if (previousStatus && previousStatus !== order.status) {
            let message = "";
            if (order.status === "Processing") {
              message = `Your order #${order.id} is now being processed!`;
            } else if (order.status === "Delivered") {
              message = `Your order #${order.id} has been delivered!`;
            }
            
            if (message) {
              toast.success(message, { duration: 8000 });
            }
          }
          
          previousOrderStatuses.current[order.id] = order.status;
          userOrdersList.push(order);
        }
      });
      
      setUserOrders(userOrdersList);
      setIsOrdersLoading(false);
    }, (error) => {
      console.error("Error fetching user orders:", error);
      setIsOrdersLoading(false);
    });

    return () => unsubscribe();
  }, [isLoggedIn, user?.id]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(loginEmail, loginPassword);
    if (result.success) {
      setLoginEmail("");
      setLoginPassword("");
      if (user?.id) {
        await syncCartWithFirebase(user.id);
        toast.success("Your cart has been synced!");
      }
    } else {
      toast.error(result.error || "Invalid email or password");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (registerPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const phoneRegex = /^(\+94|0)[1-9][0-9]{8}$/;
    if (!phoneRegex.test(registerPhone.replace(/\s/g, ''))) {
      toast.error("Please enter a valid Sri Lankan phone number (e.g., 0771234567)");
      return;
    }

    const result = await register(
      registerName,
      registerEmail,
      registerPhone,
      registerAddress,
      registerPassword
    );

    if (result.success) {
      toast.success("Account created successfully!");
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPhone("");
      setRegisterAddress("");
      setRegisterPassword("");
      setConfirmPassword("");
    } else {
      toast.error("Email already registered");
    }
  };

  const handleSendCode = async () => {
    setIsSendingCode(true);
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: forgotEmail,
          verification_code: code,
          app_name: `${storeProfile.storeName} ${storeProfile.storeNameAccent}`,
        },
        EMAILJS_PUBLIC_KEY
      );
      
      setSentCode(code);
      localStorage.setItem("resetCode", JSON.stringify({ 
        code, 
        email: forgotEmail, 
        timestamp: Date.now() 
      }));
      
      toast.success("Verification code sent to your email!");
      setForgotStep("verify");
    } catch (error) {
      console.error("EmailJS Error:", error);
      toast.error("Failed to send email. Please check configuration.");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = () => {
    const storedData = localStorage.getItem("resetCode");
    if (!storedData) {
      toast.error("Please request a new code");
      return;
    }

    const { code, timestamp } = JSON.parse(storedData);
    
    // Code expires after 10 minutes
    if (Date.now() - timestamp > 10 * 60 * 1000) {
      toast.error("Code expired. Please request a new one.");
      localStorage.removeItem("resetCode");
      setForgotStep("email");
      return;
    }

    if (verificationCode.trim() === code) {
      setForgotStep("reset");
      setShowForgotPasswordField(true);
      toast.success("Code verified! Set your new password.");
    } else {
      toast.error("Invalid verification code");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotNewPassword !== forgotConfirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (forgotNewPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    const result = await resetPassword(forgotEmail, forgotNewPassword);
    if (result.success) {
      toast.success("Password reset successfully! Please login.");
      localStorage.removeItem("resetCode");
      closeForgotPassword();
      setIsLoginMode(true);
    } else if (result.error === "email_not_found") {
      toast.error("No account found with this email");
    } else {
      toast.error(`Error: ${result.error || "Please check Firebase rules"}`);
    }
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotStep("email");
    setForgotEmail("");
    setVerificationCode("");
    setSentCode("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setShowForgotPasswordField(false);
    setShowResetPassword(false);
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  const handleSyncCart = async () => {
    if (user?.id) {
      await syncCartWithFirebase(user.id);
      toast.success("Cart synced successfully!");
    }
  };

  const handleEditProfile = () => {
    setEditPhone(user?.phone || "");
    setEditAddress(user?.address || "");
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    const phoneRegex = /^(\+94|0)?[1-9][0-9]{8}$/;
    if (editPhone && !phoneRegex.test(editPhone.replace(/\s/g, ''))) {
      toast.error("Please enter a valid phone number");
      return;
    }
    
    if (!editAddress.trim()) {
      toast.error("Please enter your address");
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateProfile({
        phone: editPhone.trim(),
        address: editAddress.trim(),
      });
      setIsEditingProfile(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
  };

  const handleViewInvoice = (orderId: string) => {
    const invoice = getInvoiceByOrderId(orderId);
    if (invoice) {
      navigate(`/invoice/${invoice.id}`);
    } else {
      toast.error("Invoice not found for this order");
    }
  };

  if (isLoggedIn && user) {
    if (!isDataLoaded) {
      return (
        <div className="bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#D4AF37]" />
            <p className="mt-2 text-gray-600">Loading your account...</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-6 md:py-12">
          <div className="max-w-4xl mx-auto">
            {/* User Info Card */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8 mb-6 md:mb-8">
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 bg-[#D4AF37] rounded-full flex-shrink-0">
                    <User className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-1">{user.name}</h1>
                    <p className="text-gray-600 text-sm sm:text-base">Customer Account</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Stacked on Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-6">
                <Button
                  onClick={handleEditProfile}
                  variant="outline"
                  className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white text-sm sm:text-base"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  onClick={handleSyncCart}
                  variant="outline"
                  disabled={isSyncing}
                  title="Merges your saved cart items with your current cart"
                  className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white text-sm sm:text-base"
                >
                  <RefreshCw className={cn("w-4 h-4 mr-2", isSyncing && "animate-spin")} />
                  {isSyncing ? "Syncing..." : "Sync Cart"}
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white text-sm sm:text-base"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>

              {isEditingProfile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Phone</Label>
                    <Input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="0771234567"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Address</Label>
                    <Input
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="Your address"
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2 flex gap-2 justify-end">
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      className="bg-[#D4AF37] hover:bg-[#C5A028] text-black"
                    >
                      {isSavingProfile ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex items-start sm:items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-500">Email</p>
                      <p className="font-medium text-sm sm:text-base break-all">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start sm:items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-sm sm:text-base">{user.phone || "Not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-start sm:items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg sm:col-span-2">
                    <MapPin className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-500">Address</p>
                      <p className="font-medium text-sm sm:text-base">{user.address || "Not set"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* My Orders Section */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 md:mb-8">
              <div className="bg-[#D4AF37] text-black px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
                <Package className="w-5 h-5 sm:w-6 sm:h-6" />
                <h2 className="text-lg sm:text-xl font-bold">My Orders</h2>
                {userOrders.length > 0 && (
                  <span className="ml-auto px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm bg-black text-white">
                    {userOrders.length}
                  </span>
                )}
              </div>
              <div className="p-4 sm:p-6 md:p-8">
                {isOrdersLoading ? (
                  <div className="py-8 sm:py-12">
                    <ContentLoader minHeight="min-h-[200px]" />
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600">No orders yet</p>
                    <Button
                      onClick={() => navigate("/products")}
                      className="mt-4 bg-black hover:bg-[#D4AF37] text-white"
                    >
                      Browse Products
                    </Button>
                  </div>
                ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {userOrders.map((order) => (
                        <div
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-2 sm:mb-3">
                            <div>
                              <p className="font-bold text-base sm:text-lg">Order #{order.id}</p>
                              <p className="text-xs sm:text-sm text-gray-500">
                                {new Date(order.date).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                            <span
                              className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${
                                order.status === "Delivered"
                                  ? "bg-green-100 text-green-700"
                                  : order.status === "Processing"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                          <div className="border-t border-gray-200 pt-2 sm:pt-3">
                            <p className="text-xs sm:text-sm text-gray-600 mb-2">
                              {order.products.length} item{order.products.length > 1 ? "s" : ""}
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-lg sm:text-xl text-[#D4AF37]">
                                Rs. {order.total.toLocaleString()}
                              </p>
                              <p className="text-sm text-[#D4AF37] font-medium hover:underline">
                                View Details →
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
            </div>
          </div>
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Order Details</h2>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Order #{selectedOrder.id} • {new Date(selectedOrder.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="font-semibold mb-2">Order Status</h3>
                    <span
                      className={`inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm font-medium ${
                        selectedOrder.status === "Delivered"
                          ? "bg-green-100 text-green-700"
                          : selectedOrder.status === "Processing"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                  <Button
                    onClick={() => handleViewInvoice(selectedOrder.id)}
                    className="bg-[#D4AF37] hover:bg-[#b8962f] text-white w-full sm:w-auto"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Invoice
                  </Button>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck className="w-5 h-5 text-[#D4AF37]" />
                    <h3 className="font-semibold">Delivery Information</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Delivery Type:</span> {selectedOrder.deliveryOption}
                    </p>
                    <p>
                      <span className="font-medium">Delivery Cost:</span> Rs. {selectedOrder.deliveryCost.toLocaleString()}
                    </p>
                    <p className="break-words">
                      <span className="font-medium">Address:</span> {selectedOrder.address}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
                    <h3 className="font-semibold">Ordered Items</h3>
                  </div>
                  <div className="space-y-3">
                    {(selectedOrder.products || []).map((product: { id?: string; image?: string; name?: string; price?: number; quantity?: number }, index: number) => (
                      <div
                        key={product.id || index}
                        className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <img
                          src={product.image || "/placeholder.png"}
                          alt={product.name || "Product"}
                          className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm sm:text-base truncate">{product.name || "Unknown Product"}</p>
                          <p className="text-xs sm:text-sm text-gray-500">Qty: {product.quantity || 1}</p>
                        </div>
                        <p className="font-semibold text-[#D4AF37] text-sm sm:text-base whitespace-nowrap">
                          Rs. {((product.price || 0) * (product.quantity || 1)).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#D4AF37]/10 rounded-lg p-3 sm:p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>Rs. {((selectedOrder.total || 0) - (selectedOrder.deliveryCost || 0)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery</span>
                    <span>Rs. {(selectedOrder.deliveryCost || 0).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-[#D4AF37]/30 pt-2 flex justify-between font-bold text-base sm:text-lg">
                    <span>Total</span>
                    <span className="text-[#D4AF37]">Rs. {(selectedOrder.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Login/Register Form
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-6 sm:py-12">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-5 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-block p-3 sm:p-4 bg-[#D4AF37] rounded-full mb-3 sm:mb-4">
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              {isLoginMode ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {isLoginMode
                ? "Login to track your orders"
                : "Register to start shopping"}
            </p>
          </div>

          {/* Toggle Buttons */}
          <div className="flex gap-2 mb-6 sm:mb-8 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setIsLoginMode(true)}
              className={`flex-1 py-2 sm:py-2.5 px-4 rounded-md font-medium transition-colors text-sm sm:text-base ${
                isLoginMode
                  ? "bg-black text-white"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLoginMode(false)}
              className={`flex-1 py-2 sm:py-2.5 px-4 rounded-md font-medium transition-colors text-sm sm:text-base ${
                !isLoginMode
                  ? "bg-black text-white"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              Register
            </button>
          </div>

          {isLoginMode ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full h-11 sm:h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pr-12 h-11 sm:h-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 p-1 touch-manipulation"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-[#D4AF37] hover:underline touch-manipulation"
              >
                Forgot Password?
              </button>
              <Button
                type="submit"
                className="w-full bg-black hover:bg-[#D4AF37] text-white h-11 sm:h-12"
                size="lg"
              >
                Login
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <Input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full h-11 sm:h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full h-11 sm:h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <Input
                  type="tel"
                  value={registerPhone}
                  onChange={(e) => setRegisterPhone(e.target.value)}
                  placeholder="0771234567"
                  required
                  className="w-full h-11 sm:h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Address
                </label>
                <Input
                  type="text"
                  value={registerAddress}
                  onChange={(e) => setRegisterAddress(e.target.value)}
                  placeholder="No. 456, Galle Road, Colombo"
                  required
                  className="w-full h-11 sm:h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showRegisterPassword ? "text" : "password"}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pr-10 h-11 sm:h-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 touch-manipulation"
                  >
                    {showRegisterPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pr-10 h-11 sm:h-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 touch-manipulation"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-black hover:bg-[#D4AF37] text-white h-11 sm:h-12"
                size="lg"
              >
                Create Account
              </Button>
            </form>
          )}
        </div>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg p-5 sm:p-6 w-full max-w-md">
              {/* Step 1: Enter Email */}
              {forgotStep === "email" && (
                <>
                  <div className="flex items-center mb-4">
                    <button
                      onClick={closeForgotPassword}
                      className="mr-2 p-2 hover:bg-gray-100 rounded-full touch-manipulation"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl sm:text-2xl font-bold">Forgot Password</h2>
                  </div>
                  <p className="text-gray-600 mb-6 text-sm sm:text-base">
                    Enter your email address to receive a verification code.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <Input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="w-full h-11 sm:h-12"
                      />
                    </div>
                    <Button
                      onClick={handleSendCode}
                      disabled={isSendingCode || !forgotEmail}
                      className="w-full bg-black hover:bg-[#D4AF37] text-white h-11 sm:h-12"
                    >
                      {isSendingCode ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending Code...
                        </>
                      ) : (
                        "Send Verification Code"
                      )}
                    </Button>
                  </div>
                </>
              )}

              {/* Step 2: Verify Code */}
              {forgotStep === "verify" && (
                <>
                  <div className="flex items-center mb-4">
                    <button
                      onClick={() => setForgotStep("email")}
                      className="mr-2 p-2 hover:bg-gray-100 rounded-full touch-manipulation"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl sm:text-2xl font-bold">Verify Code</h2>
                  </div>
                  <p className="text-gray-600 mb-6 text-sm sm:text-base break-all">
                    Enter the 6-digit code sent to {forgotEmail}
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Verification Code</label>
                      <Input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Enter 6-digit code"
                        required
                        maxLength={6}
                        className="w-full text-center text-xl sm:text-2xl tracking-widest h-12"
                      />
                    </div>
                    <Button
                      onClick={handleVerifyCode}
                      disabled={verificationCode.length !== 6}
                      className="w-full bg-black hover:bg-[#D4AF37] text-white h-11 sm:h-12"
                    >
                      Verify Code
                    </Button>
                    <p className="text-sm text-gray-500 text-center">
                      Didn't receive code?{" "}
                      <button
                        onClick={handleSendCode}
                        className="text-[#D4AF37] hover:underline touch-manipulation"
                      >
                        Resend
                      </button>
                    </p>
                  </div>
                </>
              )}

              {/* Step 3: Reset Password */}
              {forgotStep === "reset" && (
                <>
                  <div className="flex items-center mb-4">
                    <button
                      onClick={() => setForgotStep("verify")}
                      className="mr-2 p-2 hover:bg-gray-100 rounded-full touch-manipulation"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl sm:text-2xl font-bold">Reset Password</h2>
                  </div>
                  <p className="text-gray-600 mb-6 text-sm sm:text-base break-all">
                    Set your new password for {forgotEmail}
                  </p>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">New Password</label>
                      <div className="relative">
                        <Input
                          type={showResetPassword ? "text" : "password"}
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={6}
                          className="w-full pr-10 h-11 sm:h-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPassword(!showResetPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 touch-manipulation"
                        >
                          {showResetPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                      <Input
                        type="password"
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full h-11 sm:h-12"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        type="button"
                        onClick={closeForgotPassword}
                        variant="outline"
                        className="flex-1 h-11 sm:h-12"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-black hover:bg-[#D4AF37] text-white h-11 sm:h-12"
                      >
                        Reset Password
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
