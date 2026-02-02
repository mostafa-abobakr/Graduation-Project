using Restaurant_Graduation_Backend.Dtos;

namespace Restaurant_Graduation_Backend.Services.Interfaces
{
    public interface IRestaurantService
    {
        IEnumerable<RestaurantReadDto> GetAll();
        RestaurantReadDto GetById(int id);
        RestaurantReadDto Create(RestaurantCreateDto dto);
        void Update(int id, RestaurantUpdateDto dto);
        void Delete(int id);
    }
}
