import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TeamAuthSession, saveSession } from "@/lib/auth";
import { useConfig } from "@/hooks/useBaserow";
import { Search, Lock, ShieldAlert, KeyRound, ArrowRight, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";

interface TeamItem {
  id: number;
  name: string;
  hasPassword: boolean;
  participants: string[];
}

interface TeamLoginProps {
  onLoginSuccess: (session: TeamAuthSession) => void;
}

export function TeamLogin({ onLoginSuccess }: TeamLoginProps) {
  const { data: cfg } = useConfig();
  const apiBase = cfg?.quizalarmApiUrl || "https://quizalarm.orfel.de";

  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<TeamItem | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadTeams() {
      setLoadingTeams(true);
      setFetchError(null);
      try {
        const res = await fetch(`${apiBase}/api/teams`);
        if (!res.ok) {
          throw new Error(`Server antwortete mit Status ${res.status}`);
        }
        const data = await res.json();
        if (isMounted) {
          const list = Array.isArray(data) ? data : (data?.teams || []);
          setTeams(list);
        }
      } catch (err: any) {
        if (isMounted) {
          setFetchError(err.message || "Fehler beim Laden der Teams");
        }
      } finally {
        if (isMounted) setLoadingTeams(false);
      }
    }
    loadTeams();
    return () => {
      isMounted = false;
    };
  }, [apiBase]);

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleSelectTeam = (team: TeamItem) => {
    setSelectedTeam(team);
    setPassword("");
    setAuthError(null);
  };

  const handleBackToTeams = () => {
    setSelectedTeam(null);
    setPassword("");
    setAuthError(null);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    if (!password) {
      setAuthError("Bitte gib das Passwort ein.");
      return;
    }

    setSubmitting(true);
    setAuthError(null);

    try {
      const res = await fetch(`${apiBase}/api/teams/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: selectedTeam.id,
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 401 || data.error?.includes("Passwort")) {
          setAuthError("Falsches Passwort. Bitte überprüfe deine Eingabe.");
        } else {
          setAuthError(data.error || "Anmeldung fehlgeschlagen. Bitte erneut versuchen.");
        }
        return;
      }

      const session: TeamAuthSession = {
        teamId: data.teamId,
        teamName: data.teamName,
        participants: data.participants || [],
      };

      saveSession(session);
      onLoginSuccess(session);
    } catch (err: any) {
      setAuthError(err.message || "Netzwerkfehler bei der Anmeldung.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestPasswordRedirect = (teamName: string) => {
    window.location.href = `${apiBase}/?feedback=1&team=${encodeURIComponent(teamName)}`;
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg surface border-border/80 shadow-2xl backdrop-blur-md">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary/20 text-primary border border-primary/30 shadow-[var(--shadow-glow)]">
            <KeyRound className="h-7 w-7" />
          </div>
          <CardTitle className="font-display text-2xl tracking-wide">
            Teamleiter Anmeldung
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Wähle dein Team oder deine Feuerwehr aus, um die Statistiken und Ergebnisse deiner Teilnehmer einzusehen.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {loadingTeams ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Teams werden geladen...</p>
            </div>
          ) : fetchError ? (
            <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm text-center space-y-3">
              <p>Fehler beim Laden der Teams: {fetchError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg font-medium text-xs transition"
              >
                Erneut versuchen
              </button>
            </div>
          ) : !selectedTeam ? (
            /* ---- STEP 1: Search & Select Team ---- */
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Team / Feuerwehr suchen..."
                  className="w-full pl-10 pr-4 py-3 bg-secondary/80 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition text-sm"
                  autoFocus
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/20">
                {filteredTeams.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    Kein Team gefunden{search ? ` für "${search}"` : ""}.
                  </div>
                ) : (
                  filteredTeams.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => handleSelectTeam(team)}
                      className="w-full text-left p-3 rounded-xl hover:bg-secondary/80 transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">🚒</span>
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors text-sm">
                          {team.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {team.hasPassword ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] flex items-center gap-1">
                            <Lock className="h-3 w-3" /> PW aktiv
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px]">
                            Kein PW
                          </span>
                        )}
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : !selectedTeam.hasPassword ? (
            /* ---- STEP 2A: Team has NO password -> Redirect to Feedback ---- */
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-base text-amber-400">
                  <ShieldAlert className="h-5 w-5 shrink-0" />
                  <span>Kein Passwort hinterlegt</span>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Für <strong>{selectedTeam.name}</strong> ist aktuell noch kein Teamleiter-Passwort hinterlegt.
                  Fordere jetzt kostenlos ein Passwort über das Feedback-Formular an.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleRequestPasswordRedirect(selectedTeam.name)}
                  className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-900/40 transition"
                >
                  <span>Passwort jetzt anfordern</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={handleBackToTeams}
                  className="w-full py-2.5 text-xs text-muted-foreground hover:text-foreground transition flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Anderes Team wählen</span>
                </button>
              </div>
            </div>
          ) : (
            /* ---- STEP 2B: Team HAS password -> Enter Password ---- */
            <form onSubmit={handlePasswordSubmit} className="space-y-4 py-2">
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Ausgewähltes Team
                  </p>
                  <p className="font-semibold text-foreground text-sm flex items-center gap-1.5 mt-0.5">
                    <span>🚒</span> {selectedTeam.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleBackToTeams}
                  className="text-xs text-primary hover:underline px-2 py-1"
                >
                  Ändern
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block">
                  Teamleiter-Passwort
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Passwort eingeben..."
                    disabled={submitting}
                    className="w-full px-4 py-3 bg-secondary/80 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition text-sm pr-11"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="p-3 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-xs space-y-1">
                  <p className="font-semibold">{authError}</p>
                  <button
                    type="button"
                    onClick={() => handleRequestPasswordRedirect(selectedTeam.name)}
                    className="text-[11px] underline text-destructive/90 hover:text-destructive"
                  >
                    Passwort vergessen? Hier über Feedback anfordern →
                  </button>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting || !password.trim()}
                  className="w-full py-3.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/30 transition"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Überprüfe...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Anmelden & Statistiken freischalten</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleBackToTeams}
                    className="text-xs text-muted-foreground hover:text-foreground transition flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>Zurück</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRequestPasswordRedirect(selectedTeam.name)}
                    className="text-xs text-muted-foreground hover:text-foreground transition"
                  >
                    Passwort vergessen?
                  </button>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
