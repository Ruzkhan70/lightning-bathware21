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
import { doc, getDoc } from "firebase/firestore";
import ContentLoader from "../components/ContentLoader";

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
  [key: string]: any;
}

export default function Invoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInvoiceById, storeProfile, invoices, orders } = useAdmin();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Separate effect to update order status when orders change
  useEffect(() => {
    if (!invoice?.orderId || !orders.length) return;
    
    const updatedOrder = orders.find(o => o.id === invoice.orderId);
    if (updatedOrder && updatedOrder.id !== order?.id) {
      setOrder(updatedOrder as OrderData);
    }
  }, [orders, invoice?.orderId]);

  useEffect(() => {
    if (!id) {
      setError("Invalid invoice ID");
      setLoading(false);
      return;
    }

    const fetchInvoice = async () => {
      try {
        let foundInvoice = getInvoiceById(id);
        
        if (!foundInvoice) {
          console.log("Invoice not in local state, fetching from Firebase:", id);
          const invoiceRef = doc(db, "invoices", id);
          const invoiceSnap = await getDoc(invoiceRef);
          
          if (invoiceSnap.exists()) {
            foundInvoice = { id: invoiceSnap.id, ...invoiceSnap.data() } as any;
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
            products: (foundInvoice.products || []).map((p: any) => ({
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
          
          // Fetch the associated order for live status
          const orderId = foundInvoice.orderId;
          console.log("Fetching order for invoice, orderId:", orderId);
          if (orderId) {
            // First check local orders
            const localOrder = orders.find(o => o.id === orderId);
            if (localOrder) {
              console.log("Found order in local state:", localOrder.status);
              setOrder(localOrder as OrderData);
            } else {
              // Fetch from Firebase
              console.log("Fetching order from Firebase:", orderId);
              const orderRef = doc(db, "orders", orderId);
              const orderSnap = await getDoc(orderRef);
              if (orderSnap.exists()) {
                const orderData = { id: orderSnap.id, ...orderSnap.data() } as OrderData;
                console.log("Found order in Firebase:", orderData.status);
                setOrder(orderData);
              } else {
                console.log("Order not found in Firebase:", orderId);
              }
            }
          } else {
            console.log("No orderId in invoice");
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
  }, [id, invoices, orders, getInvoiceById]);

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

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      
      // Colors
      const goldColor = [212, 175, 55];
      const darkColor = [26, 26, 26];
      const lightGray = [245, 245, 245];
      const grayColor = [100, 100, 100];
      const white = [255, 255, 255];
      
      // ============ WATERMARK (Background) ============
      doc.saveGraphicsState();
      doc.setTextColor(230, 230, 230);
      doc.setFontSize(80);
      doc.setFont("helvetica", "bold");
      doc.text(`${storeProfile.storeName}`, pageWidth / 2, pageHeight / 2, {
        angle: 45,
        align: "center",
      });
      doc.restoreGraphicsState();
      
      // ============ HEADER SECTION ============
      // Dark background header
      doc.setFillColor(...darkColor);
      doc.rect(0, 0, pageWidth, 38, "F");
      
      // Gold accent line
      doc.setFillColor(...goldColor);
      doc.rect(0, 38, pageWidth, 2, "F");
      
      // Left side - Invoice label and Company info
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
      
      // Right side - Company contact details
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      const rightX = pageWidth - margin;
      const contactLines = [
        `${storeProfile.addressStreet}`,
        `${storeProfile.addressCity}`,
        `Phone: ${storeProfile.phone}`,
        `${storeProfile.email}`
      ];
      
      contactLines.forEach((line, i) => {
        doc.text(line, rightX, 12 + (i * 7), { align: "right" });
      });
      
      // ============ INVOICE & CUSTOMER SECTION ============
      let yPos = 52;
      const boxHeight = 45;
      
      // Invoice details box (left) - width: 85mm
      doc.setFillColor(...lightGray);
      doc.roundedRect(margin, yPos, 85, boxHeight, 3, 3, "F");
      
      // Invoice Details Header
      doc.setTextColor(...darkColor);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE DETAILS", margin + 5, yPos + 10);
      
      // Invoice number row
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...grayColor);
      doc.text("Invoice #:", margin + 5, yPos + 22);
      
      doc.setTextColor(...darkColor);
      doc.setFont("helvetica", "bold");
      doc.text(invoice.invoiceNumber, margin + 35, yPos + 22);
      
      // Date row
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...grayColor);
      doc.text("Date:", margin + 5, yPos + 32);
      
      doc.setTextColor(...darkColor);
      doc.setFont("helvetica", "bold");
      doc.text(formatDate(invoice.date).split(",")[0], margin + 35, yPos + 32);
      
      // Payment status row
      const paymentStatusForPDF = order?.paymentStatus || invoice.paymentStatus;
      const statusColor = paymentStatusForPDF === "Paid" ? [34, 139, 34] : [255, 140, 0];
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...grayColor);
      doc.text("Payment:", margin + 5, yPos + 42);
      
      // Status badge
      const statusText = paymentStatusForPDF === "Paid" ? "PAID" : "PENDING";
      doc.setFillColor(...statusColor);
      doc.roundedRect(margin + 30, yPos + 37, 25, 6, 2, 2, "F");
      doc.setTextColor(...white);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(statusText, margin + 42.5, yPos + 42, { align: "center" });
      
      // BILL TO box (right) - width: remaining space
      const billToX = margin + 90;
      const billToWidth = contentWidth - 85;
      
      doc.setFillColor(...lightGray);
      doc.roundedRect(billToX, yPos, billToWidth, boxHeight, 3, 3, "F");
      
      // Bill To Header
      doc.setTextColor(...darkColor);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("BILL TO", billToX + 5, yPos + 10);
      
      // Customer name
      doc.setFontSize(11);
      doc.setTextColor(...darkColor);
      doc.text(invoice.customerName || "N/A", billToX + 5, yPos + 22);
      
      // Phone
      doc.setFontSize(9);
      doc.setTextColor(...grayColor);
      doc.text(invoice.customerPhone || "N/A", billToX + 5, yPos + 30);
      
      // Email (if exists)
      if (invoice.customerEmail) {
        doc.text(invoice.customerEmail, billToX + 5, yPos + 38);
      }
      
      // Address - properly formatted
      const address = invoice.address || "N/A";
      const addressParts = address.split(',').map(s => s.trim()).filter(Boolean);
      let addrY = yPos + (invoice.customerEmail ? 38 : 30);
      addressParts.slice(0, 2).forEach((part) => {
        doc.text(part, billToX + 5, addrY + 6);
        addrY += 5;
      });
      
      // ============ PRODUCTS TABLE ============
      yPos = 108;
      const rowHeight = 9;
      const headerHeight = 11;
      
      // Table header
      doc.setFillColor(...darkColor);
      doc.rect(margin, yPos, contentWidth, headerHeight, "F");
      
      doc.setTextColor(...white);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("PRODUCT", margin + 5, yPos + 8);
      doc.text("QTY", 135, yPos + 8, { align: "center" });
      doc.text("UNIT PRICE", 165, yPos + 8, { align: "right" });
      doc.text("TOTAL", pageWidth - margin, yPos + 8, { align: "right" });
      
      yPos += headerHeight;
      
      // Table rows
      invoice.products.forEach((product, index) => {
        const isEven = index % 2 === 0;
        doc.setFillColor(...(isEven ? white : [248, 248, 248]));
        doc.rect(margin, yPos, contentWidth, rowHeight, "F");
        
        doc.setTextColor(...darkColor);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        
        // Product name - handle long names
        const maxNameWidth = 100;
        const productName = product.name || "Unknown";
        const displayName = productName.length > 40 ? productName.substring(0, 37) + "..." : productName;
        doc.text(displayName, margin + 5, yPos + 6);
        
        // Quantity - centered
        doc.text(String(product.quantity || 0), 135, yPos + 6, { align: "center" });
        
        // Unit price - right aligned
        doc.text(formatPrice(product.unitPrice || 0), 165, yPos + 6, { align: "right" });
        
        // Total - right aligned, bold
        doc.setFont("helvetica", "bold");
        doc.text(formatPrice(product.total || 0), pageWidth - margin, yPos + 6, { align: "right" });
        
        yPos += rowHeight;
      });
      
      // Gold divider line
      doc.setDrawColor(...goldColor);
      doc.setLineWidth(1.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      
      yPos += 8;
      
      // ============ PRICING SECTION ============
      const pricingStartX = pageWidth - margin - 70;
      const pricingWidth = 70;
      
      // Subtotal
      doc.setFillColor(...lightGray);
      doc.roundedRect(pricingStartX, yPos, pricingWidth, 9, 2, 2, "F");
      
      doc.setTextColor(...grayColor);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Subtotal", pricingStartX + 4, yPos + 6);
      doc.setTextColor(...darkColor);
      doc.setFont("helvetica", "bold");
      doc.text(formatPrice(invoice.subtotal || 0), pageWidth - margin, yPos + 6, { align: "right" });
      
      yPos += 11;
      
      // Delivery
      doc.setFillColor(...lightGray);
      doc.roundedRect(pricingStartX, yPos, pricingWidth, 9, 2, 2, "F");
      
      doc.setTextColor(...grayColor);
      doc.setFont("helvetica", "normal");
      doc.text("Delivery", pricingStartX + 4, yPos + 6);
      doc.setTextColor(...darkColor);
      doc.setFont("helvetica", "bold");
      doc.text(formatPrice(invoice.deliveryCost || 0), pageWidth - margin, yPos + 6, { align: "right" });
      
      yPos += 11;
      
      // Discount (if any)
      if ((invoice.discount || 0) > 0) {
        doc.setFillColor(...lightGray);
        doc.roundedRect(pricingStartX, yPos, pricingWidth, 9, 2, 2, "F");
        
        doc.setTextColor(34, 139, 34);
        doc.setFont("helvetica", "normal");
        doc.text("Discount", pricingStartX + 4, yPos + 6);
        doc.setFont("helvetica", "bold");
        doc.text(`-${formatPrice(invoice.discount || 0)}`, pageWidth - margin, yPos + 6, { align: "right" });
        
        yPos += 11;
      }
      
      // Divider
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(pricingStartX, yPos, pageWidth - margin, yPos);
      
      yPos += 6;
      
      // TOTAL (highlighted)
      doc.setFillColor(...goldColor);
      doc.roundedRect(pricingStartX, yPos, pricingWidth, 14, 3, 3, "F");
      
      doc.setTextColor(...darkColor);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL", pricingStartX + 4, yPos + 10);
      doc.text(formatPrice(invoice.grandTotal || 0), pageWidth - margin, yPos + 10, { align: "right" });
      
      // ============ FOOTER ============
      const footerY = pageHeight - 20;
      
      // Footer line
      doc.setDrawColor(...goldColor);
      doc.setLineWidth(1);
      doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8);
      
      // Footer text
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
        footerY + 11,
        { align: "center" }
      );
      
      // Save the PDF
      doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
      toast.success("Invoice downloaded!");
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast.error("Failed to generate PDF");
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
            <div className="relative p-8 md:p-12">
              <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center transform rotate-[-30deg] scale-[3]">
                    <Zap className="w-32 h-32 text-[#D4AF37] mx-auto" />
                    <p className="text-lg font-bold text-gray-600 mt-4 whitespace-nowrap">
                      Lightning Bathware – Official Invoice
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="w-10 h-10 text-[#D4AF37]" />
                      <div>
                        <h2 className="text-2xl font-bold">
                          {storeProfile.storeName} <span className="text-[#D4AF37]">{storeProfile.storeNameAccent}</span>
                        </h2>
                        <p className="text-gray-500 text-sm">Premium Lighting & Bathware</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1 mt-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{storeProfile.addressStreet}, {storeProfile.addressCity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{storeProfile.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{storeProfile.email}</span>
                      </div>
                    </div>
                  </div>

                    <div className="mt-6 md:mt-0 text-right">
                    <h3 className="text-3xl font-bold text-[#D4AF37] mb-2">INVOICE</h3>
                    <p className="text-lg font-semibold">{invoice.invoiceNumber}</p>
                    
                    {/* Payment Status - Read from Order (Primary Source) */}
                    <div className="mt-3 flex items-center gap-2 justify-end">
                      <span className="text-xs text-gray-500">Payment:</span>
                      {order?.paymentStatus === "Paid" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold">
                          <CheckCircle className="w-4 h-4" />
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white rounded-full text-sm font-semibold">
                          <Clock className="w-4 h-4" />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#D4AF37]" />
                      Order Information
                    </h4>
                    <p className="text-sm text-gray-600">
                      <strong>Date:</strong> {formatDate(invoice.date)}
                    </p>
                    {invoice.orderId && (
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Order ID:</strong> #{invoice.orderId.slice(-8)}
                      </p>
                    )}
                    {order && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600">
                          <strong>Order Status:</strong>
                        </p>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold mt-1 ${
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

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <span className="text-[#D4AF37]">@</span>
                      Customer Details
                    </h4>
                    <p className="text-sm font-semibold">{invoice.customerName}</p>
                    <p className="text-sm text-gray-600">{invoice.customerPhone}</p>
                    {invoice.customerEmail && (
                      <p className="text-sm text-gray-600">{invoice.customerEmail}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">{invoice.address}</p>
                  </div>
                </div>

                <div className="overflow-x-auto mb-8">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-3 text-left text-sm font-bold">Product</th>
                        <th className="px-4 py-3 text-center text-sm font-bold">Quantity</th>
                        <th className="px-4 py-3 text-right text-sm font-bold">Unit Price</th>
                        <th className="px-4 py-3 text-right text-sm font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.products.map((product, index) => (
                        <tr key={product.id || index} className="border-b">
                          <td className="px-4 py-3 text-sm">{product.name}</td>
                          <td className="px-4 py-3 text-sm text-center">{product.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right">{formatPrice(product.unitPrice)}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold">
                            {formatPrice(product.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <div className="space-y-2 min-w-[250px]">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span>{formatPrice(invoice.subtotal)}</span>
                    </div>
                    {(invoice.discount || 0) > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span>
                        <span>-{formatPrice(invoice.discount)}</span>
                      </div>
                    )}
                    {(invoice.tax || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax</span>
                        <span>{formatPrice(invoice.tax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery</span>
                      <span>{formatPrice(invoice.deliveryCost)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Grand Total</span>
                      <span className="text-[#D4AF37]">{formatPrice(invoice.grandTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t text-center">
                  <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4 text-[#D4AF37]" />
                    Lightning Bathware – Official Invoice
                    <Zap className="w-4 h-4 text-[#D4AF37]" />
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Powered by Lightning Bathware | {storeProfile.addressCity}, Sri Lanka
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-8 py-4 flex flex-wrap gap-3 justify-center print:hidden">
              <Button
                onClick={downloadPDF}
                className="bg-[#D4AF37] hover:bg-[#b8962f] text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
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
        }
      `}</style>
    </div>
  );
}
