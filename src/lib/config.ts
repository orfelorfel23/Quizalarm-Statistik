export type SetConfig = { key: string; label: string; tableId: number };
export type AppConfig = {
  siteTitle: string;
  siteSubtitle: string;
  tables: { answers: number; sets: SetConfig[] };
  pollIntervalMs: number;
  mock: boolean;
};

let cached: AppConfig | null = null;

export async function loadConfig(): Promise<AppConfig> {
  if (cached) return cached;
  try {
    const res = await fetch("/config.json", { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    cached = (await res.json()) as AppConfig;
  } catch {
    cached = {
      siteTitle: "Quizalarm Auswertung",
      siteSubtitle: "Live-Ergebnisse (Demo)",
      tables: {
        answers: 0,
        sets: [
          { key: "A", label: "Fragenset A", tableId: 0 },
          { key: "B", label: "Fragenset B", tableId: 0 },
          { key: "C", label: "Fragenset C", tableId: 0 },
        ],
      },
      pollIntervalMs: 20000,
      mock: true,
    };
  }
  // Auto-mock if all tableIds are 0 (developer left placeholder)
  if (cached.tables.answers === 0) cached.mock = true;
  return cached;
}
