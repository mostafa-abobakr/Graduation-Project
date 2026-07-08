using System;
using System.Collections.Generic;

namespace Restaurant_Graduation.DTOs
{
    /// <summary>
    /// The weekly forecast for a single inventory item, showing expected consumption
    /// and whether a reorder is needed.
    /// </summary>
    public class InventoryForecastItemDto
    {
        public int InventoryId { get; set; }
        public string ItemName { get; set; }
        public string Unit { get; set; }
        public int CurrentQuantity { get; set; }
        public int ReorderLevel { get; set; }
        public decimal ExpectedConsumption { get; set; }
        public decimal RemainingAfterForecast { get; set; }
        public bool NeedsReorder { get; set; }
        public decimal SuggestedOrderQuantity { get; set; }

        /// <summary>
        /// Breakdown: which menu items drive the consumption.
        /// </summary>
        public List<ConsumptionDriverDto> Drivers { get; set; } = new();
    }

    /// <summary>
    /// Shows how a single menu item contributes to the consumption of an inventory item.
    /// </summary>
    public class ConsumptionDriverDto
    {
        public string MenuItemName { get; set; }
        public int ExpectedOrders { get; set; }
        public decimal QuantityUsedPerOrder { get; set; }
        public decimal TotalConsumption { get; set; }
    }

    /// <summary>
    /// Full inventory forecast response wrapping all items.
    /// </summary>
    public class InventoryForecastResponseDto
    {
        public int RestId { get; set; }
        public DateTime GeneratedAt { get; set; }
        public double OverallModelAccuracy { get; set; }
        public int TotalExpectedOrders { get; set; }
        public int ItemsNeedingReorder { get; set; }
        public List<InventoryForecastItemDto> Items { get; set; } = new();
    }

    /// <summary>
    /// Request body sent to backend — mirrors the AI engine's WeeklyDashboardRequest.
    /// </summary>
    public class InventoryForecastRequestDto
    {
        public List<double> WeeklyTemperatures { get; set; } = new() { 25, 25, 25, 25, 25, 25, 25 };
        public List<int> WeeklyEvents { get; set; } = new() { 0, 0, 0, 0, 0, 0, 0 };
    }
}
