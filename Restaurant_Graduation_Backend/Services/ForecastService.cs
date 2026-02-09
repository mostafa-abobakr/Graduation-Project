using Microsoft.EntityFrameworkCore;
using Restaurant_Graduation_Backend.Data;
using Restaurant_Graduation_Backend.Dtos;
using Restaurant_Graduation_Backend.Entites;
using Restaurant_Graduation_Backend.Interfaces;

namespace Restaurant_Graduation_Backend.Services
{
    public class ForecastService : IForecastService
    {
        private readonly RestaurantDbContext _context;

        public ForecastService(RestaurantDbContext context)
        {
            _context = context;
        }

        public async Task<ForecastResponseDto> GetForecastAsync(int restId)
        {
            var forecasts = await _context.Forecasts
                .Where(f => f.RestID == restId)
                .ToListAsync();

            var today = DateTime.Today;
            var weekStart = today.AddDays(-(int)today.DayOfWeek);

            var summary = new ForecastSummaryDto
            {
                ExpectedOrdersToday = forecasts
                    .Where(f => f.ForecastDate.Date == today)
                    .Sum(f => f.ExpectedOrders),

                ThisWeekTotal = forecasts
                    .Where(f => f.ForecastDate >= weekStart)
                    .Sum(f => f.ExpectedOrders),

                Accuracy = 94.2 
            };

            var dailyData = forecasts
                .GroupBy(f => f.ForecastDate.DayOfWeek)
                .Select(g => new ForecastItemDto
                {
                    Label = g.Key.ToString().Substring(0, 3),
                    Orders = g.Sum(x => x.ExpectedOrders)
                })
                .ToList();

            var hourlyData = new List<ForecastItemDto>
            {
                new() { Label = "10AM", Orders = 20 },
                new() { Label = "11AM", Orders = 45 },
                new() { Label = "12PM", Orders = 80 },
                new() { Label = "1PM", Orders = 75 },
                new() { Label = "2PM", Orders = 50 },
                new() { Label = "3PM", Orders = 30 },
                new() { Label = "4PM", Orders = 40 }
            };

            
            int maxOrdersPerDay = dailyData.Any()
                ? dailyData.Max(d => d.Orders)
                : 0;

            var peakHours = new List<PeakHourDto>
            {
                new() { Time = "12-1 PM", Label = "Lunch Rush" },
                new() { Time = "7-8 PM", Label = "Dinner Peak" },
                new()
                {
                    Time = maxOrdersPerDay.ToString(),
                    Label = "Max Orders / Day"
                }
            };

            return new ForecastResponseDto
            {
                Summary = summary,
                DailyData = dailyData,
                HourlyData = hourlyData,
                PeakHours = peakHours
            };
        }
    }
}
