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
import { Search, Download, Filter, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, XCircle, Shield, Clock, Globe, Monitor, Trash2, Trash, X, MapPin } from "lucide-react";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../../../firebase";
import { toast } from "sonner";
import { getIpGeoLocation, isIpBlocked, getFailedAttemptsFromIp } from "../../../lib/ipSecurity";

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
  ipAddress?: string;
  deviceType?: "mobile" | "tablet" | "desktop";
  location?: { country: string; city: string };
}

interface BlockedIpEntry {
  id: string;
  ipAddress: string;
  blockedUntil: Timestamp;
  reason: string;
}

const ITEMS_PER_PAGE = 15;

export default function AdminLoginAttempts() {
  const { storeProfile } = useAdmin();
  const [logs, setLogs] = useState<LoginAttemptLog[]>([]);
  const [blockedIps, setBlockedIps] = useState<BlockedIpEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("failed");
  const [filterDate, setFilterDate] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [suspiciousIps, setSuspiciousIps] = useState<Set<string>>(new Set());
  const [ipEmailMap, setIpEmailMap] = useState<Map<string, Set<string>>>(new Map());

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
          ipAddress: data.ipAddress,
          deviceType: data.deviceType,
          location: data.location,
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

  useEffect(() => {
    const q = query(collection(db, "blockedIps"), orderBy("blockedUntil", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const blocked: BlockedIpEntry[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as BlockedIpEntry[];
      setBlockedIps(blocked);
    }, (error) => {
      console.error("Error loading blocked IPs:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const emailMap = new Map<string, Set<string>>();
    const suspicious = new Set<string>();
    const ipAttemptCount = new Map<string, number>();

    const failedLogs = logs.filter(l => l.status === "failed");

    for (const log of failedLogs) {
      if (log.ipAddress && log.ipAddress !== "unknown") {
        if (!emailMap.has(log.ipAddress)) {
          emailMap.set(log.ipAddress, new Set());
        }
        emailMap.get(log.ipAddress)!.add(log.email);

        ipAttemptCount.set(log.ipAddress, (ipAttemptCount.get(log.ipAddress) || 0) + 1);
      }
    }

    for (const [ip, emails] of emailMap) {
      if (emails.size > 1) {
        suspicious.add(ip);
      }
    }

    for (const [ip, count] of ipAttemptCount) {
      if (count >= 5) {
        suspicious.add(ip);
      }
    }

    setIpEmailMap(emailMap);
    setSuspiciousIps(suspicious);
  }, [logs]);

  const failedLogs = useMemo(() => logs.filter(l => l.status === "failed"), [logs]);

  const filteredLogs = useMemo(() => {
    let filtered = [...logs];

    if (filterStatus === "failed") {
      filtered = filtered.filter(l => l.status === "failed");
    } else if (filterStatus === "success") {
      filtered = filtered.filter(l => l.status === "success");
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.email.toLowerCase().includes(query) ||
          log.emailMasked.toLowerCase().includes(query) ||
          (log.ipAddress && log.ipAddress.toLowerCase().includes(query)) ||
          (log.failureReason && log.failureReason.toLowerCase().includes(query)) ||
          (log.location && (log.location.country.toLowerCase().includes(query) || log.location.city.toLowerCase().includes(query)))
      );
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
    const currentlyBlocked = blockedIps.filter(b => b.blockedUntil.toDate() > new Date()).length;
    const suspicious = suspiciousIps.size;
    return { total, failed, success, currentlyBlocked, suspicious };
  }, [logs, blockedIps, suspiciousIps]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const exportToCSV = () => {
    const headers = ["Date/Time", "Email", "Status", "IP Address", "Location", "Device", "Browser", "Failure Reason"];
    const csvContent = [
      headers.join(","),
      ...filteredLogs.map((log) => [
        new Date(log.timestamp).toLocaleString(),
        log.email,
        log.status.toUpperCase(),
        log.ipAddress || "Unknown",
        log.location ? `${log.location.city}, ${log.location.country}` : "Unknown",
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

  const getFailureSeverity = (reason?: string, ip?: string): "low" | "medium" | "high" => {
    if (ip && suspiciousIps.has(ip)) return "high";
    if (!reason) return "low";
    if (reason.includes("unauthorized") || reason.includes("not authorized")) return "high";
    if (reason.includes("password") || reason.includes("Incorrect")) return "medium";
    return "low";
  };

  const getRowHighlight = (ip?: string, status?: string): string => {
    if (status === "failed" && ip && suspiciousIps.has(ip)) {
      return "bg-red-50/50 dark:bg-red-900/20";
    }
    if (ip && blockedIps.some(b => b.ipAddress === ip && b.blockedUntil.toDate() > new Date())) {
      return "bg-amber-50/50 dark:bg-amber-900/10";
    }
    return "";
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
      case "high": return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "medium": return "text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200";
      default: return "text-muted-foreground bg-muted/50 border-border";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading login attempts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Login Attempts</h1>
          <p className="text-muted-foreground">
            Monitor failed login attempts and security events
          </p>
        </div>
        <div className="flex gap-2">
          {filteredLogs.length > 0 && (
            <Button
              onClick={() => setShowClearAllConfirm(true)}
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-50 dark:bg-red-900/20 dark:hover:bg-red-900/20"
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

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Attempts</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Successful</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.success}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Suspicious IPs</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.suspicious}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Blocked IPs</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.currentlyBlocked}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by email, IP, location, or reason..."
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
              <SelectItem value="failed">Failed Only</SelectItem>
              <SelectItem value="success">Successful</SelectItem>
              <SelectItem value="all">All Status</SelectItem>
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

      <div className="bg-card rounded-lg shadow-sm overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left py-4 px-4 font-semibold">Status</th>
                <th className="text-left py-4 px-4 font-semibold">Date & Time</th>
                <th className="text-left py-4 px-4 font-semibold">Email</th>
                <th className="text-left py-4 px-4 font-semibold">IP Address</th>
                <th className="text-left py-4 px-4 font-semibold">Location</th>
                <th className="text-left py-4 px-4 font-semibold">Failure Reason</th>
                <th className="text-left py-4 px-4 font-semibold">Device</th>
                <th className="text-left py-4 px-4 font-semibold">Browser</th>
                <th className="text-left py-4 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    No login attempts found
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const severity = log.status === "failed" ? getFailureSeverity(log.failureReason, log.ipAddress) : "low";
                  const rowHighlight = getRowHighlight(log.ipAddress, log.status);
                  return (
                    <tr key={log.id} className={`border-b hover:bg-muted/50 ${rowHighlight}`}>
                      <td className="py-3 px-4">
                        {log.status === "success" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-medium">
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
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{log.emailMasked || log.email}</div>
                        {log.emailMasked && log.email && log.email.includes("@") && (
                          <div className="text-xs text-muted-foreground" title={log.email}>
                            {log.email.substring(0, 3)}***@{log.email.split("@")[1]}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Globe className="w-4 h-4" />
                          <span className="font-mono text-xs">{log.ipAddress || "Unknown"}</span>
                          {log.ipAddress && suspiciousIps.has(log.ipAddress) && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {log.location ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span className="text-xs">{log.location.city}, {log.location.country}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {log.failureReason ? (
                          <span className={`text-sm px-2 py-1 rounded ${getSeverityColor(severity)}`}>
                            {log.failureReason}
                          </span>
                        ) : log.action === "logout" ? (
                          <span className="text-sm text-muted-foreground">Logged out</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Monitor className="w-4 h-4" />
                          {log.device || "Unknown"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
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
            <div className="text-sm text-muted-foreground">
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {paginatedLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p>No login attempts found</p>
          </div>
        ) : (
          paginatedLogs.map((log) => {
            const severity = log.status === "failed" ? getFailureSeverity(log.failureReason, log.ipAddress) : "low";
            return (
              <div key={log.id} className={`bg-card rounded-lg shadow-sm border p-4 ${getRowHighlight(log.ipAddress, log.status)}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{log.emailMasked || log.email}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {log.status === "success" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-medium flex-shrink-0">
                      <CheckCircle className="w-3 h-3" />
                      Success
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${getSeverityColor(severity)}`}>
                      <XCircle className="w-3 h-3" />
                      Failed
                    </span>
                  )}
                </div>

                {log.failureReason && (
                  <p className={`text-sm px-2 py-1 rounded mb-2 ${getSeverityColor(severity)}`}>
                    {log.failureReason}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    <span className="font-mono text-xs">{log.ipAddress || "Unknown"}</span>
                  </span>
                  {log.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="text-xs">{log.location.city}, {log.location.country}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Monitor className="w-3 h-3" />
                    {log.device || "Unknown"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {log.browser || "Unknown"}
                  </span>
                </div>

                {deleteConfirm === log.id ? (
                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteLog(log.id)}
                      disabled={isDeleting}
                      className="flex-1 h-11"
                    >
                      {isDeleting ? "..." : "Delete"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteConfirm(null)}
                      className="h-11 w-11 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteConfirm(log.id)}
                    className="w-full h-11 text-red-500 border-red-200 dark:border-red-800"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded"></div>
          <span>Suspicious activity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 rounded"></div>
          <span>Blocked IP</span>
        </div>
      </div>

      <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">Security Notice</h3>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Only the authorized admin email <strong>{storeProfile.authorizedAdminEmail || "not set"}</strong> can access the admin portal. 
              IPs with 5+ failed attempts in 5 minutes are blocked for 15 minutes. Email alerts are sent after 10+ failed attempts.
            </p>
          </div>
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <Trash className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold">Clear All Login Attempts</h2>
            </div>
            <p className="text-muted-foreground mb-6">
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
