namespace Restaurant_Graduation.Entites
{
    public class EventDate
    {
        public int EventID { get; set; }
        public string EventName { get; set; }
        public DateTime EventDateValue { get; set; }

        // Navigation
        public ICollection<Forecast> Forecasts { get; set; }

        public EventDate()
        {
            Forecasts = new List<Forecast>();
        }
    }
}
