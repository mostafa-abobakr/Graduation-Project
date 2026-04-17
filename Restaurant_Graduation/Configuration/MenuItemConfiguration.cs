using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using Restaurant_Graduation.Entites;

namespace Restaurant_Graduation.Configuration
{
    public class MenuItemConfiguration :  IEntityTypeConfiguration<MenuItem>
    {
        public void Configure(EntityTypeBuilder<MenuItem> builder)
        {
            builder.HasKey(m => m.ItemID);

            builder.Property(m => m.ItemName)
                   .IsRequired()
                   .HasMaxLength(100);

            builder.Property(m => m.Description)
                   .HasMaxLength(500);

            builder.Property(m => m.Price)
                   .HasColumnType("decimal(18,2)");

            builder.Property(m => m.Category)
                   .HasMaxLength(50);

            builder.Property(m => m.ImageURL)
                   .HasMaxLength(200);

            // Relations
            builder.HasOne(m => m.Restaurant)
                   .WithMany(r => r.MenuItems)
                   .HasForeignKey(m => m.RestID)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(m => m.OrderDetails)
                   .WithOne(od => od.MenuItem)
                   .HasForeignKey(od => od.ItemID)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(m => m.InventoryMenuItems)
                   .WithOne(im => im.MenuItem)
                   .HasForeignKey(im => im.MenuItemID)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
