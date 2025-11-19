export const SCENARIO_MULTIPLIERS = {
  optimized: 0.6,
  standard: 0.8,
  premium: 1.04,
} as const;

export const COMPLEXITY_MULTIPLIERS = {
  simple: 0.8,
  moderate: 1.2,
  complex: 1.6,
  enterprise: 2.4,
} as const;

export const AGENT_MULTIPLIERS = {
  single: 0.8,
  multi: 1.2,
  orchestrated: 1.6,
} as const;

// Pricing: 100 Credits = $1, therefore 1 Credit = $0.01
export const CREDIT_PRICE = 0.01;

// Token estimation: 1 token = ~4 characters (varies by model tokenizer)
export const CHARACTERS_PER_TOKEN = 4;

export type ScenarioType = keyof typeof SCENARIO_MULTIPLIERS;
export type ComplexityType = keyof typeof COMPLEXITY_MULTIPLIERS;
export type AgentType = keyof typeof AGENT_MULTIPLIERS;

export interface CalculatorState {
  scenario: ScenarioType;
  complexity: ComplexityType;
  agentType: AgentType;
  registrationsPerDay: number;
  workingDaysPerMonth: number;
  baseCredits: number;
}

export function calculateCreditsPerTransaction(state: CalculatorState): number {
  return (
    state.baseCredits *
    COMPLEXITY_MULTIPLIERS[state.complexity] *
    AGENT_MULTIPLIERS[state.agentType] *
    SCENARIO_MULTIPLIERS[state.scenario]
  );
}

export function calculateMonthlyCredits(state: CalculatorState): number {
  const creditsPerTransaction = calculateCreditsPerTransaction(state);
  return creditsPerTransaction * state.registrationsPerDay * state.workingDaysPerMonth;
}

export function calculateMonthlyCost(state: CalculatorState): number {
  return calculateMonthlyCredits(state) * CREDIT_PRICE;
}

export function calculateDailyCost(state: CalculatorState): number {
  return calculateMonthlyCost(state) / state.workingDaysPerMonth;
}

export function calculateAnnualCost(state: CalculatorState): number {
  return calculateMonthlyCost(state) * 12;
}

export function generateForecast(
  currentMonthlyCost: number,
  months: number,
  growthRate: number = 0.05
): number[] {
  const forecast: number[] = [];
  for (let i = 0; i < months; i++) {
    forecast.push(currentMonthlyCost * Math.pow(1 + growthRate, i));
  }
  return forecast;
}

// Token/Character conversion utilities
export function estimateTokensFromCharacters(characters: number): number {
  return Math.ceil(characters / CHARACTERS_PER_TOKEN);
}

export function estimateCharactersFromTokens(tokens: number): number {
  return tokens * CHARACTERS_PER_TOKEN;
}
