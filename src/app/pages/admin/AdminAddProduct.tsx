import { useState, useCallback } from "react";
import { PlusCircle, Upload, FileText, X, Check, Loader2 } from "lucide-react";
import ImageUpload from "../../components/admin/ImageUpload";
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
import { generateProductDescription, generateBulkDescriptions } from "../../../lib/openai";

interface BulkProduct {
  name: string;
  category: string;
  price: number;
  description: string;
  isAvailable: boolean;
}

export default function AdminAddProduct() {
  const { addProduct, addMultipleProducts, categories } = useAdmin();
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
  const [bulkPreview, setBulkPreview] = useState<BulkProduct[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isGeneratingDescriptions, setIsGeneratingDescriptions] = useState(false);
  const [descriptionProgress, setDescriptionProgress] = useState({ current: 0, total: 0 });

  const safeCategories = categories || [];

  const parseBulkData = (data: string): Omit<BulkProduct, "description">[] => {
    const lines = data.trim().split("\n").filter(line => line.trim());
    const products: Omit<BulkProduct, "description">[] = [];

    for (const line of lines) {
      const parts = line.split("\t").map(p => p.trim());
      if (parts.length >= 3) {
        const categoryMatch = safeCategories.find(
          (c) => c.name.toLowerCase() === parts[1].toLowerCase()
        );
        products.push({
          name: parts[0],
          category: categoryMatch?.name || parts[1],
          price: parseFloat(parts[2]) || 0,
          isAvailable: true,
        });
      }
    }
    return products;
  };

  const handleBulkPreview = async () => {
    if (!bulkData.trim()) {
      toast.error("Please paste product data from Excel");
      return;
    }
    const preview = parseBulkData(bulkData);
    if (preview.length === 0) {
      toast.error("No valid products found. Format: Name[tab]Category[tab]Price");
      return;
    }
    setBulkPreview(preview);
    toast.success(`Found ${preview.length} products. Click "Generate AI Descriptions" to add descriptions.`);
  };

  const handleGenerateDescriptions = async () => {
    if (bulkPreview.length === 0) return;

    setIsGeneratingDescriptions(true);
    setDescriptionProgress({ current: 0, total: bulkPreview.length });

    try {
      const productData = bulkPreview.map(p => ({ name: p.name, category: p.category }));
      const descriptions = await generateBulkDescriptions(productData, (current, total) => {
        setDescriptionProgress({ current, total });
      });

      const productsWithDescriptions: BulkProduct[] = bulkPreview.map((product, index) => ({
        ...product,
        description: descriptions[index],
      }));

      setBulkPreview(productsWithDescriptions);
      toast.success("AI descriptions generated successfully!");
    } catch (error) {
      console.error("Error generating descriptions:", error);
      toast.error("Failed to generate descriptions. Please try again.");
    } finally {
      setIsGeneratingDescriptions(false);
    }
  };

  const handleBulkSubmit = async () => {
    const validProducts = bulkPreview.filter(p => p.description);
    if (validProducts.length === 0) {
      toast.error("Please generate descriptions first");
      return;
    }
    setIsBulkProcessing(true);
    try {
      await addMultipleProducts(validProducts);
      toast.success(`Successfully added ${validProducts.length} products!`);
      setBulkData("");
      setBulkPreview([]);
      setShowBulkUpload(false);
    } catch (error) {
      toast.error("Failed to upload products");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleRemoveProduct = (index: number) => {
    setBulkPreview(prev => prev.filter((_, i) => i !== index));
  };

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

    const category = safeCategories.find(c => c.id === formData.category);
    const description = await generateProductDescription(formData.name, category?.name || formData.category);
    setFormData(prev => ({ ...prev, description }));
    toast.success("Description generated!");
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
            onClick={() => setShowBulkUpload(!showBulkUpload)}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {showBulkUpload ? "Single Upload" : "Bulk Upload"}
          </Button>
        </div>
      </div>

      {showBulkUpload ? (
        <div className="max-w-5xl">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Bulk Product Upload</h2>
              <div className="text-gray-600 text-sm space-y-2">
                <p>Copy from Excel and paste below. Format (tab-separated):</p>
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
              placeholder={`Paste Excel data here (tab-separated)&#10;Example: Chrome Bath Faucet	Bathroom Faucets	2500&#10;LED Mirror Light	Lighting	1500`}
              className="min-h-[150px] font-mono text-sm"
            />

            <div className="flex flex-wrap gap-3 mt-4">
              <Button
                onClick={handleBulkPreview}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Preview Products
              </Button>
              <Button
                onClick={handleGenerateDescriptions}
                disabled={bulkPreview.length === 0 || isGeneratingDescriptions}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                {isGeneratingDescriptions ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating... ({descriptionProgress.current}/{descriptionProgress.total})
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    Generate AI Descriptions
                  </>
                )}
              </Button>
            </div>

            {bulkPreview.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">
                    Preview ({bulkPreview.length} products)
                  </h3>
                  <Button
                    onClick={handleBulkSubmit}
                    disabled={isBulkProcessing || !bulkPreview.some(p => p.description)}
                    className="bg-black hover:bg-[#D4AF37] text-white"
                  >
                    {isBulkProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload {bulkPreview.filter(p => p.description).length} Products
                      </>
                    )}
                  </Button>
                </div>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm border">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Name</th>
                        <th className="px-3 py-2 text-left font-medium">Category</th>
                        <th className="px-3 py-2 text-left font-medium">Price</th>
                        <th className="px-3 py-2 text-left font-medium">Description</th>
                        <th className="px-3 py-2 text-center font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkPreview.map((product, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2 font-medium">{product.name}</td>
                          <td className="px-3 py-2">{product.category}</td>
                          <td className="px-3 py-2">Rs. {product.price.toLocaleString()}</td>
                          <td className="px-3 py-2 max-w-xs">
                            {product.description ? (
                              <span className="line-clamp-2 text-gray-600">{product.description}</span>
                            ) : (
                              <span className="text-orange-500 text-xs">⚠️ No description</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProduct(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-3xl">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
            <div>
              <Label htmlFor="name">
                Product Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
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
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
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
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
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
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
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
              <p className="text-xs text-gray-500 mt-1">
                Click the ✨ button to generate an AI description
              </p>
            </div>

            <div>
              <Label>Product Image <span className="text-red-500">*</span></Label>
              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isAvailable"
                type="checkbox"
                checked={formData.isAvailable}
                onChange={(e) =>
                  setFormData({ ...formData, isAvailable: e.target.checked })
                }
                className="w-4 h-4"
              />
              <Label htmlFor="isAvailable" className="text-sm font-normal">
                Product is available for sale
              </Label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                size="lg"
                className="bg-black hover:bg-[#D4AF37] text-white"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Add Product
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() =>
                  setFormData({
                    name: "",
                    category: "",
                    price: 0,
                    isAvailable: true,
                    description: "",
                    image: "",
                  })
                }
              >
                Clear Form
              </Button>
            </div>
          </form>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">
              Tips for Adding Products
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>
                • Use clear, descriptive product names that customers can easily
                search for
              </li>
              <li>
                • Select the most appropriate category for better organization
              </li>
              <li>
                • Write detailed descriptions highlighting key features and
                benefits
              </li>
              <li>
                • Use high-quality images with good lighting and clear product
                visibility
              </li>
              <li>• Keep availability status updated to manage product visibility</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}