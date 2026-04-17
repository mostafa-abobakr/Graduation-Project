namespace Restaurant_Graduation.Entites
{
    public class WeatherData
    {
        public int WeatherID { get; set; }
        public DateTime Date { get; set; }
        public float Temperature { get; set; }
        public float Humidity { get; set; }
        public float RainChance { get; set; }

        // Navigation
        public ICollection<Forecast> Forecasts { get; set; }

        public WeatherData()
        {
            Forecasts = new List<Forecast>();
        }
    }
}
