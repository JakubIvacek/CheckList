<template>
  <div class="d-flex flex-column" style="height: 100vh;">
    <main class="flex-grow-1 overflow-auto">
      <RouterView />
    </main>
    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import TabBar from '@/components/TabBar.vue'

const auth = useAuthStore()
onMounted(() => auth.init())
</script>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>
