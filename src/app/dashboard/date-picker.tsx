"use client";

import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

// `value` is a YYYY-MM-DD calendar date; parseISO yields local midnight of that date.
// `today` is also YYYY-MM-DD, computed on the server in the user's zone, so SSR and the
// client agree on which day is highlighted regardless of each machine's own time zone.
export function DatePicker({ value, today }: { value: string; today: string }) {
  const router = useRouter();
  const date = parseISO(value);
  const todayDate = parseISO(today);

  return (
    <Calendar
      mode="single"
      required
      selected={date}
      defaultMonth={date}
      today={todayDate}
      captionLayout="dropdown"
      startMonth={new Date(2020, 0)}
      endMonth={new Date(todayDate.getFullYear() + 1, 11)}
      onSelect={(d) => router.push(`/dashboard?date=${format(d, "yyyy-MM-dd")}`)}
    />
  );
}
