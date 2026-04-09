import { useState, useEffect, useMemo, useCallback } from "react";
import { setMetaTags } from "../utils/seo";
import { useSearchParams } from "react-router";
import { Filter, X, Search, Star } from "lucide-react";
import ProductCard from "../components/ProductCard";
import RecentlyViewed from "../components/RecentlyViewed";
import { useAdmin } from "../context/AdminContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
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
  const [customMinPrice, setCustomMinPrice] = useState<number | "">("");
  const [customMaxPrice, setCustomMaxPrice] = useState<number | "">("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [localSearch, setLocalSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // Get unique brands from products
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    safeProducts.forEach(p => {
      if (p.brand) brands.add(p.brand);
    });
    return Array.from(brands).sort();
  }, [safeProducts]);

  // Rating options
  const ratingOptions = [5, 4, 3, 2, 1];

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const toggleRating = (rating: number) => {
    setSelectedRatings(prev =>
      prev.includes(rating)
        ? prev.filter(r => r !== rating)
        : [...prev, rating]
    );
  };

  // Initialize category from URL params ONCE on mount
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, []); // Only run once on mount

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

    // Search filter from URL params OR local search
    const searchQuery = searchParams.get("search") || debouncedSearch;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.description.toLowerCase().includes(lowerQuery) ||
          p.category.toLowerCase().includes(lowerQuery) ||
          (p.brand && p.brand.toLowerCase().includes(lowerQuery))
      );
    }

    // Category filter - from URL params OR selected category
    const categoryParam = searchParams.get("category");
    const activeCategory = categoryParam || selectedCategory;
    if (activeCategory && activeCategory !== "all" && activeCategory !== "All Categories") {
      result = result.filter((p) => p.category === activeCategory);
    }

    // Price range filter - preset ranges
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

    // Custom price range filter
    if (customMinPrice !== "" || customMaxPrice !== "") {
      result = result.filter((p) => {
        const min = customMinPrice !== "" ? p.price >= customMinPrice : true;
        const max = customMaxPrice !== "" ? p.price <= customMaxPrice : true;
        return min && max;
      });
    }

    // Brand filter
    if (selectedBrands.length > 0) {
      result = result.filter((p) => p.brand && selectedBrands.includes(p.brand));
    }

    // Rating filter
    if (selectedRatings.length > 0) {
      result = result.filter((p) => p.rating && selectedRatings.some(r => p.rating! >= r));
    }

    // Sort (create a copy to avoid mutating original)
    if (sortBy === "price-low") {
      return [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      return [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      return [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "rating") {
      return [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [safeProducts, searchParams, selectedCategory, sortBy, priceRange, customMinPrice, customMaxPrice, selectedBrands, selectedRatings, debouncedSearch]);

  useEffect(() => {
    setMetaTags(
      "Our Products | Lightning Bathware",
      "Browse our extensive collection of premium lighting, bathroom fittings, plumbing, and electrical hardware at Lightning Bathware."
    );
  }, []);

  const clearFilters = () => {
    setSelectedCategory("all");
    setSortBy("default");
    setPriceRange("all");
    setCustomMinPrice("");
    setCustomMaxPrice("");
    setSelectedBrands([]);
    setSelectedRatings([]);
    setLocalSearch("");
    setDebouncedSearch("");
  };

  const hasActiveFilters = selectedCategory !== "all" || priceRange !== "all" || 
    customMinPrice !== "" || customMaxPrice !== "" || 
    selectedBrands.length > 0 || selectedRatings.length > 0 || 
    debouncedSearch !== "";

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
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg">Filters</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-[#D4AF37] hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Search Filter */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Search</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
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
                        onChange={() => {
                          setPriceRange(range.value);
                          setCustomMinPrice("");
                          setCustomMaxPrice("");
                        }}
                        className="w-4 h-4 accent-[#D4AF37]"
                      />
                      <span>{range.label}</span>
                    </label>
                  ))}
                </div>
                {/* Custom Price Range */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Custom Range</p>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={customMinPrice}
                      onChange={(e) => {
                        setCustomMinPrice(e.target.value ? Number(e.target.value) : "");
                        setPriceRange("all");
                      }}
                      className="w-full"
                    />
                    <span className="text-gray-400">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={customMaxPrice}
                      onChange={(e) => {
                        setCustomMaxPrice(e.target.value ? Number(e.target.value) : "");
                        setPriceRange("all");
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Brand Filter */}
              {availableBrands.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Brand</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {availableBrands.map((brand) => (
                      <label
                        key={brand}
                        className="flex items-center gap-2 cursor-pointer hover:text-[#D4AF37] transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => toggleBrand(brand)}
                          className="w-4 h-4 accent-[#D4AF37]"
                        />
                        <span className="text-sm">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Rating Filter */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Rating</h3>
                <div className="space-y-2">
                  {ratingOptions.map((rating) => (
                    <label
                      key={rating}
                      className="flex items-center gap-2 cursor-pointer hover:text-[#D4AF37] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRatings.includes(rating)}
                        onChange={() => toggleRating(rating)}
                        className="w-4 h-4 accent-[#D4AF37]"
                      />
                      <span className="flex items-center gap-1">
                        {[...Array(rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                        {[...Array(5 - rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-gray-300" />
                        ))}
                        <span className="text-sm ml-1">& up</span>
                      </span>
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
                  <SelectItem value="rating">
                    Highest Rated
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

                {/* Search Filter */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Search</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search products..."
                      value={localSearch}
                      onChange={(e) => setLocalSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
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
                          onChange={() => {
                            setPriceRange(range.value);
                            setCustomMinPrice("");
                            setCustomMaxPrice("");
                          }}
                          className="w-4 h-4 accent-[#D4AF37]"
                        />
                        <span>{range.label}</span>
                      </label>
                    ))}
                  </div>
                  {/* Custom Price Range */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">Custom Range</p>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={customMinPrice}
                        onChange={(e) => {
                          setCustomMinPrice(e.target.value ? Number(e.target.value) : "");
                          setPriceRange("all");
                        }}
                        className="w-full"
                      />
                      <span className="text-gray-400">-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={customMaxPrice}
                        onChange={(e) => {
                          setCustomMaxPrice(e.target.value ? Number(e.target.value) : "");
                          setPriceRange("all");
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Brand Filter */}
                {availableBrands.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3">Brand</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableBrands.map((brand) => (
                        <label
                          key={brand}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedBrands.includes(brand)}
                            onChange={() => toggleBrand(brand)}
                            className="w-4 h-4 accent-[#D4AF37]"
                          />
                          <span className="text-sm">{brand}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rating Filter */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Rating</h3>
                  <div className="space-y-2">
                    {ratingOptions.map((rating) => (
                      <label
                        key={rating}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRatings.includes(rating)}
                          onChange={() => toggleRating(rating)}
                          className="w-4 h-4 accent-[#D4AF37]"
                        />
                        <span className="flex items-center gap-1">
                          {[...Array(rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                          {[...Array(5 - rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-gray-300" />
                          ))}
                          <span className="text-sm ml-1">& up</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      clearFilters();
                    }}
                    className="flex-1"
                    variant="outline"
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={() => setShowMobileFilters(false)}
                    className="flex-1"
                  >
                    Apply
                  </Button>
                </div>
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
