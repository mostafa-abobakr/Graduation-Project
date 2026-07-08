namespace Restaurant_Graduation.DTOs
{
    public class AuthResponseDto
    {
        public string Token { get; set; }
        public int EmpID { get; set; }
        public int RestID { get; set; }
        public string FullName { get; set; }
        public string Role { get; set; }
    }
}
