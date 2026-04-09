import { useState } from "react";
import { useNavigate } from "react-router";
import { Building2, User, Mail, Phone, FileText, Clock, DollarSign, Send, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import { db } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { setMetaTags } from "../utils/seo";

interface BulkOrderForm {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  projectType: string;
  timeline: string;
  estimatedBudget: string;
  productRequirements: string;
  additionalNotes: string;
}

const projectTypes = [
  "Residential Construction",
  "Commercial Building",
  "Hotel/Resort",
  "Office Renovation",
  "Retail Store",
  "Industrial Facility",
  "Government Project",
  "Other"
];

const timelines = [
  "Urgent (< 1 week)",
  "1-2 weeks",
  "1 month",
  "2-3 months",
  "3+ months",
  "Ongoing/Recurring"
];

export default function BulkOrder() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<BulkOrderForm>({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    projectType: "",
    timeline: "",
    estimatedBudget: "",
    productRequirements: "",
    additionalNotes: ""
  });

  setMetaTags(
    "Bulk Order Inquiry | Lightning Bathware",
    "Request a quote for bulk orders and large projects"
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.companyName.trim()) {
      toast.error("Company name is required");
      return false;
    }
    if (!formData.contactPerson.trim()) {
      toast.error("Contact person name is required");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!formData.productRequirements.trim()) {
      toast.error("Please describe your product requirements");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, "bulkOrders"), {
        ...formData,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      toast.success("Your inquiry has been submitted! We will contact you within 24 hours.");
      
      setFormData({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        projectType: "",
        timeline: "",
        estimatedBudget: "",
        productRequirements: "",
        additionalNotes: ""
      });
    } catch (error) {
      console.error("Error submitting bulk order:", error);
      toast.error("Failed to submit inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Bulk Order Inquiry</h1>
            <p className="text-gray-600">
              Request a quote for your construction project, renovation, or bulk purchase.
              Our team will respond within 24 hours with a customized quote.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
            <div className="space-y-6">
              {/* Company Information */}
              <div className="border-b pb-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#D4AF37]" />
                  Company Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">
                      Company Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="ABC Construction Ltd."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPerson">
                      Contact Person <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contactPerson"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="border-b pb-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#D4AF37]" />
                  Contact Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@company.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="0771234567"
                    />
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <div className="border-b pb-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#D4AF37]" />
                  Project Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="projectType">Project Type</Label>
                    <select
                      id="projectType"
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    >
                      <option value="">Select project type</option>
                      {projectTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="timeline">Timeline</Label>
                    <select
                      id="timeline"
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    >
                      <option value="">Select timeline</option>
                      {timelines.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="estimatedBudget">Estimated Budget (LKR)</Label>
                  <Input
                    id="estimatedBudget"
                    name="estimatedBudget"
                    type="text"
                    value={formData.estimatedBudget}
                    onChange={handleInputChange}
                    placeholder="e.g., 500,000 - 1,000,000"
                  />
                </div>
              </div>

              {/* Product Requirements */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#D4AF37]" />
                  Product Requirements <span className="text-red-500">*</span>
                </h2>
                <Textarea
                  id="productRequirements"
                  name="productRequirements"
                  value={formData.productRequirements}
                  onChange={handleInputChange}
                  placeholder="Please list the products you need, quantities, and any specific requirements (e.g., 50 units of Chrome Bath Faucet, 100m of LED strip lights for hotel project, etc.)"
                  rows={5}
                  required
                />
              </div>

              {/* Additional Notes */}
              <div>
                <Label htmlFor="additionalNotes">Additional Notes</Label>
                <Textarea
                  id="additionalNotes"
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleInputChange}
                  placeholder="Any other details, special requirements, or questions..."
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#D4AF37] hover:bg-[#C5A028] text-black font-bold py-6 text-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Submit Inquiry
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-8 bg-blue-50 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-3">What happens next?</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>Our team reviews your inquiry within 24 hours</span>
              </li>
              <li className="flex items-start gap-2">
                <DollarSign className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>We prepare a customized quote based on your requirements</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>We contact you to discuss details and answer any questions</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
