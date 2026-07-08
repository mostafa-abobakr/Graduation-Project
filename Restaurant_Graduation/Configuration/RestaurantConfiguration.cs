using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant_Graduation.Entites;

namespace Restaurant_Graduation.Configuration
{
    public class RestaurantConfiguration : IEntityTypeConfiguration<Restaurant>
    {
        public void Configure(EntityTypeBuilder<Restaurant> builder)
        {
            builder.HasKey(r => r.RestID);

            builder.Property(r => r.RestName)
                   .IsRequired()
                   .HasMaxLength(150);

            builder.Property(r => r.Address)
                   .HasMaxLength(200);

            builder.Property(r => r.City)
                   .HasMaxLength(50);

            builder.Property(r => r.Phone)
                   .HasMaxLength(20);

            builder.Property(r => r.SeatingCapacity)
                   .HasDefaultValue(120);

            builder.Property(r => r.OpeningTime)
                   .HasMaxLength(20)
                   .HasDefaultValue("09:00 AM");

            builder.Property(r => r.ClosingTime)
                   .HasMaxLength(20)
                   .HasDefaultValue("11:00 PM");

            builder.Property(r => r.EmailNotifications)
                   .HasDefaultValue(true);

            builder.Property(r => r.PushNotifications)
                   .HasDefaultValue(true);

            builder.Property(r => r.WasteAlerts)
                   .HasDefaultValue(true);

            builder.Property(r => r.WeeklyReport)
                   .HasDefaultValue(true);

            builder.Property(r => r.CreatedAt)
                   .HasDefaultValueSql("GETUTCDATE()");

            builder.Property(r => r.UpdatedAt)
                   .HasDefaultValueSql("GETUTCDATE()");

            // Relations
            //--------------------------------------
            builder.HasOne(r => r.User)
                   .WithMany(u => u.Restaurants)
                   .HasForeignKey(r => r.UserID)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(r => r.Employees)
                   .WithOne(e => e.Restaurant)
                   .HasForeignKey(e => e.RestID);

            builder.HasMany(r => r.MenuItems)
                   .WithOne(m => m.Restaurant)
                   .HasForeignKey(m => m.RestID);

            builder.HasMany(r => r.Inventories)
                   .WithOne(i => i.Restaurant)
                   .HasForeignKey(i => i.RestID);

            builder.HasMany(r => r.Orders)
                   .WithOne(o => o.Restaurant)
                   .HasForeignKey(o => o.RestID);

            builder.HasMany(r => r.Schedules)
                   .WithOne(s => s.Restaurant)
                   .HasForeignKey(s => s.RestID);

            builder.HasMany(r => r.Forecasts)
                   .WithOne(f => f.Restaurant)
                   .HasForeignKey(f => f.RestID);
        }

    }
}
