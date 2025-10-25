
export enum GameState {
  Home,
  PracticeSetup,
  InGame,
  Results,
}

export enum WritingCategory {
    Narrative = "Narrative",
    Persuasive = "Persuasive",
    Informative = "Informative",
    Editing = "Editing",
}

export interface Prompt {
    category: string;
    text: string;
}

export interface ScoringCriterion {
    id: string;
    name: string;
    description: string;
    points: number;
    check: (text: string) => number;
}

export interface ScoreAnalysis {
    totalScore: number;
    breakdown: { id: string; name: string; count: number; score: number }[];
    highestScoring: { name: string; score: number };
    lowestScoring: { name: string; score: number };
}
