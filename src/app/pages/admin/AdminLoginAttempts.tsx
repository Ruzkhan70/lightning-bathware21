import { useState, useMemo, useEffect } from "react";
import { useAdmin } from "../../context/AdminContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Search, Download, Filter, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, XCircle, Shield, Clock, Globe, Monitor, Trash2, Trash, X } from "lucide-react";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../firebase";
import { toast } from "sonner";

interface LoginAttemptLog {
  id: string;
  email: string;
  emailMasked: string;
  status: "success" | "failed";
  timestamp: string;
  device?: string;
  browser?: string;
  failureReason?: string;
  action?: string;
}

const ITEMS_PER_PAGE = 15;

export default function AdminLoginAttempts() {
  const { storeProfile } = useAdmin();
  const [logs, setLogs] = useState<LoginAttemptLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "adminLogs"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData: LoginAttemptLog[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email || "",
          emailMasked: data.emailMasked || "",
          status: data.status || "failed",
          timestamp: data.timestamp || data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          device: data.device,
          browser: data.browser,
          failureReason: data.failureReason,
          action: data.action,
        };
      });
      setLogs(logsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error loading login attempts:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = useMemo(() => {
    let filtered = [...logs];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.email.toLowerCase().includes(query) ||
          log.emailMasked.toLowerCase().includes(query) ||
          (log.failureReason && log.failureReason.toLowerCase().includes(query))
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((log) => log.status === filterStatus);
    }

    if (filterDate !== "all") {
      const now = new Date();
      let cutoffDate: Date;
      
      switch (filterDate) {
        case "today":
          cutoffDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "week":
          cutoffDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          cutoffDate = new Date(0);
      }
      
      filtered = filtered.filter(
        (log) => new Date(log.timestamp) >= cutoffDate
      );
    }

    return filtered;
  }, [logs, searchQuery, filterStatus, filterDate]);

  const stats = useMemo(() => {
    const total = logs.length;
    const failed = logs.filter(l => l.status === "failed").length;
    const success = logs.filter(l => l.status === "success").length;
    const suspicious = failed > 0 ? Math.min(failed, Math.floor(failed / 3)) : 0;
    return { total, failed, success, suspicious };
  }, [logs]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const exportToCSV = () => {
    const headers = ["Date/Time", "Email", "Status", "Device", "Browser", "Failure Reason"];
    const csvContent = [
      headers.join(","),
      ...filteredLogs.map((log) => [
        new Date(log.timestamp).toLocaleString(),
        log.email,
        log.status.toUpperCase(),
        log.device || "Unknown",
        log.browser || "Unknown",
        log.failureReason || "N/A",
      ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `login-attempts-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getFailureSeverity = (reason?: string): "low" | "medium" | "high" => {
    if (!reason) return "low";
    if (reason.includes("unauthorized") || reason.includes("not authorized")) return "high";
    if (reason.includes("password") || reason.includes("Incorrect")) return "medium";
    return "low";
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, "adminLogs", logId));
      toast.success("Login attempt deleted");
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting log:", error);
      toast.error("Failed to delete log");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setIsDeleting(true);
      const deletePromises = filteredLogs.map(log => deleteDoc(doc(db, "adminLogs", log.id)));
      await Promise.all(deletePromises);
      toast.success(`Deleted ${filteredLogs.length} login attempt(s)`);
      setShowClearAllConfirm(false);
    } catch (error) {
      console.error("Error clearing logs:", error);
      toast.error("Failed to clear logs");
    } finally {
      setIsDeleting(false);
    }
  };

  const getSeverityColor = (severity: "low" | "medium" | "high") => {
    switch (severity) {
      case "high": return "text-red-600 bg-red-50 border-red-200";
      case "medium": return "text-orange-600 bg-orange-50 border-orange-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading login attempts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Login Attempts</h1>
          <p className="text-gray-600">
            Monitor all admin login attempts and security events
          </p>
        </div>
        <div className="flex gap-2">
          {filteredLogs.length > 0 && (
            <Button
              onClick={() => setShowClearAllConfirm(true)}
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-50"
              disabled={isDeleting}
            >
              <Trash className="w-4 h-4 mr-2" />
              Clear All ({filteredLogs.length})
            </Button>
          )}
          <Button
            onClick={exportToCSV}
            className="bg-[#D4AF37] hover:bg-[#C5A028] text-black"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Attempts</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Successful</p>
              <p className="text-2xl font-bold text-green-600">{stats.success}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Failed</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Suspicious</p>
              <p className="text-2xl font-bold text-amber-600">{stats.suspicious}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by email or reason..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>

          <Select
            value={filterStatus}
            onValueChange={(value) => {
              setFilterStatus(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Successful</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterDate}
            onValueChange={(value) => {
              setFilterDate(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-36">
              <Clock className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-4 px-4 font-semibold">Status</th>
                <th className="text-left py-4 px-4 font-semibold">Date & Time</th>
                <th className="text-left py-4 px-4 font-semibold">Email</th>
                <th className="text-left py-4 px-4 font-semibold">Failure Reason</th>
                <th className="text-left py-4 px-4 font-semibold">Device</th>
                <th className="text-left py-4 px-4 font-semibold">Browser</th>
                <th className="text-left py-4 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    No login attempts found
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const severity = log.status === "failed" ? getFailureSeverity(log.failureReason) : "low";
                  return (
                    <tr key={log.id} className={`border-b hover:bg-gray-50 ${severity === "high" ? "bg-red-50/30" : ""}`}>
                      <td className="py-3 px-4">
                        {log.status === "success" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Success
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(severity)}`}>
                            <XCircle className="w-3 h-3" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{log.emailMasked || log.email}</div>
                        {log.emailMasked && (
                          <div className="text-xs text-gray-400" title={log.email}>
                            {log.email.substring(0, 3)}***@{log.email.split("@")[1]}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {log.failureReason ? (
                          <span className={`text-sm px-2 py-1 rounded ${getSeverityColor(severity)}`}>
                            {log.failureReason}
                          </span>
                        ) : log.action === "logout" ? (
                          <span className="text-sm text-gray-500">Logged out</span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Monitor className="w-4 h-4" />
                          {log.device || "Unknown"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Globe className="w-4 h-4" />
                          {log.browser || "Unknown"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {deleteConfirm === log.id ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteLog(log.id)}
                              disabled={isDeleting}
                              className="bg-red-500 hover:bg-red-600 text-white"
                            >
                              {isDeleting ? "..." : "Delete"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeleteConfirm(null)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteConfirm(log.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)} of{" "}
              {filteredLogs.length} attempts
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800 mb-1">Security Notice</h3>
            <p className="text-sm text-amber-700">
              Only the authorized admin email <strong>{storeProfile.authorizedAdminEmail || "not set"}</strong> can access the admin portal. 
              All other login attempts are automatically blocked. Failed attempts are logged for security monitoring.
            </p>
          </div>
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold">Clear All Login Attempts</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete all {filteredLogs.length} login attempt(s)? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowClearAllConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleClearAll}
                disabled={isDeleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                {isDeleting ? "Deleting..." : `Delete ${filteredLogs.length} Item(s)`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
