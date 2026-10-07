"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createWorkout } from "@/data/workouts";

const createWorkoutSchema = z.object({
  name: z.string().trim().max(100),
  startedAt: z.coerce.date(),
});

export async function createWorkoutAction(
  params: z.infer<typeof createWorkoutSchema>,
) {
  const parsed = createWorkoutSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" } as const;
  }

  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" } as const;
  }

  await createWorkout(userId, {
    name: parsed.data.name || null,
    startedAt: parsed.data.startedAt,
  });
  revalidatePath("/dashboard");
  return { success: true } as const;
}
