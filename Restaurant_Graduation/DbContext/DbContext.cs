using Microsoft.EntityFrameworkCore;

using Restaurant_Graduation.Entites;

namespace Grduation_Project.Data
{
    public class RestaurantDbContext : DbContext
    {
        public RestaurantDbContext(DbContextOptions<RestaurantDbContext> options)
            : base(options)
        {
        }

        // DbSets
        public DbSet<User> Users { get; set; }
        public DbSet<Restaurant> Restaurants { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Schedule> Schedules { get; set; }
        public DbSet<MenuItem> MenuItems { get; set; }
        public DbSet<WeatherData> WeatherDatas { get; set; }
        public DbSet<Forecast> Forecasts { get; set; }
        public DbSet<Inventory> Inventories { get; set; }
        public DbSet<InventoryMenuItem> InventoryMenuItems { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderDetail> OrderDetails { get; set; }
        public DbSet<EventDate> Events { get; set; }
        public DbSet<InventoryTransaction> InventoryTransactions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Apply all configurations
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(RestaurantDbContext).Assembly);

            base.OnModelCreating(modelBuilder);
        }
    }
}
