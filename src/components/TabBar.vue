<template>
  <nav class="tab-bar">
    <RouterLink to="/" class="nav-link" :class="{ active: $route.path === '/' }">
      <span class="icon">🏠</span>
      <small>Domov</small>
    </RouterLink>
    <RouterLink to="/calendar" class="nav-link" :class="{ active: $route.path === '/calendar' }">
      <span class="icon">📅</span>
      <small>Kalendár</small>
    </RouterLink>
    <RouterLink to="/stats" class="nav-link" :class="{ active: $route.path === '/stats' }">
      <span class="icon">📊</span>
      <small>Štatistiky</small>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
</script>

<style scoped>
.tab-bar {
  display: flex;
  justify-content: space-around;
  background: #0d0d0d;
  border-top: 1px solid #333;
  padding: 12px 0;
  gap: 0;
}

.nav-link {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: #666;
  transition: all 0.2s;
  padding: 8px;
  cursor: pointer;
}

.nav-link:hover {
  color: #999;
}

.nav-link.active {
  color: #4a9eff;
}

.nav-link .icon {
  font-size: 1.3rem;
}

.nav-link small {
  font-size: 0.7rem;
  letter-spacing: 0.3px;
}
</style>
