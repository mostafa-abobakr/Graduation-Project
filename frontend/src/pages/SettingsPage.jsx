import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef, useEffect } from "react";
import { User, Store, Palette, Bell, Settings, Save, Clock, Bot, CalendarDays, Camera, Key, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext"
import { PageHeader } from "@/components/shared/PageHeader"
import { useTheme } from "@/components/shared/ThemeProvider"
import { useLanguage } from "@/contexts/LanguageContext"
import api from "@/api/axios"

export default function SettingsPage() {
  const { user, isAdmin } = useAuth()
  const { setTheme } = useTheme()
  const { changeLanguage, t } = useLanguage()
  const [activeTab, setActiveTab] = useState("profile")

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.photoUrl || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const fileInputRef = useRef(null)

  // Profile Settings
  const [profile, setProfile] = useState({
    name: user?.name || user?.fullName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    role: user?.role || "",
    imageUrl: user?.photoUrl || user?.imageUrl || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Restaurant Settings
  const [restaurant, setRestaurant] = useState({
    name: "empty",
    phone: "",
    address: "",
    capacity: 0,
  });

  // Scheduling Rules
  const [scheduling, setScheduling] = useState({
    openTime: "",
    closeTime: "",
    maxWeeklyHours: 40,
    minRestHours: 8,
    firstDayOfWeek: "monday",
    aiAutoScheduling: false,
  });

  // Preferences
  const [preferences, setPreferences] = useState({
    theme: "system",
    language: "en",
  });

  // Notifications
  const [notifications, setNotifications] = useState({
    emailNotifs: false,
    pushNotifs: false,
    shiftAlerts: false,
    weeklyReport: false,
  });

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.restId) {
        setIsLoadingSettings(false)
        return
      }
      try {
        const response = await api.get(`/Settings/all/${user.restId}`)
        const data = response.data

        if (data.profile) {
          setProfile((prev) => ({
            ...prev,
            name: data.profile.name || "",
            lastName: data.profile.lastName || "",
            email: data.profile.email || "",
            role: data.profile.role || "",
            imageUrl: data.profile.imageUrl || "",
          }))
          if (data.profile.imageUrl) {
            setAvatarUrl(data.profile.imageUrl)
          }
        }
        if (data.restaurant) {
          setRestaurant({
            name: data.restaurant.name || "",
            phone: data.restaurant.phone || "",
            address: data.restaurant.address || "",
            capacity: data.restaurant.capacity || 0,
          })
        }
        if (data.scheduling) {
          setScheduling({
            openTime: data.scheduling.openTime || "",
            closeTime: data.scheduling.closeTime || "",
            maxWeeklyHours: data.scheduling.maxWeeklyHours || 40,
            minRestHours: data.scheduling.minRestHours || 8,
            firstDayOfWeek: data.scheduling.firstDayOfWeek || "monday",
            aiAutoScheduling: data.scheduling.aiAutoScheduling || false,
          })
        }
        if (data.preferences) {
          setPreferences({
            theme: data.preferences.theme || "system",
            language: data.preferences.language || "en",
          })
        }
        if (data.notifications) {
          setNotifications({
            emailNotifs: data.notifications.emailNotifs ?? false,
            pushNotifs: data.notifications.pushNotifs ?? false,
            shiftAlerts: data.notifications.shiftAlerts ?? false,
            weeklyReport: data.notifications.weeklyReport ?? false,
          })
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error)
        toast.error("Failed to load settings.")
      } finally {
        setIsLoadingSettings(false)
      }
    }

    fetchSettings()
  }, [user?.restId])

  const handleSave = async () => {
    if (!user?.restId) return

    setIsSaving(true)
    try {
      await api.put(`/Settings/all/${user.restId}`, {
        profile: {
          name: profile.name,
          lastName: profile.lastName,
          email: profile.email,
          role: profile.role,
          imageUrl: avatarUrl || profile.imageUrl || null,
        },
        restaurant,
        scheduling,
        preferences,
        notifications,
      })
      if (preferences.theme) {
        setTheme(preferences.theme)
      }
      if (preferences.language) {
        changeLanguage(preferences.language)
      }

      toast.success("Settings saved successfully!")
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast.error("Failed to save settings.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB.");
      return;
    }

    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const method = avatarUrl ? "put" : "post";
      const response = await api[method]("/Settings/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newUrl = response.data?.imageUrl || response.data?.photoUrl || response.data?.url || URL.createObjectURL(file)
      setAvatarUrl(newUrl)
      setProfile((prev) => ({ ...prev, imageUrl: newUrl }))
      toast.success("Photo updated successfully!");
    } catch (error) {
      console.error("Failed to upload photo:", error);
      toast.error("Failed to upload photo.");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in py-5 max-w-4xl mx-auto">
      <PageHeader
        icon={Settings}
        title="Profile & Settings"
        description="Manage your account profile, preferences, and restaurant rules"
        actions={
          <Button onClick={handleSave} className="gap-2" disabled={isSaving || isLoadingSettings}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-5 mb-6 bg-muted/50 p-1`}>
          <TabsTrigger value="profile" className="gap-2"><User className="h-4 w-4 hidden sm:block" /> Profile</TabsTrigger>
          <TabsTrigger value="restaurant" className="gap-2"><Store className="h-4 w-4 hidden sm:block" /> Restaurant</TabsTrigger>
          <TabsTrigger value="scheduling" className="gap-2"><Clock className="h-4 w-4 hidden sm:block" /> Scheduling</TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2"><Palette className="h-4 w-4 hidden sm:block" /> Preferences</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4 hidden sm:block" /> Notifications</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="p-6 bg-card border-border/60 premium-shadow">
            <h3 className="text-lg font-semibold text-foreground mb-1">Personal Information</h3>
            <p className="text-sm text-muted-foreground mb-6">Update your profile details and contact information.</p>
              
            <div className="flex flex-col  gap-4">
             
              <Card className="p-6 bg-card border-border/60">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  aria-label="Upload profile photo"
                />
                    <div className="flex items-center gap-5">
                      <div className="relative group">
                        <Avatar className="h-20 w-20">
                           <AvatarImage src={avatarUrl} alt="Profile picture" />
                          <AvatarFallback className="text-4xl bg-primary/10 text-primary font-bold">
                    {profile.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                        </Avatar>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                          className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          aria-label="Upload profile photo"
                          tabIndex={0}
                        >
                          {isUploadingAvatar ? (
                            <Loader2 className="h-5 w-5 text-background animate-spin" />
                          ) : (
                            <Camera className="h-5 w-5 text-background" />
                          )}
                        </button>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">
                          {profile.name} {profile.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{profile.role}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {profile.email}
                        </p>
                      </div>
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className=" gap-2 mt-2" 
                         onClick={() => fileInputRef.current?.click()}
                         disabled={isUploadingAvatar}
                       >
                         {isUploadingAvatar ? (
                           <Loader2 className="h-4 w-4 animate-spin" />
                         ) : (
                           <Camera className="h-4 w-4" />
                         )}
                         {isUploadingAvatar ? "Uploading..." : "Change Photo"}
                       </Button>
                    </div>
                  </Card>
              {/* Form Section */}
              <div className="flex-1 space-y-5 w-full pt-1">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground/80">First Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="bg-muted/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-foreground/80">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      className="bg-muted/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground/80">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="bg-muted/30"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border/60 premium-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Security</h3>
                <p className="text-sm text-muted-foreground">Change your password to keep your account secure.</p>
              </div>
              {!isChangingPassword && (
                <Button variant="outline" onClick={() => setIsChangingPassword(true)} className="gap-2">
                  <Key className="h-4 w-4" /> Change Password
                </Button>
              )}
            </div>

            {isChangingPassword && (() => {
              const pw = profile.newPassword
              const rules = [
                { label: "At least 8 characters", valid: pw.length >= 8 },
                { label: "One uppercase letter (A-Z)", valid: /[A-Z]/.test(pw) },
                { label: "One lowercase letter (a-z)", valid: /[a-z]/.test(pw) },
                { label: "One number (0-9)", valid: /[0-9]/.test(pw) },
                { label: "One special character (!@#$%^&*)", valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pw) },
              ]
              const allValid = rules.every((r) => r.valid)
              const passwordsMatch = pw && profile.confirmPassword && pw === profile.confirmPassword
              const canSubmit = allValid && passwordsMatch && profile.currentPassword.length > 0

              return (
                <div className="space-y-4 max-w-xl animate-fade-in border border-border/50 bg-muted/10 p-5 rounded-xl mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="Enter current password"
                      value={profile.currentPassword}
                      onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Enter new password"
                        value={profile.newPassword}
                        onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
                        className={pw.length > 0 ? (allValid ? "border-emerald-500/50 focus-visible:ring-emerald-500/30" : "border-destructive/50 focus-visible:ring-destructive/30") : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm new password"
                        value={profile.confirmPassword}
                        onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}
                        className={profile.confirmPassword.length > 0 ? (passwordsMatch ? "border-emerald-500/50 focus-visible:ring-emerald-500/30" : "border-destructive/50 focus-visible:ring-destructive/30") : ""}
                      />
                      {profile.confirmPassword.length > 0 && !passwordsMatch && (
                        <p className="text-xs text-destructive">Passwords do not match</p>
                      )}
                    </div>
                  </div>

                  {/* Password strength rules */}
                  {pw.length > 0 && (
                    <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Password requirements:</p>
                      {rules.map((rule) => (
                        <div key={rule.label} className="flex items-center gap-2 text-xs">
                          <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${rule.valid ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                          <span className={rule.valid ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                            {rule.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={() => {
                      setIsChangingPassword(false);
                      setProfile({ ...profile, currentPassword: "", newPassword: "", confirmPassword: "" });
                    }}>
                      Cancel
                    </Button>
                    <Button
                      disabled={!canSubmit || isUpdatingPassword}
                      onClick={async () => {
                        setIsUpdatingPassword(true)
                        try {
                          await api.post("/Settings/change-password", {
                            currentPassword: profile.currentPassword,
                            newPassword: profile.newPassword,
                            confirmPassword: profile.confirmPassword,
                          })
                          toast.success("Password updated successfully!")
                          setIsChangingPassword(false)
                          setProfile({ ...profile, currentPassword: "", newPassword: "", confirmPassword: "" })
                        } catch (error) {
                          console.error("Failed to update password:", error)
                          toast.error(error.response?.data?.message || error.message || "Failed to update password.")
                        } finally {
                          setIsUpdatingPassword(false)
                        }
                      }}
                    >
                      {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Update Password
                    </Button>
                  </div>
                </div>
              )
            })()}
          </Card>
        </TabsContent>

        {/* Restaurant Tab */}
        <TabsContent value="restaurant" className="space-y-4">
            <Card className="p-6 bg-card border-border/60 premium-shadow">
              <h3 className="text-lg font-semibold text-foreground mb-1">Restaurant Details</h3>
              <p className="text-sm text-muted-foreground mb-4">Manage your restaurant's identity and public information.</p>

              <div className="space-y-4 max-w-xl">
                <div className="space-y-2">
                  <Label htmlFor="rest-name">Restaurant Name</Label>
                  <Input
                    id="rest-name"
                    value={restaurant.name}
                    onChange={(e) => setRestaurant({ ...restaurant, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rest-phone">Contact Phone</Label>
                  <Input
                    id="rest-phone"
                    value={restaurant.phone}
                    onChange={(e) => setRestaurant({ ...restaurant, phone: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rest-address">Physical Address</Label>
                    <Input
                      id="rest-address"
                      value={restaurant.address}
                      onChange={(e) => setRestaurant({ ...restaurant, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rest-capacity">Max Seating Capacity</Label>
                    <Input
                      id="rest-capacity"
                      type="number"
                      value={restaurant.capacity}
                      onChange={(e) => setRestaurant({ ...restaurant, capacity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

        {/* Scheduling Rules Tab */}
        <TabsContent value="scheduling" className="space-y-4">
            <Card className="p-6 bg-card border-border/60 premium-shadow">
              <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Operating Hours & Rules
              </h3>
              <p className="text-sm text-muted-foreground mb-6">Define your restaurant's working hours and employee scheduling limits to prevent overtime.</p>

              <div className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="open-time">Opening Time</Label>
                    <Input
                      id="open-time"
                      type="time"
                      className="[color-scheme:light] dark:[color-scheme:dark] bg-background text-foreground"
                      value={(() => {
                        if (!scheduling.openTime) return ""
                        if (scheduling.openTime.includes("T")) {
                          return scheduling.openTime.split("T")[1].substring(0, 5)
                        }
                        return scheduling.openTime.substring(0, 5)
                      })()}
                      onChange={(e) => setScheduling({ ...scheduling, openTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="close-time">Closing Time</Label>
                    <Input
                      id="close-time"
                      type="time"
                      className="[color-scheme:light] dark:[color-scheme:dark] bg-background text-foreground"
                      value={(() => {
                        if (!scheduling.closeTime) return ""
                        if (scheduling.closeTime.includes("T")) {
                          return scheduling.closeTime.split("T")[1].substring(0, 5)
                        }
                        return scheduling.closeTime.substring(0, 5)
                      })()}
                      onChange={(e) => setScheduling({ ...scheduling, closeTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="max-hours">Max Weekly Hours (Per Employee)</Label>
                    <div className="relative">
                      <Input
                        id="max-hours"
                        type="number"
                        value={scheduling.maxWeeklyHours}
                        onChange={(e) => setScheduling({ ...scheduling, maxWeeklyHours: parseInt(e.target.value) || 0 })}
                      />
                      <span className="absolute right-3 top-2 text-sm text-muted-foreground">Hours</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Prevents assigning overtime shifts.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min-rest">Minimum Rest Between Shifts</Label>
                    <div className="relative">
                      <Input
                        id="min-rest"
                        type="number"
                        value={scheduling.minRestHours}
                        onChange={(e) => setScheduling({ ...scheduling, minRestHours: parseInt(e.target.value) || 0 })}
                      />
                      <span className="absolute right-3 top-2 text-sm text-muted-foreground">Hours</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Required break time for employees.</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label>First Day of the Week</Label>
                  <Select value={scheduling.firstDayOfWeek} onValueChange={(v) => setScheduling({ ...scheduling, firstDayOfWeek: v })}>
                    <SelectTrigger className="w-full sm:w-[250px]">
                      <SelectValue placeholder="Select first day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunday">{t("Sunday")}</SelectItem>
                      <SelectItem value="monday">{t("Monday")}</SelectItem>
                      <SelectItem value="tuesday">{t("Tuesday")}</SelectItem>
                      <SelectItem value="wednesday">{t("Wednesday")}</SelectItem>
                      <SelectItem value="thursday">{t("Thursday")}</SelectItem>
                      <SelectItem value="friday">{t("Friday")}</SelectItem>
                      <SelectItem value="saturday">{t("Saturday")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">This will adjust how the Schedule Grid is displayed.</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border/60 premium-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <Bot className="h-32 w-32" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" /> AI Auto-Scheduling
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xl">
                Allow RestaurantAI to automatically generate optimized weekly schedules based on employee availability, operating hours, and traffic predictions.
              </p>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50 max-w-xl">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Enable Auto-Scheduling</Label>
                  <p className="text-sm text-muted-foreground">AI will draft schedules for you to review.</p>
                </div>
                <Switch
                  checked={scheduling.aiAutoScheduling}
                  onCheckedChange={(v) => setScheduling({ ...scheduling, aiAutoScheduling: v })}
                  className={scheduling.aiAutoScheduling ? "bg-primary" : ""}
                />
              </div>
            </Card>
          </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card className="p-6 bg-card border-border/60 premium-shadow">
            <h3 className="text-lg font-semibold text-foreground mb-1">Application Preferences</h3>
            <p className="text-sm text-muted-foreground mb-4">Customize how the application looks and feels.</p>

            <div className="space-y-6 max-w-xl">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">Select your preferred color interface.</p>
                </div>
                <Select value={preferences.theme} onValueChange={(v) => setPreferences({ ...preferences, theme: v })}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Language</Label>
                  <p className="text-sm text-muted-foreground">Choose your interface language.</p>
                </div>
                <Select value={preferences.language} onValueChange={(v) => setPreferences({ ...preferences, language: v })}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic (العربية)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="p-6 bg-card border-border/60 premium-shadow">
            <h3 className="text-lg font-semibold text-foreground mb-1">Notification Settings</h3>
            <p className="text-sm text-muted-foreground mb-4">Control when and how you want to be notified.</p>

            <div className="space-y-6 max-w-xl">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive important updates via email.</p>
                </div>
                <Switch
                  checked={notifications.emailNotifs}
                  onCheckedChange={(v) => setNotifications({ ...notifications, emailNotifs: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get real-time browser alerts.</p>
                </div>
                <Switch
                  checked={notifications.pushNotifs}
                  onCheckedChange={(v) => setNotifications({ ...notifications, pushNotifs: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Shift Alerts</Label>
                  <p className="text-sm text-muted-foreground">Notify me about schedule changes.</p>
                </div>
                <Switch
                  checked={notifications.shiftAlerts}
                  onCheckedChange={(v) => setNotifications({ ...notifications, shiftAlerts: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">Receive a weekly summary of activities.</p>
                </div>
                <Switch
                  checked={notifications.weeklyReport}
                  onCheckedChange={(v) => setNotifications({ ...notifications, weeklyReport: v })}
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
