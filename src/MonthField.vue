<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { parseYearMonth, shanghaiYearMonth } from "./domain.ts";
import { openMonth } from "./month-session.ts";

const props = defineProps<{
  label: string;
  modelValue: string;
  error?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const open = ref(false);
const viewYear = ref(0);
const yearText = ref("");
const focusMonth = ref(1);
const minYear = 1900;
const maxYear = 2200;

const parsed = computed(() => parts(props.modelValue));
const buttonText = computed(() => {
  const value = parsed.value;
  return value ? `${value.year}年${value.month}月` : "选择年月";
});

watch(open, (isOpen) => {
  if (!isOpen) return;
  openMonth.value = props.label;
  const value = parsed.value ?? parts(shanghaiYearMonth());
  if (!value) return;
  applyYear(value.year);
  focusMonth.value = value.month;
  nextTick(() => document.getElementById(monthId(focusMonth.value))?.focus());
});

watch(openMonth, (label) => {
  if (label !== props.label) open.value = false;
});

function parts(value: string): { year: number; month: number } | null {
  const parsedValue = parseYearMonth(value);
  if (!parsedValue) return null;
  return { year: Number(parsedValue.slice(0, 4)), month: Number(parsedValue.slice(5, 7)) };
}

function monthId(month: number): string {
  return `${props.label}-month-${month}`;
}

function close() {
  open.value = false;
  document.getElementById(props.label)?.focus();
}

function choose(month: number) {
  emit("update:modelValue", `${viewYear.value}-${String(month).padStart(2, "0")}`);
  close();
}

function applyYear(year: number) {
  viewYear.value = year;
  yearText.value = String(year);
}

function shiftYear(delta: number) {
  applyYear(viewYear.value + delta);
}

function onYearInput(value: string | number) {
  yearText.value = String(value).replace(/\D/g, "").slice(0, 4);
  if (yearText.value.length !== 4) return;
  const year = Number(yearText.value);
  if (year >= minYear && year <= maxYear) viewYear.value = year;
}

function commitYear() {
  const year = Number(yearText.value);
  if (yearText.value.length === 4 && year >= minYear && year <= maxYear) applyYear(year);
  else yearText.value = String(viewYear.value);
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
</script>

<template>
  <div class="month-field field">
    <Label :for="label">{{ label }}</Label>
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          :id="label"
          type="button"
          variant="outline"
          class="month-trigger"
          :aria-invalid="error ? 'true' : 'false'"
          aria-haspopup="dialog"
        >
          {{ buttonText }}
        </Button>
      </PopoverTrigger>
      <PopoverContent class="month-sheet" align="start" :aria-label="label">
        <div class="month-year">
          <Button type="button" variant="outline" class="month-step" aria-label="上一年" @click="shiftYear(-1)">上年</Button>
          <Input
            class="month-year-value"
            inputmode="numeric"
            aria-label="年份"
            autocomplete="off"
            :model-value="yearText"
            @update:model-value="onYearInput"
            @blur="commitYear"
            @keydown.enter.prevent="commitYear"
          />
          <Button type="button" variant="outline" class="month-step" aria-label="下一年" @click="shiftYear(1)">下年</Button>
        </div>
        <div class="month-grid" role="grid">
          <Button
            v-for="month in 12"
            :id="monthId(month)"
            :key="month"
            type="button"
            variant="outline"
            class="month-cell"
            role="gridcell"
            :tabindex="month === focusMonth ? 0 : -1"
            :aria-selected="parsed?.year === viewYear && parsed?.month === month"
            :class="{ 'is-selected': parsed?.year === viewYear && parsed?.month === month }"
            @click="choose(month)"
            @keydown="onMonthKey($event, month)"
          >
            {{ month }}月
          </Button>
        </div>
      </PopoverContent>
    </Popover>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>
