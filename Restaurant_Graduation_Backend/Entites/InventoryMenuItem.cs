using Restaurant_Graduation_Backend.Entites;

namespace Restaurant_Graduation_Backend.Entites
{
    public class InventoryMenuItem
    {
        public int InventoryID { get; set; }
        public Inventory Inventory { get; set; }

        public int MenuItemID { get; set; }
        public MenuItem MenuItem { get; set; }
    }
}
