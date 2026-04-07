import { useState, useEffect } from "react";
import { Lock, User, Save, Store, Phone, Mail, MapPin, Clock, Globe, Image as ImageIcon, Zap, Type, RotateCcw, Truck, Award, Plus, Trash2, CreditCard, ToggleLeft, ToggleRight, Laptop, Smartphone, Monitor, X, LogOut, Shield } from "lucide-react";
import { Textarea } from "../../components/ui/textarea";
import ImageUpload from "../../components/admin/ImageUpload";
import { useAdmin, DEFAULT_SITE_CONTENT } from "../../context/AdminContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";

export default function AdminSettings() {
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
  const [usernameForm, setUsernameForm] = useState({
    newUsername: adminUsername,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileForm, setProfileForm] = useState({ ...storeProfile });
  const [assetsForm, setAssetsForm] = useState({ ...storeAssets });
  const [contentForm, setContentForm] = useState({ ...siteContent });

  // Sync form states when context data changes (after Firebase loads)
  useEffect(() => {
    setProfileForm({ ...storeProfile });
  }, [storeProfile]);

  useEffect(() => {
    setAssetsForm({ ...storeAssets });
  }, [storeAssets]);

  useEffect(() => {
    setContentForm({ ...siteContent });
  }, [siteContent]);

  useEffect(() => {
    setUsernameForm({ newUsername: adminUsername });
  }, [adminUsername]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === "number" ? parseFloat(value) || 0 : value;
    setProfileForm({ ...profileForm, [name]: newValue });
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileForm.adminShortcut || profileForm.adminShortcut.length < 3) {
      toast.error("Shortcut must be at least 3 characters long");
      return;
    }
    
    if (profileForm.adminShortcut.length > 20) {
      toast.error("Shortcut must be 20 characters or less");
      return;
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(profileForm.adminShortcut)) {
      toast.error("Shortcut can only contain letters and numbers");
      return;
    }

    // Validate delivery prices
    if (profileForm.deliveryColomboPrice < 0) {
      toast.error("Colombo delivery price cannot be negative");
      return;
    }
    if (profileForm.deliveryIslandwidePrice < 0) {
      toast.error("Islandwide delivery price cannot be negative");
      return;
    }
    if (profileForm.deliveryColomboPrice > 50000) {
      toast.error("Colombo delivery price is too high");
      return;
    }
    if (profileForm.deliveryIslandwidePrice > 100000) {
      toast.error("Islandwide delivery price is too high");
      return;
    }
    
    updateStoreProfile(profileForm);
    toast.success("Store profile updated successfully!");
  };

  const handleAssetsSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreAssets(assetsForm);
    toast.success("Store assets updated successfully! Content across the site has been updated.");
  };

  const handleContentSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteContent(contentForm);
    toast.success("Site content updated successfully!");
  };

  const handleResetToDefault = async () => {
    if (window.confirm("Are you sure you want to reset all page content to default? This action cannot be undone.")) {
      try {
        await resetSiteContent();
        setContentForm(DEFAULT_SITE_CONTENT);
        toast.success("Site content has been reset to default!");
      } catch (error) {
        toast.error("Failed to reset site content. Please try again.");
      }
    }
  };

  const handleAssetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAssetsForm({ ...assetsForm, [e.target.name]: e.target.value });
  };

  const handleUsernameChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!usernameForm.newUsername) {
      toast.error("Username cannot be empty");
      return;
    }

    if (usernameForm.newUsername.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    const success = await changeUsername(usernameForm.newUsername);
    if (success) {
      toast.success("Username updated successfully!");
    } else {
      toast.error("Failed to update username");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    const success = await changePassword(
      passwordForm.currentPassword,
      passwordForm.newPassword
    );

    if (success) {
      toast.success("Password updated successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } else {
      toast.error("Current password is incorrect");
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600">Manage your admin account and store profile settings</p>
      </div>

      <div className="space-y-6">
        {/* Store Profile */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#D4AF37] rounded-lg flex items-center justify-center">
              <Store className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Store Profile</h2>
              <p className="text-sm text-gray-600">
                Changes here will be reflected across the entire website
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-6">
            {/* Store Name */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Store className="w-4 h-4" /> Store Name
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="storeName">Primary Name</Label>
                  <Input
                    id="storeName"
                    name="storeName"
                    value={profileForm.storeName}
                    onChange={handleProfileChange}
                    placeholder="e.g. Lighting"
                  />
                </div>
                <div>
                  <Label htmlFor="storeNameAccent">Accent Name</Label>
                  <Input
                    id="storeNameAccent"
                    name="storeNameAccent"
                    value={profileForm.storeNameAccent}
                    onChange={handleProfileChange}
                    placeholder="e.g. Bathware"
                  />
                </div>
                <div className="col-span-1">
                  <Label>Logo Image</Label>
                  <div className="mt-1">
                    <ImageUpload
                      value={profileForm.storeLogo}
                      onChange={(value) => setProfileForm({ ...profileForm, storeLogo: value })}
                      label=""
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Leave empty to use text</p>
                </div>
              </div>
            </div>

            {/* Phone Numbers */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4" /> Phone Numbers
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="phone">Primary Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    placeholder="+94 11 234 5678"
                  />
                </div>
                <div>
                  <Label htmlFor="secondaryPhone">Secondary Phone</Label>
                  <Input
                    id="secondaryPhone"
                    name="secondaryPhone"
                    value={profileForm.secondaryPhone}
                    onChange={handleProfileChange}
                    placeholder="+94 77 123 4567"
                  />
                </div>
              </div>
            </div>

            {/* Email Addresses */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email Addresses
              </h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="email">General Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    placeholder="info@example.com"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="salesEmail">Sales Email</Label>
                    <Input
                      id="salesEmail"
                      name="salesEmail"
                      type="email"
                      value={profileForm.salesEmail}
                      onChange={handleProfileChange}
                      placeholder="sales@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      name="supportEmail"
                      type="email"
                      value={profileForm.supportEmail}
                      onChange={handleProfileChange}
                      placeholder="support@example.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Address
              </h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="addressStreet">Street</Label>
                  <Input
                    id="addressStreet"
                    name="addressStreet"
                    value={profileForm.addressStreet}
                    onChange={handleProfileChange}
                    placeholder="No. 456, Galle Road"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="addressCity">City / Postal Code</Label>
                    <Input
                      id="addressCity"
                      name="addressCity"
                      value={profileForm.addressCity}
                      onChange={handleProfileChange}
                      placeholder="Colombo 00700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="addressCountry">Country</Label>
                    <Input
                      id="addressCountry"
                      name="addressCountry"
                      value={profileForm.addressCountry}
                      onChange={handleProfileChange}
                      placeholder="Sri Lanka"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Business Hours
              </h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="businessHoursWeekday">Weekday Hours</Label>
                  <Input
                    id="businessHoursWeekday"
                    name="businessHoursWeekday"
                    value={profileForm.businessHoursWeekday}
                    onChange={handleProfileChange}
                    placeholder="Monday - Friday: 9:00 AM - 6:00 PM"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="businessHoursSaturday">Saturday</Label>
                    <Input
                      id="businessHoursSaturday"
                      name="businessHoursSaturday"
                      value={profileForm.businessHoursSaturday}
                      onChange={handleProfileChange}
                      placeholder="Saturday: 9:00 AM - 4:00 PM"
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessHoursSunday">Sunday</Label>
                    <Input
                      id="businessHoursSunday"
                      name="businessHoursSunday"
                      value={profileForm.businessHoursSunday}
                      onChange={handleProfileChange}
                      placeholder="Sunday: Closed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Social Media Links
              </h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="facebookUrl">Facebook URL</Label>
                  <Input
                    id="facebookUrl"
                    name="facebookUrl"
                    value={profileForm.facebookUrl}
                    onChange={handleProfileChange}
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                <div>
                  <Label htmlFor="instagramUrl">Instagram URL</Label>
                  <Input
                    id="instagramUrl"
                    name="instagramUrl"
                    value={profileForm.instagramUrl}
                    onChange={handleProfileChange}
                    placeholder="https://instagram.com/yourpage"
                  />
                </div>
                <div>
                  <Label htmlFor="twitterUrl">Twitter URL</Label>
                  <Input
                    id="twitterUrl"
                    name="twitterUrl"
                    value={profileForm.twitterUrl}
                    onChange={handleProfileChange}
                    placeholder="https://twitter.com/yourpage"
                  />
                </div>
              </div>
            </div>

            {/* Admin Security Shortcut */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Secret Admin Shortcut
              </h3>
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    <strong>How it works:</strong> Type the sequence anywhere on the site to automatically open the admin login page. 
                    Use letters, numbers, or both (e.g., <code className="bg-amber-100 px-1 rounded">admin123</code> or <code className="bg-amber-100 px-1 rounded">4571</code>).
                    The buffer resets after 2 seconds of inactivity or if you type a wrong character.
                  </p>
                </div>
                <div>
                  <Label htmlFor="adminShortcut">Secret Access Sequence</Label>
                  <Input
                    id="adminShortcut"
                    name="adminShortcut"
                    value={profileForm.adminShortcut}
                    onChange={handleProfileChange}
                    placeholder="e.g. admin123 or 4571"
                    minLength={3}
                    maxLength={20}
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    3-20 characters. Use something memorable but hard to guess.
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Fallback Access:</p>
                  <p className="text-xs text-gray-600">
                    Visit <code className="bg-gray-200 px-1 rounded text-xs">/__admin__</code> in your browser URL to access admin login directly.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                   <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAdminLogin(!showAdminLogin)}
                   >
                     {showAdminLogin ? "Hide Admin Access Now" : "Show Admin Access Now"}
                   </Button>
                </div>
              </div>
            </div>

            {/* Delivery Prices */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4" /> Delivery Prices
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deliveryColomboPrice">Colombo Delivery (Rs.)</Label>
                  <Input
                    id="deliveryColomboPrice"
                    name="deliveryColomboPrice"
                    type="number"
                    min="0"
                    value={profileForm.deliveryColomboPrice}
                    onChange={handleProfileChange}
                    placeholder="500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Set to 0 for FREE delivery</p>
                </div>
                <div>
                  <Label htmlFor="deliveryIslandwidePrice">Islandwide Delivery (Rs.)</Label>
                  <Input
                    id="deliveryIslandwidePrice"
                    name="deliveryIslandwidePrice"
                    type="number"
                    min="0"
                    value={profileForm.deliveryIslandwidePrice}
                    onChange={handleProfileChange}
                    placeholder="1000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Set to 0 for FREE delivery</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Set delivery prices for Colombo and islandwide. Set amount to 0 to offer free delivery.
              </p>
            </div>

            {/* Online Payment Settings */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Online Payment Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${profileForm.enableOnlinePayment ? 'bg-green-100' : 'bg-gray-200'}`}>
                      <CreditCard className={`w-5 h-5 ${profileForm.enableOnlinePayment ? 'text-green-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <Label htmlFor="enableOnlinePayment" className="text-base font-semibold cursor-pointer">
                        Enable Online Payment
                      </Label>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Allow customers to pay online using Payhere (card/e-wallet)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfileForm({ ...profileForm, enableOnlinePayment: !profileForm.enableOnlinePayment })}
                    className="focus:outline-none"
                  >
                    {profileForm.enableOnlinePayment ? (
                      <ToggleRight className="w-12 h-12 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-12 h-12 text-gray-400" />
                    )}
                  </button>
                </div>
                
                {profileForm.enableOnlinePayment && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> To enable online payments, you need to add your Payhere credentials to the <code className="bg-amber-100 px-1 rounded">.env</code> file:
                    </p>
                    <ul className="text-xs text-amber-700 mt-2 space-y-1 list-disc list-inside">
                      <li><code className="bg-amber-100 px-1 rounded">VITE_PAYHERE_MERCHANT_ID</code></li>
                      <li><code className="bg-amber-100 px-1 rounded">VITE_PAYHERE_MERCHANT_SECRET</code></li>
                      <li><code className="bg-amber-100 px-1 rounded">VITE_PAYHERE_SANDBOX</code> (set to "false" for production)</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Home Page Stats */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" /> Home Page Stats
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="statsYearsExperience">Years of Experience</Label>
                  <Input
                    id="statsYearsExperience"
                    name="statsYearsExperience"
                    value={profileForm.statsYearsExperience}
                    onChange={handleProfileChange}
                    placeholder="10+"
                  />
                </div>
                <div>
                  <Label htmlFor="statsProducts">Products</Label>
                  <Input
                    id="statsProducts"
                    name="statsProducts"
                    value={profileForm.statsProducts}
                    onChange={handleProfileChange}
                    placeholder="350+"
                  />
                </div>
                <div>
                  <Label htmlFor="statsCustomers">Happy Customers</Label>
                  <Input
                    id="statsCustomers"
                    name="statsCustomers"
                    value={profileForm.statsCustomers}
                    onChange={handleProfileChange}
                    placeholder="5,000+"
                  />
                </div>
                <div>
                  <Label htmlFor="statsAuthentic">Authentic Products</Label>
                  <Input
                    id="statsAuthentic"
                    name="statsAuthentic"
                    value={profileForm.statsAuthentic}
                    onChange={handleProfileChange}
                    placeholder="100%"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Edit the statistics shown on the home page. Include suffixes like +, %, or ,000.
              </p>
            </div>

            <Button
              type="submit"
              className="bg-[#D4AF37] hover:bg-[#C5A028] text-black font-bold w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Store Profile
            </Button>
          </form>
        </div>

        {/* Store Assets (Images) */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Store Assets & Images</h2>
              <p className="text-sm text-gray-600">
                Update the visual content of your website (Hero, About, Categories)
              </p>
            </div>
          </div>

          <form onSubmit={handleAssetsSave} className="space-y-6">
            {/* Hero Image */}
            <div className="border-b pb-4">
              <ImageUpload
                label="Homepage Hero Image"
                value={assetsForm.heroImage}
                onChange={(val) => setAssetsForm({ ...assetsForm, heroImage: val })}
              />
              <p className="text-xs text-gray-400 mt-1">
                The main large image shown on the homepage hero section.
              </p>
            </div>

            {/* About Page Images */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-700 mb-3">About Page Images</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImageUpload
                  label="Our Story Image"
                  value={assetsForm.aboutStoryImage}
                  onChange={(val) => setAssetsForm({ ...assetsForm, aboutStoryImage: val })}
                />
                <ImageUpload
                  label="Our Team Image"
                  value={assetsForm.aboutTeamImage}
                  onChange={(val) => setAssetsForm({ ...assetsForm, aboutTeamImage: val })}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="bg-black hover:bg-[#D4AF37] text-white w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              Update Site Assets
            </Button>
          </form>
        </div>

        {/* Page Content Management */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <Type className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Page Content Management</h2>
              <p className="text-sm text-gray-600">
                Edit the text content of your Home, About, Services, and Contact pages
              </p>
            </div>
          </div>

          <form onSubmit={handleContentSave} className="space-y-8">
            {/* Home Page Content */}
            <div className="border-b pb-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                Home Page
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Hero Main Title</Label>
                  <Input 
                    value={contentForm.home.heroTitle}
                    onChange={(e) => setContentForm({
                      ...contentForm,
                      home: { ...contentForm.home, heroTitle: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>Hero Subtitle</Label>
                  <Textarea 
                    value={contentForm.home.heroSubtitle}
                    onChange={(e) => setContentForm({
                      ...contentForm,
                      home: { ...contentForm.home, heroSubtitle: e.target.value }
                    })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Hero Button Text</Label>
                  <Input 
                    value={contentForm.home.heroButtonText}
                    onChange={(e) => setContentForm({
                      ...contentForm,
                      home: { ...contentForm.home, heroButtonText: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* About Page Content */}
            <div className="border-b pb-6">
              <h3 className="font-bold text-gray-800 mb-4">About Page</h3>
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-blue-600 font-semibold italic">Our Story Section</Label>
                  <div>
                    <Label>Section Title</Label>
                    <Input 
                      value={contentForm.about.storyTitle}
                      onChange={(e) => setContentForm({
                        ...contentForm,
                        about: { ...contentForm.about, storyTitle: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Story Content</Label>
                    <Textarea 
                      value={contentForm.about.storyText}
                      onChange={(e) => setContentForm({
                        ...contentForm,
                        about: { ...contentForm.about, storyText: e.target.value }
                      })}
                      rows={5}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-blue-600 font-semibold italic">Our Team Section</Label>
                  <div>
                    <Label>Section Title</Label>
                    <Input 
                      value={contentForm.about.teamTitle}
                      onChange={(e) => setContentForm({
                        ...contentForm,
                        about: { ...contentForm.about, teamTitle: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Team Content</Label>
                    <Textarea 
                      value={contentForm.about.teamText}
                      onChange={(e) => setContentForm({
                        ...contentForm,
                        about: { ...contentForm.about, teamText: e.target.value }
                      })}
                      rows={5}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Services Page Content */}
            <div className="border-b pb-6">
              <h3 className="font-bold text-gray-800 mb-4">Services Page</h3>
              <div className="space-y-4">
                <div>
                  <Label>Page Title</Label>
                  <Input 
                    value={contentForm.services.title}
                    onChange={(e) => setContentForm({
                      ...contentForm,
                      services: { ...contentForm.services, title: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>Page Subtitle</Label>
                  <Input 
                    value={contentForm.services.subtitle}
                    onChange={(e) => setContentForm({
                      ...contentForm,
                      services: { ...contentForm.services, subtitle: e.target.value }
                    })}
                  />
                </div>
                
                {/* Service Items */}
                <div className="space-y-6 mt-6">
                  <Label className="text-lg font-semibold">Service Items</Label>
                  {contentForm.services.items.map((item, idx) => (
                    <div key={`service-${idx}`} className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Service {idx + 1}</Label>
                      </div>
                      <Input 
                        placeholder="Service Title"
                        value={item.title}
                        onChange={(e) => {
                          const newItems = [...contentForm.services.items];
                          newItems[index] = { ...newItems[index], title: e.target.value };
                          setContentForm({
                            ...contentForm,
                            services: { ...contentForm.services, items: newItems }
                          });
                        }}
                      />
                      <Textarea 
                        placeholder="Service Description"
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...contentForm.services.items];
                          newItems[index] = { ...newItems[index], description: e.target.value };
                          setContentForm({
                            ...contentForm,
                            services: { ...contentForm.services, items: newItems }
                          });
                        }}
                        rows={2}
                      />
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Features (one per line)</Label>
                        <Textarea 
                          placeholder="Feature 1&#10;Feature 2&#10;Feature 3&#10;Feature 4"
                          value={item.features?.join('\n') || ''}
                          onChange={(e) => {
                            const newItems = [...contentForm.services.items];
                            newItems[index] = { 
                              ...newItems[index], 
                              features: e.target.value.split('\n').filter(f => f.trim()) 
                            };
                            setContentForm({
                              ...contentForm,
                              services: { ...contentForm.services, items: newItems }
                            });
                          }}
                          rows={4}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Page Content */}
            <div className="border-b pb-6">
              <h3 className="font-bold text-gray-800 mb-4">Contact Page</h3>
              <div className="space-y-4">
                <div>
                  <Label>Page Title</Label>
                  <Input 
                    value={contentForm.contact.title}
                    onChange={(e) => setContentForm({
                      ...contentForm,
                      contact: { ...contentForm.contact, title: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>Page Subtitle</Label>
                  <Input 
                    value={contentForm.contact.subtitle}
                    onChange={(e) => setContentForm({
                      ...contentForm,
                      contact: { ...contentForm.contact, subtitle: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>Google Maps Embed URL</Label>
                  <Input 
                    value={contentForm.contact.mapUrl}
                    onChange={(e) => setContentForm({
                      ...contentForm,
                      contact: { ...contentForm.contact, mapUrl: e.target.value }
                    })}
                    placeholder="https://www.google.com/maps/embed?..."
                  />
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="border-b pb-6">
              <h3 className="font-bold text-gray-800 mb-4">Frequently Asked Questions</h3>
              <div className="space-y-4">
                <div>
                  <Label>FAQ Section Title</Label>
                  <Input 
                    value={contentForm.faq.title}
                    onChange={(e) => setContentForm({
                      ...contentForm,
                      faq: { ...contentForm.faq, title: e.target.value }
                    })}
                  />
                </div>
                
                {/* FAQ Items */}
                <div className="space-y-4 mt-4">
                  <Label className="text-lg font-semibold">FAQ Items</Label>
                  {contentForm.faq.items.map((item, idx) => (
                    <div key={`faq-${idx}`} className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <Label className="font-medium">FAQ {idx + 1}</Label>
                      <Input 
                        placeholder="Question"
                        value={item.question}
                        onChange={(e) => {
                          const newItems = [...contentForm.faq.items];
                          newItems[idx] = { ...newItems[idx], question: e.target.value };
                          setContentForm({
                            ...contentForm,
                            faq: { ...contentForm.faq, items: newItems }
                          });
                        }}
                      />
                      <Textarea 
                        placeholder="Answer"
                        value={item.answer}
                        onChange={(e) => {
                          const newItems = [...contentForm.faq.items];
                          newItems[idx] = { ...newItems[idx], answer: e.target.value };
                          setContentForm({
                            ...contentForm,
                            faq: { ...contentForm.faq, items: newItems }
                          });
                        }}
                        rows={3}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Terms and Conditions Section */}
            <div className="border-b pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">Terms and Conditions</h3>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const newSection = {
                      id: `section-${Date.now()}`,
                      title: "New Section",
                      content: "Add your content here..."
                    };
                    setContentForm({
                      ...contentForm,
                      terms: {
                        ...contentForm.terms,
                        sections: [...(contentForm.terms.sections || []), newSection]
                      }
                    });
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Section
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Introduction</Label>
                  <Textarea 
                    value={contentForm.terms.introduction}
                    onChange={(e) => setContentForm({
                      ...contentForm,
                      terms: { ...contentForm.terms, introduction: e.target.value }
                    })}
                    placeholder="Introduction text..."
                    rows={2}
                  />
                  <p className="text-xs text-gray-500 mt-1">Use [Store Name] as placeholder for your store name</p>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold text-gray-700 mb-3">Sections</h4>
                  <p className="text-xs text-gray-500 mb-4">Each section has a title and content. You can add, edit, delete, or reorder sections.</p>
                  
                  <div className="space-y-4">
                    {contentForm.terms.sections && contentForm.terms.sections.map((section: any, index: number) => (
                      <div key={section.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500">Section {index + 1}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setContentForm({
                                ...contentForm,
                                terms: {
                                  ...contentForm.terms,
                                  sections: contentForm.terms.sections.filter((s: any) => s.id !== section.id)
                                }
                              });
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <Label>Section Title</Label>
                            <Input
                              value={section.title}
                              onChange={(e) => {
                                const newSections = [...contentForm.terms.sections];
                                newSections[index] = { ...section, title: e.target.value };
                                setContentForm({
                                  ...contentForm,
                                  terms: { ...contentForm.terms, sections: newSections }
                                });
                              }}
                              placeholder="e.g., General Terms, Payment Policy, etc."
                            />
                          </div>
                          
                          <div>
                            <Label>Section Content</Label>
                            <Textarea
                              value={section.content}
                              onChange={(e) => {
                                const newSections = [...contentForm.terms.sections];
                                newSections[index] = { ...section, content: e.target.value };
                                setContentForm({
                                  ...contentForm,
                                  terms: { ...contentForm.terms, sections: newSections }
                                });
                              }}
                              placeholder="Enter the content for this section. Each line will be treated as a separate point."
                              rows={4}
                              className="font-mono text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">Each line break creates a new bullet point</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {(!contentForm.terms.sections || contentForm.terms.sections.length === 0) && (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500 mb-2">No sections added yet</p>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            const newSection = {
                              id: `section-${Date.now()}`,
                              title: "New Section",
                              content: "Add your content here..."
                            };
                            setContentForm({
                              ...contentForm,
                              terms: {
                                ...contentForm.terms,
                                sections: [...(contentForm.terms.sections || []), newSection]
                              }
                            });
                          }}
                          className="bg-[#D4AF37] hover:bg-[#C5A028] text-black"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add First Section
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetToDefault}
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Default
              </Button>
              <Button
                type="submit"
                className="bg-[#D4AF37] hover:bg-[#C5A028] text-black font-bold flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Site Content
              </Button>
            </div>
          </form>
        </div>

        {/* Change Username */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Change Username</h2>
              <p className="text-sm text-gray-600">
                Update your admin username
              </p>
            </div>
          </div>

          <form onSubmit={handleUsernameChange} className="space-y-4">
            <div>
              <Label htmlFor="newUsername">New Username</Label>
              <Input
                id="newUsername"
                type="text"
                value={usernameForm.newUsername}
                onChange={(e) =>
                  setUsernameForm({ newUsername: e.target.value })
                }
                placeholder="Enter new username"
              />
            </div>

            <Button
              type="submit"
              className="bg-black hover:bg-[#D4AF37] text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Username
            </Button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#D4AF37] rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Change Password</h2>
              <p className="text-sm text-gray-600">
                Update your admin password
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value,
                  })
                }
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </div>

            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                placeholder="Enter new password"
                autoComplete="new-password"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 6 characters long
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              className="bg-black hover:bg-[#D4AF37] text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Update Password
            </Button>
          </form>
        </div>

        {/* Security Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Security Tips</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Use a strong password with a mix of letters, numbers, and symbols</li>
            <li>• Change your password regularly for better security</li>
            <li>• Never share your admin credentials with anyone</li>
            <li>• Always log out when finished managing the store</li>
            <li>• Keep your login information in a secure location</li>
          </ul>
        </div>

        {/* Current Credentials Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold mb-3">Current Account Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Username:</span>
              <span className="font-semibold">{adminUsername}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Role:</span>
              <span className="font-semibold">Administrator</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Access Level:</span>
              <span className="font-semibold">Full Access</span>
            </div>
          </div>
        </div>

        {/* Logged-in Devices */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Logged-in Devices</h2>
              <p className="text-sm text-gray-600">
                Manage devices that have admin access
              </p>
            </div>
          </div>

          {!deviceSessions || deviceSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Monitor className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No devices logged in</p>
              <p className="text-sm">Login on a device to see it here</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                {deviceSessions.filter(d => d.status === 'active').length} active session(s)
              </p>
              
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
                        <p className="font-medium">
                          {device.device} - {device.browser}
                        </p>
                        {device.isCurrentDevice && (
                          <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                            Current
                          </span>
                        )}
                        {device.status === 'logged_out' && (
                          <span className="px-2 py-0.5 bg-gray-400 text-white text-xs rounded-full">
                            Logged Out
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {device.os} • Last active: {new Date(device.lastActive).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">
                        Login: {new Date(device.loginTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {device.status === 'active' && !device.isCurrentDevice && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => logoutDeviceSession(device.deviceId)}
                        className="px-3 py-1.5 text-sm border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 flex items-center gap-1"
                        title="Log out this device"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                      <button
                        onClick={() => removeDeviceSession(device.deviceId)}
                        className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1"
                        title="Remove this device"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  )}
                  
                  {device.isCurrentDevice && (
                    <span className="text-sm text-green-600 font-medium">
                      This device
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Security Info</h4>
            <p className="text-sm text-blue-800">
              Admin sessions are stored locally on each device and expire after 24 hours. 
              You can logout or remove other devices to secure your admin account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
