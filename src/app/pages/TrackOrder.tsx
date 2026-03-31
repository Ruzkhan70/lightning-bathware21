import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { Package, Truck, CheckCircle, Clock, MapPin, Phone, Mail, ArrowLeft } from "lucide-react";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/Skeleton";
import { setMetaTags } from "../utils/seo";

interface OrderProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface TrackedOrder {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  products: OrderProduct[];
  total: number;
  status: "Pending" | "Processing" | "Delivered";
  paymentStatus: "Pending" | "Paid";
  date: string;
  deliveryOption: string;
  deliveryCost: number;
}

const statusSteps = [
  { key: "Pending", label: "Order Placed", icon: Clock },
  { key: "Processing", label: "Processing", icon: Package },
  { key: "Delivered", label: "Delivered", icon: Truck },
];

export default function TrackOrder() {
  const { id } = useParams();
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setMetaTags("Track Your Order | Lightning Bathware", "Track your order status and delivery information.");
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const orderDoc = await getDoc(doc(db, "orders", id));
        if (orderDoc.exists()) {
          setOrder({ id: orderDoc.id, ...orderDoc.data() } as TrackedOrder);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const getStepStatus = (stepKey: string) => {
    if (!order) return "pending";
    const statusOrder = ["Pending", "Processing", "Delivered"];
    const currentIndex = statusOrder.indexOf(order.status);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">
            We couldn't find an order with this ID. Please check your order ID and try again.
          </p>
          <Link to="/account">
            <Button className="bg-[#D4AF37] hover:bg-[#C5A028] text-black">
              Go to My Account
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link to="/">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
        <p className="text-gray-600">Order ID: {order.id}</p>
      </div>

      {/* Order Status Timeline */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-6">Order Status</h2>
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200">
            <div 
              className="h-full bg-[#D4AF37] transition-all duration-500"
              style={{
                width: order.status === "Pending" ? "0%" : 
                       order.status === "Processing" ? "50%" : "100%"
              }}
            />
          </div>

          {statusSteps.map((step, index) => {
            const status = getStepStatus(step.key);
            const Icon = step.icon;
            return (
              <div key={step.key} className="relative flex flex-col items-center z-10">
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    status === "completed" 
                      ? "bg-[#D4AF37] text-white" 
                      : status === "current" 
                        ? "bg-white border-4 border-[#D4AF37] text-[#D4AF37]"
                        : "bg-gray-200 text-gray-400"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`mt-3 text-sm font-medium ${
                  status === "completed" || status === "current" ? "text-gray-900" : "text-gray-400"
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {order.status === "Delivered" && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-800">Your order has been delivered!</p>
              <p className="text-sm text-green-600">Thank you for shopping with us.</p>
            </div>
          </div>
        )}
      </div>

      {/* Order Details */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Delivery Information */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#D4AF37]" />
            Delivery Information
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-500">Recipient:</span>
              <p className="font-medium">{order.customerName}</p>
            </div>
            <div>
              <span className="text-gray-500">Phone:</span>
              <p className="font-medium">{order.phone}</p>
            </div>
            <div>
              <span className="text-gray-500">Address:</span>
              <p className="font-medium">{order.address}</p>
            </div>
            <div>
              <span className="text-gray-500">Delivery Option:</span>
              <p className="font-medium">{order.deliveryOption}</p>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#D4AF37]" />
            Order Summary
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Order Date:</span>
              <span className="font-medium">
                {new Date(order.date).toLocaleDateString("en-LK", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Items:</span>
              <span className="font-medium">{order.products.length} product(s)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment:</span>
              <span className={`font-medium ${
                order.paymentStatus === "Paid" ? "text-green-600" : "text-orange-600"
              }`}>
                {order.paymentStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Delivery:</span>
              <span className="font-medium">Rs. {order.deliveryCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-3 border-t">
              <span className="font-bold">Total:</span>
              <span className="font-bold text-[#D4AF37]">Rs. {order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <h3 className="text-lg font-bold mb-4">Ordered Products</h3>
        <div className="space-y-4">
          {order.products.map((product) => (
            <div key={product.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <img
                src={product.image}
                alt={product.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-gray-500">Qty: {product.quantity}</p>
              </div>
              <p className="font-semibold">Rs. {(product.price * product.quantity).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="mt-6 p-6 bg-blue-50 rounded-xl">
        <h3 className="font-bold text-blue-900 mb-3">Need Help?</h3>
        <p className="text-sm text-blue-700 mb-4">
          If you have any questions about your order, please contact us:
        </p>
        <div className="flex flex-wrap gap-4">
          <a href="tel:+94112345678" className="flex items-center gap-2 text-blue-800 hover:text-blue-600">
            <Phone className="w-4 h-4" />
            +94 11 234 5678
          </a>
          <a href="mailto:support@lightningbathware.lk" className="flex items-center gap-2 text-blue-800 hover:text-blue-600">
            <Mail className="w-4 h-4" />
            support@lightningbathware.lk
          </a>
        </div>
      </div>
    </div>
  );
}
