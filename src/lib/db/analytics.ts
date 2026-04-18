import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  ApplicationRow,
  InterviewRow,
  OfferRow,
  ReminderRow,
  StatusHistoryRow,
} from "@/types/database";

export const analyticsKeys = {
  bundle: () => ["analytics", "bundle"] as const,
  dashboard: () => ["analytics", "dashboard"] as const,
};

export type AnalyticsBundle = {
  applications: ApplicationRow[];
  statusHistory: StatusHistoryRow[];
  interviews: InterviewRow[];
  offers: OfferRow[];
};

export function useAnalyticsBundle() {
  return useQuery({
    queryKey: analyticsKeys.bundle(),
    queryFn: async (): Promise<AnalyticsBundle> => {
      const [apps, history, interviews, offers] = await Promise.all([
        supabase
          .from("applications")
          .select("*")
          .is("deleted_at", null)
          .then(({ data, error }) => {
            if (error) throw error;
            return (data ?? []) as ApplicationRow[];
          }),
        supabase
          .from("status_history")
          .select("*")
          .then(({ data, error }) => {
            if (error) throw error;
            return (data ?? []) as StatusHistoryRow[];
          }),
        supabase
          .from("interviews")
          .select("*")
          .then(({ data, error }) => {
            if (error) throw error;
            return (data ?? []) as InterviewRow[];
          }),
        supabase
          .from("offers")
          .select("*")
          .then(({ data, error }) => {
            if (error) throw error;
            return (data ?? []) as OfferRow[];
          }),
      ]);
      return { applications: apps, statusHistory: history, interviews, offers };
    },
  });
}

export type DashboardExtras = {
  upcomingReminders: (ReminderRow & {
    application: {
      id: string;
      role_title: string;
      company: { name: string } | null;
    } | null;
  })[];
  todaysInterviews: (InterviewRow & {
    application: {
      id: string;
      role_title: string;
      company: { name: string } | null;
    } | null;
  })[];
};

export function useDashboardExtras() {
  return useQuery({
    queryKey: analyticsKeys.dashboard(),
    queryFn: async (): Promise<DashboardExtras> => {
      const now = new Date();
      const weekAhead = new Date(now);
      weekAhead.setDate(weekAhead.getDate() + 7);
      const dayEnd = new Date(now);
      dayEnd.setHours(23, 59, 59, 999);

      const [reminders, todayIv] = await Promise.all([
        supabase
          .from("reminders")
          .select(
            "*, application:applications(id, role_title, company:companies(name))",
          )
          .is("completed_at", null)
          .lte("due_at", weekAhead.toISOString())
          .order("due_at", { ascending: true })
          .limit(20)
          .then(({ data, error }) => {
            if (error) throw error;
            return (data ?? []) as DashboardExtras["upcomingReminders"];
          }),
        supabase
          .from("interviews")
          .select(
            "*, application:applications(id, role_title, company:companies(name))",
          )
          .gte("scheduled_at", now.toISOString())
          .lte("scheduled_at", dayEnd.toISOString())
          .order("scheduled_at", { ascending: true })
          .then(({ data, error }) => {
            if (error) throw error;
            return (data ?? []) as DashboardExtras["todaysInterviews"];
          }),
      ]);

      return { upcomingReminders: reminders, todaysInterviews: todayIv };
    },
  });
}
