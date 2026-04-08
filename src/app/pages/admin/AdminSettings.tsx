import { useState, useEffect } from "react";
import { 
  Settings, Store, Image, FileText, Shield, User, Lock, Key, 
  Monitor, Smartphone, LogOut, Trash2, Check, ChevronRight, Save,
  Globe, Phone, Mail, MapPin, Clock, Truck, CreditCard, Award,
  Plus, X, CheckCircle, AlertCircle, Zap, RotateCcw, ToggleLeft, ToggleRight
} from "lucide-react";
import { Textarea } from "../../components/ui/textarea";
import ImageUpload from "../../components/admin/ImageUpload";
import { useAdmin, DEFAULT_SITE_CONTENT } from "../../context/AdminContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";

type SettingsSection = 
  | 'store-profile'
  | 'store-assets'
  | 'page-content'
  | 'account'
  | 'security';

interface NavItem {
  id: SettingsSection;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'store-profile', label: 'Store Profile', icon: <Store className="w-5 h-5" /> },
  { id: 'store-assets', label: 'Store Assets', icon: <Image className="w-5 h-5" /> },
  { id: 'page-content', label: 'Page Content', icon: <FileText className="w-5 h-5" /> },
  { id: 'account', label: 'Account', icon: <User className="w-5 h-5" /> },
  { id: 'security', label: 'Security & Devices', icon: <Shield className="w-5 h-5" /> },
];

