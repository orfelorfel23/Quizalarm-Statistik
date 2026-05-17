import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAnswers, useConfig, useQuestions } from "@/hooks/useBaserow";
import { FIELDS } from "@/config/mappings";
import { BarChart3 } from "lucide-react";
import { useMemo } from "react";

function SetStats({ setKey, tableId }: { setKey: string; tableId: number }) {
  const { data: answers = [] } = useAnswers();
  const { data: questions = [] } = useQuestions(setKey, tableId);

  const rows = useMemo(() => {
    const setAnswers = answers.filter((a: any) => String(a[FIELDS.answers.set]).trim().endsWith(setKey));
    return questions.map((q: any) => {
      const qid = String(q[FIELDS.question.id]);
      const given = setAnswers.filter((a: any) => String(a[FIELDS.answers.questionId]) === qid);
      const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
      let correct = 0;
      for (const a of given) {
        let v = String(a[FIELDS.answers.answer] ?? "").toUpperCase();
        
        // Falls die Antwort als Volltext statt Buchstabe gespeichert wurde, auf A/B/C/D mappen
        if (counts[v] === undefined) {
          if (v === String(q[FIELDS.question.optionA] ?? "").toUpperCase()) v = "A";
          else if (v === String(q[FIELDS.question.optionB] ?? "").toUpperCase()) v = "B";
          else if (v === String(q[FIELDS.question.optionC] ?? "").toUpperCase()) v = "C";
          else if (v === String(q[FIELDS.question.optionD] ?? "").toUpperCase()) v = "D";
        }

        if (counts[v] !== undefined) counts[v] += 1;
        if (a[FIELDS.answers.correct]) correct += 1;
      }
      const total = given.length;
      return {
        qid,
        text: String(q[FIELDS.question.text] ?? qid),
        solution: String(q[FIELDS.question.correctAnswer] ?? ""),
        counts,
        total,
        rate: total ? Math.round((correct / total) * 100) : 0,
      };
    });
  }, [answers, questions, setKey]);

  if (!rows.length) return <p className="text-sm text-muted-foreground py-6 text-center">Keine Fragen.</p>;

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.qid} className="rounded-md border border-border bg-card/50 p-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-xs text-muted-foreground">{r.qid} · Lösung: <span className="text-primary font-semibold">{r.solution || "—"}</span></p>
              <p className="font-medium leading-snug">{r.text}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold tabular-nums">{r.rate}%</p>
              <p className="text-xs text-muted-foreground">{r.total} Antw.</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(["A", "B", "C", "D"] as const).map((opt) => {
              const n = r.counts[opt];
              const pct = r.total ? (n / r.total) * 100 : 0;
              const isSolution = r.solution.toUpperCase() === opt;
              return (
                <div key={opt}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={isSolution ? "text-success font-semibold" : "text-muted-foreground"}>{opt}</span>
                    <span className="tabular-nums text-muted-foreground">{n}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full ${isSolution ? "bg-success" : "bg-primary"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function QuestionStats() {
  const { data: cfg } = useConfig();
  const sets = cfg?.tables.sets ?? [];
  if (!sets.length) return null;

  return (
    <Card className="surface p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="font-display text-2xl tracking-wide">Frage-Statistik</h2>
      </div>
      <Tabs defaultValue={sets[0].key}>
        <TabsList className="bg-secondary">
          {sets.map((s) => (
            <TabsTrigger key={s.key} value={s.key} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {sets.map((s) => (
          <TabsContent key={s.key} value={s.key} className="mt-4">
            <SetStats setKey={s.key} tableId={s.tableId} />
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}
