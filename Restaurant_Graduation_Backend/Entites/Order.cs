using Restaurant_Graduation_Backend.Entites;

namespace Restaurant_Graduation_Backend.Entites
{
    public class Order
    {
        public int OrderID { get; set; }
        public int RestID { get; set; }
        public DateTime OrderTime { get; set; }
        public decimal TotalPrice { get; set; }
        public string Status { get; set; }
        public string PaymentMethod { get; set; }
        public string PaymentStatus { get; set; }
        public string CustomerName { get; set; }

       



        public Restaurant Restaurant { get; set; }
        public ICollection<OrderDetail> OrderDetails { get; set; }

        public Order()
        {
            OrderDetails = new List<OrderDetail>();
        }
    }
}
