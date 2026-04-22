import { useState } from "react";
import { Eye, Search, Trash2, AlertTriangle, FileText, CheckCircle, Clock, Truck, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router";
import { useAdmin } from "../../context/AdminContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import ContentLoader from "../../components/ContentLoader";

interface Order {
  id: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  products?: Array<{
    id?: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    selected_color?: string;
  }>;
  items?: Array<{
    id?: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    selected_color?: string;
  }>;
  total: number;
  subtotal?: number;
  delivery?: number;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  paymentStatus: "Pending" | "Paid";
  paymentMethod?: string;
  address?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  courierName?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  [key: string]: unknown;
}

export default function AdminOrders() {
  const { orders, updateOrderStatus, updatePaymentStatus, deleteOrder, getInvoiceByOrderId, createInvoice, isDataLoaded } = useAdmin();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingOrder, setViewingOrder] = useState<string | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [courierName, setCourierName] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  const safeOrders = orders || [];

  const filteredOrders = safeOrders.filter(
    (o) =>
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.phone.includes(searchQuery) ||
      o.id.includes(searchQuery)
  );

  const currentOrder = safeOrders.find((o) => o.id === viewingOrder);

  const handleStatusChange = (orderId: string, status: "Pending" | "Processing" | "Delivered") => {
    updateOrderStatus(orderId, status);
    toast.success("Order status updated!");
  };

  const handleDeleteOrder = (orderId: string) => {
    deleteOrder(orderId);
    toast.success("Order deleted successfully!");
    setDeletingOrder(null);
  };

  const handleViewInvoice = async (order: Order) => {
    let invoice = getInvoiceByOrderId(order.id);
    
    if (!invoice) {
      invoice = await createInvoice(order);
    }
    
    if (invoice) {
      setViewingOrder(null);
      navigate(`/invoice/${invoice.id}`);
    } else {
      toast.error("Failed to find or create invoice");
    }
  };

  const handleAddTracking = async () => {
    if (!viewingOrder || !trackingNumber.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }

    try {
      const updates: Record<string, any> = {
        trackingNumber: trackingNumber.trim(),
        trackingUrl: trackingUrl.trim(),
        courierName: courierName.trim(),
      };
      
      await updateDoc(doc(db, "orders", viewingOrder), updates);
      
      toast.success(currentOrder.trackingNumber ? "Tracking updated!" : "Tracking information added!");
      
      setTrackingNumber("");
      setTrackingUrl("");
      setCourierName("");
      
      setViewingOrder(null);
    } catch (error) {
      console.error("Error adding tracking:", error);
      toast.error("Failed to add tracking information");
    }
  };

  const openTrackingDialog = (order: Order) => {
    setViewingOrder(order.id);
    setTrackingNumber(order.trackingNumber || "");
    setTrackingUrl(order.trackingUrl || "");
    setCourierName(order.courierName || "");
  };

  const pendingCount = safeOrders.filter(o => o.status === "Pending").length;
  const processingCount = safeOrders.filter(o => o.status === "Processing").length;
  const completedCount = safeOrders.filter(o => o.status === "Delivered").length;

  if (!isDataLoaded) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Orders Management</h1>
          <p className="text-gray-600">Track and manage customer orders</p>
        </div>
        <TableSkeleton rows={8} cols={5} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Orders Management</h1>
          <p className="text-gray-600">Track and manage customer orders</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <div className="text-center px-3 py-1 bg-orange-100 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
            <p className="text-xs text-orange-600">Pending</p>
          </div>
          <div className="text-center px-3 py-1 bg-blue-100 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{processingCount}</p>
            <p className="text-xs text-blue-600">Processing</p>
          </div>
          <div className="text-center px-3 py-1 bg-green-100 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            <p className="text-xs text-green-600">Completed</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Desktop Orders Table */}
      {filteredOrders.length > 0 ? (
        <div className="hidden md:block bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-4 font-semibold">
                    Order ID
                  </th>
                  <th className="text-left py-4 px-4 font-semibold">
                    Customer
                  </th>
                  <th className="text-left py-4 px-4 font-semibold">Phone</th>
                  <th className="text-left py-4 px-4 font-semibold">
                    Total
                  </th>
                  <th className="text-left py-4 px-4 font-semibold">
                    Status
                  </th>
                  <th className="text-left py-4 px-4 font-semibold">Date</th>
                  <th className="text-left py-4 px-4 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">
                      #{order.id.slice(-8)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold">{order.customerName}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {order.address}
                      </div>
                    </td>
                    <td className="py-3 px-4">{order.phone}</td>
                    <td className="py-3 px-4 font-semibold">
                      Rs. {order.total.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <Select
                        value={order.status}
                        onValueChange={(value) =>
                          handleStatusChange(order.id, value as "Pending" | "Processing" | "Delivered")
                        }
                      >
                        <SelectTrigger className={`w-32 ${
                          order.status === "Pending" ? "border-orange-300 bg-orange-50" :
                          order.status === "Processing" ? "border-blue-300 bg-blue-50" :
                          "border-green-300 bg-green-50"
                        }`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Processing">Processing</SelectItem>
                          <SelectItem value="Delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(order.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {order.trackingNumber && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openTrackingDialog(order)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="View Tracking"
                          >
                            <Truck className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openTrackingDialog(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeletingOrder(order.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="hidden md:block bg-white rounded-lg shadow-lg p-12 text-center">
          <p className="text-gray-500">No orders found</p>
        </div>
      )}

      {/* Mobile Orders Cards */}
      {filteredOrders.length > 0 ? (
        <div className="md:hidden grid grid-cols-1 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono text-sm font-semibold text-gray-600">
                    #{order.id.slice(-8)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.date).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  order.status === "Pending" ? "bg-orange-100 text-orange-700" :
                  order.status === "Processing" ? "bg-blue-100 text-blue-700" :
                  "bg-green-100 text-green-700"
                }`}>
                  {order.status}
                </span>
              </div>

              <div className="mb-3">
                <p className="font-semibold text-gray-900">{order.customerName}</p>
                <p className="text-sm text-gray-600">{order.phone}</p>
                <p className="text-sm text-gray-500 truncate">{order.address}</p>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-gray-900">
                  Rs. {order.total.toLocaleString()}
                </span>
                <Select
                  value={order.status}
                  onValueChange={(value) =>
                    handleStatusChange(order.id, value as "Pending" | "Processing" | "Delivered")
                  }
                >
                  <SelectTrigger className={`w-32 h-9 ${
                    order.status === "Pending" ? "border-orange-300 bg-orange-50" :
                    order.status === "Processing" ? "border-blue-300 bg-blue-50" :
                    "border-green-300 bg-green-50"
                  }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openTrackingDialog(order)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                {order.trackingNumber && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openTrackingDialog(order)}
                    className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Truck className="w-4 h-4 mr-1" />
                    Tracking
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeletingOrder(order.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="md:hidden bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">No orders found</p>
        </div>
      )}

      {/* View Order Dialog */}
      <Dialog
        open={!!viewingOrder}
        onOpenChange={() => setViewingOrder(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Order Details #{currentOrder?.id.slice(-8)}
            </DialogTitle>
          </DialogHeader>

          {currentOrder && (
            <div className="space-y-6 py-4">
              {/* Customer Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">{currentOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold">{currentOrder.phone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Delivery Address</p>
                    <p className="font-semibold">{currentOrder.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Delivery Option</p>
                    <p className="font-semibold">
                      {currentOrder.deliveryOption}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Delivery Cost</p>
                    <p className="font-semibold">
                      Rs. {currentOrder.deliveryCost.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Products */}
              <div>
                <h3 className="font-semibold mb-3">Ordered Products</h3>
                <div className="space-y-3">
                  {(currentOrder.products || currentOrder.items || []).map((product, idx) => (
                    <div
                      key={product.id || `product-${idx}`}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          {product.selected_color && (
                            <span className="text-[#D4AF37] font-medium">
                              {product.selected_color} × {" "}
                            </span>
                          )}
                          Quantity: {product.quantity} × Rs.{" "}
                          {product.price.toLocaleString()}
                        </p>
                      </div>
                      <p className="font-semibold">
                        Rs.{" "}
                        {(product.quantity * product.price).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">
                      Rs.{" "}
                      {(
                        currentOrder.total - currentOrder.deliveryCost
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery</span>
                    <span className="font-semibold">
                      Rs. {currentOrder.deliveryCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span>Rs. {currentOrder.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Order & Payment Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Order Status</p>
                    <Select
                      value={currentOrder.status}
                      onValueChange={(value) =>
                        handleStatusChange(currentOrder.id, value as "Pending" | "Processing" | "Delivered")
                      }
                    >
                      <SelectTrigger className={`font-semibold ${
                        currentOrder.status === "Pending" ? "border-orange-300 bg-orange-50 text-orange-600" :
                        currentOrder.status === "Processing" ? "border-blue-300 bg-blue-50 text-blue-600" :
                        "border-green-300 bg-green-50 text-green-600"
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Processing">Processing</SelectItem>
                        <SelectItem value="Delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                    <Select
                      value={currentOrder.paymentStatus || "Pending"}
                      onValueChange={(value) => updatePaymentStatus(currentOrder.id, value as "Pending" | "Paid")}
                    >
                      <SelectTrigger className={`font-semibold ${
                        currentOrder.paymentStatus === "Paid" ? "text-green-600 border-green-300" : "text-orange-600 border-orange-300"
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-500" />
                            Pending
                          </span>
                        </SelectItem>
                        <SelectItem value="Paid">
                          <span className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Paid
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Order Date</p>
                    <p className="font-semibold">
                      {new Date(currentOrder.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Tracking */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold">Delivery Tracking</h3>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Add delivery tracking details for this order.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Tracking Number *</Label>
                      <Input
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="e.g., TRK123456"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Courier Name</Label>
                      <Input
                        value={courierName}
                        onChange={(e) => setCourierName(e.target.value)}
                        placeholder="e.g., LankaPost"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Tracking URL</Label>
                      <Input
                        value={trackingUrl}
                        onChange={(e) => setTrackingUrl(e.target.value)}
                        placeholder="https://..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddTracking}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    {currentOrder.trackingNumber ? "Update Tracking" : "Add Tracking Info"}
                  </Button>
                </div>
              </div>

              {/* View Invoice Button */}
              <div className="border-t pt-4">
                <Button
                  onClick={() => handleViewInvoice(currentOrder)}
                  className="w-full bg-[#D4AF37] hover:bg-[#B8962F] text-black font-semibold"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  View Invoice for This Order
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingOrder}
        onOpenChange={() => setDeletingOrder(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Order
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this order? This action cannot be undone.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-medium">
                Warning: All order details will be permanently removed from the system.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setDeletingOrder(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingOrder && handleDeleteOrder(deletingOrder)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
