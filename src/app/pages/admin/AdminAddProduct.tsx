import { useState, useCallback, useRef } from "react";
import { PlusCircle, Upload, FileText, X, Check, Loader2, ImagePlus, Trash2, Images, FileSpreadsheet, AlertTriangle } from "lucide-react";
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

type UploadStep = "input" | "preview" | "uploading";

interface ProductVariant {
  id: string;
  color: string;
  images: string[];
}

interface BulkProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  isAvailable: boolean;
  errors: string[];
  isUploading?: boolean;
  isDuplicate?: boolean;
  productType?: string;
}

export default function AdminAddProduct() {
  const { addProduct, addMultipleProducts, categories } = useAdmin();
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  if (showBulkUpload) {
    return (
      <BulkUploadArea 
        categories={categories || []} 
        onBack={() => setShowBulkUpload(false)} 
      />
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Toggle between Single and Bulk */}
      <div className="flex justify-end mb-4">
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => setShowBulkUpload(true)}
          className="text-sm"
        >
          <Upload className="w-4 h-4 mr-2" />
          Bulk Upload
        </Button>
      </div>
      <SingleProductForm key="single-form" />
    </div>
  );

  function BulkUploadArea({ categories, onBack }: { categories: any[]; onBack: () => void }) {
    const [bulkData, setBulkData] = useState("");
    const [bulkProducts, setBulkProducts] = useState<BulkProduct[]>([]);
    const [uploadStep, setUploadStep] = useState<UploadStep>("input");
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploadingImages, setIsUploadingImages] = useState(false);
    const [rowDragging, setRowDragging] = useState<string | null>(null);

    const handleRowImageUpload = async (productId: string, file: File) => {
      try {
        const formDataImg = new FormData();
        formDataImg.append("image", file);
        const response = await fetch(
          `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`,
          { method: "POST", body: formDataImg }
        );
        const data = await response.json();
        if (data.success) {
          setBulkProducts(prev => prev.map(p => 
            p.id === productId ? { ...p, image: data.data.url } : p
          ));
        }
      } catch (error) {
        const url = URL.createObjectURL(file);
        setBulkProducts(prev => prev.map(p => 
          p.id === productId ? { ...p, image: url } : p
        ));
      }
    };

    const parseCSVOrTSV = (content: string): BulkProduct[] => {
      const lines = content.trim().split("\n");
      if (lines.length === 0) return [];
      
      const delimiter = content.includes("\t") ? "\t" : ",";
      const products: BulkProduct[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(delimiter).map(p => p.trim());
        const name = parts[0] || "";
        const category = parts[1] || "";
        const price = parseFloat(parts[2]) || 0;
        const description = parts[3] || "";
        
        const errors: string[] = [];
        if (!name) errors.push("Missing name");
        if (!category) errors.push("Missing category");
        if (price <= 0) errors.push("Invalid price");
        
        products.push({
          id: `bulk_${Date.now()}_${i}`,
          name,
          category,
          price,
          description,
          image: "",
          isAvailable: true,
          errors,
          productType: "tap"
        });
      }
      
      return products;
    };

    const handleFileDrop = useCallback(async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      const files = Array.from(e.dataTransfer.files);
      const file = files[0];
      
      if (!file) return;
      
      const extension = file.name.split(".").pop()?.toLowerCase();
      
      if (extension === "csv" || extension === "tsv" || extension === "txt") {
        const content = await file.text();
        const parsed = parseCSVOrTSV(content);
        
        if (parsed.length === 0) {
          toast.error("No valid products found in file");
          return;
        }
        
        setBulkProducts(parsed);
        setUploadStep("preview");
        toast.success(`Imported ${parsed.length} products from file!`);
      } else if (extension === "xlsx" || extension === "xls") {
        toast.info("Excel files need to be saved as CSV first. Please copy-paste the data.");
      } else {
        toast.error("Please upload a CSV or TXT file");
      }
    }, []);

    const handleProceed = () => {
      if (bulkData.trim()) {
        const parsed = parseCSVOrTSV(bulkData);
        if (parsed.length > 0) {
          setBulkProducts(parsed);
          setUploadStep("preview");
          toast.success(`Parsed ${parsed.length} products!`);
        }
      }
    };

    const handleRemoveProduct = (id: string) => {
      setBulkProducts(prev => prev.filter(p => p.id !== id));
    };

    const handleCategoryChange = (id: string, category: string) => {
      setBulkProducts(prev => prev.map(p => {
        if (p.id === id) {
          return { ...p, category, errors: p.errors.filter(e => e !== "Missing category") };
        }
        return p;
      }));
    };

    const handlePriceChange = (id: string, price: number) => {
      setBulkProducts(prev => prev.map(p => {
        if (p.id === id) {
          const newErrors = price > 0 
            ? p.errors.filter(e => e !== "Invalid price")
            : [...p.errors.filter(e => e !== "Invalid price"), "Invalid price"];
          return { ...p, price, errors: newErrors };
        }
        return p;
      }));
    };

    const handleDescriptionChange = (id: string, description: string) => {
      setBulkProducts(prev => prev.map(p => 
        p.id === id ? { ...p, description } : p
      ));
    };

    const handleSelectAllImages = async () => {
      const validProducts = bulkProducts.filter(p => p.errors.length === 0);
      if (validProducts.length === 0) {
        toast.error("No valid products to upload");
        return;
      }
      
      setIsUploadingImages(true);
      
      for (let i = 0; i < validProducts.length; i++) {
        const product = validProducts[i];
        
        const imageUrl = `https://via.placeholder.com/400x400?text=${encodeURIComponent(product.name)}`;
        
        setBulkProducts(prev => prev.map(p => {
          if (p.id === product.id) {
            return { ...p, image: imageUrl };
          }
          return p;
        }));
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setIsUploadingImages(false);
      toast.success("Images added to all products!");
    };

    const handleUpload = async () => {
      const validProducts = bulkProducts.filter(p => p.errors.length === 0 && p.image);
      
      if (validProducts.length === 0) {
        toast.error("No valid products to upload");
        return;
      }
      
      setIsBulkProcessing(true);
      setUploadStep("uploading");

      const productsToUpload = validProducts.map(p => ({
        name: p.name,
        category: p.category,
        price: p.price,
        description: p.description || "No description",
        image: p.image,
        isAvailable: true,
      }));

      await addMultipleProducts(productsToUpload);
      
      toast.success(`Successfully added ${productsToUpload.length} products!`);
      setBulkData("");
      setBulkProducts([]);
      setUploadStep("input");
      setIsBulkProcessing(false);
    };

    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Bulk Upload Products</h2>
          <Button variant="outline" onClick={onBack}>
            Back to Single Upload
          </Button>
        </div>

        {uploadStep === "uploading" && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#D4AF37]" />
            <h3 className="text-xl font-semibold mt-4">Uploading Products...</h3>
            <p className="text-gray-600 mt-2">Please wait while we upload your products to the database</p>
          </div>
        )}

        {uploadStep !== "uploading" && (
          <>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${
                isDragging ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-gray-300"
              }`}
            >
              <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 mb-2">Drag and drop a CSV or TXT file here</p>
              <p className="text-gray-500 text-sm mb-4">or paste data below</p>
              
              <div className="max-w-md mx-auto">
                <Textarea
                  value={bulkData}
                  onChange={(e) => setBulkData(e.target.value)}
                  placeholder={`Paste Excel data here (tab, comma, or pipe separated)\nExample: Chrome Bath Faucet	Bathroom Faucets	2500\nLED Mirror Light	Lighting	1500`}
                  className="min-h-[200px] font-mono text-sm"
                />
                
                <Button
                  onClick={handleProceed}
                  className="mt-4 w-full bg-black hover:bg-[#D4AF37] text-white"
                >
                  Parse Data
                </Button>
              </div>
            </div>

            {uploadStep === "preview" && bulkProducts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-600">{bulkProducts.length} products ready to upload</p>
                  <div className="flex gap-2">
                    <label className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-sm">
                      <span>{isUploadingImages ? "Uploading..." : "Upload Images"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length === 0) return;
                          setIsUploadingImages(true);
                          
                          for (let i = 0; i < Math.min(files.length, bulkProducts.length); i++) {
                            const file = files[i];
                            const product = bulkProducts[i];
                            
                            const formDataImg = new FormData();
                            formDataImg.append("image", file);
                            
                            try {
                              const response = await fetch(
                                `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`,
                                { method: "POST", body: formDataImg }
                              );
                              const data = await response.json();
                              if (data.success) {
                                setBulkProducts(prev => prev.map(p => 
                                  p.id === product.id ? { ...p, image: data.data.url } : p
                                ));
                              }
                            } catch (error) {
                              const url = URL.createObjectURL(file);
                              setBulkProducts(prev => prev.map(p => 
                                p.id === product.id ? { ...p, image: url } : p
                              ));
                            }
                          }
                          setIsUploadingImages(false);
                          toast.success(`${Math.min(files.length, bulkProducts.length)} images uploaded!`);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <Button variant="outline" onClick={handleSelectAllImages} disabled={isUploadingImages}>
                      {isUploadingImages ? "Adding..." : "Sample Images"}
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-sm font-semibold">Product Name</th>
                        <th className="px-3 py-3 text-left text-sm font-semibold">Category</th>
                        <th className="px-3 py-3 text-left text-sm font-semibold">Price</th>
                        <th className="px-3 py-3 text-left text-sm font-semibold">Description</th>
                        <th className="px-3 py-3 text-left text-sm font-semibold">Image</th>
                        <th className="px-3 py-3 text-center text-sm font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkProducts.map((product) => (
                        <tr key={product.id} className="border-t">
                          <td className="px-3 py-3">
                            <p className="font-medium">{product.name}</p>
                            {product.errors.length > 0 && (
                              <p className="text-red-500 text-xs">{product.errors.join(", ")}</p>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <Select
                              value={product.category}
                              onValueChange={(value) => handleCategoryChange(product.id, value)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((cat) => (
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
                              onChange={(e) => handlePriceChange(product.id, parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <textarea
                              value={product.description}
                              onChange={(e) => handleDescriptionChange(product.id, e.target.value)}
                              placeholder="Description..."
                              className="w-64 text-sm border rounded p-2 h-auto"
                            />
                          </td>
                          <td 
                            className="px-3 py-3"
                            onDragOver={(e) => { e.preventDefault(); setRowDragging(product.id); }}
                            onDragLeave={() => setRowDragging(null)}
                            onDrop={async (e) => {
                              e.preventDefault();
                              setRowDragging(null);
                              const file = e.dataTransfer.files[0];
                              if (file && file.type.startsWith("image/")) {
                                await handleRowImageUpload(product.id, file);
                              }
                            }}
                          >
                            {product.image ? (
                              <div className="relative group">
                                <img src={product.image} alt={product.name} className={`w-12 h-12 object-cover rounded ${rowDragging === product.id ? 'ring-2 ring-[#D4AF37]' : ''}`} />
                                <label className="absolute inset-0 cursor-pointer opacity-0 group-hover:opacity-100 bg-black/50 rounded flex items-center justify-center">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) await handleRowImageUpload(product.id, file);
                                    }}
                                  />
                                  <span className="text-white text-xs">Change</span>
                                </label>
                              </div>
                            ) : (
                              <label className={`w-12 h-12 border-2 border-dashed rounded flex items-center justify-center cursor-pointer ${rowDragging === product.id ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-gray-300 hover:border-[#D4AF37]'}`}>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) await handleRowImageUpload(product.id, file);
                                  }}
                                />
                                <span className="text-gray-400 text-xs">+</span>
                              </label>
                            )}
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

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={handleUpload}
                    disabled={isBulkProcessing}
                    className="bg-black hover:bg-[#D4AF37] text-white"
                  >
                    {isBulkProcessing ? "Uploading..." : "Upload All Products"}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  function SingleProductForm() {
    const safeCategories = categories || [];
    
    // ALL state inside SingleProductForm - completely isolated
    const [formData, setFormData] = useState({
      name: "",
      category: "",
      price: 0,
      isAvailable: true,
      description: "",
      image: "",
    });
    
    const [enableVariants, setEnableVariants] = useState(false);
    const [variants, setVariants] = useState<ProductVariant[]>([
      { id: "1", color: "", images: [] }
    ]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [variantDragging, setVariantDragging] = useState<{[key: string]: boolean}>({});

    // Refs for inputs
    const nameRef = useRef<HTMLInputElement>(null);
    const descRef = useRef<HTMLTextAreaElement>(null);
    const priceRef = useRef<HTMLInputElement>(null);

    // Read values directly from DOM without triggering re-renders
    const getName = () => nameRef.current?.value || "";
    const getDesc = () => descRef.current?.value || "";
    const getPrice = () => parseFloat(priceRef.current?.value) || 0;

    const handleCategoryChange = (value: string) => {
      setFormData(prev => ({ ...prev, category: value }));
    };

    const handleToggleVariants = () => {
      setEnableVariants(prev => !prev);
      if (!enableVariants) {
        setVariants([{ id: "1", color: "", images: [] }]);
      }
    };

    const addVariant = () => {
      setVariants(prev => [...prev, { id: Date.now().toString(), color: "", images: [] }]);
    };

    const removeVariant = (id: string) => {
      if (variants.length > 1) {
        setVariants(prev => prev.filter(v => v.id !== id));
      }
    };

    const updateVariantColorDirect = (id: string, color: string) => {
      setVariants(prev => prev.map(v => v.id === id ? { ...v, color } : v));
    };

    const uploadMainImage = async (file: File) => {
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
          setFormData(prev => ({ ...prev, image: data.data.url }));
          toast.success("Image uploaded!");
        } else {
          toast.error("Upload failed");
        }
      } catch (error) {
        toast.error("Upload failed");
      }
      setIsUploading(false);
    };

    const uploadVariantImage = async (variantId: string, file: File) => {
      try {
        const formDataImg = new FormData();
        formDataImg.append("image", file);

        const response = await fetch(
          `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`,
          { method: "POST", body: formDataImg }
        );
        const data = await response.json();
        
        if (data.success) {
          setVariants(prev => prev.map(v => {
            if (v.id === variantId) {
              return { ...v, images: [...v.images, data.data.url] };
            }
            return v;
          }));
        } else {
          const url = URL.createObjectURL(file);
          setVariants(prev => prev.map(v => {
            if (v.id === variantId) {
              return { ...v, images: [...v.images, url] };
            }
            return v;
          }));
        }
      } catch (error) {
        const url = URL.createObjectURL(file);
        setVariants(prev => prev.map(v => {
          if (v.id === variantId) {
            return { ...v, images: [...v.images, url] };
          }
          return v;
        }));
      }
    };

    const removeVariantImage = (variantId: string, imageIndex: number) => {
      setVariants(prev => prev.map(v => {
        if (v.id === variantId) {
          return { ...v, images: v.images.filter((_, i) => i !== imageIndex) };
        }
        return v;
      }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Read directly from DOM
      const name = getName();
      const description = getDesc();
      const price = getPrice();

      // Validate
      if (!name || name.trim().length < 2) {
        toast.error("Product name must be at least 2 characters");
        return;
      }

      if (!formData.category) {
        toast.error("Please select a category");
        return;
      }

      if (price <= 0) {
        toast.error("Price must be greater than 0");
        return;
      }

      if (!description || description.trim().length < 10) {
        toast.error("Description must be at least 10 characters");
        return;
      }

      // Validate variants
      if (enableVariants) {
        const colors = variants.map(v => v.color.toLowerCase().trim());
        const duplicates = colors.filter((c, i) => c && colors.indexOf(c) !== i);
        if (duplicates.length > 0) {
          toast.error("Duplicate colors found");
          return;
        }
        const emptyColors = variants.filter(v => !v.color.trim());
        if (emptyColors.length > 0) {
          toast.error("All colors must have a name");
          return;
        }
        const noImages = variants.filter(v => v.images.length === 0);
        if (noImages.length > 0) {
          toast.error("Each color must have at least one image");
          return;
        }
      }

      if (!formData.image && !enableVariants) {
        toast.error("Please upload a product image");
        return;
      }

      // Prepare product data
      const productVariants = enableVariants ? variants
        .filter(v => v.color.trim())
        .map(v => ({ color: v.color.trim(), images: v.images })) : undefined;

      const mainImage = enableVariants && productVariants && productVariants.length > 0 
        ? productVariants[0].images[0] 
        : formData.image;

      try {
        await addProduct({
          name: name.trim(),
          category: formData.category,
          price: price,
          isAvailable: formData.isAvailable,
          description: description.trim(),
          image: mainImage,
          has_variants: enableVariants,
          variants: productVariants,
        });
        
        toast.success("Product added successfully!");
        
        // Clear form - this is local state so it won't cause parent re-render
        setFormData({
          name: "",
          category: "",
          price: 0,
          isAvailable: true,
          description: "",
          image: "",
        });
        setEnableVariants(false);
        setVariants([{ id: "1", color: "", images: [] }]);
        
        // Clear DOM inputs
        if (nameRef.current) nameRef.current.value = "";
        if (descRef.current) descRef.current.value = "";
        if (priceRef.current) priceRef.current.value = "";
        
      } catch (error) {
        toast.error("Failed to add product");
      }
    };

    const handleClear = () => {
      setFormData({
        name: "",
        category: "",
        price: 0,
        isAvailable: true,
        description: "",
        image: "",
      });
      setEnableVariants(false);
      setVariants([{ id: "1", color: "", images: [] }]);
      
      if (nameRef.current) nameRef.current.value = "";
      if (descRef.current) descRef.current.value = "";
      if (priceRef.current) priceRef.current.value = "";
    };

    return (
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
        {/* Product Name */}
        <div>
          <Label htmlFor="name">
            Product Name <span className="text-red-500">*</span>
          </Label>
          <input
            type="text"
            id="name"
            ref={nameRef}
            placeholder="e.g., LED Ceiling Light - Modern Round"
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2"
            required
          />
        </div>

        {/* Category */}
        <div>
          <Label htmlFor="category">
            Category <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.category} onValueChange={handleCategoryChange}>
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

        {/* Price */}
        <div>
          <Label htmlFor="price">
            Price (LKR) <span className="text-red-500">*</span>
          </Label>
          <input
            type="number"
            id="price"
            min="0"
            step="1"
            ref={priceRef}
            placeholder="e.g., 2500"
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2"
            required
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">
            Description <span className="text-red-500">*</span>
          </Label>
          <textarea
            id="description"
            ref={descRef}
            placeholder="Enter product description..."
            className="flex min-h-[120px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2"
            required
          />
        </div>

        {/* Main Image - Only if not using variants */}
        {!enableVariants && (
          <div>
            <Label>
              Product Image <span className="text-red-500">*</span>
            </Label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith("image/")) {
                  uploadMainImage(file);
                }
              }}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-gray-300"
              }`}
            >
              {formData.image ? (
                <div className="space-y-3">
                  <img src={formData.image} alt="Product" className="max-h-48 mx-auto rounded" />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image: "" }))}
                    className="text-red-500 text-sm hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <ImagePlus className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 mb-2">Drag and drop an image here</p>
                  <p className="text-gray-500 text-sm mb-4">or</p>
                  <label className="inline-block">
                    <Button type="button" variant="outline" asChild>
                      <span className="cursor-pointer">Choose File</span>
                    </Button>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadMainImage(file);
                      }} 
                    />
                  </label>
                  {isUploading && <p className="mt-2 text-sm text-[#D4AF37]">Uploading...</p>}
                </>
              )}
            </div>
          </div>
        )}

        {/* Enable Variants Toggle */}
        <div className="border-t pt-6">
          <div className="flex items-center gap-3">
            <input
              id="enableVariants"
              type="checkbox"
              checked={enableVariants}
              onChange={handleToggleVariants}
              className="w-5 h-5"
            />
            <Label htmlFor="enableVariants" className="text-base font-semibold">
              Enable Color Variants
            </Label>
          </div>

          {enableVariants && (
            <div className="space-y-4 mt-4">
              <p className="text-sm text-gray-600">
                Add different color options for this product. Each color can have multiple images.
              </p>
              
              {variants.map((variant, index) => (
                <div key={variant.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <Label>Color {index + 1} <span className="text-red-500">*</span></Label>
                      <Input
                        value={variant.color}
                        onChange={(e) => updateVariantColorDirect(variant.id, e.target.value)}
                        placeholder="e.g., Chrome, Black, White"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label>Images <span className="text-red-500">*</span> (min 1)</Label>
                      <div 
                        className="mt-1"
                        onDragOver={(e) => { 
                          e.preventDefault(); 
                          setVariantDragging(prev => ({...prev, [variant.id]: true})); 
                        }}
                        onDragLeave={() => setVariantDragging(prev => ({...prev, [variant.id]: false}))}
                        onDrop={async (e) => {
                          e.preventDefault();
                          setVariantDragging(prev => ({...prev, [variant.id]: false}));
                          const file = e.dataTransfer.files[0];
                          if (file && file.type.startsWith("image/")) {
                            await uploadVariantImage(variant.id, file);
                          }
                        }}
                      >
                        <div className="flex flex-wrap gap-2 mb-2">
                          {variant.images.map((img, imgIdx) => (
                            <div key={imgIdx} className="relative group">
                              <img src={img} alt={`${variant.color} ${imgIdx + 1}`} className="w-16 h-16 object-cover rounded" />
                              <button
                                type="button"
                                onClick={() => removeVariantImage(variant.id, imgIdx)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <label className={`flex flex-col items-center justify-center w-16 h-16 border-2 border-dashed rounded cursor-pointer transition-colors ${
                            variantDragging[variant.id] 
                              ? 'border-[#D4AF37] bg-[#D4AF37]/5' 
                              : 'border-gray-300 hover:border-[#D4AF37] hover:bg-gray-50'
                          }`}>
                            <ImagePlus className="w-5 h-5 text-gray-400" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadVariantImage(variant.id, file);
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                    {variants.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariant(variant.id)}
                        className="text-red-500 hover:text-red-700 mt-6"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addVariant}
                className="w-full"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Another Color
              </Button>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1 bg-black hover:bg-[#D4AF37] text-white">
            Add Product
          </Button>
          <Button type="button" variant="outline" onClick={handleClear}>
            Clear Form
          </Button>
        </div>
      </form>
    );
  }
}