import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  workouts: {
    workoutExercises: r.many.workoutExercises({
      from: r.workouts.id,
      to: r.workoutExercises.workoutId,
    }),
  },
  workoutExercises: {
    workout: r.one.workouts({
      from: r.workoutExercises.workoutId,
      to: r.workouts.id,
    }),
    exercise: r.one.exercises({
      from: r.workoutExercises.exerciseId,
      to: r.exercises.id,
    }),
    sets: r.many.sets({
      from: r.workoutExercises.id,
      to: r.sets.workoutExerciseId,
    }),
  },
  sets: {
    workoutExercise: r.one.workoutExercises({
      from: r.sets.workoutExerciseId,
      to: r.workoutExercises.id,
    }),
  },
}));
