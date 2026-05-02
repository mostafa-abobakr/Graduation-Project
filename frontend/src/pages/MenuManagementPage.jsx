import React, { useState, useMemo, useEffect } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import { useMenuQuery, useUpdateMenuItem, useUpdateMenuRecipe } from "@/hooks/useMenu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Plus,
  Search,
  Trash2,
  Box,
  Utensils,
  LayoutGrid,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { SummaryCard } from "@/components/shared/SummaryCard";
import { SkeletonRows } from "@/components/shared/Skeletons";

export default function MenuManagementPage() {
  const { inventory } = useInventory();
  const { data: menuItems = [] } = useMenuQuery();
  const { mutate: updateMenuItem } = useUpdateMenuItem();
  const { mutate: updateMenuItemRecipe } = useUpdateMenuRecipe();
  const [search, setSearch] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Editable form state for the edit dialog
  const [editForm, setEditForm] = useState({
    id: null,
    name: "",
    cost: "",
    price: "",
    category: "",
    image: "",
  });
  const [recipeEdit, setRecipeEdit] = useState([]);

  // Simulate initial data load
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [menuItems, search]);

  const totalCategories = useMemo(
    () => new Set(menuItems.map((i) => i.category)).size,
    [menuItems],
  );
  const avgMargin = useMemo(() => {
    if (!menuItems.length) return 0;
    const sum = menuItems.reduce(
      (acc, item) => acc + (item.price - item.cost) / item.price,
      0,
    );
    return Math.round((sum / menuItems.length) * 100);
  }, [menuItems]);

  const openEdit = (item) => {
    setEditForm({
      id: item.id,
      name: item.name,
      cost: String(item.cost),
      price: String(item.price),
      category: item.category,
      image: item.image || "",
    });
    setRecipeEdit(item.recipe ? item.recipe.map((r) => ({ ...r })) : []);
    setDialogOpen(true);
  };

  const addIngredientRow = () => {
    setRecipeEdit([...recipeEdit, { ingredientId: "", quantity: "" }]);
  };

  const removeIngredientRow = (index) => {
    setRecipeEdit(recipeEdit.filter((_, i) => i !== index));
  };

  const saveEdit = () => {
    if (!editForm.name.trim()) {
      toast.error("Item name is required.");
      return;
    }
    if (recipeEdit.some((r) => !r.ingredientId || !r.quantity)) {
      toast.error("Please fill out all ingredient details.");
      return;
    }

    updateMenuItem({
      id: editForm.id,
      payload: {
        name: editForm.name.trim(),
        cost: parseFloat(editForm.cost) || 0,
        price: parseFloat(editForm.price) || 0,
        category: editForm.category.trim(),
        image: editForm.image,
      }
    });
    updateMenuItemRecipe({ id: editForm.id, recipe: recipeEdit });

    setDialogOpen(false);
    toast.success("Menu item updated.");
  };



  /* ── Search empty state ─────────────────────────────── */
  const SearchEmptyState = () => (
    <TableRow>
      <TableCell colSpan={7} className="p-0">
        <EmptyState
          searchQuery={search}
          searchItemName="menu items"
          onAction={() => setSearch("")}
        />
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6 animate-fade-in py-5 max-w-7xl mx-auto">
      <PageHeader
        icon={Utensils}
        title="Menu Management"
        description="Manage your restaurant menu items and ingredients"
      />

      {/* ── KPI Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Items"
          value={isLoading ? <Skeleton className="h-9 w-12" /> : menuItems.length}
          icon={Utensils}
          iconWrapper
        />
        <SummaryCard
          title="Categories"
          value={isLoading ? <Skeleton className="h-9 w-12" /> : totalCategories}
          icon={LayoutGrid}
          iconWrapper
        />
        <SummaryCard
          title="Avg Margin"
          value={isLoading ? <Skeleton className="h-9 w-16" /> : `${avgMargin}%`}
          icon={Percent}
          iconWrapper
          valueColorClass="text-primary"
        />
      </div>

      {/* ── Table Card ───────────────────────────────────── */}
      <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border/40">
          <div className="relative w-full">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu items..."
              className="pl-9 bg-background/50 border-border/40"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="w-12 text-center"></TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Margin</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <SkeletonRows />
            ) : filteredItems.length === 0 ? (
              <SearchEmptyState />
            ) : (
              filteredItems.map((item) => {
                const isExpanded = expandedRows[item.id];
                const margin = Math.round(
                  ((item.price - item.cost) / item.price) * 100,
                );

                return (
                  <React.Fragment key={item.id}>
                    <TableRow
                      className="border-border/20 cursor-pointer group"
                      onClick={() => toggleRow(item.id)}
                    >
                      <TableCell className="text-center text-muted-foreground">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 inline" />
                        ) : (
                          <ChevronRight className="h-4 w-4 inline" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{item.image}</span>{" "}
                          {item.name}
                        </div>
                      </TableCell>
                      <TableCell cla>
                        <Badge
                          variant="outline"
                          className="bg-background/50 font-normal text-muted-foreground border-border/50 "
                        >
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        ${item.cost.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        ${item.price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-primary/20 text-primary hover:bg-primary/20 border-0">
                          {margin}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground group-hover:text-foreground opacity-50 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(item);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-muted/10 border-border/20 hover:bg-muted/10">
                        <TableCell colSpan={7} className="p-0">
                          <div className="px-14 py-4 space-y-4">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Box className="h-4 w-4 text-primary" />{" "}
                              Ingredients{" "}
                              <span className="text-muted-foreground text-xs font-normal">
                                ({item.recipe?.length || 0} items)
                              </span>
                            </div>

                            {item.recipe?.length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {item.recipe.map((r, idx) => {
                                  const inv =
                                    inventory.find(
                                      (i) =>
                                        String(i.id) === String(r.ingredientId),
                                    ) || inventory[0];
                                  return (
                                    <div
                                      key={idx}
                                      className="flex justify-between items-center text-sm px-3 py-2 border border-border/40 rounded-md bg-muted/50"
                                    >
                                      <span className="text-foreground text-xs">
                                        {inv?.name || "Unknown"}
                                      </span>
                                      <span className="text-primary font-mono text-[10px]">
                                        {r.quantity}&nbsp;
                                        {inv?.unit || "g"}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground italic pl-3 border-l-2 border-primary/50">
                                No ingredients defined. Edit to add composition.
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Edit Dialog ──────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Menu Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Item Name
              </Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Cost ($)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.cost}
                  onChange={(e) =>
                    setEditForm({ ...editForm, cost: e.target.value })
                  }
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Price ($)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) =>
                    setEditForm({ ...editForm, price: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Category
                </Label>
                <Input
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm({ ...editForm, category: e.target.value })
                  }
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Emoji Icon
                </Label>
                <Input
                  value={editForm.image}
                  onChange={(e) =>
                    setEditForm({ ...editForm, image: e.target.value })
                  }
                />
              </div>
            </div>

            {/* ── Ingredients Section ────────────────────────── */}
            <div className="pt-4 border-t border-border/40">
              <div className="flex justify-between items-center mb-3">
                <Label>Ingredients</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary hover:bg-primary/10 gap-1 h-8"
                  onClick={addIngredientRow}
                >
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                {recipeEdit.map((r, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Select
                      value={String(r.ingredientId)}
                      onValueChange={(v) => {
                        const newR = [...recipeEdit];
                        newR[idx].ingredientId = v;
                        setRecipeEdit(newR);
                      }}
                    >
                      <SelectTrigger className="flex-1 bg-muted/20 border-border/40">
                        <SelectValue placeholder="Select ingredient..." />
                      </SelectTrigger>
                      <SelectContent>
                        {inventory.map((inv) => (
                          <SelectItem key={inv.id} value={String(inv.id)}>
                            {inv.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="w-24 relative">
                      <Input
                        type="number"
                        value={r.quantity}
                        onChange={(e) => {
                          const newR = [...recipeEdit];
                          newR[idx].quantity = e.target.value;
                          setRecipeEdit(newR);
                        }}
                        className="bg-muted/20 border-border/40 pr-8"
                        placeholder="Qty"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-primary">
                        {inventory.find(
                          (i) => String(i.id) === String(r.ingredientId),
                        )?.unit || ""}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => removeIngredientRow(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {recipeEdit.length === 0 && (
                  <p className="text-sm text-muted-foreground italic text-center py-4">
                    No recipe ingredients set.
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border/40 mt-4">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
