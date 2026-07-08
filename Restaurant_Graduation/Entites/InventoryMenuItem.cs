namespace Restaurant_Graduation.Entites
{
    public class InventoryMenuItem
    {
        public int InventoryID { get; set; }
        public Inventory Inventory { get; set; }

        public int MenuItemID { get; set; }
        public MenuItem MenuItem { get; set; }

        public decimal QuantityUsed { get; set; }
    }
}
