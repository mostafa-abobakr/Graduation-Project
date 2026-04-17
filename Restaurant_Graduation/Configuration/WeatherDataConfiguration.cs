using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant_Graduation.Entites;

namespace Restaurant_Graduation.Configuration
{
    public class WeatherDataConfiguration : IEntityTypeConfiguration<WeatherData>
    {
        public void Configure(EntityTypeBuilder<WeatherData> builder)
        {
            builder.HasKey(w => w.WeatherID);

            builder.Property(w => w.Date)
                   .IsRequired();

            builder.Property(w => w.Temperature)
                   .IsRequired();

            builder.Property(w => w.Humidity)
                   .IsRequired();

            builder.Property(w => w.RainChance)
                   .IsRequired();

            // Relations
            //--------------------------------------
            builder.HasMany(w => w.Forecasts)
                   .WithOne(f => f.WeatherData)
                   .HasForeignKey(f => f.WeatherID);
        }
    }
}
