import assert from "node:assert/strict";
import { test } from "node:test";
import {
  defaultDraft,
  draftFromUnknown,
  estimate,
  isCityId,
  minimumContributionYears,
  parseYearMonth,
  payoutMonthsForAge,
  statutoryPlan,
  syncDerived,
  tryEstimate,
  yearMonth,
  type CityId,
  type EstimateInput,
  type YearMonth,
} from "./domain.ts";

function ym(year: number, month: number): YearMonth {
  const value = yearMonth(year, month);
  if (!value) throw new Error(`bad month ${year}-${month}`);
  return value;
}

test("shanghai 2026-10 vector matches the captured jiao and fen figures", () => {
  const now = ym(2026, 10);
  const birth = ym(1986, 10);
  const plan = statutoryPlan("male", birth);
  assert.equal(plan.delayMonths, 36);
  assert.equal(plan.retirementMonth, "2049-10");
  assert.equal(plan.payoutMonths, 117);

  const draft = defaultDraft(now);
  assert.equal(draft.cityId, "shanghai");
  assert.equal(draft.birthMonth, "1986-10");
  assert.equal(draft.accountBalance, "80000");
  assert.equal(draft.paidMonths, "120");
  assert.equal(draft.baseAmount, "9000");
  assert.equal(draft.futureMonths, "276");
  assert.equal(draft.totalYears, "33");
  assert.equal(draft.payoutMonths, "117");
  assert.equal(draft.retirementMonth, "2049-10");

  const input: EstimateInput = {
    cityId: "shanghai",
    accountBalance: 80000,
    paidMonths: 120,
    futureMonths: 276,
    totalYears: 33,
    pastIndex: 1,
    beijingBreakMonths: 0,
    payoutMonths: 117,
    interestRatePct: 3,
    inflationRatePct: 1.5,
    retirementMonth: ym(2049, 10),
    contributionReference: 12577,
    pensionBase: 12577,
    futurePay: { mode: "base", monthlyBase: 9000 },
  };
  const result = estimate(input, now);
  assert.equal(result.basePension, 3739.1);
  assert.equal(result.personalPension, 3778.8);
  assert.equal(result.monthly, 7517.9);
  assert.ok(Math.abs(result.accountAtRetirement - 442114.66) < 0.005);
  assert.equal(result.creditedPrincipal, 198720);
  assert.ok(Math.abs(result.interestEarned - 163394.66) < 0.005);
  assert.equal(result.realMonthly, 5337.99);
  assert.equal(result.monthsToRetire, 276);

  const fromDraft = tryEstimate(draft, now);
  assert.equal(fromDraft.ok, true);
  if (fromDraft.ok) {
    assert.equal(fromDraft.result.monthly, 7517.9);
    assert.equal(fromDraft.result.realMonthly, 5337.99);
  }
});

test("guangdong coefficient is the index divided by 0.6 when the index is under 0.6", () => {
  const now = ym(2026, 10);
  const input: EstimateInput = {
    cityId: "guangdong",
    accountBalance: 0,
    paidMonths: 120,
    futureMonths: 0,
    totalYears: 10,
    pastIndex: 0.4,
    beijingBreakMonths: 0,
    payoutMonths: 139,
    interestRatePct: 0,
    inflationRatePct: 0,
    retirementMonth: now,
    contributionReference: 9201,
    pensionBase: 9493,
    futurePay: { mode: "base", monthlyBase: 5521 },
  };
  const result = estimate(input, now);
  assert.equal(result.averageIndex, 0.4);
  assert.ok(result.averageIndex < 0.6);
  assert.equal(result.coefficientA, 0.4 / 0.6);
  assert.equal(result.basePension, 506.29);
  assert.notEqual(result.basePension, 664.51);
});

test("beijing break months change only the index denominator", () => {
  const now = ym(2026, 10);
  const without = estimate(sample(now, "beijing", 0), now);
  const withBreak = estimate(sample(now, "beijing", 36), now);
  assert.equal(without.indexNumerator, 120);
  assert.equal(withBreak.indexNumerator, 120);
  assert.equal(without.indexDenominator, 120);
  assert.equal(withBreak.indexDenominator, 156);
  assert.equal(without.personalPension, withBreak.personalPension);
  assert.equal(without.accountAtRetirement, withBreak.accountAtRetirement);
  assert.notEqual(without.basePension, withBreak.basePension);

  const shanghaiWithout = estimate(sample(now, "shanghai", 0), now);
  const shanghaiWith = estimate(sample(now, "shanghai", 36), now);
  assert.equal(shanghaiWithout.averageIndex, shanghaiWith.averageIndex);
  assert.equal(shanghaiWithout.basePension, shanghaiWith.basePension);
  assert.equal(shanghaiWithout.indexDenominator, shanghaiWith.indexDenominator);
});

