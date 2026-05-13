import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Edit, Trash2, Search, CheckSquare, Square, X, Filter, ChevronLeft, ChevronRight, Download, Upload, Scale, Eye, Check, Copy, GripVertical } from "lucide-react";
import ImageUpload from "../../components/admin/ImageUpload";
import { uploadImage } from "../../../lib/imageUpload";
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
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableProductRow({ product, isSelected, onSelect, onEdit, onDelete, compareMode, compareProducts, onToggleCompare, copyToClipboard }: {
  product: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  compareMode: boolean;
  compareProducts: string[];
  onToggleCompare: (id: string) => void;
  copyToClipboard: (code: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className={`border-b hover:bg-muted/50 transition-colors ${isSelected ? 'bg-[#D4AF37]/10' : ''} ${isDragging ? 'shadow-lg border-[#D4AF37]' : 'border-border'}`}>
      <td className="py-3 px-2 w-10">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 inline-flex">
          <GripVertical className="w-4 h-4" />
        </div>
      </td>
      <td className="py-3 px-4 w-12">
        <button
          onClick={() => onSelect(product.id)}
          className="text-muted-foreground hover:text-[#D4AF37] transition-colors"
        >
          {isSelected ? (
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
        <div className="text-sm text-muted-foreground truncate">
          {product.description}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
            {product.product_code || "—"}
          </span>
          {product.product_code && (
            <button
              onClick={() => copyToClipboard(product.product_code!)}
              className="p-1 rounded hover:bg-muted/80 transition-colors"
              title="Copy code"
            >
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="px-3 py-1 bg-muted rounded-full text-sm">
          {product.category}
        </span>
      </td>
      <td className="py-3 px-4 font-semibold">
        Rs. {product.price.toLocaleString()}
      </td>
      <td className="py-3 px-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          product.isAvailable
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
        }`}>
          {product.isAvailable ? "Available" : "Not Available"}
        </span>
      </td>
      {compareMode && (
        <td className="py-3 px-4">
          <button
            onClick={() => onToggleCompare(product.id)}
            className={`p-2 rounded transition-colors ${
              compareProducts.includes(product.id)
                ? "bg-[#D4AF37] text-black"
                : "bg-muted text-muted-foreground hover:border-border"
            }`}
          >
            <Scale className="w-4 h-4" />
          </button>
        </td>
      )}
      <td className="py-3 px-4">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(product.id)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm" variant="outline"
            onClick={() => onDelete(product.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default function AdminProducts() {
  const { products, updateProduct, deleteProduct, bulkDeleteProducts, categories, storeProfile, reorderProducts } = useAdmin();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStock, setFilterStock] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editVariants, setEditVariants] = useState<{color: string; images: string[]}[]>([]);
  const [editSizes, setEditSizes] = useState<{size: string; images: string[]}[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareProducts, setCompareProducts] = useState<string[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleCompareProduct = (productId: string) => {
    setCompareProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : prev.length < 4
          ? [...prev, productId]
          : prev
    );
  };

  const handleViewCompare = () => {
    if (compareProducts.length < 2) {
      toast.error("Select at least 2 products to compare");
      return;
    }
    // Store selected products in localStorage for ComparePage
    const compareItems = safeProducts.filter(p => compareProducts.includes(p.id));
    localStorage.setItem("compareList", JSON.stringify(compareItems));
    window.open("/compare", "_blank");
  };

  const handleExportCSV = () => {
    const headers = ["name", "category", "price", "isAvailable", "description"];
    const csvContent = [
      headers.join(","),
      ...safeProducts.map(p => [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category.replace(/"/g, '""')}"`,
        p.price,
        p.isAvailable,
        `"${p.description.replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `products_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Products exported successfully!");
  };
  
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0].split(",");
      
      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, "").replace(/""/g, '"'));
        if (values.length >= 3) {
          imported++;
        }
      }
      
      toast.success(`${imported} products ready to import (use bulk upload for full import)`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied: ${text}`);
  };

  const [formData, setFormData] = useState<{
    name: string;
    category: string;
    price: number;
    isAvailable: boolean;
    description: string;
    image: string;
    has_variants: boolean;
    has_sizes: boolean;
    variants: { color: string; images: string[] }[];
    sizes: { size: string; images: string[] }[];
  }>({
    name: "",
    category: "",
    price: 0,
    isAvailable: true,
    description: "",
    image: "",
    has_variants: false,
    has_sizes: false,
    variants: [],
    sizes: [],
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
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.product_code && p.product_code.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === "all" || p.category === filterCategory;
    const matchesAvailability = filterStock === "all" ||
      (filterStock === "available" && p.isAvailable) ||
      (filterStock === "unavailable" && !p.isAvailable);
    return matchesSearch && matchesCategory && matchesAvailability;
  }).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = paginatedProducts.findIndex(p => p.id === active.id);
    const newIndex = paginatedProducts.findIndex(p => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(paginatedProducts, oldIndex, newIndex);
    setIsSavingOrder(true);
    reorderProducts(reordered).finally(() => setIsSavingOrder(false));
  }, [paginatedProducts, reorderProducts]);

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
      const sizes = product.sizes || [];
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        isAvailable: product.isAvailable,
        description: product.description,
        image: product.image,
        has_variants: product.has_variants || false,
        has_sizes: product.has_sizes || false,
        variants: variants,
        sizes: sizes,
      });
      setEditVariants(variants);
      setEditSizes(sizes);
      setEditingProduct(productId);
    }
  };

  const updateVariantColor = (index: number, color: string) => {
    setEditVariants(prev => prev.map((v, i) => i === index ? { ...v, color } : v));
  };

  const addVariantImage = async (index: number, file: File) => {
    try {
      const url = await uploadImage(file);
      setEditVariants(prev => prev.map((v, i) => 
        i === index ? { ...v, images: [...v.images, url] } : v
      ));
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

  const updateSizeName = (index: number, size: string) => {
    setEditSizes(prev => prev.map((s, i) => i === index ? { ...s, size } : s));
  };

  const addSizeImage = async (index: number, file: File) => {
    try {
      const url = await uploadImage(file);
      setEditSizes(prev => prev.map((s, i) => 
        i === index ? { ...s, images: [...s.images, url] } : s
      ));
    } catch (error) {
      const url = URL.createObjectURL(file);
      setEditSizes(prev => prev.map((s, i) => 
        i === index ? { ...s, images: [...s.images, url] } : s
      ));
    }
  };

  const removeSizeImage = (sizeIndex: number, imageIndex: number) => {
    setEditSizes(prev => prev.map((s, i) => 
      i === sizeIndex ? { ...s, images: s.images.filter((_, idx) => idx !== imageIndex) } : s
    ));
  };

  const addNewSize = () => {
    setEditSizes(prev => [...prev, { size: "", images: [] }]);
  };

  const removeSize = (index: number) => {
    if (editSizes.length > 1) {
      setEditSizes(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleUpdate = () => {
    if (!editingProduct) return;

    if (!formData.name || !formData.category || formData.price <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    let mainImage = formData.image;
    if (editVariants.length > 0 && editVariants[0].images.length > 0) {
      mainImage = editVariants[0].images[0];
    } else if (editSizes.length > 0 && editSizes[0].images.length > 0) {
      mainImage = editSizes[0].images[0];
    }

    const updatedData = {
      ...formData,
      variants: editVariants,
      sizes: editSizes,
      has_variants: editVariants.length > 0,
      has_sizes: editSizes.length > 0,
      image: mainImage,
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
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-[#D4AF37]">
            {safeProducts.length} Products
          </div>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="border-border"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="border-border"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          {storeProfile?.enableCompareFeature === true && (
          <Button
            variant={compareMode ? "default" : "outline"}
            onClick={() => {
              setCompareMode(!compareMode);
              if (!compareMode) setCompareProducts([]);
            }}
            className={compareMode ? "bg-[#D4AF37] text-black" : "border-border"}
          >
            {compareMode ? <Check className="w-4 h-4 mr-2" /> : <Scale className="w-4 h-4 mr-2" />}
            Compare {compareMode && `(${compareProducts.length})`}
          </Button>
          )}
          {compareMode && compareProducts.length >= 2 && (
            <Button
              onClick={handleViewCompare}
              className="bg-[#D4AF37] text-black"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Compare
            </Button>
          )}
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
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-200">Unavailable Products</p>
              <p className="text-sm text-red-600 dark:text-red-400">
                Showing unavailable products
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
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
              className="bg-card border-black text-black hover:bg-muted"
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
      <div className="hidden md:block bg-card rounded-lg shadow-lg overflow-hidden">
        {!searchQuery && (
          <div className="bg-gradient-to-r from-[#D4AF37]/10 to-transparent px-4 py-3 border-b border-[#D4AF37]/20 flex items-center gap-3">
            <GripVertical className="w-5 h-5 text-[#D4AF37]" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Drag & Drop to Reorder</h3>
              <p className="text-xs text-muted-foreground">Drag the grip handle to set product display order</p>
            </div>
            {isSavingOrder && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Saving...
              </div>
            )}
          </div>
        )}
        {searchQuery && (
          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-3 flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            Drag-and-drop is disabled while searching. Clear search to reorder.
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="py-4 px-2 w-10"></th>
                <th className="py-4 px-4 w-12">
                  <button
                    onClick={handleSelectAll}
                    className="text-muted-foreground hover:text-[#D4AF37] transition-colors"
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
                <th className="text-left py-4 px-4 font-semibold">Product Code</th>
                <th className="text-left py-4 px-4 font-semibold">Category</th>
                <th className="text-left py-4 px-4 font-semibold">Price</th>
<th className="text-left py-4 px-4 font-semibold">Stock</th>
                  {compareMode && (
                    <th className="text-left py-4 px-4 font-semibold">Compare</th>
                  )}
                  <th className="text-left py-4 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
              {!searchQuery ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={paginatedProducts.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    {paginatedProducts.map((product) => (
                      <SortableProductRow
                        key={product.id}
                        product={product}
                        isSelected={selectedProducts.includes(product.id)}
                        onSelect={handleSelectProduct}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        compareMode={compareMode}
                        compareProducts={compareProducts}
                        onToggleCompare={toggleCompareProduct}
                        copyToClipboard={copyToClipboard}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                paginatedProducts.map((product) => (
                  <tr key={product.id} className={`border-b hover:bg-muted/50 transition-colors ${selectedProducts.includes(product.id) ? 'bg-[#D4AF37]/10' : ''}`}>
                    <td className="py-3 px-2 w-10"></td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleSelectProduct(product.id)}
                        className="text-muted-foreground hover:text-[#D4AF37] transition-colors"
                      >
                        {selectedProducts.includes(product.id) ? (
                          <CheckSquare className="w-5 h-5 text-[#D4AF37]" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded" />
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold">{product.name}</div>
                      <div className="text-sm text-muted-foreground truncate">{product.description}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{product.product_code || "—"}</span>
                        {product.product_code && (
                          <button onClick={() => copyToClipboard(product.product_code!)} className="p-1 rounded hover:bg-muted/80 transition-colors" title="Copy code">
                            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 bg-muted rounded-full text-sm">{product.category}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold">Rs. {product.price.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        product.isAvailable
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      }`}>{product.isAvailable ? "Available" : "Not Available"}</span>
                    </td>
                    {compareMode && (
                      <td className="py-3 px-4">
                        <button onClick={() => toggleCompareProduct(product.id)}
                          className={`p-2 rounded transition-colors ${
                            compareProducts.includes(product.id)
                              ? "bg-[#D4AF37] text-black" : "bg-muted text-muted-foreground hover:border-border"
                          }`}>
                          <Scale className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(product.id)}><Edit className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
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
                        : "bg-muted hover:bg-muted/80 text-foreground"
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
          <div className="text-center py-12 text-muted-foreground">
            <p>No products found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {/* Select All Card for Mobile */}
        <div className="bg-card rounded-lg shadow-sm p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
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
            className={`bg-card rounded-lg shadow-sm p-4 border-2 transition-all ${
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
                  <Square className="w-5 h-5 text-muted-foreground" />
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
                    <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{product.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {product.product_code && (
                    <button
                      onClick={() => copyToClipboard(product.product_code!)}
                      className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-xs font-mono hover:bg-muted/80"
                    >
                      {product.product_code}
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                  <span className="px-2 py-1 bg-muted rounded-full text-xs">
                    {product.category}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    product.isAvailable
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  }`}>
                    {product.isAvailable ? "Available" : "Not Available"}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-foreground">
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
                      className="h-9 min-w-9 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
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
          <div className="bg-card rounded-lg shadow-sm p-12 text-center">
            <p className="text-muted-foreground">No products found matching your criteria</p>
          </div>
        )}
      </div>

      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden" aria-describedby="edit-product-desc">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <p id="edit-product-desc" className="sr-only">Edit product details form</p>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    Available
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isAvailable: false })}
                    className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                      !formData.isAvailable
                        ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                        : "border-border text-muted-foreground"
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
                  <div key={idx} className="border rounded-lg p-3 bg-muted/50">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-2">
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
                      <label className="w-16 h-16 border-2 border-dashed border-border rounded flex items-center justify-center cursor-pointer hover:border-[#D4AF37] hover:bg-muted/50">
                        <span className="text-muted-foreground text-xs">+Add</span>
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

            {/* Size Variants Section */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">
                  Size Variants ({editSizes.length})
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addNewSize}
                >
                  + Add Size
                </Button>
              </div>

              <div className="space-y-4">
                {editSizes.map((sizeItem, idx) => (
                  <div key={idx} className="border rounded-lg p-3 bg-muted/50">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-2">
                      <Input
                        value={sizeItem.size}
                        onChange={(e) => updateSizeName(idx, e.target.value)}
                        placeholder="Size (e.g., 500mm, Large)"
                        className="flex-1"
                      />
                      {editSizes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSize(idx)}
                          className="text-red-500"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sizeItem.images.map((img, imgIdx) => (
                        <div key={imgIdx} className="relative group">
                          <img 
                            src={img} 
                            alt={`${sizeItem.size} ${imgIdx + 1}`} 
                            className="w-16 h-16 object-cover rounded" 
                          />
                          <button
                            type="button"
                            onClick={() => removeSizeImage(idx, imgIdx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <label className="w-16 h-16 border-2 border-dashed border-border rounded flex items-center justify-center cursor-pointer hover:border-[#D4AF37] hover:bg-muted/50">
                        <span className="text-muted-foreground text-xs">+Add</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) addSizeImage(idx, file);
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
