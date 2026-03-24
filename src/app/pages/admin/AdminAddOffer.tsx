import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useAdmin } from "../../context/AdminContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Checkbox } from "../../components/ui/checkbox";
import { ArrowLeft, Save, Tag } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "../../components/admin/ImageUpload";

export default function AdminAddOffer() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { products, offers, addOffer, updateOffer } = useAdmin();
  
  const isEditMode = !!id;
  const existingOffer = offers.find((o) => o.id === id);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    bannerImage: "",
    discountPercentage: "",
    promotionalPrice: "",
    applicableProducts: [] as string[],
    startDate: "",
    endDate: "",
    isEnabled: true,
  });

  useEffect(() => {
    if (isEditMode && existingOffer) {
      setFormData({
        title: existingOffer.title,
        description: existingOffer.description,
        bannerImage: existingOffer.bannerImage,
        discountPercentage: existingOffer.discountPercentage?.toString() || "",
        promotionalPrice: existingOffer.promotionalPrice?.toString() || "",
        applicableProducts: existingOffer.applicableProducts,
        startDate: existingOffer.startDate,
        endDate: existingOffer.endDate,
        isEnabled: existingOffer.isEnabled,
      });
    }
  }, [isEditMode, existingOffer]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProductToggle = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      applicableProducts: prev.applicableProducts.includes(productId)
        ? prev.applicableProducts.filter((id) => id !== productId)
        : [...prev.applicableProducts, productId],
    }));
  };

  const handleSelectAllProducts = () => {
    setFormData((prev) => ({
      ...prev,
      applicableProducts:
        prev.applicableProducts.length === products.length
          ? []
          : products.map((p) => p.id),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter offer title");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Please enter offer description");
      return;
    }

    if (!formData.bannerImage.trim()) {
      toast.error("Please upload a banner image");
      return;
    }

    if (!formData.discountPercentage && !formData.promotionalPrice) {
      toast.error("Please enter either discount percentage or promotional price");
      return;
    }

    if (formData.applicableProducts.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error("Please select start and end dates");
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error("End date must be after start date");
      return;
    }

    const offerData = {
      title: formData.title,
      description: formData.description,
      bannerImage: formData.bannerImage,
      discountPercentage: formData.discountPercentage
        ? parseFloat(formData.discountPercentage)
        : undefined,
      promotionalPrice: formData.promotionalPrice
        ? parseFloat(formData.promotionalPrice)
        : undefined,
      applicableProducts: formData.applicableProducts,
      startDate: formData.startDate,
      endDate: formData.endDate,
      isEnabled: formData.isEnabled,
    };

    if (isEditMode && id) {
      updateOffer(id, offerData);
      toast.success("Offer updated successfully");
    } else {
      addOffer(offerData);
      toast.success("Offer created successfully");
    }

    navigate("/admin/offers");
  };

  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, typeof products>);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <Button
          onClick={() => navigate("/admin/offers")}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Offers
        </Button>
        <h1 className="text-3xl font-bold mb-2">
          {isEditMode ? "Edit Offer" : "Add New Offer"}
        </h1>
        <p className="text-gray-600">
          {isEditMode
            ? "Update offer details and settings"
            : "Create a new promotional offer"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-bold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">
                  Offer Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Summer Sale 2024"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your offer..."
                  rows={4}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <ImageUpload
                  label="Banner Image"
                  value={formData.bannerImage}
                  onChange={(val) => setFormData({ ...formData, bannerImage: val })}
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h2 className="text-xl font-bold mb-4">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discountPercentage">Discount Percentage (%)</Label>
                <Input
                  id="discountPercentage"
                  name="discountPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={handleInputChange}
                  placeholder="e.g., 20"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Will be applied to original product prices
                </p>
              </div>

              <div>
                <Label htmlFor="promotionalPrice">Promotional Price (Rs.)</Label>
                <Input
                  id="promotionalPrice"
                  name="promotionalPrice"
                  type="number"
                  min="0"
                  value={formData.promotionalPrice}
                  onChange={handleInputChange}
                  placeholder="e.g., 1999"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Fixed price for all applicable products
                </p>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <h2 className="text-xl font-bold mb-4">Date Range</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="endDate">
                  End Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Applicable Products */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                Applicable Products <span className="text-red-500">*</span>
              </h2>
              <Button
                type="button"
                onClick={handleSelectAllProducts}
                variant="outline"
                size="sm"
              >
                {formData.applicableProducts.length === products.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>

            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-6">
              {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
                <div key={category}>
                  <h3 className="font-bold text-lg mb-3 text-[#D4AF37]">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('button')) return;
                          handleProductToggle(product.id);
                        }}
                      >
                        <Checkbox
                          checked={formData.applicableProducts.includes(
                            product.id
                          )}
                          onCheckedChange={() => handleProductToggle(product.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex gap-3">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm line-clamp-1">
                                {product.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                Rs. {product.price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {formData.applicableProducts.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {formData.applicableProducts.length} product
                {formData.applicableProducts.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Checkbox
              id="isEnabled"
              checked={formData.isEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isEnabled: checked as boolean })
              }
            />
            <div>
              <Label htmlFor="isEnabled" className="cursor-pointer font-medium">
                Enable this offer
              </Label>
              <p className="text-xs text-gray-600">
                Disabled offers won't be shown to customers
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="bg-[#D4AF37] hover:bg-[#C5A028] text-black"
            >
              <Save className="w-4 h-4 mr-2" />
              {isEditMode ? "Update Offer" : "Create Offer"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/offers")}
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
