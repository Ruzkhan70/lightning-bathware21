import { Link } from "react-router";
import { useEffect } from "react";
import { setMetaTags } from "../utils/seo";
import { AnimatePresence } from "framer-motion";
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
  ArrowRight,
  List,
  Settings,
  Cog,
  SprayCan,
  PaintBucket,
  Flame,
  Shield,
  Pencil,
  Leaf,
} from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { Button } from "../components/ui/button";
import ScrollAnimation from "../components/ScrollAnimation";
import { CategoryGridSkeleton, Skeleton } from "../components/Skeleton";

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

export default function Categories() {
  const { products, categories, siteContent, isDataLoaded } = useAdmin();

  useEffect(() => {
    setMetaTags(
      "Product Categories | Lightning Bathware",
      "Explore our comprehensive range of hardware products organized by category, including Lighting, Bathroom Fittings, Plumbing, and more."
    );
  }, []);
  
  const safeProducts = products || [];
  const safeCategories = categories || [];

  const activeCategories = safeCategories.filter(c => c.isActive);

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="bg-black text-white py-16 animate-pulse">
          <div className="container mx-auto px-4 text-center">
            <Skeleton className="h-12 w-64 mx-auto mb-4 bg-gray-700" />
            <Skeleton className="h-6 w-96 mx-auto bg-gray-700" />
          </div>
        </section>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <CategoryGridSkeleton count={6} />
          </div>
        </section>
      </div>
    );
  }

  // Map icon names to Lucide icons
  const getIcon = (iconName?: string, categoryName?: string) => {
    const name = (iconName as string) || "";
    if (name && ICON_MAP[name]) {
      return ICON_MAP[name];
    }
    // Fallback to category name matching
    const lower = (categoryName || "").toLowerCase();
    if (lower.includes("light")) return Lightbulb;
    if (lower.includes("bath") || lower.includes("shower") || lower.includes("toilet")) return Bath;
    if (lower.includes("plumb") || lower.includes("valve") || lower.includes("drain") || lower.includes("water") || lower.includes("tap") || lower.includes("mixer")) return Wrench;
    if (lower.includes("electr") || lower.includes("gas") || lower.includes("power")) return Zap;
    if (lower.includes("construct") || lower.includes("tool") || lower.includes("paint") || lower.includes("hardhat") || lower.includes("appliance")) return HardHat;
    if (lower.includes("droplets") || lower.includes("waves")) return Droplets;
    if (lower.includes("paintbrush") || lower.includes("paint")) return Paintbrush;
    if (lower.includes("package")) return Package;
    if (lower.includes("settings") || lower.includes("cog")) return Cog;
    if (lower.includes("flame") || lower.includes("fire")) return Flame;
    return List;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-black text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {siteContent.categories.heroTitle}
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            {siteContent.categories.heroSubtitle}
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeCategories.map((category, index) => {
              const iconValue = category.icon;
              const iconName = typeof iconValue === "string" ? iconValue : "";
              const CategoryIcon = getIcon(iconName, category.name);
              const productCount = safeProducts.filter((p) => p.category === category.name).length;
              const isUrlIcon = iconName.startsWith("http");
              
              return (
                <ScrollAnimation key={category.id || index} animation="slideUp" delay={index * 100}>
                  <div className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full">
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-3 ${category.color} rounded-lg`}>
                            {isUrlIcon ? (
                              <img src={iconName} alt={category.name} className="w-6 h-6 object-contain" />
                            ) : (
                              <CategoryIcon className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <h2 className="text-2xl font-bold text-white">
                            {category.name}
                          </h2>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <p className="text-gray-600 mb-4">{category.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {productCount} {siteContent.categories.productsAvailable}
                        </span>
                        <Link
                          to={`/products?category=${encodeURIComponent(
                            category.name
                          )}`}
                        >
                          <Button className="bg-black hover:bg-[#D4AF37] text-white">
                            {siteContent.categories.browseButton}
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </ScrollAnimation>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <ScrollAnimation animation="slideUp">
        <section className="py-16 bg-black text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {siteContent.categories.ctaTitle}
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              {siteContent.categories.ctaSubtitle}
            </p>
            <Link to="/contact">
              <Button
                size="lg"
                className="bg-[#D4AF37] hover:bg-[#C5A028] text-black font-bold"
              >
                {siteContent.categories.contactButton}
              </Button>
            </Link>
          </div>
        </section>
      </ScrollAnimation>
    </div>
  );
}
