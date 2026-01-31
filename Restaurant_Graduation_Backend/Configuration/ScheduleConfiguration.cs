using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant_Graduation_Backend.Entites;

namespace Restaurant_Graduation_Backend.Entites
{
    public class ScheduleConfiguration : IEntityTypeConfiguration<Schedule>
    {
        public void Configure(EntityTypeBuilder<Schedule> builder)
        {
            builder.HasKey(s => s.ScheduleID);

            builder.Property(s => s.Day)
                   .IsRequired()
                   .HasMaxLength(20);

            builder.Property(s => s.ShiftType)
                   .HasMaxLength(20);

            builder.Property(s => s.StartTime)
                   .IsRequired();

            builder.Property(s => s.EndTime)
                   .IsRequired();

            // Relations
            //--------------------------------------
            builder.HasOne(s => s.Employee)
                  .WithMany(e => e.Schedules)
                  .HasForeignKey(s => s.EmpID)
                  .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(s => s.Restaurant)
                   .WithMany(r => r.Schedules)
                   .HasForeignKey(s => s.RestID)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
