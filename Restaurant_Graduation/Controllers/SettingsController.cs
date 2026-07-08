using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Restaurant_Graduation.DTOs;
using Restaurant_Graduation.Interfaces;

namespace Restaurant_Graduation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SettingsController : ControllerBase
    {
        private readonly ISettingsService _settingsService;

        public SettingsController(ISettingsService settingsService)
        {
            _settingsService = settingsService;
        }

        private int GetRestId(int? restIdParam = null)
        {
            if (restIdParam.HasValue && restIdParam.Value > 0)
            {
                return restIdParam.Value;
            }
            var restIdClaim = User.FindFirst("RestID")?.Value;
            return int.TryParse(restIdClaim, out var restId) ? restId : 0;
        }

        [HttpGet]
        public async Task<IActionResult> GetSettings([FromQuery] int? restId = null)
        {
            var targetRestId = GetRestId(restId);
            if (targetRestId == 0)
            {
                return BadRequest("Restaurant ID (restId) is required.");
            }

            var settings = await _settingsService.GetSettingsAsync(targetRestId);
            if (settings == null)
            {
                return NotFound($"Restaurant settings with ID {targetRestId} not found.");
            }

            return Ok(settings);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateSettings([FromBody] RestaurantSettingsDto dto, [FromQuery] int? restId = null)
        {
            var targetRestId = GetRestId(restId);
            if (targetRestId == 0)
            {
                return BadRequest("Restaurant ID (restId) is required.");
            }

            if (dto == null)
            {
                return BadRequest("Settings data is required.");
            }

            var updatedSettings = await _settingsService.UpdateSettingsAsync(targetRestId, dto);
            if (updatedSettings == null)
            {
                return NotFound($"Restaurant with ID {targetRestId} not found.");
            }

            return Ok(updatedSettings);
        }
    }
}
