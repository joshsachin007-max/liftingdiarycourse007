import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// Reference data: catalog of exercises.
export const exercises = pgTable("exercises", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Individual workout sessions.
export const workouts = pgTable(
  "workouts",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text("user_id").notNull(), // Clerk user id
    name: text(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("workouts_user_id_started_at_idx").on(t.userId, t.startedAt.desc()),
  ],
);

// Junction: an exercise performed within a workout.
export const workoutExercises = pgTable(
  "workout_exercises",
  {
    id: uuid().primaryKey().defaultRandom(),
    workoutId: uuid("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "restrict" }),
    order: integer().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("workout_exercises_workout_id_order_unique").on(t.workoutId, t.order),
    index("workout_exercises_exercise_id_idx").on(t.exerciseId),
  ],
);

// Individual sets of a workout exercise.
export const sets = pgTable(
  "sets",
  {
    id: uuid().primaryKey().defaultRandom(),
    workoutExerciseId: uuid("workout_exercise_id")
      .notNull()
      .references(() => workoutExercises.id, { onDelete: "cascade" }),
    setNumber: integer("set_number").notNull(),
    weight: numeric({ precision: 6, scale: 2 }), // single unit (kg); null = bodyweight
    reps: integer().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("sets_workout_exercise_id_set_number_unique").on(
      t.workoutExerciseId,
      t.setNumber,
    ),
    check("sets_reps_positive", sql`${t.reps} > 0`),
  ],
);
