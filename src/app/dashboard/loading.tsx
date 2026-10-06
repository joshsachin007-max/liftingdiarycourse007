import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function Loading() {
  return (
    <main
      className="mx-auto w-full max-w-3xl flex-1 px-6 py-8"
      aria-busy="true"
      aria-label="Loading workouts"
    >
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <div className="mt-4 mb-8 flex flex-col gap-2">
        <Label>Date</Label>
        <div className="h-9 w-40 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="mb-4 h-7 w-64 animate-pulse rounded bg-muted" />

      <div className="flex flex-col gap-6">
        {[0, 1].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="h-5 w-1/4 animate-pulse rounded bg-muted" />
              <div className="h-24 w-full animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
