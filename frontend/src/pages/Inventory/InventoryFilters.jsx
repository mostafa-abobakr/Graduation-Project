import { ViewToggler } from "@/components/shared/ViewToggler";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
export function InventoryFilters({
  filter,
  setFilter,
  categoryFilter,
  setCategoryFilter,
  search,
  setSearch,
  categories = [],
}) {
  return (
    <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/60">
      <div className="w-full max-w-full overflow-x-auto pb-2 -mb-2 custom-scrollbar">
        <ViewToggler
          viewMode={filter}
          setViewMode={setFilter}
          modes={["all", "critical", "low", "expiring", "good"]}
          labels={["All", "Critical", "Low", "Expiring", "In stock"]}
        />
      </div>
      <div className="flex gap-2 items-center">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative w-full sm:w-64">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-9"
          />
        </div>
      </div>
    </div>
  );
}
