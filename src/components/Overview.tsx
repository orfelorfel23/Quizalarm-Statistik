import { Card } from "@/components/ui/card";
import { useAnswers, useConfig } from "@/hooks/useBaserow";
import { FIELDS } from "@/config/mappings";
import { Users, ListChecks, Target, Zap } from "lucide-react";

function Stat({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent?: boolean }) {
  return (
    <Card className="surface p-5 flex items-center gap-4">
      <div className={`grid h-12 w-12 place-items-center rounded-md ${accent ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="stat-num">{value}</p>
      </div>
    </Card>
  );
}

export function Overview() {
  const { data: cfg } = useConfig();
  const { data: answers = [] } = useAnswers();

  const users = new Set(answers.map((a: any) => a[FIELDS.answers.user])).size;
  const total = answers.length;
  const correct = answers.filter((a: any) => a[FIELDS.answers.correct]).length;
  const rate = total ? Math.round((correct / total) * 100) : 0;
  const sets = cfg?.tables.sets.length ?? 0;

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat icon={Users} label="Teilnehmer" value={users} accent />
      <Stat icon={ListChecks} label="Antworten" value={total} />
      <Stat icon={Target} label="Korrekt-Quote" value={`${rate}%`} />
      <Stat icon={Zap} label="Fragensets" value={sets} />
    </section>
  );
}
