namespace Restaurant_Graduation_Backend.Dtos
{
    public class RestaurantCreateDto
    {
        public int UserID { get; set; }  // Manager ID
        public string RestName { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string Phone { get; set; }
    }

    public class RestaurantUpdateDto
    {
        public string RestName { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string Phone { get; set; }
    }

    public class RestaurantReadDto
    {
        public int RestID { get; set; }
        public string RestName { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string Phone { get; set; }
        public string ManagerName { get; set; }
    }
}
