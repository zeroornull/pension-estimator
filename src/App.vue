<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  defaultDraft,
  draftFromUnknown,
  shanghaiYearMonth,
  syncDerived,
  type Draft,
} from "./domain.ts";
import EstimateResult from "./EstimateResult.vue";
import EstimatorForm from "./EstimatorForm.vue";
import { POLICIES } from "./policies.ts";

const STORAGE_KEY = "pension-estimator.draft.v1";
const now = ref(shanghaiYearMonth());

function loadDraft(): Draft {
  const current = now.value;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored = raw ? draftFromUnknown(JSON.parse(raw), current) : null;
    return syncDerived(stored ?? defaultDraft(current), current);
  } catch {
    return syncDerived(defaultDraft(current), current);
  }
}

const draft = ref<Draft>(loadDraft());

function refreshNow() {
  const next = shanghaiYearMonth();
  if (next === now.value) return;
  now.value = next;
  draft.value = syncDerived(draft.value, next);
}

function onVisible() {
  if (document.visibilityState === "visible") refreshNow();
}

let clock = 0;

onMounted(() => {
  document.addEventListener("visibilitychange", onVisible);
  clock = window.setInterval(refreshNow, 60_000);
});

onBeforeUnmount(() => {
  document.removeEventListener("visibilitychange", onVisible);
  window.clearInterval(clock);
});

watch(
  draft,
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // The estimate still works when storage is blocked.
    }
  },
  { deep: true },
);
</script>

<template>
  <main class="page">
    <header class="mast">
      <h1>职工基本养老金估算</h1>
      <p class="lede">先选退休地和出生年月。改一个数，每月金额马上变。</p>
      <p class="trust">计算在这台浏览器里完成，参数不上传。</p>
    </header>
    <div class="layout">
      <EstimateResult :draft="draft" :now="now" />
      <EstimatorForm v-model="draft" :now="now" />
    </div>
    <section class="policies" aria-labelledby="policies-title">
      <h2 id="policies-title">政策依据与官方查询</h2>
      <p class="lede">国家层面政策原文与官方服务入口，均在新窗口打开。地方参数仍以退休地最新通知为准。</p>
      <ul class="policy-list">
        <li v-for="item in POLICIES" :key="item.href">
          <a :href="item.href" target="_blank" rel="noopener noreferrer">
            <span class="policy-title">{{ item.title }}</span>
            <span class="policy-meta">{{ item.meta }}</span>
            <span class="policy-source">来源：{{ item.source }}</span>
          </a>
        </li>
      </ul>
    </section>
  </main>
</template>
