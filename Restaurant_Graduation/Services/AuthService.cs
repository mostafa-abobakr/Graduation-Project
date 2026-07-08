using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Grduation_Project.Data;
using Restaurant_Graduation.DTOs;
using Restaurant_Graduation.Interfaces;

namespace Restaurant_Graduation.Services
{
    public class AuthService : IAuthService
    {
        private readonly RestaurantDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(RestaurantDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
        {
            // 1. Find employee by email
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.Email == loginDto.Email);

            if (employee == null)
            {
                return null; // or throw a custom Exception like "Invalid Credentials"
            }

            // 2. Verify Password (IMPORTANT: Use BCrypt in production)
            // Example: bool isPasswordValid = BCrypt.Net.BCrypt.Verify(loginDto.Password, employee.HashedPassword);
            bool isPasswordValid = (employee.HashedPassword == loginDto.Password); // Simulating without BCrypt

            if (!isPasswordValid)
            {
                return null;
            }

            // 3. Generate JWT Token
            var tokenHandler = new JwtSecurityTokenHandler();
            // In appsettings.json you need: "Jwt": { "Key": "Your_Super_Secret_Key_Here_123456789" }
            var keyStr = _configuration["Jwt:Key"] ?? "default_super_secret_key_make_sure_it_is_long_enough_for_sha256"; 
            var key = Encoding.ASCII.GetBytes(keyStr);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, employee.EmpID.ToString()),
                    new Claim("RestID", employee.RestID.ToString()),
                    new Claim(ClaimTypes.Role, employee.Role ?? "Employee"),
                    new Claim(ClaimTypes.Email, employee.Email)
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            // 4. Return Response
            return new AuthResponseDto
            {
                Token = tokenString,
                EmpID = employee.EmpID,
                RestID = employee.RestID,
                FullName = employee.FullName,
                Role = employee.Role
            };
        }
    }
}
