using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant_Graduation_Backend.Entites;

namespace Restaurant_Graduation_Backend.Entites
{
    public class OrderConfiguration : IEntityTypeConfiguration<Order>
    {
        public void Configure(EntityTypeBuilder<Order> builder)
        {
            builder.HasKey(o => o.OrderID);

            builder.Property(o => o.TotalPrice)
                   .HasColumnType("decimal(18,2)");

            builder.Property(o => o.Status)
                   .HasMaxLength(20);

            builder.Property(o => o.PaymentMethod)
                   .HasMaxLength(20);

            builder.Property(o => o.PaymentStatus)
                   .HasMaxLength(20);

            builder.Property(o => o.CustomerName)
                   .HasMaxLength(100);


            // Relations
            //--------------------------------------
            builder.HasOne(o => o.Restaurant)
                 .WithMany(r => r.Orders)
                 .HasForeignKey(o => o.RestID)
                 .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(o => o.OrderDetails)
                   .WithOne(od => od.Order)
                   .HasForeignKey(od => od.OrderID)
                   .OnDelete(DeleteBehavior.Restrict);

        }
    }
}
