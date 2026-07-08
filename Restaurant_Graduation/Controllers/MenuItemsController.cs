using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Restaurant_Graduation.DTOs;
using Restaurant_Graduation.Interfaces;

namespace Restaurant_Graduation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MenuItemsController : ControllerBase
    {
        private readonly IMenuItemService _menuItemService;

        public MenuItemsController(IMenuItemService menuItemService)
        {
            _menuItemService = menuItemService;
        }

        private int GetRestId()
        {
            var restIdClaim = User.FindFirst("RestID")?.Value;
            return int.TryParse(restIdClaim, out var restId) ? restId : 0;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var restId = GetRestId();
            if (restId == 0) return Unauthorized();

            var result = await _menuItemService.GetAllMenuItemsAsync(restId);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var restId = GetRestId();
            if (restId == 0) return Unauthorized();

            var result = await _menuItemService.GetMenuItemByIdAsync(id, restId);
            if (result == null) return NotFound();

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] MenuItemCreateDto dto)
        {
            var restId = GetRestId();
            if (restId == 0) return Unauthorized();

            var result = await _menuItemService.CreateMenuItemAsync(restId, dto);
            return CreatedAtAction(nameof(GetById), new { id = result.ItemID }, result);
        }
    }
}
