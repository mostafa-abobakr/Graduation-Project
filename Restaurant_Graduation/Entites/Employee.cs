namespace Restaurant_Graduation.Entites
{
    public class Employee
    {
        public int EmpID { get; set; }
        public int RestID { get; set; }
        public string FullName { get; set; }
        public string Role { get; set; }
        public decimal Salary { get; set; }
        public string Phone { get; set; }
        public DateTime HireDate { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation Property = Relations 
        public Restaurant Restaurant { get; set; }
        public ICollection<Schedule> Schedules { get; set; }

        public Employee()
        {
            Schedules = new List<Schedule>(); // NullRefrenceException
        }
    }
}
