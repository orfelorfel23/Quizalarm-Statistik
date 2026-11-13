export interface TeamAuthSession {
  teamId: number;
  teamName: string;
  participants: string[];
}

const STORAGE_KEY = "quizalarm_team_session";

export function getStoredSession(): TeamAuthSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(session: TeamAuthSession): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.error("Failed to save session", e);
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear session", e);
  }
}
