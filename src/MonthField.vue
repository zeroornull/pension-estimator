<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { openMonth } from "./month-session.ts";

const props = defineProps<{
  label: string;
  modelValue: string;
  error?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const root = ref<HTMLElement | null>(null);
const open = ref(false);
const viewYear = ref(1986);
const focusMonth = ref(1);

const parsed = computed(() => parseYearMonth(props.modelValue));
const buttonText = computed(() => {
  const value = parsed.value;
  return value ? `${value.year}年${value.month}月` : "选择年月";
});

watch(open, (isOpen) => {
  if (!isOpen) return;
  const value = parsed.value;
  if (value) {
    viewYear.value = value.year;
    focusMonth.value = value.month;
  }
  document.addEventListener("pointerdown", onPointerDown);
  nextTick(() => document.getElementById(monthId(focusMonth.value))?.focus());
});

watch(open, (isOpen) => {
  if (!isOpen) document.removeEventListener("pointerdown", onPointerDown);
});

onBeforeUnmount(() => document.removeEventListener("pointerdown", onPointerDown));

function parseYearMonth(value: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year: Number(match[1]), month };
}

function monthId(month: number): string {
  return `${props.label}-month-${month}`;
}

function toggle() {
  open.value = !open.value;
  if (open.value) openMonth.value = props.label;
}

watch(openMonth, (label) => {
  if (label !== props.label) open.value = false;
});

function close() {
  open.value = false;
  document.getElementById(props.label)?.focus();
}

function choose(month: number) {
  emit("update:modelValue", `${viewYear.value}-${String(month).padStart(2, "0")}`);
  close();
}

function shiftYear(delta: number) {
  viewYear.value += delta;
}

function onPointerDown(event: PointerEvent) {
  const current = root.value;
  if (!current || !(event.target instanceof Node) || current.contains(event.target)) return;
  open.value = false;
}

function onMonthKey(event: KeyboardEvent, month: number) {
  if (event.key === "Escape") {
    event.preventDefault();
    close();
    return;
  }
  const delta =
    event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : event.key === "ArrowDown" ? 4 : event.key === "ArrowUp" ? -4 : 0;
  if (delta === 0) return;
  event.preventDefault();
  focusMonth.value = ((month - 1 + delta + 12) % 12) + 1;
  nextTick(() => document.getElementById(monthId(focusMonth.value))?.focus());
}

function onRootKey(event: KeyboardEvent) {
  if (event.key === "Escape" && open.value) {
    event.preventDefault();
    close();
  }
}
</script>

<template>
  <div ref="root" class="month-field field" @keydown="onRootKey">
    <label :for="label">{{ label }}</label>
    <button
      :id="label"
      type="button"
      class="month-trigger"
      :aria-invalid="error ? 'true' : 'false'"
      aria-haspopup="dialog"
      :aria-expanded="open"
      @click="toggle"
    >
      {{ buttonText }}
    </button>
    <p v-if="error" class="error">{{ error }}</p>
    <div v-if="open" class="month-panel" role="dialog" :aria-label="label">
      <div class="month-year">
        <button type="button" class="month-step" aria-label="上一年" @click="shiftYear(-1)">上年</button>
        <span class="month-year-value">{{ viewYear }}</span>
        <button type="button" class="month-step" aria-label="下一年" @click="shiftYear(1)">下年</button>
      </div>
      <div class="month-grid" role="grid">
        <button
          v-for="month in 12"
          :id="monthId(month)"
          :key="month"
          type="button"
          class="month-cell"
          role="gridcell"
          :tabindex="month === focusMonth ? 0 : -1"
          :aria-selected="parsed?.year === viewYear && parsed?.month === month"
          :class="{ 'is-selected': parsed?.year === viewYear && parsed?.month === month }"
          @click="choose(month)"
          @keydown="onMonthKey($event, month)"
        >
          {{ month }}月
        </button>
      </div>
    </div>
  </div>
</template>
