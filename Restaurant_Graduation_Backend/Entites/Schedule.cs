using Restaurant_Graduation_Backend.Entites;

namespace Restaurant_Graduation_Backend.Entites
{
    public class Schedule
    {
        public int ScheduleID { get; set; }
        public int EmpID { get; set; }
        public int RestID { get; set; }
        public string Day { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public string ShiftType { get; set; }


        public Employee Employee { get; set; }
        public Restaurant Restaurant { get; set; }
    }
}
