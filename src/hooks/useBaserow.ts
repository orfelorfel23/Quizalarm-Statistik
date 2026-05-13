import { useQuery } from "@tanstack/react-query";
import { fetchTable } from "@/lib/baserow";
import { loadConfig } from "@/lib/config";
import { mockAnswers, mockQuestions } from "@/lib/mock";

export function useConfig() {
  return useQuery({ queryKey: ["config"], queryFn: loadConfig, staleTime: Infinity });
}

export function useAnswers() {
  const { data: cfg } = useConfig();
  return useQuery({
    queryKey: ["answers", cfg?.tables.answers, cfg?.mock],
    enabled: !!cfg,
    refetchInterval: cfg?.pollIntervalMs ?? 20000,
    queryFn: async () => {
      if (!cfg) return [];
      if (cfg.mock) return mockAnswers();
      return fetchTable(cfg.tables.answers);
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
