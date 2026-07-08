using System.Threading.Tasks;
using Restaurant_Graduation.DTOs;

namespace Restaurant_Graduation.Interfaces
{
    public interface ISettingsService
    {
        Task<RestaurantSettingsDto> GetSettingsAsync(int restId);
        Task<RestaurantSettingsDto> UpdateSettingsAsync(int restId, RestaurantSettingsDto dto);
    }
}
