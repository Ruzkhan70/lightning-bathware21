import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useAdmin } from "../context/AdminContext";

export default function Terms() {
  const { siteContent, storeProfile } = useAdmin();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[#D4AF37] hover:text-[#C5A028] mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8">Terms and Conditions</h1>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="text-gray-600">
              {siteContent.terms.introduction.replace("[Store Name]", `${storeProfile.storeName} ${storeProfile.storeNameAccent}`)}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. General Terms</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              {siteContent.terms.generalTerms.map((term, index) => (
                <li key={index}>{term}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Orders and Payment</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              {siteContent.terms.ordersAndPayment.map((term, index) => (
                <li key={index}>{term}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Delivery</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              {siteContent.terms.delivery.map((term, index) => (
                <li key={index}>{term}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Returns and Refunds</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              {siteContent.terms.returnsAndRefunds.map((term, index) => (
                <li key={index}>{term}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Warranty</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              {siteContent.terms.warranty.map((term, index) => (
                <li key={index}>{term}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Privacy</h2>
            <p className="text-gray-600">
              {siteContent.terms.privacy}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Contact Us</h2>
            <p className="text-gray-600">
              {siteContent.terms.contactInfo}
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-2">
              <li>Phone: {storeProfile.phone}</li>
              <li>Email: {storeProfile.email}</li>
              <li>Address: {storeProfile.addressStreet}, {storeProfile.addressCity}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Updates to Terms</h2>
            <p className="text-gray-600">
              {siteContent.terms.updatesToTerms}
            </p>
          </section>

          <p className="text-sm text-gray-500 pt-4 border-t">
            Last updated: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  );
}
