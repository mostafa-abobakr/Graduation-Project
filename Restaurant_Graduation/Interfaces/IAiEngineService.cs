using System.Threading.Tasks;
using Restaurant_Graduation.DTOs;

namespace Restaurant_Graduation.Interfaces
{
    public interface IAiEngineService
    {
        // Generic method to call GET endpoints
        Task<string> GetFromAiEngineAsync(string endpoint);

        // Generic method to call POST endpoints with a payload
        Task<string> PostToAiEngineAsync<T>(string endpoint, T payload);

        /// <summary>
        /// Calls the AI forecast dashboard/week endpoint, then cross-references
        /// expected menu-item orders with inventory recipes to produce a
        /// per-inventory-item consumption forecast and reorder suggestions.
        /// </summary>
        Task<InventoryForecastResponseDto> GetInventoryForecastAsync(int restId, InventoryForecastRequestDto request);
    }
}
