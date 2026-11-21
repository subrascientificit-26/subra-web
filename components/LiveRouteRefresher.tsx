"use client";

import { useRouter } from "next/navigation";
import { useLiveUpdates } from "@/lib/hooks/useLiveUpdates";
import type { RealtimeTopic } from "@/lib/realtime";

export default function LiveRouteRefresher({
  topics,
}: {
  topics: RealtimeTopic[];
}) {
  const router = useRouter();

  useLiveUpdates(topics, () => {
    router.refresh();
  });

  return null;
}

