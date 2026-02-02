using Restaurant_Graduation_Backend.Data;
using Restaurant_Graduation_Backend.Dtos;
using Restaurant_Graduation_Backend.Entites;
using Restaurant_Graduation_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Restaurant_Graduation_Backend.Services
{
    public class RestaurantService : IRestaurantService
    {
        private readonly RestaurantDbContext _context;

        public RestaurantService(RestaurantDbContext context)
        {
            _context = context;
        }

        // Get all restaurants with manager name
        public IEnumerable<RestaurantReadDto> GetAll()
        {
            return _context.Restaurants
                .Include(r => r.User) // Include manager
                .Select(r => new RestaurantReadDto
                {
                    RestID = r.RestID,
                    RestName = r.RestName,
                    Address = r.Address,
                    City = r.City,
                    Phone = r.Phone,
                    ManagerName = r.User != null ? r.User.FullName : null
                }).ToList();
        }

        // Get a single restaurant by ID with manager
        public RestaurantReadDto GetById(int id)
        {
            var r = _context.Restaurants
                .Include(r => r.User) // Include manager
                .FirstOrDefault(r => r.RestID == id);

            if (r == null) return null;

            return new RestaurantReadDto
            {
                RestID = r.RestID,
                RestName = r.RestName,
                Address = r.Address,
                City = r.City,
                Phone = r.Phone,
                ManagerName = r.User?.FullName
            };
        }

        // Create a new restaurant and return it with manager
        public RestaurantReadDto Create(RestaurantCreateDto dto)
        {
            var restaurant = new Restaurant
            {
                UserID = dto.UserID, // Manager ID
                RestName = dto.RestName,
                Address = dto.Address,
                City = dto.City,
                Phone = dto.Phone,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.Restaurants.Add(restaurant);
            _context.SaveChanges();

            // Load the created restaurant with manager
            var createdRestaurant = _context.Restaurants
                .Include(r => r.User)
                .FirstOrDefault(r => r.RestID == restaurant.RestID);

            return new RestaurantReadDto
            {
                RestID = createdRestaurant.RestID,
                RestName = createdRestaurant.RestName,
                Address = createdRestaurant.Address,
                City = createdRestaurant.City,
                Phone = createdRestaurant.Phone,
                ManagerName = createdRestaurant.User?.FullName
            };
        }

        // Update an existing restaurant
        public void Update(int id, RestaurantUpdateDto dto)
        {
            var restaurant = _context.Restaurants.Find(id);
            if (restaurant == null) throw new Exception("Restaurant not found");

            restaurant.RestName = dto.RestName;
            restaurant.Address = dto.Address;
            restaurant.City = dto.City;
            restaurant.Phone = dto.Phone;
            restaurant.UpdatedAt = DateTime.Now;

            _context.SaveChanges();
        }

        // Delete a restaurant
        public void Delete(int id)
        {
            var restaurant = _context.Restaurants.Find(id);
            if (restaurant == null) throw new Exception("Restaurant not found");

            _context.Restaurants.Remove(restaurant);
            _context.SaveChanges();
        }
    }
}
