import { useState, useEffect } from "react";
import { Package, Eye, Search, Filter, Check, X } from "lucide-react";
import { useAdmin, Order } from "../../context/AdminContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { toast } from "sonner";

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-500",
  processing: "bg-blue-500",
  shipped: "bg-purple-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
};

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const contextStatusToDisplay: Record<string, OrderStatus> = {
  Pending: "pending",
  Processing: "processing",
  Delivered: "delivered",
};

const displayStatusToContext: Record<OrderStatus, "Pending" | "Processing" | "Delivered"> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Processing",
  delivered: "Delivered",
  cancelled: "Pending",
};

interface OrderWithDisplayStatus extends Order {
  displayStatus: OrderStatus;
}

export default function AdminOrders() {
  const { orders, updateOrderStatus } = useAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDisplayStatus | null>(null);
  const [ordersWithStatus, setOrdersWithStatus] = useState<OrderWithDisplayStatus[]>([]);

  useEffect(() => {
    const mapped = orders.map((order) => ({
      ...order,
      displayStatus: contextStatusToDisplay[order.status] || "pending",
    }));
    setOrdersWithStatus(mapped);
  }, [orders]);

  const filteredOrders = ordersWithStatus
    .filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || order.displayStatus === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, displayStatusToContext[newStatus]);
    toast.success("Order status updated!");
  };

  const statusCounts = {
    all: ordersWithStatus.length,
    pending: ordersWithStatus.filter((o) => o.displayStatus === "pending").length,
    processing: ordersWithStatus.filter((o) => o.displayStatus === "processing").length,
    shipped: ordersWithStatus.filter((o) => o.displayStatus === "shipped").length,
    delivered: ordersWithStatus.filter((o) => o.displayStatus === "delivered").length,
    cancelled: ordersWithStatus.filter((o) => o.displayStatus === "cancelled").length,
  };

  const calculateSubtotal = (order: OrderWithDisplayStatus) => {
    return order.products.reduce(
      (sum, product) => sum + product.price * product.quantity,
      0
    );
  };

  const tax = (subtotal: number) => subtotal * 0.1;
  const shipping = (order: OrderWithDisplayStatus) => order.deliveryCost || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="w-8 h-8" />
            Orders Management
          </h1>
          <p className="text-gray-600 mt-1">Track and manage customer orders</p>
        </div>
        <div className="text-2xl font-bold text-amber-600">
          {orders.length} Orders
        </div>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by Order ID or Customer Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All ({statusCounts.all})
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("pending")}
            className={statusFilter === "pending" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
          >
            Pending ({statusCounts.pending})
          </Button>
          <Button
            variant={statusFilter === "processing" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("processing")}
            className={statusFilter === "processing" ? "bg-blue-500 hover:bg-blue-600" : ""}
          >
            Processing ({statusCounts.processing})
          </Button>
          <Button
            variant={statusFilter === "shipped" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("shipped")}
            className={statusFilter === "shipped" ? "bg-purple-500 hover:bg-purple-600" : ""}
          >
            Shipped ({statusCounts.shipped})
          </Button>
          <Button
            variant={statusFilter === "delivered" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("delivered")}
            className={statusFilter === "delivered" ? "bg-green-500 hover:bg-green-600" : ""}
          >
            Delivered ({statusCounts.delivered})
          </Button>
          <Button
            variant={statusFilter === "cancelled" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("cancelled")}
            className={statusFilter === "cancelled" ? "bg-red-500 hover:bg-red-600" : ""}
          >
            Cancelled ({statusCounts.cancelled})
          </Button>
        </div>

        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-sm">
                      #{order.id.slice(-8)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {order.address}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(order.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{order.products.length} item(s)</TableCell>
                    <TableCell className="font-semibold">
                      Rs. {order.total.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[order.displayStatus]} text-white`}>
                        {statusLabels[order.displayStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Select
                          value={order.displayStatus}
                          onValueChange={(value) =>
                            handleStatusChange(order.id, value as OrderStatus)
                          }
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No orders found</p>
          </div>
        )}
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Order Details #{selectedOrder?.id.slice(-8)}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="font-semibold">
                    {new Date(selectedOrder.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <Badge className={`${statusColors[selectedOrder.displayStatus]} text-white text-sm px-3 py-1`}>
                  {statusLabels[selectedOrder.displayStatus]}
                </Badge>
              </div>

              <Card className="p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{selectedOrder.phone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">customer@example.com</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Delivery Address</p>
                    <p className="font-medium">{selectedOrder.address}</p>
                  </div>
                </div>
              </Card>

              <div>
                <h3 className="font-semibold mb-3">Ordered Products</h3>
                <div className="space-y-3">
                  {selectedOrder.products.map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-600">
                            Qty: {product.quantity} × Rs. {product.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold">
                        Rs. {(product.quantity * product.price).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Card className="p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      Rs. {calculateSubtotal(selectedOrder).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      Rs. {shipping(selectedOrder).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (10%)</span>
                    <span className="font-medium">
                      Rs. {tax(calculateSubtotal(selectedOrder)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span>Rs. {selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>
              </Card>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Update Order Status</p>
                  <Select
                    value={selectedOrder.displayStatus}
                    onValueChange={(value) =>
                      handleStatusChange(selectedOrder.id, value as OrderStatus)
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Delivery Option</p>
                  <p className="font-medium">{selectedOrder.deliveryOption || "Standard Delivery"}</p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Order Notes</h3>
                <p className="text-sm text-gray-600">No notes for this order.</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}