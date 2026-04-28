import { useState, useMemo } from "react";
import { 
  Plus, Trash2, Edit2, CheckCircle, XCircle, 
  Search, Download, Upload, FileSpreadsheet, Clipboard,
  Lightbulb, Bath, Wrench, Zap, HardHat, Hammer, 
  Drill, Cable, Power, Gauge, Droplets, Waves, 
  Paintbrush, Scissors, Package, Box, Timer, 
  Thermometer, Fan, Snowflake, Settings, Cog, 
  SprayCan, PaintBucket, Flame, Shield, Pencil, 
  Leaf, Utensils, ArrowRight, CheckSquare, Square,
  ChevronDown, ChevronUp, Sparkles
} from "lucide-react";
import { useAdmin, Category } from "../../context/AdminContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import ImageUpload from "../../components/admin/ImageUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { getCategoryIcon, getCategoryColor } from "../../../lib/iconGenerator";

const ICONS = [
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

const COLORS = [
  "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-red-500",
  "bg-purple-500", "bg-pink-500", "bg-orange-500", "bg-indigo-500", "bg-black"
];

interface FormData {
  name: string;
  description: string;
  image: string;
  icon: string;
  color: string;
  isActive: boolean;
}

const initialFormData: FormData = {
  name: "",
  description: "",
  image: "",
  icon: "Lightbulb",
  color: "bg-blue-500",
  isActive: true,
};

export default function AdminCategories() {
  const { categories, addCategory, updateCategory, deleteCategory, toggleCategoryStatus } = useAdmin();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortAsc, setSortAsc] = useState(true);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [bulkText, setBulkText] = useState("");

  const safeCategories = useMemo(() => categories || [], [categories]);

  const filtered = useMemo(() => {
    let result = safeCategories.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    result.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [safeCategories, searchQuery, sortAsc]);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(c => c.id)));
    }
  };

  const handleAutoAssign = () => {
    let updated = 0;
    safeCategories.forEach(cat => {
      const newIcon = getCategoryIcon(cat.name);
      const newColor = getCategoryColor(cat.name);
      if (cat.icon !== newIcon || cat.color !== newColor) {
        updateCategory(cat.id, { icon: newIcon, color: newColor });
        updated++;
      }
    });
    toast.success(`Updated ${updated} categories with auto-assigned icons and colors`);
  };

  const getIcon = (name: string) => ICONS.find(i => i.name === name)?.icon || Lightbulb;

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setFormData({
      name: cat.name,
      description: cat.description || "",
      image: cat.image || "",
      icon: cat.icon || "Lightbulb",
      color: cat.color || "bg-blue-500",
      isActive: cat.isActive,
    });
    setIsEditOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    addCategory(formData);
    toast.success("Category added");
    setIsAddOpen(false);
    setFormData(initialFormData);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !editingId) {
      toast.error("Category name is required");
      return;
    }
    updateCategory(editingId, formData);
    toast.success("Category updated");
    setIsEditOpen(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this category? Products may become uncategorized.")) return;
    if (selectedIds.has(id)) {
      const newSet = new Set(selectedIds);
      newSet.delete(id);
      setSelectedIds(newSet);
    }
    deleteCategory(id);
    toast.success("Category deleted");
  };

  const handleBulkEnable = () => {
    selectedIds.forEach(id => {
      const cat = safeCategories.find(c => c.id === id);
      if (cat && !cat.isActive) toggleCategoryStatus(id);
    });
    toast.success(`${selectedIds.size} categories enabled`);
    setSelectedIds(new Set());
  };

  const handleBulkDisable = () => {
    selectedIds.forEach(id => {
      const cat = safeCategories.find(c => c.id === id);
      if (cat && cat.isActive) toggleCategoryStatus(id);
    });
    toast.success(`${selectedIds.size} categories disabled`);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    if (!window.confirm(`Delete ${selectedIds.size} categories?`)) return;
    selectedIds.forEach(id => deleteCategory(id));
    toast.success(`${selectedIds.size} categories deleted`);
    setSelectedIds(new Set());
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) {
      toast.error("Paste some data first");
      return;
    }
    const lines = bulkText.trim().split(/\r?\n/);
    let imported = 0;
    for (const line of lines) {
      if (!line.trim()) continue;
      const values = line.split(/\t|,/);
      if (values[0]?.trim()) {
        const name = values[0].trim();
        const icon = getCategoryIcon(name);
        const color = getCategoryColor(name);
        addCategory({
          name,
          description: values[1]?.trim() || "",
          image: values[2]?.trim() || "",
          icon,
          color,
          isActive: values[5]?.toLowerCase() !== "false",
        });
        imported++;
      }
    }
    toast.success(`${imported} categories imported`);
    setIsBulkOpen(false);
    setBulkText("");
  };

  const handleExportCSV = () => {
    const headers = ["name", "description", "image", "icon", "color", "isActive"];
    const csv = [
      headers.join(","),
      ...safeCategories.map(c => [
        `"${c.name.replace(/"/g, '""')}"`,
        `"${(c.description || "").replace(/"/g, '""')}"`,
        `"${(c.image || "").replace(/"/g, '""')}"`,
        `"${c.icon || "Lightbulb"}"`,
        `"${c.color || "bg-blue-500"}"`,
        c.isActive
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `categories_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("CSV exported");
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").slice(1);
      let imported = 0;
      for (const line of lines) {
        if (!line.trim()) continue;
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, "").replace(/""/g, '"'));
        if (values[0]) {
          addCategory({
            name: values[0],
            description: values[1] || "",
            image: values[2] || "",
            icon: values[3] || "Lightbulb",
            color: values[4] || "bg-blue-500",
            isActive: values[5]?.toLowerCase() !== "false",
          });
          imported++;
        }
      }
      toast.success(`${imported} categories imported`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-gray-600">Manage product categories</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setSortAsc(!sortAsc)}>
            {sortAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="ml-2 hidden sm:inline">A-Z</span>
          </Button>
          <Button variant="outline" onClick={handleAutoAssign} className="border-purple-500 text-purple-600 hover:bg-purple-50">
            <Sparkles className="w-4 h-4" />
            <span className="ml-2 hidden sm:inline">Auto-Assign</span>
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4" />
            <span className="ml-2 hidden sm:inline">Export</span>
          </Button>
          <label className="cursor-pointer border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>
          <Button variant="outline" onClick={() => setIsBulkOpen(true)}>
            <Clipboard className="w-4 h-4" />
            <span className="ml-2 hidden sm:inline">Bulk</span>
          </Button>
          <Button onClick={() => { setFormData(initialFormData); setIsAddOpen(true); }} className="bg-black hover:bg-[#D4AF37]">
            <Plus className="w-4 h-4" />
            <span className="ml-2">Add</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        {selectedIds.size > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={toggleSelectAll}>
              {selectedIds.size === filtered.length ? "Deselect" : "Select All"}
            </Button>
            <Button variant="outline" size="sm" className="text-green-600" onClick={handleBulkEnable}>
              Enable ({selectedIds.size})
            </Button>
            <Button variant="outline" size="sm" className="text-yellow-600" onClick={handleBulkDisable}>
              Disable ({selectedIds.size})
            </Button>
            <Button variant="outline" size="sm" className="text-red-600" onClick={handleBulkDelete}>
              Delete ({selectedIds.size})
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No categories found
          </div>
        ) : (
          filtered.map((cat) => (
            <div 
              key={cat.id} 
              className={`bg-white rounded-xl shadow overflow-hidden border-2 flex flex-col ${
                selectedIds.has(cat.id) ? 'border-[#D4AF37]' : 'border-gray-100'
              }`}
            >
              <div className="relative h-32">
                <img 
                  src={cat.image || "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500"} 
                  alt={cat.name}
                  className={`w-full h-full object-cover ${!cat.isActive ? 'grayscale' : ''}`}
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute top-3 left-3 z-10">
                  <button onClick={() => toggleSelect(cat.id)} className="p-1 bg-white rounded shadow">
                    {selectedIds.has(cat.id) ? (
                      <CheckSquare className="w-5 h-5 text-black" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>
                <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold ${
                  cat.isActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {cat.isActive ? "Active" : "Disabled"}
                </div>
              </div>
              
              <div className="p-4 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 ${cat.color || 'bg-blue-500'} rounded-lg flex items-center justify-center`}>
                    {(() => {
                      const Icon = getIcon(cat.icon || "Lightbulb");
                      return <Icon className="w-4 h-4 text-white" />;
                    })()}
                  </div>
                  <h3 className="font-semibold text-lg truncate">{cat.name}</h3>
                </div>
                <p className="text-gray-500 text-sm line-clamp-2 mb-4">{cat.description || "No description"}</p>
                
                <div className="flex gap-1 mt-auto pt-3 border-t">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(cat)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={cat.isActive ? "text-red-500" : "text-green-500"}
                    onClick={() => toggleCategoryStatus(cat.id)}
                  >
                    {cat.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(cat.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Category name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <ImageUpload 
                value={formData.image}
                onChange={(val) => setFormData({ ...formData, image: val })}
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-6 gap-2">
                {ICONS.map(({ name, icon: Icon }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: name })}
                    className={`p-2 rounded-lg border-2 ${
                      formData.icon === name ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto" />
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`w-6 h-6 rounded-full ${color} ${
                        formData.color === color ? 'ring-2 ring-offset-2 ring-black' : ''
                      }`}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="isActiveAdd"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActiveAdd">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-black hover:bg-[#D4AF37]">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <ImageUpload 
                value={formData.image}
                onChange={(val) => setFormData({ ...formData, image: val })}
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-6 gap-2">
                {ICONS.map(({ name, icon: Icon }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: name })}
                    className={`p-2 rounded-lg border-2 ${
                      formData.icon === name ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto" />
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`w-6 h-6 rounded-full ${color} ${
                        formData.color === color ? 'ring-2 ring-offset-2 ring-black' : ''
                      }`}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="isActiveEdit"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActiveEdit">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsEditOpen(false); setEditingId(null); }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-black hover:bg-[#D4AF37]">Update</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Import Categories</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Paste data from Excel (tab-separated) or CSV. Format: Name | Description | Image | Icon | Color | Active
            </p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Lighting	Premium lights		Lightbulb	bg-blue-500	true&#10;Bathroom	Bath items	Bath	bg-green-500	true"
              className="w-full h-64 p-3 border rounded-lg font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsBulkOpen(false); setBulkText(""); }}>
              Cancel
            </Button>
            <Button onClick={handleBulkImport} className="bg-black hover:bg-[#D4AF37]">
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}