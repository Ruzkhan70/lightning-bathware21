import { useState } from "react";
import { Plus, Trash2, Edit2, CheckCircle, XCircle, List, Image as ImageIcon, Save, X, Lightbulb, Bath, Wrench, Zap, HardHat, Hammer, Drill, Cable, Power, Gauge, Sparkles, Loader2, Copy, Upload } from "lucide-react";
import { useAdmin, Category } from "../../context/AdminContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import ImageUpload from "../../components/admin/ImageUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { generatePrompt, getCategoryColor, getTextPrompt, ICON_PROMPTS } from "../../../lib/iconGenerator";

export default function AdminCategories() {
  const { categories, addCategory, updateCategory, deleteCategory, toggleCategoryStatus } = useAdmin();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [iconType, setIconType] = useState<"lucide" | "ai" | "image">("lucide");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generatedTextPrompt, setGeneratedTextPrompt] = useState("");

const safeCategories = categories || [];

  const handleGeneratePrompts = () => {
    if (!formData.name) {
      toast.error("Please enter a category name first");
      return;
    }
    const iconPrompt = getTextPrompt(formData.name, "icon");
    const bannerPrompt = getTextPrompt(formData.name, "banner");
    setGeneratedTextPrompt(`${iconPrompt}\n\n---\n\n${bannerPrompt}`);
    toast.success("Prompts generated!");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Category Management</h1>
          <p className="text-gray-600">Add, edit, and manage your product categories</p>
        </div>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-black hover:bg-[#D4AF37] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {safeCategories.map((category) => (
          <div key={category.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 flex flex-col">
            <div className="relative h-40">
              <img 
                src={category.image || "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500"} 
                alt={category.name} 
                className={`w-full h-full object-cover ${!category.isActive ? 'grayscale' : ''}`}
              />
              <div className="absolute inset-0 bg-black/20" />
              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${category.isActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                {category.isActive ? 'Active' : 'Disabled'}
              </div>
            </div>
            
            <div className="p-6 flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 ${category.color} rounded-lg flex items-center justify-center`}>
                  <List className="w-4 h-4 text-white" />
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
                  className="py-1 px-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  <Sparkles className="w-3 h-3" />
                  Generate
                </button>
              </div>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setIconType("lucide")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    iconType === "lucide" ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Use Icon
                </button>
                <button
                  type="button"
                  onClick={() => setIconType("image")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                    iconType === "image" ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Upload
                </button>
              </div>
              {iconType === "lucide" ? (
                <div className="grid grid-cols-5 gap-2">
                  {[
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
                  ].map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: name })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.icon === name ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto" />
                    </button>
                  ))}
                </div>
              ) : iconType === "image" ? (
                <ImageUpload
                  value={formData.icon}
                  onChange={(val) => setFormData({ ...formData, icon: val })}
                  label="Upload Icon"
                  maxSizeMB={2}
                />
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {formData.icon && formData.icon.startsWith("http") ? (
                      <div className="space-y-3">
                        <img src={formData.icon} alt="Generated Icon" className="w-20 h-20 mx-auto rounded-lg object-cover" />
                        <p className="text-sm text-gray-600">Icon generated for: <strong>{formData.name}</strong></p>
                        <Button type="button" onClick={handleGeneratePrompts} disabled={isGeneratingAI} variant="outline" className="w-full">
                          {isGeneratingAI ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Regenerating...</> : <><Sparkles className="w-4 h-4 mr-2" />Regenerate Icon</>}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Sparkles className="w-12 h-12 mx-auto text-gray-400" />
                        <p className="text-sm text-gray-600">Enter a category name and click generate to create an AI icon</p>
                        <Button type="button" onClick={handleGeneratePrompts} disabled={isGeneratingAI || !formData.name} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                          {isGeneratingAI ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate Icon with AI</>}
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 text-center">Powered by Google Gemini</p>
                </div>
              )}
            </div>
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
              <div className="flex gap-2 mb-2">
                <div className="flex-1">
                  <ImageUpload 
                    value={formData.image}
                    onChange={(val) => setFormData({ ...formData, image: val })}
                    label=""
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGeneratePrompts}
                  disabled={isGeneratingAI}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isGeneratingAI ? "bg-gray-300 cursor-not-allowed" : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  }`}
                >
                  {isGeneratingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  AI Banner
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Category Icon</Label>
                <button
                  type="button"
                  onClick={handleGeneratePrompts}
                  className="py-1 px-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  <Sparkles className="w-3 h-3" />
                  Generate
                </button>
              </div>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setIconType("lucide")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    iconType === "lucide" ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Use Icon
                </button>
                <button
                  type="button"
                  onClick={() => setIconType("image")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                    iconType === "image" ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Upload
                </button>
              </div>
              {iconType === "lucide" ? (
                <div className="grid grid-cols-5 gap-2">
                  {[
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
                  ].map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: name })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.icon === name ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto" />
                    </button>
                  ))}
                </div>
              ) : iconType === "image" ? (
                <ImageUpload
                  value={formData.icon}
                  onChange={(val) => setFormData({ ...formData, icon: val })}
                  label="Upload Icon"
                  maxSizeMB={2}
                />
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {formData.icon && formData.icon.startsWith("http") ? (
                      <div className="space-y-3">
                        <img src={formData.icon} alt="Generated Icon" className="w-20 h-20 mx-auto rounded-lg object-cover" />
                        <p className="text-sm text-gray-600">Icon generated for: <strong>{formData.name}</strong></p>
                        <Button
                          type="button"
                          onClick={handleGeneratePrompts}
                          disabled={isGeneratingAI}
                          variant="outline"
                          className="w-full"
                        >
                          {isGeneratingAI ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Regenerating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Regenerate Icon
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Sparkles className="w-12 h-12 mx-auto text-gray-400" />
                        <p className="text-sm text-gray-600">
                          Enter a category name and click generate to create an AI icon
                        </p>
                        <Button
                          type="button"
                          onClick={handleGeneratePrompts}
                          disabled={isGeneratingAI || !formData.name}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                        >
                          {isGeneratingAI ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate Icon with AI
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Powered by Google Gemini • Generates unique icons based on category name
                  </p>
                </div>
              )}
            </div>
            {generatedTextPrompt && (
              <div className="space-y-2">
                <Label>AI Prompt (Copy & Use Elsewhere)</Label>
                <div className="relative">
                  <textarea
                    readOnly
                    value={generatedTextPrompt}
                    className="w-full h-24 p-3 text-xs bg-gray-50 border rounded-lg resize-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedTextPrompt);
                      toast.success("Prompt copied to clipboard!");
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-[#D4AF37] rounded hover:bg-[#C5A028]"
                  >
                    <Copy className="w-4 h-4 text-black" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">Copy this prompt and use in DALL-E, Midjourney, Canva, or any AI image generator</p>
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
