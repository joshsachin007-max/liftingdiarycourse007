"use client";

import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addSetAction,
  deleteSetAction,
  removeExerciseAction,
  updateSetAction,
} from "./actions";

type SetRow = {
  id: string;
  setNumber: number;
  weight: string | null;
  reps: number;
};

// Empty weight means bodyweight (null). Returns undefined when the input is invalid.
function parseValues(weight: string, reps: string) {
  const w = weight.trim() === "" ? null : Number(weight);
  const r = Number(reps);
  if (w !== null && (!Number.isFinite(w) || w < 0)) return undefined;
  if (!Number.isInteger(r) || r < 1) return undefined;
  return { weight: w, reps: r };
}

export function ExerciseCard({
  workoutExerciseId,
  name,
  sets,
}: {
  workoutExerciseId: string;
  name: string;
  sets: SetRow[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");

  const last = sets[sets.length - 1];

  function run(
    fn: () => Promise<{ success: boolean; error?: string }>,
    onSuccess?: () => void,
  ) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.success) {
        setError(result.error ?? "Something went wrong");
        return;
      }
      onSuccess?.();
    });
  }

  function onAddSet(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = parseValues(weight, reps);
    if (!values) return setError("Enter a valid weight (optional) and reps");
    run(
      () => addSetAction({ workoutExerciseId, ...values }),
      () => setReps(""),
    );
  }

  function startEdit(s: SetRow) {
    setEditingId(s.id);
    setWeight(s.weight === null ? "" : String(Number(s.weight)));
    setReps(String(s.reps));
  }

  function onSaveEdit(setId: string) {
    const values = parseValues(weight, reps);
    if (!values) return setError("Enter a valid weight (optional) and reps");
    run(
      () => updateSetAction({ setId, ...values }),
      () => {
        setEditingId(null);
        setWeight("");
        setReps("");
      },
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{name}</CardTitle>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button variant="outline" size="sm" disabled={pending}>
                Remove
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove {name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This also deletes all logged sets for this exercise.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  run(() => removeExerciseAction({ workoutExerciseId }))
                }
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {sets.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Set</TableHead>
                <TableHead>Weight (kg)</TableHead>
                <TableHead>Reps</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sets.map((s) =>
                editingId === s.id ? (
                  <TableRow key={s.id}>
                    <TableCell>{s.setNumber}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min="0"
                        aria-label="Weight in kg"
                        placeholder="Bodyweight"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        aria-label="Reps"
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() => onSaveEdit(s.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={s.id}>
                    <TableCell>{s.setNumber}</TableCell>
                    <TableCell>
                      {s.weight === null ? "Bodyweight" : Number(s.weight)}
                    </TableCell>
                    <TableCell>{s.reps}</TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => startEdit(s)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          run(() => deleteSetAction({ setId: s.id }))
                        }
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
        )}
        <form onSubmit={onAddSet} className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              aria-label="Weight in kg"
              placeholder={
                last?.weight != null
                  ? `kg (last ${Number(last.weight)})`
                  : "kg (blank = bodyweight)"
              }
              value={editingId ? "" : weight}
              disabled={editingId !== null}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div className="w-24">
            <Input
              type="number"
              inputMode="numeric"
              min="1"
              aria-label="Reps"
              placeholder="Reps"
              value={editingId ? "" : reps}
              disabled={editingId !== null}
              onChange={(e) => setReps(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={pending || editingId !== null}>
            Add set
          </Button>
        </form>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
