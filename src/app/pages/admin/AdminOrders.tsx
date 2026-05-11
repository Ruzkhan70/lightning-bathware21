import { useState } from "react";
import { logger } from "../../../lib/logger";
import { Eye, Search, Trash2, AlertTriangle, FileText, CheckCircle, Clock, Truck, ExternalLink, Loader2, RefreshCw, User, MapPin, Phone, Printer, MessageSquare, Package, CreditCard, Circle, ShoppingCart, DollarSign, XCircle, Copy, Info, Shield, ArrowRight, ChevronRight } from "lucide-react";
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

const COLOR_SWATCH: Record<string, string> = {
  "Black": "#000000", "White": "#FFFFFF", "Pink": "#EC4899", "Gold": "#D4AF37",
  "Silver": "#C0C0C0", "Chrome": "#D4D4D4", "Red": "#EF4444", "Blue": "#3B82F6",
  "Green": "#22C55E", "Yellow": "#EAB308", "Orange": "#F97316", "Purple": "#A855F7",
  "Brown": "#A16207", "Grey": "#6B7280", "Gray": "#6B7280", "Matte Black": "#1A1A1A",
  "Rose Gold": "#B76E79", "Brushed Nickel": "#A8A9AD", "Champagne": "#F7E7CE",
  "Bronze": "#CD7F32", "Copper": "#B87333", "Navy": "#1E3A5F", "Beige": "#F5F5DC",
  "Cream": "#FFFDD0", "Ivory": "#FFFFF0", "Teal": "#008080", "Coral": "#FF7F50",
  "Peach": "#FFDAB9", "Lavender": "#E6E6FA", "Mint": "#98FF98", "Charcoal": "#36454F",
  "Steel": "#71797E", "Titanium": "#BEBEBE", "Satin": "#C6C6C6", "Glossy White": "#FEFEFE",
  "Glossy Black": "#0A0A0A", "Crystal": "#E8F4F8", "Frosted": "#D0E4E8",
};

function getColorSwatch(color: string): string {
  return COLOR_SWATCH[color] || "#6B7280";
}

