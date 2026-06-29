<script setup>
import LegacyViews from "../views/LegacyViews.vue";

const emit = defineEmits(["views-ready"]);
</script>

<template>
  <div id="appShell" class="app-shell hidden">
    <aside id="sidebar" class="sidebar">
      <button id="sidebarToggle" class="sidebar-toggle" type="button" title="收起侧栏" aria-label="收起侧栏">
        <span class="panel-toggle-icon"></span>
      </button>
      <div class="brand-row compact">
        <div class="brand-mark">DG</div>
        <div class="sidebar-text">
          <strong>AI 数字人导览</strong>
          <span id="sessionLabel">未登录</span>
        </div>
      </div>
      <nav id="roleNav" class="nav"></nav>
      <div class="sidebar-footer-actions">
        <button id="homeBtn" class="ghost wide" type="button">返回首页</button>
        <button id="logoutBtn" class="ghost wide" type="button">退出当前身份</button>
      </div>
    </aside>
    <main class="main-area">
      <LegacyViews @ready="emit('views-ready')" />
    </main>
  </div>
</template>
