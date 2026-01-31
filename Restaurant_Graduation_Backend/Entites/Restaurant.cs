using Restaurant_Graduation_Backend.Entites;

namespace Restaurant_Graduation_Backend.Entites
{
    public class Restaurant
    {
        public int RestID { get; set; }
        public int UserID { get; set; }
        public string RestName { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string Phone { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }


        public User User { get; set; }
        public ICollection<Employee> Employees { get; set; }
        public ICollection<MenuItem> MenuItems { get; set; }
        public ICollection<Inventory> Inventories { get; set; }
        public ICollection<Order> Orders { get; set; }
        public ICollection<Schedule> Schedules { get; set; }
        public ICollection<Forecast> Forecasts { get; set; }

        public Restaurant()
        {
            Employees = new List<Employee>();
            MenuItems = new List<MenuItem>();
            Inventories = new List<Inventory>();
            Orders = new List<Order>();
            Schedules = new List<Schedule>();
            Forecasts = new List<Forecast>();
        }
    }
}
