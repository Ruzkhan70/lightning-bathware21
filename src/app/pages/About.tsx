import { Target, Eye, Users, Award } from "lucide-react";
import { useAdmin } from "../context/AdminContext";

export default function About() {
  const { storeAssets, siteContent } = useAdmin();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-black text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About Us</h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Sri Lanka's trusted name in quality hardware and building materials
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-16">
              <div>
                <img
                  src={storeAssets.aboutStoryImage}
                  alt="Our Store"
                  className="rounded-lg shadow-xl"
                />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-4">{siteContent.about.storyTitle}</h2>
                <p className="text-gray-600 mb-4">
                  {siteContent.about.storyText}
                </p>
              </div>
            </div>

            {/* Mission & Vision */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <div className="w-16 h-16 bg-[#D4AF37] rounded-lg flex items-center justify-center mb-6">
                  <Target className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                <p className="text-gray-600">
                  To provide Sri Lanka with the highest quality hardware
                  products at competitive prices, backed by exceptional customer
                  service and expert knowledge. We strive to be the one-stop
                  solution for all building and home improvement needs.
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg shadow-lg">
                <div className="w-16 h-16 bg-[#D4AF37] rounded-lg flex items-center justify-center mb-6">
                  <Eye className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                <p className="text-gray-600">
                  To become Sri Lanka's leading hardware retailer, known for
                  innovation, reliability, and customer satisfaction. We aim to
                  set new standards in the industry through continuous
                  improvement and embracing new technologies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-10 h-10 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Quality</h3>
              <p className="text-gray-600 text-sm">
                We never compromise on product quality and authenticity
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Customer First</h3>
              <p className="text-gray-600 text-sm">
                Customer satisfaction is at the heart of our business
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-10 h-10 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Integrity</h3>
              <p className="text-gray-600 text-sm">
                Honest, transparent business practices in all we do
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-10 h-10 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Innovation</h3>
              <p className="text-gray-600 text-sm">
                Constantly evolving to serve you better
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-black text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-[#D4AF37] mb-2">
                10+
              </div>
              <div className="text-gray-300">Years of Experience</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-[#D4AF37] mb-2">
                350+
              </div>
              <div className="text-gray-300">Products</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-[#D4AF37] mb-2">
                5000+
              </div>
              <div className="text-gray-300">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-[#D4AF37] mb-2">
                100%
              </div>
              <div className="text-gray-300">Authentic Products</div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Image */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{siteContent.about.teamTitle}</h2>
            <p className="text-gray-600 text-lg mb-8">
              {siteContent.about.teamText}
            </p>
            <img
              src={storeAssets.aboutTeamImage}
              alt="Our Team"
              className="rounded-lg shadow-xl"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
