import { Link } from "react-router";
import {
  Lightbulb,
  Bath,
  Wrench,
  Zap,
  HardHat,
  ArrowRight,
  Star,
  Truck,
  Shield,
  Award,
  Search,
} from "lucide-react";
import { Button } from "../components/ui/button";
import ProductCard from "../components/ProductCard";
import { useAdmin } from "../context/AdminContext";

export default function Home() {
  const { products, getActiveOffers, storeAssets, siteContent, categories } = useAdmin();
  const featuredProducts = products.slice(0, 8);
  const activeOffers = getActiveOffers();

  const activeCategories = categories
    .filter((c) => c.isActive)
    .map((c) => ({
      ...c,
      icon:
        c.name === "Lighting"
          ? Lightbulb
          : c.name === "Bathroom Fittings"
          ? Bath
          : c.name === "Plumbing"
          ? Wrench
          : c.name === "Electrical Hardware"
          ? Zap
          : c.name === "Construction Tools"
          ? HardHat
          : Lightbulb,
      count: products.filter((p) => p.category === c.name).length,
    }));

  const features = [
    {
      icon: Truck,
      title: "Island-wide Delivery",
      description: "Fast and reliable delivery across Sri Lanka",
    },
    {
      icon: Shield,
      title: "Quality Guarantee",
      description: "100% authentic products from trusted brands",
    },
    {
      icon: Award,
      title: "Expert Support",
      description: "Professional advice from our experienced team",
    },
    {
      icon: Star,
      title: "Best Prices",
      description: "Competitive pricing on premium products",
    },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative h-[500px] md:h-[600px] flex items-center bg-black text-white overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 opacity-40 bg-cover bg-center"
          style={{
            backgroundImage: `url('${storeAssets.heroImage}')`,
          }}
        />

        {/* Text Decoration - HARDWARE HARDWARE */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none">
          <div className="text-[120px] md:text-[240px] font-black tracking-tighter text-white opacity-[0.05] flex flex-col items-center">
            <span>HARDWARE</span>
            <span className="-mt-16 md:-mt-32">HARDWARE</span>
          </div>
        </div>

        <div className="relative container mx-auto px-4 py-12 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-7xl font-bold mb-4 leading-tight">
              {siteContent.home.heroTitle}
            </h1>
            <p className="text-base md:text-lg text-gray-300 mb-8 max-w-xl">
              {siteContent.home.heroSubtitle}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/products">
                <Button
                  size="lg"
                  className="bg-[#D4AF37] hover:bg-[#C5A028] text-black font-bold px-8 py-7 text-lg rounded-lg shadow-lg"
                >
                  Shop Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>

              <Link to="/categories">
                <Button
                  size="lg"
                  className="bg-black text-white hover:bg-gray-800 px-8 py-7 text-lg rounded-lg shadow-lg font-bold border-0 transition-all duration-300"
                >
                  {siteContent.home.heroButtonText}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-gray-50 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-6 bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 group"
              >
                <div className="p-3 bg-[#D4AF37] rounded-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Shop by Category
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Explore our wide range of premium products
            </p>
            <div className="w-24 h-1 bg-[#D4AF37] mx-auto mt-6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {activeCategories.map((category, index) => {
              const CategoryIcon = category.icon;
              return (
                <Link
                  key={category.id || index}
                  to={`/products?category=${encodeURIComponent(category.name)}`}
                  className="group relative h-72 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                    style={{ backgroundImage: `url('${category.image}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                  
                  <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                    <div className="transform group-hover:-translate-y-2 transition-transform duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-[#D4AF37] rounded-xl shadow-lg group-hover:bg-white group-hover:rotate-6 transition-all duration-300">
                          <CategoryIcon className="w-7 h-7 text-black" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-1 group-hover:text-[#D4AF37] transition-colors duration-300">
                        {category.name}
                      </h3>
                      <p className="text-gray-300 text-sm font-medium">
                        {category.count} Products
                      </p>
                    </div>
                  </div>

                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#D4AF37] rounded-2xl transition-all duration-300"></div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Active Offers Banner */}
      {activeOffers.length > 0 && (
        <section className="py-16 bg-gradient-to-r from-red-600 via-red-500 to-orange-500">
          <div className="container mx-auto px-4">
            <div className="text-center text-white mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                🎉 Special Offers & Promotions
              </h2>
              <p className="text-lg md:text-xl mb-6">
                Don't miss out on our amazing deals!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {activeOffers.slice(0, 3).map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all group"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={offer.bannerImage}
                      alt={offer.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {offer.discountPercentage && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-xl">
                        -{offer.discountPercentage}%
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{offer.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {offer.description}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Valid until{" "}
                      {new Date(offer.endDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link to="/offers">
                <Button
                  size="lg"
                  className="bg-white hover:bg-gray-100 text-red-600 font-bold text-lg px-8"
                >
                  View All Offers
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Featured Products
            </h2>
            <p className="text-gray-600 text-lg">
              Discover our most popular items
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="text-center">
            <Link to="/products">
              <Button
                size="lg"
                className="bg-black hover:bg-[#D4AF37] text-white"
              >
                View All Products
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Need Help Choosing the Right Product?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Our expert team is ready to assist you with professional advice and
            product recommendations.
          </p>
          <Link to="/contact">
            <Button
              size="lg"
              className="bg-[#D4AF37] hover:bg-[#C5A028] text-black font-bold"
            >
              Contact Us Today
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}