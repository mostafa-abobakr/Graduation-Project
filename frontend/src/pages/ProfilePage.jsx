import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Mail, User, Shield, Globe, Bell } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
export default function ProfilePage() {
  const { user } = useAuth() || {};
  const fullName = user?.fullName || user?.name || "";
  const email = user?.email || "";
  const phone = user?.phone || "";
  const role = user?.role || "";
  
  const nameParts = fullName.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts[1] || "";
  
  const [profile, setProfile] = useState({
    firstName: firstName,
    lastName: lastName,
    email: email,
    phone: phone,
    role: role,
    language: "English",
    timezone: "UTC-5 (Eastern)",
  });
  const [preferences, setPreferences] = useState({
    emailDigest: true,
    marketingEmails: false,
    twoFactor: false,
    publicProfile: true,
  });
  const handleSave = () => {
    toast({
      title: "Profile updated",
      description: "Your changes have been saved successfully.",
    });
  };
  return (
    <div className="space-y-5  animate-fade-in max-w-3xl py-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground text-sm">Manage your account information and preferences</p>
        </div>
      </div>
      <Card className="p-6 bg-card border-border/60">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <Avatar className="h-20 w-20">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/15 text-primary text-xl font-semibold">
                {profile.firstName?.[0]}
                {profile.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <button className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="h-5 w-5 text-background" />
            </button>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              {profile.firstName} {profile.lastName}
            </h3>
            <p className="text-sm text-muted-foreground">{profile.role}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {profile.email}
            </p>
          </div>
          <Button variant="outline" size="sm">
            Change Avatar
          </Button>
        </div>
      </Card>
      <Card className="p-6 bg-card border-border/60">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold text-foreground">
            Personal Information
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-foreground">First Name</Label>
            <Input
              value={profile.firstName}
              onChange={(e) =>
                setProfile({ ...profile, firstName: e.target.value })
              }
              className="mt-1.5 bg-muted/50 border-border/60"
            />
          </div>
          <div>
            <Label className="text-foreground">Last Name</Label>
            <Input
              value={profile.lastName}
              onChange={(e) =>
                setProfile({ ...profile, lastName: e.target.value })
              }
              className="mt-1.5 bg-muted/50 border-border/60"
            />
          </div>
          <div>
            <Label className="text-foreground">Email</Label>
            <Input
              type="email"
              value={profile.email}
             
              className="mt-1.5 bg-muted/50 border-border/60"
            />
          </div>
          <div>
            <Label className="text-foreground">Phone</Label>
            <Input
              type="tel"
              value={profile.phone}
              onChange={(e) =>
                setProfile({ ...profile, phone: e.target.value })
              }
              className="mt-1.5 bg-muted/50 border-border/60"
            />
          </div>
        </div>
      </Card>
      <Card className="p-6 bg-card border-border/60">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold text-foreground">
            Preferences
          </h3>
        </div>
        <div className="space-y-4">
          {[
            [
              "emailDigest",
              "Daily Email Digest",
              "Receive a daily summary of your restaurant's performance",
              Mail,
            ],
            [
              "marketingEmails",
              "Marketing Emails",
              "Receive product updates and tips from ZeroBite",
              Mail,
            ],
            [
              "twoFactor",
              "Two-Factor Authentication",
              "Add an extra layer of security to your account",
              Shield,
            ],
            [
              "publicProfile",
              "Public Profile",
              "Allow team members to see your profile information",
              User,
            ],
          ].map(([key, label, desc, Icon]) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {label}
                  </div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
              </div>
              <Switch
                checked={preferences[key]}
                onCheckedChange={(v) =>
                  setPreferences({ ...preferences, [key]: v })
                }
              />
            </div>
          ))}
        </div>
      </Card>
      <div className="flex items-center gap-3">
        <Button onClick={handleSave}>Save Changes</Button>
        <Button
          variant="outline"
          className="text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          Delete Account
        </Button>
      </div>
    </div>
  );
}
