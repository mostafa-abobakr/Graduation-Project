using Microsoft.EntityFrameworkCore;
using Restaurant_Graduation_Backend.Data;
using Restaurant_Graduation_Backend.Dtos;
using Restaurant_Graduation_Backend.Entites;
using Restaurant_Graduation_Backend.Interfaces;
using Restaurant_Graduation_Backend.Helpers;

namespace Restaurant_Graduation_Backend.Services
{
    public class AuthService : IAuthService
    {
        private readonly RestaurantDbContext _context;
        private readonly IJwtProvider _jwtProvider;

        public AuthService(RestaurantDbContext context, IJwtProvider jwtProvider)
        {
            _context = context;
            _jwtProvider = jwtProvider;
        }

        public async Task<string> RegisterAsync(RegisterDto dto)
        {
            if (await _context.Users.AnyAsync(x => x.Email == dto.Email))
                return "Email already exists";

            if (await _context.Users.AnyAsync(x => x.Phone == dto.Phone))
                return "Phone already exists";

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                Phone = dto.Phone,
                HashedPassword = PasswordHasher.HashPassword(dto.Password),
                Role = "Manager", // أو "User" حسب اختيارك
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return "Registered Successfully";
        }

        public async Task<object?> LoginAsync(LoginDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(x => x.Email == dto.Email);
            if (user == null)
                return null;

            var hashed = PasswordHasher.HashPassword(dto.Password);

            if (user.HashedPassword != hashed)
                return null;

            var token = _jwtProvider.GenerateToken(user);

            return new
            {
                token,
                user.UserID,
                user.FullName,
                user.Email,
                user.Phone,
                user.Role
            };
        }
    }
}
