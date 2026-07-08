namespace Restaurant_Graduation.Entites
{
    public class Restaurant
    {
        public int RestID { get; set; }
        public int UserID { get; set; }
        public string RestName { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string Phone { get; set; }
        public int SeatingCapacity { get; set; } = 120;
        public string OpeningTime { get; set; } = "09:00 AM";
        public string ClosingTime { get; set; } = "11:00 PM";
        public bool EmailNotifications { get; set; } = true;
        public bool PushNotifications { get; set; } = true;
        public bool WasteAlerts { get; set; } = true;
        public bool WeeklyReport { get; set; } = true;
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
