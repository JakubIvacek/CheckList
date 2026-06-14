<template>
  <div class="home-view">
    <div class="header">
      <div class="header-content">
        <h1 class="title">{{ weekTitle }}</h1>
        <p class="week-range">{{ weekLabel }}</p>
      </div>
      <div class="header-nav">
        <button @click="prevWeek" class="nav-btn">‹</button>
        <button @click="nextWeek" class="nav-btn">›</button>
      </div>
    </div>

    <div class="stats-bar">
      <div class="stat">
        <span class="stat-num">{{ completedCount }}</span>
        <span class="stat-label">Hotové</span>
      </div>
      <div class="stat">
        <span class="stat-num">{{ totalCount }}</span>
        <span class="stat-label">Spolu</span>
      </div>
      <div class="stat progress-stat">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- Daily Indicators -->
    <div class="daily-indicators">
      <div 
        v-for="day in weekDays" 
        :key="day.dateStr" 
        class="daily-bar"
        :class="{
          'completed': day.tasks.length > 0 && day.tasks.every(t => t.status === 'done'),
          'pending': day.tasks.length > 0 && !day.tasks.every(t => t.status === 'done'),
          'empty': day.tasks.length === 0
        }"
        :title="`${day.dayName} ${day.date}: ${day.tasks.filter(t => t.status === 'done').length}/${day.tasks.length}`"
      >
        <div class="bar-fill"></div>
        <span class="bar-label">{{ day.dayName.charAt(0) }}</span>
      </div>
    </div>

    <div v-if="tasksStore.loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else class="days-container">
      <div v-for="day in weekDays" :key="day.dateStr" class="day-section" :class="{ 'day-section-past': day.isPast }">
        
        <!-- PAST DAYS - Compact Strip -->
        <template v-if="day.isPast">
          <div 
            class="day-strip"
            :class="{ 
              'expanded': expandedPastDay === day.dateStr,
              'clickable': day.tasks.length > 0
            }"
            @click="day.tasks.length > 0 && (expandedPastDay = expandedPastDay === day.dateStr ? null : day.dateStr)"
          >
            <div class="strip-info">
              <span class="strip-date">{{ day.dayName }} {{ day.date }}</span>
              <span v-if="day.tasks.length > 0" class="strip-count">{{ day.tasks.filter(t => t.status === 'done').length }}/{{ day.tasks.length }}</span>
            </div>
            <div 
              v-if="day.tasks.length > 0"
              class="strip-indicator" 
              :class="{ 
                'completed': day.tasks.length > 0 && day.tasks.every(t => t.status === 'done'),
                'pending': day.tasks.length > 0 && !day.tasks.every(t => t.status === 'done'),
                'empty': day.tasks.length === 0
              }"
            ></div>
          </div>

          <!-- EXPANDED - Show tasks -->
          <div v-if="expandedPastDay === day.dateStr && day.tasks.length > 0" class="day-content expanded-tasks">
            <div class="tasks">
              <label v-for="task in day.tasks" :key="task.id" class="task">
                <input 
                  type="checkbox"
                  :checked="task.status === 'done'"
                  @change="() => tasksStore.toggleTask(task)"
                  class="checkbox"
                >
                <span class="task-text" :class="{ done: task.status === 'done' }">
                  {{ task.title }}
                </span>
              </label>
            </div>
          </div>
        </template>

        <!-- FUTURE DAYS - Full view -->
        <template v-else-if="!day.isPast">
          <div class="day-header">
            <h3>{{ day.dayName }} <span class="day-date">{{ day.date }}</span></h3>
          </div>

          <div class="day-content">
            <div v-if="day.tasks.length > 0" class="tasks">
              <label v-for="task in day.tasks" :key="task.id" class="task">
                <input 
                  type="checkbox"
                  :checked="task.status === 'done'"
                  @change="() => tasksStore.toggleTask(task)"
                  class="checkbox"
                >
                <span class="task-text" :class="{ done: task.status === 'done' }">
                  {{ task.title }}
                </span>
                <span class="task-indicator" :class="{ completed: task.status === 'done' }"></span>
              </label>
            </div>

            <button 
              @click="editingDay = editingDay === day.dateStr ? null : day.dateStr" 
              class="add-task-btn"
              :disabled="day.isPast"
            >
              + Pridať položku
            </button>

            <div v-if="editingDay === day.dateStr && !day.isPast" class="add-task-form">
              <input 
                v-model="newTaskTitle"
                placeholder="Názov úlohy"
                class="task-input"
                @keyup.enter="addNewTask(day.dateStr)"
                autofocus
              >
              <div class="form-buttons">
                <button @click="addNewTask(day.dateStr)" class="btn-save">Pridať</button>
                <button @click="editingDay = null" class="btn-cancel">Zrušiť</button>
              </div>
            </div>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { useAuthStore } from '@/stores/auth'

