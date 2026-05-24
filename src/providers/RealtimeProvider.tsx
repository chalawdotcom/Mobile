import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useMachineStore } from "@/stores/machineStore";
import type {
    AlertRow,
    InterventionRow,
    MachineStateRow,
    StopEventRow,
} from "@/types";
import Constants from "expo-constants";
import { useEffect, useRef, type ReactNode } from "react";
import { Platform } from "react-native";

const CHANNEL = "supervision-v2";

const IS_EXPO_GO = Constants.appOwnership === "expo";

type ScheduleLocalNotification = (title: string, body: string) => void;

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  const scheduleLocalRef = useRef<ScheduleLocalNotification | null>(null);

  // Local notifications (disabled in Expo Go on Android SDK>=53)
  useEffect(() => {
    if (Platform.OS === "web") return;
    if (IS_EXPO_GO) return;

    let cancelled = false;

    void (async () => {
      try {
        const Notifications = await import("expo-notifications");
        if (cancelled) return;

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });

        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          scheduleLocalRef.current = null;
          return;
        }

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
          });
        }

        scheduleLocalRef.current = (title: string, body: string) => {
          void Notifications.scheduleNotificationAsync({
            content: { title, body },
            trigger: null,
          });
        };
      } catch (err) {
        scheduleLocalRef.current = null;
        // eslint-disable-next-line no-console
        console.warn("[notifications] disabled:", err);
      }
    })();

    return () => {
      cancelled = true;
      scheduleLocalRef.current = null;
    };
  }, []);

  useEffect(() => {
    // Don't subscribe until auth has resolved
    if (loading) return;

    const store = useMachineStore.getState();

    // -- Initial hydration --------------------------------------------------
    void (async () => {
      try {
        const [latestState, openStop, recentAlerts, recentInterventions] =
          await Promise.all([
            supabase
              .from("machine_states")
              .select("*")
              .order("ts", { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from("stop_events")
              .select("*")
              .is("ts_end", null)
              .eq("is_deleted", false)
              .order("ts_start", { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from("alerts")
              .select("*")
              .order("ts", { ascending: false })
              .limit(50),
            supabase
              .from("interventions")
              .select("*")
              .eq("is_deleted", false)
              .order("started_at", { ascending: false })
              .limit(100),
          ]);

        if (latestState.data) {
          store.applyMachineState(latestState.data as MachineStateRow);
        }
        if (openStop.data) {
          store.hydrateActiveStop(openStop.data as StopEventRow);
        }
        if (recentAlerts.data) {
          store.hydrateAlerts(recentAlerts.data as AlertRow[]);
        }
        if (recentInterventions.data) {
          store.hydrateInterventions(
            recentInterventions.data as InterventionRow[],
          );
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[realtime] failed initial hydration", err);
      }
    })();

    // -- Live channel -------------------------------------------------------
    const channel = supabase
      .channel(CHANNEL)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "machine_states" },
        (payload) => {
          store.applyMachineState(payload.new as MachineStateRow);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stop_events" },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const stop = payload.new as StopEventRow;
          store.applyStopEvent(stop);

          // Show native local notification if machine stops and app is active
          if (payload.eventType === "INSERT" && stop.ts_end === null) {
            scheduleLocalRef.current?.(
              "🛑 Machine Arrêtée",
              `La ligne de conditionnement EE233 s'est arrêtée.`,
            );
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const alertRow = payload.new as AlertRow;
          store.applyAlert(alertRow);

          // Show local alert notification
          if (payload.eventType === "INSERT" && !alertRow.acknowledged) {
            const isCritical = alertRow.severity === "critical";
            scheduleLocalRef.current?.(
              isCritical ? "🚨 ALERTE CRITIQUE" : "⚠️ Nouvelle Alerte",
              alertRow.message,
            );
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "interventions" },
        (payload) => {
          store.applyIntervention(payload.new as InterventionRow);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "interventions" },
        (payload) => {
          store.applyIntervention(payload.new as InterventionRow);
        },
      )
      .subscribe((status) => {
        const connected = status === "SUBSCRIBED";
        store.setRealtimeConnected(connected);
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loading, user?.id]);

  return <>{children}</>;
}
