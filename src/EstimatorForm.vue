<script setup lang="ts">
import { computed, defineComponent, h, nextTick, onBeforeUnmount, ref, watch } from "vue";
import {
  applyCityBenchmarks,
  CITY_BY_ID,
  CITIES,
  defaultDraft,
  syncDerived,
  tryEstimate,
  type CityId,
  type Draft,
  type DraftField,
  type FieldErrors,
  type YearMonth,
} from "./domain.ts";
import { ageToBirth, birthToAge } from "./draft-edit.ts";
import MonthField from "./MonthField.vue";
import { benchmarkNote, delayNote, yuan } from "./present.ts";

const props = defineProps<{ now: YearMonth }>();
const draft = defineModel<Draft>({ required: true });

const benchmarksOpen = ref(false);
const assumptionsOpen = ref(false);

const outcome = computed(() => tryEstimate(draft.value, props.now));
const errors = computed<FieldErrors>(() => (outcome.value.ok ? {} : outcome.value.errors));
const city = computed(() => CITY_BY_ID[draft.value.cityId]);
const cityQuery = ref("");
const cityOpen = ref(false);
const cityActive = ref(0);

const cityMatches = computed(() => {
  const query = cityQuery.value.trim();
  if (!query || query === city.value.name) return [...CITIES];
  return CITIES.filter((item) => item.name.includes(query));
});

function openCity(event: FocusEvent) {
  cityQuery.value = city.value.name;
  cityOpen.value = true;
  const current = cityMatches.value.findIndex((item) => item.id === draft.value.cityId);
  cityActive.value = current >= 0 ? current : 0;
  const target = event.target;
  if (target instanceof HTMLInputElement) nextTick(() => target.select());
}

function onCityInput(event: Event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  cityQuery.value = target.value;
  cityOpen.value = true;
  cityActive.value = 0;
}

function pickCity(id: string) {
  edit("cityId", id);
  cityOpen.value = false;
  cityQuery.value = "";
}

function onCityKey(event: KeyboardEvent) {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (cityMatches.value.length === 0) return;
    cityOpen.value = true;
    cityActive.value = Math.min(cityMatches.value.length - 1, cityActive.value + 1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    if (cityMatches.value.length === 0) return;
    cityOpen.value = true;
    cityActive.value = Math.max(0, cityActive.value - 1);
  } else if (event.key === "Enter" && cityOpen.value) {
    event.preventDefault();
    const item = cityMatches.value[cityActive.value];
    if (item) pickCity(item.id);
  } else if (event.key === "Escape") {
    cityOpen.value = false;
    cityQuery.value = "";
  }
}

function closeCity(event: PointerEvent) {
  const field = document.getElementById("city-field");
  if (!cityOpen.value || !field || !(event.target instanceof Node) || field.contains(event.target)) return;
  cityOpen.value = false;
  cityQuery.value = "";
}

watch(cityOpen, (isOpen) => {
  if (isOpen) document.addEventListener("pointerdown", closeCity);
  else document.removeEventListener("pointerdown", closeCity);
});

onBeforeUnmount(() => document.removeEventListener("pointerdown", closeCity));

watch(
  errors,
  (value) => {
    if (
      draft.value.cityId === "other" ||
      city.value.pensionBase === null ||
      value.pensionBase !== undefined ||
      value.contributionReference !== undefined
    ) {
      benchmarksOpen.value = true;
    }
    if (
      value.interestRate !== undefined ||
      value.inflationRate !== undefined ||
      value.pastIndex !== undefined
    ) {
      assumptionsOpen.value = true;
    }
  },
  { immediate: true },
);

const ratioHint = computed(() => {
  if (draft.value.futureMode !== "ratio") return "";
  if (!outcome.value.ok) return "按缴费指数基准乘以这个百分比，再四舍五入到元。";
  return `约合每月 ${yuan(outcome.value.result.futureBase, 0)} 元。按缴费指数基准乘以百分比，再四舍五入到元。`;
});

function edit(name: DraftField | "cityId" | "workerType" | "futureMode" | "retirementMode", value: string) {
  let next: Draft = { ...draft.value };
  if (name === "cityId") {
    if (!isCityId(value)) return;
    next = applyCityBenchmarks({ ...next, cityId: value });
  } else if (name === "workerType") {
    if (value !== "male" && value !== "female55" && value !== "female50") return;
    next = { ...next, workerType: value };
  } else if (name === "futureMode") {
    next = { ...next, futureMode: value === "ratio" ? "ratio" : "base" };
  } else if (name === "retirementMode") {
    next = {
      ...next,
      retirementMode: value === "manual" ? "manual" : "statutory",
      ...(value === "statutory" ? { payoutLinked: true, futureMonthsLinked: true } : {}),
    };
  } else if (name === "retirementMonth") {
    next = { ...next, retirementMonth: value, retirementMode: "manual" };
  } else if (name === "payoutMonths") {
    next = { ...next, payoutMonths: value, payoutLinked: false };
  } else if (name === "futureMonths") {
    next = { ...next, futureMonths: value, futureMonthsLinked: false };
  } else if (name === "totalYears") {
    next = { ...next, totalYears: value, totalYearsLinked: false };
  } else if (name === "currentAge") {
    next = ageToBirth({ ...next, currentAge: value }, props.now);
  } else if (name === "birthMonth") {
    next = birthToAge({ ...next, birthMonth: value }, props.now);
  } else {
    next = { ...next, [name]: value };
  }
  draft.value = syncDerived(next, props.now);
}