export default function AdminSettings() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('store-profile');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { 
    adminUsername, 
    changeUsername, 
    changePassword, 
    storeProfile, 
    updateStoreProfile, 
    storeAssets, 
    updateStoreAssets, 
    showAdminLogin, 
    setShowAdminLogin, 
    siteContent, 
    updateSiteContent, 
    resetSiteContent,
    deviceSessions,
    removeDeviceSession,
    logoutDeviceSession,
    currentDeviceId,
    adminEmail
  } = useAdmin();

  // Form states
  const [profileForm, setProfileForm] = useState({ ...storeProfile });
  const [assetsForm, setAssetsForm] = useState({ ...storeAssets });
  const [contentForm, setContentForm] = useState({ ...siteContent });
  const [usernameForm, setUsernameForm] = useState({ newUsername: adminUsername });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Sync form states
  useEffect(() => { setProfileForm({ ...storeProfile }); }, [storeProfile]);
  useEffect(() => { setAssetsForm({ ...storeAssets }); }, [storeAssets]);
  useEffect(() => { setContentForm({ ...siteContent }); }, [siteContent]);
  useEffect(() => { setUsernameForm({ newUsername: adminUsername }); }, [adminUsername]);

  // Profile handlers
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[a-zA-Z0-9]+$/.test(profileForm.adminShortcut || '')) {
      toast.error("Shortcut can only contain letters and numbers");
      return;
    }
    updateStoreProfile(profileForm);
    toast.success("Store profile updated!");
  };

  // Assets handlers
  const handleAssetsSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreAssets(assetsForm);
    toast.success("Store assets updated!");
  };

  // Content handlers
  const handleContentSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteContent(contentForm);
    toast.success("Page content updated!");
  };

  const handleResetContent = async () => {
    if (window.confirm("Reset all page content to default?")) {
      await resetSiteContent();
      setContentForm(DEFAULT_SITE_CONTENT);
      toast.success("Content reset to default!");
    }
  };

  // Account handlers
  const handleUsernameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameForm.newUsername || usernameForm.newUsername.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }
    const success = await changeUsername(usernameForm.newUsername);
    if (success) toast.success("Username updated!");
    else toast.error("Failed to update username");
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    const success = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
    if (success) {
      toast.success("Password updated!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      toast.error("Current password is incorrect");
    }
  };

  // Device handlers
  const handleLogoutAllDevices = async () => {
    if (!window.confirm("Log out from all devices?")) return;
    const otherDevices = deviceSessions?.filter(d => d.status === 'active' && !d.isCurrentDevice) || [];
    for (const device of otherDevices) {
      await logoutDeviceSession(device.deviceId);
    }
    toast.success("Logged out from all other devices");
  };

  const activeNavItem = navItems.find(item => item.id === activeSection);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Settings</h2>
          <button 
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                ${activeSection === item.id 
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium' 
                  : 'text-gray-700 hover:bg-gray-100'}
              `}
            >
              {item.icon}
              <span>{item.label}</span>
              {activeSection === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Settings className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">{activeNavItem?.label}</h1>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {/* Store Profile Section */}
          {activeSection === 'store-profile' && (
            <form onSubmit={handleProfileSave} className="max-w-4xl mx-auto space-y-6">
              <Card title="Store Name & Logo" icon={<Store className="w-5 h-5" />} description="Basic store information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Primary Name</Label>
                    <Input value={profileForm.storeName} onChange={(e) => setProfileForm({...profileForm, storeName: e.target.value})} />
                  </div>
                  <div>
                    <Label>Accent Name</Label>
                    <Input value={profileForm.storeNameAccent} onChange={(e) => setProfileForm({...profileForm, storeNameAccent: e.target.value})} />
                  </div>
                </div>
                <div className="mt-4">
                  <Label>Store Logo</Label>
                  <ImageUpload value={profileForm.storeLogo} onChange={(val) => setProfileForm({...profileForm, storeLogo: val})} label="" />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to use text logo</p>
                </div>
              </Card>

              <Card title="Contact Information" icon={<Phone className="w-5 h-5" />} description="Phone and email displayed on your website">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Primary Phone</Label>
                    <Input value={profileForm.phone} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})} placeholder="+94 11 234 5678" />
                  </div>
                  <div>
                    <Label>Secondary Phone</Label>
                    <Input value={profileForm.secondaryPhone} onChange={(e) => setProfileForm({...profileForm, secondaryPhone: e.target.value})} placeholder="+94 77 123 4567" />
                  </div>
                  <div>
                    <Label>General Email</Label>
                    <Input type="email" value={profileForm.email} onChange={(e) => setProfileForm({...profileForm, email: e.target.value})} />
                  </div>
                  <div>
                    <Label>Sales Email</Label>
                    <Input type="email" value={profileForm.salesEmail} onChange={(e) => setProfileForm({...profileForm, salesEmail: e.target.value})} />
                  </div>
                  <div>
                    <Label>Support Email</Label>
                    <Input type="email" value={profileForm.supportEmail} onChange={(e) => setProfileForm({...profileForm, supportEmail: e.target.value})} />
                  </div>
                </div>
              </Card>

              <Card title="Address" icon={<MapPin className="w-5 h-5" />} description="Your store location">
                <div className="space-y-4">
                  <div>
                    <Label>Street Address</Label>
                    <Input value={profileForm.addressStreet} onChange={(e) => setProfileForm({...profileForm, addressStreet: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>City</Label>
                      <Input value={profileForm.addressCity} onChange={(e) => setProfileForm({...profileForm, addressCity: e.target.value})} />
                    </div>
                    <div>
                      <Label>Country</Label>
                      <Input value={profileForm.addressCountry} onChange={(e) => setProfileForm({...profileForm, addressCountry: e.target.value})} />
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Business Hours" icon={<Clock className="w-5 h-5" />} description="Operating hours shown to customers">
                <div className="space-y-4">
                  <div>
                    <Label>Weekday Hours</Label>
                    <Input value={profileForm.businessHoursWeekday} onChange={(e) => setProfileForm({...profileForm, businessHoursWeekday: e.target.value})} placeholder="Mon-Fri: 9:00 AM - 6:00 PM" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Saturday</Label>
                      <Input value={profileForm.businessHoursSaturday} onChange={(e) => setProfileForm({...profileForm, businessHoursSaturday: e.target.value})} />
                    </div>
                    <div>
                      <Label>Sunday</Label>
                      <Input value={profileForm.businessHoursSunday} onChange={(e) => setProfileForm({...profileForm, businessHoursSunday: e.target.value})} />
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Social Media" icon={<Globe className="w-5 h-5" />} description="Links to your social media profiles">
                <div className="space-y-4">
                  <div>
                    <Label>Facebook URL</Label>
                    <Input value={profileForm.facebookUrl} onChange={(e) => setProfileForm({...profileForm, facebookUrl: e.target.value})} placeholder="https://facebook.com/..." />
                  </div>
                  <div>
                    <Label>Instagram URL</Label>
                    <Input value={profileForm.instagramUrl} onChange={(e) => setProfileForm({...profileForm, instagramUrl: e.target.value})} placeholder="https://instagram.com/..." />
                  </div>
                  <div>
                    <Label>Twitter URL</Label>
                    <Input value={profileForm.twitterUrl} onChange={(e) => setProfileForm({...profileForm, twitterUrl: e.target.value})} placeholder="https://twitter.com/..." />
                  </div>
                </div>
              </Card>

              <Card title="Secret Admin Shortcut" icon={<Zap className="w-5 h-5" />} description="Secret sequence to open admin login">
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800">
                      Type the sequence anywhere on the site to open admin login. Use letters, numbers, or both.
                    </p>
                  </div>
                  <div>
                    <Label>Secret Access Sequence</Label>
                    <Input 
                      value={profileForm.adminShortcut} 
                      onChange={(e) => setProfileForm({...profileForm, adminShortcut: e.target.value})} 
                      placeholder="e.g. admin123 or 4571"
                      className="font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-1">3-20 characters, letters and numbers only</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-600">
                      Fallback: Visit <code className="bg-gray-200 px-1 rounded">/__admin__</code> to access admin login directly.
                    </p>
                  </div>
                </div>
              </Card>

              <Card title="Delivery Settings" icon={<Truck className="w-5 h-5" />} description="Shipping options and pricing">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Colombo Delivery (Rs.)</Label>
                    <Input type="number" value={profileForm.deliveryColomboPrice} onChange={(e) => setProfileForm({...profileForm, deliveryColomboPrice: Number(e.target.value)})} />
                    <p className="text-xs text-gray-500 mt-1">Set to 0 for free delivery</p>
                  </div>
                  <div>
                    <Label>Island-wide Delivery (Rs.)</Label>
                    <Input type="number" value={profileForm.deliveryIslandwidePrice} onChange={(e) => setProfileForm({...profileForm, deliveryIslandwidePrice: Number(e.target.value)})} />
                  </div>
                </div>
              </Card>

              <Card title="Online Payment" icon={<CreditCard className="w-5 h-5" />} description="Enable or disable online payment options">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Enable Online Payment</p>
                    <p className="text-sm text-gray-500">Allow customers to pay via Payhere</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfileForm({...profileForm, enableOnlinePayment: !profileForm.enableOnlinePayment})}
                    className={profileForm.enableOnlinePayment ? 'text-green-600' : 'text-gray-400'}
                  >
                    {profileForm.enableOnlinePayment ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                  </button>
                </div>
                {profileForm.enableOnlinePayment && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                    <p className="text-sm text-amber-800">
                      Requires Payhere credentials in .env file: VITE_PAYHERE_MERCHANT_ID, VITE_PAYHERE_MERCHANT_SECRET
                    </p>
                  </div>
                )}
              </Card>

              <Card title="Home Page Stats" icon={<Award className="w-5 h-5" />} description="Statistics displayed on your homepage">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Years Experience</Label>
                    <Input value={profileForm.statsYearsExperience} onChange={(e) => setProfileForm({...profileForm, statsYearsExperience: e.target.value})} placeholder="10+" />
                  </div>
                  <div>
                    <Label>Products</Label>
                    <Input value={profileForm.statsProducts} onChange={(e) => setProfileForm({...profileForm, statsProducts: e.target.value})} placeholder="350+" />
                  </div>
                  <div>
                    <Label>Customers</Label>
                    <Input value={profileForm.statsCustomers} onChange={(e) => setProfileForm({...profileForm, statsCustomers: e.target.value})} placeholder="5,000+" />
                  </div>
                  <div>
                    <Label>Authentic %</Label>
                    <Input value={profileForm.statsAuthentic} onChange={(e) => setProfileForm({...profileForm, statsAuthentic: e.target.value})} placeholder="100%" />
                  </div>
                </div>
              </Card>

              <Button type="submit" className="w-full bg-[#D4AF37] hover:bg-[#C5A028] text-black">
                <Save className="w-4 h-4 mr-2" />
                Save Store Profile
              </Button>
            </form>
          )}

          {/* Store Assets Section */}
          {activeSection === 'store-assets' && (
            <form onSubmit={handleAssetsSave} className="max-w-4xl mx-auto space-y-6">
              <Card title="Hero Image" icon={<Image className="w-5 h-5" />} description="Main banner on homepage">
                <ImageUpload value={assetsForm.heroImage} onChange={(val) => setAssetsForm({...assetsForm, heroImage: val})} label="Upload hero image" />
                <p className="text-xs text-gray-500 mt-2">Recommended size: 1920x800px</p>
              </Card>

              <Card title="About Page Images" icon={<Image className="w-5 h-5" />} description="Images for the About page">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ImageUpload value={assetsForm.aboutStoryImage} onChange={(val) => setAssetsForm({...assetsForm, aboutStoryImage: val})} label="Our Story Image" />
                  <ImageUpload value={assetsForm.aboutTeamImage} onChange={(val) => setAssetsForm({...assetsForm, aboutTeamImage: val})} label="Our Team Image" />
                </div>
              </Card>

              <Button type="submit" className="w-full bg-[#D4AF37] hover:bg-[#C5A028] text-black">
                <Save className="w-4 h-4 mr-2" />
                Save Store Assets
              </Button>
            </form>
          )}

          {/* Page Content Section */}
          {activeSection === 'page-content' && (
            <form onSubmit={handleContentSave} className="max-w-4xl mx-auto space-y-6">
              <Card title="Home Page" icon={<FileText className="w-5 h-5" />} description="Hero section content">
                <div className="space-y-4">
                  <div>
                    <Label>Hero Title</Label>
                    <Input value={contentForm.home.heroTitle} onChange={(e) => setContentForm({...contentForm, home: {...contentForm.home, heroTitle: e.target.value}})} />
                  </div>
                  <div>
                    <Label>Hero Subtitle</Label>
                    <Textarea value={contentForm.home.heroSubtitle} onChange={(e) => setContentForm({...contentForm, home: {...contentForm.home, heroSubtitle: e.target.value}})} rows={3} />
                  </div>
                  <div>
                    <Label>Hero Button Text</Label>
                    <Input value={contentForm.home.heroButtonText} onChange={(e) => setContentForm({...contentForm, home: {...contentForm.home, heroButtonText: e.target.value}})} />
                  </div>
                </div>
              </Card>

              <Card title="About Page" icon={<FileText className="w-5 h-5" />} description="About page content">
                <div className="space-y-4">
                  <div>
                    <Label>Story Title</Label>
                    <Input value={contentForm.about.storyTitle} onChange={(e) => setContentForm({...contentForm, about: {...contentForm.about, storyTitle: e.target.value}})} />
                  </div>
                  <div>
                    <Label>Story Text</Label>
                    <Textarea value={contentForm.about.storyText} onChange={(e) => setContentForm({...contentForm, about: {...contentForm.about, storyText: e.target.value}})} rows={4} />
                  </div>
                  <div>
                    <Label>Team Title</Label>
                    <Input value={contentForm.about.teamTitle} onChange={(e) => setContentForm({...contentForm, about: {...contentForm.about, teamTitle: e.target.value}})} />
                  </div>
                  <div>
                    <Label>Team Text</Label>
                    <Textarea value={contentForm.about.teamText} onChange={(e) => setContentForm({...contentForm, about: {...contentForm.about, teamText: e.target.value}})} rows={4} />
                  </div>
                </div>
              </Card>

              <Card title="Contact Page" icon={<FileText className="w-5 h-5" />} description="Contact page content">
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input value={contentForm.contact.title} onChange={(e) => setContentForm({...contentForm, contact: {...contentForm.contact, title: e.target.value}})} />
                  </div>
                  <div>
                    <Label>Subtitle</Label>
                    <Input value={contentForm.contact.subtitle} onChange={(e) => setContentForm({...contentForm, contact: {...contentForm.contact, subtitle: e.target.value}})} />
                  </div>
                  <div>
                    <Label>Google Maps Embed URL</Label>
                    <Input value={contentForm.contact.mapUrl} onChange={(e) => setContentForm({...contentForm, contact: {...contentForm.contact, mapUrl: e.target.value}})} placeholder="https://www.google.com/maps/embed?..." />
                  </div>
                </div>
              </Card>

              <Card title="FAQ Section" icon={<FileText className="w-5 h-5" />} description="Frequently asked questions">
                <div className="space-y-4">
                  <div>
                    <Label>FAQ Title</Label>
                    <Input value={contentForm.faq.title} onChange={(e) => setContentForm({...contentForm, faq: {...contentForm.faq, title: e.target.value}})} />
                  </div>
                  {contentForm.faq.items.map((item, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <Label>Question {idx + 1}</Label>
                      <Input 
                        value={item.question} 
                        onChange={(e) => {
                          const newItems = [...contentForm.faq.items];
                          newItems[idx] = { ...newItems[idx], question: e.target.value };
                          setContentForm({...contentForm, faq: {...contentForm.faq, items: newItems}});
                        }}
                        placeholder="Question"
                      />
                      <Textarea 
                        value={item.answer}
                        onChange={(e) => {
                          const newItems = [...contentForm.faq.items];
                          newItems[idx] = { ...newItems[idx], answer: e.target.value };
                          setContentForm({...contentForm, faq: {...contentForm.faq, items: newItems}});
                        }}
                        placeholder="Answer"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Terms and Conditions" icon={<FileText className="w-5 h-5" />} description="Legal terms and policies">
                <div className="space-y-4">
                  <div>
                    <Label>Introduction</Label>
                    <Textarea 
                      value={contentForm.terms.introduction}
                      onChange={(e) => setContentForm({...contentForm, terms: {...contentForm.terms, introduction: e.target.value}})}
                      rows={2}
                      placeholder="Introduction text..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Use [Store Name] as placeholder</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label>Sections</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const newSection = { id: `section-${Date.now()}`, title: "New Section", content: "" };
                        setContentForm({...contentForm, terms: {...contentForm.terms, sections: [...(contentForm.terms.sections || []), newSection]}});
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Section
                    </Button>
                  </div>
                  {contentForm.terms.sections?.map((section: any, idx: number) => (
                    <div key={section.id} className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <Label>Section {idx + 1}</Label>
                        <button
                          type="button"
                          onClick={() => {
                            setContentForm({...contentForm, terms: {...contentForm.terms, sections: contentForm.terms.sections.filter((s: any) => s.id !== section.id)}});
                          }}
                          className="text-red-500 hover:bg-red-50 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <Input 
                        value={section.title}
                        onChange={(e) => {
                          const newSections = [...contentForm.terms.sections];
                          newSections[idx] = { ...section, title: e.target.value };
                          setContentForm({...contentForm, terms: {...contentForm.terms, sections: newSections}});
                        }}
                        placeholder="Section title"
                      />
                      <Textarea 
                        value={section.content}
                        onChange={(e) => {
                          const newSections = [...contentForm.terms.sections];
                          newSections[idx] = { ...section, content: e.target.value };
                          setContentForm({...contentForm, terms: {...contentForm.terms, sections: newSections}});
                        }}
                        placeholder="Section content (each line = bullet point)"
                        rows={3}
                        className="font-mono text-sm"
                      />
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={handleResetContent} className="flex-1 border-red-500 text-red-500 hover:bg-red-50">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Default
                </Button>
                <Button type="submit" className="flex-1 bg-[#D4AF37] hover:bg-[#C5A028] text-black">
                  <Save className="w-4 h-4 mr-2" />
                  Save Page Content
                </Button>
              </div>
            </form>
          )}

          {/* Account Section */}
          {activeSection === 'account' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <Card title="Change Username" icon={<User className="w-5 h-5" />} description="Update your admin username">
                <form onSubmit={handleUsernameSave} className="space-y-4">
                  <div>
                    <Label>New Username</Label>
                    <Input value={usernameForm.newUsername} onChange={(e) => setUsernameForm({newUsername: e.target.value})} />
                  </div>
                  <Button type="submit" className="w-full bg-[#D4AF37] hover:bg-[#C5A028] text-black">
                    <Save className="w-4 h-4 mr-2" />
                    Save Username
                  </Button>
                </form>
              </Card>

              <Card title="Change Password" icon={<Lock className="w-5 h-5" />} description="Update your admin password">
                <form onSubmit={handlePasswordSave} className="space-y-4">
                  <div>
                    <Label>Current Password</Label>
                    <Input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})} autoComplete="current-password" />
                  </div>
                  <div>
                    <Label>New Password</Label>
                    <Input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} autoComplete="new-password" />
                    <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
                  </div>
                  <div>
                    <Label>Confirm New Password</Label>
                    <Input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} />
                  </div>
                  <Button type="submit" className="w-full bg-[#D4AF37] hover:bg-[#C5A028] text-black">
                    <Lock className="w-4 h-4 mr-2" />
                    Update Password
                  </Button>
                </form>
              </Card>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Security Tips</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use a strong password with 8+ characters</li>
                  <li>• Include uppercase, lowercase, numbers, and symbols</li>
                  <li>• Don't share your credentials with anyone</li>
                </ul>
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <Card title="Logged-in Devices" icon={<Shield className="w-5 h-5" />} description="Manage devices with admin access">
                {(!deviceSessions || deviceSessions.length === 0) ? (
                  <div className="text-center py-8 text-gray-500">
                    <Monitor className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No devices logged in</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-600">
                        {deviceSessions.filter(d => d.status === 'active').length} active session(s)
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleLogoutAllDevices}
                        className="text-red-500 border-red-300 hover:bg-red-50"
                      >
                        Logout All Others
                      </Button>
                    </div>
                    
                    {deviceSessions.map((device) => (
                      <div 
                        key={device.id}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          device.isCurrentDevice 
                            ? 'bg-green-50 border-green-200' 
                            : device.status === 'logged_out'
                            ? 'bg-gray-50 border-gray-200 opacity-60'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            device.device === 'Mobile' ? 'bg-blue-100' : 'bg-purple-100'
                          }`}>
                            {device.device === 'Mobile' ? (
                              <Smartphone className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Monitor className="w-5 h-5 text-purple-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{device.device} - {device.browser}</p>
                              {device.isCurrentDevice && (
                                <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">Current</span>
                              )}
                              {device.status === 'logged_out' && (
                                <span className="px-2 py-0.5 bg-gray-400 text-white text-xs rounded-full">Logged Out</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {device.os} • Last active: {new Date(device.lastActive).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        {device.status === 'active' && !device.isCurrentDevice && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => logoutDeviceSession(device.deviceId)}
                              className="text-orange-600 border-orange-300 hover:bg-orange-50"
                            >
                              <LogOut className="w-4 h-4 mr-1" />
                              Logout
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => removeDeviceSession(device.deviceId)}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        
                        {device.isCurrentDevice && (
                          <span className="text-sm text-green-600 font-medium">This device</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-medium text-amber-900 mb-2">Session Information</h4>
                <p className="text-sm text-amber-800">
                  Admin sessions are stored locally on each device and expire after 24 hours. 
                  You can logout or remove other devices to secure your admin account.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Card Component
function Card({ 
  title, 
  icon, 
  description, 
  children 
}: { 
  title: string; 
  icon: React.ReactNode; 
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center text-[#D4AF37]">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
