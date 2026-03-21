import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useChartTheme } from "./DashboardPage";
import { useQuery } from "@tanstack/react-query";
import { Search, Settings, DollarSign, TrendingUp, ShoppingBag, ChevronDown, ChevronUp, Loader2, AlertCircle } from "lucide-react";
import axios from "axios";

export default function ForecastPage() {
  const ct = useChartTheme();
  const [alignment, setAlignment] = useState("day");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  const [modalOpen, setModalOpen] = useState(false);
  const [weeklyTemperatures, setWeeklyTemperatures] = useState([35, 35, 35, 30, 39, 36, 37]);
  const [dailyData, setDailyData] = useState([30, 0]);
  const [weeklyEvents, setWeeklyEvents] = useState([1, 0, 1, 0, 0, 0, 0]);
  const [expandedItems, setExpandedItems] = useState({});
  const now = new Date();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["hourlyForecast", alignment],
    queryFn: async () => {
      const payload =
        alignment === "week"
          ? { weekly_temperatures: weeklyTemperatures, weekly_events: weeklyEvents }
          : { temperature_celsius: dailyData[0], event_day: dailyData[1] };

      const response = await axios.post(
        `https://youseef-awaad-zerobite-ai-engine.hf.space/forecast/dashboard/${alignment}/2`,
        payload,
        { headers: { Accept: "application/json" } }
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const statistics = [
    { name: "Total Revenue", value: data?.total_revenue?.toFixed(0) || 0, change: data?.revenue_change_pct || "+0%", icon: DollarSign },
    { name: "Total Profit", value: data?.total_profit?.toFixed(0) || 0, change: data?.profit_change_pct || "+0%", icon: TrendingUp },
    { name: "Orders", value: data?.total_orders || 0, change: data?.orders_change_pct || "+0%", icon: ShoppingBag },
  ];

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleTemperatureChange = (index, value) => {
    const newTemps = [...weeklyTemperatures];
    newTemps[index] = parseInt(value) || 0;
    setWeeklyTemperatures(newTemps);
  };

  const handleEventChange = (index, value) => {
    const newEvents = [...weeklyEvents];
    newEvents[index] = parseInt(value) || 0;
    setWeeklyEvents(newEvents);
  };

  const toggleItemExpansion = (itemId) => {
    setExpandedItems((prev) => ({ [itemId]: !prev[itemId] }));
  };

  const { items } = data || { items: [] };
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredItems = items.filter((item) => item.item_name.toLowerCase().includes(normalizedSearch));
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / rowsPerPage));
  const paginatedItems = filteredItems.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  if (isLoading || isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading forecast data...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-6 bg-card border-border/60 max-w-md text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-foreground font-medium">Failed to load forecast</p>
          <p className="text-muted-foreground text-sm">{error?.message || "Something went wrong"}</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales Dashboard</h1>
          <p className="text-muted-foreground text-sm">{now.toDateString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
            <Settings className="h-4 w-4 mr-1.5" /> Settings
          </Button>
          <Tabs value={alignment} onValueChange={setAlignment}>
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statistics.map((stat) => {
          const Icon = stat.icon;
          const displayValue =
            stat.name !== "Orders" && stat.value >= 1000
              ? `$${(stat.value / 1000).toFixed(1)}K`
              : stat.name !== "Orders"
              ? `$${stat.value}`
              : stat.value;
          const isPositive = String(stat.change).startsWith("+");
          return (
            <Card key={stat.name} className="p-5 bg-card border-border/60 premium-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.name}</span>
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="stat-number text-foreground">{displayValue}</p>
              <p className="text-xs mt-1">
                <span className={isPositive ? "text-primary" : "text-destructive"}>{stat.change}</span>
                <span className="text-muted-foreground ml-1">vs last week</span>
              </p>
            </Card>
          );
        })}
      </div>

      {/* Table */}
      <Card className="bg-card border-border/60 premium-shadow">
        <div className="flex justify-between p-4 border-b border-border/60">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{filteredItems.length} items found</p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Expected</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Accuracy</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item, index) => {
                const isExpanded = expandedItems[item.item_name];
                return (
                  <React.Fragment key={item.item_name}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => toggleItemExpansion(item.item_name)}
                    >
                      <TableCell className="text-muted-foreground">{(page - 1) * rowsPerPage + index + 1}</TableCell>
                      <TableCell className="font-medium text-foreground">{item.item_name}</TableCell>
                      <TableCell className="text-right text-foreground">{item.expected_orders}</TableCell>
                      <TableCell className="text-right text-foreground">${item.revenue}</TableCell>
                      <TableCell className="text-right">
                        <span className={item.profit >= 50 ? "text-primary" : "text-destructive"}>
                          ${item.profit.toFixed()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                          {item.accuracy.toFixed()}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0">
                          <div className="p-5 bg-muted/20 border-t border-border/30">
                            <p className="text-sm font-semibold text-foreground mb-3">
                              ⏱️ Hourly Sales — 🥗 {item.item_name}
                            </p>
                            <div className="h-[220px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={item.chart_data}>
                                  <defs>
                                    <linearGradient id={`gradient-${item.item_name}`} x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="hsl(160 84% 39%)" stopOpacity={0.3} />
                                      <stop offset="95%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                                  <XAxis dataKey="hour" tick={ct.tick} axisLine={false} tickLine={false} />
                                  <YAxis tick={ct.tick} axisLine={false} tickLine={false} />
                                  <Tooltip {...ct.tooltip} />
                                  <Area
                                    type="monotone"
                                    dataKey="orders"
                                    stroke="hsl(160 84% 39%)"
                                    strokeWidth={2}
                                    fill={`url(#gradient-${item.item_name})`}
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="flex gap-6 mt-3 text-xs text-muted-foreground">
                              <span>
                                🔥 Peak: {item.peak_hour?.hour || item.peak_hour} —{" "}
                                {item.peak_hour?.orders ?? (item.chart_data?.find((d) => d.hour === item.peak_hour)?.orders || 0)} orders
                              </span>
                              <span>📦 Total today: {item.expected_orders} orders</span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border/60">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={p === page}
                    onClick={(e) => { e.preventDefault(); setPage(p); }}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(pageCount, p + 1)); }}
                  className={page >= pageCount ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Card>

      {/* Settings Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Forecast Settings</DialogTitle>
            <DialogDescription>Configure temperatures and events for forecasting</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Daily Settings */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Daily Forecast</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Temperature (°C)</label>
                  <Input
                    type="number"
                    value={dailyData[0]}
                    onChange={(e) => setDailyData([parseInt(e.target.value) || 0, dailyData[1]])}
                    min={0} max={50}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Event Day (0 or 1)</label>
                  <Input
                    type="number"
                    value={dailyData[1]}
                    onChange={(e) => setDailyData([dailyData[0], parseInt(e.target.value) || 0])}
                    min={0} max={1}
                  />
                </div>
              </div>
            </div>

            {/* Weekly Temperatures */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Weekly Temperatures (°C)</h4>
              <div className="grid grid-cols-7 gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                  <div key={day} className="space-y-1.5 text-center">
                    <label className="text-xs text-muted-foreground">{day}</label>
                    <Input
                      type="number"
                      value={weeklyTemperatures[i]}
                      onChange={(e) => handleTemperatureChange(i, e.target.value)}
                      min={0} max={50}
                      className="text-center px-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Events */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Weekly Events (0 or 1)</h4>
              <div className="grid grid-cols-7 gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                  <div key={day} className="space-y-1.5 text-center">
                    <label className="text-xs text-muted-foreground">{day}</label>
                    <Input
                      type="number"
                      value={weeklyEvents[i]}
                      onChange={(e) => handleEventChange(i, e.target.value)}
                      min={0} max={1}
                      className="text-center px-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => { setModalOpen(false); refetch(); }}>Apply Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
