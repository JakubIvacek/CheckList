<template>
  <div class="container-fluid p-3">
    <h3 class="mb-4">Kalendár</h3>
    <div class="row">
      <div class="col">
        <div id="calendar"></div>
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
  // TODO: integrácia s bibliotékou pre kalendár
})
</script>
