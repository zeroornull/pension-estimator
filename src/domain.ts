const yearMonthBrand: unique symbol = Symbol("YearMonth");
export type YearMonth = string & { readonly [yearMonthBrand]: never };

export type CityRule = "standard" | "guangdong";

export type City = (typeof CITIES)[number];

export type WorkerType = "male" | "female55" | "female50";
export type FutureMode = "base" | "ratio";
export type RetirementMode = "statutory" | "manual";

export type FuturePay =
  | { mode: "base"; monthlyBase: number }
  | { mode: "ratio"; ratioPct: number };

export type EstimateInput = {
  cityId: CityId;
  accountBalance: number;
  paidMonths: number;
  futureMonths: number;
  totalYears: number;
  pastIndex: number;
  beijingBreakMonths: number;
  payoutMonths: number;
  interestRatePct: number;
  inflationRatePct: number;
  retirementMonth: YearMonth;
  contributionReference: number;
  pensionBase: number;
  futurePay: FuturePay;
};

export type EstimateResult = {
  futureBase: number;
  futureIndex: number;
  monthlyCredit: number;
  averageIndex: number;
  indexNumerator: number;
  indexDenominator: number;
  deemedMonths: number;
  breakMonths: number;
  coefficientA: number;
  accountAtRetirement: number;
  creditedPrincipal: number;
  interestEarned: number;
  basePension: number;
  personalPension: number;
  monthly: number;
  realMonthly: number;
  monthsToRetire: number;
  yearsToRetire: number;
  retirementYear: number;
  minRequiredYears: number;
  belowMinYears: boolean;
  yearsMismatch: boolean;
  roundUpToJiao: boolean;
};

export type StatutoryPlan = {
  retirementMonth: YearMonth;
  delayMonths: number;
  originalAge: number;
  ageMonths: number;
  payoutMonths: number;
};

export type Draft = {
  cityId: CityId;
  accountBalance: string;
  paidMonths: string;
  totalYears: string;
  totalYearsLinked: boolean;
  futureMode: FutureMode;
  baseAmount: string;
  ratioPct: string;
  futureMonths: string;
  futureMonthsLinked: boolean;
  currentAge: string;
  birthMonth: string;
  workerType: WorkerType;
  retirementMode: RetirementMode;
  retirementMonth: string;
  payoutMonths: string;
  payoutLinked: boolean;
  contributionReference: string;
  pensionBase: string;
  interestRate: string;
  inflationRate: string;
  pastIndex: string;
  beijingBreakMonths: string;
};

export type DraftField =
  | "accountBalance"
  | "paidMonths"
  | "totalYears"
  | "baseAmount"
  | "ratioPct"
  | "futureMonths"
  | "currentAge"
  | "birthMonth"
  | "retirementMonth"
  | "payoutMonths"
  | "contributionReference"
  | "pensionBase"
  | "interestRate"
  | "inflationRate"
  | "pastIndex"
  | "beijingBreakMonths";

export type FieldErrors = Partial<Record<DraftField, string>>;

const PERSONAL_ACCOUNT_CREDIT_RATE = 0.08;

const PAYOUT_MONTHS_BY_AGE: Record<number, number> = {
  40: 233,
  41: 230,
  42: 226,
  43: 223,
  44: 220,
  45: 216,
  46: 212,
  47: 208,
  48: 204,
  49: 199,
  50: 195,
  51: 190,
  52: 185,
  53: 180,
  54: 175,
  55: 170,
  56: 164,
  57: 158,
  58: 152,
  59: 145,
  60: 139,
  61: 132,
  62: 125,
  63: 117,
  64: 109,
  65: 101,
  66: 93,
  67: 84,
  68: 75,
  69: 65,
  70: 56,
};

const DELAY_POLICY: Record<
  WorkerType,
  { anchorYear: number; step: number; cap: number; originalAge: number }
