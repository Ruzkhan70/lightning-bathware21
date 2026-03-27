import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useAdmin } from "../context/AdminContext";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  Download, Printer, ArrowLeft, FileText, CheckCircle, 
  Clock, MapPin, Phone, Mail, Package, Zap 
} from "lucide-react";

export default function Invoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getInvoiceById, storeProfile, invoices } = useAdmin();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      const foundInvoice = getInvoiceById(id);
      if (foundInvoice) {
        setInvoice(foundInvoice);
      } else {
        toast.error("Invoice not found");
      }
      setLoading(false);
    }
  }, [id, invoices]);

  const verificationUrl = `https://lightning-bathware.vercel.app/#/verify/${id}`;

  const downloadPDF = () => {
    if (!invoice) return;

    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 105, 25, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`${storeProfile.storeName} ${storeProfile.storeNameAccent}`, 105, 35, { align: "center" });
    doc.setFontSize(9);
    doc.text(`${storeProfile.addressStreet}, ${storeProfile.addressCity}`, 105, 42, { align: "center" });
    doc.text(`Phone: ${storeProfile.phone} | Email: ${storeProfile.email}`, 105, 48, { align: "center" });
    
    doc.line(15, 55, 195, 55);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Invoice Details", 15, 65);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 15, 72);
    doc.text(`Date: ${new Date(invoice.date).toLocaleDateString("en-US", { 
      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" 
    })}`, 15, 78);
    doc.text(`Payment Status: ${invoice.paymentStatus}`, 15, 84);
    
    doc.setFont("helvetica", "bold");
    doc.text("Customer Details", 120, 65);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${invoice.customerName}`, 120, 72);
    doc.text(`Phone: ${invoice.customerPhone}`, 120, 78);
    if (invoice.customerEmail) {
      doc.text(`Email: ${invoice.customerEmail}`, 120, 84);
    }
    doc.text(`Address: ${invoice.address}`, 120, 90);
    
    doc.line(15, 98, 195, 98);
    
    const tableData = invoice.products.map((product: any) => [
      product.name,
      product.quantity.toString(),
      `Rs. ${product.unitPrice.toLocaleString()}`,
      `Rs. ${product.total.toLocaleString()}`,
    ]);
    
    autoTable(doc, {
      startY: 102,
      head: [["Product", "Quantity", "Unit Price", "Total"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [44, 62, 80] },
      styles: { fontSize: 9 },
    });
    
    const finalY = (doc as any).lastAutoTable?.finalY || 130;
    
    doc.setFontSize(10);
    doc.text(`Subtotal: Rs. ${invoice.subtotal.toLocaleString()}`, 140, finalY + 15);
    if (invoice.discount > 0) {
      doc.text(`Discount: Rs. ${invoice.discount.toLocaleString()}`, 140, finalY + 22);
    }
    doc.text(`Delivery: Rs. ${invoice.deliveryCost.toLocaleString()}`, 140, finalY + 29);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Grand Total: Rs. ${invoice.grandTotal.toLocaleString()}`, 140, finalY + 40);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Powered by Lightning Bathware - Official Invoice", 105, 285, { align: "center" });
    
    doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
    toast.success("Invoice downloaded!");
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

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <FileText className="w-24 h-24 mx-auto text-gray-300 mb-6" />
          <h2 className="text-2xl font-bold mb-4">Invoice Not Found</h2>
          <p className="text-gray-600 mb-8">The invoice you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/")} className="bg-black hover:bg-[#D4AF37] text-white">
            Go to Home
          </Button>
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
            <div ref={invoiceRef} className="relative p-8 md:p-12">
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
                      <strong>Date:</strong> {new Date(invoice.date).toLocaleDateString("en-US", { 
                        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" 
                      })}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Order ID:</strong> {invoice.orderId}
                    </p>
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
                      {invoice.products.map((product: any, index: number) => (
                        <tr key={index} className="border-b">
                          <td className="px-4 py-3 text-sm">{product.name}</td>
                          <td className="px-4 py-3 text-sm text-center">{product.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right">Rs. {product.unitPrice.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold">
                            Rs. {product.total.toLocaleString()}
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
                      <span>Rs. {invoice.subtotal.toLocaleString()}</span>
                    </div>
                    {invoice.discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span>
                        <span>-Rs. {invoice.discount.toLocaleString()}</span>
                      </div>
                    )}
                    {invoice.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax</span>
                        <span>Rs. {invoice.tax.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery</span>
                      <span>Rs. {invoice.deliveryCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Grand Total</span>
                      <span className="text-[#D4AF37]">Rs. {invoice.grandTotal.toLocaleString()}</span>
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
          #invoice-print-area, #invoice-print-area * {
            visibility: visible;
          }
          #invoice-print-area {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
    </div>
  );
}
