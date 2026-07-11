import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useInventoryForecast } from "@/hooks/useInventory";
import { useGeocodeCity, useFetchCityWeather, useFetchHolidays } from "@/hooks/useForecast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewToggler } from "@/components/shared/ViewToggler";
import {
  AlertTriangle,
  CheckCircle2,
  PackageSearch,
  TrendingDown,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { SummaryCard } from "@/components/shared/SummaryCard";

const fmt = (n) =>
  Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function InventoryForecastPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const { user } = useAuth();

  const [alignment, setAlignment] = useState("day");
  const [dailyData, setDailyData] = useState([null, 0]);
  const [weeklyTemperatures, setWeeklyTemperatures] = useState([]);
  const [weeklyEvents, setWeeklyEvents] = useState([]);

  const cityToSearch = user?.city || user?.address || "mansoura university";
  const { data: geoData } = useGeocodeCity(cityToSearch);
  const lat = geoData && geoData.length > 0 ? parseFloat(geoData[0].lat) : null;
  const lon = geoData && geoData.length > 0 ? parseFloat(geoData[0].lon) : null;
  const { data: weatherData } = useFetchCityWeather(lat, lon);
  const currentYear = new Date().getFullYear();
  const { data: holidaysData } = useFetchHolidays("EG", currentYear);

  useEffect(() => {
    if (
      weatherData &&
      weatherData.daily?.time &&
      weatherData.daily?.temperature_2m_max
    ) {
      const maxTemps = weatherData.daily.temperature_2m_max;
      const times = weatherData.daily.time;
      if (maxTemps.length >= 7) {
        const alignedTemps = [0, 0, 0, 0, 0, 0, 0];
        const alignedEvents = [0, 0, 0, 0, 0, 0, 0];
        
        times.slice(0, 7).forEach((timeStr, idx) => {
          const [year, month, day] = timeStr.split("-").map(Number);
          const date = new Date(year, month - 1, day);
          const dayOfWeek = date.getDay();
          const uiIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          
          alignedTemps[uiIdx] = Math.round(maxTemps[idx]);
          
          if (holidaysData) {
            const isHoliday = holidaysData.some(h => h.date.iso.startsWith(timeStr));
            alignedEvents[uiIdx] = isHoliday ? 1 : 0;
          }
        });
        let firstDayHoliday = 0;
        if (holidaysData) {
          firstDayHoliday = holidaysData.some(h => h.date.iso.startsWith(times[0])) ? 1 : 0;
        }

        setWeeklyTemperatures(prev => JSON.stringify(prev) !== JSON.stringify(alignedTemps) ? alignedTemps : prev);
        setWeeklyEvents(prev => JSON.stringify(prev) !== JSON.stringify(alignedEvents) ? alignedEvents : prev);
        setDailyData(prev => 
          prev[0] !== Math.round(maxTemps[0]) || prev[1] !== firstDayHoliday 
            ? [Math.round(maxTemps[0]), firstDayHoliday] 
            : prev
        );
      }
    }
  }, [weatherData, holidaysData]);

  const { data, isPending, error } = useInventoryForecast({
    restId: user?.restId,
    alignment,
    dailyData,
    weeklyTemperatures,
    weeklyEvents,
  });

  const isWeatherReady =
    dailyData && dailyData[0] !== null && dailyData[0] !== undefined;
  const isLoading = isPending || !isWeatherReady;

  const enriched = useMemo(() => {
    if (!data?.items) return [];
    return data.items.map((r) => ({
      ...r,
      isShort: r.status === "Reorder Required",
      shortage: Math.abs(r.shortage || 0),
    }));
  }, [data]);

  const filtered = useMemo(() => {
    return enriched.filter((r) => {
      const matchesSearch = r.itemName
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "shortage"
            ? r.isShort
            : !r.isShort;
      return matchesSearch && matchesFilter;
    });
  }, [enriched, search, filter]);

  const shortageCount =
    data?.itemsShort ?? enriched.filter((r) => r.isShort).length;
  const sufficientCount = data?.sufficient ?? enriched.length - shortageCount;
  const totalShortage =
    data?.totalShortage ?? enriched.reduce((s, r) => s + r.shortage, 0);

  if (error) {
    return (
      <div className="space-y-5 py-5 animate-fade-in">
        <PageHeader
          icon={AlertTriangle}
          title="Inventory Forecast"
          description="Required vs in-stock comparison across inventory items"
        />
        <div className="p-8 text-center text-destructive bg-destructive/10 rounded-xl border border-destructive/20 mt-5">
          <h3 className="font-bold text-lg mb-2">Error Loading Forecast</h3>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 py-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          icon={AlertTriangle}
          title="Inventory Forecast"
          description="Required vs in-stock comparison across inventory items"
        />
        <div className="relative flex bg-muted/60 p-1.5 rounded-xl shadow-inner border border-border/40">
          <div
            className="absolute top-1.5 bottom-1.5 w-[calc(50%-3px)] bg-background rounded-lg shadow transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(${alignment === "day" ? "0%" : "calc(100% - 6px)"})`,
            }}
          />
          {[
            { id: "day", label: "Tomorrow" },
            { id: "week", label: "This Week" },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setAlignment(mode.id)}
              aria-pressed={alignment === mode.id}
              className={`relative z-10 px-4 py-1 text-[13px] font-bold tracking-wide capitalize transition-colors duration-200 ${
                alignment === mode.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <SummaryCard
          title="Tracked Items"
          icon={PackageSearch}
          value={isLoading ? "-" : enriched.length}
        />
        <SummaryCard
          title="Items Short"
          icon={AlertTriangle}
          iconColorClass="text-destructive"
          valueColorClass="text-destructive"
          value={isLoading ? "-" : shortageCount}
        />
        <SummaryCard
          title="Sufficient"
          icon={CheckCircle2}
          iconColorClass="text-primary"
          valueColorClass="text-primary"
          value={isLoading ? "-" : sufficientCount}
        />
        <SummaryCard
          title="Total Shortage"
          icon={TrendingDown}
          iconColorClass="text-warning"
          valueColorClass="text-warning"
          value={isLoading ? "-" : fmt(totalShortage)}
        />
      </div>

      {shortageCount > 0 && !isLoading && (
        <Card className="p-4 bg-destructive/10 border-destructive/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-foreground">
                Restock required
              </div>
              <div className="text-sm text-muted-foreground">
                {shortageCount} item{shortageCount > 1 ? "s are" : " is"} below
                the required quantity. Reorder soon to avoid service disruption.
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <Input
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <ViewToggler
          viewMode={filter}
          setViewMode={setFilter}
          modes={["all", "shortage", "ok"]}
          labels={["All", "Shortage", "Sufficient"]}
        />
      </div>

      <Card className="bg-card border-border/60 premium-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                  ID
                </th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                  Item
                </th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">
                  Required
                </th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">
                  In Stock
                </th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">
                  Shortage
                </th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">
                  Suggested Order
                </th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium w-[200px]">
                  Coverage
                </th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="border-b border-border/30">
                    <td className="py-3 px-4">
                      <Skeleton className="h-5 w-16" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-5 w-[140px]" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-5 w-20 mx-auto" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-5 w-20 mx-auto" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-5 w-20 mx-auto" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-5 w-20 mx-auto" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Skeleton className="flex-1 h-2 rounded-full" />
                        <Skeleton className="h-4 w-10" />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-6 w-24 mx-auto rounded-md" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <EmptyState
                      searchQuery={search}
                      searchItemName="items"
                      onAction={() => setSearch("")}
                      icon={PackageSearch}
                      title="No items found"
                      description={
                        enriched.length === 0
                          ? "No inventory items found for this restaurant."
                          : "No items match your filters."
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.inventoryID}
                    className={`border-b border-border/30 transition-colors ${
                      r.isShort
                        ? "bg-destructive/5 hover:bg-destructive/10"
                        : "hover:bg-muted/20"
                    }`}
                  >
                    <td className="py-3 px-4 text-muted-foreground mono">
                      #{r.inventoryID}
                    </td>
                    <td className="py-3 px-4 text-foreground font-medium">
                      {r.itemName}
                    </td>
                    <td className="py-3 px-4 text-center text-foreground mono">
                      {fmt(r.required)}
                    </td>
                    <td className="py-3 px-4 text-center text-foreground mono">
                      {fmt(r.inStock)}
                    </td>
                    <td
                      className={`py-3 px-4 text-center mono font-semibold ${
                        r.isShort ? "text-destructive" : "text-muted-foreground"
                      }`}
                    >
                      {r.isShort ? `${fmt(r.shortage)}` : "0"}
                    </td>
                    <td className="py-3 px-4 text-center text-primary font-semibold mono">
                      {fmt(r.suggestedOrderQuantity)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${r.isShort ? "bg-destructive" : "bg-primary"}`}
                            style={{ width: `${r.coveragePercentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground mono w-10 text-right">
                          {Math.round(r.coveragePercentage)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.isShort ? (
                        <Badge
                          variant="secondary"
                          className="bg-destructive/15 text-destructive border-0"
                        >
                          Shortage
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-primary/15 text-primary border-0"
                        >
                          Sufficient
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
