import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAnswers, useConfig, useQuestions } from "@/hooks/useBaserow";
import { FIELDS } from "@/config/mappings";
import { User } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

function UserDetailTable({ rows, setKey, tableId }: { rows: any[]; setKey: string; tableId: number }) {
  const { data: questions = [] } = useQuestions(setKey, tableId);
  const totalPts = rows.reduce((s, a) => s + Number(a[FIELDS.answers.points] ?? 0), 0);
  const correct = rows.filter((a) => a[FIELDS.answers.correct]).length;

  return (
    <>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-md bg-secondary p-3"><p className="text-xs text-muted-foreground uppercase tracking-wider">Antworten</p><p className="stat-num">{rows.length}</p></div>
        <div className="rounded-md bg-secondary p-3"><p className="text-xs text-muted-foreground uppercase tracking-wider">Korrekt</p><p className="stat-num text-success">{correct}</p></div>
        <div className="rounded-md bg-primary text-primary-foreground p-3"><p className="text-xs uppercase tracking-wider opacity-80">Punkte</p><p className="stat-num">{totalPts}</p></div>
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Frage</TableHead>
              <TableHead>Gegebene Antwort</TableHead>
              <TableHead className="text-right">Punkte</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((a: any) => {
              const qid = String(a[FIELDS.answers.questionId]);
              const q = questions.find((x: any) => String(x[FIELDS.question.id]) === qid);
              const qText = q ? String(q[FIELDS.question.text] ?? qid) : qid;
              const isCorrect = a[FIELDS.answers.correct];
              let given = String(a[FIELDS.answers.answer] ?? "—");
              let expected = q ? String(q[FIELDS.question.correctAnswer] ?? "") : "";
              
              // Map letter to full text for the expected answer
              if (expected === "A") expected = String(q[FIELDS.question.optionA] ?? "A");
              else if (expected === "B") expected = String(q[FIELDS.question.optionB] ?? "B");
              else if (expected === "C") expected = String(q[FIELDS.question.optionC] ?? "C");
              else if (expected === "D") expected = String(q[FIELDS.question.optionD] ?? "D");

              // Map letter to full text for given answer
              if (given.toUpperCase() === "A") given = String(q?.[FIELDS.question.optionA] ?? "A");
              else if (given.toUpperCase() === "B") given = String(q?.[FIELDS.question.optionB] ?? "B");
              else if (given.toUpperCase() === "C") given = String(q?.[FIELDS.question.optionC] ?? "C");
              else if (given.toUpperCase() === "D") given = String(q?.[FIELDS.question.optionD] ?? "D");

              return (
                <TableRow key={a.id}>
                  <TableCell className="font-medium text-sm leading-snug w-1/2">{qText}</TableCell>
                  <TableCell>
                    {isCorrect ? (
                      <span className="text-success font-semibold">{given}</span>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-destructive line-through decoration-destructive/50">{given}</p>
                        <p className="text-xs text-muted-foreground">Richtig: <span className="text-success font-medium">{expected}</span></p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{Number(a[FIELDS.answers.points] ?? 0)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export function UserDetail() {
  const { data: answers = [] } = useAnswers();
  const { data: cfg } = useConfig();
  const availableSets = cfg?.tables.sets ?? [];

  const users = useMemo(() => {
    const set = new Set<string>();
    for (const a of answers) set.add(String((a as any)[FIELDS.answers.user] ?? ""));
    return [...set].filter(Boolean).sort();
  }, [answers]);

  const [selUser, setSelUser] = useState<string>("");
  const current = selUser || users[0] || "";

  // Get sets that the user has played
  const userSets = useMemo(() => {
    if (!current) return [];
    const played = new Set<string>();
    for (const a of answers) {
      if (String((a as any)[FIELDS.answers.user]) === current) {
        played.add(String((a as any)[FIELDS.answers.set]));
      }
    }
    // Match played strings to set config
    return availableSets.filter(s => [...played].some(p => p.trim().endsWith(s.key)));
  }, [answers, current, availableSets]);

  const [selSetKey, setSelSetKey] = useState<string>("");

  // Default to the latest played set
  useEffect(() => {
    if (current && userSets.length > 0 && !userSets.find(s => s.key === selSetKey)) {
      // Find the latest answer timestamp to pick default set
      const userAnswers = answers.filter((a: any) => String(a[FIELDS.answers.user]) === current);
      let latestSet = userSets[0].key;
      let latestTime = 0;
      for (const a of userAnswers) {
        const t = new Date(String((a as any)[FIELDS.answers.timestamp] ?? 0)).getTime();
        if (t > latestTime) {
          latestTime = t;
          const sLabel = String((a as any)[FIELDS.answers.set]).trim();
          const match = userSets.find(s => sLabel.endsWith(s.key));
          if (match) latestSet = match.key;
        }
      }
      setSelSetKey(latestSet);
    }
  }, [current, userSets, selSetKey, answers]);

  const currentSet = userSets.find(s => s.key === selSetKey) || userSets[0];

  const rows = useMemo(() => {
    if (!current || !currentSet) return [];
    return answers.filter((a: any) => 
      String(a[FIELDS.answers.user]) === current && 
      String(a[FIELDS.answers.set]).trim().endsWith(currentSet.key)
    );
  }, [answers, current, currentSet]);

  return (
    <Card className="surface p-5">
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="font-display text-2xl tracking-wide">Nutzer-Detail</h2>
        </div>
        <div className="flex items-center gap-2">
          <Select value={current} onValueChange={setSelUser}>
            <SelectTrigger className="w-48 bg-secondary border-border"><SelectValue placeholder="Teilnehmer wählen" /></SelectTrigger>
            <SelectContent>
              {users.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
          
          {currentSet && (
            <Select value={currentSet.key} onValueChange={setSelSetKey}>
              <SelectTrigger className="w-40 bg-secondary border-border"><SelectValue placeholder="Set wählen" /></SelectTrigger>
              <SelectContent>
                {userSets.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {!current ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Noch keine Teilnehmer.</p>
      ) : !currentSet ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Teilnehmer hat noch kein Set gespielt.</p>
      ) : (
        <UserDetailTable rows={rows} setKey={currentSet.key} tableId={currentSet.tableId} />
      )}
    </Card>
  );
}
