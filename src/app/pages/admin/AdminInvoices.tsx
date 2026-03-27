import { useState, useEffect, useMemo, useRef } from "react";
import { useAdmin } from "../../context/AdminContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "../../components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../components/ui/dialog";
import { 
  FileText, Search, Filter, Download, Eye, CheckCircle, 
  Clock, X, Calendar, User, Phone, Mail, MapPin, Package,
  QrCode, ChevronLeft, ChevronRight, FileSpreadsheet, AlertCircle
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { format, startOfDay, endOfDay } from "date-fns";

export default function AdminInvoices() {
  const { invoices, updateInvoicePaymentStatus, orders, createInvoice, storeProfile } = useAdmin();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Paid" | "Pending">("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showFilters, setShowFilters] = useState(false);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    if (invoices.length === 0 || orders.length === 0) return;
    
    hasInitializedRef.current = true;
    
    const generateMissingInvoices = async () => {
      const currentInvoices = invoices;
      
      for (const order of orders) {
        if (!order || !order.id) continue;
        
        const hasInvoice = currentInvoices.some(inv => inv && inv.orderId === order.id);
        if (!hasInvoice) {
          try {
            await createInvoice(order, undefined, true);
          } catch (e) {
            console.error("Failed to create invoice for order:", order.id, e);
          }
        }
      }
    };
    
    generateMissingInvoices();
  }, [orders.length, invoices.length, createInvoice]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      if (!invoice) return false;
      
      const matchesSearch =
        (invoice.invoiceNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.customerPhone || "").includes(searchTerm);

      const matchesStatus = statusFilter === "all" || invoice.paymentStatus === statusFilter;

      let matchesDate = true;
      if (dateRange.start) {
        const invoiceDate = new Date(invoice.date || Date.now());
        const start = startOfDay(new Date(dateRange.start));
        matchesDate = invoiceDate >= start;
      }
      if (dateRange.end) {
        const invoiceDate = new Date(invoice.date || Date.now());
        const end = endOfDay(new Date(dateRange.end));
        matchesDate = matchesDate && invoiceDate <= end;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [invoices, searchTerm, statusFilter, dateRange]);

  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(start, start + itemsPerPage);
  }, [filteredInvoices, currentPage]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  const generatePDF = (invoice: any, single: boolean = true) => {
    try {
      if (!invoice) {
        toast.error("Invoice data is missing");
        return;
      }
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      const goldColor = [212, 175, 55];
      const darkColor = [26, 26, 26];
      const grayColor = [100, 100, 100];
      
      const safeInvoice = {
        invoiceNumber: invoice.invoiceNumber || "N/A",
        date: invoice.date || new Date().toISOString(),
        paymentStatus: invoice.paymentStatus || "Pending",
        customerName: invoice.customerName || "Unknown",
        customerPhone: invoice.customerPhone || "",
        customerEmail: invoice.customerEmail || "",
        address: invoice.address || "",
        products: (invoice.products || []).map((p: any) => ({
          name: p.name || "Unknown",
          quantity: p.quantity || 0,
          unitPrice: p.unitPrice || p.price || 0,
          total: p.total || ((p.unitPrice || p.price || 0) * (p.quantity || 1)),
        })),
        subtotal: invoice.subtotal || 0,
        discount: invoice.discount || 0,
        deliveryCost: invoice.deliveryCost || 0,
        grandTotal: invoice.grandTotal || 0,
      };
    
    doc.setFillColor(...darkColor);
    doc.rect(0, 0, pageWidth, 45, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", pageWidth / 2, 22, { align: "center" });
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(`${storeProfile.storeName} ${storeProfile.storeNameAccent}`, pageWidth / 2, 33, { align: "center" });
    
    doc.setTextColor(...goldColor);
    doc.setFontSize(10);
    doc.text(`${storeProfile.addressStreet}, ${storeProfile.addressCity}`, pageWidth / 2, 40, { align: "center" });
    
    doc.setFillColor(...goldColor);
    doc.rect(0, 45, pageWidth, 3, "F");
    
    doc.setTextColor(...darkColor);
    doc.setFontSize(9);
    doc.text(`Phone: ${storeProfile.phone}  |  Email: ${storeProfile.email}`, pageWidth / 2, 54, { align: "center" });
    
    let yPos = 65;
    
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(10, yPos, 90, 35, 2, 2, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Invoice Details", 15, yPos + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Invoice #: ${safeInvoice.invoiceNumber}`, 15, yPos + 15);
    doc.text(`Date: ${format(new Date(safeInvoice.date), "dd MMM yyyy")}`, 15, yPos + 22);
    doc.text(`Time: ${format(new Date(safeInvoice.date), "HH:mm")}`, 15, yPos + 29);
    
    const statusColor = safeInvoice.paymentStatus === "Paid" ? [34, 139, 34] : [255, 165, 0];
    doc.setTextColor(...statusColor);
    doc.setFont("helvetica", "bold");
    doc.text(`Status: ${safeInvoice.paymentStatus}`, 15, yPos + 38);
    
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(105, yPos, 90, 35, 2, 2, "F");
    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Bill To", 110, yPos + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(safeInvoice.customerName, 110, yPos + 15);
    doc.text(safeInvoice.customerPhone, 110, yPos + 22);
    if (safeInvoice.customerEmail) {
      doc.text(safeInvoice.customerEmail, 110, yPos + 29);
    }
    
    const addressLines = doc.splitTextToSize(safeInvoice.address, 80);
    doc.text(addressLines[0] || "", 110, yPos + 36);
    
    yPos = 110;
    
    const tableData = safeInvoice.products.map((product: any) => [
      product.name,
      product.quantity.toString(),
      `Rs. ${product.unitPrice.toLocaleString()}`,
      `Rs. ${product.total.toLocaleString()}`,
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [["Product Name", "Qty", "Unit Price", "Total"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: darkColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
        halign: "center",
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 20, halign: "center" },
        2: { cellWidth: 35, halign: "right" },
        3: { cellWidth: 35, halign: "right" },
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      margin: { left: 15, right: 15 },
    });
    
    yPos = (doc as any).lastAutoTable?.finalY + 10 || 170;
    
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(105, yPos - 5, 90, 50, 2, 2, "F");
    
    doc.setFontSize(10);
    doc.setTextColor(...grayColor);
    doc.text("Subtotal", 190, yPos + 5, { align: "right" });
    doc.setTextColor(...darkColor);
    doc.setFont("helvetica", "bold");
    doc.text(`Rs. ${safeInvoice.subtotal.toLocaleString()}`, 190, yPos + 12, { align: "right" });
    
    if (safeInvoice.discount > 0) {
      doc.setTextColor(...grayColor);
      doc.setFont("helvetica", "normal");
      doc.text("Discount", 190, yPos + 20, { align: "right" });
      doc.setTextColor(34, 139, 34);
      doc.text(`-Rs. ${safeInvoice.discount.toLocaleString()}`, 190, yPos + 27, { align: "right" });
    }
    
    doc.setTextColor(...grayColor);
    doc.setFont("helvetica", "normal");
    doc.text("Delivery", 190, yPos + (safeInvoice.discount > 0 ? 35 : 20), { align: "right" });
    doc.setTextColor(...darkColor);
    doc.setFont("helvetica", "bold");
    doc.text(`Rs. ${safeInvoice.deliveryCost.toLocaleString()}`, 190, yPos + (safeInvoice.discount > 0 ? 42 : 27), { align: "right" });
    
    yPos = yPos + (safeInvoice.discount > 0 ? 50 : 35);
    
    doc.setFillColor(...goldColor);
    doc.roundedRect(105, yPos, 90, 18, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", 110, yPos + 7);
    doc.text(`Rs. ${safeInvoice.grandTotal.toLocaleString()}`, 190, yPos + 13, { align: "right" });
    
    doc.setDrawColor(...goldColor);
    doc.setLineWidth(0.5);
    doc.line(15, 260, pageWidth - 15, 260);
    
    doc.setTextColor(...grayColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("This is an electronically generated invoice.", pageWidth / 2, 268, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text(`${storeProfile.storeName} ${storeProfile.storeNameAccent} - Official Invoice`, pageWidth / 2, 275, { align: "center" });
    doc.text(`${storeProfile.addressCity}, Sri Lanka`, pageWidth / 2, 282, { align: "center" });
    
    if (single) {
      doc.save(`Invoice-${safeInvoice.invoiceNumber}.pdf`);
      toast.success("Invoice downloaded!");
    } else {
      return doc;
    }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
      if (single) {
        return;
      }
      return null;
    }
  };

  const exportCSV = () => {
    try {
      const headers = ["Invoice Number", "Customer Name", "Phone", "Date", "Total", "Payment Status"];
      const rows = filteredInvoices.map((inv) => [
        inv.invoiceNumber || "N/A",
        inv.customerName || "Unknown",
        inv.customerPhone || "",
        format(new Date(inv.date || Date.now()), "yyyy-MM-dd HH:mm"),
        (inv.grandTotal || 0).toString(),
        inv.paymentStatus || "Pending",
      ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `invoices-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("CSV exported!");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV");
    }
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Invoices Report", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${format(new Date(), "PPP")}`, 105, 28, { align: "center" });
    doc.text(`Total Invoices: ${filteredInvoices.length}`, 105, 34, { align: "center" });
    
    const tableData = filteredInvoices.map((inv) => [
      inv.invoiceNumber,
      inv.customerName,
      format(new Date(inv.date), "dd/MM/yyyy"),
      `Rs. ${inv.grandTotal.toLocaleString()}`,
      inv.paymentStatus,
    ]);
    
    autoTable(doc, {
      startY: 42,
      head: [["Invoice #", "Customer", "Date", "Total", "Status"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [44, 62, 80] },
      styles: { fontSize: 8 },
    });
    
    doc.save(`invoices-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("PDF report exported!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF report");
    }
  };

  const viewInvoice = (invoice: any) => {
    if (!invoice || !invoice.id) {
      toast.error("Invalid invoice data");
      return;
    }
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  const togglePaymentStatus = (invoice: any) => {
    if (!invoice || !invoice.id) {
      toast.error("Invalid invoice data");
      return;
    }
    const newStatus = invoice.paymentStatus === "Paid" ? "Pending" : "Paid";
    updateInvoicePaymentStatus(invoice.id, newStatus);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateRange({ start: "", end: "" });
  };

  const hasFilters = searchTerm || statusFilter !== "all" || dateRange.start || dateRange.end;

  const totalRevenue = filteredInvoices
    .filter((inv) => inv && inv.paymentStatus === "Paid")
    .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

  const pendingAmount = filteredInvoices
    .filter((inv) => inv && inv.paymentStatus === "Pending")
    .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8 text-[#D4AF37]" />
            Invoices
          </h1>
          <p className="text-gray-500 mt-1">Manage and track all invoices</p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={exportCSV}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={exportPDF}
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Total Invoices</p>
          <p className="text-2xl font-bold">{filteredInvoices.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Total Revenue (Paid)</p>
          <p className="text-2xl font-bold text-green-600">Rs. {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Pending Amount</p>
          <p className="text-2xl font-bold text-yellow-600">Rs. {pendingAmount.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by invoice number, customer name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className={showFilters ? "bg-[#D4AF37]/10 border-[#D4AF37]" : ""}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          {hasFilters && (
            <Button onClick={clearFilters} variant="ghost" size="icon">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border rounded px-3 py-1.5 text-sm"
              >
                <option value="all">All</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">From:</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="border rounded px-3 py-1.5 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">To:</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="border rounded px-3 py-1.5 text-sm"
              />
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-semibold">{invoice.invoiceNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{invoice.customerName}</p>
                        <p className="text-sm text-gray-500">{invoice.customerPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(invoice.date), "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-right font-semibold">
                      Rs. {invoice.grandTotal.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          invoice.paymentStatus === "Paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }
                      >
                        {invoice.paymentStatus === "Paid" ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {invoice.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => viewInvoice(invoice)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => generatePDF(invoice)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => togglePaymentStatus(invoice)}
                          className={
                            invoice.paymentStatus === "Paid"
                              ? "text-yellow-600 hover:text-yellow-700"
                              : "text-green-600 hover:text-green-700"
                          }
                        >
                          {invoice.paymentStatus === "Paid" ? (
                            <Clock className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of{" "}
              {filteredInvoices.length} invoices
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-4 py-2 text-sm">
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

      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#D4AF37]" />
              Invoice {selectedInvoice?.invoiceNumber || "N/A"}
            </DialogTitle>
          </DialogHeader>

          {selectedInvoice ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Customer</p>
                  <p className="font-semibold flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {selectedInvoice.customerName || "Unknown"}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {selectedInvoice.customerPhone || "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {selectedInvoice.customerEmail || "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Date</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(selectedInvoice.date || Date.now()), "dd MMM yyyy HH:mm")}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
                <p className="font-semibold flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {selectedInvoice.address || "N/A"}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  Products
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left">Product</th>
                        <th className="px-3 py-2 text-center">Qty</th>
                        <th className="px-3 py-2 text-right">Price</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedInvoice.products || []).map((product: any, i: number) => (
                        <tr key={product.id || i} className="border-t">
                          <td className="px-3 py-2">{product.name || "Unknown"}</td>
                          <td className="px-3 py-2 text-center">{product.quantity || 0}</td>
                          <td className="px-3 py-2 text-right">Rs. {(product.unitPrice || 0).toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">Rs. {(product.total || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">QR Code</p>
                  <div className="bg-white p-2 rounded inline-block">
                    <QRCodeSVG
                      value={`https://lightning-bathware.vercel.app/#/verify/${selectedInvoice.id}`}
                      size={80}
                      level="H"
                    />
                  </div>
                  <Button
                    onClick={() => window.open(`https://lightning-bathware.vercel.app/#/verify/${selectedInvoice.id}`, "_blank")}
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white text-xs"
                  >
                    Open Verification
                  </Button>
                </div>
                <div className="text-right space-y-1">
                  <p>Subtotal: Rs. {(selectedInvoice.subtotal || 0).toLocaleString()}</p>
                  {(selectedInvoice.discount || 0) > 0 && (
                    <p className="text-green-600">Discount: -Rs. {(selectedInvoice.discount || 0).toLocaleString()}</p>
                  )}
                  <p>Delivery: Rs. {(selectedInvoice.deliveryCost || 0).toLocaleString()}</p>
                  <p className="text-xl font-bold text-[#D4AF37]">
                    Total: Rs. {(selectedInvoice.grandTotal || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Badge
                  className={
                    selectedInvoice.paymentStatus === "Paid"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }
                >
                  {selectedInvoice.paymentStatus || "Pending"}
                </Badge>
                <div className="flex gap-2">
                  <Button
                    onClick={() => generatePDF(selectedInvoice)}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button
                    onClick={() => togglePaymentStatus(selectedInvoice)}
                    size="sm"
                    className={
                      selectedInvoice.paymentStatus === "Paid"
                        ? "bg-yellow-600 hover:bg-yellow-700"
                        : "bg-green-600 hover:bg-green-700"
                    }
                  >
                    {selectedInvoice.paymentStatus === "Paid" ? "Mark Pending" : "Mark Paid"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <p>No invoice data available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
