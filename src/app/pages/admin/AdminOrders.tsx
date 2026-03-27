import { useState } from "react";
import { Eye, Search, Trash2, AlertTriangle } from "lucide-react";
import { useAdmin } from "../../context/AdminContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
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

export default function AdminOrders() {
  const { orders, updateOrderStatus, deleteOrder } = useAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingOrder, setViewingOrder] = useState<string | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);

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

  const pendingCount = safeOrders.filter(o => o.status === "Pending").length;
  const processingCount = safeOrders.filter(o => o.status === "Processing").length;
  const completedCount = safeOrders.filter(o => o.status === "Delivered").length;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Orders Management</h1>
          <p className="text-gray-600">Track and manage customer orders</p>
        </div>
        <div className="flex gap-4">
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

      {/* Orders Table */}
      {filteredOrders.length > 0 ? (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingOrder(order.id)}
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
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
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
                  {currentOrder.products.map((product, index) => (
                    <div
                      key={index}
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

              {/* Order Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Order Status</p>
                    <p className={`font-semibold text-lg ${
                      currentOrder.status === "Pending" ? "text-orange-600" :
                      currentOrder.status === "Processing" ? "text-blue-600" :
                      "text-green-600"
                    }`}>
                      {currentOrder.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Order Date</p>
                    <p className="font-semibold">
                      {new Date(currentOrder.date).toLocaleDateString()}
                    </p>
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
