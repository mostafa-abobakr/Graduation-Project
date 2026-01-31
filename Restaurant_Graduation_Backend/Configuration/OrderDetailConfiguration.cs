using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant_Graduation_Backend.Entites;

namespace Restaurant_Graduation_Backend.Entites
{
    public class OrderDetailConfiguration : IEntityTypeConfiguration<OrderDetail>
    {
        public void Configure(EntityTypeBuilder<OrderDetail> builder)
        {
            builder.HasKey(od => od.DetailID);

            builder.Property(od => od.Quantity)
                   .IsRequired();

            builder.Property(od => od.PriceAtOrder)
                   .HasColumnType("decimal(18,2)");

            builder.Property(e => e.ImageUrl)
                  .HasMaxLength(500)  
                  .IsRequired(false); 

            // Relations
            builder.HasOne(od => od.Order)
                   .WithMany(o => o.OrderDetails)
                   .HasForeignKey(od => od.OrderID)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(od => od.MenuItem)
                   .WithMany(m => m.OrderDetails)
                   .HasForeignKey(od => od.ItemID)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
