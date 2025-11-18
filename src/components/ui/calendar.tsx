import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { zhCN } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={zhCN}
      className={cn("p-5 bg-card rounded-lg", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-5",
        caption: "flex justify-center pt-2 relative items-center mb-4",
        caption_label: "text-lg font-bold text-foreground",
        caption_dropdowns: "flex gap-3 justify-center",
        dropdown: "px-4 py-2 text-sm font-medium rounded-lg border-2 border-border bg-background hover:bg-accent/50 hover:border-primary transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        nav: "space-x-2 flex items-center",
        nav_button: cn(
          "h-9 w-9 bg-background p-0 hover:bg-primary hover:text-primary-foreground transition-all duration-200 border-2 border-border hover:border-primary rounded-lg shadow-sm",
        ),
        nav_button_previous: "absolute left-2",
        nav_button_next: "absolute right-2",
        table: "w-full border-collapse mt-2",
        head_row: "flex mb-2",
        head_cell: "text-muted-foreground rounded-md w-11 font-bold text-xs uppercase tracking-wider",
        row: "flex w-full mt-1.5",
        cell: "h-11 w-11 text-center text-sm p-0.5 relative [&:has([aria-selected].day-range-end)]:rounded-r-lg [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg focus-within:relative focus-within:z-20",
        day: cn(
          "h-10 w-10 p-0 font-medium aria-selected:opacity-100 hover:bg-primary/10 hover:border-primary/30 transition-all duration-150 rounded-lg border-2 border-transparent"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-bold border-primary shadow-md scale-105",
        day_today: "bg-accent/50 text-accent-foreground font-bold border-2 border-primary/50 shadow-sm",
        day_outside:
          "day-outside text-muted-foreground/30 opacity-40 aria-selected:bg-accent/30 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground/20 opacity-30 cursor-not-allowed hover:bg-transparent",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-5 w-5" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-5 w-5" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
