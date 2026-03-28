import { useState, useEffect } from "react";
import { Settings, Lock, User, Bell, Globe, Database, Shield, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

interface AdminData {
  username: string;
  email: string;
  lastLogin: string;
}

interface GeneralSettings {
  storeName: string;
  storeEmail: string;
  currency: string;
  taxRate: string;
  shippingCost: string;
}

interface NotificationSettings {
  emailOrders: boolean;
  lowStock: boolean;
  newCustomers: boolean;
}

const defaultGeneralSettings: GeneralSettings = {
  storeName: "Lightning Bathware",
  storeEmail: "admin@lightningbathware.com",
  currency: "USD",
  taxRate: "10",
  shippingCost: "5.99",
};

const defaultNotificationSettings: NotificationSettings = {
  emailOrders: true,
  lowStock: true,
  newCustomers: false,
};

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("profile");
  
  const [adminData] = useState<AdminData>({
    username: "Admin",
    email: "admin@lightningbathware.com",
    lastLogin: "March 23, 2026 at 10:30 AM",
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(() => {
    const saved = localStorage.getItem("generalSettings");
    return saved ? JSON.parse(saved) : defaultGeneralSettings;
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem("notificationSettings");
    return saved ? JSON.parse(saved) : defaultNotificationSettings;
  });

  useEffect(() => {
    localStorage.setItem("generalSettings", JSON.stringify(generalSettings));
  }, [generalSettings]);

  useEffect(() => {
    localStorage.setItem("notificationSettings", JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  const getPasswordStrength = (password: string): { level: string; color: string; width: string } => {
    if (password.length === 0) return { level: "", color: "", width: "0%" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/\d/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score <= 1) return { level: "Weak", color: "bg-red-500", width: "25%" };
    if (score === 2) return { level: "Fair", color: "bg-yellow-500", width: "50%" };
    if (score === 3) return { level: "Good", color: "bg-blue-500", width: "75%" };
    return { level: "Strong", color: "bg-green-500", width: "100%" };
  };

  const validatePassword = (password: string): boolean => {
    if (password.length < 8) return false;
    if (!/\d/.test(password)) return false;
    if (!/[A-Z]/.test(password)) return false;
    return true;
  };

  const handlePasswordChange = () => {
    setPasswordError("");
    setPasswordSuccess("");

    const storedPassword = localStorage.getItem("adminPassword") || "admin123";

    if (currentPassword !== storedPassword) {
      setPasswordError("Current password is incorrect");
      return;
    }

    if (!validatePassword(newPassword)) {
      setPasswordError("Password must be at least 8 characters with one number and one uppercase letter");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    localStorage.setItem("adminPassword", newPassword);
    setPasswordSuccess("Password changed successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleExportData = () => {
    const data = {
      generalSettings,
      notificationSettings,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lightning-bathware-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearOrders = () => {
    if (confirm("Are you sure you want to clear all orders? This action cannot be undone.")) {
      localStorage.removeItem("orders");
      alert("All orders have been cleared.");
    }
  };

  const handleResetDefaults = () => {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      setGeneralSettings(defaultGeneralSettings);
      setNotificationSettings(defaultNotificationSettings);
      alert("Settings have been reset to defaults.");
    }
  };

  const strength = getPasswordStrength(newPassword);

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "password", label: "Change Password", icon: Lock },
    { id: "general", label: "General", icon: Settings },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "data", label: "Data Management", icon: Database },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row gap-6">
          <TabsList className="md:w-56 flex-shrink-0 flex flex-col h-auto p-2 bg-white border">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="justify-start gap-2 px-3 py-2 data-[state=active]:bg-gray-100"
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1">
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Username</Label>
                    <Input value={adminData.username} disabled />
                  </div>
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input value={adminData.email} disabled />
                  </div>
                  <div className="grid gap-2">
                    <Label>Last Login</Label>
                    <Input value={adminData.lastLogin} disabled />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Change Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {newPassword && (
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${strength.color} transition-all duration-300`}
                            style={{ width: strength.width }}
                          />
                        </div>
                        <p className="text-sm text-gray-500">Strength: {strength.level}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
                  {passwordSuccess && <p className="text-sm text-green-500">{passwordSuccess}</p>}

                  <Button onClick={handlePasswordChange}>Change Password</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    General Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input
                      id="storeName"
                      value={generalSettings.storeName}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, storeName: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="storeEmail">Store Email</Label>
                    <Input
                      id="storeEmail"
                      type="email"
                      value={generalSettings.storeEmail}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, storeEmail: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="currency">Currency</Label>
                    <select
                      id="currency"
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={generalSettings.currency}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      value={generalSettings.taxRate}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, taxRate: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="shippingCost">Default Shipping Cost</Label>
                    <Input
                      id="shippingCost"
                      type="number"
                      step="0.01"
                      value={generalSettings.shippingCost}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, shippingCost: e.target.value })}
                    />
                  </div>
                  <Button onClick={() => alert("Settings saved!")}>Save Settings</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="emailOrders">Email notifications for new orders</Label>
                      <p className="text-sm text-gray-500">Receive email when a new order is placed</p>
                    </div>
                    <Switch
                      id="emailOrders"
                      checked={notificationSettings.emailOrders}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailOrders: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="lowStock">Low stock alerts</Label>
                      <p className="text-sm text-gray-500">Receive notifications when products are low on stock</p>
                    </div>
                    <Switch
                      id="lowStock"
                      checked={notificationSettings.lowStock}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, lowStock: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="newCustomers">New customer registrations</Label>
                      <p className="text-sm text-gray-500">Receive notifications for new customer accounts</p>
                    </div>
                    <Switch
                      id="newCustomers"
                      checked={notificationSettings.newCustomers}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, newCustomers: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Data Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-medium">Export Data</h3>
                    <p className="text-sm text-gray-500">Download your settings and configuration data</p>
                    <Button variant="outline" onClick={handleExportData}>
                      <Globe className="w-4 h-4 mr-2" />
                      Export Settings
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Clear All Orders</h3>
                    <p className="text-sm text-gray-500">Remove all order data from the system</p>
                    <Button variant="outline" onClick={handleClearOrders}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Orders
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Reset to Defaults</h3>
                    <p className="text-sm text-gray-500">Reset all settings to default values</p>
                    <Button variant="outline" onClick={handleResetDefaults}>
                      <Shield className="w-4 h-4 mr-2" />
                      Reset to Defaults
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}