function getContrastText(bgHex: string): string {
  const c = bgHex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128 ? "text-white" : "text-black";
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

      {/* ====== PREMIUM ORDER DETAIL DIALOG ====== */}
      <Dialog
        open={!!viewingOrder}
        onOpenChange={() => setViewingOrder(null)}
      >
        <DialogContent className="w-[96vw] max-w-[1700px] max-h-[95vh] p-0 gap-0 overflow-hidden bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 border border-gray-200/80 dark:border-gray-800/80 shadow-2xl">
          {currentOrder && (
            <div className="flex flex-col h-full">

              {/* ====== HEADER ====== */}
              <div className="shrink-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                <div className="relative">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#D4AF37] via-[#F5D76E] to-[#D4AF37]" />
                  <div className="px-6 lg:px-8 pt-4 pb-3">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8962F] flex items-center justify-center shadow-lg shadow-[#D4AF37]/30">
                            <ShoppingCart className="w-5 h-5 text-black" />
                          </div>
                          <div>
                            <DialogHeader className="p-0">
                              <DialogTitle className="text-xl lg:text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                                Order <span className="text-[#D4AF37]">#{currentOrder.id.slice(-8)}</span>
                              </DialogTitle>
                            </DialogHeader>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {currentOrder.customerName}
                              <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
                              {new Date(currentOrder.date).toLocaleDateString("en-US", {
                                month: "short", day: "numeric", year: "numeric",
                                hour: "2-digit", minute: "2-digit"
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm border-2 ${
                          currentOrder.status === "Pending"
                            ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700"
                            : currentOrder.status === "Processing"
                            ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700"
                            : "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700"
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            currentOrder.status === "Pending" ? "bg-amber-500" : currentOrder.status === "Processing" ? "bg-blue-500" : "bg-emerald-500"
                          }`} />
                          {currentOrder.status}
                        </span>

                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm border-2 ${
                          currentOrder.paymentStatus === "Paid"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700"
                            : "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700"
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${currentOrder.paymentStatus === "Paid" ? "bg-emerald-500" : "bg-rose-500"}`} />
                          {currentOrder.paymentStatus === "Paid" ? "Paid" : "Pending"}
                        </span>

                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm border-2 ${
                          currentOrder.deliveryCost > 0
                            ? "bg-violet-50 text-violet-700 border-violet-300 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700"
                            : "bg-gray-50 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600"
                        }`}>
                          <Truck className="w-3.5 h-3.5" />
                          {currentOrder.deliveryCost > 0 ? `Rs. ${currentOrder.deliveryCost.toLocaleString()}` : "Free"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 lg:px-8 pb-3 flex flex-wrap items-center gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => handleViewInvoice(currentOrder)}
                      className="h-7 text-xs border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] font-bold transition-all duration-200 px-3">
                      <FileText className="w-3.5 h-3.5 mr-1" /> Invoice
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => window.print()}
                      className="h-7 text-xs border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 font-medium px-3">
                      <Printer className="w-3.5 h-3.5 mr-1" /> Print
                    </Button>
                    {currentOrder.phone && (
                      <Button size="sm" variant="outline" onClick={() => window.open(`https://wa.me/${currentOrder.phone.replace(/[^0-9]/g, "")}`, "_blank")}
                        className="h-7 text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 font-medium transition-all duration-200 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:border-emerald-600 px-3">
                        <MessageSquare className="w-3.5 h-3.5 mr-1" /> WhatsApp
                      </Button>
                    )}
                    {currentOrder.phone && (
                      <Button size="sm" variant="outline" onClick={() => window.open(`tel:${currentOrder.phone}`, "_blank")}
                        className="h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-500 hover:text-white hover:border-blue-500 font-medium transition-all duration-200 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:border-blue-600 px-3">
                        <Phone className="w-3.5 h-3.5 mr-1" /> Call
                      </Button>
                    )}
                    <Button size="sm" variant="outline"
                      onClick={() => {
                        const details = [
                          `Order: #${currentOrder.id.slice(-8)}`,
                          `Customer: ${currentOrder.customerName}`,
                          `Phone: ${currentOrder.phone}`,
                          `Address: ${currentOrder.address}`,
                          `Total: Rs. ${currentOrder.total.toLocaleString()}`,
                          `Status: ${currentOrder.status}`,
                          `Payment: ${currentOrder.paymentStatus}`,
                          `Date: ${new Date(currentOrder.date).toLocaleDateString()}`,
                        ].join("\n");
                        navigator.clipboard.writeText(details);
                        toast.success("Order details copied");
                      }}
                      className="h-7 text-xs border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 font-medium px-3">
                      <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                    </Button>
                  </div>
                </div>
              </div>

              {/* ====== BODY ====== */}
              <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50">
                <div className="p-6 lg:p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* ====== LEFT COLUMN ====== */}
                    <div className="lg:col-span-4 xl:col-span-3 space-y-5">

                      {/* --- CUSTOMER --- */}
                      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                          <div className="flex items-center justify-between">
                            <h3 className="text-[11px] uppercase tracking-[0.2em] font-extrabold text-gray-400 dark:text-gray-500 flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                              Customer
                            </h3>
                            <div className="flex items-center gap-1">
                              {currentOrder.phone && (
                                <>
                                  <button onClick={() => window.open(`tel:${currentOrder.phone}`, "_blank")}
                                    className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-600 transition-all" title="Call">
                                    <Phone className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => window.open(`https://wa.me/${currentOrder.phone.replace(/[^0-9]/g, "")}`, "_blank")}
                                    className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-gray-400 hover:text-emerald-600 transition-all" title="WhatsApp">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="px-5 py-4 space-y-4">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Full Name</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{currentOrder.customerName}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Phone Number</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 font-mono tracking-tight">{currentOrder.phone}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Delivery Address
                            </p>
                            <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed break-words">{currentOrder.address}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Customer ID</p>
                            <p className="text-sm font-bold font-mono text-[#D4AF37]">{currentOrder.userId ? `#${currentOrder.userId.slice(-8)}` : "N/A"}</p>
                          </div>
                        </div>
                      </div>

                      {/* --- DELIVERY --- */}
                      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                          <h3 className="text-[11px] uppercase tracking-[0.2em] font-extrabold text-gray-400 dark:text-gray-500 flex items-center gap-2">
                            <Truck className="w-3.5 h-3.5 text-[#D4AF37]" />
                            Delivery Info
                          </h3>
                        </div>
                        <div className="px-5 py-4">
                          <div className="space-y-0">
                            <div className="flex justify-between items-start py-2.5 border-b border-gray-50 dark:border-gray-800/50 first:pt-0 last:border-0">
                              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0">Method</span>
                              <span className="text-sm font-bold text-gray-900 dark:text-gray-100 text-right max-w-[55%]">{currentOrder.deliveryOption || "Standard"}</span>
                            </div>
                            <div className="flex justify-between items-center py-2.5 border-b border-gray-50 dark:border-gray-800/50">
                              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0">Type</span>
                              <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
                                currentOrder.deliveryCost > 0
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                              }`}>
                                {currentOrder.deliveryType || (currentOrder.deliveryCost > 0 ? "Customer Pays" : "Free")}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-2.5">
                              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0">Fee</span>
                              <span className="text-sm font-bold text-gray-900 dark:text-gray-100 text-right">
                                {currentOrder.deliveryCost > 0 ? `Rs. ${currentOrder.deliveryCost.toLocaleString()}` : <span className="text-emerald-600 dark:text-emerald-400">FREE</span>}
                              </span>
                            </div>
                          </div>
                          {(currentOrder.trackingNumber || currentOrder.courierName) && (
                            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3.5 border border-blue-100 dark:border-blue-800/50">
                              <p className="text-[9px] text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Info className="w-3 h-3" /> Tracking Details
                              </p>
                              {currentOrder.courierName && <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{currentOrder.courierName}</p>}
                              {currentOrder.trackingNumber && <p className="text-xs font-mono font-bold text-blue-700 dark:text-blue-300 mt-0.5">{currentOrder.trackingNumber}</p>}
                              {currentOrder.trackingUrl && (
                                <Button size="sm" variant="outline" onClick={() => window.open(currentOrder.trackingUrl, "_blank")}
                                  className="mt-2.5 bg-white dark:bg-gray-900 text-[10px] font-bold h-7 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3">
                                  <ExternalLink className="w-3 h-3 mr-1" /> Track Package
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* --- PAYMENT --- */}
                      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                          <h3 className="text-[11px] uppercase tracking-[0.2em] font-extrabold text-gray-400 dark:text-gray-500 flex items-center gap-2">
                            <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" />
                            Payment
                          </h3>
                        </div>
                        <div className="px-5 py-4">
                          <div className="space-y-0">
                            <div className="flex justify-between items-center py-2.5 border-b border-gray-50 dark:border-gray-800/50 first:pt-0">
                              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0">Status</span>
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold shrink-0 border-2 ${
                                currentOrder.paymentStatus === "Paid"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700"
                                  : "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700"
                              }`}>
                                <div className={`w-2 h-2 rounded-full ${currentOrder.paymentStatus === "Paid" ? "bg-emerald-500" : "bg-rose-500"}`} />
                                {currentOrder.paymentStatus === "Paid" ? "Paid" : "Pending"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-2.5 border-b border-gray-50 dark:border-gray-800/50">
                              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0">Method</span>
                              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Cash on Delivery</span>
                            </div>
                            <div className="flex justify-between items-center py-2.5">
                              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0">Total</span>
                              <span className="text-sm font-extrabold text-gray-900 dark:text-gray-100">Rs. {currentOrder.total.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ====== CENTER COLUMN ====== */}
                    <div className="lg:col-span-5 xl:col-span-5 space-y-5">

                      {/* --- PRODUCTS --- */}
                      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                          <div className="flex items-center justify-between">
                            <h3 className="text-[11px] uppercase tracking-[0.2em] font-extrabold text-gray-400 dark:text-gray-500 flex items-center gap-2">
                              <Package className="w-3.5 h-3.5 text-[#D4AF37]" />
                              Ordered Items
                            </h3>
                            <span className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                              {currentOrder.products.length} item{currentOrder.products.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                        <div className="px-5 py-4 space-y-4">
                          {currentOrder.products.map((product, idx) => {
                            const swatchColor = getColorSwatch(product.selected_color || "");
                            return (
                              <div key={`${product.id}-${idx}`} className="bg-white dark:bg-gray-900/80 border-2 border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden hover:border-[#D4AF37]/30 dark:hover:border-[#D4AF37]/20 hover:shadow-lg transition-all duration-300 group">
                                <div className="flex gap-4 p-4">
                                  <div className="w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                                    {product.image ? (
                                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/112x112/e2e8f0/94a3b8?text=N/A"; }}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                                        <Package className="w-10 h-10" />
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-gray-900 dark:text-gray-100 leading-tight">{product.name}</p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mt-1 font-semibold">SKU: #{product.id.slice(-8)}</p>

                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                      {product.selected_color && (
                                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold border-2 shadow-sm"
                                          style={{
                                            backgroundColor: `${swatchColor}18`,
                                            borderColor: `${swatchColor}40`,
                                            color: swatchColor,
                                          }}>
                                          <span className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: swatchColor, outline: `2px solid ${swatchColor}40`, outlineOffset: 1 }}
                                          />
                                          {product.selected_color}
                                        </span>
                                      )}
                                      {product.selected_size && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-800 shadow-sm">
                                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                                          Size: {product.selected_size}
                                        </span>
                                      )}
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700">
                                        Qty: {product.quantity}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between mt-3 pt-3 border-t-2 border-gray-100 dark:border-gray-800">
                                      <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                                        Rs. {product.price.toLocaleString()} &times; {product.quantity}
                                      </span>
                                      <span className="font-extrabold text-sm text-gray-900 dark:text-gray-100">
                                        Rs. {(product.quantity * product.price).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* ====== RIGHT COLUMN ====== */}
                    <div className="lg:col-span-3 xl:col-span-4 space-y-5">

                      {/* --- TIMELINE --- */}
                      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                          <h3 className="text-[11px] uppercase tracking-[0.2em] font-extrabold text-gray-400 dark:text-gray-500 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                            Timeline
                          </h3>
                        </div>
                        <div className="px-5 py-5">
                          <div className="relative">
                            {[
                              { label: "Order Placed", done: true, icon: ShoppingCart,
                                desc: new Date(currentOrder.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) },
                              { label: "Payment", done: currentOrder.paymentStatus === "Paid", icon: Shield,
                                desc: currentOrder.paymentStatus === "Paid" ? "Completed" : "Pending" },
                              { label: "Processing", done: currentOrder.status === "Processing" || currentOrder.status === "Delivered", icon: Package,
                                desc: currentOrder.status === "Processing" || currentOrder.status === "Delivered" ? "In Progress" : "Awaiting" },
                              { label: "Packed", done: currentOrder.status === "Delivered", icon: CheckCircle,
                                desc: currentOrder.status === "Delivered" ? "Ready" : "Pending" },
                              { label: "Shipped", done: currentOrder.status === "Delivered", icon: Truck,
                                desc: currentOrder.status === "Delivered" ? "In Transit" : "Awaiting" },
                              { label: "Out for Delivery", done: currentOrder.status === "Delivered", icon: Truck,
                                desc: currentOrder.status === "Delivered" ? "On the way" : "Pending" },
                              { label: "Delivered", done: currentOrder.status === "Delivered", icon: CheckCircle,
                                desc: currentOrder.status === "Delivered" ? "Completed" : "Pending" },
                            ].map((step, idx) => {
                              const StepIcon = step.icon;
                              return (
                                <div key={step.label} className="flex items-start gap-3 pb-5 relative last:pb-0">
                                  {idx < 6 && (
                                    <div className={`absolute left-[14px] top-8 w-0.5 h-[calc(100%+4px)] transition-all duration-500 ${
                                      step.done ? "bg-[#D4AF37]" : "bg-gray-200 dark:bg-gray-700"
                                    }`} />
                                  )}
                                  <div className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 z-10 ring-[3px] ring-white dark:ring-gray-900 transition-all duration-300 ${
                                    step.done
                                      ? "bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/30"
                                      : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
                                  }`}>
                                    <StepIcon className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="pt-0.5 min-w-0">
                                    <p className={`text-xs font-extrabold transition-colors duration-300 ${
                                      step.done ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"
                                    }`}>{step.label}</p>
                                    <p className={`text-[10px] mt-0.5 font-bold transition-colors duration-300 ${
                                      step.done ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"
                                    }`}>{step.desc}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* --- STATUS CONTROLS --- */}
                      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                          <h3 className="text-[11px] uppercase tracking-[0.2em] font-extrabold text-gray-400 dark:text-gray-500 flex items-center gap-2">
                            <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                            Status
                          </h3>
                        </div>
                        <div className="px-5 py-4 space-y-4">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Order Status</p>
                            <Select value={currentOrder.status}
                              onValueChange={(value) => handleStatusChange(currentOrder.id, value as "Pending" | "Processing" | "Delivered")}>
                              <SelectTrigger className="w-full h-10 text-sm font-bold border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pending"><span className="flex items-center gap-2 text-sm font-bold"><Clock className="w-4 h-4 text-amber-500" /> Pending</span></SelectItem>
                                <SelectItem value="Processing"><span className="flex items-center gap-2 text-sm font-bold"><Truck className="w-4 h-4 text-blue-500" /> Processing</span></SelectItem>
                                <SelectItem value="Delivered"><span className="flex items-center gap-2 text-sm font-bold"><CheckCircle className="w-4 h-4 text-emerald-500" /> Delivered</span></SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Payment Status</p>
                            <Select value={currentOrder.paymentStatus || "Pending"}
                              onValueChange={(value) => updatePaymentStatus(currentOrder.id, value as "Pending" | "Paid")}>
                              <SelectTrigger className="w-full h-10 text-sm font-bold border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pending"><span className="flex items-center gap-2 text-sm font-bold"><Clock className="w-4 h-4 text-amber-500" /> Pending</span></SelectItem>
                                <SelectItem value="Paid"><span className="flex items-center gap-2 text-sm font-bold"><CheckCircle className="w-4 h-4 text-emerald-500" /> Paid</span></SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* --- ORDER SUMMARY --- */}
                      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                          <h3 className="text-[11px] uppercase tracking-[0.2em] font-extrabold text-gray-400 dark:text-gray-500 flex items-center gap-2">
                            <DollarSign className="w-3.5 h-3.5 text-[#D4AF37]" />
                            Summary
                          </h3>
                        </div>
                        <div className="px-5 py-4">
                          <div className="space-y-0">
                            <div className="flex justify-between items-center py-3 border-b border-gray-50 dark:border-gray-800/50 first:pt-0">
                              <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Subtotal</span>
                              <span className="text-sm font-extrabold text-gray-900 dark:text-gray-100">Rs. {(currentOrder.total - currentOrder.deliveryCost).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-gray-50 dark:border-gray-800/50">
                              <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Delivery Fee</span>
                              <span className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                                {currentOrder.deliveryCost > 0 ? `Rs. ${currentOrder.deliveryCost.toLocaleString()}` : <span className="text-emerald-600 dark:text-emerald-400">FREE</span>}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-4">
                              <span className="text-sm font-extrabold text-gray-900 dark:text-gray-100">Grand Total</span>
                              <span className="text-lg font-black text-[#D4AF37]">Rs. {currentOrder.total.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t-2 border-gray-100 dark:border-gray-800">
                            <Button onClick={() => handleViewInvoice(currentOrder)}
                              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8962F] hover:from-[#C49E2E] hover:to-[#A0852A] text-black font-extrabold shadow-lg hover:shadow-xl hover:shadow-[#D4AF37]/30 transition-all duration-200 py-2.5 h-auto text-sm rounded-xl">
                              <FileText className="w-4 h-4 mr-2" /> View Invoice
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* --- TRACKING --- */}
                      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                          <h3 className="text-[11px] uppercase tracking-[0.2em] font-extrabold text-gray-400 dark:text-gray-500 flex items-center gap-2">
                            <Truck className="w-3.5 h-3.5 text-[#D4AF37]" />
                            Tracking
                          </h3>
                        </div>
                        <div className="px-5 py-4 space-y-3.5">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Tracking Number</p>
                            <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="e.g. TRK123456" className="text-sm h-9 font-bold bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Courier</p>
                            <Input value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="e.g. LankaPost" className="text-sm h-9 font-bold bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Tracking URL</p>
                            <Input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="https://..." className="text-sm h-9 font-bold bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl" />
                          </div>
                          <Button onClick={handleAddTracking} size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 text-sm font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all">
                            <Truck className="w-4 h-4 mr-1.5" />
                            {currentOrder.trackingNumber ? "Update Tracking" : "Add Tracking"}
                          </Button>
                        </div>
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
