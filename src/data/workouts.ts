import { and, asc, eq, gte, lt, max } from "drizzle-orm";
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

  return fetchWorkouts(
    and(
      eq(workouts.userId, userId),
      gte(workouts.startedAt, start),
      lt(workouts.startedAt, end),
    ),
  );
}

// A single workout with its exercises and sets, or undefined if not owned by the user.
export async function getWorkoutWithExercises(
  userId: string,
  workoutId: string,
): Promise<WorkoutWithExercises | undefined> {
  const [workout] = await fetchWorkouts(
    and(eq(workouts.id, workoutId), eq(workouts.userId, userId)),
  );
  return workout;
}

async function fetchWorkouts(
  where: ReturnType<typeof and>,
): Promise<WorkoutWithExercises[]> {
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
    .where(where)
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

export async function getWorkout(userId: string, workoutId: string) {
  const [workout] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));
  return workout;
}

export async function updateWorkout(
  userId: string,
  workoutId: string,
  data: { name: string | null; startedAt: Date },
) {
  const [workout] = await db
    .update(workouts)
    .set(data)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .returning();
  return workout;
}

// Exercise catalog (reference data shared by all users).
export async function listExercises() {
  return db
    .select({ id: exercises.id, name: exercises.name })
    .from(exercises)
    .orderBy(asc(exercises.name));
}

// Returns the workout_exercise only if it belongs to one of the user's workouts.
async function getOwnedWorkoutExercise(userId: string, workoutExerciseId: string) {
  const [row] = await db
    .select({ id: workoutExercises.id })
    .from(workoutExercises)
    .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
    .where(
      and(eq(workoutExercises.id, workoutExerciseId), eq(workouts.userId, userId)),
    );
  return row;
}

// Returns the set only if it belongs to one of the user's workouts.
async function getOwnedSet(userId: string, setId: string) {
  const [row] = await db
    .select({ id: sets.id })
    .from(sets)
    .innerJoin(workoutExercises, eq(workoutExercises.id, sets.workoutExerciseId))
    .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
    .where(and(eq(sets.id, setId), eq(workouts.userId, userId)));
  return row;
}

// neon-http has no interactive transactions, so allocate the next number and retry
// once if a concurrent insert wins the unique (parent, number) constraint.
async function insertWithNextNumber<T>(attempt: () => Promise<T>): Promise<T> {
  try {
    return await attempt();
  } catch {
    return attempt();
  }
}

export async function addExerciseToWorkout(
  userId: string,
  workoutId: string,
  exerciseId: string,
) {
  if (!(await getWorkout(userId, workoutId))) return undefined;
  return insertWithNextNumber(async () => {
    const [{ value }] = await db
      .select({ value: max(workoutExercises.order) })
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutId, workoutId));
    const [row] = await db
      .insert(workoutExercises)
      .values({ workoutId, exerciseId, order: (value ?? 0) + 1 })
      .returning();
    return row;
  });
}

export async function removeWorkoutExercise(
  userId: string,
  workoutExerciseId: string,
) {
  if (!(await getOwnedWorkoutExercise(userId, workoutExerciseId))) return false;
  await db.delete(workoutExercises).where(eq(workoutExercises.id, workoutExerciseId));
  return true;
}

export async function addSet(
  userId: string,
  workoutExerciseId: string,
  data: { weight: number | null; reps: number },
) {
  if (!(await getOwnedWorkoutExercise(userId, workoutExerciseId))) return undefined;
  return insertWithNextNumber(async () => {
    const [{ value }] = await db
      .select({ value: max(sets.setNumber) })
      .from(sets)
      .where(eq(sets.workoutExerciseId, workoutExerciseId));
    const [row] = await db
      .insert(sets)
      .values({
        workoutExerciseId,
        setNumber: (value ?? 0) + 1,
        weight: data.weight === null ? null : String(data.weight),
        reps: data.reps,
      })
      .returning();
    return row;
  });
}

export async function updateSet(
  userId: string,
  setId: string,
  data: { weight: number | null; reps: number },
) {
  if (!(await getOwnedSet(userId, setId))) return undefined;
  const [row] = await db
    .update(sets)
    .set({
      weight: data.weight === null ? null : String(data.weight),
      reps: data.reps,
    })
    .where(eq(sets.id, setId))
    .returning();
  return row;
}

export async function deleteSet(userId: string, setId: string) {
  if (!(await getOwnedSet(userId, setId))) return false;
  await db.delete(sets).where(eq(sets.id, setId));
  return true;
}
