import { useQuery } from "@tanstack/react-query";
import { fetchTable } from "@/lib/baserow";
import { loadConfig } from "@/lib/config";
import { mockAnswers, mockQuestions } from "@/lib/mock";
import { getStoredSession } from "@/lib/auth";
import { FIELDS } from "@/config/mappings";

export function useConfig() {
  return useQuery({ queryKey: ["config"], queryFn: loadConfig, staleTime: Infinity });
}

export function useTeamParticipants(teamId: number | null) {
  const { data: cfg } = useConfig();
  const apiBase = cfg?.quizalarmApiUrl || "https://quizalarm.orfel.de";
  return useQuery({
    queryKey: ["team-participants", teamId, apiBase],
    enabled: !!teamId,
    refetchInterval: 30000,
    queryFn: async () => {
      if (!teamId) return [];
      try {
        const res = await fetch(`${apiBase}/api/teams`);
        if (!res.ok) return [];
        const data = await res.json();
        const team = (data.teams || []).find((t: any) => t.id === teamId);
        return team ? (team.participants || []) : [];
      } catch (e) {
        console.error("Error fetching team participants:", e);
        return [];
      }
    },
  });
}

export function useAnswers() {
  const { data: cfg } = useConfig();
  const session = getStoredSession();
  const { data: liveParticipants } = useTeamParticipants(session?.teamId ?? null);

  const teamParticipants = (liveParticipants && liveParticipants.length > 0)
    ? liveParticipants
    : (session?.participants ?? []);

  return useQuery({
    queryKey: ["answers", cfg?.tables.answers, cfg?.mock, session?.teamId, teamParticipants],
    enabled: !!cfg && !!session,
    refetchInterval: cfg?.pollIntervalMs ?? 20000,
    queryFn: async () => {
      if (!cfg || !session) return [];
      if (cfg.mock) return mockAnswers();
      const allAnswers = await fetchTable(cfg.tables.answers);
      const allowedNames = new Set(teamParticipants.map((p: string) => p.trim().toLowerCase()));
      // Filter answers to only include team participants:
      return allAnswers.filter((a: any) => {
        const u = String(a[FIELDS.answers.user] ?? "").trim().toLowerCase();
        return allowedNames.has(u);
      });
    },
  });
}

export function useQuestions(setKey: string, tableId: number) {
  const { data: cfg } = useConfig();
  return useQuery({
    queryKey: ["questions", setKey, tableId, cfg?.mock],
    enabled: !!cfg,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (cfg?.mock || !tableId) return mockQuestions(setKey);
      return fetchTable(tableId);
    },
  });
}
