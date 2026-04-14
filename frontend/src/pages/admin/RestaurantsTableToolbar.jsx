import React from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RestaurantsTableToolbar({
  search,
  setSearch,
  sortOrder,
  setSortOrder,
  onAddRestaurant,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
      <div className="w-full sm:w-[30%]">
        <h2 className="text-xl font-bold text-foreground text-left">
          Restaurant Database
        </h2>
      </div>

      <div className="flex justify-center w-full sm:w-[40%]">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search restaurants"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50 focus:bg-background transition-colors"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="flex justify-end items-center gap-3 w-full sm:w-[30%]">
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-full sm:w-40 bg-background/50">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="a-z">Alphabetical (A-Z)</SelectItem>
            <SelectItem value="status">Status (Active First)</SelectItem>
          </SelectContent>
        </Select>

        <Button
          className="w-full sm:w-auto gap-2"
          onClick={onAddRestaurant}
        >
          <Plus className="h-4 w-4" /> Add Restaurant
        </Button>
      </div>
    </div>
  );
}
