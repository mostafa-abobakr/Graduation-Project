using Restaurant_Graduation_Backend.Entites;

namespace Restaurant_Graduation_Backend.Entites
{
    public class MenuItem
    {
        public int ItemID { get; set; }
        public int RestID { get; set; }
        public string ItemName { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public string Category { get; set; }
        public string ImageURL { get; set; }


        public Restaurant Restaurant { get; set; }
        public ICollection<OrderDetail> OrderDetails { get; set; }
        public ICollection<InventoryMenuItem> InventoryMenuItems { get; set; }

        public MenuItem()
        {
            InventoryMenuItems = new List<InventoryMenuItem>();
            OrderDetails = new List<OrderDetail>();
        }
    }
}
