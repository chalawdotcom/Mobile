import { supabase } from "@/lib/supabase";
import type { StopEventRow } from "@/types";
import { useEffect, useState } from "react";

interface UseStopEventsResult {
  loading: boolean;
  rows: StopEventRow[];
  error: string | null;
  refresh: () => void;
}

/** Pulls the most recent stop events (excluding soft-deleted), newest first. */
export function useStopEvents(limit = 100): UseStopEventsResult {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<StopEventRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void (async () => {
      const { data, error: err } = await supabase
        .from("stop_events")
        .select("*")
        .eq("is_deleted", false)
        .order("ts_start", { ascending: false })
        .limit(limit);

      if (cancelled) return;
      if (err) {
        setError(err.message);
      } else {
        setRows((data ?? []) as StopEventRow[]);
        setError(null);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [limit, tick]);

  return { loading, rows, error, refresh: () => setTick((t) => t + 1) };
}
