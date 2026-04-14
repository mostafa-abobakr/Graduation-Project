import React, { useState, useEffect } from "react";
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

export default function UpdateRestaurantDialog({
  isOpen,
  onOpenChange,
  restaurant,
  onSubmit,
}) {
  const [formData, setFormData] = useState({
    restaurantName: "",
    ownerEmail: "",
    status: "Active",
  });

  useEffect(() => {
    if (restaurant && isOpen) {
      setFormData({
        restaurantName: restaurant.restaurantName || "",
        ownerEmail: restaurant.ownerEmail || "",
        status: restaurant.status || "Active",
      });
    }
  }, [restaurant, isOpen]);

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Restaurant</DialogTitle>
          <DialogDescription>
            Modify the platform access details for {restaurant?.restaurantName}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          <div className="grid gap-2">
            <label
              htmlFor="update-name"
              className="text-sm font-semibold text-foreground"
            >
              Restaurant Name
            </label>
            <Input
              id="update-name"
              value={formData.restaurantName}
              onChange={(e) =>
                setFormData({ ...formData, restaurantName: e.target.value })
              }
              className="bg-muted/30"
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="update-email"
              className="text-sm font-semibold text-foreground"
            >
              Owner Email
            </label>
            <Input
              id="update-email"
              value={formData.ownerEmail}
              onChange={(e) =>
                setFormData({ ...formData, ownerEmail: e.target.value })
              }
              className="bg-muted/30"
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="update-status"
              className="text-sm font-semibold text-foreground"
            >
              Platform Status
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
          <Button onClick={handleSubmit}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
