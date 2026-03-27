import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { useAdmin } from "../context/AdminContext";
import { Button } from "../components/ui/button";
import { 
  CheckCircle, XCircle, FileText, Zap, Phone, MapPin, 
  Calendar, User, Clock, DollarSign, Package, Loader2
} from "lucide-react";
import { format } from "date-fns";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

export default function VerifyInvoice() {
  const { id } = useParams();
  const { getInvoiceById, invoices, storeProfile, isDataLoaded } = useAdmin();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"loading" | "found" | "not_found">("loading");

  useEffect(() => {
    const findInvoice = async () => {
      if (!id) {
        setStatus("not_found");
        setLoading(false);
        return;
      }

      // First try local lookup
      let foundInvoice = getInvoiceById(id);
      
      // If not found locally, try Firebase directly
      if (!foundInvoice) {
        try {
          const docRef = doc(db, "invoices", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            foundInvoice = { ...docSnap.data(), id: docSnap.id };
          }
        } catch (error) {
          console.error("Error fetching invoice from Firebase:", error);
        }
      }

      // Also try with hyphens removed
      if (!foundInvoice) {
        const cleanId = id.replace(/-/g, "");
        foundInvoice = getInvoiceById(cleanId);
        
        if (!foundInvoice) {
          try {
            const docRef = doc(db, "invoices", cleanId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              foundInvoice = { ...docSnap.data(), id: docSnap.id };
            }
          } catch (error) {
            console.error("Error fetching invoice:", error);
          }
        }
      }

      if (foundInvoice) {
        setInvoice(foundInvoice);
        setStatus("found");
      } else {
        setStatus("not_found");
      }
      setLoading(false);
    };

    // Wait a bit for Firebase to sync, then find
    const timeout = setTimeout(findInvoice, 1000);
    
    return () => clearTimeout(timeout);
  }, [id, invoices, isDataLoaded]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#D4AF37] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying invoice...</p>
        </div>
      </div>
    );
  }

  if (status === "not_found") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Invoice Not Found</h1>
          <p className="text-gray-600 mb-6">
            This invoice could not be verified. It may not exist or the verification code is incorrect.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Verification ID: <code className="bg-gray-100 px-2 py-1 rounded">{id}</code>
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">If you believe this is an error, please contact:</p>
            <p className="font-semibold mt-1 flex items-center justify-center gap-2">
              <Phone className="w-4 h-4" />
              {storeProfile.phone}
            </p>
          </div>
          <Link to="/">
            <Button className="mt-6 bg-[#D4AF37] hover:bg-[#b8962f] text-white">
              Go to Website
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-8 h-8 text-[#D4AF37]" />
            <span className="text-xl font-bold">{storeProfile.storeName} {storeProfile.storeNameAccent}</span>
          </div>
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">Verified Invoice</h1>
          <p className="text-gray-600">This invoice has been verified as authentic</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#D4AF37] to-[#b8962f] p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Invoice Number</p>
                <p className="text-2xl font-bold">{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-80">Status</p>
                <p className="text-xl font-bold flex items-center gap-2 justify-end">
                  {invoice.paymentStatus === "Paid" ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Paid
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5" />
                      Pending
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <User className="w-4 h-4" /> Customer
                </p>
                <p className="font-semibold">{invoice.customerName}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <Phone className="w-4 h-4" /> Phone
                </p>
                <p className="font-semibold">{invoice.customerPhone}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Date
                </p>
                <p className="font-semibold">{format(new Date(invoice.date), "dd MMM yyyy, HH:mm")}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <Package className="w-4 h-4" /> Items
                </p>
                <p className="font-semibold">{invoice.products.length} product(s)</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Delivery Address
              </p>
              <p className="font-semibold">{invoice.address}</p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#D4AF37]" />
                Order Summary
              </h3>
              <div className="space-y-2">
                {invoice.products.map((product: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{product.name} x {product.quantity}</span>
                    <span className="font-semibold">Rs. {product.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#b8962f]/10 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Subtotal</p>
                  <p className="text-sm">Delivery</p>
                  {invoice.discount > 0 && (
                    <p className="text-sm text-green-600">Discount</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">Rs. {invoice.subtotal.toLocaleString()}</p>
                  <p className="text-sm font-semibold">Rs. {invoice.deliveryCost.toLocaleString()}</p>
                  {invoice.discount > 0 && (
                    <p className="text-sm text-green-600">-Rs. {invoice.discount.toLocaleString()}</p>
                  )}
                </div>
              </div>
              <div className="border-t mt-3 pt-3 flex justify-between items-center">
                <p className="text-xl font-bold">Grand Total</p>
                <p className="text-2xl font-bold text-[#D4AF37]">
                  Rs. {invoice.grandTotal.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                <Zap className="w-4 h-4 text-[#D4AF37]" />
                Verified by Lightning Bathware
                <Zap className="w-4 h-4 text-[#D4AF37]" />
              </p>
              <p className="text-xs text-gray-400 mt-2">
                This invoice was generated on {format(new Date(invoice.createdAt), "dd MMM yyyy HH:mm")}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 flex justify-center">
            <Link to={`/#/invoice/${invoice.id}`}>
              <Button className="bg-[#D4AF37] hover:bg-[#b8962f] text-white">
                <FileText className="w-4 h-4 mr-2" />
                View Full Invoice
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>If you have questions about this invoice, contact us:</p>
          <p className="font-semibold mt-1 flex items-center justify-center gap-2">
            <Phone className="w-4 h-4" />
            {storeProfile.phone}
          </p>
          <p className="flex items-center justify-center gap-2 mt-1">
            <MapPin className="w-4 h-4" />
            {storeProfile.addressStreet}, {storeProfile.addressCity}
          </p>
        </div>
      </div>
    </div>
  );
}
