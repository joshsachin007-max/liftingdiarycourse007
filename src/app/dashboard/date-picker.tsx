"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// `value` is a YYYY-MM-DD calendar date; parseISO yields local midnight of that date.
// `today` is also YYYY-MM-DD, computed on the server in the user's zone, so SSR and the
// client agree on which day is highlighted regardless of each machine's own time zone.
export function DatePicker({ value, today }: { value: string; today: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const date = parseISO(value);
  const todayDate = parseISO(today);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" />}>
        {format(date, "do MMM yyyy")}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          required
          selected={date}
          defaultMonth={date}
          today={todayDate}
          captionLayout="dropdown"
          startMonth={new Date(2020, 0)}
          endMonth={new Date(todayDate.getFullYear() + 1, 11)}
          onSelect={(d) => {
            setOpen(false);
            router.push(`/dashboard?date=${format(d, "yyyy-MM-dd")}`);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
