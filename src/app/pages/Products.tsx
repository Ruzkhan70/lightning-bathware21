import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Filter, X } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { useAdmin } from "../context/AdminContext";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import LoadingScreen from "../components/LoadingScreen";

export default function Products() {
  const [searchParams] = useSearchParams();
  const { products, isDataLoaded } = useAdmin();
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  if (!isDataLoaded) {
    return <LoadingScreen />;
  }

  const categories = [
    "All Categories",
    "Lighting",
    "Bathroom Fittings",
    "Plumbing",
    "Electrical Hardware",
    "Construction Tools",
  ];

  const priceRanges = [
    { label: "All Prices", value: "all" },
    { label: "Under Rs. 5,000", value: "0-5000" },
    { label: "Rs. 5,000 - Rs. 10,000", value: "5000-10000" },
    { label: "Rs. 10,000 - Rs. 20,000", value: "10000-20000" },
    { label: "Above Rs. 20,000", value: "20000+" },
  ];

  useEffect(() => {
    let result = [...products];

    // Search filter from URL params
    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter from URL params
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setSelectedCategory(categoryParam);
      result = result.filter((p) => p.category === categoryParam);
    } else if (selectedCategory !== "all" && selectedCategory !== "All Categories") {
      result = result.filter((p) => p.category === selectedCategory);
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

    // Sort
    if (sortBy === "price-low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredProducts(result);
  }, [products, searchParams, selectedCategory, sortBy, priceRange]);

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
            Our Products
          </h1>
          <p className="text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
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
                  {categories.map((category) => (
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
                    {categories.map((category) => (
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
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-xl text-gray-600 mb-4">
                  No products found matching your criteria
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