> = {
  male: { anchorYear: 1965, step: 4, cap: 36, originalAge: 60 },
  female55: { anchorYear: 1970, step: 4, cap: 36, originalAge: 55 },
  female50: { anchorYear: 1975, step: 2, cap: 60, originalAge: 50 },
};

export const CITIES = [
  city("shanghai", "上海", 12577, 12577, 7546, 37731, "standard", true, false),
  city("shenzhen", "深圳", 9201, 11293, 5521, 27603, "guangdong", false, false),
  city("guangzhou", "广州", 9201, 9493, 5521, 27603, "guangdong", false, false),
  city("beijing", "北京", 12116, 12049, 7270, 36348, "standard", false, true),
  city("tianjin", "天津", 8634, 9417, 5180, 25902, "standard", false, false),
  city("nanjing", "南京", 8375.67, 8917, 5025, 25127, "standard", false, false),
  city("hangzhou", "杭州", 8537, 8537, 5122, 25611, "standard", false, false),
  city("chongqing", "重庆", 7588.25, 8240, 4553, 22765, "standard", false, false),
  city("hefei", "合肥", 7257, 7999, 4354, 21772, "standard", false, false),
  city("anhui", "安徽省", 7257, 7999, 4354, 21772, "standard", false, false),
  city("jiangsu", "江苏省", 8375.67, 8917, 5025, 25127, "standard", false, false),
  city("zhejiang", "浙江省", 8537, 8537, 5122, 25611, "standard", false, false),
  city("jiangxi", "江西省", 6649, 7054, 3990, 19947, "standard", false, false),
  city("guangdong", "广东省", 9201, 9493, 5521, 27603, "guangdong", false, false),
  city("henan", "河南省", 6520, 6738, 3912, 19560, "standard", false, false),
  city("shandong", "山东省", 7621, 7831, 4573, 22863, "standard", false, false),
  city("hubei", "湖北省", 7587, null, 4552, 22761, "standard", false, false),
  city("hebei", "河北省", 6794, 7410, 4076, 20382, "standard", false, false),
  city("shanxi", "山西省", 7073, 7253, 4244, 21219, "standard", false, false),
  city("liaoning", "辽宁省", 7555, 7346, 4533, 22665, "standard", false, false),
  city("jilin", "吉林省", 7481.5, 7322.08, 4488.9, 22444.5, "standard", false, false),
  city("heilongjiang", "黑龙江省", 7705, 7705, 4623, 23115, "standard", false, false),
  city("fujian", "福建省", 7631, 7932, 4579, 22893, "standard", false, false),
  city("hunan", "湖南省", 6843, 7694, 4106, 20529, "standard", false, false),
  city("guangxi", "广西壮族自治区", 7008, 6983, 4204.8, 21024, "standard", true, false),
  city("hainan", "海南省", 8254, 8254, 4952.4, 24762, "standard", false, false),
  city("sichuan", "四川省", 7831, 8462, 4699, 23493, "standard", false, false),
  city("guizhou", "贵州省", 7376.75, 7376.75, 4426, 22130, "standard", false, false),
  city("yunnan", "云南省", 7339, 8265, 4403, 22017, "standard", false, false),
  city("shaanxi", "陕西省", 7895, 7881, 4737, 23685, "standard", false, false),
  city("gansu", "甘肃省", 7542, 7746, 4526, 22626, "standard", false, false),
  city("qinghai", "青海省", 8888, 9056, 5333, 26664, "standard", false, false),
  city("other", "其他城市", null, null, 0, 10000000, "standard", false, false),
] as const;

export type CityId = (typeof CITIES)[number]["id"];

export const CITY_BY_ID = Object.fromEntries(CITIES.map((item) => [item.id, item])) as Record<
  CityId,
  City
>;

const WORKERS = new Set<WorkerType>(["male", "female55", "female50"]);

