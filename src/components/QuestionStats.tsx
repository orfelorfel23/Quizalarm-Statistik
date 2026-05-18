import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAnswers, useConfig, useQuestions } from "@/hooks/useBaserow";
import { FIELDS } from "@/config/mappings";
import { BarChart3, ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";

function SetStats({ setKey, tableId, sortBy, sortDesc }: { setKey: string; tableId: number; sortBy: string; sortDesc: boolean }) {
  const { data: answers = [] } = useAnswers();
  const { data: questions = [] } = useQuestions(setKey, tableId);

  const rows = useMemo(() => {
    const setAnswers = answers.filter((a: any) => String(a[FIELDS.answers.set]).trim().endsWith(setKey));
    let mapped = questions.map((q: any, index: number) => {
      const qid = String(q[FIELDS.question.id]);
      const given = setAnswers.filter((a: any) => String(a[FIELDS.answers.questionId]) === qid);
      
      const counts: Record<string, number> = {};
      
      // Initialize with expected options if they exist
      const opts = ["A", "B", "C", "D"] as const;
      for (const opt of opts) {
        if (q[`option${opt}`] !== undefined && q[`option${opt}`] !== null && String(q[`option${opt}`]).trim() !== "") {
          counts[opt] = 0;
        }
      }

      let correct = 0;
      for (const a of given) {
        let rawAnswer = String(a[FIELDS.answers.answer] ?? "").trim();
        let upperV = rawAnswer.toUpperCase();
        let v = rawAnswer;
        
        // Try to map full text back to standard options if possible
        if (counts[upperV] !== undefined) {
            v = upperV;
        } else {
            if (rawAnswer === String(q[FIELDS.question.optionA] ?? "").trim()) v = "A";
            else if (rawAnswer === String(q[FIELDS.question.optionB] ?? "").trim()) v = "B";
            else if (rawAnswer === String(q[FIELDS.question.optionC] ?? "").trim()) v = "C";
            else if (rawAnswer === String(q[FIELDS.question.optionD] ?? "").trim()) v = "D";
        }

        if (counts[v] === undefined) {
          counts[v] = 1;
        } else {
          counts[v] += 1;
        }
        
        if (a[FIELDS.answers.correct]) correct += 1;
      }

      const total = given.length;
      let solution = String(q[FIELDS.question.correctAnswer] ?? "").trim();
      
      const optionsWithCounts = Object.entries(counts).map(([key, count]) => {
        let label = key;
        if (key === "A") label = String(q[FIELDS.question.optionA] ?? "A");
        else if (key === "B") label = String(q[FIELDS.question.optionB] ?? "B");
        else if (key === "C") label = String(q[FIELDS.question.optionC] ?? "C");
        else if (key === "D") label = String(q[FIELDS.question.optionD] ?? "D");
        
        let isSolution = false;
        if (solution.toUpperCase() === key.toUpperCase()) isSolution = true;
        if (solution.toLowerCase() === label.toLowerCase()) isSolution = true;
        
        return { key, label, count, isSolution };
      });
      
      // Sort options: A, B, C, D first, then others by count descending
      optionsWithCounts.sort((a, b) => {
        const orderA = ["A", "B", "C", "D"].indexOf(a.key);
        const orderB = ["A", "B", "C", "D"].indexOf(b.key);
        if (orderA !== -1 && orderB !== -1) return orderA - orderB;
        if (orderA !== -1) return -1;
        if (orderB !== -1) return 1;
        return b.count - a.count;
      });

      // Attempt to resolve full text for solution to display
      let solutionText = solution;
      if (solution === "A") solutionText = String(q[FIELDS.question.optionA] ?? "A");
      else if (solution === "B") solutionText = String(q[FIELDS.question.optionB] ?? "B");
      else if (solution === "C") solutionText = String(q[FIELDS.question.optionC] ?? "C");
      else if (solution === "D") solutionText = String(q[FIELDS.question.optionD] ?? "D");

      return {
        qid,
        originalIndex: index,
        text: String(q[FIELDS.question.text] ?? qid),
        solutionText,
        optionsWithCounts,
        total,
        rate: total ? Math.round((correct / total) * 100) : 0,
      };
    });

    mapped.sort((a, b) => {
      let diff = 0;
      if (sortBy === "count") diff = a.total - b.total;
      else if (sortBy === "rate") diff = a.rate - b.rate;
      else diff = a.originalIndex - b.originalIndex;
      
      return sortDesc ? -diff : diff;
    });

    return mapped;
  }, [answers, questions, setKey, sortBy, sortDesc]);

  if (!rows.length) return <p className="text-sm text-muted-foreground py-6 text-center">Keine Fragen.</p>;

  return (
    <div className="space-y-3 mt-4">
      {rows.map((r) => (
        <div key={r.qid} className="rounded-md border border-border bg-card/50 p-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{r.qid} · Lösung: <span className="text-primary font-semibold">{r.solutionText || "—"}</span></p>
              <p className="font-medium leading-snug">{r.text}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold tabular-nums">{r.rate}%</p>
              <p className="text-xs text-muted-foreground">{r.total} Antw.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {r.optionsWithCounts.map((opt) => {
              const pct = r.total ? (opt.count / r.total) * 100 : 0;
              return (
                <div key={opt.key}>
                  <div className="flex items-start justify-between text-xs mb-1.5 gap-2">
                    <span className={`line-clamp-2 ${opt.isSolution ? "text-success font-semibold" : "text-muted-foreground"}`}>
                      {opt.label}
                    </span>
                    <span className="tabular-nums font-medium text-muted-foreground shrink-0">{opt.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full ${opt.isSolution ? "bg-success" : "bg-primary"}`}
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
  const [sortBy, setSortBy] = useState<"order" | "count" | "rate">("order");
  const [sortDesc, setSortDesc] = useState<boolean>(true);

  if (!sets.length) return null;

  return (
    <Card className="surface p-5 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="font-display text-2xl tracking-wide">Frage-Statistik</h2>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-40 bg-secondary border-border"><SelectValue placeholder="Sortierung" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="order">Reihenfolge</SelectItem>
              <SelectItem value="count">Antworten</SelectItem>
              <SelectItem value="rate">Richtig-Quote</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="bg-secondary" onClick={() => setSortDesc(!sortDesc)}>
            {sortDesc ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <Tabs defaultValue={sets[0].key} className="flex-1">
        <TabsList className="bg-secondary">
          {sets.map((s) => (
            <TabsTrigger key={s.key} value={s.key} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {sets.map((s) => (
          <TabsContent key={s.key} value={s.key} className="flex-1">
            <SetStats setKey={s.key} tableId={s.tableId} sortBy={sortBy} sortDesc={sortDesc} />
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}
