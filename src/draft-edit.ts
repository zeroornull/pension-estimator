import { indexToYearMonth, monthIndex, parseYearMonth, type Draft, type YearMonth } from "./domain.ts";

export function ageToBirth(draft: Draft, now: YearMonth): Draft {
  const text = draft.currentAge.trim();
  if (text === "") return draft;
  const age = Number(text);
  if (!Number.isInteger(age)) return draft;
  return { ...draft, birthMonth: indexToYearMonth(monthIndex(now) - age * 12) };
}

export function birthToAge(draft: Draft, now: YearMonth): Draft {
  const birth = parseYearMonth(draft.birthMonth);
  if (!birth) return draft;
  return { ...draft, currentAge: String(Math.floor((monthIndex(now) - monthIndex(birth)) / 12)) };
}
