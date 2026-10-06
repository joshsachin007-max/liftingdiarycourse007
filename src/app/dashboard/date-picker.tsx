"use client";

import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

// `value` is a YYYY-MM-DD calendar date; parseISO yields local midnight of that date.
export function DatePicker({ value }: { value: string }) {
  const router = useRouter();
  const date = parseISO(value);

  return (
    <Calendar
      mode="single"
      required
      selected={date}
      defaultMonth={date}
      captionLayout="dropdown"
      startMonth={new Date(2020, 0)}
      endMonth={new Date(new Date().getFullYear() + 1, 11)}
      onSelect={(d) => router.push(`/dashboard?date=${format(d, "yyyy-MM-dd")}`)}
    />
  );
}
