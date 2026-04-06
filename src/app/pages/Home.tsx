import { Link } from "react-router";
import { motion, useInView } from "framer-motion";
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
  PartyPopper,
} from "lucide-react";
import { Button } from "../components/ui/button";
import ProductCard from "../components/ProductCard";
import { useAdmin } from "../context/AdminContext";
import ScrollAnimation from "../components/ScrollAnimation";
import { useState, useEffect, useRef } from "react";
import { setMetaTags } from "../utils/seo";

function AnimatedCounter({ value }: { value: string }) {
  const [displayValue, setDisplayValue] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    const match = value.match(/^([\d,]+)(.*)$/);
    if (!match) {
      setDisplayValue(value);
      return;
    }

    const targetNum = parseInt(match[1].replace(/,/g, ''));
    const suffix = match[2];
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += 1;
      const progress = current / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentNum = Math.round(targetNum * eased);
      
      setDisplayValue(currentNum.toLocaleString() + suffix);
      
      if (current >= steps) {
        clearInterval(timer);
        setDisplayValue(targetNum.toLocaleString() + suffix);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return <span ref={ref}>{displayValue}</span>;
}

export default function Home() {
  const { products, getActiveOffers, storeAssets, siteContent, categories, storeProfile } = useAdmin();
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const safeProducts = products || [];
  const safeCategories = categories || [];
  
  useEffect(() => {
    setMetaTags(
      "Home | Lightning Bathware - Sri Lanka's Premier Hardware Store",
      "Welcome to Lightning Bathware, your one-stop shop for premium lighting, bathroom fittings, plumbing, and electrical hardware in Sri Lanka."
    );
  }, []);

  useEffect(() => {
    if (storeAssets.heroImage && storeAssets.heroImage.trim() !== "") {
      const img = new Image();
      img.onload = () => setHeroImageLoaded(true);
      img.src = storeAssets.heroImage;
    }
  }, [storeAssets.heroImage]);

  const featuredProducts = safeProducts.slice(0, 8);
  const activeOffers = getActiveOffers() || [];

  const activeCategories = safeCategories
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
      count: safeProducts.filter((p) => p.category === c.name).length,
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

  const stats = [
    { value: storeProfile.statsYearsExperience, label: "Years of Experience" },
    { value: storeProfile.statsProducts, label: "Products" },
    { value: storeProfile.statsCustomers, label: "Happy Customers" },
    { value: storeProfile.statsAuthentic, label: "Authentic Products" },
  ];

  const statsRef = useRef(null);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white"
    >
      {/* Hero Section */}
      <section className="relative h-[500px] md:h-[600px] flex items-center bg-gray-900 text-white overflow-hidden">
        {/* Background Image - Brighter */}
        {storeAssets.heroImage && (
          <motion.div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('${storeAssets.heroImage}')`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: heroImageLoaded ? 0.7 : 0 }}
            transition={{ duration: 0.5 }}
          />
        )}

        {/* Left Side Black Shadow Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        
        {/* Subtle Top/Bottom Fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20" />

        <div className="relative container mx-auto px-4 py-12 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-7xl font-bold mb-4 leading-tight drop-shadow-lg">
              {siteContent.home.heroTitle}
            </h1>
            <p className="text-base md:text-lg text-gray-100 mb-8 max-w-xl drop-shadow-md">
              {siteContent.home.heroSubtitle}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/products">
                <Button
                  size="lg"
                  className="bg-[#D4AF37] hover:bg-[#C5A028] text-black font-bold px-8 py-7 text-lg rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  Shop Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>

              <Link to="/categories">
                <Button
                  size="lg"
                  className="bg-transparent text-[#D4AF37] border-[1.5px] border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black hover:scale-105 px-8 py-7 text-lg rounded-lg shadow-lg font-bold transition-all duration-300"
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
              <ScrollAnimation key={index} animation="slideUp" delay={index * 100}>
                <div className="flex items-start gap-4 p-6 bg-white rounded-lg shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                  <div className="p-3 bg-[#D4AF37] rounded-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <feature.icon className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-black text-white" ref={statsRef}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <ScrollAnimation key={index} animation="fadeIn" delay={index * 100}>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-[#D4AF37] mb-2">
                    <AnimatedCounter value={stat.value} />
                  </div>
                  <div className="text-gray-300 text-sm md:text-base">
                    {stat.label}
                  </div>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <ScrollAnimation animation="slideUp">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                Shop by Category
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Explore our wide range of premium products
              </p>
              <div className="w-24 h-1 bg-[#D4AF37] mx-auto mt-6"></div>
            </div>
          </ScrollAnimation>

          <ScrollAnimation animation="slideUp" delay={200}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {activeCategories.map((category) => {
                const CategoryIcon = category.icon;
                return (
                  <Link
                    key={category.id}
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
          </ScrollAnimation>
        </div>
      </section>

      {/* Active Offers Banner */}
      {activeOffers.length > 0 && (
        <section className="py-16 bg-gradient-to-r from-red-600 via-red-500 to-orange-500">
          <div className="container mx-auto px-4">
            <div className="text-center text-white mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 flex items-center gap-2">
                <PartyPopper className="w-8 h-8 text-yellow-300" />
                Special Offers & Promotions
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
          <ScrollAnimation animation="slideUp">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Featured Products
              </h2>
              <p className="text-gray-600 text-lg">
                Discover our most popular items
              </p>
            </div>
          </ScrollAnimation>

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
    </motion.div>
  );
}
