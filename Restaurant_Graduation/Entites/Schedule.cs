namespace Restaurant_Graduation.Entites
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

        public string Source { get; set; } = "AI";
        public bool IsOverridden { get; set; } = false;
        public DateTime? UpdatedAt { get; set; }

        public Employee Employee { get; set; }
        public Restaurant Restaurant { get; set; }
    }
}
