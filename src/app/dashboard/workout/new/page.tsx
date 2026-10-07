import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEFAULT_TIME_ZONE, isValidTimeZone, todayIn } from "@/lib/dates";
import { WorkoutForm } from "./workout-form";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function NewWorkoutPage({
  searchParams,
}: PageProps<"/dashboard/workout/new">) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const tzCookie = (await cookies()).get("tz")?.value;
  const timeZone = isValidTimeZone(tzCookie) ? tzCookie : DEFAULT_TIME_ZONE;

  const { date: dateParam } = await searchParams;
  const requested = typeof dateParam === "string" ? dateParam : undefined;
  const date =
    requested && DATE_RE.test(requested) && !Number.isNaN(Date.parse(requested))
      ? requested
      : todayIn(timeZone);
  const time = format(new TZDate(new Date(), timeZone), "HH:mm");

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-8">
      <Card>
        <CardHeader>
          <CardTitle>New Workout</CardTitle>
          <CardDescription>Log a new workout session.</CardDescription>
        </CardHeader>
        <CardContent>
          <WorkoutForm date={date} time={time} />
        </CardContent>
      </Card>
    </main>
  );
}
