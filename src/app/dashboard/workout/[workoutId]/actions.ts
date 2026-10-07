"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  addExerciseToWorkout,
  addSet,
  deleteSet,
  removeWorkoutExercise,
  updateSet,
  updateWorkout,
} from "@/data/workouts";

const updateWorkoutSchema = z.object({
  workoutId: z.guid(),
  name: z.string().trim().max(100),
  startedAt: z.coerce.date(),
});

export async function updateWorkoutAction(
  params: z.infer<typeof updateWorkoutSchema>,
) {
  const parsed = updateWorkoutSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" } as const;
  }

  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" } as const;
  }

  const workout = await updateWorkout(userId, parsed.data.workoutId, {
    name: parsed.data.name || null,
    startedAt: parsed.data.startedAt,
  });
  if (!workout) {
    return { success: false, error: "Workout not found" } as const;
  }
  revalidatePath("/dashboard");
  return { success: true } as const;
}

const idSchema = z.guid();
const setValuesSchema = z.object({
  weight: z.number().min(0).max(9999.99).nullable(),
  reps: z.number().int().min(1).max(1000),
});

function revalidateWorkout() {
  revalidatePath("/dashboard/workout/[workoutId]", "page");
  revalidatePath("/dashboard");
}

const addExerciseSchema = z.object({
  workoutId: idSchema,
  exerciseId: idSchema,
});

export async function addExerciseAction(
  params: z.infer<typeof addExerciseSchema>,
) {
  const parsed = addExerciseSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" } as const;
  }
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" } as const;

  let row;
  try {
    row = await addExerciseToWorkout(
      userId,
      parsed.data.workoutId,
      parsed.data.exerciseId,
    );
  } catch {
    return { success: false, error: "Could not add exercise" } as const;
  }
  if (!row) return { success: false, error: "Workout not found" } as const;
  revalidateWorkout();
  return { success: true } as const;
}

const removeExerciseSchema = z.object({ workoutExerciseId: idSchema });

export async function removeExerciseAction(
  params: z.infer<typeof removeExerciseSchema>,
) {
  const parsed = removeExerciseSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" } as const;
  }
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" } as const;

  if (!(await removeWorkoutExercise(userId, parsed.data.workoutExerciseId))) {
    return { success: false, error: "Exercise not found" } as const;
  }
  revalidateWorkout();
  return { success: true } as const;
}

const addSetSchema = setValuesSchema.extend({ workoutExerciseId: idSchema });

export async function addSetAction(params: z.infer<typeof addSetSchema>) {
  const parsed = addSetSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" } as const;
  }
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" } as const;

  const { workoutExerciseId, ...values } = parsed.data;
  let row;
  try {
    row = await addSet(userId, workoutExerciseId, values);
  } catch {
    return { success: false, error: "Could not add set" } as const;
  }
  if (!row) return { success: false, error: "Exercise not found" } as const;
  revalidateWorkout();
  return { success: true } as const;
}

const updateSetSchema = setValuesSchema.extend({ setId: idSchema });

export async function updateSetAction(params: z.infer<typeof updateSetSchema>) {
  const parsed = updateSetSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" } as const;
  }
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" } as const;

  const { setId, ...values } = parsed.data;
  if (!(await updateSet(userId, setId, values))) {
    return { success: false, error: "Set not found" } as const;
  }
  revalidateWorkout();
  return { success: true } as const;
}

const deleteSetSchema = z.object({ setId: idSchema });

export async function deleteSetAction(params: z.infer<typeof deleteSetSchema>) {
  const parsed = deleteSetSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" } as const;
  }
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" } as const;

  if (!(await deleteSet(userId, parsed.data.setId))) {
    return { success: false, error: "Set not found" } as const;
  }
  revalidateWorkout();
  return { success: true } as const;
}
