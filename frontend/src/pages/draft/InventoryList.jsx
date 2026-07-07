import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, MoreHorizontal, Edit, Trash2, ChevronRight } from "lucide-react";
import { mockInventoryItems } from "../../services/mockData";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusConfig = {
  "In Stock": { label: "In Stock", class: "bg-primary/15 text-primary hover:bg-primary/25 border-0" },
  "Low Stock": { label: "Low Stock", class: "bg-warning/15 text-warning hover:bg-warning/25 border-0" },
  "Expiring": { label: "Expiring", class: "bg-destructive/15 text-destructive hover:bg-destructive/25 border-0" },
  "Out of Stock": { label: "Out of Stock", class: "bg-muted text-muted-foreground border-0" },
};

export default function InventoryList() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredItems = mockInventoryItems.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t("Search items...")} 
            className="pl-9 bg-card border-border/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="In Stock">In Stock</SelectItem>
              <SelectItem value="Low Stock">Low Stock</SelectItem>
              <SelectItem value="Expiring">Expiring</SelectItem>
              <SelectItem value="Out of Stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="bg-card border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="py-3 px-4 font-medium text-muted-foreground">Item Name</th>
                <th className="py-3 px-4 font-medium text-muted-foreground">Category</th>
                <th className="py-3 px-4 font-medium text-muted-foreground text-right">Quantity</th>
                <th className="py-3 px-4 font-medium text-muted-foreground text-right">Expiry Date</th>
                <th className="py-3 px-4 font-medium text-muted-foreground text-center">Status</th>
                <th className="py-3 px-4 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-medium text-foreground cursor-pointer hover:text-primary transition-colors flex items-center gap-2" onClick={() => navigate(`/dashboard/inventory/${item.id}`)}>
                    {item.itemName}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{item.category}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-mono font-medium">{item.quantity}</span>
                    <span className="text-muted-foreground ml-1 text-xs">{item.unit}</span>
                  </td>
                  <td className="py-3 px-4 text-right text-muted-foreground font-mono">{item.expiryDate}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant="secondary" className={statusConfig[item.status]?.class}>
                      {statusConfig[item.status]?.label}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors ml-auto">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem className="cursor-pointer">
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-muted-foreground">
                    No items found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
