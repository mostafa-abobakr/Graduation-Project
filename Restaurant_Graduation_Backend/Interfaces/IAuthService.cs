using Restaurant_Graduation_Backend.Dtos;

namespace Restaurant_Graduation_Backend.Interfaces
{
    public interface IAuthService
    {
        Task<string> RegisterAsync(RegisterDto dto);
        Task<object?> LoginAsync(LoginDto dto);
    }
}
