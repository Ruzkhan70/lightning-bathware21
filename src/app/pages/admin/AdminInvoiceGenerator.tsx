import { useState, useMemo, useCallback } from "react";
import { Search, Plus, Trash2, Minus, Plus as PlusIcon, FileText, Download, Printer, Package, User, Phone, MapPin, Mail, Receipt, CheckCircle, Loader2 } from "lucide-react";
import { useAdmin } from "../../context/AdminContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface InvoiceItem {
  id: string;
  name: string;
  code: string;
  image: string;
  quantity: number;
  unitPrice: number;
}

export default function AdminInvoiceGenerator() {
  const navigate = useNavigate();
  const { products, storeProfile, addManualInvoice } = useAdmin();

  const [searchQuery, setSearchQuery] = useState("");
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.isAvailable &&
        (p.name.toLowerCase().includes(q) ||
          (p.product_code && p.product_code.toLowerCase().includes(q)))
    );
  }, [products, searchQuery]);

  const addItem = useCallback((product: typeof products[0]) => {
    setInvoiceItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          code: product.product_code || "",
          image: product.image || "",
          quantity: 1,
          unitPrice: product.price,
        },
      ];
    });
    setSearchQuery("");
  }, []);

  const updateQuantity = useCallback((id: string, qty: number) => {
    if (qty < 1) qty = 1;
    setInvoiceItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setInvoiceItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const subtotal = useMemo(
    () => invoiceItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [invoiceItems]
  );
  const grandTotal = subtotal - discount;

  const clearForm = useCallback(() => {
    setInvoiceItems([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setCustomerAddress("");
    setDiscount(0);
    setNotes("");
    setGeneratedInvoice(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (invoiceItems.length === 0) {
      toast.error("Add at least one product to the invoice");
      return;
    }
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!customerPhone.trim()) {
      toast.error("Customer phone is required");
      return;
    }

    setIsGenerating(true);
    try {
      const invoice = await addManualInvoice({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        address: customerAddress.trim(),
        products: invoiceItems.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.unitPrice * i.quantity,
          image: i.image,
          code: i.code,
        })),
        discount,
        tax: 0,
        notes: notes.trim(),
      });
      setGeneratedInvoice(invoice);
      toast.success(`Invoice ${invoice.invoiceNumber} generated!`);
    } catch (err) {
      toast.error("Failed to generate invoice");
    } finally {
      setIsGenerating(false);
    }
  }, [invoiceItems, customerName, customerPhone, customerEmail, customerAddress, discount, notes, addManualInvoice]);

  const handleDownloadPDF = useCallback(async () => {
    if (!generatedInvoice) return;

    const container = document.createElement("div");
    container.style.cssText = "position:fixed;left:-9999px;top:0;width:800px;z-index:-1;";
    container.innerHTML = `
      <div style="background:#fff;font-family:Arial,Helvetica,sans-serif;width:760px;padding:0;margin:0;">
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { padding: 10px 14px; text-align: left; font-size: 12px; }
        </style>

        <div style="background:#1a1a1a;padding:28px 36px 20px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                <span style="font-size:24px;color:#D4AF37;">⚡</span>
                <span style="color:#fff;font-size:22px;font-weight:800;">
                  ${storeProfile.storeName} <span style="color:#D4AF37;">${storeProfile.storeNameAccent}</span>
                </span>
              </div>
              <p style="color:#9ca3af;font-size:11px;margin:0 0 12px;">Premium Lighting & Bathware</p>
              <p style="color:#aaa;font-size:11px;margin:2px 0;">📍 ${storeProfile.addressStreet}, ${storeProfile.addressCity}</p>
              <p style="color:#aaa;font-size:11px;margin:2px 0;">📞 ${storeProfile.phone}</p>
              <p style="color:#aaa;font-size:11px;margin:2px 0;">✉ ${storeProfile.email}</p>
            </div>
            <div style="text-align:right;">
              <p style="color:#D4AF37;font-size:11px;font-weight:700;letter-spacing:2px;margin:0 0 4px;text-transform:uppercase;">INVOICE</p>
              <p style="color:#fff;font-size:22px;font-weight:800;margin:0 0 4px;">${generatedInvoice.invoiceNumber}</p>
              <p style="color:#9ca3af;font-size:11px;margin:0 0 10px;">${new Date(generatedInvoice.date || generatedInvoice.createdAt).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"})}</p>
              <span style="display:inline-flex;align-items:center;gap:6px;padding:5px 16px;border-radius:20px;font-size:11px;font-weight:700;color:#fff;${generatedInvoice.paymentStatus === "Paid" ? "background:#22c55e;" : "background:#f97316;"}">
                ${generatedInvoice.paymentStatus === "Paid" ? "✓ Paid" : "⏳ Pending"}
              </span>
            </div>
          </div>
        </div>

        <div style="height:4px;background:linear-gradient(90deg,#D4AF37,#F5D76E,#D4AF37);"></div>

        <div style="padding:24px 36px;">
          <div style="display:flex;gap:16px;margin-bottom:24px;">
            <div style="flex:1;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;">
              <p style="color:#D4AF37;font-size:10px;font-weight:700;letter-spacing:1.5px;margin:0 0 10px;text-transform:uppercase;">ORDER INFORMATION</p>
              <p style="font-size:12px;color:#6b7280;margin:3px 0;"><strong style="color:#1a1a1a;">Date:</strong> ${new Date(generatedInvoice.date || generatedInvoice.createdAt).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</p>
              <p style="font-size:12px;color:#6b7280;margin:3px 0;"><strong style="color:#1a1a1a;">Invoice:</strong> ${generatedInvoice.invoiceNumber}</p>
            </div>
            <div style="flex:1;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;">
              <p style="color:#D4AF37;font-size:10px;font-weight:700;letter-spacing:1.5px;margin:0 0 10px;text-transform:uppercase;">CUSTOMER DETAILS</p>
              <p style="font-size:14px;font-weight:700;color:#1a1a1a;margin:0 0 4px;">${generatedInvoice.customerName}</p>
              <p style="font-size:12px;color:#6b7280;margin:2px 0;">${generatedInvoice.customerPhone}</p>
              ${generatedInvoice.customerEmail ? `<p style="font-size:12px;color:#6b7280;margin:2px 0;">${generatedInvoice.customerEmail}</p>` : ""}
              ${generatedInvoice.address ? `<p style="font-size:12px;color:#6b7280;margin:4px 0;">${generatedInvoice.address}</p>` : ""}
            </div>
          </div>

          <table style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:24px;">
            <thead>
              <tr style="background:#1a1a1a;">
                <th style="color:#fff;font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;">Product</th>
                <th style="color:#fff;font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;text-align:center;">Qty</th>
                <th style="color:#fff;font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;text-align:right;">Unit Price</th>
                <th style="color:#fff;font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${generatedInvoice.products.map((p: any, i: number) => `
                <tr style="${i % 2 === 1 ? "background:#fafafa;" : ""}border-bottom:1px solid #f3f4f6;">
                  <td style="padding:10px 14px;font-size:12px;color:#1a1a1a;">
                    <div style="display:flex;align-items:center;gap:8px;">
                      ${p.image ? `<img src="${p.image}" alt="${p.name}" style="width:28px;height:28px;border-radius:4px;object-fit:cover;border:1px solid #e5e7eb;" />` : ""}
                      <span>${p.name}</span>
                    </div>
                  </td>
                  <td style="padding:10px 14px;font-size:12px;color:#1a1a1a;text-align:center;">${p.quantity}</td>
                  <td style="padding:10px 14px;font-size:12px;color:#6b7280;text-align:right;">Rs. ${(p.unitPrice || 0).toLocaleString()}</td>
                  <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#1a1a1a;text-align:right;">Rs. ${(p.total || 0).toLocaleString()}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;width:300px;margin-left:auto;">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="font-size:12px;color:#6b7280;">Subtotal</span>
              <span style="font-size:12px;font-weight:600;color:#1a1a1a;">Rs. ${(generatedInvoice.subtotal || 0).toLocaleString()}</span>
            </div>
            ${(generatedInvoice.discount || 0) > 0 ? `
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="font-size:12px;color:#16a34a;">Discount</span>
              <span style="font-size:12px;font-weight:600;color:#16a34a;">-Rs. ${(generatedInvoice.discount || 0).toLocaleString()}</span>
            </div>` : ""}
            <div style="height:2px;background:#D4AF37;margin:8px 0;"></div>
            <div style="display:flex;justify-content:space-between;align-items:center;background:#D4AF37;padding:8px 14px;border-radius:6px;margin-top:4px;">
              <span style="font-size:13px;font-weight:700;color:#1a1a1a;">GRAND TOTAL</span>
              <span style="font-size:18px;font-weight:800;color:#1a1a1a;">Rs. ${(generatedInvoice.grandTotal || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div style="border-top:1px solid #e5e7eb;padding:20px 36px;text-align:center;">
          <p style="font-size:13px;font-weight:700;color:#1a1a1a;margin:0 0 4px;">Thank you for choosing ${storeProfile.storeName} ${storeProfile.storeNameAccent}</p>
          <p style="font-size:11px;color:#6b7280;margin:2px 0;">${storeProfile.addressCity}, Sri Lanka | ${storeProfile.phone} | ${storeProfile.email}</p>
          <p style="font-size:10px;color:#9ca3af;margin:4px 0;">Generated: ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</p>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: container.scrollWidth,
        height: container.scrollHeight,
        windowWidth: container.scrollWidth,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${generatedInvoice.invoiceNumber}.pdf`);
      toast.success("PDF downloaded!");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      document.body.removeChild(container);
    }
  }, [generatedInvoice, storeProfile]);

  const handlePrint = useCallback(() => {
    if (!generatedInvoice) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print");
      return;
    }
    printWindow.document.write(`
      <html><head><title>${generatedInvoice.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { color: #666; margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #f5f5f5; }
        .totals { text-align: right; margin-top: 20px; }
        .totals p { margin: 4px 0; }
        .footer { text-align: center; margin-top: 40px; color: #888; font-size: 12px; }
      </style></head><body>
      <div class="header">
        <h1>${storeProfile.storeName} ${storeProfile.storeNameAccent}</h1>
        <p>${storeProfile.addressStreet}, ${storeProfile.addressCity}</p>
        <p>${storeProfile.phone} | ${storeProfile.email}</p>
        <h2>Invoice: ${generatedInvoice.invoiceNumber}</h2>
      </div>
      <p><strong>Customer:</strong> ${generatedInvoice.customerName}</p>
      <p><strong>Phone:</strong> ${generatedInvoice.customerPhone}</p>
      ${generatedInvoice.customerEmail ? `<p><strong>Email:</strong> ${generatedInvoice.customerEmail}</p>` : ""}
      ${generatedInvoice.address ? `<p><strong>Address:</strong> ${generatedInvoice.address}</p>` : ""}
      <table>
        <thead><tr><th>#</th><th>Product</th><th>Code</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
        <tbody>
          ${generatedInvoice.products.map((p: any, i: number) => `
            <tr>
              <td>${i + 1}</td>
              <td>${p.name}</td>
              <td>${p.code || "-"}</td>
              <td>${p.quantity}</td>
              <td>Rs. ${p.unitPrice.toLocaleString()}</td>
              <td>Rs. ${p.total.toLocaleString()}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <div class="totals">
        <p><strong>Subtotal:</strong> Rs. ${generatedInvoice.subtotal.toLocaleString()}</p>
        ${generatedInvoice.discount > 0 ? `<p><strong>Discount:</strong> -Rs. ${generatedInvoice.discount.toLocaleString()}</p>` : ""}
        <p style="font-size:18px"><strong>Grand Total:</strong> Rs. ${generatedInvoice.grandTotal.toLocaleString()}</p>
      </div>
      <p><strong>Date:</strong> ${new Date(generatedInvoice.createdAt).toLocaleString()}</p>
      ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
      <div class="footer"><p>Thank you for your business!</p></div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [generatedInvoice, storeProfile, notes]);

  if (generatedInvoice) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 md:p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Invoice Generated!</h2>
          <p className="text-muted-foreground mb-1">{generatedInvoice.invoiceNumber}</p>
          <p className="text-muted-foreground mb-6">for {generatedInvoice.customerName}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <Button onClick={handleDownloadPDF} className="bg-foreground hover:bg-[#D4AF37] hover:text-black text-background">
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
            <Button onClick={handlePrint} variant="outline">
              <Printer className="w-4 h-4 mr-2" /> Print Invoice
            </Button>
            <Button variant="outline" onClick={() => navigate(`/invoice/${generatedInvoice.id}`)}>
              <FileText className="w-4 h-4 mr-2" /> View Invoice
            </Button>
          </div>
          <Button variant="ghost" onClick={clearForm}>
            <Plus className="w-4 h-4 mr-2" /> Create New Invoice
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-[#D4AF37]/10 rounded-lg">
          <Receipt className="w-6 h-6 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Invoice Generator</h1>
          <p className="text-sm text-muted-foreground">Create manual invoices for customers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-[#D4AF37]" />
              <div>
                <h3 className="font-semibold">Search Products</h3>
                <p className="text-xs text-muted-foreground">Find products by name or code</p>
              </div>
            </div>
            <Input
              placeholder="Search product name or product code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery.trim() && (
              <div className="mt-3 max-h-72 overflow-y-auto space-y-2">
                {filteredProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No products found</p>
                ) : (
                  filteredProducts.slice(0, 20).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.product_code && <span className="font-mono">{product.product_code} — </span>}
                          Rs. {product.price.toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addItem(product)}
                      >
                        <PlusIcon className="w-4 h-4 mr-1" /> Add
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-[#D4AF37]" />
              <div>
                <h3 className="font-semibold">Invoice Items</h3>
                <p className="text-xs text-muted-foreground">{invoiceItems.length > 0 ? `${invoiceItems.length} item(s) added` : "No items added yet"}</p>
              </div>
            </div>
            {invoiceItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Search and add products to build your invoice</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-semibold">Product</th>
                      <th className="text-left py-2 px-2 font-semibold">Code</th>
                      <th className="text-center py-2 px-2 font-semibold w-36">Quantity</th>
                      <th className="text-right py-2 px-2 font-semibold">Unit Price</th>
                      <th className="text-right py-2 px-2 font-semibold">Total</th>
                      <th className="py-2 px-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.map((item) => (
                      <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-8 h-8 object-cover rounded" />
                            <span className="font-medium truncate max-w-[180px]">{item.name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-muted-foreground font-mono text-xs">{item.code || "-"}</td>
                        <td className="py-2 px-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 rounded hover:bg-muted transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 text-center border border-border rounded bg-background py-1 text-sm"
                              min="1"
                            />
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 rounded hover:bg-muted transition-colors"
                            >
                              <PlusIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right">Rs. {item.unitPrice.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right font-semibold">Rs. {(item.unitPrice * item.quantity).toLocaleString()}</td>
                        <td className="py-2 px-2">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-[#D4AF37]" />
              <div>
                <h3 className="font-semibold">Customer Details</h3>
                <p className="text-xs text-muted-foreground">Enter customer information</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Customer Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full name"
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label>Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone number"
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label>Email (optional)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Email address"
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label>Address (optional)</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Textarea
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Delivery address"
                    className="pl-9 min-h-[60px]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-5 h-5 text-[#D4AF37]" />
              <div>
                <h3 className="font-semibold">Summary</h3>
                <p className="text-xs text-muted-foreground">Invoice totals</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Discount (Rs.)</Label>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="0"
                />
              </div>
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">Rs. {subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span className="font-semibold">-Rs. {discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Grand Total</span>
                  <span>Rs. {grandTotal.toLocaleString()}</span>
                </div>
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  className="min-h-[60px]"
                />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || invoiceItems.length === 0}
                className="w-full bg-foreground hover:bg-[#D4AF37] hover:text-black text-background"
              >
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><FileText className="w-4 h-4 mr-2" /> Generate Invoice</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
