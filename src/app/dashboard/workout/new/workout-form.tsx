"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createWorkoutAction } from "./actions";

// `date` is a YYYY-MM-DD calendar date; `time` is HH:mm. Both are in the browser's local zone.
export function WorkoutForm({ date, time }: { date: string; time: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "");
    const day = String(form.get("date") ?? "");
    const startTime = String(form.get("time") ?? "");
    const startedAt = new Date(`${day}T${startTime}`);

    setError(null);
    startTransition(async () => {
      const result = await createWorkoutAction({ name, startedAt });
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/dashboard?date=${day}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Push day"
          maxLength={100}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" defaultValue={date} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="time">Start time</Label>
          <Input id="time" name="time" type="time" defaultValue={time} required />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create Workout"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
