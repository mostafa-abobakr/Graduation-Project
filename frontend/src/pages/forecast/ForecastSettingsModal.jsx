import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ForecastSettingsModal({
  open,
  onOpenChange,
  dailyData,
  setDailyData,
  weeklyTemperatures,
  setWeeklyTemperatures,
  weeklyEvents,
  setWeeklyEvents,
  onApply
}) {
  const handleTemperatureChange = (index, value) => {
    const newTemps = [...weeklyTemperatures];
    newTemps[index] = parseInt(value) || 0;
    setWeeklyTemperatures(newTemps);
  };

  const handleEventChange = (index, value) => {
    const newEvents = [...weeklyEvents];
    newEvents[index] = parseInt(value) || 0;
    setWeeklyEvents(newEvents);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Forecast Settings</DialogTitle>
          <DialogDescription>
            Configure temperatures and events for forecasting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Daily Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              Daily Forecast
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Temperature (°C)
                </label>
                <Input
                  type="number"
                  value={dailyData[0]}
                  onChange={(e) =>
                    setDailyData([parseInt(e.target.value) || 0, dailyData[1]])
                  }
                  min={0}
                  max={50}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Event Day (0 or 1)
                </label>
                <Input
                  type="number"
                  value={dailyData[1]}
                  onChange={(e) =>
                    setDailyData([dailyData[0], parseInt(e.target.value) || 0])
                  }
                  min={0}
                  max={1}
                />
              </div>
            </div>
          </div>

          {/* Weekly Temperatures */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              Weekly Temperatures (°C)
            </h4>
            <div className="grid grid-cols-7 gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                <div key={day} className="space-y-1.5 text-center">
                  <label className="text-xs text-muted-foreground">{day}</label>
                  <Input
                    type="number"
                    value={weeklyTemperatures[i]}
                    onChange={(e) => handleTemperatureChange(i, e.target.value)}
                    min={0}
                    max={50}
                    className="text-center px-1"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Events */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              Weekly Events (0 or 1)
            </h4>
            <div className="grid grid-cols-7 gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                <div key={day} className="space-y-1.5 text-center">
                  <label className="text-xs text-muted-foreground">{day}</label>
                  <Input
                    type="number"
                    value={weeklyEvents[i]}
                    onChange={(e) => handleEventChange(i, e.target.value)}
                    min={0}
                    max={1}
                    className="text-center px-1"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              onApply();
            }}
          >
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
