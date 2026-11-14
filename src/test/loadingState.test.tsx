import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FIELDS } from "@/config/mappings";
import { RankingTabs } from "@/components/RankingTabs";
import { Overview } from "@/components/Overview";
import { UserDetail } from "@/components/UserDetail";
import { QuestionStats } from "@/components/QuestionStats";

const mockUseConfig = vi.fn();
const mockUseAnswers = vi.fn();
const mockUseQuestions = vi.fn();

vi.mock("@/hooks/useBaserow", () => ({
  useConfig: () => mockUseConfig(),
  useAnswers: () => mockUseAnswers(),
  useQuestions: (...args: unknown[]) => mockUseQuestions(...args),
  useTeamParticipants: () => ({ data: [] }),
}));

const sampleConfig = {
  siteTitle: "Quizalarm",
  siteSubtitle: "Test",
  tables: {
    answers: 1,
    sets: [{ key: "A", label: "Fragenset A", tableId: 2 }],
  },
  pollIntervalMs: 20000,
  mock: false,
};

describe("Loading states while fetching Baserow data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConfig.mockReturnValue({ data: sampleConfig, isPending: false });
    mockUseQuestions.mockReturnValue({ data: [], isPending: false, isError: false });
  });

  it("RankingTabs shows spinner instead of 'Noch keine Antworten.' while loading", () => {
    mockUseAnswers.mockReturnValue({ data: undefined, isPending: true, isError: false });
    render(<RankingTabs />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Antworten werden geladen...")).toBeInTheDocument();
    expect(screen.queryByText("Noch keine Antworten.")).not.toBeInTheDocument();
  });

  it("RankingTabs shows 'Noch keine Antworten.' when loaded and actually empty", () => {
    mockUseAnswers.mockReturnValue({ data: [], isPending: false, isError: false });
    render(<RankingTabs />);

    expect(screen.getByText("Noch keine Antworten.")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("RankingTabs shows ranking table when answers are loaded", () => {
    mockUseAnswers.mockReturnValue({
      data: [{ id: 1, [FIELDS.answers.user]: "Max", [FIELDS.answers.set]: "A", [FIELDS.answers.points]: 10, [FIELDS.answers.correct]: true }],
      isPending: false,
      isError: false,
    });
    render(<RankingTabs />);

    expect(screen.getByText("Max")).toBeInTheDocument();
    expect(screen.queryByText("Noch keine Antworten.")).not.toBeInTheDocument();
  });

  it("RankingTabs shows error message when loading answers fails", () => {
    mockUseAnswers.mockReturnValue({ data: undefined, isPending: false, isError: true });
    render(<RankingTabs />);

    expect(screen.getByText("Fehler beim Laden der Antworten.")).toBeInTheDocument();
    expect(screen.queryByText("Noch keine Antworten.")).not.toBeInTheDocument();
  });

  it("UserDetail shows loading state instead of 'Noch keine Teilnehmer.' while answers load", () => {
    mockUseAnswers.mockReturnValue({ data: undefined, isPending: true, isError: false });
    render(<UserDetail />);

    expect(screen.getByText("Antworten werden geladen...")).toBeInTheDocument();
    expect(screen.queryByText("Noch keine Teilnehmer.")).not.toBeInTheDocument();
  });

  it("QuestionStats shows loading state instead of 'Keine Fragen.' while questions or answers load", () => {
    mockUseAnswers.mockReturnValue({ data: undefined, isPending: true, isError: false });
    mockUseQuestions.mockReturnValue({ data: undefined, isPending: true, isError: false });
    render(<QuestionStats />);

    expect(screen.getByText("Fragen und Antworten werden geladen...")).toBeInTheDocument();
    expect(screen.queryByText("Keine Fragen.")).not.toBeInTheDocument();
  });

  it("Overview shows loading spinners instead of 0 while answers load", () => {
    mockUseAnswers.mockReturnValue({ data: undefined, isPending: true, isError: false });
    render(<Overview />);

    expect(screen.getAllByRole("status")).toHaveLength(3);
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
  });
});
