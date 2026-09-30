import { useState } from "react";
import { format, addDays, startOfWeek, isSameDay, isFriday } from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WeeklyCalendarProps {
  className?: string;
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date | undefined;
}

export function WeeklyCalendar({ className = "", onDateSelect, selectedDate: externalSelectedDate }: WeeklyCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 })); // Monday start
  const [internalSelectedDate, setInternalSelectedDate] = useState(() => {
    // Find next Friday or today if today is Friday
    const today = new Date();
    if (isFriday(today)) {
      return today;
    }
    // Find next Friday
    let nextFriday = today;
    while (!isFriday(nextFriday)) {
      nextFriday = addDays(nextFriday, 1);
    }
    return nextFriday;
  });

  const selectedDate = externalSelectedDate || internalSelectedDate;
  const setSelectedDate = (date: Date) => {
    setInternalSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Aha"];

  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7));
  };

  const goToThisWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const isToday = (date: Date) => isSameDay(date, new Date());
  const isSelected = (date: Date) => isSameDay(date, selectedDate);
  const isFridayDay = (date: Date) => isFriday(date);

  return (
    <div className={`flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-2 sm:gap-2 sm:px-4 sm:py-2.5 ${className}`}>
      {/* Navigation */}
      <div className="flex items-center gap-0.5 shrink-0 sm:gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 sm:h-8 sm:w-8"
          onClick={goToPreviousWeek}
          aria-label="Minggu sebelumnya"
        >
          <ChevronLeft size={14} className="sm:hidden" />
          <ChevronLeft size={18} className="hidden sm:block" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 sm:h-8 sm:w-8"
          onClick={goToNextWeek}
          aria-label="Minggu selanjutnya"
        >
          <ChevronRight size={14} className="sm:hidden" />
          <ChevronRight size={18} className="hidden sm:block" />
        </Button>
      </div>

      {/* Week Range */}
      <div className="hidden sm:block shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs font-semibold text-muted-foreground hover:text-primary"
          onClick={goToThisWeek}
        >
          {format(currentWeekStart, "d MMM", { locale: id })} - {format(addDays(currentWeekStart, 6), "d MMM yyyy", { locale: id })}
        </Button>
      </div>

      {/* Calendar Days */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-1 overflow-x-auto scrollbar-hide">
        {weekDays.map((date, index) => {
          const isTodayDate = isToday(date);
          const isSelectedDate = isSelected(date);
          const isFridayDate = isFridayDay(date);

          return (
            <button
              key={date.toISOString()}
              onClick={() => {
                if (isFridayDate) {
                  setSelectedDate(date);
                }
              }}
              disabled={!isFridayDate}
              className={`
                relative flex h-6 w-6 shrink-0 sm:h-9 sm:w-9 flex-col items-center justify-center rounded-md text-[10px] font-semibold transition-all sm:text-xs
                ${!isFridayDate
                  ? 'text-muted-foreground/40 cursor-not-allowed'
                  : isSelectedDate
                    ? 'bg-primary text-primary-foreground shadow-soft'
                    : isTodayDate
                      ? 'bg-sage-light text-primary border border-primary/30'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }
              `}
              aria-label={format(date, "EEEE, d MMMM yyyy", { locale: id })}
              aria-current={isTodayDate ? "date" : undefined}
              aria-pressed={isSelectedDate}
            >
              <span className="text-[8px] sm:text-[11px]">{dayNames[index]}</span>
              <span className="text-[9px] sm:text-sm">{format(date, "d")}</span>
              {isFridayDate && !isSelectedDate && (
                <span className="absolute bottom-0.5 h-0.5 w-0.5 rounded-full bg-rose sm:h-1 sm:w-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Display (Mobile) */}
      <div className="sm:hidden ml-0.5 min-w-fit shrink-0">
        <span className="text-[9px] font-semibold text-muted-foreground">
          {format(selectedDate, "d MMM", { locale: id })}
        </span>
      </div>
    </div>
  );
}
