import { useState, useEffect } from "react";
import { Users, Trash2, Search, Loader2, AlertTriangle, X, RefreshCw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import { db } from "../../../firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt?: string;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      const usersData: Customer[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Customer[];
      setCustomers(usersData);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)
  );

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "users", customerToDelete.id));
      setCustomers((prev) => prev.filter((c) => c.id !== customerToDelete.id));
      toast.success(`Customer "${customerToDelete.name}" deleted successfully`);
      setShowDeleteConfirm(false);
      setCustomerToDelete(null);
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (filteredCustomers.length === 0) {
      toast.error("No customers to delete");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ALL ${filteredCustomers.length} customers? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    let deletedCount = 0;
    let failedCount = 0;

    try {
      for (const customer of filteredCustomers) {
        try {
          await deleteDoc(doc(db, "users", customer.id));
          deletedCount++;
        } catch (error) {
          console.error(`Error deleting customer ${customer.id}:`, error);
          failedCount++;
        }
      }

      toast.success(`Deleted ${deletedCount} customer(s)${failedCount > 0 ? `, ${failedCount} failed` : ""}`);
      fetchCustomers();
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Customers</h1>
          <p className="text-gray-600">
            {customers.length} total customer{customers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            onClick={fetchCustomers}
            variant="outline"
            className="flex-shrink-0"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {filteredCustomers.length > 0 && (
            <Button
              onClick={handleDeleteAll}
              variant="destructive"
              disabled={isDeleting}
              className="flex-shrink-0"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete All ({filteredCustomers.length})
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Customers Table */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 mb-2">No customers found</p>
          {searchTerm && (
            <p className="text-sm text-gray-500">
              Try adjusting your search term
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Address
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium">{customer.name || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{customer.email || "N/A"}</td>
                    <td className="px-6 py-4 text-gray-600">{customer.phone || "N/A"}</td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                      {customer.address || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={() => handleDeleteClick(customer)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && customerToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold">Delete Customer</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{customerToDelete.name}</strong>? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedCustomer(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
