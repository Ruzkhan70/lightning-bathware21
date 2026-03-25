import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";

export default function Contact() {
  const { siteContent } = useAdmin();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    toast.success("Message sent successfully! We'll get back to you soon.");
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    });
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Visit Us",
      details: ["No. 456, Galle Road", "Colombo 00300", "Sri Lanka"],
    },
    {
      icon: Phone,
      title: "Call Us",
      details: ["+94 11 234 5678", "+94 77 123 4567", "Mon-Sat: 9AM - 6PM"],
    },
    {
      icon: Mail,
      title: "Email Us",
      details: [
        "info@lightingbathware.lk",
        "sales@lightingbathware.lk",
        "support@lightingbathware.lk",
      ],
    },
    {
      icon: Clock,
      title: "Business Hours",
      details: [
        "Monday - Friday: 9:00 AM - 6:00 PM",
        "Saturday: 9:00 AM - 4:00 PM",
        "Sunday: Closed",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-black text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{siteContent.contact.title}</h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            {siteContent.contact.subtitle}
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow"
              >
                <div className="w-16 h-16 bg-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-4">
                  <info.icon className="w-8 h-8 text-black" />
                </div>
                <h3 className="font-bold text-lg mb-3">{info.title}</h3>
                {info.details.map((detail, idx) => (
                  <p key={idx} className="text-gray-600 text-sm">
                    {detail}
                  </p>
                ))}
              </div>
            ))}
          </div>

          {/* Contact Form & Map */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name">
                    Your Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                </div>

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
                    required
                    className="mt-1"
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
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="message">
                    Message <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    className="mt-1"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-black hover:bg-[#D4AF37] text-white"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Send Message
                </Button>
              </form>
            </div>

            {/* Map */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Find Us</h2>
              <div className="aspect-video bg-gray-200 rounded-lg mb-6 overflow-hidden">
                <iframe
                  src={siteContent.contact.mapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Store Location"
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-lg">Store Location</h3>
                <p className="text-gray-600">
                  Visit our showroom to explore our full range of products.
                  Our friendly staff will be happy to assist you with product
                  selection and technical advice.
                </p>
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Parking Available</h4>
                  <p className="text-sm text-gray-600">
                    Free parking available for customers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="border-b pb-6">
                <h3 className="font-bold text-lg mb-2">
                  Do you offer technical support?
                </h3>
                <p className="text-gray-600">
                  Yes, our expert team provides comprehensive technical support and
                  product guidance to help you choose the right products for your needs.
                </p>
              </div>
              <div className="border-b pb-6">
                <h3 className="font-bold text-lg mb-2">
                  What is your return policy?
                </h3>
                <p className="text-gray-600">
                  We accept returns within 7 days of purchase for unopened
                  items in original packaging. Some restrictions may apply.
                </p>
              </div>
              <div className="border-b pb-6">
                <h3 className="font-bold text-lg mb-2">
                  Do you offer bulk discounts?
                </h3>
                <p className="text-gray-600">
                  Yes, we offer special pricing for bulk orders and contractors.
                  Please contact our sales team for a custom quote.
                </p>
              </div>
              <div className="pb-6">
                <h3 className="font-bold text-lg mb-2">
                  How long does delivery take?
                </h3>
                <p className="text-gray-600">
                  Delivery within Colombo typically takes 1-2 business days.
                  Islandwide delivery takes 3-5 business days depending on
                  location.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
