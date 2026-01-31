using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant_Graduation_Backend.Entites;

namespace Restaurant_Graduation_Backend.Configuration
{
    public class EventDateConfiguration : IEntityTypeConfiguration<EventDate>
    {
        public void Configure(EntityTypeBuilder<EventDate> builder)
        {
            builder.HasKey(e => e.EventID);

            builder.Property(e => e.EventName)
                   .IsRequired()
                   .HasMaxLength(100);

            builder.Property(e => e.EventDateValue)
                   .IsRequired();

            // Relations
            builder.HasMany(e => e.Forecasts)
                   .WithOne(f => f.EventDate)
                   .HasForeignKey(f => f.EventID);
        }
    }
}
