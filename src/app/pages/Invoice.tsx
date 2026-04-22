import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useAdmin } from "../context/AdminContext";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  Download, Printer, ArrowLeft, FileText, CheckCircle, 
  Clock, MapPin, Phone, Mail, Package, Zap, AlertCircle 
} from "lucide-react";
import { db } from "../../firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import ContentLoader from "../components/ContentLoader";
import { cn } from "../../lib/utils";

interface InvoiceProduct {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  products: InvoiceProduct[];
  subtotal: number;
  discount: number;
  tax: number;
  deliveryCost: number;
  grandTotal: number;
  paymentStatus: "Paid" | "Pending";
  date: string;
}

interface OrderData {
  id: string;
  status: "Pending" | "Processing" | "Delivered";
  paymentStatus: "Pending" | "Paid";
  [key: string]: unknown;
}

interface RawInvoiceData {
  id: string;
  invoiceNumber?: string;
  orderId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  address?: string;
  products?: Array<{
    id?: string;
    name?: string;
    quantity?: number;
    unitPrice?: number;
    price?: number;
    total?: number;
  }>;
  subtotal?: number;
  discount?: number;
  tax?: number;
  deliveryCost?: number;
  grandTotal?: number;
  paymentStatus?: string;
  date?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export default function Invoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInvoiceById, storeProfile } = useAdmin();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string>("");

  // Real-time listener for order status - THE FIX
  useEffect(() => {
    if (!orderId) return;
    
    // Always fetch fresh order data directly from Firebase using real-time listener
    const orderRef = doc(db, "orders", orderId);
    const unsubscribe = onSnapshot(orderRef, (snap) => {
      if (snap.exists()) {
        const orderData = { id: snap.id, ...snap.data() };
        setOrder(orderData as OrderData);
      }
    });
    
    return () => unsubscribe();
  }, [orderId]);

  useEffect(() => {
    if (!id) {
      setError("Invalid invoice ID");
      setLoading(false);
      return;
    }

    const fetchInvoice = async () => {
      try {
        let foundInvoice: RawInvoiceData | null = getInvoiceById(id) || null;
        
        if (!foundInvoice) {
          const invoiceRef = doc(db, "invoices", id);
          const invoiceSnap = await getDoc(invoiceRef);
          
          if (invoiceSnap.exists()) {
            foundInvoice = { id: invoiceSnap.id, ...invoiceSnap.data() } as RawInvoiceData;
          }
        }

        if (foundInvoice) {
          const validatedInvoice: InvoiceData = {
            id: foundInvoice.id || "",
            invoiceNumber: foundInvoice.invoiceNumber || "",
            orderId: foundInvoice.orderId || "",
            customerName: foundInvoice.customerName || "Unknown",
            customerPhone: foundInvoice.customerPhone || "",
            customerEmail: foundInvoice.customerEmail,
            address: foundInvoice.address || "",
            products: (foundInvoice.products || []).map((p) => ({
              id: p.id || "",
              name: p.name || "Unknown Product",
              quantity: p.quantity || 0,
              unitPrice: p.unitPrice || p.price || 0,
              total: p.total || (p.unitPrice || p.price || 0) * (p.quantity || 1),
            })),
            subtotal: foundInvoice.subtotal || 0,
            discount: foundInvoice.discount || 0,
            tax: foundInvoice.tax || 0,
            deliveryCost: foundInvoice.deliveryCost || 0,
            grandTotal: foundInvoice.grandTotal || 0,
            paymentStatus: foundInvoice.paymentStatus === "Paid" ? "Paid" : "Pending",
            date: foundInvoice.date || foundInvoice.createdAt || new Date().toISOString(),
          };
          setInvoice(validatedInvoice);
          
          // Set orderId to trigger real-time listener
          if (foundInvoice.orderId) {
            setOrderId(foundInvoice.orderId);
          }
        } else {
          setError("Invoice not found");
        }
      } catch (err) {
        console.error("Error loading invoice:", err);
        setError("Failed to load invoice");
      }
      setLoading(false);
    };

    fetchInvoice();
  }, [id, getInvoiceById]);

  const formatPrice = (price: number) => {
    return `Rs. ${(price || 0).toLocaleString()}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "long", 
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "Invalid Date";
    }
  };

  const downloadPDF = () => {
    if (!invoice) return;

    setIsDownloading(true);
    
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      
      const goldColor = [212, 175, 55];
      const darkColor = [26, 26, 26];
      const lightGray = [245, 245, 245];
      const grayColor = [100, 100, 100];
      const white = [255, 255, 255];
      
      // ============ WATERMARK ============
      doc.saveGraphicsState();
      doc.setTextColor(230, 230, 230);
      doc.setFontSize(80);
      doc.setFont("helvetica", "bold");
      doc.text(`${storeProfile.storeName}`, pageWidth / 2, pageHeight / 2, {
        angle: 45,
        align: "center",
      });
      doc.restoreGraphicsState();
      
      // ============ HEADER ============
      doc.setFillColor(...darkColor);
      doc.rect(0, 0, pageWidth, 38, "F");
      
      doc.setFillColor(...goldColor);
      doc.rect(0, 38, pageWidth, 2, "F");
      
      // Company name
      doc.setTextColor(...goldColor);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE", margin, 14);
      
      doc.setTextColor(...white);
      doc.setFontSize(20);
      doc.text(`${storeProfile.storeName}`, margin, 26);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...goldColor);
      doc.text(`${storeProfile.storeNameAccent}`, margin, 34);
      
      // Company contact (right side)
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(9);
      const rightX = pageWidth - margin;
      const contactLines = [
        `${storeProfile.addressStreet}`,
        `${storeProfile.addressCity}`,
        `Phone: ${storeProfile.phone}`,
        `${storeProfile.email}`
      ];
      contactLines.forEach((line, i) => {
        doc.text(line, rightX, 12 + (i * 6), { align: "right" });
      });
      
      // ============ INFO BOXES ============
      let yPos = 52;
      const leftBoxWidth = 85;
      const boxHeight = 50;
      
      // Left box - Invoice Details
      doc.setFillColor(...lightGray);
      doc.roundedRect(margin, yPos, leftBoxWidth, boxHeight, 3, 3, "F");
      
      doc.setTextColor(...darkColor);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE DETAILS", margin + 5, yPos + 10);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...grayColor);
      doc.text("Invoice #:", margin + 5, yPos + 20);
      doc.setTextColor(...darkColor);
      doc.setFont("helvetica", "bold");
      doc.text(invoice.invoiceNumber, margin + 35, yPos + 20);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...grayColor);
      doc.text("Date:", margin + 5, yPos + 28);
      doc.setTextColor(...darkColor);
      doc.setFont("helvetica", "bold");
      doc.text(formatDate(invoice.date).split(",")[0], margin + 35, yPos + 28);
      
      const paymentStatusForPDF = order?.paymentStatus || invoice.paymentStatus;
      const statusColor = paymentStatusForPDF === "Paid" ? [34, 139, 34] : [255, 140, 0];
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...grayColor);
      doc.text("Payment:", margin + 5, yPos + 36);
      
      const statusText = paymentStatusForPDF === "Paid" ? "PAID" : "PENDING";
      doc.setFillColor(...statusColor);
      doc.roundedRect(margin + 30, yPos + 31, 25, 6, 2, 2, "F");
      doc.setTextColor(...white);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(statusText, margin + 42.5, yPos + 36, { align: "center" });
      
      // Right box - Bill To
      const billToX = margin + leftBoxWidth + 5;
      const billToWidth = contentWidth - leftBoxWidth - 5;
      
      doc.setFillColor(...lightGray);
      doc.roundedRect(billToX, yPos, billToWidth, boxHeight, 3, 3, "F");
      
      doc.setTextColor(...darkColor);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("BILL TO", billToX + 5, yPos + 10);
      
      // Customer info with proper text wrapping
      doc.setFontSize(10);
      doc.setTextColor(...darkColor);
      doc.setFont("helvetica", "bold");
      const customerName = invoice.customerName || "N/A";
      doc.text(customerName, billToX + 5, yPos + 20, { maxWidth: billToWidth - 10 });
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...grayColor);
      const phoneLines = doc.splitTextToSize(invoice.customerPhone || "N/A", billToWidth - 10);
      doc.text(phoneLines, billToX + 5, yPos + 28);
      
      if (invoice.customerEmail) {
        const emailLines = doc.splitTextToSize(invoice.customerEmail, billToWidth - 10);
        doc.text(emailLines, billToX + 5, yPos + 35);
      }
      
      // Address with text wrapping
      const address = invoice.address || "N/A";
      const addressLines = doc.splitTextToSize(address, billToWidth - 10);
      doc.text(addressLines, billToX + 5, yPos + (invoice.customerEmail ? 42 : 38));
      
      // ============ PRODUCTS TABLE ============
      yPos = 115;
      const headerHeight = 10;
      
      // Table header
      doc.setFillColor(...darkColor);
      doc.rect(margin, yPos, contentWidth, headerHeight, "F");
      
      doc.setTextColor(...white);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      
      const colProduct = margin + 5;
      const colQty = 145;
      const colPrice = 165;
      const colTotal = pageWidth - margin;
      const colPriceWidth = 30;
      const colQtyWidth = 15;
      
      doc.text("PRODUCT", colProduct, yPos + 7);
      doc.text("QTY", colQty, yPos + 7, { align: "center" });
      doc.text("PRICE", colPrice, yPos + 7, { align: "right" });
      doc.text("TOTAL", colTotal, yPos + 7, { align: "right" });
      
      yPos += headerHeight;
      
      // Table rows
      let maxYPos = yPos;
      invoice.products.forEach((product, index) => {
        const isEven = index % 2 === 0;
        doc.setFillColor(...(isEven ? white : [248, 248, 248]));
        
        const productName = product.name || "Unknown Product";
        const nameLines = doc.splitTextToSize(productName, colQty - colProduct - 5);
        const rowHeight = Math.max(12, nameLines.length * 5 + 6);
        
        doc.rect(margin, yPos, contentWidth, rowHeight, "F");
        
        doc.setTextColor(...darkColor);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(nameLines, colProduct, yPos + 5);
        
        doc.text(String(product.quantity || 0), colQty, yPos + 5, { align: "center" });
        
        doc.text(formatPrice(product.unitPrice || 0), colPrice + colPriceWidth, yPos + 5, { align: "right" });
        
        doc.setFont("helvetica", "bold");
        doc.text(formatPrice(product.total || 0), colTotal, yPos + 5, { align: "right" });
        
        yPos += rowHeight;
        if (yPos > maxYPos) maxYPos = yPos;
      });
      
      yPos = maxYPos;
      
      // ============ TOTALS SECTION ============
      yPos += 10;
      
      // Gold divider
      doc.setDrawColor(...goldColor);
      doc.setLineWidth(1);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      
      yPos += 10;
      
      // Totals - aligned to right
      const totalsX = pageWidth - margin - 80;
      const totalsWidth = 80;
      const totalRowHeight = 9;
      
      const subtotal = invoice.subtotal || 0;
      const delivery = invoice.deliveryCost || 0;
      const discount = invoice.discount || 0;
      const grandTotal = invoice.grandTotal || 0;
      
      // Subtotal
      doc.setFillColor(...lightGray);
      doc.roundedRect(totalsX, yPos, totalsWidth, totalRowHeight, 2, 2, "F");
      doc.setTextColor(...grayColor);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Subtotal", totalsX + 4, yPos + 6);
      doc.setTextColor(...darkColor);
      doc.setFont("helvetica", "bold");
      doc.text(formatPrice(subtotal), pageWidth - margin, yPos + 6, { align: "right" });
      yPos += totalRowHeight + 2;
      
      // Delivery
      doc.setFillColor(...lightGray);
      doc.roundedRect(totalsX, yPos, totalsWidth, totalRowHeight, 2, 2, "F");
      doc.setTextColor(...grayColor);
      doc.setFont("helvetica", "normal");
      doc.text("Delivery", totalsX + 4, yPos + 6);
      doc.setTextColor(...darkColor);
      doc.setFont("helvetica", "bold");
      doc.text(formatPrice(delivery), pageWidth - margin, yPos + 6, { align: "right" });
      yPos += totalRowHeight + 2;
      
      // Discount
      if (discount > 0) {
        doc.setFillColor(...lightGray);
        doc.roundedRect(totalsX, yPos, totalsWidth, totalRowHeight, 2, 2, "F");
        doc.setTextColor(34, 139, 34);
        doc.setFont("helvetica", "normal");
        doc.text("Discount", totalsX + 4, yPos + 6);
        doc.setFont("helvetica", "bold");
        doc.text(`-${formatPrice(discount)}`, pageWidth - margin, yPos + 6, { align: "right" });
        yPos += totalRowHeight + 2;
      }
      
      // Divider
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.5);
      doc.line(totalsX, yPos, pageWidth - margin, yPos);
      yPos += 6;
      
      // Grand Total
      doc.setFillColor(...goldColor);
      doc.roundedRect(totalsX, yPos, totalsWidth, 14, 3, 3, "F");
      doc.setTextColor(...darkColor);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL", totalsX + 4, yPos + 10);
      doc.text(formatPrice(grandTotal), pageWidth - margin, yPos + 10, { align: "right" });
      
      // ============ FOOTER ============
      const footerY = pageHeight - 18;
      
      doc.setDrawColor(...goldColor);
      doc.setLineWidth(1);
      doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8);
      
      doc.setTextColor(...grayColor);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Official invoice from ${storeProfile.storeName} ${storeProfile.storeNameAccent}`,
        pageWidth / 2,
        footerY,
        { align: "center" }
      );
      
      doc.setFont("helvetica", "normal");
      doc.text(
        `${storeProfile.addressCity}, Sri Lanka | ${storeProfile.phone}`,
        pageWidth / 2,
        footerY + 5,
        { align: "center" }
      );
      
      doc.setFontSize(7);
      doc.setTextColor(180, 180, 180);
      doc.text(
        `Generated: ${new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })}`,
        pageWidth / 2,
        footerY + 10,
        { align: "center" }
      );
      
      doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
      toast.success("Invoice downloaded!");
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  const printInvoice = () => {
    window.print();
  };

  if (loading) {
    return <ContentLoader />;
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <AlertCircle className="w-24 h-24 mx-auto text-red-400 mb-6" />
          <h2 className="text-2xl font-bold mb-4">{error || "Invoice Not Found"}</h2>
          <p className="text-gray-600 mb-8">
            {error === "Invoice not found" 
              ? "The invoice you're looking for doesn't exist or may have been removed."
              : "Something went wrong while loading the invoice."}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate("/")} className="bg-black hover:bg-[#D4AF37] text-white">
              Go to Home
            </Button>
            <Button onClick={() => navigate(-1)} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            size="icon"
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">Invoice Details</h1>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden print:shadow-none">
            <div className="relative p-6 md:p-10 lg:p-12 overflow-x-hidden">
              <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center transform rotate-[-30deg] scale-[3]">
                    <Zap className="w-32 h-32 text-[#D4AF37] mx-auto" />
                    <p className="text-lg font-bold text-gray-600 mt-4 whitespace-nowrap overflow-hidden text-ellipsis">
                      {storeProfile.storeName} {storeProfile.storeNameAccent} – Official Invoice
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 mb-8">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="w-10 h-10 text-[#D4AF37] shrink-0" />
                      <div className="min-w-0">
                        <h2 className="text-2xl font-bold break-words">
                          {storeProfile.storeName} <span className="text-[#D4AF37]">{storeProfile.storeNameAccent}</span>
                        </h2>
                        <p className="text-gray-500 text-sm">Premium Lighting & Bathware</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1 mt-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="break-words">{storeProfile.addressStreet}, {storeProfile.addressCity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 shrink-0" />
                        <span>{storeProfile.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 shrink-0" />
                        <span className="break-all">{storeProfile.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <h3 className="text-3xl font-bold text-[#D4AF37] mb-2">INVOICE</h3>
                    <p className="text-lg font-semibold break-all">{invoice.invoiceNumber}</p>
                    
                    {/* Payment Status - Read from Order (Primary Source) */}
                    <div className="mt-3 flex items-center gap-2 justify-end">
                      <span className="text-xs text-gray-500">Payment:</span>
                      {order?.paymentStatus === "Paid" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold shrink-0">
                          <CheckCircle className="w-4 h-4" />
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white rounded-full text-sm font-semibold shrink-0">
                          <Clock className="w-4 h-4" />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
                  <div className="bg-gray-50 p-4 rounded-lg min-w-0">
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      Order Information
                    </h4>
                    <p className="text-sm text-gray-600 break-words">
                      <strong>Date:</strong> {formatDate(invoice.date)}
                    </p>
                    {invoice.orderId && (
                      <p className="text-sm text-gray-600 mt-1 break-all">
                        <strong>Order ID:</strong> #{invoice.orderId.slice(-8)}
                      </p>
                    )}
                    {order && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600">
                          <strong>Order Status:</strong>
                        </p>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold mt-1 shrink-0 ${
                          order.status === "Delivered" ? "bg-green-100 text-green-700" :
                          order.status === "Processing" ? "bg-blue-100 text-blue-700" :
                          "bg-orange-100 text-orange-700"
                        }`}>
                          {order.status === "Delivered" && <CheckCircle className="w-4 h-4" />}
                          {order.status === "Processing" && <Zap className="w-4 h-4" />}
                          {order.status === "Pending" && <Clock className="w-4 h-4" />}
                          {order.status}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg min-w-0">
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <span className="text-[#D4AF37] shrink-0">@</span>
                      Customer Details
                    </h4>
                    <p className="text-sm font-semibold break-words">{invoice.customerName}</p>
                    <p className="text-sm text-gray-600 break-words">{invoice.customerPhone}</p>
                    {invoice.customerEmail && (
                      <p className="text-sm text-gray-600 break-all">{invoice.customerEmail}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1 break-words leading-relaxed">{invoice.address}</p>
                  </div>
                </div>

                <div className="overflow-x-auto mb-8">
                  <table className="w-full min-w-[500px] md:table-fixed">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-3 py-3 text-left text-sm font-bold min-w-0">Product</th>
                        <th className="px-3 py-3 text-center text-sm font-bold w-16">Qty</th>
                        <th className="px-3 py-3 text-right text-sm font-bold w-24 md:w-28">Unit Price</th>
                        <th className="px-3 py-3 text-right text-sm font-bold w-24 md:w-28">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.products.map((product, index) => (
                        <tr key={product.id || index} className="border-b">
                          <td className="px-3 py-3 text-sm whitespace-normal break-normal">{product.name}</td>
                          <td className="px-3 py-3 text-sm text-center">{product.quantity}</td>
                          <td className="px-3 py-3 text-sm text-right whitespace-nowrap">{formatPrice(product.unitPrice)}</td>
                          <td className="px-3 py-3 text-sm text-right font-semibold whitespace-nowrap">
                            {formatPrice(product.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <div className="bg-gray-50 p-4 rounded-lg min-w-[280px] max-w-full">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">{formatPrice(invoice.subtotal)}</span>
                      </div>
                      {(invoice.discount || 0) > 0 && (
                        <div className="flex justify-between items-center text-sm text-green-600">
                          <span>Discount</span>
                          <span className="font-medium">-{formatPrice(invoice.discount)}</span>
                        </div>
                      )}
                      {(invoice.tax || 0) > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Tax</span>
                          <span className="font-medium">{formatPrice(invoice.tax)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Delivery</span>
                        <span className="font-medium">{formatPrice(invoice.deliveryCost)}</span>
                      </div>
                      <div className="flex justify-between items-center text-base font-bold border-t border-gray-300 pt-3 mt-2">
                        <span>Grand Total</span>
                        <span className="text-[#D4AF37] text-lg">{formatPrice(invoice.grandTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t text-center">
                  <p className="text-sm text-gray-500 flex items-center justify-center gap-2 flex-wrap">
                    <Zap className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    <span className="break-words">{storeProfile.storeName} {storeProfile.storeNameAccent} – Official Invoice</span>
                    <Zap className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  </p>
                  <p className="text-xs text-gray-400 mt-2 break-words">
                    Powered by {storeProfile.storeName} {storeProfile.storeNameAccent} | {storeProfile.addressCity}, Sri Lanka
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-8 py-4 flex flex-wrap gap-3 justify-center print:hidden">
              <Button
                onClick={downloadPDF}
                disabled={isDownloading}
                className="bg-[#D4AF37] hover:bg-[#b8962f] text-white"
              >
                <Download className={cn("w-4 h-4 mr-2", isDownloading && "animate-spin")} />
                {isDownloading ? "Generating..." : "Download PDF"}
              </Button>
              <Button
                onClick={printInvoice}
                variant="outline"
                className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          /* Invoice specific print styles */
          .invoice-print-area {
            visibility: visible !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          /* Ensure table doesn't overflow */
          table {
            table-layout: fixed;
            word-wrap: break-word;
          }
          /* Ensure text wraps properly */
          * {
            max-width: 100% !important;
            overflow-wrap: break-word !important;
            word-wrap: break-word !important;
          }
        }
      `}</style>
    </div>
  );
}
