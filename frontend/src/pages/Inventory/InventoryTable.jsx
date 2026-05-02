import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Pencil,
  Trash2,
  PackageSearch,
  PackagePlus,
  PackageMinus,
  Eye,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { statusMeta } from "@/lib/inventoryStore";

const formatUnit = (unit) => {
  const u = (unit || "").toLowerCase();
  if (u === "liters" || u === "liter" || u === "l") return "L";
  if (u === "kg" || u === "kilograms" || u === "kilogram") return "kg";
  if (u === "units" || u === "unit" || u === "pieces" || u === "piece" || u === "pcs") return "pcs";
  if (u === "grams" || u === "gram" || u === "g") return "g";
  if (u === "milliliters" || u === "ml") return "ml";
  if (u === "boxes" || u === "box") return "box";
  return unit;
};

export function InventoryTable({
  filtered,
  loading,
  search,
  setSearch,
  openRestock,
  openDeduct,
  openEdit,
  deleteItem,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/40">
            <th className="text-start py-3 px-4 text-muted-foreground font-medium">
              Item
            </th>
            <th className="text-center py-3 px-4 text-muted-foreground font-medium hidden sm:table-cell">
              Category
            </th>
            <th className="text-center py-3 px-4 text-muted-foreground font-medium">
              Quantity
            </th>
            <th className="text-center py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">
              Status
            </th>
            <th className="text-center py-3 px-4 text-muted-foreground font-medium">
              Stock
            </th>
            <th className="text-center py-3 px-4 text-muted-foreground font-medium">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border/40">
                <td className="py-3 px-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20 mt-1" />
                </td>
                <td className="py-3 px-4 hidden sm:table-cell">
                  <Skeleton className="h-4 w-24 mx-auto" />
                </td>
                <td className="py-3 px-4">
                  <Skeleton className="h-4 w-16 mx-auto" />
                </td>
                <td className="py-3 px-4 hidden md:table-cell">
                  <div className="flex justify-center">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-center gap-1">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-center gap-1">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </td>
              </tr>
            ))
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-0">
                <EmptyState
                  searchQuery={search}
                  searchItemName="items"
                  onAction={() => setSearch("")}
                  icon={PackageSearch}
                  title="No items found"
                  description="No items match your filters."
                />
              </td>
            </tr>
          ) : (
            filtered.map((i) => {
              const isCritical = i.status === "critical" || i.status === "out";
              return (
                <tr
                  key={i.id}
                  className={`border-b border-border/40 hover:bg-muted/30 transition ${
                    isCritical ? "bg-destructive/5" : ""
                  }`}
                >
                  {/* Item name – clickable, navigates to details */}
                  <td className="py-3 px-4">
                    <Link
                      to={`/inventory/${i.id}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {i.name}
                    </Link>
                    {/* Show category inline on small screens */}
                    <div className="text-xs text-muted-foreground sm:hidden mt-0.5">
                      {i.category}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-muted-foreground text-center hidden sm:table-cell">
                    {i.category}
                  </td>

                  <td className="py-3 px-4 text-center font-mono">
                    <span
                      className={
                        isCritical ? "text-destructive font-semibold" : ""
                      }
                    >
                      {Math.floor(i.quantity)} {formatUnit(i.unit)}
                    </span>
                    <div className="text-xs text-muted-foreground">
                      reorder ≤ {i.reorderLevel}
                    </div>
                  </td>

                  <td className="py-3 px-4 hidden md:table-cell">
                    <div className="flex justify-center">
                      <Badge
                        className={statusMeta[i.status].class + " border-0"}
                      >
                        {isCritical && (
                          <AlertTriangle className="h-3 w-3 mr-1" />
                        )}
                        {statusMeta[i.status].label}
                      </Badge>
                    </div>
                  </td>

                  {/* Stock actions: Restock + Deduct */}
                  <td className="py-3 px-4">
                    <div className="flex justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        title="Restock"
                        onClick={() => openRestock(i)}
                      >
                        <PackagePlus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        title="Deduct Stock"
                        onClick={() => openDeduct(i)}
                      >
                        <PackageMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>

                  {/* CRUD actions: View, Edit, Delete */}
                  <td className="py-3 px-4">
                    <div className="flex justify-center gap-1">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        title="Details"
                        className="h-7 w-7 text-gray-500 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                      >
                        <Link to={`/inventory/${i.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit"
                        className="h-7 w-7 text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 transition-colors shrink-0"
                        onClick={() => openEdit(i)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete"
                            className="h-7 w-7 text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete "{i.name}"?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This permanently removes the item from inventory.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                deleteItem(i.id);
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
