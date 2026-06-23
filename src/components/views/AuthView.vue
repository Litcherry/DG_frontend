<template>
  <section id="authView" class="auth-view">
    <div class="auth-hero">
      <div class="brand-row">
        <div class="brand-mark">DG</div>
        <div>
          <strong>AI 智能导览平台</strong>
          <span>知识库驱动的数字人导览服务</span>
        </div>
      </div>
      <div class="hero-copy">
        <p class="eyebrow">知识库驱动的智能讲解</p>
        <h1>让每一次探索，都有 AI 导览员陪伴</h1>
        <p>系统根据当前场景知识库提供内容讲解、智能问答与路线推荐，适用于景区、展馆、博物馆、校园及园区等多种场景。</p>
      </div>
      <div class="hero-services" aria-label="导览服务">
        <div><span class="hero-service-icon">讲</span><strong>景点讲解</strong><small>历史文化与景观故事</small></div>
        <div><span class="hero-service-icon">线</span><strong>路线规划</strong><small>按时间与兴趣推荐</small></div>
        <div><span class="hero-service-icon">问</span><strong>随时问答</strong><small>语音或文字轻松咨询</small></div>
      </div>
    </div>

    <div class="auth-panel">
      <div class="role-switch">
        <button id="visitorRoleBtn" class="active" type="button">游客入口</button>
        <button id="adminRoleBtn" type="button">管理后台</button>
      </div>
      <form id="visitorLoginForm" class="login-card active">
        <span class="visitor-welcome-mark">DG</span>
        <div class="visitor-welcome-copy">
          <span>当前场景智慧导览</span>
          <h2>开启智能导览</h2>
          <p>AI 导览员将根据管理后台配置的知识库，为你讲解内容、规划路线并解答问题。</p>
        </div>
        <div class="visitor-start-list">
          <span>景点故事随时听</span>
          <span>个性路线轻松规划</span>
          <span>服务信息一问即得</span>
        </div>
        <input id="visitorNameInput" type="hidden" value="访客" />
        <button class="primary wide visitor-start-button" type="submit">
          <span>开始导览</span>
          <span aria-hidden="true">→</span>
        </button>
        <small class="visitor-start-note">点击即进入，无需登录</small>
      </form>
      <form id="adminLoginForm" class="login-card">
        <h2>管理员登录</h2>
        <p>用于维护知识库、景点路线、数字人配置，并查看运营数据。</p>
        <label>账号
          <input id="username" type="text" value="admin" autocomplete="username" />
        </label>
        <label>密码
          <input id="password" type="password" placeholder="默认 admin123" autocomplete="current-password" />
        </label>
        <button class="primary wide" type="submit">登录管理后台</button>
      </form>
    </div>
  </section>
</template>
