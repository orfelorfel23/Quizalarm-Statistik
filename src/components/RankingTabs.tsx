import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAnswers, useConfig } from "@/hooks/useBaserow";
import { FIELDS } from "@/config/mappings";
import { Trophy } from "lucide-react";
import { useMemo } from "react";

function rankFor(answers: any[], setKey: string) {
  const rows = answers.filter((a) => String(a[FIELDS.answers.set]).trim().endsWith(setKey));
  const byUser = new Map<string, { user: string; points: number; correct: number; total: number }>();
  for (const a of rows) {
    const u = String(a[FIELDS.answers.user] ?? "—");
    const e = byUser.get(u) ?? { user: u, points: 0, correct: 0, total: 0 };
    e.points += Number(a[FIELDS.answers.points] ?? 0);
    e.total += 1;
    if (a[FIELDS.answers.correct]) e.correct += 1;
    byUser.set(u, e);
  }
  return [...byUser.values()].sort((a, b) => b.points - a.points || b.correct - a.correct);
}

export function RankingTabs() {
  const { data: cfg } = useConfig();
  const { data: answers = [] } = useAnswers();
  const sets = cfg?.tables.sets ?? [];

  const rankings = useMemo(
    () => Object.fromEntries(sets.map((s) => [s.key, rankFor(answers, s.key)])),
    [answers, sets],
  );

  if (!sets.length) return null;

  return (
    <Card className="surface p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-primary" />
        <h2 className="font-display text-2xl tracking-wide">Ranking pro Fragenset</h2>
      </div>
      <Tabs defaultValue={sets[0].key}>
        <TabsList className="bg-secondary">
          {sets.map((s) => (
            <TabsTrigger key={s.key} value={s.key} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {sets.map((s) => {
          const list = rankings[s.key] ?? [];
          return (
            <TabsContent key={s.key} value={s.key} className="mt-4">
              {list.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Noch keine Antworten.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Teilnehmer</TableHead>
                      <TableHead className="text-right">Punkte</TableHead>
                      <TableHead className="text-right">Korrekt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((r, i) => (
                      <TableRow key={r.user}>
                        <TableCell className={i < 3 ? "font-bold text-primary" : "text-muted-foreground"}>
                          {i + 1}
                        </TableCell>
                        <TableCell className="font-medium">{r.user}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{r.points}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.correct}/{r.total}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </Card>
  );
}
