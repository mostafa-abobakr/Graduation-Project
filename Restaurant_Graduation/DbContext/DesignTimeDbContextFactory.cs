using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Grduation_Project.Data;

namespace Grduation_Project.Data
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
