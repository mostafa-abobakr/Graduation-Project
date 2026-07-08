using Microsoft.EntityFrameworkCore;
using Grduation_Project.Data;
using Restaurant_Graduation.DTOs;
using Restaurant_Graduation.Entites;
using Restaurant_Graduation.Interfaces;

namespace Restaurant_Graduation.Services
{
    public class MenuItemService : IMenuItemService
    {
        private readonly RestaurantDbContext _context;

        public MenuItemService(RestaurantDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<MenuItemResponseDto>> GetAllMenuItemsAsync(int restId)
        {
            var menuItems = await _context.MenuItems
                .Include(m => m.InventoryMenuItems)
                    .ThenInclude(im => im.Inventory)
                .Where(m => m.RestID == restId)
                .ToListAsync();

            return menuItems.Select(MapToResponseDto);
        }

        public async Task<MenuItemResponseDto> GetMenuItemByIdAsync(int itemId, int restId)
        {
            var menuItem = await _context.MenuItems
                .Include(m => m.InventoryMenuItems)
                    .ThenInclude(im => im.Inventory)
                .FirstOrDefaultAsync(m => m.ItemID == itemId && m.RestID == restId);

            if (menuItem == null) return null;

            return MapToResponseDto(menuItem);
        }

        public async Task<MenuItemResponseDto> CreateMenuItemAsync(int restId, MenuItemCreateDto dto)
        {
            var menuItem = new MenuItem
            {
                RestID = restId,
                ItemName = dto.ItemName,
                Description = dto.Description,
                Price = dto.Price,
                Category = dto.Category,
                ImageURL = dto.ImageURL,
            };

            foreach (var ing in dto.Ingredients)
            {
                menuItem.InventoryMenuItems.Add(new InventoryMenuItem
                {
                    InventoryID = ing.InventoryID,
                    QuantityUsed = ing.QuantityUsed
                });
            }

            _context.MenuItems.Add(menuItem);
            await _context.SaveChangesAsync();

            return await GetMenuItemByIdAsync(menuItem.ItemID, restId);
        }

        private MenuItemResponseDto MapToResponseDto(MenuItem menuItem)
        {
            // TODO: In the future, calculate actual cost based on Inventory Batch Costs
            decimal cost = 0; 
            
            var margin = menuItem.Price > 0 ? ((menuItem.Price - cost) / menuItem.Price) * 100 : 0;

            return new MenuItemResponseDto
            {
                ItemID = menuItem.ItemID,
                RestID = menuItem.RestID,
                ItemName = menuItem.ItemName,
                Description = menuItem.Description,
                Price = menuItem.Price,
                Cost = cost,
                Margin = Math.Round(margin, 2),
                Category = menuItem.Category,
                ImageURL = menuItem.ImageURL,
                Ingredients = menuItem.InventoryMenuItems.Select(im => new MenuItemIngredientDto
                {
                    InventoryID = im.InventoryID,
                    ItemName = im.Inventory?.ItemName,
                    Unit = im.Inventory?.Unit,
                    QuantityUsed = im.QuantityUsed
                }).ToList()
            };
        }
    }
}
