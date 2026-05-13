import { Header } from "@/components/Header";
import { Overview } from "@/components/Overview";
import { RankingTabs } from "@/components/RankingTabs";
import { QuestionStats } from "@/components/QuestionStats";
import { UserDetail } from "@/components/UserDetail";
import { useConfig } from "@/hooks/useBaserow";

const Index = () => {
  const { data: cfg } = useConfig();
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container py-8 space-y-6">
        {cfg?.mock && (
          <div className="rounded-md border border-warning/40 bg-warning/10 px-4 py-2 text-sm text-warning">
            Demo-Modus: Es werden Mock-Daten angezeigt. Konfiguriere <code className="font-mono">/config.json</code> bzw. die <code className="font-mono">.env</code> mit echten Tabellen-IDs.
          </div>
        )}
        <Overview />
        <RankingTabs />
        <div className="grid gap-6 lg:grid-cols-2">
          <QuestionStats />
          <UserDetail />
        </div>
        <footer className="pt-6 pb-10 text-center text-xs text-muted-foreground">
          quizalarm-stat · Daten aus Baserow · serverseitiger Proxy schützt den API-Token
        </footer>
      </main>
    </div>
  );
};

export default Index;