test("a year mismatch still returns a monthly amount", () => {
  const now = ym(2026, 10);
  const input: EstimateInput = {
    ...sample(now, "shanghai", 0),
    totalYears: 20,
  };
  const result = estimate(input, now);
  assert.equal(result.yearsMismatch, true);
  assert.equal(result.deemedMonths, 120);
  assert.ok(result.monthly > 0);
});

function sample(now: YearMonth, cityId: CityId, breakMonths: number): EstimateInput {
  const benchmarks =
    cityId === "beijing"
      ? { contributionReference: 12116, pensionBase: 12049 }
      : { contributionReference: 12577, pensionBase: 12577 };
  return {
    cityId,
    accountBalance: 10000,
    paidMonths: 120,
    futureMonths: 0,
    totalYears: 10,
    pastIndex: 1,
    beijingBreakMonths: breakMonths,
    payoutMonths: 139,
    interestRatePct: 0,
    inflationRatePct: 0,
    retirementMonth: now,
    contributionReference: benchmarks.contributionReference,
    pensionBase: benchmarks.pensionBase,
    futurePay: { mode: "base", monthlyBase: 8000 },
  };
}

test("female statutory retirement follows the delay anchors", () => {
  const earlier55 = statutoryPlan("female55", ym(1969, 12));
  assert.equal(earlier55.delayMonths, 0);
  assert.equal(earlier55.retirementMonth, "2024-12");
  assert.equal(earlier55.payoutMonths, 170);

  const first55 = statutoryPlan("female55", ym(1970, 1));
  assert.equal(first55.delayMonths, 1);
  assert.equal(first55.retirementMonth, "2025-02");

  const earlier50 = statutoryPlan("female50", ym(1974, 12));
  assert.equal(earlier50.delayMonths, 0);
  assert.equal(earlier50.retirementMonth, "2024-12");

  const first50 = statutoryPlan("female50", ym(1975, 1));
  assert.equal(first50.delayMonths, 1);
  assert.equal(first50.retirementMonth, "2025-02");
});

test("payout months interpolate leftover months and minimum years rise after 2029", () => {
  assert.equal(payoutMonthsForAge(55 * 12 + 6), 167);
  assert.equal(minimumContributionYears(2029), 15);
  assert.equal(minimumContributionYears(2030), 15.5);
  assert.equal(minimumContributionYears(2040), 20);
});

test("an out of range balance stops the estimate", () => {
  const now = ym(2026, 10);
  const outcome = tryEstimate({ ...defaultDraft(now), accountBalance: "-1" }, now);
  assert.equal(outcome.ok, false);
  if (outcome.ok) return;
  assert.match(outcome.errors.accountBalance ?? "", /0 到 10 亿/);
});

test("linked future months follow a later now and a hand-edited count stays", () => {
  const now = ym(2026, 10);
  const draft = defaultDraft(now);
  const later = syncDerived(draft, ym(2026, 11));
  assert.equal(later.retirementMonth, draft.retirementMonth);
  assert.equal(later.futureMonths, "275");
  const manual = syncDerived({ ...draft, futureMonthsLinked: false, futureMonths: "10" }, ym(2026, 11));
  assert.equal(manual.futureMonths, "10");
});

test("a saved draft keeps its fields when one new field is missing", () => {
  const now = ym(2026, 10);
  const saved = defaultDraft(now);
  const withoutPastIndex: Record<string, unknown> = { ...saved };
  delete withoutPastIndex.pastIndex;
  const merged = draftFromUnknown(withoutPastIndex, now);
  assert.ok(merged);
  assert.equal(merged.pastIndex, "1");
  assert.equal(merged.accountBalance, "80000");
  assert.equal(merged.birthMonth, saved.birthMonth);
  assert.equal(draftFromUnknown({ ...saved, cityId: "atlantis" }, now), null);
  assert.equal(parseYearMonth("2049-13"), null);
  assert.equal(isCityId("shenzhen"), true);
  assert.equal(isCityId("atlantis"), false);
});

