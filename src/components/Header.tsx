import { useConfig } from "@/hooks/useBaserow";
import { TeamAuthSession } from "@/lib/auth";
import { Flame, LogOut, Users } from "lucide-react";
import { useEffect } from "react";

interface HeaderProps {
  session?: TeamAuthSession | null;
  onLogout?: () => void;
}

export function Header({ session, onLogout }: HeaderProps) {
  const { data: cfg } = useConfig();
  const title = cfg?.siteTitle ?? "Quizalarm Auswertung";
  const sub = cfg?.siteSubtitle ?? "";

  useEffect(() => {
    if (cfg?.siteTitle) document.title = cfg.siteTitle;
  }, [cfg?.siteTitle]);

  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
      <div className="container flex items-center justify-between gap-2 py-3 sm:py-4">
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
          <div className="grid h-10 w-10 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
            <Flame className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-xl sm:text-3xl tracking-wide leading-none glow-text truncate">{title}</h1>
            {sub && <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">{sub}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {session && (
            <>
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-secondary/80 border border-border text-xs">
                <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-muted-foreground hidden md:inline">Team:</span>
                <span className="font-semibold text-foreground max-w-[90px] sm:max-w-[200px] truncate">
                  {session.teamName}
                </span>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-border hover:bg-secondary/80 hover:text-foreground text-xs text-muted-foreground transition"
                  title="Abmelden"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Abmelden</span>
                </button>
              )}
            </>
          )}
          <img
            src="/wappen.png"
            alt="Freiwillige Feuerwehr Olbernhau-Niederneuschönberg"
            className="h-9 sm:h-11 w-auto select-none pointer-events-none shrink-0"
            style={{ filter: "drop-shadow(0 0 6px rgba(255, 255, 255, 0.22))" }}
          />
        </div>
      </div>
    </header>
  );
}
