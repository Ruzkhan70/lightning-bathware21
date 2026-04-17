import { useState, useEffect } from "react";
import { Bell, Trash2, Eye, Info, Clock, Check, X, Loader2, Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import { db } from "../../../firebase";
import { collection, addDoc, onSnapshot, query, orderBy, where, deleteDoc, doc, updateDoc, getDocs, serverTimestamp, Timestamp } from "firebase/firestore";
import { useAdmin } from "../../context/AdminContext";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: "offer" | "terms" | "product" | "general";
  createdAt: Timestamp | Date | null;
  expiresAt?: Timestamp | Date | null;
  isActive: boolean;
  createdBy: string;
}

const typeOptions = [
  { value: "general", label: "General Notice", icon: Info, color: "text-gray-600 bg-gray-50" },
];

const expiryOptions = [
  { value: 24, label: "24 hours" },
  { value: 72, label: "3 days" },
  { value: 168, label: "7 days" },
  { value: 720, label: "30 days" },
  { value: 0, label: "No expiry" },
];

export default function AdminAnnouncements() {
  const { adminEmail } = useAdmin();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "general" as Announcement["type"],
    expiresInHours: 72,
  });

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Announcement[];
      setAnnouncements(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching announcements:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const activeAnnouncement = announcements.find(a => a.isActive);

  const handlePreview = () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error("Please enter both title and message for preview");
      return;
    }
    setShowPreview(true);
  };

  const handleSubmit = async (e: React.FormEvent, action: "publish" | "preview") => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!formData.message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (action === "preview") {
      handlePreview();
      return;
    }

    setIsSubmitting(true);
    try {
      // First, deactivate any existing active announcements
      const q = query(collection(db, "announcements"));
      const snapshot = await getDocs(q);
      
      const deactivatePromises = snapshot.docs
        .filter(docSnap => docSnap.data().isActive === true)
        .map(docSnap => updateDoc(doc(db, "announcements", docSnap.id), { isActive: false }));
      
      await Promise.all(deactivatePromises);

      const expiresAt = formData.expiresInHours > 0
        ? new Date(Date.now() + formData.expiresInHours * 60 * 60 * 1000).toISOString()
        : null;

      await addDoc(collection(db, "announcements"), {
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        isActive: true,
        createdAt: serverTimestamp(),
        expiresAt: expiresAt,
        createdBy: adminEmail || "admin",
      });

      toast.success("Announcement published!");
      setFormData({ title: "", message: "", type: "general", expiresInHours: 72 });
    } catch (error) {
      console.error("Error creating announcement:", error);
      toast.error(`Failed to publish: ${error instanceof Error ? error.message : "Please try again"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    
    try {
      await deleteAnnouncement(id);
      toast.success("Announcement deleted");
    } catch (error) {
      toast.error("Failed to delete announcement");
    }
  };

  const handleExpire = async (id: string) => {
    try {
      await updateDoc(doc(db, "announcements", id), { isActive: false });
      toast.success("Announcement expired");
    } catch (error) {
      toast.error("Failed to expire announcement");
    }
  };

  const deleteAnnouncement = async (id: string) => {
    await deleteDoc(doc(db, "announcements", id));
  };

  const formatDate = (date: Timestamp | Date | null | undefined) => {
    if (!date) return "No expiry";
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
  };

  const getTypeIcon = (type: string) => {
    const option = typeOptions.find(t => t.value === type);
    const Icon = option?.icon || Info;
    return <Icon className="w-5 h-5" />;
  };

  const getTypeColor = (type: string) => {
    const option = typeOptions.find(t => t.value === type);
    return option?.color || "text-gray-600 bg-gray-50";
  };

  const PreviewBanner = () => (
    <div className={`fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r ${
      formData.type === "offer" ? "from-[#D4AF37] to-[#B8962E]" :
      formData.type === "terms" ? "from-purple-600 to-purple-700" :
      formData.type === "product" ? "from-blue-600 to-blue-700" :
      "from-gray-800 to-gray-900"
    } text-white py-3 px-4 shadow-2xl`}>
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            {getTypeIcon(formData.type)}
          </div>
          <div>
            <p className="font-semibold">{formData.title || "Your Title Here"}</p>
            <p className="text-sm opacity-90">{formData.message || "Your message here"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm bg-white/20 px-2 py-1 rounded">PREVIEW</span>
          <button
            onClick={() => setShowPreview(false)}
            className="p-1 hover:bg-white/20 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Bell className="w-8 h-8 text-[#D4AF37]" />
          Announcements
        </h1>
        <p className="text-gray-600">Create and manage announcements for your customers</p>
      </div>

      {showPreview && <PreviewBanner />}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Create Announcement Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-[#D4AF37]" />
              </span>
              Create New Announcement
            </h2>

            <form onSubmit={(e) => handleSubmit(e, "publish")} className="space-y-6">
              <div>
                <Label>Announcement Type</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {typeOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: option.value as Announcement["type"] })}
                        className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                          formData.type === option.value
                            ? "border-[#D4AF37] bg-[#D4AF37]/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${option.color.replace("bg-", "text-").replace("-50", "")}`} />
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Flash Sale! 20% Off Everything"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Message</Label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="e.g., Use code FLASH20 at checkout to get 20% off all products. Valid until Sunday!"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div>
                <Label>Auto-expire After</Label>
                <select
                  value={formData.expiresInHours}
                  onChange={(e) => setFormData({ ...formData, expiresInHours: parseInt(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                >
                  {expiryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreview}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#B8962E] text-black"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Bell className="w-4 h-4 mr-2" />
                  )}
                  Publish
                </Button>
              </div>
            </form>
          </div>

          {/* Current & History */}
          <div className="space-y-6">
            {/* Current Active Announcement */}
            {activeAnnouncement && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-green-700 font-semibold">Currently Active</span>
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getTypeColor(activeAnnouncement.type)}`}>
                  {getTypeIcon(activeAnnouncement.type)}
                  {typeOptions.find(t => t.value === activeAnnouncement.type)?.label}
                </div>
                <h3 className="text-xl font-bold mt-3 mb-2">{activeAnnouncement.title}</h3>
                <p className="text-gray-600 mb-4">{activeAnnouncement.message}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {activeAnnouncement.expiresAt ? `Expires: ${formatDate(activeAnnouncement.expiresAt)}` : "No expiry"}
                  </span>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-green-200">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExpire(activeAnnouncement.id)}
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Expire Now
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(activeAnnouncement.id)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            )}

            {/* Announcement History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold mb-4">Announcement History</h2>
              {announcements.filter(a => !a.isActive).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No past announcements yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.filter(a => !a.isActive).slice(0, 5).map((announcement) => (
                    <div key={announcement.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-lg ${getTypeColor(announcement.type)}`}>
                          {getTypeIcon(announcement.type)}
                        </div>
                        <div>
                          <p className="font-medium">{announcement.title}</p>
                          <p className="text-sm text-gray-500">{announcement.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(announcement.createdAt)}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(announcement.id)}
                        className="text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
