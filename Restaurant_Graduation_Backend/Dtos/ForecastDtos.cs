namespace Restaurant_Graduation_Backend.Dtos
{
    
    public class ForecastResponseDto
    {
        public ForecastSummaryDto Summary { get; set; }
        public List<ForecastItemDto> DailyData { get; set; }
        public List<ForecastItemDto> HourlyData { get; set; }
        public List<PeakHourDto> PeakHours { get; set; }
    }

   
    public class ForecastSummaryDto
    {
        public int ExpectedOrdersToday { get; set; }
        public int ThisWeekTotal { get; set; }
        public double Accuracy { get; set; }
    }

    
    public class ForecastItemDto
    {
        public string Label { get; set; }
        public int Orders { get; set; }
    }

    public class PeakHourDto
    {
        public string Time { get; set; }
        public string Label { get; set; }
    }
}