function city<const T extends string>(
  id: T,
  name: string,
  contributionReference: number | null,
  pensionBase: number | null,
  minBase: number,
  maxBase: number,
  rule: CityRule,
  roundUpToJiao: boolean,
  breakMonthsInDenominator: boolean,
) {
  return {
    id,
    name,
    contributionReference,
    pensionBase,
    minBase,
    maxBase,
    rule,
    roundUpToJiao,
    breakMonthsInDenominator,
  };
}

export function yearMonth(year: number, month: number): YearMonth | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null;
  return `${year}-${String(month).padStart(2, "0")}` as YearMonth;
}

export function parseYearMonth(value: string): YearMonth | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  return yearMonth(Number(match[1]), Number(match[2]));
}

export function monthIndex(value: YearMonth): number {
  const parsed = parseYearMonth(value);
  if (!parsed) return Number.NaN;
  const year = Number(parsed.slice(0, 4));
  const month = Number(parsed.slice(5, 7));
  return year * 12 + month - 1;
}

export function indexToYearMonth(index: number): YearMonth {
  const year = Math.floor(index / 12);
  const month = index - year * 12 + 1;
  const value = yearMonth(year, month);
  if (!value) throw new Error(`bad month index ${index}`);
  return value;
}

export function shanghaiYearMonth(date = new Date()): YearMonth {
  const text = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
  }).format(date);
  const value = parseYearMonth(text.slice(0, 7));
  if (!value) throw new Error(`bad Shanghai month ${text}`);
  return value;
}

export function payoutMonthsForAge(ageMonths: number): number {
  const years = Math.floor(ageMonths / 12);
  const leftover = ageMonths % 12;
  const current = PAYOUT_MONTHS_BY_AGE[years];
  if (!Number.isFinite(current)) return Number.NaN;
  if (leftover === 0) return current;
  const next = PAYOUT_MONTHS_BY_AGE[years + 1];
  if (!Number.isFinite(next)) return Number.NaN;
  return Math.round((current - ((current - next) * leftover) / 12) * 10) / 10;
}

export function statutoryPlan(worker: WorkerType, birth: YearMonth): StatutoryPlan {
  const policy = DELAY_POLICY[worker];
  const birthIndex = monthIndex(birth);
  const anchor = policy.anchorYear * 12;
  const delayMonths =
    birthIndex < anchor
      ? 0
      : Math.min(policy.cap, Math.floor((birthIndex - anchor) / policy.step) + 1);
  const ageMonths = policy.originalAge * 12 + delayMonths;
  return {
    retirementMonth: indexToYearMonth(birthIndex + ageMonths),
    delayMonths,
    originalAge: policy.originalAge,
    ageMonths,
    payoutMonths: payoutMonthsForAge(ageMonths),
  };
}

export function yearsFromMonths(paidMonths: number, futureMonths: number): number {
  return Number(((paidMonths + futureMonths) / 12).toFixed(4));
}

export function minimumContributionYears(retirementYear: number): number {
  if (retirementYear < 2030) return 15;
  return Math.min(20, 15 + (retirementYear - 2029) * 0.5);
}

export function formatAge(ageMonths: number): string {
  if (!Number.isFinite(ageMonths) || ageMonths < 0) return "";
  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;
  return months === 0 ? `${years}岁` : `${years}岁${months}个月`;
}

function futureValueOfEndOfMonthDeposits(payment: number, monthlyRate: number, months: number): number {
  if (months === 0) return 0;
  if (monthlyRate === 0) return payment * months;
  return (payment * ((1 + monthlyRate) ** months - 1)) / monthlyRate;
}

function roundPensionComponent(amount: number, roundUpToJiao: boolean): number {
  if (roundUpToJiao) return Math.ceil((amount - 1e-10) * 10) / 10;
  return Math.round(amount * 100) / 100;
}

