import { Link } from "react-router";
import { motion, useInView } from "framer-motion";
import {
  Lightbulb,
  Bath,
  Wrench,
  Zap,
  HardHat,
  Hammer,
  Drill,
  Cable,
  Power,
  Gauge,
  ArrowRight,
  Star,
  Truck,
  Shield,
  Award,
  Search,
  PartyPopper,
  Droplets,
  Waves,
  Paintbrush,
  Scissors,
  Package,
  Box,
  Timer,
  Thermometer,
  Fan,
  Snowflake,
  Settings,
  Cog,
  SprayCan,
  PaintBucket,
  Flame,
  Pencil,
  Leaf,
} from "lucide-react";
import { Button } from "../components/ui/button";
import ProductCard from "../components/ProductCard";
import { useAdmin } from "../context/AdminContext";
import ScrollAnimation from "../components/ScrollAnimation";
import { useState, useEffect, useRef, useMemo } from "react";
import { setMetaTags } from "../utils/seo";
import { HeroSkeleton, ProductGridSkeleton, Skeleton } from "../components/Skeleton";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Lightbulb,
  Bath,
  Wrench,
  Zap,
  HardHat,
  Hammer,
  Drill,
  Cable,
  Power,
  Gauge,
  Droplets,
  Waves,
  Paintbrush,
  Scissors,
  Package,
  Box,
  Timer,
  Thermometer,
  Fan,
  Snowflake,
  Settings,
  Cog,
  SprayCan,
  PaintBucket,
  Flame,
  Shield,
  Pencil,
  Leaf,
};

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
  const { products, getActiveOffers, storeAssets, siteContent, categories, storeProfile, isDataLoaded } = useAdmin();
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const safeProducts = products || [];
  const safeCategories = categories || [];

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen">
        <HeroSkeleton />
        <div className="container mx-auto px-4 py-16">
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-64" />
              </div>
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
          </div>
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    );
  }
  
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
      img.onerror = () => setHeroImageLoaded(true);
      img.src = storeAssets.heroImage;
    }
  }, [storeAssets.heroImage]);

  // Memoize featured products
  const featuredProducts = useMemo(
    () => safeProducts.slice(0, 8),
    [safeProducts]
  );

  // Memoize active offers
  const activeOffers = useMemo(
    () => getActiveOffers() || [],
    [getActiveOffers]
  );

  // Memoize active categories with icon mapping
  const activeCategories = useMemo(() => {
    return safeCategories
      .filter((c) => c.isActive)
      .map((c) => {
        const isIconImage = c.icon && (c.icon.startsWith("http") || c.icon.startsWith("/"));
        let iconComponent;
        if (isIconImage) {
          iconComponent = c.icon;
        } else {
          iconComponent =
            c.icon === "Bath"
              ? Bath
              : c.icon === "Wrench"
              ? Wrench
              : c.icon === "Zap"
              ? Zap
              : c.icon === "HardHat"
              ? HardHat
              : c.icon === "Hammer"
              ? Hammer
              : c.icon === "Drill"
              ? Drill
              : c.icon === "Cable"
              ? Cable
              : c.icon === "Power"
              ? Power
              : c.icon === "Gauge"
              ? Gauge
              : Lightbulb;
        }
        return {
          ...c,
          icon: iconComponent,
          isIconImage,
          count: safeProducts.filter((p) => p.category === c.name).length,
        };
      });
  }, [safeCategories, safeProducts]);

  // Memoize features array (only visible ones)
  const features = useMemo(() => {
    const featureIcons = [Truck, Shield, Award, Star];
    return siteContent.home.features
      .filter(f => f.isVisible !== false)
      .map((f, index) => ({
        icon: featureIcons[index] || Star,
        title: f.title,
        description: f.description,
      }));
  }, [siteContent.home.features]);

  // Memoize stats array (only visible ones)
  const stats = useMemo(() => {
    const visibleStats = [];
    if (storeProfile.statsYearsExperienceVisible !== false) {
      visibleStats.push({ value: storeProfile.statsYearsExperience, label: siteContent.about.statsLabels.years });
    }
    if (storeProfile.statsProductsVisible !== false) {
      visibleStats.push({ value: storeProfile.statsProducts, label: siteContent.about.statsLabels.products });
    }
    if (storeProfile.statsCustomersVisible !== false) {
      visibleStats.push({ value: storeProfile.statsCustomers, label: siteContent.about.statsLabels.customers });
    }
    if (storeProfile.statsAuthenticVisible !== false) {
      visibleStats.push({ value: storeProfile.statsAuthentic, label: siteContent.about.statsLabels.authentic });
    }
    return visibleStats;
  }, [storeProfile.statsYearsExperience, storeProfile.statsProducts, storeProfile.statsCustomers, storeProfile.statsAuthentic, storeProfile.statsYearsExperienceVisible, storeProfile.statsProductsVisible, storeProfile.statsCustomersVisible, storeProfile.statsAuthenticVisible, siteContent.about.statsLabels]);

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
            animate={{ opacity: heroImageLoaded ? 0.85 : 0 }}
            transition={{ duration: 0.5 }}
          />
        )}

        {/* Left Side Black Shadow Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/25 to-transparent" />
        
        {/* Subtle Top/Bottom Fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/5" />

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
                  {siteContent.home.shopNowText}
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
                {siteContent.home.shopByCategoryTitle}
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                {siteContent.home.shopByCategorySubtitle}
              </p>
              <div className="w-24 h-1 bg-[#D4AF37] mx-auto mt-6"></div>
            </div>
          </ScrollAnimation>

          <ScrollAnimation animation="slideUp" delay={200}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {activeCategories.map((category) => {
                const iconValue = category.icon;
                const iconName = typeof iconValue === "string" ? iconValue : "";
                const catName = category.name || "";
                
                // Get icon from map, fallback to category name matching
                let IconComponent = ICON_MAP[iconName];
                if (!IconComponent) {
                  const lower = catName.toLowerCase();
                  if (lower.includes("light")) IconComponent = Lightbulb;
                  else if (lower.includes("bath") || lower.includes("shower")) IconComponent = Bath;
                  else if (lower.includes("plumb") || lower.includes("valve") || lower.includes("drain") || lower.includes("tap") || lower.includes("mixer")) IconComponent = Wrench;
                  else if (lower.includes("electr") || lower.includes("gas") || lower.includes("power")) IconComponent = Zap;
                  else if (lower.includes("construct") || lower.includes("tool") || lower.includes("hardhat") || lower.includes("paint")) IconComponent = HardHat;
                  else if (lower.includes("droplet")) IconComponent = Droplets;
                  else if (lower.includes("package") || lower.includes("accessory")) IconComponent = Package;
                  else if (lower.includes("cog") || lower.includes("settings")) IconComponent = Cog;
                  else if (lower.includes("flame") || lower.includes("gas")) IconComponent = Flame;
                  else IconComponent = Lightbulb;
                }
                
                const isUrlIcon = iconName.startsWith("http");
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
                            {isUrlIcon ? (
                              <img src={iconName} alt={category.name} className="w-7 h-7 object-contain" />
                            ) : (
                              <IconComponent className="w-7 h-7 text-black" />
                            )}
                          </div>
                        </div>
                        <h3 className="text-xl font-bold mb-1 group-hover:text-[#D4AF37] transition-colors duration-300">
                          {category.name}
                        </h3>
                        <p className="text-gray-300 text-sm font-medium">
                          {category.count} {siteContent.home.productsCount}
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
                {siteContent.home.specialOffersTitle}
              </h2>
              <p className="text-lg md:text-xl mb-6">
                {siteContent.home.specialOffersSubtitle}
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
                {siteContent.home.featuredProductsTitle}
              </h2>
              <p className="text-gray-600 text-lg">
                {siteContent.home.featuredProductsSubtitle}
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
                {siteContent.home.viewAllProductsText}
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
            {siteContent.home.ctaTitle}
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            {siteContent.home.ctaSubtitle}
          </p>
          <Link to="/contact">
            <Button
              size="lg"
              className="bg-[#D4AF37] hover:bg-[#C5A028] text-black font-bold"
            >
              {siteContent.home.contactUsText}
            </Button>
          </Link>
        </div>
      </section>
    </motion.div>
  );
}
