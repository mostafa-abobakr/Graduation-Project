using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Grduation_Project.Data;
using Restaurant_Graduation.DTOs;
using Restaurant_Graduation.Interfaces;

namespace Restaurant_Graduation.Services
{
    public class AiEngineService : IAiEngineService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly RestaurantDbContext _context;

        private static readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNameCaseInsensitive = true,
            NumberHandling = JsonNumberHandling.AllowReadingFromString
        };

        public AiEngineService(HttpClient httpClient, IConfiguration configuration, RestaurantDbContext context)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _context = context;

            // Set Base URL from appsettings.json
            var baseUrl = _configuration["AiEngine:BaseUrl"];
            if (!string.IsNullOrEmpty(baseUrl))
            {
                _httpClient.BaseAddress = new Uri(baseUrl);
            }
            else
            {
                // Fallback just in case
                _httpClient.BaseAddress = new Uri("https://youseef-awaad-zerobite-ai-engine.hf.space");
            }
        }

        public async Task<string> GetFromAiEngineAsync(string endpoint)
        {
            var response = await _httpClient.GetAsync(endpoint);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> PostToAiEngineAsync<T>(string endpoint, T payload)
        {
            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(endpoint, content);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        /// <inheritdoc />
        public async Task<InventoryForecastResponseDto> GetInventoryForecastAsync(
            int restId, InventoryForecastRequestDto request)
        {
            // 1. Call the AI engine's weekly dashboard forecast
            var aiPayload = new
            {
                weekly_temperatures = request.WeeklyTemperatures,
                weekly_events = request.WeeklyEvents
            };

            var forecastJson = await PostToAiEngineAsync(
                $"/forecast/dashboard/week/{restId}", aiPayload);

            var forecast = JsonSerializer.Deserialize<AiForecastDashboardWeekResponse>(
                forecastJson, _jsonOptions);

            // 2. Load all inventory items and their menu-item recipes for this restaurant
            var inventories = await _context.Inventories
                .Where(i => i.RestID == restId)
                .Include(i => i.InventoryMenuItems)
                    .ThenInclude(im => im.MenuItem)
                .ToListAsync();

            // 3. Build a lookup: menu item name → expected orders from AI
            var expectedOrdersByItem = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            if (forecast?.Items != null)
            {
                foreach (var item in forecast.Items)
                {
                    if (!string.IsNullOrEmpty(item.ItemName))
                        expectedOrdersByItem[item.ItemName] = item.ExpectedOrders;
                }
            }

            // 4. For each inventory item, calculate expected consumption
            var forecastItems = new List<InventoryForecastItemDto>();

            foreach (var inv in inventories)
            {
                var drivers = new List<ConsumptionDriverDto>();
                decimal totalConsumption = 0;

                foreach (var recipe in inv.InventoryMenuItems)
                {
                    var menuItemName = recipe.MenuItem?.ItemName;
                    if (menuItemName == null) continue;

                    if (expectedOrdersByItem.TryGetValue(menuItemName, out var expectedOrders)
                        && expectedOrders > 0)
                    {
                        var consumption = recipe.QuantityUsed * expectedOrders;
                        totalConsumption += consumption;

                        drivers.Add(new ConsumptionDriverDto
                        {
                            MenuItemName = menuItemName,
                            ExpectedOrders = expectedOrders,
                            QuantityUsedPerOrder = recipe.QuantityUsed,
                            TotalConsumption = consumption
                        });
                    }
                }

                var remaining = inv.Quantity - totalConsumption;
                var needsReorder = remaining <= inv.ReorderLevel;

                // Suggest ordering enough to reach 2× reorder level above expected consumption
                var suggestedQty = needsReorder
                    ? Math.Max(0, totalConsumption + (inv.ReorderLevel * 2) - inv.Quantity)
                    : 0;

                forecastItems.Add(new InventoryForecastItemDto
                {
                    InventoryId = inv.InventoryID,
                    ItemName = inv.ItemName,
                    Unit = inv.Unit,
                    CurrentQuantity = inv.Quantity,
                    ReorderLevel = inv.ReorderLevel,
                    ExpectedConsumption = totalConsumption,
                    RemainingAfterForecast = remaining,
                    NeedsReorder = needsReorder,
                    SuggestedOrderQuantity = Math.Ceiling(suggestedQty),
                    Drivers = drivers
                });
            }

            return new InventoryForecastResponseDto
            {
                RestId = restId,
                GeneratedAt = DateTime.UtcNow,
                OverallModelAccuracy = forecast?.OverallAccuracy ?? 0,
                TotalExpectedOrders = forecast?.TotalOrders ?? 0,
                ItemsNeedingReorder = forecastItems.Count(f => f.NeedsReorder),
                Items = forecastItems
                    .OrderByDescending(f => f.NeedsReorder)
                    .ThenByDescending(f => f.ExpectedConsumption)
                    .ToList()
            };
        }

        // ── Internal models to deserialize the AI engine response ──

        private class AiForecastDashboardWeekResponse
        {
            [JsonPropertyName("overall_accuracy")]
            public double OverallAccuracy { get; set; }

            [JsonPropertyName("total_revenue")]
            public decimal TotalRevenue { get; set; }

            [JsonPropertyName("total_profit")]
            public decimal TotalProfit { get; set; }

            [JsonPropertyName("total_orders")]
            public int TotalOrders { get; set; }

            [JsonPropertyName("items")]
            public List<AiForecastItemResponse> Items { get; set; }
        }

        private class AiForecastItemResponse
        {
            [JsonPropertyName("item_name")]
            public string ItemName { get; set; }

            [JsonPropertyName("expected_orders")]
            public int ExpectedOrders { get; set; }

            [JsonPropertyName("revenue")]
            public decimal Revenue { get; set; }

            [JsonPropertyName("profit")]
            public decimal Profit { get; set; }

            [JsonPropertyName("accuracy")]
            public double Accuracy { get; set; }
        }
    }
}
