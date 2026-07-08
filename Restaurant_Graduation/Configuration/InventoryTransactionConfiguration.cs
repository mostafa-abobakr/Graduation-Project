using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant_Graduation.Entites;

namespace Restaurant_Graduation.Configuration
{
    public class InventoryTransactionConfiguration : IEntityTypeConfiguration<InventoryTransaction>
    {
        public void Configure(EntityTypeBuilder<InventoryTransaction> builder)
        {
            builder.HasKey(t => t.TransactionId);

            builder.Property(t => t.Price)
                   .HasColumnType("decimal(18,2)");

            builder.HasOne(t => t.Inventory)
                   .WithMany()
                   .HasForeignKey(t => t.InventoryId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
