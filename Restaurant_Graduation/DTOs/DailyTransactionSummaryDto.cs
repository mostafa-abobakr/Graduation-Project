using System;

namespace Restaurant_Graduation.DTOs
{
    public class DailyTransactionSummaryDto
    {
        public int RestId { get; set; }
        public int InventoryId { get; set; }
        public string ItemName { get; set; }
        public int TotalQuantityAdded { get; set; }
        public int TotalQuantityConsumed { get; set; }
        public decimal TotalCost { get; set; }
        public DateTime Date { get; set; }
    }
}
