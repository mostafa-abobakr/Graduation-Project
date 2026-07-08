using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Grduation_Project.Data;
using Restaurant_Graduation.DTOs;
using Restaurant_Graduation.Interfaces;

namespace Restaurant_Graduation.Services
{
    public class SettingsService : ISettingsService
    {
        private readonly RestaurantDbContext _context;

        public SettingsService(RestaurantDbContext context)
        {
            _context = context;
        }

        public async Task<RestaurantSettingsDto> GetSettingsAsync(int restId)
        {
            var restaurant = await _context.Restaurants
                .FirstOrDefaultAsync(r => r.RestID == restId);

            if (restaurant == null) return null;

            return new RestaurantSettingsDto
            {
                RestaurantName = restaurant.RestName,
                SeatingCapacity = restaurant.SeatingCapacity,
                OpeningTime = restaurant.OpeningTime,
                ClosingTime = restaurant.ClosingTime,
                EmailNotifications = restaurant.EmailNotifications,
                PushNotifications = restaurant.PushNotifications,
                WasteAlerts = restaurant.WasteAlerts,
                WeeklyReport = restaurant.WeeklyReport
            };
        }

        public async Task<RestaurantSettingsDto> UpdateSettingsAsync(int restId, RestaurantSettingsDto dto)
        {
            var restaurant = await _context.Restaurants
                .FirstOrDefaultAsync(r => r.RestID == restId);

            if (restaurant == null) return null;

            // Update Restaurant Details
            restaurant.RestName = dto.RestaurantName;
            restaurant.SeatingCapacity = dto.SeatingCapacity;
            restaurant.OpeningTime = dto.OpeningTime;
            restaurant.ClosingTime = dto.ClosingTime;

            // Update Notifications
            restaurant.EmailNotifications = dto.EmailNotifications;
            restaurant.PushNotifications = dto.PushNotifications;
            restaurant.WasteAlerts = dto.WasteAlerts;
            restaurant.WeeklyReport = dto.WeeklyReport;

            restaurant.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new RestaurantSettingsDto
            {
                RestaurantName = restaurant.RestName,
                SeatingCapacity = restaurant.SeatingCapacity,
                OpeningTime = restaurant.OpeningTime,
                ClosingTime = restaurant.ClosingTime,
                EmailNotifications = restaurant.EmailNotifications,
                PushNotifications = restaurant.PushNotifications,
                WasteAlerts = restaurant.WasteAlerts,
                WeeklyReport = restaurant.WeeklyReport
            };
        }
    }
}
