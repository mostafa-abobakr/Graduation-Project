import React, { useState, useMemo, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useInventoryItems } from "@/hooks/useInventory";
import { useAuth } from "@/contexts/AuthContext";
import { useMenuQuery, useUpdateMenuItem } from "@/hooks/useMenu";
import api from "@/api/axios";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  UploadCloud,
  Loader2,
  ChefHat
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { SummaryCard } from "@/components/shared/SummaryCard";
import { SkeletonRows } from "@/components/shared/Skeletons";
import { cn, getValidEmoji } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatNumber } from "@/lib/formatNumber";

const MENU_ITEM_EMOJIS = {
  Drinks: ["☕", "🫖", "🧋", "🥤", "🧃"],
  "Mains & Fast Food": [
    "🍔",
    "🍟",
    "🍕",
    "🥪",
    "🌮",
    "🌯",
    "🥩",
    "🍗",
    "🍝",
    "🍜",
    "🍣",
  ],
  "Starters & Sides": ["🥗", "🥣", "🫓", "🥖", "🍞", "🧀"],
  "Breakfast & Bakery": ["🥐", "🥯", "🥞", "🧇", "🍳", "🥓"],
  Desserts: ["🍰", "🧁", "🍩", "🍪", "🥧", "🍦", "🍨"],
};

