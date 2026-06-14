<template>
  <div>
    <div v-for="day in groupedByDate" :key="day.date" class="mb-4">
      <h5 class="ms-3 mb-3">{{ formatDate(day.date) }}</h5>
      <div v-if="day.tasks.length > 0" class="list-group ms-2 me-2">
        <label v-for="task in day.tasks" :key="task.id" class="list-group-item d-flex gap-2">
          <input 
            type="checkbox" 
            :checked="task.status === 'done'"
            @change="() => tasksStore.toggleTask(task)"
          >
          <span :class="{ 'text-decoration-line-through': task.status === 'done' }">
            {{ task.title }}
          </span>
        </label>
      </div>
      <div v-else class="text-muted ms-3 small">Žiadne úlohy</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import type { Task } from '@/types'

const tasksStore = useTasksStore()

defineProps<{
  tasks: Task[]
}>()

const groupedByDate = computed(() => {
  const groups: Record<string, Task[]> = {}
  
  for (const task of tasksStore.tasks) {
    if (!groups[task.task_date]) {
      groups[task.task_date] = []
    }
    groups[task.task_date].push(task)
  }
  
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, tasks]) => ({ date, tasks }))
})

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00Z')
  return date.toLocaleDateString('sk-SK', { weekday: 'long', month: 'long', day: 'numeric' })
}
</script>

<style scoped>
.text-decoration-line-through {
  text-decoration: line-through;
  color: #999;
}
</style>
