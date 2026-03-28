import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useAdmin } from "../context/AdminContext";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  Download, Printer, ArrowLeft, FileText, CheckCircle, 
  Clock, MapPin, Phone, Mail, Package, Zap, AlertCircle 
} from "lucide-react";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

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

export default function Invoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInvoiceById, storeProfile, invoices } = useAdmin();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Invalid invoice ID");
      setLoading(false);
      return;
    }

    const fetchInvoice = async () => {
      try {
        // First try to find in local state
        let foundInvoice = getInvoiceById(id);
        
        // If not found locally, fetch directly from Firebase
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
  }, [id, invoices, getInvoiceById]);

  const verificationUrl = `https://lightning-bathware.vercel.app/#/verify/${id}`;

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
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      const goldColor = [212, 175, 55];
      const darkColor = [26, 26, 26];
      const grayColor = [100, 100, 100];
      
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
      doc.text(`Invoice #: ${invoice.invoiceNumber}`, 15, yPos + 15);
      doc.text(`Date: ${formatDate(invoice.date).split(",")[0]}`, 15, yPos + 22);
      
      const statusColor = invoice.paymentStatus === "Paid" ? [34, 139, 34] : [255, 165, 0];
      doc.setTextColor(...statusColor);
      doc.setFont("helvetica", "bold");
      doc.text(`Status: ${invoice.paymentStatus}`, 15, yPos + 32);
      
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(105, yPos, 90, 35, 2, 2, "F");
      doc.setTextColor(...darkColor);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Bill To", 110, yPos + 7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(invoice.customerName || "Unknown", 110, yPos + 15);
      doc.text(invoice.customerPhone || "N/A", 110, yPos + 22);
      if (invoice.customerEmail) {
        doc.text(invoice.customerEmail, 110, yPos + 29);
      }
      
      doc.text(invoice.address || "N/A", 110, yPos + 36);
      
      yPos = 110;
      
      const tableData = invoice.products.map((product) => [
        product.name || "Unknown",
        String(product.quantity || 0),
        formatPrice(product.unitPrice || 0),
        formatPrice(product.total || 0),
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
      doc.text(formatPrice(invoice.subtotal || 0), 190, yPos + 12, { align: "right" });
      
      if ((invoice.discount || 0) > 0) {
        doc.setTextColor(...grayColor);
        doc.setFont("helvetica", "normal");
        doc.text("Discount", 190, yPos + 20, { align: "right" });
        doc.setTextColor(34, 139, 34);
        doc.text(`-${formatPrice(invoice.discount || 0)}`, 190, yPos + 27, { align: "right" });
      }
      
      doc.setTextColor(...grayColor);
      doc.setFont("helvetica", "normal");
      doc.text("Delivery", 190, yPos + ((invoice.discount || 0) > 0 ? 35 : 20), { align: "right" });
      doc.setTextColor(...darkColor);
      doc.setFont("helvetica", "bold");
      doc.text(formatPrice(invoice.deliveryCost || 0), 190, yPos + ((invoice.discount || 0) > 0 ? 42 : 27), { align: "right" });
      
      yPos = yPos + ((invoice.discount || 0) > 0 ? 50 : 35);
      
      doc.setFillColor(...goldColor);
      doc.roundedRect(105, yPos, 90, 18, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL", 110, yPos + 7);
      doc.text(formatPrice(invoice.grandTotal || 0), 190, yPos + 13, { align: "right" });
      
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
      </div>
    );
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
                    <div className="mt-4 flex items-center gap-2 justify-end">
                      {invoice.paymentStatus === "Paid" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          <CheckCircle className="w-4 h-4" />
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
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
                        <strong>Order ID:</strong> {invoice.orderId}
                      </p>
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

                <div className="flex flex-col md:flex-row justify-between gap-8">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold mb-2">Verify Invoice</h4>
                    <div className="bg-white p-2 rounded inline-block">
                      <QRCodeSVG
                        value={verificationUrl}
                        size={100}
                        level="H"
                        includeMargin
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Scan to verify authenticity</p>
                    <Button
                      onClick={() => window.open(verificationUrl, "_blank")}
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white"
                    >
                      Open Verification Link
                    </Button>
                  </div>

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
