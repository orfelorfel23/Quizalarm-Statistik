import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAnswers } from "@/hooks/useBaserow";
import { FIELDS } from "@/config/mappings";
import { User } from "lucide-react";
import { useMemo, useState } from "react";

export function UserDetail() {
  const { data: answers = [] } = useAnswers();

  const users = useMemo(() => {
    const set = new Set<string>();
    for (const a of answers) set.add(String((a as any)[FIELDS.answers.user] ?? ""));
    return [...set].filter(Boolean).sort();
  }, [answers]);

  const [sel, setSel] = useState<string>("");
  const current = sel || users[0] || "";

  const rows = useMemo(
    () => answers.filter((a: any) => String(a[FIELDS.answers.user]) === current),
    [answers, current],
  );

  const totalPts = rows.reduce((s: number, a: any) => s + Number(a[FIELDS.answers.points] ?? 0), 0);
  const correct = rows.filter((a: any) => a[FIELDS.answers.correct]).length;

  return (
    <Card className="surface p-5">
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="font-display text-2xl tracking-wide">Nutzer-Detail</h2>
        </div>
        <Select value={current} onValueChange={setSel}>
          <SelectTrigger className="w-56 bg-secondary border-border"><SelectValue placeholder="Teilnehmer wählen" /></SelectTrigger>
          <SelectContent>
            {users.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!current ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Noch keine Teilnehmer.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-md bg-secondary p-3"><p className="text-xs text-muted-foreground uppercase tracking-wider">Antworten</p><p className="stat-num">{rows.length}</p></div>
            <div className="rounded-md bg-secondary p-3"><p className="text-xs text-muted-foreground uppercase tracking-wider">Korrekt</p><p className="stat-num text-success">{correct}</p></div>
            <div className="rounded-md bg-primary text-primary-foreground p-3"><p className="text-xs uppercase tracking-wider opacity-80">Punkte</p><p className="stat-num">{totalPts}</p></div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Set</TableHead>
                <TableHead>Frage</TableHead>
                <TableHead>Antwort</TableHead>
                <TableHead className="text-right">Punkte</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">{String(a[FIELDS.answers.set])}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{String(a[FIELDS.answers.questionId])}</TableCell>
                  <TableCell className={a[FIELDS.answers.correct] ? "text-success font-semibold" : "text-destructive"}>
                    {String(a[FIELDS.answers.answer] ?? "—")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{Number(a[FIELDS.answers.points] ?? 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </Card>
  );
}
