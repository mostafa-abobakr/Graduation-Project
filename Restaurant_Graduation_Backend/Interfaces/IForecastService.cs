using Restaurant_Graduation_Backend.Dtos;
namespace Restaurant_Graduation_Backend.Interfaces
{
    public interface IForecastService
    {
        Task<ForecastResponseDto> GetForecastAsync(int restId);
    }
}