const tasksStore = useTasksStore()
const authStore = useAuthStore()

const editingDay = ref<string | null>(null)
const newTaskTitle = ref('')
const weekStart = ref(getMonday(new Date()))
const expandedPastDay = ref<string | null>(null)

const weekLabel = computed(() => {
  const start = new Date(weekStart.value + 'T00:00:00Z')
  const end = new Date(new Date(weekStart.value).getTime() + 6 * 24 * 60 * 60 * 1000)
  const fmt = (d: Date) => d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
})

const weekTitle = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  const currentWeekStart = getMonday(new Date())
  
  if (weekStart.value === currentWeekStart) {
    return 'Tento týždeň'
  } else if (weekStart.value < currentWeekStart) {
    return 'Minulý týždeň'
  } else {
    return 'Budúci týždeň'
  }
})

const weekDays = computed(() => {
  const days = []
  const dayNames = ['Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota', 'Nedeľa']
  const today = new Date().toISOString().split('T')[0]
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(new Date(weekStart.value).getTime() + i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0]
    const dayName = dayNames[i]
    const dayDate = date.toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric' })
    const tasks = tasksStore.tasks.filter(t => t.task_date === dateStr)
    const isPast = dateStr < today
    const isToday = dateStr === today
    
    days.push({ dateStr, dayName, date: dayDate, tasks, isPast, isToday })
  }
  return days
})

const totalCount = computed(() => {
  const weekTasksCount = weekDays.value.reduce((sum, day) => sum + day.tasks.length, 0)
  return weekTasksCount
})

const completedCount = computed(() => {
  const weekCompletedCount = weekDays.value.reduce((sum, day) => sum + day.tasks.filter(t => t.status === 'done').length, 0)
  return weekCompletedCount
})
const progressPercent = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

onMounted(async () => {
  try {
    if (!authStore.session) {
      await authStore.signInWithGoogle()
    }
    await loadWeek()
  } catch (error) {
    console.error('HomeView error:', error)
  }
})

function getMonday(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff)).toISOString().split('T')[0]
}

async function loadWeek() {
  const from = weekStart.value
  const to = new Date(new Date(from).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  try {
    await tasksStore.fetchRange(from, to)
    // Add mock data for past days (for testing)
    const mockDates = ['2026-06-10', '2026-06-11', '2026-06-12']
    const mockTitles = ['Obvolať klienta', 'Upraviť report', 'Schválenie návrhu', 'Email odpoveď', 'Meeting PM']
    mockDates.forEach((dateStr, idx) => {
      if (tasksStore.tasks.filter(t => t.task_date === dateStr).length === 0) {
        tasksStore.tasks.push({
          id: `mock-${dateStr}-${idx}`,
          title: mockTitles[idx % mockTitles.length],
          task_date: dateStr,
          status: idx === 1 ? 'done' : 'todo',
          category_id: null,
          note: null,
          created_at: new Date().toISOString(),
          completed_at: idx === 1 ? new Date().toISOString() : null,
          user_id: authStore.session?.user.id || ''
        })
      }
    })
  } catch (error) {
    console.error('fetchRange error:', error)
  }
}

function prevWeek() {
  weekStart.value = new Date(new Date(weekStart.value).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  loadWeek()
}

function nextWeek() {
  weekStart.value = new Date(new Date(weekStart.value).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  loadWeek()
}

function isDateInPast(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return dateStr < today
}

function addNewTask(dateStr: string) {
  if (!newTaskTitle.value.trim()) return
  if (isDateInPast(dateStr)) return
  try {
    tasksStore.addTask(newTaskTitle.value, dateStr)
    newTaskTitle.value = ''
    editingDay.value = null
  } catch (error) {
    console.error('addTask error:', error)
  }
}
</script>

<style scoped>
.home-view {
  background: #1a1a1a;
  color: #e0e0e0;
  min-height: 100vh;
  padding-bottom: 100px;
}

.header {
  padding: 16px;
  background: #0d0d0d;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.header-content {
  flex: 1;
}

.title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
}

.week-range {
  margin: 4px 0 0 0;
  font-size: 0.85rem;
  color: #999;
}

.header-nav {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.nav-btn {
  background: none;
  border: 1px solid #444;
  color: #999;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn:hover {
  background: #333;
  color: #fff;
  border-color: #555;
}

.stats-bar {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: #222;
  border-bottom: 1px solid #333;
}

.stat {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-num {
  font-size: 1.2rem;
  font-weight: 700;
  color: #4a9eff;
}

.stat-label {
  font-size: 0.7rem;
  color: #666;
  text-transform: uppercase;
}

.progress-stat {
  flex: 1;
  justify-content: flex-start;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.progress-track {
  width: 100%;
  height: 4px;
  background: #333;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ade80, #22c55e);
  transition: width 0.3s ease;
}

/* Daily Indicators */
.daily-indicators {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  gap: 8px;
  padding: 16px 12px 8px;
  background: #1a1a1a;
  border-bottom: 1px solid #333;
  min-height: 80px;
}

.daily-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
  cursor: default;
  transition: all 0.2s;
}

.bar-fill {
  width: 100%;
  height: 30px;
  background: #666;
  border-radius: 3px 3px 0 0;
  transition: all 0.2s;
}

.daily-bar.completed .bar-fill {
  background: #4ade80;
  height: 50px;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.3);
}

.daily-bar.pending .bar-fill {
  background: #ef4444;
  height: 35px;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
}

.daily-bar.empty .bar-fill {
  background: #444;
  height: 20px;
}

.bar-label {
  font-size: 0.75rem;
  color: #999;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #333;
  border-top-color: #4a9eff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.days-container {
  padding: 12px;
}

.day-section {
  margin-bottom: 12px;
  background: #222;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #333;
  transition: all 0.2s;
}

.day-section-past {
  margin-bottom: 6px;
  background: transparent;
  border: none;
  padding: 0;
}

.day-strip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #2a2a2a;
  border: 1px solid #333;
  border-radius: 4px;
  cursor: default;
  transition: all 0.2s;
  margin-bottom: 6px;
}

.day-strip.clickable {
  cursor: pointer;
}

.day-strip.clickable:hover {
  background: #333;
  border-color: #444;
}

.day-strip.expanded {
  border-radius: 4px 4px 0 0;
  margin-bottom: 0;
}

.strip-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.strip-date {
  font-size: 0.9rem;
  color: #e0e0e0;
  min-width: 100px;
}

.strip-count {
  font-size: 0.85rem;
  color: #999;
  font-weight: 500;
}

.strip-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: all 0.2s;
}

.strip-indicator.completed {
  background: #4ade80;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.3);
}

.strip-indicator.pending {
  background: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
}

.strip-indicator.empty {
  background: #666;
}

.expanded-tasks {
  background: #2a2a2a;
  border: 1px solid #333;
  border-top: none;
  border-radius: 0 0 4px 4px;
  padding: 0;
}

.day-header {
  padding: 12px 16px;
  background: #2a2a2a;
  border-bottom: 1px solid #333;
  transition: all 0.2s;
}

.day-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  transition: font-size 0.2s;
}

