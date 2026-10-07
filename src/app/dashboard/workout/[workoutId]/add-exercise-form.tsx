"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addExerciseAction } from "./actions";

export function AddExerciseForm({
  workoutId,
  exercises,
}: {
  workoutId: string;
  exercises: { id: string; name: string }[];
}) {
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!exerciseId) return;
    setError(null);
    startTransition(async () => {
      const result = await addExerciseAction({ workoutId, exerciseId });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setExerciseId(null);
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <Label>Add exercise</Label>
      <div className="flex gap-2">
        <Select value={exerciseId} onValueChange={setExerciseId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Choose an exercise">
              {(value: string | null) =>
                exercises.find((x) => x.id === value)?.name ??
                "Choose an exercise"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {exercises.map((x) => (
              <SelectItem key={x.id} value={x.id}>
                {x.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={pending || !exerciseId}>
          {pending ? "Adding…" : "Add"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
