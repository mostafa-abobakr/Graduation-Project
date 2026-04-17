using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant_Graduation.Entites;

namespace Restaurant_Graduation.Configuration
{
    public class InventoryConfiguration : IEntityTypeConfiguration<Inventory>
    {
        public void Configure(EntityTypeBuilder<Inventory> builder)
        {
            builder.HasKey(i => i.InventoryID);

            builder.Property(i => i.ItemName)
                   .IsRequired()
                   .HasMaxLength(100);

            builder.Property(i => i.Quantity)
                   .IsRequired();

            builder.Property(i => i.Unit)
                   .HasMaxLength(20);

            builder.Property(i => i.ReorderLevel)
                   .IsRequired();

            builder.Property(i => i.LastUpdated)
                   .HasDefaultValueSql("GETUTCDATE()");

            // Relations
            builder.HasOne(i => i.Restaurant)
                   .WithMany(r => r.Inventories)
                   .HasForeignKey(i => i.RestID);

            builder.HasMany(i => i.InventoryMenuItems)
                   .WithOne(im => im.Inventory)
                   .HasForeignKey(im => im.InventoryID);
        }
    }
}
