import { useState, useCallback } from "react";
import { PlusCircle, Upload, FileText, X, Check, Loader2, Sparkles, ImagePlus, Trash2 } from "lucide-react";
import { useAdmin } from "../../context/AdminContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
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
import { generateProductDescription } from "../../../lib/openai";

interface BulkProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  isAvailable: boolean;
  errors: string[];
}

type UploadStep = "input" | "preview" | "uploading";

export default function AdminAddProduct() {
  const { addProduct, addMultipleProducts, categories, products } = useAdmin();
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: 0,
    isAvailable: true,
    description: "",
    image: "",
  });

  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkData, setBulkData] = useState("");
  const [bulkProducts, setBulkProducts] = useState<BulkProduct[]>([]);
  const [uploadStep, setUploadStep] = useState<UploadStep>("input");
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isGeneratingDescriptions, setIsGeneratingDescriptions] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const safeCategories = categories || [];

  const generateId = () => `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const parseBulkData = (data: string): BulkProduct[] => {
    const lines = data.trim().split("\n").filter(line => line.trim());
    const products: BulkProduct[] = [];

    for (const line of lines) {
      let parts = line.split("\t").map(p => p.trim());
      
      if (parts.length < 2) {
        parts = line.split(",").map(p => p.trim());
      }
      
      if (parts.length < 2) {
        parts = line.split(/\|/).map(p => p.trim());
      }

      if (parts.length >= 2) {
        const categoryMatch = safeCategories.find(
          (c) => c.name.toLowerCase() === parts[1].toLowerCase() ||
                 c.name.toLowerCase().includes(parts[1].toLowerCase()) ||
                 parts[1].toLowerCase().includes(c.name.toLowerCase())
        );
        
        const price = parts.length >= 3 ? parseFloat(parts[2].replace(/[^0-9.]/g, "")) : 0;
        
        products.push({
          id: generateId(),
          name: parts[0],
          category: categoryMatch?.name || "",
          price: isNaN(price) ? 0 : price,
          description: "",
          image: "",
          isAvailable: true,
          errors: [],
        });
      }
    }
    return products;
  };

  const handleProceed = () => {
    if (!bulkData.trim()) {
      toast.error("Please paste product data first");
      return;
    }
    const parsed = parseBulkData(bulkData);
    if (parsed.length === 0) {
      toast.error("No valid products found. Format: Name | Category | Price");
      return;
    }
    setBulkProducts(parsed);
    setUploadStep("preview");
    toast.success(`Found ${parsed.length} products. Review and edit before uploading.`);
  };

  const handleUpdateProduct = (id: string, field: keyof BulkProduct, value: any) => {
    setBulkProducts(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        updated.errors = validateProduct(updated);
        return updated;
      }
      return p;
    }));
  };

  const validateProduct = (product: BulkProduct): string[] => {
    const errors: string[] = [];
    if (!product.name || product.name.trim().length < 2) {
      errors.push("Name required");
    }
    if (!product.category) {
      errors.push("Category required");
    }
    if (product.price <= 0) {
      errors.push("Price must be greater than 0");
    }
    return errors;
  };

  const handleGenerateDescription = async (productId: string) => {
    const product = bulkProducts.find(p => p.id === productId);
    if (!product || !product.category) {
      toast.error("Please set category first");
      return;
    }

    setGeneratingId(productId);
    try {
      const description = await generateProductDescription(product.name, product.category);
      handleUpdateProduct(productId, "description", description);
    } catch (error) {
      toast.error("Failed to generate description");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleImageUpload = async (productId: string, file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`,
        { method: "POST", body: formData }
      );
      const data = await response.json();
      
      if (data.success) {
        handleUpdateProduct(productId, "image", data.data.url);
        toast.success("Image uploaded!");
      } else {
        // Fallback: use file URL
        const url = URL.createObjectURL(file);
        handleUpdateProduct(productId, "image", url);
      }
    } catch (error) {
      // Fallback: use object URL
      const url = URL.createObjectURL(file);
      handleUpdateProduct(productId, "image", url);
    }
  };

  const handleRemoveProduct = (id: string) => {
    setBulkProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleUploadAll = async () => {
    const invalidProducts = bulkProducts.filter(p => p.errors.length > 0 || !p.image);
    
    if (invalidProducts.length > 0) {
      const missing = invalidProducts.filter(p => !p.image).length;
      const errors = invalidProducts.filter(p => p.errors.length > 0).length;
      toast.error(`${missing} products missing images, ${errors} have errors`);
      return;
    }

    setUploadStep("uploading");
    setIsBulkProcessing(true);

    try {
      for (const product of bulkProducts) {
        await addProduct({
          name: product.name,
          category: product.category,
          price: product.price,
          description: product.description,
          image: product.image,
          isAvailable: product.isAvailable,
        });
      }
      toast.success(`Successfully uploaded ${bulkProducts.length} products!`);
      setBulkData("");
      setBulkProducts([]);
      setShowBulkUpload(false);
      setUploadStep("input");
    } catch (error) {
      toast.error("Failed to upload products");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBackToInput = () => {
    setUploadStep("input");
    setBulkProducts([]);
  };

  const handleGenerateAllDescriptions = async () => {
    const productsNeedingDescription = bulkProducts.filter(p => !p.description);
    if (productsNeedingDescription.length === 0) {
      toast.info("All products already have descriptions");
      return;
    }

    const productsWithoutCategory = productsNeedingDescription.filter(p => !p.category);
    if (productsWithoutCategory.length > 0) {
      toast.error(`${productsWithoutCategory.length} products need a category first`);
      return;
    }

    setIsGeneratingDescriptions(true);
    for (const product of productsNeedingDescription) {
      setGeneratingId(product.id);
      try {
        const description = await generateProductDescription(product.name, product.category);
        handleUpdateProduct(product.id, "description", description);
      } catch (error) {
        console.error("Failed to generate description for", product.name);
      }
    }
    setGeneratingId(null);
    setIsGeneratingDescriptions(false);
    toast.success("All descriptions generated!");
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Add New Product</h1>
            <p className="text-gray-600">Add a new product to your inventory</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setShowBulkUpload(!showBulkUpload);
              setUploadStep("input");
              setBulkProducts([]);
            }}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {showBulkUpload ? "Single Upload" : "Bulk Upload"}
          </Button>
        </div>
      </div>

      {showBulkUpload ? (
        <div className="max-w-6xl">
          {uploadStep === "input" && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Step 1: Paste Product Data</h2>
                <div className="text-gray-600 text-sm space-y-2">
                  <p>Copy products from Excel and paste below.</p>
                  <code className="bg-gray-100 px-2 py-1 rounded block">
                    Product Name | Category | Price
                  </code>
                  <p className="text-xs text-gray-500">
                    Example: Chrome Bath Faucet | Bathroom Faucets | 2500
                  </p>
                </div>
              </div>

              <Textarea
                value={bulkData}
                onChange={(e) => setBulkData(e.target.value)}
                placeholder={`Paste Excel data here (tab, comma, or pipe separated)&#10;Example: Chrome Bath Faucet	Bathroom Faucets	2500&#10;LED Mirror Light	Lighting	1500`}
                className="min-h-[200px] font-mono text-sm"
              />

              <div className="flex gap-3 mt-4">
                <Button
                  onClick={handleProceed}
                  className="bg-black hover:bg-[#D4AF37] text-white"
                >
                  Proceed to Preview
                </Button>
              </div>
            </div>
          )}

          {uploadStep === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                <div>
                  <h3 className="font-semibold">Step 2: Preview & Edit</h3>
                  <p className="text-sm text-gray-600">Review each product, add categories, images, and generate descriptions</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleBackToInput}
                  >
                    Back
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGenerateAllDescriptions}
                    disabled={isGeneratingDescriptions}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    {isGeneratingDescriptions ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Generate All Descriptions
                  </Button>
                  <Button
                    onClick={handleUploadAll}
                    disabled={isBulkProcessing || bulkProducts.length === 0}
                    className="bg-black hover:bg-[#D4AF37] text-white"
                  >
                    {isBulkProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Upload All ({bulkProducts.length})
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-3 py-3 text-left font-medium">#</th>
                        <th className="px-3 py-3 text-left font-medium w-48">Name</th>
                        <th className="px-3 py-3 text-left font-medium">Category</th>
                        <th className="px-3 py-3 text-left font-medium w-24">Price</th>
                        <th className="px-3 py-3 text-left font-medium w-64">Description</th>
                        <th className="px-3 py-3 text-left font-medium w-40">Image</th>
                        <th className="px-3 py-3 text-center font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkProducts.map((product, index) => (
                        <tr key={product.id} className={`border-b ${product.errors.length > 0 ? "bg-red-50" : ""}`}>
                          <td className="px-3 py-3">{index + 1}</td>
                          <td className="px-3 py-3">
                            <Input
                              value={product.name}
                              onChange={(e) => handleUpdateProduct(product.id, "name", e.target.value)}
                              placeholder="Product name"
                              className="w-full"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <Select
                              value={product.category}
                              onValueChange={(value) => handleUpdateProduct(product.id, "category", value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {safeCategories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.name}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-3">
                            <Input
                              type="number"
                              value={product.price}
                              onChange={(e) => handleUpdateProduct(product.id, "price", parseFloat(e.target.value) || 0)}
                              className="w-full"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex gap-2">
                              <Textarea
                                value={product.description}
                                onChange={(e) => handleUpdateProduct(product.id, "description", e.target.value)}
                                placeholder="Description..."
                                className="min-h-[60px] text-xs resize-none"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGenerateDescription(product.id)}
                                disabled={generatingId === product.id || !product.category}
                                className="shrink-0"
                                title="Generate AI description"
                              >
                                {generatingId === product.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Sparkles className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="space-y-2">
                              {product.image ? (
                                <div className="relative group">
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-20 h-20 object-cover rounded-lg"
                                  />
                                  <button
                                    onClick={() => handleUpdateProduct(product.id, "image", "")}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#D4AF37] hover:bg-gray-50 transition-colors">
                                  <ImagePlus className="w-6 h-6 text-gray-400" />
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleImageUpload(product.id, file);
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProduct(product.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {bulkProducts.some(p => p.errors.length > 0 || !p.image) && (
                  <div className="bg-red-50 p-4 border-t">
                    <p className="text-red-600 text-sm font-medium">
                      ⚠️ {bulkProducts.filter(p => p.errors.length > 0 || !p.image).length} products have issues. 
                      Please fix errors and add images before uploading.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {uploadStep === "uploading" && (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#D4AF37]" />
              <h3 className="text-xl font-semibold mt-4">Uploading Products...</h3>
              <p className="text-gray-600 mt-2">Please wait while we upload your products to the database</p>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-3xl">
          <SingleProductForm />
        </div>
      )}
    </div>
  );

  function SingleProductForm() {
    const safeCategories = categories || [];

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.name || formData.name.trim().length < 2) {
        toast.error("Product name must be at least 2 characters");
        return;
      }

      if (!formData.category) {
        toast.error("Please select a category");
        return;
      }

      if (formData.price <= 0) {
        toast.error("Price must be greater than 0");
        return;
      }

      if (formData.price > 10000000) {
        toast.error("Price cannot exceed 10,000,000 LKR");
        return;
      }

      if (!formData.description || formData.description.trim().length < 10) {
        toast.error("Description must be at least 10 characters");
        return;
      }

      if (!formData.image) {
        toast.error("Please upload a product image");
        return;
      }

      await addProduct({
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
      });
      toast.success("Product added successfully!");

      setFormData({
        name: "",
        category: "",
        price: 0,
        isAvailable: true,
        description: "",
        image: "",
      });
    };

    const handleGenerateSingleDescription = async () => {
      if (!formData.name || !formData.category) {
        toast.error("Please enter product name and select category first");
        return;
      }

      const category = safeCategories.find(c => c.name === formData.category);
      const description = await generateProductDescription(formData.name, category?.name || formData.category);
      setFormData(prev => ({ ...prev, description }));
      toast.success("Description generated!");
    };

    return (
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
        <div>
          <Label htmlFor="name">
            Product Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., LED Ceiling Light - Modern Round"
            required
          />
        </div>

        <div>
          <Label htmlFor="category">
            Category <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select a category" />
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

        <div>
          <Label htmlFor="price">
            Price (LKR) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="1"
            value={formData.price || ""}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            placeholder="e.g., 2500"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">
            Description <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2">
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter product description..."
              className="min-h-[120px]"
              required
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateSingleDescription}
              className="shrink-0 h-10"
              title="Generate AI description"
            >
              ✨
            </Button>
          </div>
        </div>

        <div>
          <Label>Product Image <span className="text-red-500">*</span></Label>
          <ImageUploadComponent />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isAvailable"
            type="checkbox"
            checked={formData.isAvailable}
            onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
            className="w-4 h-4"
          />
          <Label htmlFor="isAvailable" className="text-sm font-normal">
            Product is available for sale
          </Label>
        </div>

        <div className="flex gap-4 pt-4">
          <Button type="submit" size="lg" className="bg-black hover:bg-[#D4AF37] text-white">
            <PlusCircle className="w-5 h-5 mr-2" />
            Add Product
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={() => setFormData({ name: "", category: "", price: 0, isAvailable: true, description: "", image: "" })}
          >
            Clear Form
          </Button>
        </div>
      </form>
    );
  }

  function ImageUploadComponent() {
    const [urlInput, setUrlInput] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleUrlSubmit = () => {
      if (urlInput.trim()) {
        setFormData({ ...formData, image: urlInput.trim() });
        setUrlInput("");
      }
    };

    const handleDrop = useCallback(async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        await uploadImage(file);
      }
    }, [formData]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await uploadImage(file);
      }
    };

    const uploadImage = async (file: File) => {
      setIsUploading(true);
      try {
        const formDataObj = new FormData();
        formDataObj.append("image", file);

        const response = await fetch(
          `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`,
          { method: "POST", body: formDataObj }
        );
        const data = await response.json();
        
        if (data.success) {
          setFormData({ ...formData, image: data.data.url });
          toast.success("Image uploaded!");
        } else {
          // Fallback
          const url = URL.createObjectURL(file);
          setFormData({ ...formData, image: url });
        }
      } catch (error) {
        const url = URL.createObjectURL(file);
        setFormData({ ...formData, image: url });
      } finally {
        setIsUploading(false);
      }
    };

    return (
      <div className="space-y-4">
        {formData.image ? (
          <div className="relative group inline-block">
            <img src={formData.image} alt="Product" className="w-40 h-40 object-cover rounded-lg" />
            <button
              type="button"
              onClick={() => setFormData({ ...formData, image: "" })}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-gray-300"
            }`}
          >
            <ImagePlus className="w-10 h-10 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600 mb-2">Drag and drop an image here</p>
            <p className="text-gray-500 text-sm mb-4">or</p>
            <label className="inline-block">
              <Button type="button" variant="outline" asChild>
                <span className="cursor-pointer">Choose File</span>
              </Button>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            </label>
            {isUploading && <p className="mt-2 text-sm text-[#D4AF37]">Uploading...</p>}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Or paste image URL here"
            className="flex-1"
          />
          <Button type="button" onClick={handleUrlSubmit} variant="outline">
            Add URL
          </Button>
        </div>
      </div>
    );
  }
}