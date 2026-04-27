import { useState } from "react";
import { Plus, Trash2, Edit2, CheckCircle, XCircle, List, Image as ImageIcon, Save, X, Lightbulb, Bath, Wrench, Zap, HardHat, Hammer, Drill, Cable, Power, Gauge, Sparkles, Loader2, Copy, Upload, Droplets, Waves, Paintbrush, Scissors, Package, Box, Timer, Thermometer, Fan, Snowflake, GripVertical, Settings, Cog, SprayCan, PaintBucket, Flame, Shield, Pencil, Leaf, Utensils, ArrowRight, Download, FileSpreadsheet, Clipboard } from "lucide-react";
import { useAdmin, Category } from "../../context/AdminContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import ImageUpload from "../../components/admin/ImageUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { generatePrompt, getCategoryColor, getTextPrompt, ICON_PROMPTS } from "../../../lib/iconGenerator";

const ICON_OPTIONS = [
  { name: "Lightbulb", icon: Lightbulb },
  { name: "Bath", icon: Bath },
  { name: "Wrench", icon: Wrench },
  { name: "Zap", icon: Zap },
  { name: "HardHat", icon: HardHat },
  { name: "Hammer", icon: Hammer },
  { name: "Drill", icon: Drill },
  { name: "Cable", icon: Cable },
  { name: "Power", icon: Power },
  { name: "Gauge", icon: Gauge },
  { name: "Droplets", icon: Droplets },
  { name: "Waves", icon: Waves },
  { name: "Paintbrush", icon: Paintbrush },
  { name: "Scissors", icon: Scissors },
  { name: "Package", icon: Package },
  { name: "Box", icon: Box },
  { name: "Timer", icon: Timer },
  { name: "Thermometer", icon: Thermometer },
  { name: "Fan", icon: Fan },
  { name: "Snowflake", icon: Snowflake },
  { name: "Settings", icon: Settings },
  { name: "Cog", icon: Cog },
  { name: "SprayCan", icon: SprayCan },
  { name: "PaintBucket", icon: PaintBucket },
  { name: "Flame", icon: Flame },
  { name: "Shield", icon: Shield },
  { name: "Pencil", icon: Pencil },
  { name: "Leaf", icon: Leaf },
  { name: "Utensils", icon: Utensils },
  { name: "ArrowRight", icon: ArrowRight },
];

export default function AdminCategories() {
  const { categories, addCategory, updateCategory, deleteCategory, toggleCategoryStatus } = useAdmin();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [iconType, setIconType] = useState<"lucide" | "ai" | "image">("lucide");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generatedTextPrompt, setGeneratedTextPrompt] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

