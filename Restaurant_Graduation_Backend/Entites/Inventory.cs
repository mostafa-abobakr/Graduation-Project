using Restaurant_Graduation_Backend.Entites;

namespace Restaurant_Graduation_Backend.Entites
{
    public class Inventory
    {
        public int InventoryID { get; set; }
        public int RestID { get; set; }
        public string ItemName { get; set; }
        public int Quantity { get; set; }
        public string Unit { get; set; }
        public int ReorderLevel { get; set; }
        public DateTime LastUpdated { get; set; }


        public Restaurant Restaurant { get; set; }
        public ICollection<InventoryMenuItem> InventoryMenuItems { get; set; }

        public Inventory()
        {
            InventoryMenuItems = new List<InventoryMenuItem>(); // علاقه many to many ف عملنا جدول جديد عشان نربط بينهم
        }
    }
}