export default function MenuManagementPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const restId = user?.restId;
  const { data: inventory = [] } = useInventoryItems(restId);
  const { data: menuItems = [], isLoading: isMenuLoading } = useMenuQuery();
  const { mutate: updateMenuItem } = useUpdateMenuItem();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedRows, setExpandedRows] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);

  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const location = useLocation();
  const highlightedItemId = location.state?.highlightMenuItemId;
  const [activeHighlightId, setActiveHighlightId] = useState(null);

  useEffect(() => {
    if (highlightedItemId && menuItems.length > 0) {
      setExpandedRows({ [highlightedItemId]: true });
      setActiveHighlightId(highlightedItemId);
      setTimeout(() => {
        const el = document.getElementById(`menu-item-${highlightedItemId}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);

      const timer = setTimeout(() => {
        setActiveHighlightId(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [highlightedItemId, menuItems]);

  const processFile = async (file) => {
    if (!file.type.startsWith("image/")) {
      toast.error(t("Please upload a valid image file"));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("Image size must be less than 2MB"));
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "menu_items_preset");

    try {
      // Note: Cloudinary does not require our internal auth token.
      // We rely on axios to set the correct Content-Type for FormData.
      const response = await api.post(
        "https://api.cloudinary.com/v1_1/dzf0esgoy/image/upload",
        formData,
        {
          transformRequest: [(data, headers) => {
            delete headers.Authorization;
            return data;
          }]
        }
      );
      const data = response.data;
      if (response.status === 200) {
        setEditForm((prev) => ({ ...prev, image: data.secure_url }));
        toast.success(t("Image uploaded successfully"));
      } else {
        toast.error(data.error?.message || t("Failed to upload image"));
      }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || t("An error occurred during upload"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Editable form state for the edit dialog
  const [editForm, setEditForm] = useState({
    id: null,
    restId: null,
    name: "",
    description: "",
    cost: "",
    price: "",
    category: "",
    image: "",
  });
  const [ingredientsEdit, setIngredientsEdit] = useState([]);

  const [customEmoji, setCustomEmoji] = useState("");
  const [customEmojiError, setCustomEmojiError] = useState("");

  const handleCustomEmojiChange = (e) => {
    const val = e.target.value;
    setCustomEmoji(val);
    if (!val) {
      setCustomEmojiError("");
      return;
    }
    const regex =
      /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d\uFE0F]+$/u;
    if (!regex.test(val)) {
      setCustomEmojiError(t("Please enter a valid emoji"));
    } else {
      setCustomEmojiError("");
      setEditForm({ ...editForm, image: val });
    }
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => (prev[id] ? {} : { [id]: true }));
  };

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, search, categoryFilter]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set(
      menuItems.map((i) => i.category).filter(Boolean),
    );
    return Array.from(categories).sort();
  }, [menuItems]);

  const totalCategories = uniqueCategories.length;
  const avgMargin = useMemo(() => {
    if (!menuItems.length) return 0;
    const sum = menuItems.reduce((acc, item) => {
      if (item.price === 0) return acc;
      return acc + (item.price - item.cost) / item.price;
    }, 0);
    return Math.round((sum / menuItems.length) * 100);
  }, [menuItems]);

  const openEdit = (item) => {
    setEditForm({
      id: item.id,
      restId: item.restId,
      name: item.name,
      description: item.description || "",
      cost: String(item.cost),
      price: String(item.price),
      category: item.category,
      image: item.image || "",
    });
    setIngredientsEdit(
      item.ingredients ? item.ingredients.map((r) => ({ ...r })) : [],
    );
    setCustomEmoji("");
    setCustomEmojiError("");
    setDialogOpen(true);
  };

  const addIngredientRow = () => {
    setIngredientsEdit([
      ...ingredientsEdit,
      { inventoryId: "", quantityUsed: "" },
    ]);
  };

  const removeIngredientRow = (index) => {
    setIngredientsEdit(ingredientsEdit.filter((_, i) => i !== index));
  };

  const saveEdit = () => {
    if (ingredientsEdit.some((r) => !r.inventoryId || !r.quantityUsed)) {
      toast.error(t("Please fill out all ingredient details."));
      return;
    }

    const payload = {
      menuItemId: editForm.id,
      restaurantId: editForm.restId,
      itemName: editForm.name,
      description: editForm.description || "",
      price: parseFloat(editForm.price) || 0,
      cost: parseFloat(editForm.cost) || 0,
      category: editForm.category,
      imageURL: editForm.image || "",
      ingredients: ingredientsEdit.map((ing) => ({
        inventoryID: parseInt(ing.inventoryId, 10),
        quantityUsed: parseFloat(ing.quantityUsed) || 0,
      })),
    };

    updateMenuItem(payload);
    setDialogOpen(false);
  };

  /* ── Search empty state ─────────────────────────────── */
  const SearchEmptyState = () => (
    <TableRow>
      <TableCell colSpan={7} className="p-0">
        <EmptyState
          searchQuery={search}
          searchItemName={t("menu items")}
          onAction={() => setSearch("")}
        />
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6 animate-fade-in py-5 w-full">
      <PageHeader
        icon={ChefHat}
        title={t("Menu Management")}
        description={t("Manage your restaurant menu items and ingredients")}
      />

      {/* ── KPI Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title={t("Total Items")}
          value={
            isMenuLoading ? <Skeleton className="h-9 w-12" /> : menuItems.length
          }
          icon={Utensils}
          iconWrapper
        />
        <SummaryCard
          title={t("Categories")}
          value={
            isMenuLoading ? <Skeleton className="h-9 w-12" /> : totalCategories
          }
          icon={LayoutGrid}
          iconWrapper
        />
        <SummaryCard
          title={t("Avg Margin")}
          value={
            isMenuLoading ? <Skeleton className="h-9 w-16" /> : `${avgMargin}%`
          }
          icon={Percent}
          iconWrapper
          valueColorClass="text-primary"
        />
      </div>

      {/* ── Table Card ───────────────────────────────────── */}
      <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border/40 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Search menu items...")}
              className="pl-9 bg-background/50 border-border/40"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] bg-background/50 border-border/40">
              <SelectValue placeholder={t("Category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All Categories")}</SelectItem>
              {uniqueCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="w-12 text-center"></TableHead>
              <TableHead>{t("Item")}</TableHead>
              <TableHead className="text-center">{t("Category")}</TableHead>
              <TableHead className="text-center">{t("Cost")}</TableHead>
              <TableHead className="text-center">{t("Price")}</TableHead>
              <TableHead className="text-center">{t("Margin")}</TableHead>
              <TableHead className="text-center">{t("Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isMenuLoading ? (
              <SkeletonRows />
            ) : filteredItems.length === 0 ? (
              <SearchEmptyState />
            ) : (
              filteredItems.map((item) => {
                const isExpanded = expandedRows[item.id];
                const margin =
                  item.price > 0
                    ? Math.round(((item.price - item.cost) / item.price) * 100)
                    : 0;

                let marginBadgeClass =
                  "bg-primary/20 text-primary hover:bg-primary/20";
                if (margin >= 65) {
                  marginBadgeClass =
                    "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/15";
                } else if (margin >= 40) {
                  marginBadgeClass =
                    "bg-amber-500/15 text-amber-500 hover:bg-amber-500/15";
                } else {
                  marginBadgeClass =
                    "bg-destructive/15 text-destructive hover:bg-destructive/15";
                }

                return (
                  <React.Fragment key={item.id}>
                    <TableRow
                      id={`menu-item-${item.id}`}
                      className={cn(
                        "border-border/20 cursor-pointer group transition-colors",
                        activeHighlightId === item.id
                          ? "bg-amber-500/15 hover:bg-amber-500/15 ring-2 ring-amber-500/50"
                          : "",
                      )}
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
                        <div className="flex items-center gap-3">
                          {item.image && item.image.startsWith("http") ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              loading="lazy"
                              className="h-10 w-10 rounded-md object-cover border border-border/40"
                            />
                          ) : (
                            <div className="h-10 w-10 flex items-center justify-center rounded-md bg-background/50 text-xl border  shrink-0">
                              {getValidEmoji(item.image, "🍽️")}
                            </div>
                          )}
                          <span>{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.category ? (
                          <Badge
                            variant="outline"
                            className="bg-background/50 font-normal text-muted-foreground border-border/50"
                          >
                            {item.category}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-muted/50 font-normal text-muted-foreground/70 border-border/30"
                          >
                            {t("Uncategorized")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {formatNumber(item.cost, language === 'ar', { style: 'currency', currency: 'EGP' })}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-foreground">
                        {formatNumber(item.price, language === 'ar', { style: 'currency', currency: 'EGP' })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${marginBadgeClass} border-0`}>
                          {margin}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
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
                              {t("Ingredients")}{" "}
                              <span className="text-muted-foreground text-xs font-normal">
                                ({item.ingredients?.length || 0} {t("items")})
                              </span>
                            </div>

                            {item.ingredients?.length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {item.ingredients.map((r, idx) => {
                                  const inv = inventory.find(
                                    (i) =>
                                      String(i.id) === String(r.inventoryId),
                                  );
                                  return (
                                    <div
                                      key={idx}
                                      className="flex justify-between items-center text-sm px-3 py-2 border border-border/40 rounded-md bg-muted/50"
                                    >
                                      <span className="text-foreground text-xs flex items-center gap-2">
                                        <span>
                                          {getValidEmoji(inv?.imageUrl)}
                                        </span>
                                        <span>{inv?.name || t("Unknown")}</span>
                                      </span>
                                      <span className="text-primary font-mono text-[10px]">
                                        {r.quantityUsed}&nbsp;
                                        {inv?.unit || ""}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground italic pl-3 border-l-2 border-primary/50">
                                {t(
                                  "No ingredients defined. Edit to add composition.",
                                )}
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
        <DialogContent className="max-w-2xl bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="text-xl">{t("Edit Menu Item")}</DialogTitle>
            <DialogDescription className="sr-only">
              Edit menu item details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-2">
            {/* ── TOP SECTION: Details & Media Split ──────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Text Details */}
              <div className="col-span-1 md:col-span-7 space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    {t("Item Name")}
                  </Label>
                  <Input
                    value={editForm.name}
                    disabled
                    className="bg-muted/50"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    {t("Category")}
                  </Label>
                  <Input
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category: e.target.value })
                    }
                    list="categories-list"
                  />
                  <datalist id="categories-list">
                    {uniqueCategories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    {t("Description")}
                  </Label>
                  <Input
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    placeholder={t("Brief description of the item...")}
                  />
                </div>
              </div>

              {/* Right Column: Media Upload */}
              <div className="col-span-1 md:col-span-5 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs text-muted-foreground block">
                    {t("Icon / Image")}
                  </Label>
                  <Popover modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 text-[10px] px-2 text-muted-foreground hover:text-foreground"
                      >
                        {t("Use Emoji")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-3" align="start">
                      <div className="space-y-4">
                        <div className="max-h-[220px] overflow-y-auto pr-2 space-y-3 scrollbar-thin">
                          {Object.entries(MENU_ITEM_EMOJIS).map(
                            ([group, emojis]) => (
                              <div key={group}>
                                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                                  {t(group)}
                                </div>
                                <div className="grid grid-cols-6 gap-1">
                                  {emojis.map((e) => (
                                    <Button
                                      key={e}
                                      variant="ghost"
                                      className={cn(
                                        "h-8 w-8 p-0 text-lg hover:bg-muted/50",
                                        editForm.image === e &&
                                          "bg-muted/80 ring-1 ring-border",
                                      )}
                                      onClick={() => {
                                        setEditForm({ ...editForm, image: e });
                                        setCustomEmoji("");
                                        setCustomEmojiError("");
                                      }}
                                    >
                                      {e}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                        <div className="pt-3 border-t border-border/40">
                          <Label className="text-xs text-muted-foreground mb-1.5 block">
                            {t("Custom Emoji")}
                          </Label>
                          <Input
                            value={customEmoji}
                            onChange={handleCustomEmojiChange}
                            placeholder={t("Paste one emoji...")}
                            className={cn(
                              "bg-background/50 h-8 text-sm",
                              customEmojiError &&
                                "border-destructive focus-visible:ring-destructive",
                            )}
                          />
                          {customEmojiError && (
                            <p className="text-[10px] text-destructive mt-1.5 font-medium">
                              {customEmojiError}
                            </p>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex-1 min-h-[160px] flex flex-col items-center justify-center w-full rounded-md border-2 border-dashed transition-colors cursor-pointer overflow-hidden ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border/60 bg-muted/20 hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files?.[0]) processFile(e.target.files[0]);
                    }}
                    accept="image/*"
                    className="hidden"
                  />

                  {isUploading ? (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
                      <span className="text-xs">{t("Uploading...")}</span>
                    </div>
                  ) : editForm.image?.startsWith("http") ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={editForm.image}
                        alt="Uploaded"
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {t("Click to change")}
                        </span>
                      </div>
                    </div>
                  ) : editForm.image && !editForm.image.startsWith("http") ? (
                    <div className="text-5xl">{editForm.image}</div>
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground p-4 text-center">
                      <UploadCloud className="h-8 w-8 mb-2 opacity-70" />
                      <span className="text-xs font-medium">
                        {t("Click or drag image")}
                      </span>
                      <span className="text-[10px] opacity-70 mt-1">
                        {t("max 2MB")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── MIDDLE SECTION: Financials ───────────────────── */}
            <div className="grid grid-cols-2 gap-6 p-4 bg-muted/30 rounded-lg border border-border/40">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  {t("Cost (EGP)")}
                </Label>
                <Input
                  type="number"
                  value={editForm.cost}
                  disabled
                  className="bg-background/50"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  {t("Price (EGP)")}
                </Label>
                <Input
                  type="number"
                  value={editForm.price}
                  disabled
                  className="bg-background/50"
                />
              </div>
            </div>

            {/* ── BOTTOM SECTION: Ingredients ──────────────────── */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label>{t("Recipe Ingredients")}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary hover:bg-primary/10 gap-1 h-8"
                  onClick={addIngredientRow}
                >
                  <Plus className="h-3 w-3" /> {t("Add Item")}
                </Button>
              </div>

              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 p-1 -ml-1">
                {ingredientsEdit.map((r, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Select
                      value={r.inventoryId ? String(r.inventoryId) : undefined}
                      onValueChange={(v) => {
                        const newR = [...ingredientsEdit];
                        newR[idx].inventoryId = v;
                        setIngredientsEdit(newR);
                      }}
                    >
                      <SelectTrigger className="flex-1 bg-background/50 border-border/40">
                        <SelectValue placeholder={t("Select ingredient...")} />
                      </SelectTrigger>
                      <SelectContent>
                        {inventory.map((inv) => (
                          <SelectItem key={inv.id} value={String(inv.id)}>
                            <div className="flex items-center gap-2">
                              {/* Automatically shows emoji if available, else a box */}
                              <span className="text-base opacity-90">
                                {getValidEmoji(inv.imageUrl)}
                              </span>
                              <span>{inv.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="w-28 relative">
                      <Input
                        type="number"
                        value={r.quantityUsed}
                        onChange={(e) => {
                          const newR = [...ingredientsEdit];
                          newR[idx].quantityUsed = e.target.value;
                          setIngredientsEdit(newR);
                        }}
                        className="bg-background/50 border-border/40 pr-10"
                        placeholder={t("Qty")}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-primary font-medium">
                        {inventory.find(
                          (i) => String(i.id) === String(r.inventoryId),
                        )?.unit || ""}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive/70 hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => removeIngredientRow(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {ingredientsEdit.length === 0 && (
                  <div className="text-sm text-muted-foreground italic text-center py-6 border-2 border-dashed border-border/40 rounded-md">
                    {t("No ingredients added to this recipe.")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border/40 mt-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button onClick={saveEdit}>{t("Save Changes")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
