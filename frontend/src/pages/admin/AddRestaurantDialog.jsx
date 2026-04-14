import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AddRestaurantDialog({ isOpen, onOpenChange, onSubmit }) {
  const [formData, setFormData] = useState({
    restaurantName: "",
    ownerEmail: "",
    status: "Active",
  });

  const handleSubmit = () => {
    onSubmit(formData);
    // Component will be closed by parent usually, but we reset form locally
    if (formData.restaurantName && formData.ownerEmail) {
      setFormData({ restaurantName: "", ownerEmail: "", status: "Active" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Restaurant</DialogTitle>
          <DialogDescription>
            Manually onboard a new restaurant to the platform.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          <div className="grid gap-2">
            <label
              htmlFor="add-name"
              className="text-sm font-semibold text-foreground"
            >
              Restaurant Name
            </label>
            <Input
              id="add-name"
              placeholder="E.g. The Gourmet Kitchen"
              value={formData.restaurantName}
              onChange={(e) =>
                setFormData({ ...formData, restaurantName: e.target.value })
              }
              className="bg-muted/30"
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="add-email"
              className="text-sm font-semibold text-foreground"
            >
              Owner Email
            </label>
            <Input
              id="add-email"
              type="email"
              placeholder="owner@restaurant.com"
              value={formData.ownerEmail}
              onChange={(e) =>
                setFormData({ ...formData, ownerEmail: e.target.value })
              }
              className="bg-muted/30"
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="add-status"
              className="text-sm font-semibold text-foreground"
            >
              Initial Status
            </label>
            <Select
              value={formData.status}
              onValueChange={(val) => setFormData({ ...formData, status: val })}
            >
              <SelectTrigger className="bg-muted/30">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create Account</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
