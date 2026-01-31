using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Restaurant_Graduation_Backend.Data;

namespace Restaurant_Graduation_Backend.Data
{
    public class RestaurantDbContextFactory : IDesignTimeDbContextFactory<RestaurantDbContext>
    {
        public RestaurantDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<RestaurantDbContext>();
            optionsBuilder.UseSqlServer("Server=.;Database=RestaurantAI;Trusted_Connection=True;TrustServerCertificate=True;");

            return new RestaurantDbContext(optionsBuilder.Options);
        }
    }
}
