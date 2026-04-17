using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant_Graduation.Entites;

namespace Restaurant_Graduation.Configuration
{
    public class InventoryMenuItemConfiguration : IEntityTypeConfiguration<InventoryMenuItem>
    {
        public void Configure(EntityTypeBuilder<InventoryMenuItem> builder)
        {

            builder.HasKey(im => new { im.InventoryID, im.MenuItemID });


            builder.HasOne(im => im.Inventory)
                   .WithMany(i => i.InventoryMenuItems)
                   .HasForeignKey(im => im.InventoryID)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(im => im.MenuItem)
                   .WithMany(m => m.InventoryMenuItems)
                   .HasForeignKey(im => im.MenuItemID)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
