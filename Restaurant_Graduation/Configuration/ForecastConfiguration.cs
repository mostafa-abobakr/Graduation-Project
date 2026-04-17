using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant_Graduation.Entites;

namespace Restaurant_Graduation.Configuration
{
    public class ForecastConfiguration : IEntityTypeConfiguration<Forecast>
    {
        public void Configure(EntityTypeBuilder<Forecast> builder)
        {
            builder.HasKey(f => f.ForecastID);

            builder.Property(f => f.ForecastDate)
                   .IsRequired();

            builder.Property(f => f.ExpectedOrders)
                   .IsRequired();

            builder.Property(f => f.Notes)
                   .HasMaxLength(500);

            // Relations
            //--------------------------------------
            builder.HasOne(f => f.Restaurant)
                   .WithMany(r => r.Forecasts)
                   .HasForeignKey(f => f.RestID);

            builder.HasOne(f => f.WeatherData)
                   .WithMany(w => w.Forecasts)
                   .HasForeignKey(f => f.WeatherID);

            builder.HasOne(f => f.EventDate)
                   .WithMany(e => e.Forecasts)
                   .HasForeignKey(f => f.EventID)
                   .IsRequired(false); // nullable
        }
    }
}
