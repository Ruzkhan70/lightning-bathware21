import { useState, useMemo } from "react";
import { useAdmin } from "../../context/AdminContext";
import { ActivityLog, ACTION_LABELS, ACTION_CATEGORIES, getActionIcon, getStatusColor } from "../../../lib/activityLog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Search, Download, Filter, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";

const ITEMS_PER_PAGE = 20;

export default function AdminActivityLogs() {
  const { activityLogs, clearActivityLogs } = useAdmin();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredLogs = useMemo(() => {
    let filtered = [...activityLogs];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.userEmail.toLowerCase().includes(query) ||
          log.details.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query)
      );
    }

    // Action filter
    if (filterAction !== "all") {
      if (filterAction === "authentication") {
        filtered = filtered.filter(
          (log) =>
            log.action === "LOGIN_SUCCESS" ||
            log.action === "LOGIN_FAILED" ||
            log.action === "LOGOUT"
        );
      } else if (filterAction === "products") {
        filtered = filtered.filter(
          (log) =>
            log.action.startsWith("PRODUCT_")
        );
      } else if (filterAction === "security") {
        filtered = filtered.filter(
          (log) =>
            log.action === "SUSPICIOUS_ACTIVITY" ||
            log.action === "PASSWORD_CHANGE"
        );
      } else if (filterAction === "categories") {
        filtered = filtered.filter((log) => log.action.startsWith("CATEGORY_"));
      } else if (filterAction === "offers") {
        filtered = filtered.filter((log) => log.action.startsWith("OFFER_"));
      } else if (filterAction === "messages") {
        filtered = filtered.filter((log) => log.action.startsWith("MESSAGE_"));
      } else if (filterAction === "reviews") {
        filtered = filtered.filter((log) => log.action.startsWith("REVIEW_"));
      } else if (filterAction === "orders") {
        filtered = filtered.filter((log) => log.action.startsWith("ORDER_") || log.action.startsWith("INVOICE_"));
      } else {
        filtered = filtered.filter((log) =>
          log.action.toLowerCase().includes(filterAction.toLowerCase())
        );
      }
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((log) => log.status === filterStatus);
    }

    // Date filter
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
  }, [activityLogs, searchQuery, filterAction, filterStatus, filterDate]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const exportToCSV = () => {
    const headers = ["Timestamp", "User", "Action", "Details", "Status", "IP Address", "Device"];
    const csvContent = [
      headers.join(","),
      ...filteredLogs.map((log) => {
        let details = log.details;
        if (log.metadata?.password) {
          details = details.replace(/password[:\s]*\S+/gi, 'password: ***');
        }
        if (log.metadata?.attemptedEmail) {
          details = details.replace(/password[:\s]*\S+/gi, 'password: ***');
        }
        return [
          new Date(log.timestamp).toLocaleString(),
          log.userEmail,
          ACTION_LABELS[log.action],
          `"${details.replace(/"/g, '""')}"`,
          log.status,
          log.ipAddress || "Unknown",
          log.userAgent?.split(" ").slice(-2).join(" ") || "Unknown",
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `activity-logs-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getStatusIcon = (status: ActivityLog["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const suspiciousCount = activityLogs.filter(
    (log) => log.action === "SUSPICIOUS_ACTIVITY" || log.action === "LOGIN_FAILED"
  ).length;

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Activity Logs</h1>
          <p className="text-gray-600">
            Monitor all admin actions and security events
          </p>
        </div>
        <div className="flex items-center gap-4">
          {suspiciousCount > 0 && (
            <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="text-amber-700 font-semibold">
                {suspiciousCount} warning{suspiciousCount > 1 ? "s" : ""}
              </span>
            </div>
          )}
          <Button
            onClick={exportToCSV}
            className="bg-[#D4AF37] hover:bg-[#C5A028] text-black"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              if (window.confirm("Are you sure you want to clear all activity logs? This action cannot be undone.")) {
                await clearActivityLogs();
              }
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>

          {/* Action Filter */}
          <Select
            value={filterAction}
            onValueChange={(value) => {
              setFilterAction(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="authentication">Authentication</SelectItem>
              <SelectItem value="products">Products</SelectItem>
              <SelectItem value="categories">Categories</SelectItem>
              <SelectItem value="offers">Offers</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="settings">Settings</SelectItem>
              <SelectItem value="orders">Orders</SelectItem>
              <SelectItem value="messages">Messages</SelectItem>
              <SelectItem value="reviews">Reviews</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={filterStatus}
            onValueChange={(value) => {
              setFilterStatus(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Filter */}
          <Select
            value={filterDate}
            onValueChange={(value) => {
              setFilterDate(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-36">
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

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-4 px-4 font-semibold">Status</th>
                <th className="text-left py-4 px-4 font-semibold">Timestamp</th>
                <th className="text-left py-4 px-4 font-semibold">User</th>
                <th className="text-left py-4 px-4 font-semibold">Action</th>
                <th className="text-left py-4 px-4 font-semibold">Details</th>
                <th className="text-left py-4 px-4 font-semibold">Category</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No activity logs found
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {getStatusIcon(log.status)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{log.userEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span>{getActionIcon(log.action)}</span>
                        <span className="font-medium">
                          {ACTION_LABELS[log.action]}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-md" title={log.details}>
                      <div>{log.details}</div>
                      {log.action === 'LOGIN_FAILED' && log.metadata?.passwordPrefix && (
                        <div className="text-xs text-orange-600 mt-1">
                          Password hint: "{log.metadata.passwordPrefix}***" ({log.metadata.passwordLength} chars)
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                        {ACTION_CATEGORIES[log.action]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)} of{" "}
              {filteredLogs.length} logs
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
    </div>
  );
}
