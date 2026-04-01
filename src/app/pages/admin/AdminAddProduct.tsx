import { useState } from "react";
import { PlusCircle } from "lucide-react";
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

export default function AdminAddProduct() {
  const { addProduct, categories } = useAdmin();
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: 0,
    isAvailable: true,
    description: "",
    image: "",
  });

  const safeCategories = categories || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Add New Product</h1>
        <p className="text-gray-600">Add a new product to your inventory</p>
      </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="price">
                Price (Rs.) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price || ""}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="isAvailable">
                Availability
              </Label>
              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isAvailable: true })}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
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
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
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
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter a detailed description of the product..."
              rows={4}
              required
            />
          </div>

          <div>
            <ImageUpload
              label="Product Image"
              value={formData.image}
              onChange={(val) => setFormData({ ...formData, image: val })}
            />
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
    </div>
  );
}
