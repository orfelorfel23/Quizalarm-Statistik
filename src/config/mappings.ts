// Hard-coded mapping of Baserow column names (user_field_names=true).
// Tabellenstruktur ist stabil – Spaltennamen exakt wie in den Baserow-CSV-Exporten.
// Falls eine Spalte abweicht, hier anpassen und Container neu bauen.

export const FIELDS = {
  // Antworten-Tabelle (eine Zeile pro abgegebener Antwort)
  answers: {
    user: "Name",            // Teilnehmername
    set: "Set",              // "A" | "B" | "C" | ...
    questionId: "Frage_ID",  // Verknüpfung zur Fragentabelle
    answer: "Antwort",       // gegebene Antwort (Buchstabe oder Text)
    correct: "Korrekt",      // boolean / checkbox
    points: "Punkte",        // Zahl
    timestamp: "Zeitstempel",
  },
  // Fragenset-Tabellen (eine Zeile pro Frage)
  question: {
    id: "Frage_ID",
    text: "Frage",
    correctAnswer: "Loesung",
    optionA: "A",
    optionB: "B",
    optionC: "C",
    optionD: "D",
  },
} as const;

export type AnswerRow = {
  id: number;
  [k: string]: unknown;
};
