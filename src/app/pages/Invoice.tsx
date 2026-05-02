import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useAdmin } from "../context/AdminContext";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { pdf } from "@react-pdf/renderer";
import InvoicePDFDocument from "./InvoicePDF";
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

  const downloadPDF = async () => {
    if (!invoice) return;

    setIsDownloading(true);
    
    try {
      const blob = await pdf(
        <InvoicePDFDocument
          invoice={invoice}
          order={order}
          storeProfile={storeProfile}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${invoice.invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
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
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4 text-center">
          <AlertCircle className="w-24 h-24 mx-auto text-muted-foreground mb-6" />
          <h2 className="text-2xl font-bold mb-4 text-foreground">{error || "Invoice Not Found"}</h2>
          <p className="text-muted-foreground mb-8">
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
    <div className="min-h-screen bg-background py-8 print:bg-white print:py-0">
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
          <h1 className="text-3xl font-bold text-foreground">Invoice Details</h1>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl shadow-lg overflow-hidden print:shadow-none print:rounded-none">
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
                      <p className="text-muted-foreground text-sm">Premium Lighting & Bathware</p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1.5 mt-4">
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
                  <p className="text-muted-foreground text-sm">{formatDate(invoice.date)}</p>
                  
                  <div className="mt-4 flex items-center gap-2 justify-end">
                    <span className="text-xs text-muted-foreground">Payment:</span>
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
                <div className="bg-muted/50 p-5 rounded-xl border border-border min-w-0">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-[#D4AF37] mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 shrink-0" />
                    Order Information
                  </h4>
                  <p className="text-sm text-muted-foreground break-words">
                    <strong className="text-foreground">Date:</strong> {formatDate(invoice.date)}
                  </p>
                  {invoice.orderId && (
                    <p className="text-sm text-muted-foreground mt-1 break-all">
                      <strong className="text-foreground">Order ID:</strong> #{invoice.orderId.slice(-8)}
                    </p>
                  )}
                  {order && (
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong className="text-foreground">Order Status:</strong>
                      </p>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold shrink-0 ${
order.status === "Delivered" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                 order.status === "Processing" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                 "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                      }`}>
                        {order.status === "Delivered" && <CheckCircle className="w-4 h-4" />}
                        {order.status === "Processing" && <Zap className="w-4 h-4" />}
                        {order.status === "Pending" && <Clock className="w-4 h-4" />}
                        {order.status}
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-muted/50 p-5 rounded-xl border border-border min-w-0">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-[#D4AF37] mb-3 flex items-center gap-2">
                    <span className="text-[#D4AF37] shrink-0">@</span>
                    Customer Details
                  </h4>
                  <p className="text-base font-bold text-foreground break-words">{invoice.customerName}</p>
                  <p className="text-sm text-muted-foreground mt-1 break-words">{invoice.customerPhone}</p>
                  {invoice.customerEmail && (
                    <p className="text-sm text-muted-foreground break-all">{invoice.customerEmail}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2 break-words leading-relaxed">{invoice.address}</p>
                </div>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto mb-8 rounded-xl border border-border">
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
                      <tr key={product.id || index} className={`border-b border-border ${index % 2 === 0 ? "bg-card" : "bg-muted/30"} hover:bg-muted/50 transition-colors`}>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            {getProductImage(product) && (
                              <img 
                                src={getProductImage(product)} 
                                alt={product.name}
                                className="w-10 h-10 rounded-lg object-cover shrink-0 border border-border"
                              />
                            )}
                            <span className="text-sm font-medium text-foreground whitespace-normal break-normal">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {(product.selected_color || product.selected_size) ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground">
                              {product.selected_color || product.selected_size}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-center font-medium text-foreground">{product.quantity}</td>
                        <td className="px-4 py-3.5 text-sm text-right text-muted-foreground">{formatPrice(product.unitPrice)}</td>
                        <td className="px-4 py-3.5 text-sm text-right font-semibold text-foreground">
                          {formatPrice(product.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end mb-8">
                <div className="bg-muted/50 rounded-xl p-5 w-full sm:min-w-[300px] sm:w-auto border border-border">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium text-foreground">{formatPrice(invoice.subtotal)}</span>
                    </div>
                    {(invoice.deliveryCost || 0) > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Delivery</span>
                        <span className="font-medium text-foreground">{formatPrice(invoice.deliveryCost)}</span>
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
                        <span className="text-muted-foreground">Tax</span>
                        <span className="font-medium text-foreground">{formatPrice(invoice.tax)}</span>
                      </div>
                    )}
                    <div className="border-t-2 border-[#D4AF37] pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold text-foreground">Grand Total</span>
                        <span className="text-2xl font-extrabold text-[#D4AF37]">{formatPrice(invoice.grandTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-border text-center">
                <p className="text-base font-semibold text-foreground">
                  Thank you for choosing Lightning Bathware
                </p>
                <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-2 flex-wrap">
                  <Zap className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>{storeProfile.addressCity}, Sri Lanka | {storeProfile.phone} | {storeProfile.email}</span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-muted/50 px-8 py-4 flex flex-wrap gap-3 justify-center print:hidden border-t border-border">
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
