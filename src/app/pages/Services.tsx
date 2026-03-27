import { Truck, Headphones, Wrench, Award, Clock, Shield } from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import ScrollAnimation from "../components/ScrollAnimation";

export default function Services() {
  const { siteContent, storeProfile } = useAdmin();
  
  const icons = [Truck, Headphones, Wrench, Award, Clock, Shield];
  const services = siteContent.services.items.map((item, index) => ({
    icon: icons[index] || Truck,
    title: item.title,
    description: item.description,
    features: item.features || [],
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-black text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{siteContent.services.title}</h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            {siteContent.services.subtitle}
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <ScrollAnimation animation="slideUp">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <ScrollAnimation key={index} animation="slideUp" delay={index * 100}>
                  <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                    <div className="w-16 h-16 bg-[#D4AF37] rounded-lg flex items-center justify-center mb-6">
                      <service.icon className="w-8 h-8 text-black" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                    <p className="text-gray-600 mb-6">{service.description}</p>
                    <ul className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#D4AF37] mt-1">✓</span>
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </ScrollAnimation>
              ))}
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <ScrollAnimation animation="slideUp">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Choose {storeProfile.storeName} {storeProfile.storeNameAccent}?
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Your trusted partner for quality hardware solutions in Sri Lanka
              </p>
            </div>
          </ScrollAnimation>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              { num: "1", title: "Wide Product Range", desc: "Over 350+ premium products across lighting, bathroom, plumbing, electrical, and construction categories." },
              { num: "2", title: "Competitive Pricing", desc: "Best prices in the market with special discounts for bulk orders and contractors." },
              { num: "3", title: "Expert Team", desc: "Professional staff with years of experience in the hardware industry, ready to assist you." },
              { num: "4", title: "Customer Satisfaction", desc: "Thousands of satisfied customers trust us for their hardware needs across Sri Lanka." },
            ].map((item, index) => (
              <ScrollAnimation key={index} animation="slideUp" delay={index * 100}>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-black font-bold text-xl">{item.num}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <ScrollAnimation animation="slideUp">
        <section className="py-16 bg-black text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Contact us today to learn more about our services and how we can
              help with your project
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href={`tel:${storeProfile.phone}`}>
                <button className="px-8 py-3 bg-[#D4AF37] hover:bg-[#C5A028] text-black font-bold rounded-lg transition-colors hover:scale-105">
                  Call: {storeProfile.phone}
                </button>
              </a>
              <a href={`mailto:${storeProfile.email}`}>
                <button className="px-8 py-3 bg-white hover:bg-gray-100 text-black font-bold rounded-lg transition-colors hover:scale-105">
                  Email Us
                </button>
              </a>
            </div>
          </div>
        </section>
      </ScrollAnimation>
    </div>
  );
}
