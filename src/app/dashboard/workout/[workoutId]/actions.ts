"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateWorkout } from "@/data/workouts";

const updateWorkoutSchema = z.object({
  workoutId: z.string().uuid(),
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
