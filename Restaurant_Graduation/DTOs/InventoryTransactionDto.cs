using System;

namespace Restaurant_Graduation.DTOs
{
    public class InventoryTransactionDto
    {
        public int TransactionId { get; set; }
        public int RestId { get; set; }
        public int InventoryId { get; set; }
        public int? BatchId { get; set; }
        public string TransactionType { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public DateTime TransactionDate { get; set; }
        public string Notes { get; set; }
    }
}