export function estimate(input: EstimateInput, now: YearMonth): EstimateResult {
  const selected = CITY_BY_ID[input.cityId];
  const annualRate = input.interestRatePct / 100;
  const monthlyRate = (1 + annualRate) ** (1 / 12) - 1;
  const monthsToRetire = monthIndex(input.retirementMonth) - monthIndex(now);
  const yearsToRetire = monthsToRetire / 12;
  const futureBase =
    input.futurePay.mode === "base"
      ? input.futurePay.monthlyBase
      : Math.round((input.contributionReference * input.futurePay.ratioPct) / 100);
  const futureIndex = Number((futureBase / input.contributionReference).toFixed(4));
  const monthlyCredit = futureBase * PERSONAL_ACCOUNT_CREDIT_RATE;
  const existingFutureValue = input.accountBalance * (1 + monthlyRate) ** monthsToRetire;
  const contributionFutureValue =
    futureValueOfEndOfMonthDeposits(monthlyCredit, monthlyRate, input.futureMonths) *
    (1 + monthlyRate) ** (monthsToRetire - input.futureMonths);
  const accountAtRetirement = existingFutureValue + contributionFutureValue;
  const deemedMonths = Math.max(
    0,
    Math.round(input.totalYears * 12) - input.paidMonths - input.futureMonths,
  );
  const breakMonths = selected.breakMonthsInDenominator ? input.beijingBreakMonths : 0;
  const indexNumerator =
    input.paidMonths * input.pastIndex + input.futureMonths * futureIndex + deemedMonths;
  const indexDenominator = input.paidMonths + input.futureMonths + deemedMonths + breakMonths;
  const averageIndex = indexNumerator / indexDenominator;
  const coefficientA =
    selected.rule === "guangdong" && averageIndex < 0.6 ? averageIndex / 0.6 : 1;
  const yearFactor = Number(input.totalYears.toFixed(4));
  const baseRaw = (input.pensionBase * (coefficientA + averageIndex)) / 2 * yearFactor * 0.01;
  const personalRaw = accountAtRetirement / input.payoutMonths;
  const basePension = roundPensionComponent(baseRaw, selected.roundUpToJiao);
  const personalPension = roundPensionComponent(personalRaw, selected.roundUpToJiao);
  const monthly = Math.round((basePension + personalPension) * 100) / 100;
  const inflationDivisor = (1 + input.inflationRatePct / 100) ** yearsToRetire;
  const realMonthly = Math.round((monthly / inflationDivisor) * 100) / 100;
  const creditedPrincipal = monthlyCredit * input.futureMonths;
  const retirementYear = Math.floor(monthIndex(input.retirementMonth) / 12);
  const minRequiredYears = minimumContributionYears(retirementYear);
  return {
    futureBase,
    futureIndex,
    monthlyCredit,
    averageIndex,
    indexNumerator,
    indexDenominator,
    deemedMonths,
    breakMonths,
    coefficientA,
    accountAtRetirement,
    creditedPrincipal,
    interestEarned: accountAtRetirement - input.accountBalance - creditedPrincipal,
    basePension,
    personalPension,
    monthly,
    realMonthly,
    monthsToRetire,
    yearsToRetire,
    retirementYear,
    minRequiredYears,
    belowMinYears: input.totalYears < minRequiredYears,
    yearsMismatch: Math.abs(input.totalYears - (input.paidMonths + input.futureMonths) / 12) > 1 / 12,
    roundUpToJiao: selected.roundUpToJiao,
  };
}

export function defaultDraft(now: YearMonth, cityId: CityId = "shanghai"): Draft {
  const selected = CITY_BY_ID[cityId];
  const birth = indexToYearMonth(monthIndex(now) - 480);
  const plan = statutoryPlan("male", birth);
  const gap = monthIndex(plan.retirementMonth) - monthIndex(now);
  const paidMonths = 120;
  return {
    cityId,
    accountBalance: "80000",
    paidMonths: "120",
    totalYears: String(yearsFromMonths(paidMonths, gap)),
    totalYearsLinked: true,
    futureMode: "base",
    baseAmount: "9000",
    ratioPct: "100",
    futureMonths: String(gap),
    futureMonthsLinked: true,
    currentAge: "40",
    birthMonth: birth,
    workerType: "male",
    retirementMode: "statutory",
    retirementMonth: plan.retirementMonth,
    payoutMonths: String(plan.payoutMonths),
    payoutLinked: true,
    contributionReference:
      selected.contributionReference === null ? "" : String(selected.contributionReference),
    pensionBase: selected.pensionBase === null ? "" : String(selected.pensionBase),
    interestRate: "3",
    inflationRate: "1.5",
    pastIndex: "1",
    beijingBreakMonths: "0",
  };
}

