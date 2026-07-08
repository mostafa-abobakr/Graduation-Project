using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Restaurant_Graduation.DTOs;
using Restaurant_Graduation.Interfaces;

namespace Restaurant_Graduation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            if (string.IsNullOrEmpty(loginDto.Email) || string.IsNullOrEmpty(loginDto.Password))
            {
                return BadRequest("Email and Password are required.");
            }

            var response = await _authService.LoginAsync(loginDto);

            if (response == null)
            {
                return Unauthorized("Invalid email or password.");
            }

            return Ok(response);
        }
    }
}
