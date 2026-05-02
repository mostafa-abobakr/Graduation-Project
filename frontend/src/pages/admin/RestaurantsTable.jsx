import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { CalendarCheck, Ban, MoreVertical, Pencil, Search, Store } from "lucide-react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

import RestaurantsTableToolbar from "./RestaurantsTableToolbar";
import RestaurantBulkActions from "./RestaurantBulkActions";
import AddRestaurantDialog from "./AddRestaurantDialog";
import UpdateRestaurantDialog from "./UpdateRestaurantDialog";
import StatusConfirmDialog from "./StatusConfirmDialog";

export default function RestaurantsTable({ restaurants, loading }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("latest");
  const [selected, setSelected] = useState([]);

  // Clear selection when search query changes
  useEffect(() => {
    setSelected([]);
  }, [search]);

  // Modals state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] = useState(null);

  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);
  const [restaurantToActivate, setRestaurantToActivate] = useState(null);

  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [restaurantToUpdate, setRestaurantToUpdate] = useState(null);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Derived Data
  const filteredData =
    !loading && restaurants?.length > 0
      ? restaurants
          .filter(
            (item) =>
              item.restaurantName
                ?.toLowerCase()
                .includes(search.toLowerCase()) ||
              item.ownerEmail?.toLowerCase().includes(search.toLowerCase())
          )
          .sort((a, b) => {
            if (sortOrder === "a-z") {
              const nameA = a.restaurantName || "";
              const nameB = b.restaurantName || "";
              return nameA.localeCompare(nameB);
            }
            if (sortOrder === "status") {
              if (a.status === b.status) return 0;
              return a.status === "Active" ? -1 : 1;
            }
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
          })
      : [];

  const isAllSelected =
    filteredData.length > 0 && selected.length === filteredData.length;

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelected(filteredData.map((d) => d.restaurantId));
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (checked, id) => {
    if (checked) {
      setSelected([...selected, id]);
    } else {
      setSelected(selected.filter((item) => item !== id));
    }
  };

  // Action Handlers
  const handleAddSubmit = async (formData) => {
    if (!formData.restaurantName || !formData.ownerEmail) {
      toast({
        title: "Validation Error",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }
    try {
      const token = localStorage.getItem("authToken");
      await api.post(
        "/Restaurant",
        {
          restaurantName: formData.restaurantName,
          ownerEmail: formData.ownerEmail,
          isActive: formData.status === "Active",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: "Success",
        description: `Restaurant "${formData.restaurantName}" has been added.`,
      });
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["Admin_dashboard"] });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add restaurant.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSubmit = async (formData) => {
    try {
      const token = localStorage.getItem("authToken");
      await api.put(
        `/admin/restaurants/${restaurantToUpdate.restaurantId}`,
        {
          restaurantName: formData.restaurantName,
          isActive: formData.status === "Active",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: "Success",
        description: "Restaurant updated successfully.",
      });
      setIsUpdateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["Admin_dashboard"] });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update restaurant.",
        variant: "destructive",
      });
    }
  };

  const updateStatus = async (targets, isActive, dialogSetter, targetSetter) => {
    try {
      const token = localStorage.getItem("authToken");

      await Promise.all(
        targets.map(async (id) => {
          const restaurant = restaurants?.find((r) => r.restaurantId === id);
          if (restaurant) {
            await api.put(
              `/admin/restaurants/${id}`,
              {
                restaurantName: restaurant.restaurantName,
                isActive,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
        })
      );

      toast({
        title: isActive ? "Accounts Activated" : "Accounts Deactivated",
        description: `Successfully ${isActive ? "activated" : "deactivated"} ${targets.length} restaurant(s).`,
      });
      dialogSetter(false);
      if (!targetSetter) setSelected([]); // Clear bulk selection

      queryClient.invalidateQueries({ queryKey: ["Admin_dashboard"] });
    } catch (err) {
      toast({
        title: "Error",
        description: `Failed to ${isActive ? "activate" : "deactivate"} restaurants.`,
        variant: "destructive",
      });
    }
  };

  const handleDeactivateConfirm = () => {
    const targets = restaurantToDelete
      ? [restaurantToDelete.restaurantId]
      : selected;
    updateStatus(targets, false, setIsDeleteDialogOpen, restaurantToDelete);
  };

  const handleActivateConfirm = () => {
    const targets = restaurantToActivate
      ? [restaurantToActivate.restaurantId]
      : selected;
    updateStatus(targets, true, setIsActivateDialogOpen, restaurantToActivate);
  };

  return (
    <>
      <Card className="p-4 sm:p-6 bg-card border-border/60 premium-shadow mt-6">
        <RestaurantsTableToolbar
          search={search}
          setSearch={setSearch}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          onAddRestaurant={() => setIsAddDialogOpen(true)}
        />

        <RestaurantBulkActions
          selectedCount={selected.length}
          onCancel={() => setSelected([])}
          onActivate={() => {
            setRestaurantToActivate(null);
            setIsActivateDialogOpen(true);
          }}
          onDeactivate={() => {
            setRestaurantToDelete(null);
            setIsDeleteDialogOpen(true);
          }}
        />

        <div className="rounded-md border border-border/60 overflow-hidden bg-background">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-12 text-center">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="font-semibold">Restaurant Name</TableHead>
                <TableHead className="font-semibold">Owner Email</TableHead>
                <TableHead className="font-semibold">Registered On</TableHead>
                <TableHead className="font-semibold text-center">
                  Platform Status
                </TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-4 rounded-sm" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-full max-w-[150px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-full max-w-[200px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-full max-w-[120px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell align="right">
                      <Skeleton className="h-8 w-8 rounded-full inline-block" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="p-0"
                  >
                    <EmptyState
                      searchQuery={search}
                      searchItemName="restaurants"
                      onAction={() => setSearch("")}
                      icon={Store}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((row) => (
                  <TableRow
                    key={row.restaurantId}
                    className={`hover:bg-muted/30 transition-colors ${
                      selected.includes(row.restaurantId) ? "bg-primary/5" : ""
                    }`}
                  >
                    <TableCell className="text-center align-middle">
                      <Checkbox
                        checked={selected.includes(row.restaurantId)}
                        onCheckedChange={(checked) =>
                          handleSelect(checked, row.restaurantId)
                        }
                        aria-label={`Select ${row.restaurantName}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {row.restaurantName ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.ownerEmail ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }) +
                          " " +
                          new Date(row.createdAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          row.status === "Active" ? "default" : "destructive"
                        }
                        className={
                          row.status === "Active"
                            ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-0"
                            : ""
                        }
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-background"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => {
                              setRestaurantToUpdate(row);
                              setIsUpdateDialogOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                            Update
                          </DropdownMenuItem>
                          {row.status === "Inactive" ? (
                            <DropdownMenuItem
                              onClick={() => {
                                setRestaurantToActivate(row);
                                setIsActivateDialogOpen(true);
                              }}
                              className="text-emerald-600 focus:bg-emerald-500/10 focus:text-emerald-700 mt-1"
                            >
                              <CalendarCheck className="mr-2 h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => {
                                setRestaurantToDelete(row);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive mt-1"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Deactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Reusable Dialog Components */}

      <StatusConfirmDialog
        isOpen={isActivateDialogOpen}
        onOpenChange={setIsActivateDialogOpen}
        onConfirm={handleActivateConfirm}
        action="activate"
        restaurantName={restaurantToActivate?.restaurantName}
        selectedCount={selected.length}
      />

      <StatusConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeactivateConfirm}
        action="deactivate"
        restaurantName={restaurantToDelete?.restaurantName}
        selectedCount={selected.length}
      />

      <UpdateRestaurantDialog
        isOpen={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        restaurant={restaurantToUpdate}
        onSubmit={handleUpdateSubmit}
      />

      <AddRestaurantDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddSubmit}
      />
    </>
  );
}
