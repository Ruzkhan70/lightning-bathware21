import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useCart } from "../context/CartContext";
import { useAdmin } from "../context/AdminContext";
import { useUser } from "../context/UserContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import { ShoppingBag, Truck, CreditCard, Loader2 } from "lucide-react";
import { loadPayhereScript, initiatePayherePayment, onPayhereCompleted, onPayhereClosed, isPayhereConfigured } from "../../lib/payhere";
import { sendOrderNotificationToAdmin, sendOrderConfirmationToCustomer } from "../../lib/emailNotifications";
import ContentLoader from "../components/ContentLoader";

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { addOrder, createInvoice, storeProfile, isDataLoaded } = useAdmin();
  const { user, isLoggedIn } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ContentLoader minHeight="min-h-[50vh]" />
      </div>
    );
  }

  const isOnlinePaymentEnabled = storeProfile.enableOnlinePayment && isPayhereConfigured();

  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    deliveryOption: "colombo",
  });

  // Auto-fill form if user is logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        customerName: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
      }));
    }
  }, [user]);

  const deliveryOptions = [
    { value: "colombo", label: "Delivery within Colombo", cost: Number(storeProfile.deliveryColomboPrice) },
    { value: "islandwide", label: "Islandwide delivery", cost: Number(storeProfile.deliveryIslandwidePrice) },
  ];

  const selectedDelivery = deliveryOptions.find(
    (opt) => opt.value === formData.deliveryOption
  );
  const deliveryCost = Number(selectedDelivery?.cost) || 0;
  const grandTotal = Number(cartTotal) + deliveryCost;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    const phoneRegex = /^(\+94|0)[1-9][0-9]{8}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      toast.error("Please enter a valid Sri Lankan phone number (e.g., 0771234567)");
      return;
    }

    if (
      !formData.customerName ||
      !formData.phone ||
      !formData.address ||
      !formData.city
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    if (!user?.id) {
      toast.error("Please log in to place an order");
      setIsSubmitting(false);
      return;
    }

    try {
      const orderData = {
        userId: user.id,
        customerName: formData.customerName,
        phone: formData.phone,
        address: `${formData.address}, ${formData.city}, ${formData.postalCode}`,
        products: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
          selected_color: item.selected_color,
          selected_size: item.selected_size,
        })),
        total: grandTotal,
        deliveryOption: selectedDelivery?.label || "",
        deliveryCost: deliveryCost,
      };
      
      const savedOrder = await addOrder(orderData);
      
      const orderNotification = {
        orderId: savedOrder.id || `ORD-${Date.now()}`,
        customerName: formData.customerName,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        address: `${formData.address}, ${formData.city}, ${formData.postalCode}`,
        products: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total: grandTotal,
        deliveryOption: selectedDelivery?.label || "",
        deliveryCost: deliveryCost,
        paymentMethod: paymentMethod === "online" ? "Online Payment (Payhere)" : "Cash on Delivery",
        date: new Date().toLocaleString("en-LK"),
      };
      
      // Send notification to admin
      sendOrderNotificationToAdmin(orderNotification);
      
      // Send confirmation email to customer
      if (formData.email) {
        sendOrderConfirmationToCustomer(
          formData.email,
          formData.customerName,
          savedOrder.id || `ORD-${Date.now()}`,
          grandTotal
        );
      }
      
      if (paymentMethod === "online" && isOnlinePaymentEnabled) {
        await loadPayhereScript();
        
        initiatePayherePayment({
          orderId: savedOrder.id || `ORD-${Date.now()}`,
          items: `${cartItems.length} item(s) from Lightning Bathware`,
          amount: grandTotal,
          currency: "LKR",
          customerName: formData.customerName,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          address: formData.address,
          city: formData.city,
        });

        onPayhereCompleted(async (orderId) => {
          const invoice = await createInvoice(savedOrder, formData.email);
          clearCart();
          setIsSubmitting(false);
          toast.success("Payment successful! Order confirmed.");
          navigate(`/invoice/${invoice.id}`);
        });

        onPayhereClosed(() => {
          setIsSubmitting(false);
          toast.info("Payment cancelled. Your order is saved.");
        });
      } else {
        try {
          const invoice = await createInvoice(savedOrder, formData.email);
          clearCart();
          setIsSubmitting(false);
          toast.success("Order placed successfully! Invoice generated.");
          navigate(`/invoice/${invoice.id}`);
        } catch (invoiceError) {
          console.error("Invoice creation failed:", invoiceError);
          clearCart();
          setIsSubmitting(false);
          toast.success("Order placed successfully! Invoice will be generated shortly.");
          navigate("/account");
        }
      }
    } catch (error) {
      setIsSubmitting(false);
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <ShoppingBag className="w-24 h-24 mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-bold mb-4">Login Required</h2>
            <p className="text-gray-600 mb-8">
              Please login or create an account to place your order.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate("/account")}
                size="lg"
                className="bg-black hover:bg-[#D4AF37] text-white"
              >
                Login to Account
              </Button>
              <Button
                onClick={() => navigate("/products")}
                variant="outline"
                size="lg"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <ShoppingBag className="w-24 h-24 mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
            <p className="text-gray-600 mb-8">
              Add some products before checking out
            </p>
            <Button
              onClick={() => navigate("/products")}
              size="lg"
              className="bg-black hover:bg-[#D4AF37] text-white"
            >
              Browse Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <Loader2 className="w-12 h-12 animate-spin text-[#D4AF37]" />
            <p className="text-lg font-semibold">Processing your order...</p>
            <p className="text-sm text-gray-500">Please do not close this window</p>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6">
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="customerName"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6">Delivery Address</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">
                      Street Address <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">
                        City <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Options */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6">Delivery Options</h2>
                <div className="space-y-3">
                  {deliveryOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => setFormData({ ...formData, deliveryOption: option.value })}
                      className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.deliveryOption === option.value
                          ? "border-[#D4AF37] bg-[#D4AF37]/5"
                          : "border-gray-200 hover:border-[#D4AF37]/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.deliveryOption === option.value
                            ? "border-[#D4AF37] bg-[#D4AF37]"
                            : "border-gray-300"
                        }`}>
                          {formData.deliveryOption === option.value && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <Truck className="w-5 h-5 text-[#D4AF37]" />
                        <span className="font-semibold">
                          {option.label}
                        </span>
                      </div>
                      <span className="font-bold">
                        {option.cost === 0 ? "FREE" : `Rs. ${option.cost.toLocaleString()}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Options */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6">Payment Method</h2>
                <div className="space-y-3">
                  <div
                    onClick={() => setPaymentMethod("cod")}
                    className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === "cod"
                        ? "border-[#D4AF37] bg-[#D4AF37]/5"
                        : "border-gray-200 hover:border-[#D4AF37]/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === "cod"
                          ? "border-[#D4AF37] bg-[#D4AF37]"
                          : "border-gray-300"
                      }`}>
                        {paymentMethod === "cod" && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <span className="font-semibold block">Cash on Delivery</span>
                        <span className="text-sm text-gray-500">Pay when you receive your order</span>
                      </div>
                    </div>
                  </div>
                  
                  {isOnlinePaymentEnabled && (
                    <div
                      onClick={() => setPaymentMethod("online")}
                      className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === "online"
                          ? "border-[#D4AF37] bg-[#D4AF37]/5"
                          : "border-gray-200 hover:border-[#D4AF37]/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === "online"
                            ? "border-[#D4AF37] bg-[#D4AF37]"
                            : "border-gray-300"
                        }`}>
                          {paymentMethod === "online" && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <span className="font-semibold block">Pay Online (Payhere)</span>
                          <span className="text-sm text-gray-500">Pay securely with card or e-Wallet</span>
                        </div>
                      </div>
                      <CreditCard className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-6">Order Summary</h2>

                {/* Cart Items */}
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-sm line-clamp-2">
                          {item.name}
                        </p>
                        {(item.selected_color || item.selected_size) && (
                          <p className="text-xs text-[#D4AF37] font-medium">
                            {item.selected_color && `Color: ${item.selected_color}`}
                            {item.selected_color && item.selected_size && ' / '}
                            {item.selected_size && `Size: ${item.selected_size}`}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          Qty: {item.quantity}
                        </p>
                        <p className="font-bold">
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="space-y-3 border-t pt-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">
                      Rs. {cartTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery</span>
                    <span className="font-semibold">
                      {deliveryCost === 0 ? "FREE" : `Rs. ${deliveryCost.toLocaleString()}`}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span>Rs. {grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full bg-black hover:bg-[#D4AF37] text-white"
                >
                  {isSubmitting 
                    ? "Processing..." 
                    : paymentMethod === "online" 
                      ? "Proceed to Payment" 
                      : "Place Order (Cash on Delivery)"}
                </Button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  By placing your order, you agree to our{" "}
                  <Link to="/terms" className="text-[#D4AF37] hover:underline">
                    terms and conditions
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}