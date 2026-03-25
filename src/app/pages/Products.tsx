import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
import { Filter, X } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { useAdmin, Product } from "../context/AdminContext";
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
  const [showLoading, setShowLoading] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    if (isDataLoaded) {
      const timer = setTimeout(() => {
        setShowLoading(false);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [isDataLoaded]);

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

    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      result = result.filter((p) => p.category === categoryParam);
    } else if (selectedCategory !== "all" && selectedCategory !== "All Categories") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    const priceParam = searchParams.get("price");
    if (priceParam) {
      result = result.filter((p) => {
        if (priceParam === "0-5000") return p.price < 5000;
        if (priceParam === "5000-10000") return p.price >= 5000 && p.price <= 10000;
        if (priceParam === "10000-20000") return p.price > 10000 && p.price <= 20000;
        if (priceParam === "20000+") return p.price > 20000;
        return true;
      });
    }

    if (sortBy === "price-low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredProducts(result);
  }, [products, selectedCategory, sortBy, searchParams]);

  if (!isDataLoaded || showLoading) {
    return <LoadingScreen />;
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Our Products</h1>
          <p className="text-gray-600">
            Browse our collection of premium products
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Filters</h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="lg:hidden text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Price Range</label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priceRanges.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="name">Name: A to Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(selectedCategory !== "all" || priceRange !== "all" || sortBy !== "default") && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedCategory("all");
                      setPriceRange("all");
                      setSortBy("default");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600">
                Showing {filteredProducts.length} product
                {filteredProducts.length !== 1 && "s"}
              </p>
              <Button
                variant="outline"
                className="lg:hidden"
                onClick={() => setShowMobileFilters(true)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500 mb-4">No products found</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory("all");
                    setPriceRange("all");
                    setSortBy("default");
                  }}
                >
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
