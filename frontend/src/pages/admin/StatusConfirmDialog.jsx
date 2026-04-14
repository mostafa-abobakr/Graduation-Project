import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function StatusConfirmDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  action, // "activate" | "deactivate"
  restaurantName,
  selectedCount,
}) {
  const isActivate = action === "activate";
  const actionText = isActivate ? "Activate" : "Deactivate";
  
  const title = `${actionText} Restaurant(s)`;
  
  const description = restaurantName
    ? `Are you sure you want to ${actionText.toLowerCase()} "${restaurantName}"? They will ${
        isActivate ? "regain" : "lose"
      } access to the platform${!isActivate ? " until reactivated" : ""}.`
    : `Are you sure you want to ${actionText.toLowerCase()} ${selectedCount} selected restaurants? They will ${
        isActivate ? "regain" : "lose"
      } access to the platform.`;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-base text-muted-foreground mt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
          <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={
              isActivate
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            }
            onClick={onConfirm}
          >
            Yes, {actionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