export function applyCityBenchmarks(draft: Draft): Draft {
  const selected = CITY_BY_ID[draft.cityId];
  return {
    ...draft,
    contributionReference:
      selected.contributionReference === null ? "" : String(selected.contributionReference),
    pensionBase: selected.pensionBase === null ? "" : String(selected.pensionBase),
  };
}

export function syncDerived(draft: Draft, now: YearMonth): Draft {
  const next: Draft = { ...draft };
  const birth = parseYearMonth(next.birthMonth);
  if (next.retirementMode === "statutory" && birth && WORKERS.has(next.workerType)) {
    next.retirementMonth = statutoryPlan(next.workerType, birth).retirementMonth;
  }
  const retirement = parseYearMonth(next.retirementMonth);
  if (next.payoutLinked && birth && retirement) {
    const payout = payoutMonthsForAge(monthIndex(retirement) - monthIndex(birth));
    if (Number.isFinite(payout)) next.payoutMonths = String(payout);
  }
  if (next.futureMonthsLinked && retirement) {
    const gap = monthIndex(retirement) - monthIndex(now);
    if (gap >= 0) next.futureMonths = String(gap);
  }
  if (next.totalYearsLinked) {
    const paid = readInt(next.paidMonths);
    const future = readInt(next.futureMonths);
    if (paid !== null && future !== null) {
      const years = yearsFromMonths(paid, future);
      if (years > 0) next.totalYears = String(years);
    }
  }
  return next;
}

export function tryEstimate(
  draft: Draft,
  now: YearMonth,
): { ok: true; input: EstimateInput; result: EstimateResult } | { ok: false; errors: FieldErrors } {
  const errors = validateDraft(draft, now);
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const input = inputFromDraft(draft);
  return { ok: true, input, result: estimate(input, now) };
}

export function draftFromUnknown(value: unknown, now: YearMonth): Draft | null {
  if (!isRecord(value)) return null;
  const cityId = value.cityId;
  const workerType = value.workerType;
  const futureMode = value.futureMode;
  const retirementMode = value.retirementMode;
  if (typeof cityId !== "string" || !isCityId(cityId)) return null;
  if (workerType !== "male" && workerType !== "female55" && workerType !== "female50") return null;
  if (futureMode !== "base" && futureMode !== "ratio") return null;
  if (retirementMode !== "statutory" && retirementMode !== "manual") return null;
  const fallback = defaultDraft(now, cityId);
  const text = (key: keyof Draft): string => {
    const raw = value[key];
    return typeof raw === "string" ? raw : String(fallback[key]);
  };
  const flag = (key: "totalYearsLinked" | "futureMonthsLinked" | "payoutLinked"): boolean => {
    const raw = value[key];
    return typeof raw === "boolean" ? raw : fallback[key];
  };
  return {
    cityId,
    accountBalance: text("accountBalance"),
    paidMonths: text("paidMonths"),
    totalYears: text("totalYears"),
    totalYearsLinked: flag("totalYearsLinked"),
    futureMode,
    baseAmount: text("baseAmount"),
    ratioPct: text("ratioPct"),
    futureMonths: text("futureMonths"),
    futureMonthsLinked: flag("futureMonthsLinked"),
    currentAge: text("currentAge"),
    birthMonth: text("birthMonth"),
    workerType,
    retirementMode,
    retirementMonth: text("retirementMonth"),
    payoutMonths: text("payoutMonths"),
    payoutLinked: flag("payoutLinked"),
    contributionReference: text("contributionReference"),
    pensionBase: text("pensionBase"),
    interestRate: text("interestRate"),
    inflationRate: text("inflationRate"),
    pastIndex: text("pastIndex"),
    beijingBreakMonths: text("beijingBreakMonths"),
  };
}

