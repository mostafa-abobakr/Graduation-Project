import { staffMembers } from "./mockData";

export function getWeekDates(baseDate) {
  const end = new Date(baseDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(end);
    d.setDate(end.getDate() - (6 - i));
    return d;
  });
}

export function formatShortDate(date) {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function formatWeekRange(dates) {
  const opts = { month: "short", day: "numeric", year: "numeric" };
  return `${dates[0].toLocaleDateString("en-US", opts)} - ${dates[6].toLocaleDateString("en-US", opts)}`;
}

const shiftTemplates = [
  { start: "9:00 am", end: "2:00 pm" },
  { start: "10:00 am", end: "5:00 pm" },
  { start: "8:00 am", end: "12:00 pm" },
  { start: "2:00 pm", end: "8:00 pm" },
  { start: "11:00 am", end: "5:00 pm" },
  { start: "12:00 pm", end: "7:00 pm" },
  { start: "3:00 pm", end: "9:00 pm" },
  { start: "2:00 pm", end: "8:00 pm" },
];

export const mockShifts = [];
let shiftId = 1;

// Generate data across a 4-month span (-30 days to +90 days)
const today = new Date();
const startDate = new Date(today);
startDate.setDate(today.getDate() - 30);

for (let i = 0; i < 120; i++) {
  const currentDate = new Date(startDate);
  currentDate.setDate(startDate.getDate() + i);
  // Get local date string YYYY-MM-DD
  const dateString = new Date(currentDate.getTime() - (currentDate.getTimezoneOffset() * 60000))
    .toISOString()
    .split("T")[0];

  staffMembers
    .filter((s) => s.status === "active")
    .forEach((staff) => {
      // Each staff has roughly 60% chance to work on any given day
      if (Math.random() > 0.4) {
        const template = shiftTemplates[Math.floor(Math.random() * shiftTemplates.length)];
        mockShifts.push({
          id: `shift-${shiftId++}`,
          staffId: staff.id,
          staffName: staff.name,
          avatar: staff.avatar,
          date: dateString,
          startTime: template.start,
          endTime: template.end,
          confirmed: Math.random() > 0.4,
        });
      }
    });
}

export function getStaffColor(staffId) {
  const colors = [
    "bg-cyan-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500",
    "bg-rose-500", "bg-blue-500", "bg-teal-500", "bg-orange-500",
  ];
  return colors[staffId % colors.length];
}

export function getStaffColorLight(staffId) {
  const colors = [
    "bg-cyan-50 border-cyan-200 dark:bg-cyan-950/30 dark:border-cyan-800",
    "bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800",
    "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
    "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
    "bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800",
    "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
    "bg-teal-50 border-teal-200 dark:bg-teal-950/30 dark:border-teal-800",
    "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800",
  ];
  return colors[staffId % colors.length];
}
