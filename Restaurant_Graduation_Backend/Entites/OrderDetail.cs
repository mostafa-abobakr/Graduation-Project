using Restaurant_Graduation_Backend.Entites;

namespace Restaurant_Graduation_Backend.Entites
{
    public class OrderDetail
    {
        public int DetailID { get; set; }
        public int OrderID { get; set; }
        public int ItemID { get; set; }
        public int Quantity { get; set; }
        public decimal PriceAtOrder { get; set; }
        public string ImageUrl { get; set; }

        public Order Order { get; set; }
        public MenuItem MenuItem { get; set; }
    }
}
