import { useState, useCallback, useRef, useMemo } from "react";
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

type UploadStep = "input" | "preview" | "uploading";

interface ProductVariant {
  id: string;
  color: string;
  images: string[];
}

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
  
  const [isBulkImageDragging, setIsBulkImageDragging] = useState(false);
  const [isUploadingBulkImages, setIsUploadingBulkImages] = useState(false);
  const [isFileDragging, setIsFileDragging] = useState(false);
  const [quickCategory, setQuickCategory] = useState<string>("");
  const [existingProducts, setExistingProducts] = useState<Set<string>>(new Set());
  const [enableVariants, setEnableVariants] = useState(false);
  const [variantColors, setVariantColors] = useState<string[]>([""]);
  const [variants, setVariants] = useState<ProductVariant[]>([
    { id: "1", color: "", images: [] }
  ]);

  // Completely uncontrolled - only use state on submit
  const nameRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  
  const getFormValues = () => ({
    name: nameRef.current?.value || "",
    category: formData.category,
    price: parseFloat(priceRef.current?.value) || 0,
    isAvailable: formData.isAvailable,
    description: descRef.current?.value || "",
    image: formData.image,
  });

  const handleFormChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateColorAtIndex = useCallback((index: number, color: string) => {
    setVariantColors(prev => {
      const newColors = [...prev];
      newColors[index] = color;
      return newColors;
    });
    setVariants(prev => {
      const updates = [...prev];
      if (updates[index]) {
        updates[index] = { ...updates[index], color };
      }
      return updates;
    });
  }, []);

  const safeCategories = categories || [];

  const generateId = () => `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const typeKeywords: Record<string, string[]> = {
  tap: ['tap', 'mixer', 'faucet', 'bib', 'valve', 'spout', 'bath', 'sink', 'basin', 'cock'],
  shower: ['shower', 'head', 'rain', 'jet', 'handset', 'slide bar', 'diverter', 'multifunction'],
  storage: ['holder', 'rack', 'shelf', 'hook', 'basket', 'stand', 'stool', 'plunger', 'brush', 'soap dish', 'towel ring', 'rod', 'rail'],
  bidet: ['bidet', 'spray', 'jet', 'wash', 'sanit'],
  accessories: ['soap', 'dish', 'tray', 'mat', 'curtain', 'rug', 'lamp', 'mirror', 'light'],
};

const detectProductType = (category: string, productName: string): string => {
  const text = (category + ' ' + productName).toLowerCase();
  for (const [type, keywords] of Object.entries(typeKeywords)) {
    if (keywords.some(k => text.includes(k))) {
      return type;
    }
  }
  return 'tap';
};

const inferCategory = (productName: string, existingCategory: string): string => {
  if (existingCategory) return existingCategory;
  const detectedType = detectProductType('', productName);
  const typeToCategory: Record<string, string> = {
    tap: 'Bathroom Faucets',
    shower: 'Shower Sets',
    storage: 'Bathroom Accessories',
    bidet: 'Bidet Sprays',
    accessories: 'Bathroom Accessories',
  };
  return typeToCategory[detectedType] || 'Bathroom Fittings';
};

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
        const excelCategory = parts[1] || "";
        const inferred = inferCategory(parts[0], excelCategory);
        const categoryMatch = safeCategories.find(
          (c) => c.name.toLowerCase() === inferred.toLowerCase() ||
                 c.name.toLowerCase().includes(inferred.toLowerCase()) ||
                 inferred.toLowerCase().includes(c.name.toLowerCase())
        );
        
        const detectedType = detectProductType(inferred, parts[0]);
        const price = parts.length >= 3 ? parseFloat(parts[2].replace(/[^0-9.]/g, "")) : 0;
        const excelDescription = parts.length >= 4 ? parts[3].trim() : "";
        
        products.push({
          id: generateId(),
          name: parts[0],
          category: categoryMatch?.name || inferred,
          price: isNaN(price) ? 0 : price,
          description: excelDescription,
          image: "",
          isAvailable: true,
          errors: [],
          productType: detectedType,
        });
      }
    }
    return products;
  };

  const parseCSVOrTSV = (content: string): BulkProduct[] => {
    const lines = content.trim().split("\n").filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const products: BulkProduct[] = [];
    const delimiter = lines[0].includes("\t") ? "\t" : ",";
    
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(delimiter).map(p => p.trim().replace(/^"|"$/g, ""));
      
      if (parts.length >= 2) {
        const excelCategory = parts[1] || "";
        const inferred = inferCategory(parts[0], excelCategory);
        const categoryMatch = safeCategories.find(
          (c) => c.name.toLowerCase() === inferred.toLowerCase() ||
                 c.name.toLowerCase().includes(inferred.toLowerCase()) ||
                 inferred.toLowerCase().includes(c.name.toLowerCase())
        );
        
        const detectedType = detectProductType(inferred, parts[0]);
        const price = parts.length >= 3 ? parseFloat(parts[2].replace(/[^0-9.]/g, "")) : 0;
        const excelDescription = parts.length >= 4 ? parts[3].trim() : "";
        
        products.push({
          id: generateId(),
          name: parts[0],
          category: categoryMatch?.name || inferred,
          price: isNaN(price) ? 0 : price,
          description: excelDescription,
          image: "",
          isAvailable: true,
          errors: [],
          productType: detectedType,
        });
      }
    }
    return products;
  };

  const detectDuplicates = (products: BulkProduct[]): BulkProduct[] => {
    const nameCount: Record<string, number> = {};
    const duplicates: BulkProduct[] = [];
    
    products.forEach(p => {
      const normalizedName = p.name.toLowerCase().trim();
      nameCount[normalizedName] = (nameCount[normalizedName] || 0) + 1;
    });
    
    return products.map(p => {
      const normalizedName = p.name.toLowerCase().trim();
      if (nameCount[normalizedName] > 1) {
        return { ...p, isDuplicate: true };
      }
      return p;
    });
  };

  const checkExistingProducts = (products: BulkProduct[]): BulkProduct[] => {
    return products.map(p => {
      const exists = existingProducts.has(p.name.toLowerCase().trim());
      return { ...p, isDuplicate: exists };
    });
  };

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsFileDragging(false);
    
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
      toast.error("Please upload a CSV, TSV, or TXT file");
    }
  }, [safeCategories]);

  const handleQuickCategoryApply = () => {
    if (!quickCategory) return;
    
    setBulkProducts(prev => prev.map(p => {
      if (!p.category) {
        const updated = { ...p, category: quickCategory };
        updated.errors = validateProduct(updated);
        return updated;
      }
      return p;
    }));
    toast.success("Category applied to all products without category");
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
    } else {
      toast.error("Please upload a CSV, TSV, or TXT file");
    }
    
    e.target.value = "";
  };

  const handleProceed = () => {
    if (!bulkData.trim()) {
      toast.error("Please paste product data first");
      return;
    }
    let parsed = parseBulkData(bulkData);
    if (parsed.length === 0) {
      toast.error("No valid products found. Format: Name | Category | Price");
      return;
    }
    
    parsed = detectDuplicates(parsed);
    const duplicates = parsed.filter(p => p.isDuplicate);
    if (duplicates.length > 0) {
      toast.warning(`Found ${duplicates.length} duplicate product names in the list`);
    }
    
    setBulkProducts(parsed);
    setUploadStep("preview");
    toast.success(`Found ${parsed.length} products. Review and edit before uploading.`);
  };

  const handleProceedFromFile = (parsed: BulkProduct[]) => {
    if (parsed.length === 0) {
      toast.error("No valid products found");
      return;
    }
    
    let processed = detectDuplicates(parsed);
    const duplicates = processed.filter(p => p.isDuplicate);
    if (duplicates.length > 0) {
      toast.warning(`Found ${duplicates.length} duplicate product names in the file`);
    }
    
    setBulkProducts(processed);
    setUploadStep("preview");
    toast.success(`Found ${processed.length} products. Review and edit before uploading.`);
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

  const normalizeName = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();
    };
    
    const findBestMatch = (fileName: string, productsNeedingImage: BulkProduct[]) => {
      const normalizedFileName = normalizeName(fileName);
      if (!normalizedFileName) return null;
      
      for (const product of productsNeedingImage) {
        const normalizedProductName = normalizeName(product.name);
        if (normalizedProductName && normalizedFileName.includes(normalizedProductName)) {
          return product;
        }
      }
      
      const fileBaseName = normalizedFileName.split('.')[0];
      if (!fileBaseName || fileBaseName.length < 3) return null;
      
      for (const product of productsNeedingImage) {
        const normalizedProductName = normalizeName(product.name);
        if (normalizedProductName && normalizedProductName.includes(fileBaseName)) {
          return product;
        }
      }
      
      return null;
    };

  const handleBulkImageUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (fileArray.length === 0) {
      toast.error("No image files found");
      return;
    }

    let productsNeedingImage = bulkProducts.filter(p => !p.image);
    if (productsNeedingImage.length === 0) {
      toast.info("All products already have images");
      return;
    }

    setIsUploadingBulkImages(true);
    toast.info(`Uploading ${fileArray.length} images...`);

    const matchedResults: { file: File; product: BulkProduct | null }[] = [];
    const unmatchedFiles: File[] = [];

    for (const file of fileArray) {
      const bestMatch = findBestMatch(file.name, productsNeedingImage);
      if (bestMatch) {
        matchedResults.push({ file, product: bestMatch });
        productsNeedingImage = productsNeedingImage.filter(p => p.id !== bestMatch.id);
      } else {
        unmatchedFiles.push(file);
      }
    }

    for (const result of matchedResults) {
      if (!result.product) continue;
      
      const formData = new FormData();
      formData.append("image", result.file);

      try {
        const response = await fetch(
          `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`,
          { method: "POST", body: formData }
        );
        const data = await response.json();
        
        if (data.success) {
          handleUpdateProduct(result.product.id, "image", data.data.url);
        } else {
          const url = URL.createObjectURL(result.file);
          handleUpdateProduct(result.product.id, "image", url);
        }
      } catch (error) {
        const url = URL.createObjectURL(result.file);
        handleUpdateProduct(result.product.id, "image", url);
      }
    }

    const remainingProducts = bulkProducts.filter(p => !p.image);
    for (let i = 0; i < Math.min(unmatchedFiles.length, remainingProducts.length); i++) {
      const file = unmatchedFiles[i];
      const product = remainingProducts[i];
      
      const formData = new FormData();
      formData.append("image", file);

      try {
        const response = await fetch(
          `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`,
          { method: "POST", body: formData }
        );
        const data = await response.json();
        
        if (data.success) {
          handleUpdateProduct(product.id, "image", data.data.url);
        } else {
          const url = URL.createObjectURL(file);
          handleUpdateProduct(product.id, "image", url);
        }
      } catch (error) {
        const url = URL.createObjectURL(file);
        handleUpdateProduct(product.id, "image", url);
      }
    }
    
    const matched = matchedResults.filter(r => r.product).length;
    const uploaded = matched + Math.min(unmatchedFiles.length, remainingProducts.length);
    toast.success(`Uploaded ${uploaded} images (${matched} matched by name, ${uploaded - matched} sequential)`);
    setIsUploadingBulkImages(false);
  };

  const handleBulkImageDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsBulkImageDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleBulkImageUpload(files);
    }
  }, [bulkProducts]);

  const handleBulkImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleBulkImageUpload(files);
      e.target.value = "";
    }
  };

  const handleRemoveProduct = (id: string) => {
    setBulkProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleUploadAll = async () => {
    const invalidProducts = bulkProducts.filter(p => p.errors.length > 0 || !p.image);
    const duplicates = bulkProducts.filter(p => p.isDuplicate);
    
    if (duplicates.length > 0) {
      const proceed = confirm(`${duplicates.length} products have duplicate names. Upload anyway?`);
      if (!proceed) return;
    }
    
    if (invalidProducts.length > 0) {
      const missing = invalidProducts.filter(p => !p.image).length;
      const errors = invalidProducts.filter(p => p.errors.length > 0).length;
      toast.error(`${missing} products missing images, ${errors} have errors`);
      return;
    }

    setUploadStep("uploading");
    setIsBulkProcessing(true);

    try {
      const productsToUpload = bulkProducts.map(p => ({
        name: p.name,
        category: p.category,
        price: p.price,
        description: p.description,
        image: p.image,
        isAvailable: p.isAvailable,
      }));
      
      await addMultipleProducts(productsToUpload);
      
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
                <h2 className="text-xl font-semibold mb-2">Step 1: Add Product Data</h2>
                <div className="text-gray-600 text-sm space-y-2">
                  <p>Drag and drop a CSV file or paste data from Excel.</p>
                  <code className="bg-gray-100 px-2 py-1 rounded block">
                    Product Name, Category, Price, Description
                  </code>
                  <p className="text-xs text-gray-500">
                    Example: Chrome Bath Faucet, Bathroom Faucets, 2500, Control water flow easily with this faucet
                  </p>
                </div>
              </div>

              <div 
                onDragOver={(e) => { e.preventDefault(); setIsFileDragging(true); }}
                onDragLeave={() => setIsFileDragging(false)}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all mb-4 ${
                  isFileDragging ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-gray-300"
                }`}
              >
                <FileSpreadsheet className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 mb-2">Drag and drop a CSV, TSV, or TXT file</p>
                <p className="text-gray-500 text-sm mb-3">or</p>
                <label className="cursor-pointer">
                  <Button type="button" variant="outline" asChild>
                    <span className="cursor-pointer">Select File</span>
                  </Button>
                  <input 
                    type="file" 
                    accept=".csv,.tsv,.txt" 
                    className="hidden" 
                    onChange={handleFileInputChange}
                  />
                </label>
              </div>

              <div className="text-center text-sm text-gray-500 mb-4">
                — or paste data below —
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
              <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">Step 2: Preview & Edit</h3>
                    <p className="text-sm text-gray-600">Review each product, add categories, images, and generate descriptions</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      onClick={handleBackToInput}
                    >
                      Back
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

                <div className="flex items-center gap-3 bg-white p-3 rounded-lg">
                  <span className="text-sm font-medium whitespace-nowrap">Quick Assign Category:</span>
                  <Select value={quickCategory} onValueChange={setQuickCategory}>
                    <SelectTrigger className="w-48">
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
                  <Button 
                    onClick={handleQuickCategoryApply}
                    variant="outline"
                    size="sm"
                    disabled={!quickCategory}
                  >
                    Apply
                  </Button>
                </div>

                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsBulkImageDragging(true); }}
                  onDragLeave={() => setIsBulkImageDragging(false)}
                  onDrop={handleBulkImageDrop}
                  className={`border-2 border-dashed rounded-lg p-4 transition-all ${
                    isBulkImageDragging ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Images className="w-6 h-6 text-gray-500" />
                      <div>
                        <p className="font-medium text-sm">Drag & drop multiple images here</p>
                        <p className="text-xs text-gray-500">Images will be assigned to products in order</p>
                      </div>
                    </div>
                    <label className="cursor-pointer">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        disabled={isUploadingBulkImages}
                        className="bg-white"
                      >
                        {isUploadingBulkImages ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Select Images"
                        )}
                      </Button>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleBulkImageFileSelect}
                      />
                    </label>
                  </div>
                  {isUploadingBulkImages && (
                    <p className="text-sm text-[#D4AF37] mt-2">Uploading images...</p>
                  )}
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
                        <tr key={product.id} className={`border-b ${product.errors.length > 0 ? "bg-red-50" : product.isDuplicate ? "bg-yellow-50" : ""}`}>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              {product.isDuplicate && (
                                <AlertTriangle className="w-4 h-4 text-yellow-500" title="Duplicate name" />
                              )}
                              {product.isUploading && <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />}
                              {index + 1}
                            </div>
                          </td>
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

    const addVariant = () => {
      setVariantColors([...variantColors, ""]);
      setVariants([...variants, { id: Date.now().toString(), color: "", images: [] }]);
    };

    const removeVariant = (id: string) => {
      if (variants.length > 1) {
        const idx = variants.findIndex(v => v.id === id);
        if (idx >= 0) {
          const newColors = [...variantColors];
          newColors.splice(idx, 1);
          setVariantColors(newColors);
        }
        setVariants(variants.filter(v => v.id !== id));
      }
    };

    const updateVariantColor = (id: string, color: string) => {
      const idx = variants.findIndex(v => v.id === id);
      if (idx >= 0) {
        const newColors = [...variantColors];
        newColors[idx] = color;
        setVariantColors(newColors);
      }
      setVariants(current => {
        const updated = current.map(v => v.id === id ? { ...v, color } : v);
        return [...updated];
      });
    };

    const uploadVariantImage = async (variantId: string, file: File) => {
      const formDataImg = new FormData();
      formDataImg.append("image", file);

      try {
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

    const validateVariants = (): string[] => {
      const errors: string[] = [];
      if (enableVariants) {
        const colors = variants.map(v => v.color.toLowerCase().trim());
        const duplicates = colors.filter((c, i) => c && colors.indexOf(c) !== i);
        if (duplicates.length > 0) {
          errors.push("Duplicate colors found");
        }
        const emptyColors = variants.filter(v => !v.color.trim());
        if (emptyColors.length > 0) {
          errors.push("All colors must have a name");
        }
        const noImages = variants.filter(v => v.images.length === 0);
        if (noImages.length > 0) {
          errors.push("Each color must have at least one image");
        }
      }
      return errors;
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

      if (!formData.image && !enableVariants) {
        toast.error("Please upload a product image");
        return;
      }

      const variantErrors = validateVariants();
      if (variantErrors.length > 0) {
        variantErrors.forEach(err => toast.error(err));
        return;
      }

      const productVariants = enableVariants ? variants
        .filter(v => v.color.trim())
        .map(v => ({ color: v.color.trim(), images: v.images })) : undefined;

      const mainImage = enableVariants && productVariants && productVariants.length > 0 
        ? productVariants[0].images[0] 
        : formData.image;

      const formValues = getFormValues();
      
      await addProduct({
        ...formData,
        name: formValues.name.trim(),
        description: formValues.description.trim(),
        image: mainImage,
        has_variants: enableVariants,
        variants: productVariants,
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
      setVariantColors([""]);
      setVariants([{ id: "1", color: "", images: [] }]);
      setEnableVariants(false);
      if (nameRef.current) nameRef.current.value = "";
      if (descRef.current) descRef.current.value = "";
      if (priceRef.current) priceRef.current.value = "";
    };

    return (
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
        <div>
          <Label htmlFor="name">
            Product Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            ref={nameRef}
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
            ref={priceRef}
            placeholder="e.g., 2500"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">
            Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
              id="description"
              ref={descRef}
              placeholder="Enter product description..."
              className="min-h-[120px]"
              required
            />
        </div>

        <div>
          <Label>Product Image {!enableVariants && <span className="text-red-500">*</span>}</Label>
          {!enableVariants && <ImageUploadComponent />}
          {enableVariants && (
            <p className="text-sm text-gray-500 mb-2">Upload images in the color variants section below</p>
          )}
        </div>

        <div className="border-t pt-6">
          <div className="flex items-center gap-3 mb-4">
            <input
              id="enableVariants"
              type="checkbox"
              checked={enableVariants}
              onChange={(e) => {
                setEnableVariants(e.target.checked);
                if (!e.target.checked) {
                  setVariantColors([""]);
                  setVariants([{ id: "1", color: "", images: [] }]);
                }
              }}
              className="w-5 h-5"
            />
            <Label htmlFor="enableVariants" className="text-base font-semibold">
              Enable Color Variants
            </Label>
          </div>

          {enableVariants && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Add different color options for this product. Each color can have multiple images.
              </p>
              
              {variants.map((variant, index) => (
                <div key={variant.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <Label>Color {index + 1} <span className="text-red-500">*</span></Label>
                      <Input
                        value={variantColors[index] || ""}
                        onChange={(e) => updateColorAtIndex(index, e.target.value)}
                        placeholder="e.g., Chrome, Black, White"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label>Images <span className="text-red-500">*</span> (min 1)</Label>
                      <div className="mt-1">
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
                          <label className="flex flex-col items-center justify-center w-16 h-16 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-[#D4AF37] hover:bg-gray-50 transition-colors">
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
            onClick={() => {
              setFormData({ name: "", category: "", price: 0, isAvailable: true, description: "", image: "" });
              if (nameRef.current) nameRef.current.value = "";
              if (descRef.current) descRef.current.value = "";
              if (priceRef.current) priceRef.current.value = "";
            }}
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