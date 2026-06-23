<script setup>
import { nextTick, ref } from "vue";
import AuthView from "./components/views/AuthView.vue";
import AppShell from "./components/layout/AppShell.vue";

const bootError = ref("");
let booted = false;

async function handleViewsReady() {
  if (booted) return;
  booted = true;
  await nextTick();
  try {
    const { bootstrapLegacyApp } = await import("./legacy/runtime.js");
    await bootstrapLegacyApp();
  } catch (error) {
    console.error(error);
    bootError.value = error?.message || "应用初始化失败";
  }
}
</script>

<template>
  <AuthView />
  <AppShell @views-ready="handleViewsReady" />
  <div id="toast" class="toast"></div>
  <div v-if="bootError" class="bootstrap-error">
    <strong>页面加载失败</strong>
    <p>{{ bootError }}</p>
  </div>
</template>
