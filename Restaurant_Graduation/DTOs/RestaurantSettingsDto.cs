namespace Restaurant_Graduation.DTOs
{
    public class RestaurantSettingsDto
    {
        public string RestaurantName { get; set; }
        public int SeatingCapacity { get; set; }
        public string OpeningTime { get; set; }
        public string ClosingTime { get; set; }
        public bool EmailNotifications { get; set; }
        public bool PushNotifications { get; set; }
        public bool WasteAlerts { get; set; }
        public bool WeeklyReport { get; set; }
    }
}
