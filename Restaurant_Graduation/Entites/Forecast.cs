namespace Restaurant_Graduation.Entites
{
    public class Forecast
    {
        public int ForecastID { get; set; }
        public int RestID { get; set; }
        public int WeatherID { get; set; }
        public int? EventID { get; set; } // nullable
        public DateTime ForecastDate { get; set; }
        public int ExpectedOrders { get; set; }
        public string Notes { get; set; }


        public Restaurant Restaurant { get; set; }
        public WeatherData WeatherData { get; set; }
        public EventDate EventDate { get; set; }
    }
}
