import { and, asc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { dayRange } from "@/lib/dates";
import { exercises, sets, workoutExercises, workouts } from "@/db/schema";

export type WorkoutWithExercises = {
  id: string;
  name: string | null;
  startedAt: Date;
  completedAt: Date | null;
  exercises: {
    id: string;
    name: string;
    sets: { id: string; setNumber: number; weight: string | null; reps: number }[];
  }[];
};

// All of a user's workouts that started on the given calendar day (YYYY-MM-DD) in `timeZone`.
export async function getWorkoutsForDate(
  userId: string,
  date: string,
  timeZone: string,
): Promise<WorkoutWithExercises[]> {
  const { start, end } = dayRange(date, timeZone);

  const rows = await db
    .select({
      workoutId: workouts.id,
      workoutName: workouts.name,
      startedAt: workouts.startedAt,
      completedAt: workouts.completedAt,
      workoutExerciseId: workoutExercises.id,
      exerciseName: exercises.name,
      setId: sets.id,
      setNumber: sets.setNumber,
      weight: sets.weight,
      reps: sets.reps,
    })
    .from(workouts)
    .leftJoin(workoutExercises, eq(workoutExercises.workoutId, workouts.id))
    .leftJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
    .leftJoin(sets, eq(sets.workoutExerciseId, workoutExercises.id))
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.startedAt, start),
        lt(workouts.startedAt, end),
      ),
    )
    .orderBy(
      asc(workouts.startedAt),
      asc(workoutExercises.order),
      asc(sets.setNumber),
    );

  const result = new Map<string, WorkoutWithExercises>();
  for (const r of rows) {
    let workout = result.get(r.workoutId);
    if (!workout) {
      workout = {
        id: r.workoutId,
        name: r.workoutName,
        startedAt: r.startedAt,
        completedAt: r.completedAt,
        exercises: [],
      };
      result.set(r.workoutId, workout);
    }
    if (!r.workoutExerciseId || !r.exerciseName) continue;

    let exercise = workout.exercises.find((e) => e.id === r.workoutExerciseId);
    if (!exercise) {
      exercise = { id: r.workoutExerciseId, name: r.exerciseName, sets: [] };
      workout.exercises.push(exercise);
    }
    if (r.setId && r.setNumber !== null && r.reps !== null) {
      exercise.sets.push({
        id: r.setId,
        setNumber: r.setNumber,
        weight: r.weight,
        reps: r.reps,
      });
    }
  }
  return [...result.values()];
}

export async function createWorkout(
  userId: string,
  data: { name: string | null; startedAt: Date },
) {
  const [workout] = await db
    .insert(workouts)
    .values({ ...data, userId })
    .returning();
  return workout;
}
