import { useState, useEffect, useMemo } from "react";
import { setMetaTags } from "../utils/seo";
import { useSearchParams } from "react-router";
import { Filter, X } from "lucide-react";
import ProductCard from "../components/ProductCard";
import RecentlyViewed from "../components/RecentlyViewed";
import { useAdmin } from "../context/AdminContext";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ProductGridSkeleton } from "../components/Skeleton";
import EmptyState, { ProductsEmpty, SearchEmpty } from "../components/EmptyState";

export default function Products() {
  const [searchParams] = useSearchParams();
  const { products, categories, isDataLoaded } = useAdmin();
  const safeProducts = products || [];
  const safeCategories = categories || [];
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Update category from URL params when it changes
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory("all");
    }
  }, [searchParams]);

  // Memoize active categories to prevent recalculation
  const activeCategories = useMemo(() => [
    "All Categories",
    ...safeCategories.filter(cat => cat.isActive).map(cat => cat.name),
  ], [safeCategories]);

  const priceRanges = [
    { label: "All Prices", value: "all" },
    { label: "Under Rs. 5,000", value: "0-5000" },
    { label: "Rs. 5,000 - Rs. 10,000", value: "5000-10000" },
    { label: "Rs. 10,000 - Rs. 20,000", value: "10000-20000" },
    { label: "Above Rs. 20,000", value: "20000+" },
  ];

  // Use useMemo for filtered products - more efficient than useEffect
  const filteredProducts = useMemo(() => {
    let result = [...safeProducts];

    // Search filter from URL params
    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.description.toLowerCase().includes(lowerQuery) ||
          p.category.toLowerCase().includes(lowerQuery)
      );
    }

    // Category filter - from URL params OR selected category
    const categoryParam = searchParams.get("category");
    const activeCategory = categoryParam || selectedCategory;
    if (activeCategory && activeCategory !== "all" && activeCategory !== "All Categories") {
      result = result.filter((p) => p.category === activeCategory);
    }

    // Price range filter
    if (priceRange !== "all") {
      if (priceRange === "0-5000") {
        result = result.filter((p) => p.price < 5000);
      } else if (priceRange === "5000-10000") {
        result = result.filter((p) => p.price >= 5000 && p.price < 10000);
      } else if (priceRange === "10000-20000") {
        result = result.filter((p) => p.price >= 10000 && p.price < 20000);
      } else if (priceRange === "20000+") {
        result = result.filter((p) => p.price >= 20000);
      }
    }

    // Sort (create a copy to avoid mutating original)
    if (sortBy === "price-low") {
      return [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      return [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      return [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [safeProducts, searchParams, selectedCategory, sortBy, priceRange]);

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    const searchParam = searchParams.get("search");
    
    if (categoryParam) {
      const category = safeCategories.find(c => c.name === categoryParam);
      if (category) {
        setMetaTags(
          `${category.name} | Lightning Bathware`,
          `Shop our premium ${category.name.toLowerCase()} products. ${category.description || `Browse our extensive collection of ${category.name.toLowerCase()} at Lightning Bathware.`}`
        );
      } else {
        setMetaTags(
          `${categoryParam} | Lightning Bathware`,
          `Browse our ${categoryParam} products at Lightning Bathware.`
        );
      }
    } else if (searchParam) {
      setMetaTags(
        `Search: ${searchParam} | Lightning Bathware`,
        `Search results for "${searchParam}" - Browse our premium products at Lightning Bathware.`
      );
    } else {
      setMetaTags(
        "Our Products | Lightning Bathware",
        "Browse our extensive collection of premium lighting, bathroom fittings, plumbing, and electrical hardware at Lightning Bathware."
      );
    }
  }, [searchParams, safeCategories]);

  const clearFilters = () => {
    setSelectedCategory("all");
    setSortBy("default");
    setPriceRange("all");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {searchParams.get("category") || searchParams.get("search") ? (
              <>
                {searchParams.get("category") && (
                  <span>{searchParams.get("category")}</span>
                )}
                {searchParams.get("search") && !searchParams.get("category") && (
                  <span>Search: "{searchParams.get("search")}"</span>
                )}
              </>
            ) : (
              "Our Products"
            )}
          </h1>
          {!isDataLoaded ? (
            <div className="h-6 w-48 bg-gray-200 animate-pulse rounded"></div>
          ) : (
            <p className="text-gray-600">
              Showing {filteredProducts.length} of {safeProducts.length} products
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0 self-start sticky top-24">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-[#D4AF37] hover:underline"
                >
                  Clear All
                </button>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Category</h3>
                <div className="space-y-2">
                  {activeCategories.map((category) => (
                    <label
                      key={category}
                      className="flex items-center gap-2 cursor-pointer hover:text-[#D4AF37] transition-colors"
                    >
                      <input
                        type="radio"
                        name="category"
                        checked={
                          selectedCategory === category ||
                          (selectedCategory === "all" &&
                            category === "All Categories")
                        }
                        onChange={() =>
                          setSelectedCategory(
                            category === "All Categories" ? "all" : category
                          )
                        }
                        className="w-4 h-4 accent-[#D4AF37]"
                      />
                      <span>{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Price Range</h3>
                <div className="space-y-2">
                  {priceRanges.map((range) => (
                    <label
                      key={range.value}
                      className="flex items-center gap-2 cursor-pointer hover:text-[#D4AF37] transition-colors"
                    >
                      <input
                        type="radio"
                        name="price"
                        checked={priceRange === range.value}
                        onChange={() => setPriceRange(range.value)}
                        className="w-4 h-4 accent-[#D4AF37]"
                      />
                      <span>{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter Button & Sort */}
            <div className="flex items-center justify-between mb-6 gap-4">
              <Button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                variant="outline"
                className="lg:hidden"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="price-low">Price (Low to High)</SelectItem>
                  <SelectItem value="price-high">
                    Price (High to Low)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mobile Filters */}
            {showMobileFilters && (
              <div className="lg:hidden bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-lg">Filters</h2>
                  <button onClick={() => setShowMobileFilters(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Category</h3>
                  <div className="space-y-2">
                  {activeCategories.map((category) => (
                      <label
                        key={category}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="category-mobile"
                          checked={
                            selectedCategory === category ||
                            (selectedCategory === "all" &&
                              category === "All Categories")
                          }
                          onChange={() =>
                            setSelectedCategory(
                              category === "All Categories" ? "all" : category
                            )
                          }
                          className="w-4 h-4 accent-[#D4AF37]"
                        />
                        <span>{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Price Range</h3>
                  <div className="space-y-2">
                    {priceRanges.map((range) => (
                      <label
                        key={range.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="price-mobile"
                          checked={priceRange === range.value}
                          onChange={() => setPriceRange(range.value)}
                          className="w-4 h-4 accent-[#D4AF37]"
                        />
                        <span>{range.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => {
                    clearFilters();
                    setShowMobileFilters(false);
                  }}
                  className="w-full"
                  variant="outline"
                >
                  Clear All Filters
                </Button>
              </div>
            )}

            {/* Products Grid */}
            {!isDataLoaded ? (
              <ProductGridSkeleton count={8} />
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8">
                {searchParams.get("search") ? (
                  <SearchEmpty query={searchParams.get("search") || undefined} />
                ) : (
                  <ProductsEmpty />
                )}
              </div>
            )}

            {/* Recently Viewed Products */}
            <div className="mt-12">
              <RecentlyViewed />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
