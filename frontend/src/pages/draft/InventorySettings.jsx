import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, BellRing, TrendingDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export default function InventorySettings() {
  const { t } = useLanguage();

  const handleSave = (e) => {
    e.preventDefault();
    toast.success("Settings saved successfully");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <form onSubmit={handleSave}>
        <Card className="border-border/50 shadow-sm bg-card mb-6">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-primary" />
              Global Low Stock Thresholds
            </CardTitle>
            <CardDescription>Set the default minimum quantities before triggering a low stock alert.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 items-center">
              <label className="text-sm font-medium text-foreground">Meat & Seafood (kg)</label>
              <Input type="number" defaultValue="10" />
            </div>
            <div className="grid grid-cols-2 gap-4 items-center">
              <label className="text-sm font-medium text-foreground">Vegetables (kg)</label>
              <Input type="number" defaultValue="5" />
            </div>
            <div className="grid grid-cols-2 gap-4 items-center">
              <label className="text-sm font-medium text-foreground">Dairy (liters)</label>
              <Input type="number" defaultValue="8" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Note: Individual items can override these global settings in their specific details page.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card mb-6">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <BellRing className="h-5 w-5 text-primary" />
              Expiry Alert Settings
            </CardTitle>
            <CardDescription>Configure how many days in advance you want to be notified about expiring items.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 items-center">
              <label className="text-sm font-medium text-foreground">Perishable Goods (Days)</label>
              <Input type="number" defaultValue="3" />
            </div>
            <div className="grid grid-cols-2 gap-4 items-center">
              <label className="text-sm font-medium text-foreground">Dry/Pantry Goods (Days)</label>
              <Input type="number" defaultValue="14" />
            </div>
            <div className="grid grid-cols-2 gap-4 items-center">
              <label className="text-sm font-medium text-foreground">Frozen Items (Days)</label>
              <Input type="number" defaultValue="7" />
            </div>
          </CardContent>
          <CardFooter className="bg-muted/20 border-t border-border/50 py-4 mt-2 justify-end">
            <Button type="submit" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
