import { useConfig } from "@/hooks/useBaserow";
import { Flame } from "lucide-react";
import { useEffect } from "react";

export function Header() {
  const { data: cfg } = useConfig();
  const title = cfg?.siteTitle ?? "Quizalarm Auswertung";
  const sub = cfg?.siteSubtitle ?? "";

  useEffect(() => {
    if (cfg?.siteTitle) document.title = cfg.siteTitle;
  }, [cfg?.siteTitle]);

  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
      <div className="container flex items-center justify-between py-5">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-md bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
            <Flame className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-display text-3xl tracking-wide leading-none glow-text">{title}</h1>
            {sub && <p className="text-sm text-muted-foreground mt-1">{sub}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse-dot" />
          Live
        </div>
      </div>
    </header>
  );
}
