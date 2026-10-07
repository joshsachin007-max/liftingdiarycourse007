import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getWorkout,
  getWorkoutWithExercises,
  listExercises,
} from "@/data/workouts";
import { AddExerciseForm } from "./add-exercise-form";
import { ExerciseCard } from "./exercise-card";
import { DEFAULT_TIME_ZONE, isValidTimeZone } from "@/lib/dates";
import { EditWorkoutForm } from "./edit-workout-form";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditWorkoutPage({
  params,
}: PageProps<"/dashboard/workout/[workoutId]">) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { workoutId } = await params;
  if (!UUID_RE.test(workoutId)) notFound();

  const [workout, logged, exerciseCatalog] = await Promise.all([
    getWorkout(userId, workoutId),
    getWorkoutWithExercises(userId, workoutId),
    listExercises(),
  ]);
  if (!workout || !logged) notFound();

  const tzCookie = (await cookies()).get("tz")?.value;
  const timeZone = isValidTimeZone(tzCookie) ? tzCookie : DEFAULT_TIME_ZONE;
  const startedAt = new TZDate(workout.startedAt, timeZone);

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Workout</CardTitle>
          <CardDescription>Update this workout session.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditWorkoutForm
            workoutId={workout.id}
            name={workout.name ?? ""}
            date={format(startedAt, "yyyy-MM-dd")}
            time={format(startedAt, "HH:mm")}
          />
        </CardContent>
      </Card>

      <section className="mt-8 flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Exercises</h2>
        {logged.exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            workoutExerciseId={exercise.id}
            name={exercise.name}
            sets={exercise.sets}
          />
        ))}
        <AddExerciseForm workoutId={workout.id} exercises={exerciseCatalog} />
      </section>
    </main>
  );
}
