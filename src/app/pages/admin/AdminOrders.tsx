import { useState } from "react";
import { logger } from "../../../lib/logger";
import { Eye, Search, Trash2, AlertTriangle, FileText, CheckCircle, Clock, Truck, ExternalLink, Loader2, RefreshCw, User, MapPin, Phone, Printer, MessageSquare, Package, CreditCard, Circle, ShoppingCart, DollarSign, XCircle } from "lucide-react";
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
  customerName: string;
  phone: string;
  address: string;
  products: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    selected_color?: string;
    selected_size?: string;
  }>;
  total: number;
  status: "Pending" | "Processing" | "Delivered";
  paymentStatus: "Pending" | "Paid";
  date: string;
  deliveryOption: string;
  deliveryType: string;
  deliveryCost: number;
  trackingNumber?: string;
  trackingUrl?: string;
  courierName?: string;
  userId?: string;
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
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>("");

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedOrders.length === 0 || !bulkStatus) return;
    
    await Promise.allSettled(
      selectedOrders.map(orderId =>
        updateOrderStatus(orderId, bulkStatus as "Pending" | "Processing" | "Delivered")
      )
    );
    
    setSelectedOrders([]);
    setBulkStatus("");
  };

  const safeOrders = orders || [];

  const filteredOrders = safeOrders.filter(
    (o) =>
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.phone.includes(searchQuery) ||
      o.id.includes(searchQuery)
  );

  const currentOrder = safeOrders.find((o) => o.id === viewingOrder);

  const handleStatusChange = async (orderId: string, status: "Pending" | "Processing" | "Delivered") => {
    try {
      await updateOrderStatus(orderId, status);
    } catch {
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    await deleteOrder(orderId);
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
      logger.error("Error adding tracking:", error);
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
          <p className="text-muted-foreground">Track and manage customer orders</p>
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
          <p className="text-muted-foreground">Track and manage customer orders</p>
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
<div className="text-center px-3 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
             <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{pendingCount}</p>
             <p className="text-xs text-orange-600 dark:text-orange-400">Pending</p>
           </div>
<div className="text-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
             <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{processingCount}</p>
             <p className="text-xs text-blue-600 dark:text-blue-400">Processing</p>
           </div>
<div className="text-center px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-lg">
             <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedCount}</p>
             <p className="text-xs text-green-600 dark:text-green-400">Completed</p>
           </div>
        </div>
      </div>

      {/* Search & Bulk Actions */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {selectedOrders.length > 0 && (
          <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-lg">
            <span className="text-sm font-medium">{selectedOrders.length} selected</span>
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Set status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleBulkStatusUpdate}
              disabled={!bulkStatus}
              size="sm"
            >
              Apply
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedOrders([])}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Desktop Orders Table */}
      {filteredOrders.length > 0 ? (
        <div className="hidden md:block bg-card rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left py-4 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4"
                    />
                  </th>
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
                  <tr key={order.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleSelectOrder(order.id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="py-3 px-4 font-mono text-sm">
                      #{order.id.slice(-8)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold">{order.customerName}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
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
                           order.status === "Pending" ? "border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/30" :
                           order.status === "Processing" ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/30" :
                           "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/30"
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
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(order.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {order.trackingNumber && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openTrackingDialog(order)}
className="text-green-600 dark:text-green-400 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
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
className="text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
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
        <div className="hidden md:block bg-card rounded-lg shadow-lg p-12 text-center">
          <p className="text-muted-foreground">No orders found</p>
        </div>
      )}

      {/* Mobile Orders Cards */}
      {filteredOrders.length > 0 ? (
        <div className="md:hidden grid grid-cols-1 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-card rounded-lg shadow-sm p-4 border border-border"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono text-sm font-semibold text-muted-foreground">
                    #{order.id.slice(-8)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.date).toLocaleDateString()}
                  </p>
                </div>
<span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                   order.status === "Pending" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" :
                   order.status === "Processing" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                 }`}>
                  {order.status}
                </span>
              </div>

              <div className="mb-3">
                <p className="font-semibold text-foreground">{order.customerName}</p>
                <p className="text-sm text-muted-foreground">{order.phone}</p>
                <p className="text-sm text-muted-foreground truncate">{order.address}</p>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-foreground">
                  Rs. {order.total.toLocaleString()}
                </span>
                <Select
                  value={order.status}
                  onValueChange={(value) =>
                    handleStatusChange(order.id, value as "Pending" | "Processing" | "Delivered")
                  }
                >
<SelectTrigger className={`w-32 h-9 ${
                     order.status === "Pending" ? "border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/30" :
                     order.status === "Processing" ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/30" :
                     "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/30"
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
                    className="flex-1 text-green-600 dark:text-green-400 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <Truck className="w-4 h-4 mr-1" />
                    Tracking
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeletingOrder(order.id)}
className="text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                 >
                   <Trash2 className="w-4 h-4" />
                 </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="md:hidden bg-card rounded-lg shadow-sm p-12 text-center">
          <p className="text-muted-foreground">No orders found</p>
        </div>
      )}

      {/* View Order Dialog */}
      <Dialog
        open={!!viewingOrder}
        onOpenChange={() => setViewingOrder(null)}
      >
        <DialogContent className="w-[95vw] max-w-[1600px] max-h-[94vh] p-0 gap-0 overflow-y-auto">
          {currentOrder && (
            <div className="flex flex-col min-h-0">

              {/* ====== HEADER ====== */}
              <div className="sticky top-0 z-40 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shrink-0">
                <div className="px-6 lg:px-8 py-4 lg:py-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <DialogHeader className="p-0">
                        <DialogTitle className="flex items-center gap-2.5 text-lg lg:text-xl font-bold">
                          <ShoppingCart className="w-5 h-5 lg:w-6 lg:h-6 text-[#D4AF37]" />
                          <span className="truncate">Order {currentOrder.id.slice(-8)}</span>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span>{currentOrder.customerName}</span>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <span>{new Date(currentOrder.date).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-sm ${
                        currentOrder.status === "Pending"
                          ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                          : currentOrder.status === "Processing"
                          ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          currentOrder.status === "Pending" ? "bg-amber-500" : currentOrder.status === "Processing" ? "bg-blue-500" : "bg-emerald-500"
                        }`} />
                        {currentOrder.status}
                      </span>

                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-sm ${
                        currentOrder.paymentStatus === "Paid"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${currentOrder.paymentStatus === "Paid" ? "bg-emerald-500" : "bg-amber-500"}`} />
                        {currentOrder.paymentStatus === "Paid" ? "Paid" : "Payment Pending"}
                      </span>

                      {currentOrder.deliveryCost > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-sm bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                          Delivery: Rs. {currentOrder.deliveryCost.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-6 lg:px-8 py-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleViewInvoice(currentOrder)}
                    className="h-8 text-xs border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10">
                    <FileText className="w-3.5 h-3.5 mr-1.5" /> Invoice
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.print()}
                    className="h-8 text-xs border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-900/20">
                    <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
                  </Button>
                  {currentOrder.phone && (
                    <Button size="sm" variant="outline" onClick={() => window.open(`https://wa.me/${currentOrder.phone.replace(/[^0-9]/g, "")}`, "_blank")}
                      className="h-8 text-xs border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20">
                      <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> WhatsApp
                    </Button>
                  )}
                  {currentOrder.phone && (
                    <Button size="sm" variant="outline" onClick={() => window.open(`tel:${currentOrder.phone}`, "_blank")}
                      className="h-8 text-xs border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20">
                      <Phone className="w-3.5 h-3.5 mr-1.5" /> Call
                    </Button>
                  )}
                  {currentOrder.trackingUrl && (
                    <Button size="sm" variant="outline" onClick={() => window.open(currentOrder.trackingUrl, "_blank")}
                      className="h-8 text-xs border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/20">
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Track
                    </Button>
                  )}
                </div>
              </div>

              {/* ====== BODY: 3-COLUMN DASHBOARD LAYOUT ====== */}
              <div className="p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-6 lg:gap-8">

                  {/* ====== LEFT COLUMN ====== */}
                  <div className="lg:col-span-5 xl:col-span-3 space-y-6">

                    {/* --- CUSTOMER INFORMATION --- */}
                    <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-[10px] uppercase tracking-[0.12em] font-semibold text-gray-400 dark:text-gray-500 flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                          Customer
                        </h3>
                        <div className="flex items-center gap-1">
                          {currentOrder.phone && (
                            <>
                              <button onClick={() => window.open(`tel:${currentOrder.phone}`, "_blank")}
                                className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Call">
                                <Phone className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => window.open(`https://wa.me/${currentOrder.phone.replace(/[^0-9]/g, "")}`, "_blank")}
                                className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-400 hover:text-emerald-600 transition-colors"
                                title="WhatsApp">
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Name</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{currentOrder.customerName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Phone</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{currentOrder.phone}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Address
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-relaxed break-words">{currentOrder.address}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Order ID</p>
                          <p className="text-sm font-semibold font-mono text-[#D4AF37]">{currentOrder.id}</p>
                        </div>
                      </div>
                    </div>

                    {/* --- DELIVERY INFORMATION --- */}
                    <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-[10px] uppercase tracking-[0.12em] font-semibold text-gray-400 dark:text-gray-500 mb-5 flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Delivery
                      </h3>
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        <div className="flex justify-between items-start py-3 gap-4 first:pt-0 last:pb-0">
                          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0">Option</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-right break-words max-w-[60%]">{currentOrder.deliveryOption || "Standard"}</span>
                        </div>
                        <div className="flex justify-between items-start py-3 gap-4">
                          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0">Type</span>
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full text-right shrink-0 ${
                            currentOrder.deliveryCost > 0
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                          }`}>
                            {currentOrder.deliveryType || (currentOrder.deliveryCost > 0 ? "Customer Pays" : "Free Delivery")}
                          </span>
                        </div>
                        <div className="flex justify-between items-start py-3 gap-4">
                          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0">Cost</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-right break-words max-w-[60%]">
                            {currentOrder.deliveryCost > 0 ? `Rs. ${currentOrder.deliveryCost.toLocaleString()}` : "FREE"}
                          </span>
                        </div>
                      </div>

                      {(currentOrder.trackingNumber || currentOrder.courierName) && (
                        <div className="mt-4 bg-blue-50/70 dark:bg-blue-900/15 rounded-xl p-4 border border-blue-100 dark:border-blue-800/50">
                          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider mb-2">Tracking</p>
                          <div className="space-y-1">
                            {currentOrder.courierName && <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{currentOrder.courierName}</p>}
                            {currentOrder.trackingNumber && <p className="text-sm font-mono text-blue-700 dark:text-blue-300">{currentOrder.trackingNumber}</p>}
                          </div>
                          {currentOrder.trackingUrl && (
                            <Button size="sm" variant="outline" onClick={() => window.open(currentOrder.trackingUrl, "_blank")}
                              className="mt-3 bg-white dark:bg-gray-900 text-xs h-7">
                              <ExternalLink className="w-3 h-3 mr-1" /> Track Package
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* --- PAYMENT INFORMATION --- */}
                    <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-[10px] uppercase tracking-[0.12em] font-semibold text-gray-400 dark:text-gray-500 mb-5 flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Payment
                      </h3>
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        <div className="flex justify-between items-start py-3 gap-4 first:pt-0 last:pb-0">
                          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0">Status</span>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 ${
                            currentOrder.paymentStatus === "Paid"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                              : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${currentOrder.paymentStatus === "Paid" ? "bg-emerald-500" : "bg-amber-500"}`} />
                            {currentOrder.paymentStatus === "Paid" ? "Paid" : "Pending"}
                          </span>
                        </div>
                        <div className="flex justify-between items-start py-3 gap-4">
                          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0">Amount</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100 text-right break-words max-w-[60%]">Rs. {currentOrder.total.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-start py-3 gap-4">
                          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0">Delivery</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-right break-words max-w-[60%]">
                            {currentOrder.deliveryCost > 0 ? `Rs. ${currentOrder.deliveryCost.toLocaleString()}` : "FREE"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ====== CENTER COLUMN ====== */}
                  <div className="lg:col-span-7 xl:col-span-5 space-y-6">

                    {/* --- ORDERED PRODUCTS --- */}
                    <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-[10px] uppercase tracking-[0.12em] font-semibold text-gray-400 dark:text-gray-500 flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-[#D4AF37]" />
                          Products ({currentOrder.products.length})
                        </h3>
                      </div>
                      <div className="space-y-4">
                        {currentOrder.products.map((product, idx) => (
                          <div key={product.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                            <div className="flex gap-4 p-4">
                              {/* Image */}
                              <div className="w-[90px] h-[90px] shrink-0 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                {product.image ? (
                                  <img src={product.image} alt={product.name} className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/90x90/e2e8f0/94a3b8?text=N/A"; }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                                    <Package className="w-7 h-7" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-snug">{product.name}</p>
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono mt-1">#{product.id.slice(-8)}</p>

                                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                                      {product.selected_color && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300 border border-pink-100 dark:border-pink-800">
                                          <div className="w-2 h-2 rounded-full bg-pink-400" />
                                          {product.selected_color}
                                        </span>
                                      )}
                                      {product.selected_size && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                                          Size: {product.selected_size}
                                        </span>
                                      )}
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                        Qty: {product.quantity}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
                                      Rs. {(product.quantity * product.price).toLocaleString()}
                                    </p>
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                      Rs. {product.price.toLocaleString()} &times; {product.quantity}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ====== RIGHT COLUMN ====== */}
                  <div className="lg:col-span-7 xl:col-span-4 space-y-6">

                    {/* --- ORDER TIMELINE --- */}
                    <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-[10px] uppercase tracking-[0.12em] font-semibold text-gray-400 dark:text-gray-500 mb-5 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Timeline
                      </h3>
                      <div className="relative">
                        {[
                          { label: "Order Placed", done: true, icon: ShoppingCart,
                            desc: new Date(currentOrder.date).toLocaleDateString() },
                          { label: "Payment", done: currentOrder.paymentStatus === "Paid", icon: CreditCard,
                            desc: currentOrder.paymentStatus === "Paid" ? "Completed" : "Pending" },
                          { label: "Processing", done: currentOrder.status === "Processing" || currentOrder.status === "Delivered", icon: Package,
                            desc: currentOrder.status === "Processing" || currentOrder.status === "Delivered" ? "In Progress" : "Awaiting" },
                          { label: "Shipped", done: currentOrder.status === "Delivered", icon: Truck,
                            desc: currentOrder.status === "Delivered" ? "Completed" : "Awaiting" },
                          { label: "Delivered", done: currentOrder.status === "Delivered", icon: CheckCircle,
                            desc: currentOrder.status === "Delivered" ? "Completed" : "Awaiting" },
                        ].map((step, idx) => {
                          const StepIcon = step.icon;
                          return (
                            <div key={step.label} className="flex items-start gap-3.5 pb-6 relative last:pb-0">
                              {idx < 4 && (
                                <div className={`absolute left-[14px] top-[30px] w-0.5 h-[calc(100%+4px)] ${step.done ? "bg-[#D4AF37]" : "bg-gray-200 dark:bg-gray-700"}`} />
                              )}
                              <div className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 z-10 ring-2 ring-white dark:ring-gray-950 ${
                                step.done
                                  ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                                  : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                              }`}>
                                <StepIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="pt-0.5 min-w-0">
                                <p className={`text-sm font-semibold ${step.done ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}`}>{step.label}</p>
                                <p className={`text-[11px] mt-0.5 font-medium ${step.done ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"}`}>{step.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* --- STATUS CONTROLS --- */}
                    <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-[10px] uppercase tracking-[0.12em] font-semibold text-gray-400 dark:text-gray-500 mb-5 flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Status
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Order</p>
                          <Select value={currentOrder.status}
                            onValueChange={(value) => handleStatusChange(currentOrder.id, value as "Pending" | "Processing" | "Delivered")}>
                            <SelectTrigger className="w-full font-semibold text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending"><span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-amber-500" /> Pending</span></SelectItem>
                              <SelectItem value="Processing"><span className="flex items-center gap-2"><Truck className="w-3.5 h-3.5 text-blue-500" /> Processing</span></SelectItem>
                              <SelectItem value="Delivered"><span className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Delivered</span></SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Payment</p>
                          <Select value={currentOrder.paymentStatus || "Pending"}
                            onValueChange={(value) => updatePaymentStatus(currentOrder.id, value as "Pending" | "Paid")}>
                            <SelectTrigger className="w-full font-semibold text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending"><span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-amber-500" /> Pending</span></SelectItem>
                              <SelectItem value="Paid"><span className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Paid</span></SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* --- ORDER SUMMARY --- */}
                    <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-[10px] uppercase tracking-[0.12em] font-semibold text-gray-400 dark:text-gray-500 mb-5 flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Summary
                      </h3>
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        <div className="flex justify-between items-start py-3 gap-4 first:pt-0">
                          <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">Subtotal</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-right break-words max-w-[60%]">
                            Rs. {(currentOrder.total - currentOrder.deliveryCost).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-start py-3 gap-4">
                          <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">Delivery</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-right break-words max-w-[60%]">
                            {currentOrder.deliveryCost > 0 ? `Rs. ${currentOrder.deliveryCost.toLocaleString()}` : <span className="text-emerald-600 dark:text-emerald-400">FREE</span>}
                          </span>
                        </div>
                        <div className="flex justify-between items-start py-4 gap-4">
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100 shrink-0">Grand Total</span>
                          <span className="text-xl font-bold text-[#D4AF37] text-right break-words max-w-[60%]">Rs. {currentOrder.total.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800 space-y-3">
                        <Button onClick={() => handleViewInvoice(currentOrder)}
                          className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8962F] hover:from-[#B8962F] hover:to-[#A0852A] text-black font-semibold shadow-md hover:shadow-lg transition-all py-2.5 text-sm">
                          <FileText className="w-4 h-4 mr-2" /> View Invoice
                        </Button>
                      </div>
                    </div>

                    {/* --- DELIVERY PROGRESS --- */}
                    <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-[10px] uppercase tracking-[0.12em] font-semibold text-gray-400 dark:text-gray-500 mb-5 flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Delivery Progress
                      </h3>

                      <div className="mb-5 p-4 bg-gray-50 dark:bg-gray-900/80 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3">
                        <div>
                          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Tracking #</p>
                          <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="TRK123456" className="text-sm h-9" />
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Courier</p>
                          <Input value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="LankaPost" className="text-sm h-9" />
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">URL</p>
                          <Input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="https://..." className="text-sm h-9" />
                        </div>
                        <Button onClick={handleAddTracking} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white w-full h-9">
                          <Truck className="w-3.5 h-3.5 mr-1.5" />
                          {currentOrder.trackingNumber ? "Update" : "Add Tracking"}
                        </Button>
                      </div>

                      <div className="relative">
                        {[
                          { label: "Order Placed", done: true },
                          { label: "Processing", done: currentOrder.status === "Processing" || currentOrder.status === "Delivered" },
                          { label: "Shipped", done: currentOrder.status === "Delivered" },
                          { label: "Delivered", done: currentOrder.status === "Delivered" },
                        ].map((step, idx) => (
                          <div key={step.label} className="flex items-start gap-3.5 pb-5 relative last:pb-0">
                            {idx < 3 && (
                              <div className={`absolute left-[12px] top-7 w-0.5 h-[calc(100%+4px)] ${step.done ? "bg-emerald-400" : "bg-gray-200 dark:bg-gray-700"}`} />
                            )}
                            <div className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 z-10 ring-2 ring-white dark:ring-gray-950 ${
                              step.done ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                            }`}>
                              {step.done ? <CheckCircle className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                            </div>
                            <div className="pt-0.5">
                              <p className={`text-sm font-semibold ${step.done ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}`}>{step.label}</p>
                              {step.done && step.label === "Order Placed" && (
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">{new Date(currentOrder.date).toLocaleDateString()}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
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
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Delete Order
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-muted-foreground mb-4">
              Are you sure you want to delete this order? This action cannot be undone.
            </p>
<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
               <p className="text-sm text-red-800 dark:text-red-200 font-medium">
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