function validateDraft(draft: Draft, now: YearMonth): FieldErrors {
  const errors: FieldErrors = {};
  const selected = CITY_BY_ID[draft.cityId];
  const account = readNumber(draft.accountBalance);
  if (account === null || account < 0 || account > 1e9) {
    errors.accountBalance = "个人账户余额要在 0 到 10 亿元之间。";
  }
  const paid = readInt(draft.paidMonths);
  if (paid === null || paid < 0 || paid > 720) {
    errors.paidMonths = "已缴费月数要是 0 到 720 的整数。";
  }
  const future = readInt(draft.futureMonths);
  if (future === null || future < 0 || future > 720) {
    errors.futureMonths = "后续缴费月数要是 0 到 720 的整数。";
  }
  if (paid !== null && future !== null && paid + future === 0 && !errors.paidMonths) {
    errors.paidMonths = "已缴费月数和后续缴费月数不能同时为 0。";
  }
  const totalYears = readNumber(draft.totalYears);
  if (totalYears === null || totalYears <= 0 || totalYears > 60) {
    errors.totalYears = "缴费年限要大于 0，并且不超过 60 年。";
  } else if (Math.abs(totalYears * 1e4 - Math.round(totalYears * 1e4)) > 1e-7) {
    errors.totalYears = "缴费年限最多 4 位小数。";
  }
  if (draft.futureMode === "base") {
    const base = readNumber(draft.baseAmount);
    if (base === null || base <= 0 || base > 1e7) {
      errors.baseAmount = "月缴费基数要大于 0，并且不超过 1000 万元。";
    } else if (draft.cityId !== "other" && (base < selected.minBase || base > selected.maxBase)) {
      errors.baseAmount = `月缴费基数要在 ${formatBound(selected.minBase)} 到 ${formatBound(selected.maxBase)} 元之间。`;
    }
  } else {
    const ratio = readNumber(draft.ratioPct);
    if (ratio === null || ratio < 60 || ratio > 300) {
      errors.ratioPct = "缴费比例要在 60% 到 300% 之间。";
    }
  }
  const age = readInt(draft.currentAge);
  if (age === null || age < 18 || age > 100) {
    errors.currentAge = "年龄要是 18 到 100 的整数。";
  }
  const birth = parseYearMonth(draft.birthMonth);
  const nowIndex = monthIndex(now);
  if (!birth) {
    errors.birthMonth = "请选择出生年月。";
  } else if (monthIndex(birth) > nowIndex || monthIndex(birth) < monthIndex(mustYearMonth(1900, 1))) {
    errors.birthMonth = "出生年月要在 1900年1月和当前月份之间。";
  }
  const retirement = parseYearMonth(draft.retirementMonth);
  if (!retirement) {
    errors.retirementMonth = "请选择退休年月。";
  } else {
    const gap = monthIndex(retirement) - nowIndex;
    if (gap < 0) errors.retirementMonth = "退休年月不能早于当前月份。";
    else if (gap > 720) errors.retirementMonth = "距退休不能超过 60 年。";
    else if (birth && (monthIndex(retirement) - monthIndex(birth) < 480 || monthIndex(retirement) - monthIndex(birth) > 840)) {
      errors.retirementMonth = "退休年龄要在 40 岁到 70 岁之间。";
    }
    if (future !== null && gap >= 0 && future > gap && !errors.futureMonths) {
      errors.futureMonths = `后续缴费月数不能超过距退休的 ${gap} 个月。`;
    }
  }
  const payout = readNumber(draft.payoutMonths);
  if (payout === null || payout <= 0 || payout > 300) {
    errors.payoutMonths = "计发月数要大于 0，并且不超过 300。";
  }
  const reference = readNumber(draft.contributionReference);
  if (reference === null || reference <= 0 || reference > 1e7) {
    errors.contributionReference = blankBenchmark(draft.contributionReference)
      ? "请填写缴费指数基准。"
      : "缴费指数基准要大于 0，并且不超过 1000 万元。";
  }
  const pensionBase = readNumber(draft.pensionBase);
  if (pensionBase === null || pensionBase <= 0 || pensionBase > 1e7) {
    errors.pensionBase = blankBenchmark(draft.pensionBase)
      ? "请填写养老金计发基数。"
      : "养老金计发基数要大于 0，并且不超过 1000 万元。";
  }
  const interest = readNumber(draft.interestRate);
  if (interest === null || interest < 0 || interest > 15) {
    errors.interestRate = "记账利率要在 0% 到 15% 之间。";
  }
  const inflation = readNumber(draft.inflationRate);
  if (inflation === null || inflation < -5 || inflation > 20) {
    errors.inflationRate = "通胀要在 -5% 到 20% 之间。";
  }
  const pastIndex = readNumber(draft.pastIndex);
  if (pastIndex === null || pastIndex < 0.3 || pastIndex > 3) {
    errors.pastIndex = "已缴费的平均指数要在 0.3 到 3 之间。";
  }
  if (selected.breakMonthsInDenominator) {
    const breakMonths = readInt(draft.beijingBreakMonths);
    if (breakMonths === null || breakMonths < 0 || breakMonths > 720) {
      errors.beijingBreakMonths = "北京断缴月数要是 0 到 720 的整数。没有就填 0。";
    }
  }
  return errors;
}

