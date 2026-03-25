import { useState, useEffect, useRef } from "react";
import { User, LogOut, Package, MapPin, Phone, Mail, Eye, EyeOff, ArrowLeft, Loader2, X, Truck, ShoppingBag } from "lucide-react";
import { useUser } from "../context/UserContext";
import { useAdmin } from "../context/AdminContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import emailjs from "emailjs-com";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { Order } from "../context/AdminContext";

const EMAILJS_PUBLIC_KEY = "z0LSWDMbKOfljQUzp";
const EMAILJS_SERVICE_ID = "service_vd0s4n8";
const EMAILJS_TEMPLATE_ID = "template_njxm8mi";

export default function Account() {
  const { user, isLoggedIn, login, register, logout, resetPassword } = useUser();
  const { orders } = useAdmin();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // Forgot password steps
  const [forgotStep, setForgotStep] = useState<"email" | "verify" | "reset">("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [showForgotPasswordField, setShowForgotPasswordField] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  // Login form state
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

  useEffect(() => {
    if (!isLoggedIn || !user?.phone) {
      return;
    }

    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("phone", "==", user.phone),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified") {
          const updatedOrder = change.doc.data() as Order;
          const previousStatus = previousOrderStatuses.current[updatedOrder.id];
          
          if (previousStatus && previousStatus !== updatedOrder.status) {
            let message = "";
            if (updatedOrder.status === "Processing") {
              message = `Your order #${updatedOrder.id} is now being processed!`;
            } else if (updatedOrder.status === "Delivered") {
              message = `Your order #${updatedOrder.id} has been delivered!`;
            }
            
            if (message) {
              toast.success(message, {
                duration: 8000,
              });
            }
          }
          
          previousOrderStatuses.current[updatedOrder.id] = updatedOrder.status;
        }
        
        if (change.type === "added") {
          const newOrder = change.doc.data() as Order;
          previousOrderStatuses.current[newOrder.id] = newOrder.status;
        }
      });
    });

    return () => unsubscribe();
  }, [isLoggedIn, user?.phone]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(loginEmail, loginPassword);
    if (success) {
      toast.success("Welcome back!");
      setLoginEmail("");
      setLoginPassword("");
    } else {
      toast.error("Invalid email or password");
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

    const success = await register(
      registerName,
      registerEmail,
      registerPhone,
      registerAddress,
      registerPassword
    );

    if (success) {
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
          app_name: "Lightning Bathware",
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

    if (verificationCode === code) {
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
    const success = await resetPassword(forgotEmail, forgotNewPassword);
    if (success) {
      toast.success("Password reset successfully! Please login.");
      localStorage.removeItem("resetCode");
      closeForgotPassword();
      setIsLoginMode(true);
    } else {
      toast.error("Something went wrong");
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
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  const userOrders = isLoggedIn
    ? orders.filter((order) => order.phone === user?.phone)
    : [];

  if (isLoggedIn && user) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* User Info Card */}
            <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-[#D4AF37] rounded-full">
                    <User className="w-8 h-8 text-black" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-1">{user.name}</h1>
                    <p className="text-gray-600">Customer Account</p>
                  </div>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-[#D4AF37]" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-[#D4AF37]" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg md:col-span-2">
                  <MapPin className="w-5 h-5 text-[#D4AF37]" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{user.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders Section */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <Package className="w-6 h-6 text-[#D4AF37]" />
                <h2 className="text-2xl font-bold">My Orders</h2>
              </div>

              {userOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-lg">
                            Order #{order.id}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
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

                      <div className="border-t border-gray-200 pt-3">
                        <p className="text-sm text-gray-600 mb-2">
                          {order.products.length} item
                          {order.products.length > 1 ? "s" : ""}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-xl text-[#D4AF37]">
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

            {/* Order Details Modal */}
            {selectedOrder && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Order Details</h2>
                      <p className="text-sm text-gray-500">
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
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Status */}
                    <div>
                      <h3 className="font-semibold mb-2">Order Status</h3>
                      <span
                        className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
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

                    {/* Delivery Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Truck className="w-5 h-5 text-[#D4AF37]" />
                        <h3 className="font-semibold">Delivery Information</h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Delivery Type:</span> {selectedOrder.deliveryOption}</p>
                        <p><span className="font-medium">Delivery Cost:</span> Rs. {selectedOrder.deliveryCost.toLocaleString()}</p>
                        <p><span className="font-medium">Address:</span> {selectedOrder.address}</p>
                      </div>
                    </div>

                    {/* Products */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
                        <h3 className="font-semibold">Ordered Items</h3>
                      </div>
                      <div className="space-y-3">
                        {selectedOrder.products.map((product, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex-1">
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-500">Qty: {product.quantity}</p>
                            </div>
                            <p className="font-semibold text-[#D4AF37]">
                              Rs. {(product.price * product.quantity).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-[#D4AF37]/10 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>Rs. {(selectedOrder.total - selectedOrder.deliveryCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Delivery</span>
                        <span>Rs. {selectedOrder.deliveryCost.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-[#D4AF37]/30 pt-2 flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-[#D4AF37]">Rs. {selectedOrder.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Login/Register Form
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-[#D4AF37] rounded-full mb-4">
              <User className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {isLoginMode ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-gray-600">
              {isLoginMode
                ? "Login to track your orders"
                : "Register to start shopping"}
            </p>
          </div>

          {/* Toggle Buttons */}
          <div className="flex gap-2 mb-8 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setIsLoginMode(true)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                isLoginMode
                  ? "bg-black text-white"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLoginMode(false)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
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
                  className="w-full"
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
                    className="w-full pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-[#D4AF37] hover:underline"
              >
                Forgot Password?
              </button>
              <Button
                type="submit"
                className="w-full bg-black hover:bg-[#D4AF37] text-white"
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
                  className="w-full"
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
                  className="w-full"
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
                  className="w-full"
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
                  className="w-full"
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
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-black hover:bg-[#D4AF37] text-white"
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
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
              {/* Step 1: Enter Email */}
              {forgotStep === "email" && (
                <>
                  <div className="flex items-center mb-4">
                    <button
                      onClick={closeForgotPassword}
                      className="mr-2 p-2 hover:bg-gray-100 rounded-full"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-2xl font-bold">Forgot Password</h2>
                  </div>
                  <p className="text-gray-600 mb-6">
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
                        className="w-full"
                      />
                    </div>
                    <Button
                      onClick={handleSendCode}
                      disabled={isSendingCode || !forgotEmail}
                      className="w-full bg-black hover:bg-[#D4AF37] text-white"
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
                      className="mr-2 p-2 hover:bg-gray-100 rounded-full"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-2xl font-bold">Verify Code</h2>
                  </div>
                  <p className="text-gray-600 mb-6">
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
                        className="w-full text-center text-2xl tracking-widest"
                      />
                    </div>
                    <Button
                      onClick={handleVerifyCode}
                      disabled={verificationCode.length !== 6}
                      className="w-full bg-black hover:bg-[#D4AF37] text-white"
                    >
                      Verify Code
                    </Button>
                    <p className="text-sm text-gray-500 text-center">
                      Didn't receive code?{" "}
                      <button
                        onClick={handleSendCode}
                        className="text-[#D4AF37] hover:underline"
                      >
                        Resend
                      </button>
                    </p>
                  </div>
                </>
              )}

              {/* Step 3: Reset Password */}
              {forgotStep === "reset" && showForgotPasswordField && (
                <>
                  <div className="flex items-center mb-4">
                    <button
                      onClick={() => setForgotStep("verify")}
                      className="mr-2 p-2 hover:bg-gray-100 rounded-full"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-2xl font-bold">Reset Password</h2>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Set your new password for {forgotEmail}
                  </p>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">New Password</label>
                      <div className="relative">
                        <Input
                          type={showForgotPasswordField ? "text" : "password"}
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={6}
                          className="w-full pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowForgotPasswordField(!showForgotPasswordField)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showForgotPasswordField ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                        className="w-full"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        onClick={closeForgotPassword}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-black hover:bg-[#D4AF37] text-white"
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
