import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { getStaffColor } from "@/lib/scheduleData";

export function EmployeeList({ isVisble, employees, staffHours }) {
  return (
    <div
      className={`transition-all duration-500 ease-in-out overflow-hidden origin-right shrink-0 ml-4
        ${
          isVisble
            ? "w-full lg:w-72 max-h-[2000px] opacity-100 scale-100"
            : "w-0 lg:w-0 max-h-0 lg:max-h-[2000px] opacity-0 scale-95 !m-0"
        }
      `}
    >
      <div className="w-full lg:w-72 min-w-[280px]">
        <Card
          id="employee-list-section"
          className="bg-card border-border/60 p-5 h-fit shadow-lg shadow-background/50"
        >
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">
              Employees
            </h3>
            <p className="text-xs text-muted-foreground">
              {employees.length} total
            </p>
          </div>
          <div className="space-y-4">
            {employees.map((member) => {
              const info = staffHours[member.id];
            
              
              return (
                <div
                  key={member.id}
                  className="flex items-start gap-3 cursor-grab active:cursor-grabbing"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("employeeId", member.id.toString());
                  }}
                >
                  <div
                    className={`h-10 w-10 rounded-full ${getStaffColor(
                      member.id,
                    )} flex items-center justify-center text-white text-xs font-bold shrink-0`}
                  >
                    {member.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {member.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {member.role}  id : {member.id}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {info?.hours || 0} hrs
                      </span>
                      <span>{info?.shifts || 0} shifts</span>
                    </div>
                  </div>
                  {member.status === "on-leave" && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] shrink-0"
                    >
                      Leave
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
