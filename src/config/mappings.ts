// Hard-coded mapping of Baserow column names (user_field_names=true).
// Tabellenstruktur ist stabil – Spaltennamen exakt wie in den Baserow-CSV-Exporten.
// Falls eine Spalte abweicht, hier anpassen und Container neu bauen.

export const FIELDS = {
  // Antworten-Tabelle (eine Zeile pro abgegebener Antwort)
  answers: {
    user: "Nutzername",       // Teilnehmername
    set: "Fragenset",         // z.B. "JLM 2026 AK A"
    questionId: "Frage_ID",   // Verknüpfung zur Fragentabelle
    answer: "Antwort",        // gegebene Antwort (Buchstabe oder Text)
    correct: "Richtig",       // boolean / checkbox
    points: "Punkte",         // Zahl
    timestamp: "Zeitstempel",
  },
  // Fragenset-Tabellen (eine Zeile pro Frage)
  question: {
    id: "id",                 // Baserow-Zeilen-ID (kein eigenes Feld)
    text: "Frage",
    correctAnswer: "Richtige Antwort",
    optionA: "Antwort A",
    optionB: "Antwort B",
    optionC: "Antwort C",
    optionD: "Antwort D",
    image: "Bild",
  },
} as const;

export type AnswerRow = {
  id: number;
  [k: string]: unknown;
};
