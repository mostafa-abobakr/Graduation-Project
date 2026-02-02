
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Restaurant_Graduation_Backend.Data;
using Restaurant_Graduation_Backend.Helpers;    // PasswordHasher
using Restaurant_Graduation_Backend.Services;   // AuthService & IAuthService
using Restaurant_Graduation_Backend.Interfaces;  // JwtProvider & IJwtProvider
using Restaurant_Graduation_Backend.Providers;
using System.Reflection;
using Restaurant_Graduation_Backend.Services.Interfaces;

namespace Restaurant_Graduation_Backend
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // ----------------------------
            // Add services to the container
            // ----------------------------
            builder.Services.AddControllers();

            // OpenAPI / Swagger
            
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // DbContext
            builder.Services.AddDbContext<RestaurantDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            // Auth & JWT
            builder.Services.AddScoped<IJwtProvider, JwtProvider>();
            builder.Services.AddScoped<IAuthService, AuthService>();
            builder.Services.AddScoped<IRestaurantService, RestaurantService>();

            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = builder.Configuration["Jwt:Issuer"],
                        ValidAudience = builder.Configuration["Jwt:Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"])
                        )
                    };
                });

            var app = builder.Build();

            // ----------------------------
            // Configure the HTTP request pipeline
            // ----------------------------
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            // **Authentication must come before Authorization**
            app.UseAuthentication();
            app.UseAuthorization();
            try
            {
                app.MapControllers();
            }
            catch (ReflectionTypeLoadException ex)
            {
                foreach (var le in ex.LoaderExceptions)
                {
                    Console.WriteLine("Loader Exception: " + le.Message);
                }

                foreach (var t in ex.Types)
                {
                    if (t == null)
                        Console.WriteLine("Could not load type: null");
                    else
                        Console.WriteLine("Loaded type: " + t.FullName);
                }

                throw;
            }


            app.Run();
        }           

    }
}