function inputFromDraft(draft: Draft): EstimateInput {
  const retirementMonth = parseYearMonth(draft.retirementMonth);
  if (!retirementMonth) throw new Error("retirement month should already be valid");
  const futurePay: FuturePay =
    draft.futureMode === "base"
      ? { mode: "base", monthlyBase: mustNumber(draft.baseAmount) }
      : { mode: "ratio", ratioPct: mustNumber(draft.ratioPct) };
  return {
    cityId: draft.cityId,
    accountBalance: mustNumber(draft.accountBalance),
    paidMonths: mustNumber(draft.paidMonths),
    futureMonths: mustNumber(draft.futureMonths),
    totalYears: mustNumber(draft.totalYears),
    pastIndex: mustNumber(draft.pastIndex),
    beijingBreakMonths: readInt(draft.beijingBreakMonths) ?? 0,
    payoutMonths: mustNumber(draft.payoutMonths),
    interestRatePct: mustNumber(draft.interestRate),
    inflationRatePct: mustNumber(draft.inflationRate),
    retirementMonth,
    contributionReference: mustNumber(draft.contributionReference),
    pensionBase: mustNumber(draft.pensionBase),
    futurePay,
  };
}

function readNumber(raw: string): number | null {
  const text = raw.trim().replaceAll(",", "").replaceAll("，", "");
  if (text === "") return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

function readInt(raw: string): number | null {
  const value = readNumber(raw);
  if (value === null || !Number.isInteger(value)) return null;
  return value;
}

function mustNumber(raw: string): number {
  const value = readNumber(raw);
  if (value === null) throw new Error("number should already be valid");
  return value;
}

function mustYearMonth(year: number, month: number): YearMonth {
  const value = yearMonth(year, month);
  if (!value) throw new Error("bad year month");
  return value;
}

function blankBenchmark(raw: string): boolean {
  return raw.trim() === "";
}

function formatBound(value: number): string {
  return value.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isCityId(value: string): value is CityId {
  return Object.prototype.hasOwnProperty.call(CITY_BY_ID, value);
}