.day-date {
  color: #999;
  font-size: 0.85rem;
  font-weight: 400;
  margin-left: 8px;
}

.day-content {
  padding: 0;
  transition: all 0.2s;
}

.tasks {
  border-bottom: 1px solid #333;
  display: flex;
  flex-direction: column;
}

.expanded-tasks .tasks {
  border-bottom: none;
}

.task {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #2a2a2a;
  transition: background 0.2s;
}

.task:hover {
  background: #2a2a2a;
}

.task:last-of-type {
  border-bottom: none;
}

.expanded-tasks .task {
  padding: 10px 12px;
  font-size: 0.9rem;
}

.checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #4ade80;
  flex-shrink: 0;
}

.task-text {
  flex: 1;
  color: #e0e0e0;
  font-size: 0.95rem;
  word-break: break-word;
}

.task-text.done {
  text-decoration: line-through;
  color: #666;
}

.task-indicator {
  width: 3px;
  height: 20px;
  background: transparent;
  border-radius: 2px;
  transition: background 0.2s;
  flex-shrink: 0;
}

.task-indicator.completed {
  background: #4ade80;
}

.add-task-btn {
  width: 100%;
  padding: 12px;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 0.9rem;
  transition: color 0.2s;
  border-top: 1px solid #2a2a2a;
  text-align: left;
}

.add-task-btn:hover:not(:disabled) {
  color: #999;
  background: #2a2a2a;
}

.add-task-btn:disabled {
  cursor: not-allowed;
  opacity: 0;
  pointer-events: none;
  padding: 0;
  border: none;
  height: 0;
  overflow: hidden;
}

.add-task-form {
  padding: 12px 16px;
  background: #2a2a2a;
  border-top: 1px solid #333;
}

.task-input {
  width: 100%;
  padding: 10px;
  background: #333;
  border: 1px solid #444;
  border-radius: 4px;
  color: #e0e0e0;
  margin-bottom: 10px;
  font-size: 0.95rem;
  font-family: inherit;
}

.task-input:focus {
  outline: none;
  border-color: #4a9eff;
  background: #3a3a3a;
}

.task-input::placeholder {
  color: #666;
}

.form-buttons {
  display: flex;
  gap: 8px;
}

.btn-save,
.btn-cancel {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-save {
  background: #4ade80;
  color: #000;
}

.btn-save:hover {
  background: #22c55e;
}

.btn-cancel {
  background: #444;
  color: #e0e0e0;
}

.btn-cancel:hover {
  background: #555;
}
</style>
