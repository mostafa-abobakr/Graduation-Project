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
        public string Status { get; set; }
        public string Shift { get; set; } // Fixed typo from 'Shif'
        public int WorkingHoursPerDay { get; set; }
        public int WorkingDaysPerWeek { get; set; }
        public string Email { get; set; }
        public string HashedPassword { get; set; }
        public DateTime HireDate { get; set; }
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
