<template>
  <div class="container-fluid p-3">
    <h3 class="mb-4">Štatistiky</h3>
    <div class="row">
      <div class="col-12 col-md-6">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Hotové úlohy</h5>
            <canvas id="completionChart"></canvas>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-6">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Trend</h5>
            <canvas id="trendChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  if (!authStore.session) {
    authStore.signInWithGoogle()
  }
  // TODO: integrácia s Chart.js pre štatistiky
})
</script>
