import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useAdmin } from "../context/AdminContext";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  Download, Printer, ArrowLeft, FileText, CheckCircle, 
  Clock, MapPin, Phone, Mail, Package, Zap, AlertCircle,
  Check, Tag, Truck
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
  selected_color?: string;
  selected_size?: string;
  image?: string;
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
    selected_color?: string;
    selected_size?: string;
    color?: string;
    image?: string;
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
  const { getInvoiceById, storeProfile, products } = useAdmin();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string>("");

  const safeProducts = products || [];

  const getProductImage = useCallback((product: InvoiceProduct): string => {
    if (product.image) return product.image;
    const match = safeProducts.find(p => p.id === product.id || p.name === product.name);
    return match?.image || "";
  }, [safeProducts]);

  useEffect(() => {
    if (!orderId) return;
    
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
        let foundInvoice: RawInvoiceData | null = (getInvoiceById(id) as RawInvoiceData) || null;
        
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
              selected_color: p.selected_color || p.color,
              selected_size: p.selected_size,
              image: p.image,
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
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      
      const goldColor = [212, 175, 55];
      const darkColor = [26, 26, 26];
      const lightGray = [249, 250, 251];
      const grayColor = [107, 114, 128];
      const greenColor = [34, 197, 94];
      const orangeColor = [251, 146, 60];
      const greenBg = [220, 252, 231];
      const greenText = [22, 101, 52];
      const orangeBg = [254, 243, 199];
      const orangeText = [180, 83, 9];
      const white = [255, 255, 255];
      
      // ============ WATERMARK ============
      pdf.saveGraphicsState();
      const gState = new (pdf as any).GState({ opacity: 0.04 });
      pdf.setGState(gState);
      pdf.setTextColor(212, 175, 55);
      pdf.setFontSize(80);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${storeProfile.storeName}`, pageWidth / 2, pageHeight / 2, {
        angle: 45,
        align: "center",
      });
      pdf.restoreGraphicsState();
      
      // ============ DARK HEADER ============
      pdf.setFillColor(...darkColor);
      pdf.rect(0, 0, pageWidth, 44, "F");
      
      // Gold accent line
      pdf.setFillColor(...goldColor);
      pdf.rect(0, 44, pageWidth, 2, "F");
      
      // Left: Company info
      pdf.setTextColor(...goldColor);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("INVOICE", margin, 11);
      
      pdf.setTextColor(...white);
      pdf.setFontSize(18);
      pdf.text(`${storeProfile.storeName}`, margin, 22);
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(200, 180, 100);
      pdf.text(`${storeProfile.storeNameAccent}`, margin, 30);
      
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(7);
      pdf.text("Premium Lighting & Bathware", margin, 37);
      
      // Contact info (left side, below company name)
      pdf.setFontSize(8);
      pdf.setTextColor(160, 160, 160);
      pdf.text(`${storeProfile.addressStreet}, ${storeProfile.addressCity}`, margin, 42);
      
      // Right: Invoice number + date + payment status
      const rightX = pageWidth - margin;
      pdf.setTextColor(...goldColor);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.text("INVOICE", rightX, 11, { align: "right" });
      
      pdf.setTextColor(...white);
      pdf.setFontSize(16);
      pdf.text(`${invoice.invoiceNumber}`, rightX, 22, { align: "right" });
      
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(160, 160, 160);
      pdf.text(`${formatDate(invoice.date).split(",")[0]}`, rightX, 30, { align: "right" });
      
      // Payment status badge
      const paymentStatusForPDF = order?.paymentStatus || invoice.paymentStatus;
      const isPaid = paymentStatusForPDF === "Paid";
      const badgeColor = isPaid ? greenColor : orangeColor;
      const badgeText = isPaid ? "PAID" : "PENDING";
      
      const badgeWidth = 32;
      const badgeHeight = 7;
      const badgeX = rightX - badgeWidth;
      const badgeY = 36;
      
      pdf.setFillColor(...badgeColor);
      pdf.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3, 3, "F");
      pdf.setTextColor(...white);
      pdf.setFontSize(6);
      pdf.setFont("helvetica", "bold");
      pdf.text(isPaid ? "\u2713 " + badgeText : badgeText, rightX - 2, badgeY + 5, { align: "right" });
      
      // ============ INFO CARDS ============
      let yPos = 58;
      const cardWidth = (contentWidth - 6) / 2;
      const cardHeight = 42;
      const cardRadius = 4;
      const gap = 6;
      
      // Card 1: Order Information (left)
      pdf.setFillColor(...lightGray);
      pdf.roundedRect(margin, yPos, cardWidth, cardHeight, cardRadius, cardRadius, "F");
      
      // Subtle border
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(margin, yPos, cardWidth, cardHeight, cardRadius, cardRadius, "S");
      
      pdf.setTextColor(...goldColor);
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "bold");
      pdf.text("ORDER INFORMATION", margin + 5, yPos + 7);
      
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(107, 114, 128);
      pdf.text("Date:", margin + 5, yPos + 15);
      pdf.setTextColor(26, 26, 26);
      pdf.setFont("helvetica", "bold");
      pdf.text(formatDate(invoice.date).split(",")[0], margin + 20, yPos + 15);
      
      if (invoice.orderId) {
        pdf.setTextColor(107, 114, 128);
        pdf.setFont("helvetica", "normal");
        pdf.text("Order:", margin + 5, yPos + 22);
        pdf.setTextColor(26, 26, 26);
        pdf.setFont("helvetica", "bold");
        pdf.text(`#${invoice.orderId.slice(-8)}`, margin + 20, yPos + 22);
      }
      
      // Order status badge
      if (order && order.status) {
        pdf.setTextColor(107, 114, 128);
        pdf.setFont("helvetica", "normal");
        pdf.text("Status:", margin + 5, yPos + 29);
        
        const statusLabel = order.status;
        const statusBg = order.status === "Delivered" ? greenBg : order.status === "Processing" ? [219, 234, 254] : orangeBg;
        const statusTx = order.status === "Delivered" ? greenText : order.status === "Processing" ? [30, 64, 175] : orangeText;
        
        const textW = pdf.getTextWidth(statusLabel) + 8;
        pdf.setFillColor(...statusBg);
        pdf.roundedRect(margin + 20, yPos + 26, textW, 6, 2, 2, "F");
        pdf.setTextColor(...statusTx);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(6);
        pdf.text(statusLabel, margin + 24, yPos + 31);
      }
      
      // Card 2: Customer Details (right)
      const billX = margin + cardWidth + gap;
      
      pdf.setFillColor(...lightGray);
      pdf.roundedRect(billX, yPos, cardWidth, cardHeight, cardRadius, cardRadius, "F");
      
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(billX, yPos, cardWidth, cardHeight, cardRadius, cardRadius, "S");
      
      pdf.setTextColor(...goldColor);
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "bold");
      pdf.text("CUSTOMER DETAILS", billX + 5, yPos + 7);
      
      pdf.setFontSize(10);
      pdf.setTextColor(26, 26, 26);
      pdf.setFont("helvetica", "bold");
      pdf.text(invoice.customerName || "N/A", billX + 5, yPos + 15, { maxWidth: cardWidth - 10 });
      
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(107, 114, 128);
      pdf.text(invoice.customerPhone || "N/A", billX + 5, yPos + 22);
      
      if (invoice.customerEmail) {
        pdf.text(invoice.customerEmail, billX + 5, yPos + 28);
      }
      
      const addressLines = pdf.splitTextToSize(invoice.address || "N/A", cardWidth - 10);
      pdf.text(addressLines, billX + 5, yPos + (invoice.customerEmail ? 34 : 30));
      
      // ============ PRODUCTS TABLE ============
      yPos = 112;
      
      const hasColor = invoice.products.some(p => p.selected_color || p.selected_size);
      const colCount = hasColor ? 5 : 4;
      
      const tableData = invoice.products.map(product => {
        const name = product.name || "Unknown Product";
        const color = product.selected_color || product.selected_size || "";
        return hasColor 
          ? [name, color, String(product.quantity || 0), formatPrice(product.unitPrice || 0), formatPrice(product.total || 0)]
          : [name, String(product.quantity || 0), formatPrice(product.unitPrice || 0), formatPrice(product.total || 0)];
      });
      
      autoTable(pdf, {
        startY: yPos,
        head: [hasColor ? ["PRODUCT", "COLOR", "QTY", "UNIT PRICE", "TOTAL"] : ["PRODUCT", "QTY", "UNIT PRICE", "TOTAL"]],
        body: tableData,
        columnStyles: {
          0: { cellPadding: 4, fontStyle: "normal" },
          1: { cellPadding: 3, halign: "center", fontStyle: "normal" },
          [colCount - 3]: { cellPadding: 3, halign: "center", fontStyle: "normal" },
          [colCount - 2]: { cellPadding: 3, halign: "right", fontStyle: "normal" },
          [colCount - 1]: { cellPadding: 3, halign: "right", fontStyle: "bold" },
        },
        styles: {
          fontSize: 8.5,
          cellPadding: 5,
          lineColor: [229, 231, 235],
          lineWidth: 0.3,
          textColor: darkColor,
        },
        headStyles: {
          fillColor: darkColor,
          textColor: white,
          fontStyle: "bold",
          fontSize: 7,
          cellPadding: 6,
        },
        alternateRowStyles: {
          fillColor: lightGray,
        },
        margin: { left: margin, right: margin },
        theme: "grid",
        tableLineColor: [229, 231, 235],
        tableLineWidth: 0.3,
      });
      
      const tableEndY = (pdf as any).lastAutoTable.finalY || yPos + 30;
      yPos = tableEndY + 10;
      
      // ============ TOTALS CARD ============
      const totalsWidth = 80;
      const totalsX = pageWidth - margin - totalsWidth;
      const cardPadding = 8;
      
      // Count how many total rows we'll have
      let totalRowCount = 2; // Subtotal + Delivery always
      if ((invoice.discount || 0) > 0) totalRowCount++;
      if ((invoice.tax || 0) > 0) totalRowCount++;
      totalRowCount++; // Grand Total
      
      const totalsCardHeight = totalRowCount * 10 + 16;
      
      // Card background
      pdf.setFillColor(...lightGray);
      pdf.roundedRect(totalsX - cardPadding, yPos - 2, totalsWidth + cardPadding * 2, totalsCardHeight, 4, 4, "F");
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(totalsX - cardPadding, yPos - 2, totalsWidth + cardPadding * 2, totalsCardHeight, 4, 4, "S");
      
      const subtotal = invoice.subtotal || 0;
      const delivery = invoice.deliveryCost || 0;
      const discount = invoice.discount || 0;
      const tax = invoice.tax || 0;
      const grandTotal = invoice.grandTotal || 0;
      
      let rowY = yPos + 5;
      
      // Subtotal
      pdf.setTextColor(...grayColor);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text("Subtotal", totalsX, rowY);
      pdf.setTextColor(26, 26, 26);
      pdf.setFont("helvetica", "bold");
      pdf.text(formatPrice(subtotal), pageWidth - margin, rowY, { align: "right" });
      rowY += 9;
      
      // Delivery
      pdf.setTextColor(...grayColor);
      pdf.setFont("helvetica", "normal");
      pdf.text("Delivery", totalsX, rowY);
      pdf.setTextColor(26, 26, 26);
      pdf.setFont("helvetica", "bold");
      pdf.text(formatPrice(delivery), pageWidth - margin, rowY, { align: "right" });
      rowY += 9;
      
      // Discount
      if (discount > 0) {
        pdf.setTextColor(22, 163, 74);
        pdf.setFont("helvetica", "normal");
        pdf.text("Discount", totalsX, rowY);
        pdf.setFont("helvetica", "bold");
        pdf.text(`-${formatPrice(discount)}`, pageWidth - margin, rowY, { align: "right" });
        rowY += 9;
      }
      
      // Tax
      if (tax > 0) {
        pdf.setTextColor(...grayColor);
        pdf.setFont("helvetica", "normal");
        pdf.text("Tax", totalsX, rowY);
        pdf.setTextColor(26, 26, 26);
        pdf.setFont("helvetica", "bold");
        pdf.text(formatPrice(tax), pageWidth - margin, rowY, { align: "right" });
        rowY += 9;
      }
      
      // Gold divider
      pdf.setDrawColor(...goldColor);
      pdf.setLineWidth(1);
      pdf.line(totalsX - 2, rowY, pageWidth - margin, rowY);
      rowY += 6;
      
      // Grand Total - gold highlight
      pdf.setFillColor(...goldColor);
      pdf.roundedRect(totalsX - 4, rowY - 2, totalsWidth + 8, 12, 3, 3, "F");
      pdf.setTextColor(26, 26, 26);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.text("GRAND TOTAL", totalsX, rowY + 6);
      pdf.setFontSize(10);
      pdf.text(formatPrice(grandTotal), pageWidth - margin - 2, rowY + 6, { align: "right" });
      
      // ============ FOOTER ============
      const footerY = pageHeight - 22;
      
      pdf.setDrawColor(...goldColor);
      pdf.setLineWidth(0.5);
      pdf.line(margin, footerY - 12, pageWidth - margin, footerY - 12);
      
      pdf.setTextColor(26, 26, 26);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("Thank you for choosing Lightning Bathware", pageWidth / 2, footerY, { align: "center" });
      
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...grayColor);
      pdf.text(
        `${storeProfile.addressCity}, Sri Lanka  |  ${storeProfile.phone}  |  ${storeProfile.email}`,
        pageWidth / 2,
        footerY + 6,
        { align: "center" }
      );
      
      pdf.setFontSize(7);
      pdf.setTextColor(180, 180, 180);
      pdf.text(
        `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
        pageWidth / 2,
        footerY + 12,
        { align: "center" }
      );
      
      pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
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
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 mb-6 print:hidden">
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
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden print:shadow-none print:rounded-none">
            {/* Header */}
            <div className="bg-[#1a1a1a] text-white p-6 md:p-10">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="w-8 h-8 text-[#D4AF37] shrink-0" />
                    <div className="min-w-0">
                      <h2 className="text-2xl font-bold break-words">
                        {storeProfile.storeName} <span className="text-[#D4AF37]">{storeProfile.storeNameAccent}</span>
                      </h2>
                      <p className="text-gray-400 text-sm">Premium Lighting & Bathware</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1.5 mt-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 shrink-0 text-[#D4AF37]" />
                      <span className="break-words">{storeProfile.addressStreet}, {storeProfile.addressCity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 shrink-0 text-[#D4AF37]" />
                      <span>{storeProfile.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 shrink-0 text-[#D4AF37]" />
                      <span className="break-all">{storeProfile.email}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-[#D4AF37] text-sm font-semibold tracking-wider uppercase mb-1">INVOICE</p>
                  <h3 className="text-3xl font-extrabold text-white mb-1">{invoice.invoiceNumber}</h3>
                  <p className="text-gray-400 text-sm">{formatDate(invoice.date)}</p>
                  
                  <div className="mt-4 flex items-center gap-2 justify-end">
                    <span className="text-xs text-gray-500">Payment:</span>
                    {order?.paymentStatus === "Paid" ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-sm font-bold shrink-0 shadow-lg shadow-green-500/20">
                        <Check className="w-4 h-4" />
                        Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-full text-sm font-bold shrink-0 shadow-lg shadow-orange-500/20">
                        <Clock className="w-4 h-4" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Gold accent line */}
            <div className="h-1 bg-gradient-to-r from-[#D4AF37] via-[#F5D76E] to-[#D4AF37]" />

            <div className="p-6 md:p-10 lg:p-12">
              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 min-w-0">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-[#D4AF37] mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 shrink-0" />
                    Order Information
                  </h4>
                  <p className="text-sm text-gray-600 break-words">
                    <strong className="text-gray-900">Date:</strong> {formatDate(invoice.date)}
                  </p>
                  {invoice.orderId && (
                    <p className="text-sm text-gray-600 mt-1 break-all">
                      <strong className="text-gray-900">Order ID:</strong> #{invoice.orderId.slice(-8)}
                    </p>
                  )}
                  {order && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-1">
                        <strong className="text-gray-900">Order Status:</strong>
                      </p>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold shrink-0 ${
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

                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 min-w-0">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-[#D4AF37] mb-3 flex items-center gap-2">
                    <span className="text-[#D4AF37] shrink-0">@</span>
                    Customer Details
                  </h4>
                  <p className="text-base font-bold text-gray-900 break-words">{invoice.customerName}</p>
                  <p className="text-sm text-gray-600 mt-1 break-words">{invoice.customerPhone}</p>
                  {invoice.customerEmail && (
                    <p className="text-sm text-gray-600 break-all">{invoice.customerEmail}</p>
                  )}
                  <p className="text-sm text-gray-600 mt-2 break-words leading-relaxed">{invoice.address}</p>
                </div>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto mb-8 rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#1a1a1a] text-white">
                      <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Product</th>
                      <th className="px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wider w-24">Color</th>
                      <th className="px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wider w-16">Qty</th>
                      <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Unit Price</th>
                      <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.products.map((product, index) => (
                      <tr key={product.id || index} className={`border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-gray-50 transition-colors`}>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            {getProductImage(product) && (
                              <img 
                                src={getProductImage(product)} 
                                alt={product.name}
                                className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-200"
                              />
                            )}
                            <span className="text-sm font-medium text-gray-900 whitespace-normal break-normal">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {(product.selected_color || product.selected_size) ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                              {product.selected_color || product.selected_size}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-center font-medium">{product.quantity}</td>
                        <td className="px-4 py-3.5 text-sm text-right text-gray-600">{formatPrice(product.unitPrice)}</td>
                        <td className="px-4 py-3.5 text-sm text-right font-semibold text-gray-900">
                          {formatPrice(product.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end mb-8">
                <div className="bg-gray-50 rounded-xl p-5 min-w-[300px] max-w-full border border-gray-100">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-medium text-gray-900">{formatPrice(invoice.subtotal)}</span>
                    </div>
                    {(invoice.deliveryCost || 0) > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Delivery</span>
                        <span className="font-medium text-gray-900">{formatPrice(invoice.deliveryCost)}</span>
                      </div>
                    )}
                    {(invoice.discount || 0) > 0 && (
                      <div className="flex justify-between items-center text-sm text-green-600">
                        <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Discount</span>
                        <span className="font-medium">-{formatPrice(invoice.discount)}</span>
                      </div>
                    )}
                    {(invoice.tax || 0) > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Tax</span>
                        <span className="font-medium text-gray-900">{formatPrice(invoice.tax)}</span>
                      </div>
                    )}
                    <div className="border-t-2 border-[#D4AF37] pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold text-gray-900">Grand Total</span>
                        <span className="text-2xl font-extrabold text-[#D4AF37]">{formatPrice(invoice.grandTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-base font-semibold text-gray-800">
                  Thank you for choosing Lightning Bathware
                </p>
                <p className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-2 flex-wrap">
                  <Zap className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>{storeProfile.addressCity}, Sri Lanka | {storeProfile.phone} | {storeProfile.email}</span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-50 px-8 py-4 flex flex-wrap gap-3 justify-center print:hidden border-t border-gray-200">
              <Button
                onClick={downloadPDF}
                disabled={isDownloading}
                className="bg-[#D4AF37] hover:bg-[#b8962f] text-white shadow-md shadow-[#D4AF37]/20"
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
          .print\\:bg-white {
            background: white !important;
          }
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          .print\\:py-0 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          table {
            table-layout: fixed;
            word-wrap: break-word;
          }
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
