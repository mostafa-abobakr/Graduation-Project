using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant_Graduation.Entites;

namespace Restaurant_Graduation.Configuration
{
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.HasKey(u => u.UserID);

            builder.Property(u => u.FullName)
                   .IsRequired()
                   .HasMaxLength(100);

            builder.Property(u => u.Email)
                   .IsRequired()
                   .HasMaxLength(100);

            builder.HasIndex(u => u.Email).IsUnique();

            builder.Property(u => u.HashedPassword)
                   .IsRequired()
                   .HasMaxLength(200);

            builder.Property(u => u.CreatedAt)
                   .HasDefaultValueSql("GETUTCDATE()");

            builder.Property(u => u.UpdatedAt)
                   .HasDefaultValueSql("GETUTCDATE()");

            builder.Property(u => u.Role)
                  .HasMaxLength(50) 
                  .IsRequired()
                  .HasDefaultValue("User");

            //Relation
            //---------------------------------
            builder.HasMany(u => u.Restaurants)
                   .WithOne(r => r.User)
                   .HasForeignKey(r => r.UserID)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
