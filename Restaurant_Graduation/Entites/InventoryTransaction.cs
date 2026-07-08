using System;

namespace Restaurant_Graduation.Entites
{
    public enum TransactionType
    {
        AddBatch,
        ConsumeBatch,
        Adjustment,
        DisposeExpired
    }

    public class InventoryTransaction
    {
        public int TransactionId { get; set; }
        
        public int RestId { get; set; }
        public Restaurant Restaurant { get; set; }

        public int InventoryId { get; set; }
        
        public Inventory Inventory { get; set; }

        public int? BatchId { get; set; } 

        public TransactionType Type { get; set; }

        public int Quantity { get; set; }

        public decimal Price { get; set; }

        public DateTime TransactionDate { get; set; }

        public string Notes { get; set; }
    }
}
