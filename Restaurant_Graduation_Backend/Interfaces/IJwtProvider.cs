using Restaurant_Graduation_Backend.Entites;

namespace Restaurant_Graduation_Backend.Interfaces
{
    public interface IJwtProvider
    {
        string GenerateToken(User user);
    }
}
