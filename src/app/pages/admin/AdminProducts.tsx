import { useState, useEffect, useMemo } from "react";
import { Edit, Trash2, Search, CheckSquare, Square, X, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import ImageUpload from "../../components/admin/ImageUpload";
import { useAdmin } from "../../context/AdminContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";
import { useSearchParams } from "react-router";

export default function AdminProducts() {
  const { products, updateProduct, deleteProduct, bulkDeleteProducts, categories } = useAdmin();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStock, setFilterStock] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editVariants, setEditVariants] = useState<{color: string; images: string[]}[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [formData, setFormData] = useState<{
    name: string;
    category: string;
    price: number;
    isAvailable: boolean;
    description: string;
    image: string;
    has_variants: boolean;
    variants: { color: string; images: string[] }[];
  }>({
    name: "",
    category: "",
    price: 0,
    isAvailable: true,
    description: "",
    image: "",
    has_variants: false,
    variants: [],
  });

  const safeProducts = products || [];
  const safeCategories = categories || [];

  useEffect(() => {
    const filterParam = searchParams.get("filter");
    if (filterParam === "unavailable") {
      setFilterStock("unavailable");
    } else if (filterParam === "available") {
      setFilterStock("available");
    }
  }, [searchParams]);

  const filteredProducts = safeProducts.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || p.category === filterCategory;
    const matchesAvailability = filterStock === "all" ||
      (filterStock === "available" && p.isAvailable) ||
      (filterStock === "unavailable" && !p.isAvailable);
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const pageRanges = useMemo(() => {
    const ranges: { label: string; start: number; end: number }[] = [];
    for (let i = 0; i < totalPages; i++) {
      ranges.push({
        label: `${i * ITEMS_PER_PAGE + 1}-${Math.min((i + 1) * ITEMS_PER_PAGE, filteredProducts.length)}`,
        start: i * ITEMS_PER_PAGE,
        end: Math.min((i + 1) * ITEMS_PER_PAGE, filteredProducts.length),
      });
    }
    return ranges;
  }, [totalPages]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleSelectAll = () => {
    if (selectedProducts.length === paginatedProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(paginatedProducts.map(p => p.id));
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
      bulkDeleteProducts(selectedProducts);
      toast.success(`${selectedProducts.length} products deleted!`);
      setSelectedProducts([]);
      setShowBulkActions(false);
    }
  };

  const handleEdit = (productId: string) => {
    const product = safeProducts.find((p) => p.id === productId);
    if (product) {
      const variants = product.variants || [];
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        isAvailable: product.isAvailable,
        description: product.description,
        image: product.image,
        has_variants: product.has_variants || false,
        variants: variants,
      });
      setEditVariants(variants);
      setEditingProduct(productId);
    }
  };

  const updateVariantColor = (index: number, color: string) => {
    setEditVariants(prev => prev.map((v, i) => i === index ? { ...v, color } : v));
  };

  const addVariantImage = async (index: number, file: File) => {
    try {
      const formDataImg = new FormData();
      formDataImg.append("image", file);
      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`,
        { method: "POST", body: formDataImg }
      );
      const data = await response.json();
      if (data.success) {
        setEditVariants(prev => prev.map((v, i) => 
          i === index ? { ...v, images: [...v.images, data.data.url] } : v
        ));
      }
    } catch (error) {
      const url = URL.createObjectURL(file);
      setEditVariants(prev => prev.map((v, i) => 
        i === index ? { ...v, images: [...v.images, url] } : v
      ));
    }
  };

  const removeVariantImage = (variantIndex: number, imageIndex: number) => {
    setEditVariants(prev => prev.map((v, i) => 
      i === variantIndex ? { ...v, images: v.images.filter((_, idx) => idx !== imageIndex) } : v
    ));
  };

  const addNewVariant = () => {
    setEditVariants(prev => [...prev, { color: "", images: [] }]);
  };

  const removeVariant = (index: number) => {
    if (editVariants.length > 1) {
      setEditVariants(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleUpdate = () => {
    if (!editingProduct) return;

    if (!formData.name || !formData.category || formData.price <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    const updatedData = {
      ...formData,
      variants: editVariants,
      has_variants: editVariants.length > 0,
      image: editVariants.length > 0 && editVariants[0].images.length > 0 
        ? editVariants[0].images[0] 
        : formData.image,
    };

    updateProduct(editingProduct, updatedData);
    toast.success("Product updated successfully!");
    setEditingProduct(null);
  };

  const handleDelete = (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProduct(productId);
      toast.success("Product deleted successfully!");
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Products Management</h1>
          <p className="text-gray-600">Manage your product inventory</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-[#D4AF37]">
            {safeProducts.length} Products
          </div>
          {selectedProducts.length > 0 && (
            <Button
              onClick={() => setShowBulkActions(true)}
              variant="outline"
              className="border-[#D4AF37] text-[#D4AF37]"
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              {selectedProducts.length} Selected
            </Button>
          )}
        </div>
      </div>

      {filterStock === "unavailable" && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">Unavailable Products</p>
              <p className="text-sm text-red-600">
                Showing unavailable products
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <Select value={filterCategory} onValueChange={(val) => { setFilterCategory(val); setCurrentPage(1); }}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {safeCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStock} onValueChange={(val) => { setFilterStock(val); setCurrentPage(1); }}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="unavailable">Not Available</SelectItem>
            </SelectContent>
          </Select>

          {(filterCategory !== "all" || filterStock !== "all" || searchQuery) && (
            <Button
              variant="ghost"
              onClick={() => {
                setFilterCategory("all");
                setFilterStock("all");
                setSearchQuery("");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {showBulkActions && selectedProducts.length > 0 && (
        <div className="mb-6 bg-[#D4AF37] text-black rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="font-semibold">
            {selectedProducts.length} products selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedProducts([]);
                setShowBulkActions(false);
              }}
              className="bg-white border-black text-black hover:bg-gray-100"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-4 px-4 w-12">
                  <button
                    onClick={handleSelectAll}
                    className="text-gray-600 hover:text-[#D4AF37] transition-colors"
                  >
                    {selectedProducts.length === filteredProducts.length && filteredProducts.length > 0 ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="text-left py-4 px-4 font-semibold">Image</th>
                <th className="text-left py-4 px-4 font-semibold">Name</th>
                <th className="text-left py-4 px-4 font-semibold">Category</th>
                <th className="text-left py-4 px-4 font-semibold">Price</th>
                <th className="text-left py-4 px-4 font-semibold">Stock</th>
                <th className="text-left py-4 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product) => (
                <tr key={product.id} className={`border-b hover:bg-gray-50 transition-colors ${selectedProducts.includes(product.id) ? 'bg-[#D4AF37]/10' : ''}`}>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleSelectProduct(product.id)}
                      className="text-gray-600 hover:text-[#D4AF37] transition-colors"
                    >
                      {selectedProducts.includes(product.id) ? (
                        <CheckSquare className="w-5 h-5 text-[#D4AF37]" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-semibold">{product.name}</div>
                    <div className="text-sm text-gray-500 truncate">
                      {product.description}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      {product.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold">
                    Rs. {product.price.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      product.isAvailable
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {product.isAvailable ? "Available" : "Not Available"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(product.id)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4 py-3 border-t">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} products
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex gap-1">
                {pageRanges.map((range, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      currentPage === index + 1
                        ? "bg-[#D4AF37] text-black font-medium"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No products found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {/* Select All Card for Mobile */}
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">
            {selectedProducts.length} of {filteredProducts.length} selected
          </span>
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 text-[#D4AF37] font-medium text-sm"
          >
            {selectedProducts.length === filteredProducts.length && filteredProducts.length > 0 ? (
              <>
                <Square className="w-4 h-4" />
                Deselect All
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4" />
                Select All
              </>
            )}
          </button>
        </div>

        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className={`bg-white rounded-lg shadow-sm p-4 border-2 transition-all ${
              selectedProducts.includes(product.id)
                ? 'border-[#D4AF37]'
                : 'border-transparent'
            }`}
          >
            <div className="flex gap-4">
              {/* Checkbox */}
              <button
                onClick={() => handleSelectProduct(product.id)}
                className="flex-shrink-0 pt-1"
              >
                {selectedProducts.includes(product.id) ? (
                  <CheckSquare className="w-5 h-5 text-[#D4AF37]" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Image */}
              <img
                src={product.image}
                alt={product.name}
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{product.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                    {product.category}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    product.isAvailable
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {product.isAvailable ? "Available" : "Not Available"}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-gray-900">
                    Rs. {product.price.toLocaleString()}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(product.id)}
                      className="h-9 min-w-9 px-2"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(product.id)}
                      className="h-9 min-w-9 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500">No products found matching your criteria</p>
          </div>
        )}
      </div>

      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Product Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger id="edit-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {safeCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price">Price (Rs.)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Availability</Label>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isAvailable: true })}
                    className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                      formData.isAvailable
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 text-gray-500"
                    }`}
                  >
                    Available
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isAvailable: false })}
                    className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                      !formData.isAvailable
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-200 text-gray-500"
                    }`}
                  >
                    Not Available
                  </button>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div>
              <ImageUpload
                label="Product Image"
                value={formData.image}
                onChange={(val) => setFormData({ ...formData, image: val })}
              />
            </div>

            {/* Color Variants Section */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">
                  Color Variants ({editVariants.length})
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addNewVariant}
                >
                  + Add Color
                </Button>
              </div>

              <div className="space-y-4">
                {editVariants.map((variant, idx) => (
                  <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        value={variant.color}
                        onChange={(e) => updateVariantColor(idx, e.target.value)}
                        placeholder="Color name (e.g., Black, White)"
                        className="flex-1"
                      />
                      {editVariants.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariant(idx)}
                          className="text-red-500"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {variant.images.map((img, imgIdx) => (
                        <div key={imgIdx} className="relative group">
                          <img 
                            src={img} 
                            alt={`${variant.color} ${imgIdx + 1}`} 
                            className="w-16 h-16 object-cover rounded" 
                          />
                          <button
                            type="button"
                            onClick={() => removeVariantImage(idx, imgIdx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-[#D4AF37] hover:bg-gray-50">
                        <span className="text-gray-400 text-xs">+Add</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) addVariantImage(idx, file);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProduct(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} className="bg-black hover:bg-[#D4AF37]">
              Update Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
