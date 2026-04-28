import { useState, useEffect } from "react";
import { setMetaTags } from "../utils/seo";
import { MapPin, Phone, Mail, Clock, Send, Facebook, Instagram, Twitter } from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import ScrollAnimation from "../components/ScrollAnimation";

export default function Contact() {
  const { siteContent, storeProfile, addMessage } = useAdmin();
  
  const enabledSocials = [
    { name: 'Facebook', icon: Facebook, enabled: storeProfile.facebookEnabled, url: storeProfile.facebookUrl, color: 'bg-blue-600' },
    { name: 'Instagram', icon: Instagram, enabled: storeProfile.instagramEnabled, url: storeProfile.instagramUrl, color: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400' },
    { name: 'Twitter', icon: Twitter, enabled: storeProfile.twitterEnabled, url: storeProfile.twitterUrl, color: 'bg-black' },
  ].filter(s => s.enabled && s.url && s.url !== "#");

  useEffect(() => {
    setMetaTags(
      "Contact Us | Lightning Bathware - Get in Touch",
      "Contact the expert team at Lightning Bathware for personalized recommendations, product advice, or bulk orders. Visit our showroom or call us today."
    );
  }, []);
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (formData.phone) {
      const phoneRegex = /^(\+94|0)[1-9][0-9]{8}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        toast.error("Please enter a valid Sri Lankan phone number (e.g., 0771234567)");
        return;
      }
    }

    try {
      await addMessage({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        subject: formData.subject || undefined,
        message: formData.message,
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: siteContent.contact.visitTitle,
      details: [storeProfile.addressStreet, storeProfile.addressCity, siteContent.contact.country],
    },
    {
      icon: Phone,
      title: siteContent.contact.callTitle,
      details: [storeProfile.phone, storeProfile.secondaryPhone],
    },
    {
      icon: Mail,
      title: siteContent.contact.emailTitle,
      details: [
        storeProfile.email,
        ...(storeProfile.showSalesEmail === true ? [storeProfile.salesEmail] : []),
        ...(storeProfile.showSupportEmail === true ? [storeProfile.supportEmail] : []),
      ].filter(Boolean),
    },
    {
      icon: Clock,
      title: siteContent.contact.hoursTitle,
      details: [
        siteContent.contact.weekdayHours,
        siteContent.contact.saturdayHours,
        siteContent.contact.sundayHours,
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
              <ScrollAnimation key={index} animation="slideUp" delay={index * 100}>
                <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
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
              </ScrollAnimation>
            ))}
          </div>

          {/* Contact Form & Map */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <ScrollAnimation animation="slideUp">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-6">{siteContent.contact.formTitle}</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name">
                    {siteContent.contact.nameLabel} <span className="text-red-500">*</span>
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
                    {siteContent.contact.emailLabel} <span className="text-red-500">*</span>
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
                  <Label htmlFor="phone">{siteContent.contact.phoneLabel}</Label>
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
                  <Label htmlFor="subject">{siteContent.contact.subjectLabel}</Label>
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
                    {siteContent.contact.messageLabel} <span className="text-red-500">*</span>
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
                  {siteContent.contact.sendButton}
                </Button>
                </form>
              </div>
            </ScrollAnimation>

            {/* Find Us Section */}
            <ScrollAnimation animation="slideUp" delay={100}>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-6">{siteContent.contact.findUsTitle}</h2>
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

                {siteContent.contact.showFindUsSection && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg">{siteContent.contact.storeLocationTitle}</h3>
                    <p className="text-gray-600">
                      {siteContent.contact.storeLocationDesc}
                    </p>
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-2">{siteContent.contact.parkingTitle}</h4>
                      <p className="text-sm text-gray-600">
                        {siteContent.contact.parkingDesc}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      {siteContent.contact.showSocialSection && enabledSocials.length > 0 && (
        <section className="py-12 bg-gradient-to-r from-gray-900 to-gray-800">
          <div className="container mx-auto px-4">
            <ScrollAnimation animation="slideUp">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{siteContent.contact.socialSectionTitle}</h2>
                <p className="text-gray-300">{siteContent.contact.socialSectionSubtitle}</p>
              </div>
              <div className="flex justify-center gap-4 flex-wrap">
                {enabledSocials.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition-all hover:scale-105 ${social.color}`}
                  >
                    <social.icon className="w-5 h-5" />
                    <span>{social.name}</span>
                  </a>
                ))}
              </div>
            </ScrollAnimation>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <ScrollAnimation animation="slideUp">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">
                {siteContent.faq.title}
              </h2>
              <div className="space-y-6">
                {siteContent.faq.items.map((item, index) => (
                  <ScrollAnimation key={index} animation="slideUp" delay={index * 100}>
                    <div className={index < siteContent.faq.items.length - 1 ? "border-b pb-6" : "pb-6"}>
                      <h3 className="font-bold text-lg mb-2">
                        {item.question}
                      </h3>
                      <p className="text-gray-600">
                        {item.answer}
                      </p>
                    </div>
                  </ScrollAnimation>
                ))}
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>
    </div>
  );
}
