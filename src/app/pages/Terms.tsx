import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useAdmin } from "../context/AdminContext";

export default function Terms() {
  const { siteContent, storeProfile } = useAdmin();
  const { terms } = siteContent;

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
            <h2 className="text-2xl font-bold mb-4">Introduction</h2>
            <p className="text-gray-600">
              {terms.introduction?.replace("[Store Name]", `${storeProfile.storeName} ${storeProfile.storeNameAccent}`) || "Welcome to our store."}
            </p>
          </section>

          {terms.sections && terms.sections.map((section, index) => (
            <section key={section.id || index}>
              <h2 className="text-2xl font-bold mb-4">{index + 1}. {section.title}</h2>
              <div className="text-gray-600 whitespace-pre-line">
                {section.content}
              </div>
            </section>
          ))}

          <section>
            <h2 className="text-2xl font-bold mb-4">
              {terms.sections ? terms.sections.length + 1 : 1}. Contact Information
            </h2>
            <p className="text-gray-600 mb-4">
              For any questions regarding these terms, please contact us:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Phone: {storeProfile.phone}</li>
              <li>Email: {storeProfile.email}</li>
              <li>Address: {storeProfile.addressStreet}, {storeProfile.addressCity}</li>
            </ul>
          </section>

          <p className="text-sm text-gray-500 pt-4 border-t">
            Last updated: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  );
}
