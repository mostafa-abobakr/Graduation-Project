import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Building2,
  CalendarCheck,
  Ban,
  DollarSign,
  Search,
  SearchX,
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// --- Components ---

const RestaurantsTable = ({ restaurants, loading }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("latest");
  const [selected, setSelected] = useState([]);
  
  // Deactivate Modal state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] = useState(null); 
  
  // Activate Modal state
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);
  const [restaurantToActivate, setRestaurantToActivate] = useState(null);

  // Update Modal state
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [restaurantToUpdate, setRestaurantToUpdate] = useState(null);
  const [updateFormData, setUpdateFormData] = useState({ restaurantName: "", ownerEmail: "", status: "Active" });

  // Add Modal state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({ restaurantName: "", ownerEmail: "", status: "Active" });

  const filteredData = (!loading && restaurants?.length > 0)
    ? restaurants
        .filter((item) =>
          item.restaurantName?.toLowerCase().includes(search.toLowerCase()) ||
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

  const isAllSelected = filteredData.length > 0 && selected.length === filteredData.length;

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

  const handleAddSubmit = async () => {
    if (!addFormData.restaurantName || !addFormData.ownerEmail) {
      toast({ title: "Validation Error", description: "Please fill out all required fields.", variant: "destructive" });
      return;
    }
    try {
      // Fake delay to simulate actual backend request
      await new Promise(r => setTimeout(r, 600));
      
      // Real API logic to implement when ready:
      // const token = localStorage.getItem("authToken");
      // await axios.post("http://resturantai.runasp.net/api/admin/restaurants", addFormData, { headers: { Authorization: `Bearer ${token}` } });
      
      toast({ title: "Success", description: `Restaurant "${addFormData.restaurantName}" has been added.` });
      setIsAddDialogOpen(false);
      
      setAddFormData({ restaurantName: "", ownerEmail: "", status: "Active" });
      queryClient.invalidateQueries(["Admin_dashboard"]);
    } catch (err) {
      toast({ title: "Error", description: "Failed to add restaurant.", variant: "destructive" });
    }
  };

  const handleUpdateSubmit = async () => {
    try {
      // Fake delay to simulate actual backend request
      await new Promise(r => setTimeout(r, 600));

      // Real API logic to implement when ready:
      // const token = localStorage.getItem("authToken");
      // await axios.put(`http://resturantai.runasp.net/api/admin/restaurants/${restaurantToUpdate.restaurantId}`, updateFormData, ...);

      toast({ title: "Success", description: "Restaurant updated successfully." });
      setIsUpdateDialogOpen(false);
      
      queryClient.invalidateQueries(["Admin_dashboard"]);
    } catch (err) {
      toast({ title: "Error", description: "Failed to update restaurant.", variant: "destructive" });
    }
  };

  const handleDeactivateConfirm = async () => {
    try {
      const targets = restaurantToDelete ? [restaurantToDelete.restaurantId] : selected;
      
      // Fake delay
      await new Promise(r => setTimeout(r, 600));
      
      // Real API logic to implement when ready:
      // const token = localStorage.getItem("authToken");
      // await axios.post("http://resturantai.runasp.net/api/admin/restaurants/bulk-deactivate", { ids: targets }, ...);

      toast({ 
        title: "Accounts Deactivated", 
        description: `Successfully deactivated ${targets.length} restaurant(s).` 
      });
      setIsDeleteDialogOpen(false);
      if (!restaurantToDelete) setSelected([]); // Clear bulk selection
      
      queryClient.invalidateQueries(["Admin_dashboard"]);
    } catch (err) {
      toast({ title: "Error", description: "Failed to deactivate restaurants.", variant: "destructive" });
    }
  };

  const handleActivateConfirm = async () => {
    try {
      const targets = restaurantToActivate ? [restaurantToActivate.restaurantId] : selected;
      
      // Fake delay
      await new Promise(r => setTimeout(r, 600));
      
      // Real API logic to implement when ready:
      // const token = localStorage.getItem("authToken");
      // await axios.post("http://resturantai.runasp.net/api/admin/restaurants/bulk-activate", { ids: targets }, ...);

      toast({ 
        title: "Accounts Activated", 
        description: `Successfully activated ${targets.length} restaurant(s).` 
      });
      setIsActivateDialogOpen(false);
      if (!restaurantToActivate) setSelected([]); // Clear bulk selection
      
      queryClient.invalidateQueries(["Admin_dashboard"]);
    } catch (err) {
      toast({ title: "Error", description: "Failed to activate restaurants.", variant: "destructive" });
    }
  };

  return (
    <>
      <Card className="p-4 sm:p-6 bg-card border-border/60 premium-shadow mt-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="w-full sm:w-[30%]">
            <h2 className="text-xl font-bold text-foreground text-left">Restaurant Database</h2>
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

            {/* <Button 
              className="w-full sm:w-auto gap-2"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4" /> Add Restaurant
            </Button> */}
          </div>
        </div>

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
                <TableHead className="font-semibold text-center">Platform Status</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4 rounded-sm" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full max-w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full max-w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full max-w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell align="right"><Skeleton className="h-8 w-8 rounded-full inline-block" /></TableCell>
                  </TableRow>
                ))
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground w-full py-8">
                      <div className="h-20 w-20 rounded-full bg-muted/50 flex flex-col items-center justify-center mb-4 border border-border/50 shadow-sm animate-pulse-slow">
                        <SearchX className="h-10 w-10 text-muted-foreground/60" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-1 tracking-tight">No restaurants found</h3>
                      <p className="text-sm text-balance max-w-sm mb-4">
                        We couldn't find any match for <span className="font-semibold text-foreground">"{search}"</span>.
                      </p>
                      <Button 
                        variant="secondary" 
                        onClick={() => setSearch("")}
                        className="rounded-full shadow-sm"
                      >
                        Clear Search
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((row) => (
                  <TableRow 
                    key={row.restaurantId} 
                    className={`hover:bg-muted/30 transition-colors ${selected.includes(row.restaurantId) ? "bg-primary/5" : ""}`}
                  >
                    <TableCell className="text-center align-middle">
                      <Checkbox 
                        checked={selected.includes(row.restaurantId)}
                        onCheckedChange={(checked) => handleSelect(checked, row.restaurantId)}
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
                        ? new Date(row.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) +
                          " " +
                          new Date(row.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={row.status === "Active" ? "default" : "destructive"}
                        className={row.status === "Active" ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-0" : ""}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => {
                            setRestaurantToUpdate(row);
                            setUpdateFormData({
                              restaurantName: row.restaurantName || "",
                              ownerEmail: row.ownerEmail || "",
                              status: row.status || "Active"
                            });
                            setIsUpdateDialogOpen(true);
                          }}>
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

      {/* Bulk Actions Floating Bar */}
      {selected.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background/90 backdrop-blur-xl border border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-8 fade-in duration-300 pointer-events-auto">
          <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 text-sm">
            {selected.length} Selected
          </Badge>
          <div className="w-px h-6 bg-border/60"></div>
          <Button 
            variant="ghost" 
            className="text-muted-foreground hover:text-foreground rounded-full"
            onClick={() => setSelected([])}
          >
            Cancel
          </Button>
          <Button 
             variant="outline" 
             className="rounded-full shadow-sm hover:shadow-md transition-all text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
             onClick={() => {
               setRestaurantToActivate(null); // Indicates bulk activate
               setIsActivateDialogOpen(true);
             }}
          >
            Activate Selected
          </Button>
          <Button 
            variant="destructive" 
            className="rounded-full shadow-lg hover:shadow-xl transition-all"
            onClick={() => {
              setRestaurantToDelete(null); // Indicates bulk delete
              setIsDeleteDialogOpen(true);
            }}
          >
            Deactivate Selected
          </Button>
        </div>
      )}

      {/* Activate Alert Dialog */}
      <AlertDialog open={isActivateDialogOpen} onOpenChange={setIsActivateDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Activate Restaurant(s)</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground mt-2">
              {restaurantToActivate
                ? `Are you sure you want to activate "${restaurantToActivate.restaurantName}"? They will regain access to the platform.`
                : `Are you sure you want to activate ${selected.length} selected restaurants? They will regain access to the platform.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleActivateConfirm}
            >
              Yes, Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Deactivate Restaurant(s)</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground mt-2">
              {restaurantToDelete
                ? `Are you sure you want to deactivate "${restaurantToDelete.restaurantName}"? They will lose access to the platform until reactivated.`
                : `Are you sure you want to deactivate ${selected.length} selected restaurants? They will lose access to the platform.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeactivateConfirm}
            >
              Yes, Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update Dialog Modal */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Restaurant</DialogTitle>
            <DialogDescription>
              Modify the platform access details for {restaurantToUpdate?.restaurantName}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <label htmlFor="update-name" className="text-sm font-semibold text-foreground">Restaurant Name</label>
              <Input 
                id="update-name" 
                value={updateFormData.restaurantName}
                onChange={(e) => setUpdateFormData({...updateFormData, restaurantName: e.target.value})}
                className="bg-muted/30" 
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="update-email" className="text-sm font-semibold text-foreground">Owner Email</label>
              <Input 
                id="update-email" 
                value={updateFormData.ownerEmail}
                onChange={(e) => setUpdateFormData({...updateFormData, ownerEmail: e.target.value})}
                className="bg-muted/30" 
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="update-status" className="text-sm font-semibold text-foreground">Platform Status</label>
              <Select 
                value={updateFormData.status} 
                onValueChange={(val) => setUpdateFormData({...updateFormData, status: val})}
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
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateSubmit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dialog Modal */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Restaurant</DialogTitle>
            <DialogDescription>
              Manually onboard a new restaurant to the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <label htmlFor="add-name" className="text-sm font-semibold text-foreground">Restaurant Name</label>
              <Input 
                id="add-name" 
                placeholder="E.g. The Gourmet Kitchen"
                value={addFormData.restaurantName}
                onChange={(e) => setAddFormData({...addFormData, restaurantName: e.target.value})}
                className="bg-muted/30" 
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="add-email" className="text-sm font-semibold text-foreground">Owner Email</label>
              <Input 
                id="add-email" 
                type="email"
                placeholder="owner@restaurant.com"
                value={addFormData.ownerEmail}
                onChange={(e) => setAddFormData({...addFormData, ownerEmail: e.target.value})}
                className="bg-muted/30" 
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="add-status" className="text-sm font-semibold text-foreground">Initial Status</label>
              <Select 
                value={addFormData.status} 
                onValueChange={(val) => setAddFormData({...addFormData, status: val})}
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
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSubmit}>Create Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("authToken");

      const res = await axios.get("http://resturantai.runasp.net/api/admin/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return res.data;
    } catch (error) {
      if (error?.response?.status === 403 || error?.response?.status === 401) {
        navigate("/unauthorized");
      } else {
        throw error;
      }
    }
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["Admin_dashboard"],
    queryFn: fetchDashboard,
    staleTime: 1000 * 60 * 5,
  });

  const dashboardData = [
    {
      title: "Total Restaurants",
      value: data?.summary?.totalRestaurants ?? 0,
      icon: <Building2 className="h-6 w-6" />,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
    },
    {
      title: "Active Restaurants",
      value: data?.summary?.activeRestaurants ?? 0,
      icon: <CalendarCheck className="h-6 w-6" />,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      title: "Inactive Restaurants",
      value: data?.summary?.inactiveRestaurants ?? 0,
      icon: <Ban className="h-6 w-6" />,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/30",
    },
    {
      title: "Total Revenue",
      value: `$${((data?.summary?.totalRestaurants ?? 0) * 500).toLocaleString()}`,
      icon: <DollarSign className="h-6 w-6" />,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1 mt-2">Platform Overview</h1>
        <p className="text-muted-foreground text-sm">Overview and management of all registered restaurants.</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="p-5 bg-card border-border/60 premium-shadow">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full max-w-[100px]" />
                    <Skeleton className="h-6 w-full max-w-[60px]" />
                  </div>
                </div>
              </Card>
            ))
          : dashboardData.map((item, index) => (
              <Card
                key={index}
                className="p-5 bg-card border-border/60 premium-shadow flex items-center gap-4 transition-transform hover:-translate-y-1 hover:shadow-xl duration-300"
              >
                {/* Icon */}
                <div
                  className={`flex items-center justify-center shrink-0 w-12 h-12 rounded-xl ${item.bgColor} ${item.color}`}
                >
                  {item.icon}
                </div>

                <div className="flex flex-col">
                  <span className="text-sm font-medium text-muted-foreground whitespace-nowrap mb-0.5">
                    {item.title}
                  </span>
                  <span className="text-2xl font-bold text-foreground leading-tight tracking-tight">
                    {item.value}
                  </span>
                </div>
              </Card>
            ))}
      </div>

      {/* Table */}
      <RestaurantsTable
        restaurants={data?.restaurants || []}
        loading={isLoading || (!data && !isError)}
      />
    </div>
  );
}
