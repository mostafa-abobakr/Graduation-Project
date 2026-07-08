using System.Threading.Tasks;
using Restaurant_Graduation.DTOs;

namespace Restaurant_Graduation.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
    }
}
