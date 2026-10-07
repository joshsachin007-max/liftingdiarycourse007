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
import { getWorkout } from "@/data/workouts";
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

  const workout = await getWorkout(userId, workoutId);
  if (!workout) notFound();

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
    </main>
  );
}