function relink(flag: "futureMonthsLinked" | "totalYearsLinked" | "payoutLinked") {
  draft.value = syncDerived({ ...draft.value, [flag]: true }, props.now);
}

function reset() {
  draft.value = defaultDraft(props.now, draft.value.cityId);
}

function onDetailsToggle(event: Event, target: "benchmarks" | "assumptions") {
  const node = event.currentTarget;
  if (!(node instanceof HTMLDetailsElement)) return;
  if (target === "benchmarks") benchmarksOpen.value = node.open;
  else assumptionsOpen.value = node.open;
}

function isCityId(value: string): value is CityId {
  return Object.prototype.hasOwnProperty.call(CITY_BY_ID, value);
}

const Field = defineComponent({
  props: {
    label: { type: String, required: true },
    modelValue: { type: String, required: true },
    error: { type: String, default: "" },
    suffix: { type: String, default: "" },
    mode: { type: String, default: "decimal" },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    return () =>
      h("div", { class: "field" }, [
        h("label", { for: props.label }, props.label),
        h("div", { class: "control" }, [
          h("input", {
            id: props.label,
            type: "text",
            inputmode: props.mode,
            autocomplete: "off",
            spellcheck: "false",
            value: props.modelValue,
            "aria-invalid": props.error ? "true" : "false",
            onInput: (event: Event) => {
              const target = event.target;
              if (target instanceof HTMLInputElement) emit("update:modelValue", target.value);
            },
          }),
          props.suffix ? h("span", { class: "suffix" }, props.suffix) : null,
        ]),
        props.error ? h("p", { class: "error" }, props.error) : null,
      ]);
  },
});

</script>

