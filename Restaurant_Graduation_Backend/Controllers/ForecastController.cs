using Microsoft.AspNetCore.Mvc;
using Restaurant_Graduation_Backend.Interfaces;

namespace Restaurant_Graduation_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ForecastController : ControllerBase
    {
        private readonly IForecastService _forecastService;

        public ForecastController(IForecastService forecastService)
        {
            _forecastService = forecastService;
        }

        [HttpGet("{restId}")]
        public async Task<IActionResult> GetForecast(int restId)
        {
            var result = await _forecastService.GetForecastAsync(restId);
            return Ok(result);
        }
    }
}
