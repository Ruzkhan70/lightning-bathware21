import { useState } from "react";
import { User, LogOut, Package, MapPin, Phone, Mail } from "lucide-react";
import { useUser } from "../context/UserContext";
import { useAdmin } from "../context/AdminContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";

export default function Account() {
  const { user, isLoggedIn, login, register, logout } = useUser();
  const { orders } = useAdmin();
  const [isLoginMode, setIsLoginMode] = useState(true);

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(loginEmail, loginPassword)) {
      toast.success("Welcome back!");
      setLoginEmail("");
      setLoginPassword("");
    } else {
      toast.error("Invalid email or password");
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (registerPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (registerPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (
      register(
        registerName,
        registerEmail,
        registerPhone,
        registerAddress,
        registerPassword
      )
    ) {
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
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
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
                          <p className="text-sm text-gray-500">
                            {order.deliveryOption}
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
                <Input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full"
                />
              </div>
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
                  placeholder="123 Main Street, Colombo"
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full"
                />
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
      </div>
    </div>
  );
}
