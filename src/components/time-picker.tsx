import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Generate time options from 06:00 to 22:00
  const timeOptions = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(timeString);
    }
  }

  const formatTime = (time: string) => {
    if (!time) return 'Pilih waktu';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="relative">
      {label && (
        <label className="mb-1 block text-xs font-semibold">{label}</label>
      )}
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start text-left font-normal"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Clock className="mr-2 h-4 w-4" />
        {formatTime(value)}
      </Button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-md border border-border bg-card shadow-lg p-2">
          <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto">
            {timeOptions.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => {
                  onChange(time);
                  setIsOpen(false);
                }}
                className={`rounded px-2 py-1 text-xs transition-colors ${
                  value === time
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-secondary'
                }`}
              >
                {formatTime(time)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}