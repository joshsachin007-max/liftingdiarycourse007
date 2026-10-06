"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Stores the browser's time zone in a cookie so the server can render in it.
export function TimezoneSync() {
  const router = useRouter();

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.cookie = `tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [router]);

  return null;
}
