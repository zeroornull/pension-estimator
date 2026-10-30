<script setup lang="ts">
import { computed } from "vue";
import { CITY_BY_ID, tryEstimate, type Draft, type YearMonth } from "./domain.ts";
import { formulaLines, roundingNote, spanNote, yearsText, yuan } from "./present.ts";

const props = defineProps<{
  draft: Draft;
  now: YearMonth;
}>();

const outcome = computed(() => tryEstimate(props.draft, props.now));

const digits = computed(() => (outcome.value.ok && outcome.value.result.roundUpToJiao ? 1 : 2));

const lines = computed(() => (outcome.value.ok ? formulaLines(outcome.value.input, outcome.value.result) : []));

const rounding = computed(() => {
  if (!outcome.value.ok) return "";
  return roundingNote(CITY_BY_ID[outcome.value.input.cityId].name, outcome.value.result.roundUpToJiao);
});

const shares = computed(() => {
  if (!outcome.value.ok) return null;
  const base = outcome.value.result.basePension;
  const personal = outcome.value.result.personalPension;
  const total = base + personal;
  if (!(total > 0)) return null;
  const basePct = (base / total) * 100;
  return {
    base: `${basePct}%`,
    personal: `${100 - basePct}%`,
    baseLabel: basePct.toFixed(1),
    personalLabel: (100 - basePct).toFixed(1),
  };
});

const startLabel = computed(() => {
  const match = /^(\d{4})-(\d{2})$/.exec(props.draft.retirementMonth);
  if (!match) return "尚未确定";
  const when = `${Number(match[1])}年${Number(match[2])}月`;
  return props.draft.retirementMode === "statutory" ? `${when}，按法定年龄` : `${when}，手填`;
});
</script>

<template>
  <section class="result">
    <div class="result-summary">
      <h2 id="result-title">每月基本养老金</h2>
      <p v-if="!outcome.ok" class="pause">有输入超出范围，结果先停着。改掉红字后会重新计算。</p>
      <template v-else>
        <p class="lead num" aria-live="polite">
          <span>{{ yuan(outcome.result.monthly, digits) }}</span>
          <span class="unit">元</span>
        </p>
        <div
          v-if="shares"
          class="mix"
          role="img"
          :aria-label="`基础养老金占 ${shares.baseLabel}%，个人账户养老金占 ${shares.personalLabel}%`"
        >
          <span class="mix-base" :style="{ width: shares.base }"></span>
          <span class="mix-personal" :style="{ width: shares.personal }"></span>
        </div>
        <dl class="split">
          <div>
            <dt><i class="swatch swatch-base" aria-hidden="true"></i>基础养老金</dt>
            <dd>{{ yuan(outcome.result.basePension, digits) }} 元</dd>
          </div>
          <div>
            <dt><i class="swatch swatch-personal" aria-hidden="true"></i>个人账户养老金</dt>
            <dd>{{ yuan(outcome.result.personalPension, digits) }} 元</dd>
          </div>
        </dl>
        <ul v-if="outcome.ok" class="facts">
          <li>
            <span>相当于现在</span>
            <strong>{{ yuan(outcome.result.realMonthly, 2) }} 元/月</strong>
          </li>
          <li>
            <span>开始领取</span>
            <strong>{{ startLabel }}</strong>
          </li>
          <li>
            <span>届时账户</span>
            <strong>{{ yuan(outcome.result.accountAtRetirement, 2) }} 元</strong>
          </li>
        </ul>
        <p v-if="outcome.result.belowMinYears" class="warning">
          退休当年的最低缴费年限是 {{ yearsText(outcome.result.minRequiredYears) }} 年，现在填的是
          {{ yearsText(outcome.input.totalYears) }} 年。这只是提醒，金额照常计算。
        </p>
        <p v-if="outcome.result.yearsMismatch" class="warning">
          缴费年限和已缴加后续的月数相差超过 1 个月。多出来的月数按视同缴费、指数 1 计入。金额照常计算。
        </p>
      </template>
    </div>
    <div v-if="outcome.ok" class="result-rest">
      <p class="span-line">{{ spanNote(draft, outcome.input, outcome.result, now) }}</p>
      <p class="meta">
        记入本金 {{ yuan(outcome.result.creditedPrincipal, 2) }} 元，利息
        {{ yuan(outcome.result.interestEarned, 2) }} 元。
      </p>
      <details class="fold">
        <summary>看这次怎么算的</summary>
        <div class="formula">
          <p v-for="line in lines" :key="line">{{ line }}</p>
          <p class="rounding">{{ rounding }}</p>
        </div>
      </details>
      <p class="disclaimer">
        不含过渡性养老金和地方补贴。通胀只把退休时的金额折成今天的购买力，不提高工资，也不提高计发基数。
      </p>
    </div>
    <div v-else class="result-rest">
      <p class="disclaimer">
        不含过渡性养老金和地方补贴。通胀只把退休时的金额折成今天的购买力，不提高工资，也不提高计发基数。
      </p>
    </div>
  </section>
</template>
