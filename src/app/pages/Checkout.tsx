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
import { ShoppingBag, Truck } from "lucide-react";

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { addOrder, createInvoice, storeProfile } = useAdmin();
  const { user, isLoggedIn } = useUser();

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

    if (
      !formData.customerName ||
      !formData.phone ||
      !formData.address ||
      !formData.city
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const orderData = {
      customerName: formData.customerName,
      phone: formData.phone,
      address: `${formData.address}, ${formData.city}, ${formData.postalCode}`,
      products: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
      })),
      total: grandTotal,
      deliveryOption: selectedDelivery?.label || "",
      deliveryCost: deliveryCost,
    };
    
    const savedOrder = await addOrder(orderData);
    
    const invoice = await createInvoice(savedOrder, formData.email);

    clearCart();
    toast.success("Order placed successfully! Invoice generated.");
    navigate(`/invoice/${invoice.id}`);
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
    <div className="min-h-screen bg-gray-50 py-8">
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
                  className="w-full bg-black hover:bg-[#D4AF37] text-white"
                >
                  Place Order
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