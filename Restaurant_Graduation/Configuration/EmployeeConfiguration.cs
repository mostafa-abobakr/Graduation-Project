using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using Restaurant_Graduation.Entites;

namespace Restaurant_Graduation.Configuration
{
    public class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
    {
        public void Configure(EntityTypeBuilder<Employee> builder)
        {
            builder.HasKey(e => e.EmpID);

            builder.Property(e => e.FullName)
                   .IsRequired()
                   .HasMaxLength(100);

            builder.Property(e => e.Role)
                   .IsRequired()
                   .HasMaxLength(50);

            builder.Property(e => e.Salary)
                   .HasColumnType("decimal(18,2)");

            builder.Property(e => e.Phone)
                   .HasMaxLength(20);

            builder.Property(e => e.Status)
                   .HasMaxLength(20);

            builder.Property(e => e.Shift)
                   .HasMaxLength(20);

            builder.Property(e => e.Email)
                   .IsRequired()
                   .HasMaxLength(150);
                   
            builder.HasIndex(e => e.Email)
                   .IsUnique(); // Ensure emails are unique

            builder.Property(e => e.HashedPassword)
                   .IsRequired();

            builder.Property(e => e.HireDate)
                   .IsRequired();

            builder.Property(e => e.CreatedAt)
                   .HasDefaultValueSql("GETUTCDATE()");

            builder.Property(e => e.UpdatedAt)
                   .HasDefaultValueSql("GETUTCDATE()");

            // Relations
            //--------------------------------------
            builder.HasOne(e => e.Restaurant)
                   .WithMany(r => r.Employees)
                   .HasForeignKey(e => e.RestID)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(e => e.Schedules)
                   .WithOne(s => s.Employee)
                   .HasForeignKey(s => s.EmpID);
        }
    }
}
