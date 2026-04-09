import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Eye, Mail, Phone, Building2, User, DollarSign, FileText } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import { db } from "../../../firebase";
import { collection, getDocs, updateDoc, doc, query, orderBy } from "firebase/firestore";

interface BulkOrder {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  projectType: string;
  timeline: string;
  estimatedBudget: string;
  productRequirements: string;
  additionalNotes: string;
  status: "pending" | "contacted" | "quoted" | "completed" | "cancelled";
  createdAt: any;
}

export default function AdminBulkOrders() {
  const [orders, setOrders] = useState<BulkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<BulkOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const q = query(collection(db, "bulkOrders"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BulkOrder[];
      setOrders(ordersData);
    } catch (error) {
      console.error("Error loading bulk orders:", error);
      toast.error("Failed to load bulk orders");
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: BulkOrder["status"]) => {
    try {
      await updateDoc(doc(db, "bulkOrders", orderId), { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      toast.success(`Order marked as ${newStatus}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update status");
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    const matchesSearch = searchQuery === "" || 
      order.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: BulkOrder["status"]) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      contacted: "bg-blue-100 text-blue-800",
      quoted: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800"
    };
    const labels = {
      pending: "Pending",
      contacted: "Contacted",
      quoted: "Quoted",
      completed: "Completed",
      cancelled: "Cancelled"
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bulk Order Inquiries</h1>
        <p className="text-gray-600">Manage bulk order inquiries from contractors and companies</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Search by company, name, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "contacted", "quoted", "completed", "cancelled"].map(status => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              onClick={() => setFilterStatus(status)}
              className={filterStatus === status ? "bg-[#D4AF37] text-black" : ""}
            >
              {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Company</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Contact</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Project</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Budget</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No bulk orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{order.companyName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div>{order.contactPerson}</div>
                        <div className="text-gray-500">{order.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {order.projectType || "Not specified"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {order.estimatedBudget || "Not specified"}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Order Details</h2>
              <Button variant="ghost" onClick={() => setSelectedOrder(null)}>
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Company Name</Label>
                  <p className="font-medium">{selectedOrder.companyName}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Contact Person</Label>
                  <p className="font-medium">{selectedOrder.contactPerson}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Email</Label>
                  <p className="font-medium">{selectedOrder.email}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Phone</Label>
                  <p className="font-medium">{selectedOrder.phone || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Project Type</Label>
                  <p className="font-medium">{selectedOrder.projectType || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Timeline</Label>
                  <p className="font-medium">{selectedOrder.timeline || "Not specified"}</p>
                </div>
              </div>

              <div>
                <Label className="text-gray-500">Estimated Budget</Label>
                <p className="font-medium">{selectedOrder.estimatedBudget || "Not specified"}</p>
              </div>

              <div>
                <Label className="text-gray-500">Product Requirements</Label>
                <p className="whitespace-pre-wrap">{selectedOrder.productRequirements}</p>
              </div>

              {selectedOrder.additionalNotes && (
                <div>
                  <Label className="text-gray-500">Additional Notes</Label>
                  <p className="whitespace-pre-wrap">{selectedOrder.additionalNotes}</p>
                </div>
              )}

              <div>
                <Label className="text-gray-500">Status</Label>
                <div className="mt-2">{getStatusBadge(selectedOrder.status)}</div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button
                  onClick={() => updateOrderStatus(selectedOrder.id, "contacted")}
                  disabled={selectedOrder.status !== "pending"}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Mark as Contacted
                </Button>
                <Button
                  onClick={() => updateOrderStatus(selectedOrder.id, "quoted")}
                  disabled={selectedOrder.status === "completed" || selectedOrder.status === "cancelled"}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Mark as Quoted
                </Button>
                <Button
                  onClick={() => updateOrderStatus(selectedOrder.id, "completed")}
                  disabled={selectedOrder.status === "completed" || selectedOrder.status === "cancelled"}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Completed
                </Button>
                <Button
                  onClick={() => updateOrderStatus(selectedOrder.id, "cancelled")}
                  disabled={selectedOrder.status === "completed" || selectedOrder.status === "cancelled"}
                  variant="destructive"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <a href={`mailto:${selectedOrder.email}`} className="flex-1">
                  <Button className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Customer
                  </Button>
                </a>
                {selectedOrder.phone && (
                  <a href={`tel:${selectedOrder.phone}`} className="flex-1">
                    <Button className="w-full">
                      <Phone className="w-4 h-4 mr-2" />
                      Call Customer
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
