import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAnswers, useConfig, useQuestions } from "@/hooks/useBaserow";
import { FIELDS } from "@/config/mappings";
import { BarChart3, ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";

function normalizeText(s: string) {
  return s.toLowerCase().replace(/\s+/g, "");
}

function SetStats({ setKey, tableId, sortBy, sortDesc }: { setKey: string; tableId: number; sortBy: string; sortDesc: boolean }) {
  const { data: answers = [] } = useAnswers();
  const { data: questions = [] } = useQuestions(setKey, tableId);

  const rows = useMemo(() => {
    const setAnswers = answers.filter((a: any) => String(a[FIELDS.answers.set]).trim().endsWith(setKey));
    let mapped = questions.map((q: any, index: number) => {
      const qid = String(q[FIELDS.question.id]);
      
      // Filter out empty answers entirely
      const given = setAnswers.filter((a: any) => {
        if (String(a[FIELDS.answers.questionId]) !== qid) return false;
        if (String(a[FIELDS.answers.answer] ?? "").trim() === "") return false;
        return true;
      });
      
      // Helper to get option text based on letter
      const getOptionText = (optKey: string) => {
        if (optKey === "A") return String(q[FIELDS.question.optionA] ?? "");
        if (optKey === "B") return String(q[FIELDS.question.optionB] ?? "");
        if (optKey === "C") return String(q[FIELDS.question.optionC] ?? "");
        if (optKey === "D") return String(q[FIELDS.question.optionD] ?? "");
        return "";
      };

      const counts: Record<string, number> = {};
      const normToLabel: Record<string, string> = {};
      
      // Initialize with expected options if they exist
      const opts = ["A", "B", "C", "D"] as const;
      for (const opt of opts) {
        const text = getOptionText(opt).trim();
        if (text !== "") {
          counts[opt] = 0;
        }
      }

      let correct = 0;
      for (const a of given) {
        const rawAnswer = String(a[FIELDS.answers.answer] ?? "").trim();
        const normV = normalizeText(rawAnswer);
        let key = normV;
        
        // Try mapping to predefined options (Multiple Choice) via exact or fuzzy matching
        let matchedOpt = null;
        if (["a", "b", "c", "d"].includes(normV)) {
          matchedOpt = normV.toUpperCase();
        } else {
          for (const opt of opts) {
            const optText = getOptionText(opt).trim();
            if (optText === "") continue;
            const normOpt = normalizeText(optText);
            // Fuzzy match if either string is a substantial substring of the other
            if (normV === normOpt || normV.startsWith(normOpt) || normOpt.startsWith(normV)) {
              matchedOpt = opt;
              break;
            }
          }
        }

        if (matchedOpt && counts[matchedOpt] !== undefined) {
          key = matchedOpt;
        } else {
          // Free text grouping: use the first seen un-normalized text as the label for this group
          if (!normToLabel[normV]) {
            normToLabel[normV] = rawAnswer;
            counts[key] = 0;
          }
        }

        if (counts[key] === undefined) counts[key] = 0;
        counts[key] += 1;
        
        if (a[FIELDS.answers.correct]) correct += 1;
      }

      const total = given.length;
      const solution = String(q[FIELDS.question.correctAnswer] ?? "").trim();
      const normSolution = normalizeText(solution);
      
      const optionsWithCounts = Object.entries(counts).map(([key, count]) => {
        let label = key;
        if (["A", "B", "C", "D"].includes(key)) {
          const t = getOptionText(key).trim();
          if (t) label = t;
        } else {
          label = normToLabel[key] ?? key;
        }
        
        let isSolution = false;
        if (normalizeText(key) === normSolution || normalizeText(label) === normSolution) isSolution = true;
        if (solution.toUpperCase() === key) isSolution = true;
        
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

      let solutionText = solution;
      if (["A", "B", "C", "D"].includes(solution)) {
        const t = getOptionText(solution).trim();
        if (t) solutionText = t;
      }

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
    <Card className="surface p-5">
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
          <button 
            type="button"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-secondary hover:bg-accent hover:text-accent-foreground h-10 w-10 shrink-0" 
            onClick={() => setSortDesc(!sortDesc)}
          >
            {sortDesc ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
          </button>
        </div>
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
            <SetStats setKey={s.key} tableId={s.tableId} sortBy={sortBy} sortDesc={sortDesc} />
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}