const safeCategories = categories || [];

  const filteredCategories = safeCategories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelectCategory = (id: string) => {
    const newSet = new Set(selectedCategories);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedCategories(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedCategories.size === filteredCategories.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(filteredCategories.map(c => c.id)));
    }
  };

  const exportCategoriesCSV = () => {
    const headers = ["name", "description", "image", "icon", "color", "isActive"];
    const csvContent = [
      headers.join(","),
      ...safeCategories.map(cat => [
        `"${(cat.name || "").replace(/"/g, '""')}"`,
        `"${(cat.description || "").replace(/"/g, '""')}"`,
        `"${(cat.image || "").replace(/"/g, '""')}"`,
        `"${(cat.icon || "").replace(/"/g, '""')}"`,
        `"${(cat.color || "").replace(/"/g, '""')}"`,
        cat.isActive
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `categories_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Categories exported successfully!");
  };

  const importCategoriesCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, ""));
      
      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, "").replace(/""/g, '"'));
        if (values.length >= 1 && values[0]) {
          const categoryData = {
            name: values[0] || "",
            description: values[1] || "",
            image: values[2] || "",
            icon: values[3] || "Lightbulb",
            color: values[4] || "bg-blue-500",
            isActive: values[5]?.toLowerCase() !== "false"
          };
          addCategory(categoryData);
          imported++;
        }
      }
      
      toast.success(`${imported} categories imported!`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkPasteData, setBulkPasteData] = useState("");

  const handleBulkPasteImport = () => {
    if (!bulkPasteData.trim()) {
      toast.error("Please paste some data first");
      return;
    }

    const lines = bulkPasteData.trim().split("\n");
    let imported = 0;

    for (const line of lines) {
      if (!line.trim()) continue;
      
      const values = line.split("\t").map(v => v.trim());
      if (values.length >= 1 && values[0]) {
        const categoryData = {
          name: values[0] || "",
          description: values[1] || "",
          image: values[2] || "",
          icon: values[3] || "Lightbulb",
          color: values[4] || "bg-blue-500",
          isActive: values[5]?.toLowerCase() !== "false"
        };
        addCategory(categoryData);
        imported++;
      }
    }

    toast.success(`${imported} categories imported from paste!`);
    setShowBulkPaste(false);
    setBulkPasteData("");
  };

  const bulkEnable = () => {
    selectedCategories.forEach(id => {
      const cat = safeCategories.find(c => c.id === id);
      if (cat && !cat.isActive) {
        toggleCategoryStatus(id);
      }
    });
    toast.success(`${selectedCategories.size} categories enabled`);
    setSelectedCategories(new Set());
  };

  const bulkDisable = () => {
    selectedCategories.forEach(id => {
      const cat = safeCategories.find(c => c.id === id);
      if (cat && cat.isActive) {
        toggleCategoryStatus(id);
      }
    });
    toast.success(`${selectedCategories.size} categories disabled`);
    setSelectedCategories(new Set());
  };

  const bulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedCategories.size} categories?`)) {
      selectedCategories.forEach(id => deleteCategory(id));
      toast.success(`${selectedCategories.size} categories deleted`);
      setSelectedCategories(new Set());
    }
  };

  const getCategoryIcon = (icon: string | undefined, name: string) => {
    if (icon) return icon;
    const lower = name.toLowerCase();
    if (lower.includes("light")) return "Lightbulb";
    if (lower.includes("bath") || lower.includes("shower") || lower.includes("toilet")) return "Bath";
    if (lower.includes("plumb") || lower.includes("valve") || lower.includes("drain") || lower.includes("water") || lower.includes("tap") || lower.includes("mixer")) return "Wrench";
    if (lower.includes("electr") || lower.includes("gas") || lower.includes("power")) return "Zap";
    if (lower.includes("construct") || lower.includes("tool") || lower.includes("paint") || lower.includes("hardhat") || lower.includes("appliance")) return "HardHat";
    return "Lightbulb";
  };

  const getIconComponent = (iconName: string) => {
    const found = ICON_OPTIONS.find(opt => opt.name === iconName);
    return found ? found.icon : Lightbulb;
  };

  const autoAssignIcons = () => {
    safeCategories.forEach(category => {
      const icon = getCategoryIcon(undefined, category.name);
      if (category.icon !== icon) {
        updateCategory(category.id, { ...category, icon });
      }
    });
    toast.success("Icons assigned to all categories!");
  };

  const handleGeneratePrompts = () => {
    if (!formData.name) {
      toast.error("Please enter a category name first");
      return;
    }
    const bannerPrompt = getTextPrompt(formData.name, "banner");
    setGeneratedTextPrompt(bannerPrompt);
    toast.success("Banner prompt generated!");
  };

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    icon: "Lightbulb",
    color: "bg-blue-500",
    isActive: true
  });

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Category name is required");
      return;
    }
    addCategory(formData);
    toast.success("Category added successfully");
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    if (!formData.name) {
      toast.error("Category name is required");
      return;
    }
    updateCategory(editingCategory.id, formData);
    toast.success("Category updated successfully");
    setIsEditDialogOpen(false);
    setEditingCategory(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      image: "",
      icon: "Lightbulb",
      color: "bg-blue-500",
      isActive: true
    });
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    const isIconImage = category.icon && (category.icon.startsWith("http") || category.icon.startsWith("/"));
    setIconType(isIconImage ? "ai" : "lucide");
    setFormData({
      name: category.name,
      description: category.description,
      image: category.image,
      icon: category.icon || "Lightbulb",
      color: category.color,
      isActive: category.isActive
    });
    setIsEditDialogOpen(true);
  };

  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-orange-500",
    "bg-indigo-500",
    "bg-black"
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Category Management</h1>
          <p className="text-gray-600">Add, edit, and manage your product categories</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={autoAssignIcons}
            variant="outline"
            className="border-purple-500 text-purple-600 hover:bg-purple-50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Auto-Assign Icons
          </Button>
<Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-black hover:bg-[#D4AF37] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
          <Button
            onClick={exportCategoriesCSV}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
<label className="cursor-pointer border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Import CSV
            <input type="file" accept=".csv" onChange={importCategoriesCSV} className="hidden" />
          </label>
          <button 
            onClick={() => setShowBulkPaste(true)}
            className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Clipboard className="w-4 h-4" />
            Paste Import
          </button>
        </div>
      </div>

      {/* Bulk Paste Dialog */}
      {showBulkPaste && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Bulk Paste Categories</h3>
            <p className="text-sm text-gray-500 mb-2">Paste Excel data (tab-separated): Name | Description | Image URL | Icon | Color | Active</p>
            <textarea
              value={bulkPasteData}
              onChange={(e) => setBulkPasteData(e.target.value)}
              placeholder="Lighting	Premium lighting products	https://...	Lightbulb	bg-blue-500	true&#10;Bathroom	Bathroom fittings	https://...	Bath	bg-green-500	true"
              className="w-full h-64 p-3 border rounded-lg font-mono text-sm"
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button 
                onClick={() => { setShowBulkPaste(false); setBulkPasteData(""); }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleBulkPasteImport}
                className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C5A028] text-black rounded-lg"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        {selectedCategories.size > 0 && (
          <div className="flex gap-2">
            <Button onClick={toggleSelectAll} variant="outline" size="sm">
              {selectedCategories.size === filteredCategories.length ? "Deselect All" : "Select All"}
            </Button>
            <Button onClick={bulkEnable} variant="outline" className="text-green-600 hover:bg-green-50" size="sm">
              Enable ({selectedCategories.size})
            </Button>
            <Button onClick={bulkDisable} variant="outline" className="text-yellow-600 hover:bg-yellow-50" size="sm">
              Disable ({selectedCategories.size})
            </Button>
            <Button onClick={bulkDelete} variant="outline" className="text-red-600 hover:bg-red-50" size="sm">
              Delete ({selectedCategories.size})
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <div key={category.id} className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 flex flex-col ${selectedCategories.has(category.id) ? 'border-[#D4AF37]' : 'border-gray-100'}`}>
            <div className="relative h-40">
              <img 
                src={category.image || "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500"} 
                alt={category.name} 
                className={`w-full h-full object-cover ${!category.isActive ? 'grayscale' : ''}`}
              />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute top-4 left-4 z-10">
              <input
                type="checkbox"
                checked={selectedCategories.has(category.id)}
                onChange={() => toggleSelectCategory(category.id)}
                className="w-5 h-5 rounded border-gray-300 accent-black cursor-pointer"
              />
            </div>
            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${category.isActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                {category.isActive ? 'Active' : 'Disabled'}
              </div>
            </div>
            
            <div className="p-6 flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 ${category.color} rounded-lg flex items-center justify-center`}>
                  {(() => {
                    const IconComp = getIconComponent(getCategoryIcon(category.icon, category.name));
                    return <IconComp className="w-4 h-4 text-white" />;
                  })()}
                </div>
                <h2 className="text-xl font-bold">{category.name}</h2>
              </div>
              <p className="text-gray-600 text-sm mb-6 line-clamp-2">{category.description}</p>
              
              <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => openEditDialog(category)}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={category.isActive ? "text-red-500 hover:text-red-600" : "text-green-500 hover:text-green-600"}
                  onClick={() => toggleCategoryStatus(category.id)}
                >
                  {category.isActive ? (
                    <><XCircle className="w-4 h-4 mr-2" /> Disable</>
                  ) : (
                    <><CheckCircle className="w-4 h-4 mr-2" /> Enable</>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this category? Products in this category might become uncategorized.")) {
                      deleteCategory(category.id);
                      toast.success("Category deleted");
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCategory} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input 
                id="name" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Solar Lighting"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the products in this category..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Category Banner Image</Label>
              <ImageUpload 
                value={formData.image}
                onChange={(val) => setFormData({ ...formData, image: val })}
                label=""
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Category Icon</Label>
                <button
                  type="button"
                  onClick={handleGeneratePrompts}
                  disabled={isGeneratingAI || !formData.name}
                  className="py-1 px-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white disabled:opacity-50"
                >
                  {isGeneratingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Generate
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-2">Select an icon for this category</p>
              <div className="grid grid-cols-5 gap-2">
                {ICON_OPTIONS.map(({ name, icon: Icon }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: formData.icon === name ? "" : name })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.icon === name ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-gray-200 hover:border-gray-300"
                    }`}
                    title={name}
                  >
                    <Icon className="w-6 h-6 mx-auto" />
                  </button>
                ))}
              </div>
            </div>
            {generatedTextPrompt && (
              <div className="space-y-2">
                <Label>Banner Prompt</Label>
                <div className="relative">
                  <textarea
                    readOnly
                    value={generatedTextPrompt}
                    className="w-full h-20 p-3 text-xs bg-gray-50 border rounded-lg resize-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedTextPrompt);
                      toast.success("Prompt copied!");
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-[#D4AF37] rounded hover:bg-[#C5A028]"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Accent Color</Label>
                 <div className="flex flex-wrap gap-2">
                   {colors.map((color) => (
                     <button
                       key={color}
                       type="button"
                       className={`w-6 h-6 rounded-full ${color} ${formData.color === color ? 'ring-2 ring-offset-2 ring-black' : ''}`}
                       onClick={() => setFormData({ ...formData, color })}
                     />
                   ))}
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 <input 
                   type="checkbox" 
                   id="isActive"
                   checked={formData.isActive}
                   onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                   className="rounded border-gray-300"
                 />
                 <Label htmlFor="isActive" className="cursor-pointer">Active Category</Label>
               </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-black hover:bg-[#D4AF37] text-white">Save Category</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Category: {editingCategory?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateCategory} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Category Name</Label>
              <Input 
                id="edit-name" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea 
                id="edit-description" 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Category Banner Image</Label>
              <ImageUpload 
                value={formData.image}
                onChange={(val) => setFormData({ ...formData, image: val })}
                label=""
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Category Icon</Label>
                <button
                  type="button"
                  onClick={handleGeneratePrompts}
                  disabled={isGeneratingAI || !formData.name}
                  className="py-1 px-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white disabled:opacity-50"
                >
                  {isGeneratingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Generate
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-2">Select an icon for this category</p>
              <div className="grid grid-cols-5 gap-2">
                {ICON_OPTIONS.map(({ name, icon: Icon }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: formData.icon === name ? "" : name })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.icon === name ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-gray-200 hover:border-gray-300"
                    }`}
                    title={name}
                  >
                    <Icon className="w-6 h-6 mx-auto" />
                  </button>
                ))}
              </div>
            </div>
            {generatedTextPrompt && (
              <div className="space-y-2">
                <Label>Banner Prompt</Label>
                <div className="relative">
                  <textarea
                    readOnly
                    value={generatedTextPrompt}
                    className="w-full h-20 p-3 text-xs bg-gray-50 border rounded-lg resize-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedTextPrompt);
                      toast.success("Prompt copied!");
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-[#D4AF37] rounded hover:bg-[#C5A028]"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Accent Color</Label>
                 <div className="flex flex-wrap gap-2">
                   {colors.map((color) => (
                     <button
                       key={color}
                       type="button"
                       className={`w-6 h-6 rounded-full ${color} ${formData.color === color ? 'ring-2 ring-offset-2 ring-black' : ''}`}
                       onClick={() => setFormData({ ...formData, color })}
                     />
                   ))}
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 <input 
                   type="checkbox" 
                   id="edit-isActive"
                   checked={formData.isActive}
                   onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                   className="rounded border-gray-300"
                 />
                 <Label htmlFor="edit-isActive" className="cursor-pointer">Active Category</Label>
               </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                setEditingCategory(null);
              }}>Cancel</Button>
              <Button type="submit" className="bg-black hover:bg-[#D4AF37] text-white">Update Category</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
