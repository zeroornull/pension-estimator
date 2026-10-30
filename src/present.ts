import {
  CITY_BY_ID,
  formatAge,
  parseYearMonth,
  statutoryPlan,
  type Draft,
  type EstimateInput,
  type EstimateResult,
  type YearMonth,
} from "./domain.ts";

export function yuan(value: number, digits: number): string {
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function indexText(value: number): string {
  return value.toLocaleString("zh-CN", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

export function factorText(value: number): string {
  return value.toLocaleString("zh-CN", { maximumFractionDigits: 6 });
}

export function yearsText(value: number): string {
  return value.toLocaleString("zh-CN", { maximumFractionDigits: 4 });
}

function chineseMonth(value: YearMonth): string {
  return `${Number(value.slice(0, 4))}年${Number(value.slice(5, 7))}月`;
}

export function formulaLines(input: EstimateInput, result: EstimateResult): string[] {
  const componentDigits = result.roundUpToJiao ? 1 : 2;
  const denominator =
    result.breakMonths > 0
      ? `${input.paidMonths} + ${input.futureMonths} + 视同 ${result.deemedMonths} + 断缴 ${result.breakMonths}`
      : `${input.paidMonths} + ${input.futureMonths} + 视同 ${result.deemedMonths}`;
  const coefficient =
    result.coefficientA === 1
      ? "系数是 1。"
      : `平均指数低于 0.6，系数是指数除以 0.6，这次是 ${factorText(result.coefficientA)}。`;
  return [
    `以后的月缴费基数是 ${yuan(result.futureBase, 2)} 元，缴费指数是 ${indexText(result.futureIndex)}。`,
    `个人账户每月记入 ${yuan(result.monthlyCredit, 2)} 元，按基数的 8% 计算。`,
    `平均指数 = (${input.paidMonths} × ${indexText(input.pastIndex)} + ${input.futureMonths} × ${indexText(result.futureIndex)} + 视同 ${result.deemedMonths}) / (${denominator}) = ${factorText(result.averageIndex)}。`,
    coefficient,
    `基础养老金 = ${yuan(input.pensionBase, 2)} × (${factorText(result.coefficientA)} + ${factorText(result.averageIndex)}) / 2 × ${yearsText(input.totalYears)} × 1% = ${yuan(result.basePension, componentDigits)} 元。`,
    `个人账户养老金 = ${yuan(result.accountAtRetirement, 2)} / ${factorText(input.payoutMonths)} = ${yuan(result.personalPension, componentDigits)} 元。`,
    `每月名义金额 = ${yuan(result.basePension, componentDigits)} + ${yuan(result.personalPension, componentDigits)} = ${yuan(result.monthly, componentDigits)} 元。`,
    `今天的购买力 = ${yuan(result.monthly, componentDigits)} ÷ ${factorText(1 + input.inflationRatePct / 100)} 的 ${result.monthsToRetire}/12 次方 = ${yuan(result.realMonthly, 2)} 元。`,
  ];
}

export function spanNote(draft: Draft, input: EstimateInput, result: EstimateResult, now: YearMonth): string {
  const retirement = parseYearMonth(draft.retirementMonth);
  const when = retirement ? chineseMonth(retirement) : "退休年月";
  const distance = `${when}退休，距 ${chineseMonth(now)} 还有 ${result.monthsToRetire} 个月。计发月数 ${factorText(input.payoutMonths)}。`;
  const birth = parseYearMonth(draft.birthMonth);
  if (draft.retirementMode !== "statutory" || !birth) return `${distance} 退休年月是手填的。`;
  const plan = statutoryPlan(draft.workerType, birth);
  const delay = plan.delayMonths === 0 ? "没有延迟。" : `比原 ${plan.originalAge} 岁晚 ${plan.delayMonths} 个月。`;
  return `${distance}法定年龄 ${formatAge(plan.ageMonths)}，${delay}`;
}

export function delayNote(draft: Draft): string {
  if (draft.retirementMode !== "statutory") return "手填退休年月后，计发月数和后续月数可以单独改。";
  const birth = parseYearMonth(draft.birthMonth);
  if (!birth) return "";
  const plan = statutoryPlan(draft.workerType, birth);
  const delay = plan.delayMonths === 0 ? "没有延迟" : `晚 ${plan.delayMonths} 个月`;
  return `法定退休年龄 ${formatAge(plan.ageMonths)}，${delay}。改出生年月或职工类别时，退休年月会跟着变。`;
}

export function benchmarkNote(draft: Draft): string {
  const selected = CITY_BY_ID[draft.cityId];
  if (draft.cityId === "other") return "其他城市没有预置基准。两个数都要自己填。月缴费基数不套用上下限。";
  const range = `月缴费基数的上下限是 ${yuan(selected.minBase, 2)} 到 ${yuan(selected.maxBase, 2)} 元。`;
  if (selected.pensionBase === null) return `${selected.name}没有预置计发基数，需要自己填。${range}`;
  return `${range}换城市会换成当地基准，你填的余额和缴费方式会留下。`;
}

export function roundingNote(name: string, roundUpToJiao: boolean): string {
  return roundUpToJiao
    ? `${name}的基础养老金和个人账户养老金按角进位，每月合计再保留到分。`
    : `${name}的金额保留到分。`;
}

export function pastIndexNote(): string {
  return "1 表示以前按当地平均缴费基数缴。高于 1 是高于平均，低于 1 是低于平均。要改，打开下面的利率和已缴费指数。";
}