<template>
  <form class="form" autocomplete="off" novalidate @submit.prevent>
    <fieldset>
      <legend>在哪里退休</legend>
      <div id="city-field" class="field city-field">
        <label for="cityId">退休地</label>
        <div class="city-control">
          <input
            id="cityId"
            class="city-input"
            role="combobox"
            aria-autocomplete="list"
            aria-controls="city-list"
            :aria-expanded="cityOpen"
            :value="cityOpen ? cityQuery : city.name"
            autocomplete="off"
            spellcheck="false"
            @focus="openCity"
            @input="onCityInput"
            @keydown="onCityKey"
          >
          <ul v-if="cityOpen" id="city-list" class="city-list" role="listbox">
            <li v-if="cityMatches.length === 0" class="city-empty">没有匹配的退休地</li>
            <li
              v-for="(item, index) in cityMatches"
              :key="item.id"
              role="option"
              :aria-selected="item.id === draft.cityId"
              :class="{ 'is-active': index === cityActive, 'is-selected': item.id === draft.cityId }"
              @mousedown.prevent="pickCity(item.id)"
            >
              {{ item.name }}
            </li>
          </ul>
        </div>
        <p class="hint">{{ benchmarkNote(draft) }}</p>
      </div>
      <details class="fold" :open="benchmarksOpen" @toggle="onDetailsToggle($event, 'benchmarks')">
        <summary>当地计发参数</summary>
        <p class="hint">没有预置内蒙古、西藏、宁夏、新疆。这四个地方选其他城市，再填下面两个数。</p>
        <Field
          label="缴费指数基准"
          suffix="元/月"
          :model-value="draft.contributionReference"
          :error="errors.contributionReference"
          @update:model-value="edit('contributionReference', $event)"
        />
        <Field
          label="养老金计发基数"
          suffix="元/月"
          :model-value="draft.pensionBase"
          :error="errors.pensionBase"
          @update:model-value="edit('pensionBase', $event)"
        />
      </details>
    </fieldset>

    <fieldset>
      <legend>什么时候退休</legend>
      <div class="choices" role="radiogroup" aria-label="性别及职工类别">
        <label><input type="radio" name="workerType" value="male" :checked="draft.workerType === 'male'" @change="edit('workerType', 'male')">男职工，原 60 岁</label>
        <label><input type="radio" name="workerType" value="female55" :checked="draft.workerType === 'female55'" @change="edit('workerType', 'female55')">女职工，原 55 岁</label>
        <label><input type="radio" name="workerType" value="female50" :checked="draft.workerType === 'female50'" @change="edit('workerType', 'female50')">女职工，原 50 岁</label>
      </div>
      <div class="pair">
        <Field label="现在的年龄" suffix="岁" mode="numeric" :model-value="draft.currentAge" :error="errors.currentAge" @update:model-value="edit('currentAge', $event)" />
        <MonthField label="出生年月" :model-value="draft.birthMonth" :error="errors.birthMonth" @update:model-value="edit('birthMonth', $event)" />
      </div>
      <div class="choices" role="radiogroup" aria-label="退休时间方式">
        <label><input type="radio" name="retirementMode" value="statutory" :checked="draft.retirementMode === 'statutory'" @change="edit('retirementMode', 'statutory')">按法定年龄</label>
        <label><input type="radio" name="retirementMode" value="manual" :checked="draft.retirementMode === 'manual'" @change="edit('retirementMode', 'manual')">自己指定年月</label>
      </div>
      <p class="hint">{{ delayNote(draft) }}</p>
      <div class="pair">
        <MonthField label="退休年月" :model-value="draft.retirementMonth" :error="errors.retirementMonth" @update:model-value="edit('retirementMonth', $event)" />
        <Field label="计发月数" suffix="个月" :model-value="draft.payoutMonths" :error="errors.payoutMonths" @update:model-value="edit('payoutMonths', $event)" />
      </div>
      <p v-if="!draft.payoutLinked" class="hint">整数年龄查表。不满整岁就在相邻两档之间按月折算，保留 1 位小数。</p>
      <button v-if="!draft.payoutLinked" type="button" class="quiet" @click="relink('payoutLinked')">改回年龄表上的月数</button>
    </fieldset>

    <fieldset>
      <legend>账户里现在有多少</legend>
      <Field label="个人账户余额" suffix="元" :model-value="draft.accountBalance" :error="errors.accountBalance" @update:model-value="edit('accountBalance', $event)" />
      <Field label="已缴费月数" suffix="个月" mode="numeric" :model-value="draft.paidMonths" :error="errors.paidMonths" @update:model-value="edit('paidMonths', $event)" />
      <div v-if="city.breakMonthsInDenominator">
        <Field label="北京可计入的断缴月数" suffix="个月" mode="numeric" :model-value="draft.beijingBreakMonths" :error="errors.beijingBreakMonths" @update:model-value="edit('beijingBreakMonths', $event)" />
        <p class="hint">只加进平均指数的分母，按指数 0 计算。个人账户不变。</p>
      </div>
    </fieldset>

    <fieldset>
      <legend>以后怎么缴</legend>
      <div class="choices" role="radiogroup" aria-label="后续缴费方式">
        <label><input type="radio" name="futureMode" value="base" :checked="draft.futureMode === 'base'" @change="edit('futureMode', 'base')">按月缴费基数</label>
        <label><input type="radio" name="futureMode" value="ratio" :checked="draft.futureMode === 'ratio'" @change="edit('futureMode', 'ratio')">按基数的百分比</label>
      </div>
      <Field v-if="draft.futureMode === 'base'" label="月缴费基数" suffix="元" :model-value="draft.baseAmount" :error="errors.baseAmount" @update:model-value="edit('baseAmount', $event)" />
      <div v-else>
        <Field label="缴费比例" suffix="%" :model-value="draft.ratioPct" :error="errors.ratioPct" @update:model-value="edit('ratioPct', $event)" />
        <p class="hint">{{ ratioHint }}</p>
      </div>
      <Field label="以后还要缴" suffix="个月" mode="numeric" :model-value="draft.futureMonths" :error="errors.futureMonths" @update:model-value="edit('futureMonths', $event)" />
      <p v-if="!draft.futureMonthsLinked" class="hint">这是手填的月数。</p>
      <button v-if="!draft.futureMonthsLinked" type="button" class="quiet" @click="relink('futureMonthsLinked')">改回距退休的月数</button>
      <Field label="缴费年限" suffix="年" :model-value="draft.totalYears" :error="errors.totalYears" @update:model-value="edit('totalYears', $event)" />
      <p v-if="!draft.totalYearsLinked" class="hint">这是手填的年限。和月数对不上时仍会计算，并在结果里提醒。</p>
      <button v-if="!draft.totalYearsLinked" type="button" class="quiet" @click="relink('totalYearsLinked')">改回按月数合计</button>
    </fieldset>

    <details class="fold" :open="assumptionsOpen" @toggle="onDetailsToggle($event, 'assumptions')">
      <summary>利率和已缴费指数</summary>
      <div class="pair">
        <Field label="记账利率" suffix="%" :model-value="draft.interestRate" :error="errors.interestRate" @update:model-value="edit('interestRate', $event)" />
        <Field label="通胀" suffix="%" :model-value="draft.inflationRate" :error="errors.inflationRate" @update:model-value="edit('inflationRate', $event)" />
      </div>
      <p class="hint">记账利率只滚个人账户。通胀只折现购买力。</p>
      <Field label="已缴费的平均指数" :model-value="draft.pastIndex" :error="errors.pastIndex" @update:model-value="edit('pastIndex', $event)" />
    </details>

    <div class="actions">
      <button type="button" class="quiet" @click="reset">恢复这个城市的示例</button>
    </div>
  </form>
</template>
