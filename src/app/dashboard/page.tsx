import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getWorkoutsForDate } from "@/data/workouts";
import { DEFAULT_TIME_ZONE, isValidTimeZone, todayIn } from "@/lib/dates";
import { DatePicker } from "./date-picker";
import { TimezoneSync } from "./timezone-sync";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const tzCookie = (await cookies()).get("tz")?.value;
  const hasTz = isValidTimeZone(tzCookie);
  const timeZone = hasTz ? tzCookie : DEFAULT_TIME_ZONE;

  const { date: dateParam } = await searchParams;
  const requested = typeof dateParam === "string" ? dateParam : undefined;
  const date =
    requested && DATE_RE.test(requested) && !Number.isNaN(Date.parse(requested))
      ? requested
      : todayIn(timeZone);

  const workouts = await getWorkoutsForDate(userId, date, timeZone);
  const formatTime = (d: Date) => format(new TZDate(d, timeZone), "h:mm a");

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
      {!hasTz && <TimezoneSync />}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-4">
          <DatePicker value={date} today={todayIn(timeZone)} />
          <Button
            nativeButton={false}
            render={<Link href={`/dashboard/workout/new?date=${date}`} />}
          >
            Log New Workout
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <div>
          <h2 className="mb-4 text-xl font-medium">
            Workouts for {format(parseISO(date), "do MMM yyyy")}
          </h2>

          {workouts.length === 0 ? (
            <Card>
              <CardContent>
                <p className="text-muted-foreground">
                  No workouts logged for this date.
                </p>
              </CardContent>
            </Card>
          ) : (
        <div className="flex flex-col gap-6">
          {workouts.map((workout) => (
            <Card
              key={workout.id}
              className="relative transition-shadow hover:ring-2 hover:ring-foreground/30"
            >
              <CardHeader>
                <CardTitle>
                  <Link
                    href={`/dashboard/workout/${workout.id}`}
                    className="cursor-default after:absolute after:inset-0 after:content-['']"
                  >
                    {workout.name ?? "Workout"}
                  </Link>
                </CardTitle>
                <CardDescription>
                  {formatTime(workout.startedAt)}
                  {workout.completedAt
                    ? ` – ${formatTime(workout.completedAt)}`
                    : " · in progress"}
                </CardDescription>
                <CardAction className="relative z-10">
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/dashboard/workout/${workout.id}`} />}
                  >
                    Edit
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                {workout.exercises.length === 0 ? (
                  <p className="text-muted-foreground">No exercises.</p>
                ) : (
                  workout.exercises.map((exercise) => (
                    <div key={exercise.id} className="flex flex-col gap-2">
                      <h3 className="font-medium">{exercise.name}</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Set</TableHead>
                            <TableHead>Weight</TableHead>
                            <TableHead>Reps</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {exercise.sets.map((set) => (
                            <TableRow key={set.id}>
                              <TableCell>{set.setNumber}</TableCell>
                              <TableCell>
                                {set.weight
                                  ? `${Number(set.weight)} kg`
                                  : "Bodyweight"}
                              </TableCell>
                              <TableCell>{set.reps}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
          )}
        </div>
      </div>
    </main>
  );
}
