
using Grduation_Project.Data;
using Microsoft.EntityFrameworkCore;

namespace Restaurant_Gruduation
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllers();
            // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
            builder.Services.AddOpenApi();

            builder.Services.AddDbContext<RestaurantDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            // Register Services
            builder.Services.AddScoped<Restaurant_Graduation.Interfaces.IInventoryTransactionService, Restaurant_Graduation.Services.InventoryTransactionService>();
            builder.Services.AddScoped<Restaurant_Graduation.Interfaces.IAuthService, Restaurant_Graduation.Services.AuthService>();
            builder.Services.AddScoped<Restaurant_Graduation.Interfaces.IMenuItemService, Restaurant_Graduation.Services.MenuItemService>();
            builder.Services.AddScoped<Restaurant_Graduation.Interfaces.IEmployeeService, Restaurant_Graduation.Services.EmployeeService>();
            builder.Services.AddScoped<Restaurant_Graduation.Interfaces.ISettingsService, Restaurant_Graduation.Services.SettingsService>();
            
            // Register AI Engine HttpClient
            builder.Services.AddHttpClient<Restaurant_Graduation.Interfaces.IAiEngineService, Restaurant_Graduation.Services.AiEngineService>();

            var app = builder.Build();
            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
            }

            app.UseHttpsRedirection();

            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
