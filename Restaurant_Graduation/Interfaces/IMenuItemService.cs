using Restaurant_Graduation.DTOs;

namespace Restaurant_Graduation.Interfaces
{
    public interface IMenuItemService
    {
        Task<IEnumerable<MenuItemResponseDto>> GetAllMenuItemsAsync(int restId);
        Task<MenuItemResponseDto> GetMenuItemByIdAsync(int itemId, int restId);
        Task<MenuItemResponseDto> CreateMenuItemAsync(int restId, MenuItemCreateDto dto);
    }
}
