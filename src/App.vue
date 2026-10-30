<script setup lang="ts">
import { ref, watch } from "vue";
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
const now = shanghaiYearMonth();

function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored = raw ? draftFromUnknown(JSON.parse(raw)) : null;
    return syncDerived(stored ?? defaultDraft(now), now);
  } catch {
    return syncDerived(defaultDraft(now), now);
  }
}

const draft = ref<Draft>(loadDraft());

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
