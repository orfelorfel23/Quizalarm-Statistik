import { Header } from "@/components/Header";
import { Overview } from "@/components/Overview";
import { RankingTabs } from "@/components/RankingTabs";
import { QuestionStats } from "@/components/QuestionStats";
import { UserDetail } from "@/components/UserDetail";
import { useConfig } from "@/hooks/useBaserow";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        <Tabs defaultValue="ranking" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-secondary">
            <TabsTrigger value="ranking" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Ranking</TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Frage-Statistik</TabsTrigger>
            <TabsTrigger value="user" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Nutzer-Detail</TabsTrigger>
          </TabsList>
          <TabsContent value="ranking" className="mt-0">
            <RankingTabs />
          </TabsContent>
          <TabsContent value="stats" className="mt-0">
            <QuestionStats />
          </TabsContent>
          <TabsContent value="user" className="mt-0">
            <UserDetail />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
