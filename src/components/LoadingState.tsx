import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  label?: string;
}

/**
 * Centered loading spinner with label for pending data fetches.
 */
export function LoadingState({ label = "Daten werden geladen..." }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="py-10 flex flex-col items-center justify-center gap-3 text-muted-foreground"
    >
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
