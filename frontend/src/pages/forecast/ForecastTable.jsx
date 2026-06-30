import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { Search, ChevronDown, ChevronUp, Clock } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"
import { useLanguage } from "@/contexts/LanguageContext"

export default function ForecastTable({ items, alignment, isLoading }) {
  const { t, language } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  const [expandedItems, setExpandedItems] = useState({});

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const toggleItemExpansion = (itemId) => {
    setExpandedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredItems = items.filter((item) =>
    item.item_name.toLowerCase().includes(normalizedSearch),
  );
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / rowsPerPage));
  const paginatedItems = filteredItems.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  return (
    <Card className="bg-card border-border/60 premium-shadow">
      <div className="flex justify-between p-4 border-b border-border/60">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("Search items...")}
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
        <Badge
          variant="secondary"
          className="bg-primary/10 text-primary hover:bg-primary/20 pointer-events-none rounded-md px-1.5 py-0 min-w-[1.5rem] flex items-center justify-center"
        >
          {filteredItems.length} {t("items found")}
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead className="text-center">{t("Item")}</TableHead>
              <TableHead className="text-center">{t("Expected")}</TableHead>
              <TableHead className="text-center">{t("Revenue")}</TableHead>
              <TableHead className="text-center">{t("Profit")}</TableHead>
              <TableHead className="text-center">{t("Accuracy")}</TableHead>
              <TableHead className="w-10 text-center" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="p-0"
                >
                  <EmptyState
                    searchQuery={searchTerm}
                    searchItemName="items"
                    onAction={() => setSearchTerm("")}
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((item, index) => {
                const isExpanded = expandedItems[item.item_name];
                return (
                  <React.Fragment key={item.item_name}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => toggleItemExpansion(item.item_name)}
                    >
                      <TableCell className="text-muted-foreground">
                        {(page - 1) * rowsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="font-medium text-foreground text-center">
                        {item.item_name}
                      </TableCell>
                      <TableCell className="text-center text-foreground">
                        {item.expected_orders}
                      </TableCell>
                      <TableCell className="text-center text-foreground">
                        ${item.revenue}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={
                            item.profit >= 50
                              ? "text-primary"
                              : "text-destructive"
                          }
                        >
                          ${item.profit.toFixed()}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Badge
                            variant="outline"
                            className="border-primary/30 text-primary text-xs"
                          >
                            {item.accuracy.toFixed()}%
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0">
                          <div className="p-5 bg-muted/20 border-t border-border/30">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm font-semibold text-foreground">
                                {alignment === "week" ? t("⏱️ Daily Sales — 🥗 ") : t("⏱️ Hourly Sales — 🥗 ")}{item.item_name}
                              </p>
                              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mr-2">
                                <div className="w-3 h-3 rounded bg-primary shadow-sm shadow-emerald-500/20" />
                                <span>{t("Orders")}</span>
                              </div>
                            </div>
                            <div className="h-[220px]">
                              <ChartContainer
                                config={{
                                  orders: {
                                    label: t("Orders"),
                                    color: "#10b981",
                                  },
                                }}
                                className="aspect-auto h-full w-full"
                              >
                                <AreaChart
                                  data={item.chart_data}
                                  margin={{
                                    top: 10,
                                    right: 10,
                                    left: 0,
                                    bottom: alignment === "week" ? 20 : 10,
                                  }}
                                >
                                  <defs>
                                    <linearGradient
                                      id={`colorOrders-${index}`}
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="5%"
                                        stopColor="var(--color-orders)"
                                        stopOpacity={0.4}
                                      />
                                      <stop
                                        offset="95%"
                                        stopColor="var(--color-orders)"
                                        stopOpacity={0}
                                      />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid
                                    vertical={false}
                                    strokeDasharray="4 4"
                                    stroke="hsl(var(--border))"
                                    strokeOpacity={0.5}
                                  />
                                  <XAxis
                                    dataKey={
                                      alignment === "week" ? "date" : "hour"
                                    }
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{
                                      fill: "hsl(var(--muted-foreground))",
                                      fontSize: 11,
                                      fontWeight: 500,
                                    }}
                                    dy={15}
                                    angle={alignment === "week" ? -35 : 0}
                                    textAnchor={
                                      alignment === "week" ? "end" : "middle"
                                    }
                                    interval={
                                      alignment === "week"
                                        ? 0
                                        : "preserveStartEnd"
                                    }
                                    tickFormatter={(val) => {
                                      if (alignment === "week") {
                                        const d = new Date(val)
                                        return d.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
                                          month: "short",
                                          day: "numeric",
                                        })
                                      }
                                      const [h] = val.split(":").map(Number)
                                      const ampm = h >= 12 ? (language === "ar" ? "م" : "PM") : (language === "ar" ? "ص" : "AM")
                                      const h12 = h % 12 || 12
                                      return `${h12} ${ampm}`
                                    }}
                                  />
                                  <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{
                                      fill: "hsl(var(--muted-foreground))",
                                      fontSize: 12,
                                      fontWeight: 500,
                                    }}
                                    width={40}
                                  />
                                  <ChartTooltip
                                    cursor={{
                                      stroke: "hsl(var(--muted))",
                                      strokeWidth: 2,
                                      strokeDasharray: "4 4",
                                    }}
                                    content={({ active, payload, label }) => {
                                      if (!active || !payload?.length)
                                        return null
                                      let displayLabel = label
                                      if (label) {
                                        if (alignment === "week") {
                                          const dateObj = new Date(label)
                                          displayLabel = dateObj.toLocaleDateString(
                                            language === "ar" ? "ar-EG" : "en-US",
                                            {
                                              month: "short",
                                              day: "numeric",
                                            }
                                          )
                                        } else {
                                          const raw = String(label)
                                          const [h] = raw.split(":").map(Number)
                                          const ampm = h >= 12 ? (language === "ar" ? "م" : "PM") : (language === "ar" ? "ص" : "AM")
                                          const h12 = h % 12 || 12
                                          displayLabel = `${h12} ${ampm}`
                                        }
                                      }
                                      const d = payload[0].payload
                                      return (
                                        <div className="bg-popover/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-xl border border-border/50 animate-in fade-in zoom-in duration-200 min-w-[170px]">
                                          <p className="text-xs font-semibold text-muted-foreground mb-2">
                                            {displayLabel}
                                          </p>
                                          <div className="space-y-1.5">
                                            <div className="flex justify-between gap-6 items-center">
                                              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full bg-orange-500 inline-block" />
                                                {t("Orders")}
                                              </span>
                                              <span className="text-xs font-bold text-foreground">
                                                {d.orders}
                                              </span>
                                            </div>
                                            <div className="flex justify-between gap-6 items-center">
                                              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                                                {t("Revenue")}
                                              </span>
                                              <span className="text-xs font-bold text-foreground">
                                                ${d.revenue?.toLocaleString("en-US")}
                                              </span>
                                            </div>
                                            <div className="flex justify-between gap-6 items-center">
                                              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full bg-primary inline-block" />
                                                {t("Profit")}
                                              </span>
                                              <span className="text-xs font-bold text-primary">
                                                ${d.profit?.toFixed(2)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    }}
                                  />
                                  <Area
                                    type="monotone"
                                    dataKey="orders"
                                    name="Orders"
                                    stroke="var(--color-orders)"
                                    strokeWidth={3}
                                    fill={`url(#colorOrders-${index})`}
                                    animationDuration={1200}
                                    animationEasing="ease-out"
                                  />
                                </AreaChart>
                              </ChartContainer>
                             <div className="flex gap-5 mt-3 text-xs text-muted-foreground">
                               <span>
                                 {t("🔥 Peak:")}{" "}
                                 {alignment === "week"
                                   ? (() => {
                                       if (!item.peak_day?.date) return "N/A"
                                       const d = new Date(item.peak_day.date)
                                       return d.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
                                         month: "short",
                                         day: "numeric",
                                       })
                                     })()
                                   : (() => {
                                       const raw = String(
                                         item.peak_hour?.hour ||
                                           item.peak_hour ||
                                           ""
                                       )
                                       if (!raw) return "N/A"
                                       const [h] = raw.split(":").map(Number)
                                       const ampm = h >= 12 ? (language === "ar" ? "م" : "PM") : (language === "ar" ? "ص" : "AM")
                                       const h12 = h % 12 || 12
                                       return `${h12} ${ampm}`
                                     })()}{" "}
                                 —{" "}
                                 {alignment === "week"
                                   ? item.peak_day?.orders
                                   : item.peak_hour?.orders}{" "}
                                 {t("orders")}
                               </span>
                               <span>
                                 {t("📦 Total")} {alignment === "week" ? t("this week") : t("today")}:{" "}
                                 {item.expected_orders} {t("orders")}
                               </span>
                             </div>
                            </div>
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

      <div className="p-4 border-t border-border/60">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.max(1, p - 1));
                }}
                className={page <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={p === page}
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(p);
                  }}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.min(pageCount, p + 1));
                }}
                className={page >= pageCount ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </Card>
  );
}
