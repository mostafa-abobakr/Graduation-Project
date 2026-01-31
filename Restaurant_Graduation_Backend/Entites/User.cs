using Restaurant_Graduation_Backend.Entites;

namespace Restaurant_Graduation_Backend.Entites
{
    public class User
    {
        public int UserID { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string HashedPassword { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string Role { get; set; }
        public ICollection<Restaurant> Restaurants { get; set; }

        public User()
        {
            Restaurants = new List<Restaurant>();
        }
    }
}
