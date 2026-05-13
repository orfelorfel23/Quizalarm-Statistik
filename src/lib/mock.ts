import { FIELDS } from "@/config/mappings";

const NAMES = ["Anna", "Ben", "Clara", "David", "Eva", "Felix", "Greta", "Hannes", "Ida", "Jonas", "Kim", "Lara"];
const SETS = ["A", "B", "C"];

function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

export function mockQuestions(setKey: string) {
  const r = rng(setKey.charCodeAt(0) * 17);
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    [FIELDS.question.id]: `${setKey}-${i + 1}`,
    [FIELDS.question.text]: `Beispielfrage ${setKey}.${i + 1}: Welche Antwort ist korrekt?`,
    [FIELDS.question.correctAnswer]: ["A", "B", "C", "D"][Math.floor(r() * 4)],
    [FIELDS.question.optionA]: "Antwort A",
    [FIELDS.question.optionB]: "Antwort B",
    [FIELDS.question.optionC]: "Antwort C",
    [FIELDS.question.optionD]: "Antwort D",
  }));
}

export function mockAnswers() {
  const out: Record<string, unknown>[] = [];
  let id = 1;
  const r = rng(42);
  for (const name of NAMES) {
    for (const set of SETS) {
      for (let q = 1; q <= 10; q++) {
        const correct = r() > 0.35;
        out.push({
          id: id++,
          [FIELDS.answers.user]: name,
          [FIELDS.answers.set]: set,
          [FIELDS.answers.questionId]: `${set}-${q}`,
          [FIELDS.answers.answer]: ["A", "B", "C", "D"][Math.floor(r() * 4)],
          [FIELDS.answers.correct]: correct,
          [FIELDS.answers.points]: correct ? Math.floor(r() * 500 + 500) : 0,
          [FIELDS.answers.timestamp]: new Date(Date.now() - Math.floor(r() * 1e7)).toISOString(),
        });
      }
    }
  }
  return out;
}
