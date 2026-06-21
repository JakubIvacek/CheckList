<template>
  <div class="day" :class="{ today: isToday }">
    <div v-if="showHeader" class="day-head">
      <div class="day-title">
        <span class="day-name" :class="{ red: isToday }">{{ dayName }}</span>
        <span class="day-date" :class="{ red: isToday }">
          {{ dateLabel }}<template v-if="isToday"> · {{ t('day.today') }}</template>
        </span>
      </div>
      <span class="day-count" :class="{ done: allDone }">{{ doneCount }} / {{ tasks.length }}</span>
    </div>

    <draggable
      :model-value="tasks"
      item-key="id"
      handle=".drag-handle"
      :animation="150"
      ghost-class="drag-ghost"
      @update:model-value="onReorder"
    >
      <template #item="{ element: task }">
        <div class="day-item">
          <!-- edit mode -->
          <div v-if="editingId === task.id" class="add-form edit-form">
            <div class="add-input-row">
              <input
                ref="editEl"
                v-model="editTitle"
                class="add-input"
                :placeholder="t('day.itemName')"
                @keyup.enter="saveEdit(task)"
                @keyup.esc="cancelEdit"
              >
              <button class="add-confirm" @click="saveEdit(task)"><i class="ti ti-check"></i></button>
              <button class="add-cancel" @click="cancelEdit"><i class="ti ti-x"></i></button>
            </div>
            <textarea
              v-model="editNote"
              class="note-input"
              rows="2"
              :placeholder="t('day.note')"
            ></textarea>
            <CategoryPicker v-model="editCat" />
            <div class="edit-bottom">
              <template v-if="moveOpen">
                <span class="eb-q">{{ t('day.moveTo') }}</span>
                <input type="date" v-model="editDate" class="date-input">
                <button class="add-confirm" @click="applyMove(task)"><i class="ti ti-check"></i></button>
                <button class="add-cancel" @click="moveOpen = false"><i class="ti ti-x"></i></button>
              </template>
              <template v-else>
                <div class="edit-actions">
                  <div class="time-row">
                    <div class="time-group">
                      <select v-model="editHour" class="time-sel" :aria-label="t('day.time')">
                        <option value="">--</option>
                        <option v-for="h in HOURS" :key="h" :value="h">{{ h }}</option>
                      </select>
                      <span class="unit">h</span>
                      <select v-model="editMin" class="time-sel" :aria-label="t('day.time')">
                        <option value="">--</option>
                        <option v-for="m in MINUTES" :key="m" :value="m">{{ m }}</option>
                      </select>
                      <span class="unit">m</span>
                    </div>
                    <select v-model="editDur" class="dur-input" :aria-label="t('day.duration')">
                      <option value="">{{ t('day.duration') }}</option>
                      <option v-for="m in DURATIONS" :key="m" :value="String(m)">{{ fmtDur(m) }}</option>
                    </select>
                  </div>
                  <div class="action-row">
                    <button class="act-btn danger" @click="removeTask(task)">
                      <i class="ti ti-trash"></i> {{ t('common.delete') }}
                    </button>
                    <button class="act-btn" @click="moveOpen = true">
                      <i class="ti ti-calendar-event"></i> {{ t('day.moveTo') }}
                    </button>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- normal row (swipe: → done, ← delete) -->
          <div v-else class="swipe-wrap">
            <template v-if="swipeId === task.id">
              <div v-if="swipeDx > 0" class="swipe-bg left" :class="{ ready: swipeDx > SWIPE_TH }">
                <i class="ti" :class="task.status === 'done' ? 'ti-rotate-2' : 'ti-check'"></i>
              </div>
              <div v-else-if="swipeDx < 0" class="swipe-bg right" :class="{ ready: swipeDx < -SWIPE_TH }">
                <i class="ti ti-trash"></i>
              </div>
            </template>
            <div
              class="trow"
              :class="{ swiping: swipeId === task.id, today: isToday }"
              :style="swipeStyle(task.id)"
              @touchstart="onRowDown($event, task)"
              @touchmove="onRowMove($event, task)"
              @touchend="onRowUp($event, task)"
            >
              <button
                type="button"
                class="check"
                :class="{ checked: task.status === 'done' }"
                @click="tasksStore.toggleTask(task)"
                :aria-label="task.status === 'done' ? t('day.markUndone') : t('day.markDone')"
              >
                <i v-if="task.status === 'done'" class="ti ti-check"></i>
              </button>
              <span v-if="task.task_time || task.duration_min" class="row-time" :class="{ done: task.status === 'done' }">{{ timeLabel(task) }}</span>
              <button type="button" class="row-text-btn" @click="openEdit(task)">
                <span class="row-text" :class="{ done: task.status === 'done' }">{{ task.title }}</span>
                <span v-if="task.note" class="row-note">{{ task.note }}</span>
              </button>
              <span
                v-if="catColor(task.category_id)"
                class="cat-dot"
                :style="{ background: catColor(task.category_id)! }"
              ></span>
              <button
                type="button"
                class="flag-dot"
                :class="{ on: task.priority }"
                @click.stop="toggleFlag(task)"
                :aria-label="t('day.priority')"
              ><i class="ti ti-flag"></i></button>
              <span class="drag-handle" :aria-label="t('day.reorder')"><i class="ti ti-grip-vertical"></i></span>
            </div>
          </div>
        </div>
      </template>
    </draggable>

    <div v-for="tomb in tombstones" :key="'tomb-' + tomb.id" class="trow tomb-row">
      <span class="tomb-icon"><i class="ti ti-trash"></i></span>
      <span class="tomb-text">{{ tomb.title }}</span>
      <button type="button" class="tomb-undo" @click="undoTomb(tomb)">
        <i class="ti ti-arrow-back-up"></i> {{ t('undo.action') }}
      </button>
    </div>

    <template v-if="canAdd">
      <div v-if="adding" class="add-form">
        <div class="add-input-row">
          <input
            ref="inputEl"
            v-model="newTitle"
            class="add-input"
            :placeholder="t('day.itemName')"
            @keyup.enter="submit"
            @keyup.esc="cancel"
          >
          <button class="add-confirm" @click="submit"><i class="ti ti-check"></i></button>
          <button class="add-cancel" @click="cancel"><i class="ti ti-x"></i></button>
        </div>
        <div class="time-row">
          <div class="time-group">
            <select v-model="newHour" class="time-sel" :aria-label="t('day.time')">
              <option value="">--</option>
              <option v-for="h in HOURS" :key="h" :value="h">{{ h }}</option>
            </select>
            <span class="unit">h</span>
            <select v-model="newMin" class="time-sel" :aria-label="t('day.time')">
              <option value="">--</option>
              <option v-for="m in MINUTES" :key="m" :value="m">{{ m }}</option>
            </select>
            <span class="unit">m</span>
          </div>
          <select v-model="newDur" class="dur-input" :aria-label="t('day.duration')">
            <option value="">{{ t('day.duration') }}</option>
            <option v-for="m in DURATIONS" :key="m" :value="String(m)">{{ fmtDur(m) }}</option>
          </select>
        </div>
        <CategoryPicker v-model="selectedCat" />
      </div>
      <button v-else type="button" class="trow trow-add" @click="openAdd">
        <span class="check dashed"><i class="ti ti-plus"></i></span>
        <span class="row-text muted">{{ t('day.addItem') }}</span>
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import draggable from 'vuedraggable'
import { useTasksStore } from '@/stores/tasks'
import { useCategoriesStore } from '@/stores/categories'
import CategoryPicker from '@/components/CategoryPicker.vue'
import { useFmt } from '@/i18n/dates'
import { today } from '@/lib/dates'
import type { Task } from '@/types'

const { t } = useI18n()
const fmt = useFmt()

const props = withDefaults(defineProps<{
  date: string
  tasks: Task[]
  showHeader?: boolean
}>(), { showHeader: true })

// notify parent (Home) so it can keep this day open while the undo row shows
const emit = defineEmits<{ deleted: [string] }>()

const tasksStore = useTasksStore()
const categoriesStore = useCategoriesStore()

const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240, 480, 720]
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

function fmtDur(min: number): string {
  if (min < 60) return `${min}m`
  const h = min / 60
  return `${Number.isInteger(h) ? h : h.toFixed(1)}h`
}

function timeLabel(task: Task): string {
  const time = task.task_time ? task.task_time.slice(0, 5) : ''
  const dur = task.duration_min ? fmtDur(task.duration_min) : ''
  if (time && dur) return `${time} · ${dur}`
  if (time) return time
  return `~${dur}`
}

const adding = ref(false)
const newTitle = ref('')
const newHour = ref('')
const newMin = ref('')
const newDur = ref('')
const selectedCat = ref<string | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)

const editingId = ref<string | null>(null)
const editTitle = ref('')
const editCat = ref<string | null>(null)
const editDate = ref('')
const editNote = ref('')
const editHour = ref('')
const editMin = ref('')
const editDur = ref('')

// Minute mirrors the hour: no hour → '--', picking an hour defaults minute to '00'.
watch(newHour, h => { newMin.value = h ? (newMin.value || '00') : '' })
watch(editHour, h => { editMin.value = h ? (editMin.value || '00') : '' })

// 'HH'+'MM' selects → 'HH:MM' or null when no hour picked
const composeTime = (hour: string, min: string) => (hour ? `${hour}:${min || '00'}` : null)
const moveOpen = ref(false)
const editEl = ref<HTMLInputElement[] | HTMLInputElement | null>(null)

const catColor = (id: string | null) => categoriesStore.color(id)

function toggleFlag(task: Task) {
  tasksStore.updateTask(task.id, { priority: !task.priority })
}

async function openEdit(task: Task) {
  editingId.value = task.id
  editTitle.value = task.title
  editCat.value = task.category_id
  editDate.value = task.task_date
  editNote.value = task.note ?? ''
  editHour.value = task.task_time ? task.task_time.slice(0, 2) : ''
  editMin.value = task.task_time ? task.task_time.slice(3, 5) : ''
  editDur.value = task.duration_min != null ? String(task.duration_min) : ''
  moveOpen.value = false
  await nextTick()
  const el = Array.isArray(editEl.value) ? editEl.value[0] : editEl.value
  el?.focus()
}

async function saveEdit(task: Task) {
  const title = editTitle.value.trim()
  if (!title) return
  await tasksStore.updateTask(task.id, {
    title, category_id: editCat.value, note: editNote.value.trim() || null,
    task_time: composeTime(editHour.value, editMin.value),
    duration_min: editDur.value ? Number(editDur.value) : null,
  })
  editingId.value = null
}

async function applyMove(task: Task) {
  if (editDate.value && editDate.value !== task.task_date) {
    await tasksStore.updateTask(task.id, { task_date: editDate.value })
    editingId.value = null // task moved to another day, leaves this list
  } else {
    moveOpen.value = false
  }
}

function onReorder(ordered: Task[]) {
  tasksStore.reorderTasks(props.date, ordered.map(x => x.id))
}

// Swipe a task row: → mark done/undone, ← delete. (touch only)
const SWIPE_TH = 80
const swipeId = ref<string | null>(null)
const swipeDx = ref(0)
let sx = 0, sy = 0, swiping = false, horizontal = false

function swipeStyle(id: string) {
  if (swipeId.value !== id) return undefined
  return { transform: `translateX(${swipeDx.value}px)`, transition: 'none' }
}

function onRowDown(e: TouchEvent, task: Task) {
  sx = e.touches[0].clientX; sy = e.touches[0].clientY
  swiping = true; horizontal = false
  swipeId.value = task.id; swipeDx.value = 0
}

function onRowMove(e: TouchEvent, _task: Task) {
  if (!swiping) return
  const dx = e.touches[0].clientX - sx
  const dy = e.touches[0].clientY - sy
  if (!horizontal) {
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) horizontal = true
    else if (Math.abs(dy) > 10) { swiping = false; swipeId.value = null; return } // vertical scroll
    else return
  }
  e.preventDefault()        // lock to horizontal, stop the list scrolling
  e.stopPropagation()       // don't trigger week-swipe on the home root
  swipeDx.value = dx
}

function onRowUp(e: TouchEvent, task: Task) {
  if (horizontal) e.stopPropagation()
  const dx = swipeDx.value
  swiping = false; horizontal = false
  swipeId.value = null; swipeDx.value = 0
  if (dx > SWIPE_TH) tasksStore.toggleTask(task)
  else if (dx < -SWIPE_TH) deleteWithUndo(task)
}

// Delete, leaving an inline "deleted · undo" tombstone row in its place for ~5s.
const tombstones = ref<Task[]>([])
const tombTimers = new Map<string, ReturnType<typeof setTimeout>>()

async function deleteWithUndo(task: Task) {
  const snapshot = { ...task }
  await tasksStore.deleteTask(task.id)
  emit('deleted', props.date)
  tombstones.value.push(snapshot)
  tombTimers.set(snapshot.id, setTimeout(() => {
    tombstones.value = tombstones.value.filter(x => x.id !== snapshot.id)
    tombTimers.delete(snapshot.id)
  }, 5000))
}

async function undoTomb(tomb: Task) {
  const tmr = tombTimers.get(tomb.id)
  if (tmr) { clearTimeout(tmr); tombTimers.delete(tomb.id) }
  tombstones.value = tombstones.value.filter(x => x.id !== tomb.id)
  await tasksStore.restoreTask(tomb)
}

function cancelEdit() {
  editingId.value = null
}

async function removeTask(task: Task) {
  editingId.value = null
  await deleteWithUndo(task)
}

const isToday = computed(() => props.date === today())
// Add is allowed on today + future days only (past days have no add affordance).
const canAdd = computed(() => props.date >= today())
const dayName = computed(() => fmt.dayName(props.date))
const dateLabel = computed(() => fmt.dayMonthLabel(props.date))
const doneCount = computed(() => props.tasks.filter(t => t.status === 'done').length)
const allDone = computed(() => props.tasks.length > 0 && doneCount.value === props.tasks.length)

async function openAdd() {
  adding.value = true
  await nextTick()
  inputEl.value?.focus()
}

async function submit() {
  const title = newTitle.value.trim()
  if (!title) return
  await tasksStore.addTask(
    title, props.date, selectedCat.value,
    composeTime(newHour.value, newMin.value),
    newDur.value ? Number(newDur.value) : null,
  )
  newTitle.value = ''
  newHour.value = ''
  newMin.value = ''
  newDur.value = ''
  selectedCat.value = null
  adding.value = false
}

function cancel() {
  newTitle.value = ''
  newHour.value = ''
  newMin.value = ''
  newDur.value = ''
  adding.value = false
}

defineExpose({ openAdd })
</script>

<style scoped>
.day { padding: 13px 18px; }
.day.today { background: var(--color-background-secondary); }

.day-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
}
.day-title { display: flex; align-items: baseline; gap: 8px; }
.day-name { font-size: 16px; font-weight: 500; color: var(--color-text-primary); }
.day-date { font-size: 13px; color: var(--color-text-tertiary); }
.day-name.red, .day-date.red { color: var(--color-text-danger); }
.day-count { font-size: 12px; color: var(--color-text-secondary); }
.day-count.done { color: var(--color-text-success); }

.trow {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 6px 0;
  cursor: pointer;
}

/* swipe: → done, ← delete (mobile) */
.swipe-wrap { position: relative; overflow: hidden; }
.swipe-bg {
  position: absolute; inset: 0;
  display: flex; align-items: center;
  padding: 0 18px; color: #fff; font-size: 18px;
  filter: saturate(0.85) brightness(0.85); transition: filter .1s;
}
.swipe-bg.ready { filter: none; }
.swipe-bg.left { justify-content: flex-start; background: var(--color-text-success); }
.swipe-bg.right { justify-content: flex-end; background: var(--color-text-danger); }
.swipe-wrap .trow.swiping { position: relative; background: var(--color-background-primary); transition: transform .2s; }
.swipe-wrap .trow.swiping.today { background: var(--color-background-secondary); }

/* inline undo row left where a deleted task was */
.tomb-row { gap: 11px; color: var(--color-text-tertiary); cursor: default; }
.tomb-icon { display: flex; align-items: center; font-size: 16px; }
.tomb-text { flex: 1; min-width: 0; font-size: 15px; text-decoration: line-through; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tomb-undo {
  display: flex; align-items: center; gap: 5px; flex-shrink: 0;
  border: none; cursor: pointer; padding: 5px 12px; border-radius: 999px;
  background: var(--color-background-info); color: var(--color-text-info);
  font-size: 13px; font-weight: 500;
}
.tomb-undo i { font-size: 15px; }
.check {
  width: 22px; height: 22px;
  border-radius: 50%;
  border: 2px solid var(--color-border-secondary);
  background: transparent;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  padding: 0; cursor: pointer;
  color: #fff;
  transition: background-color .2s ease, border-color .2s ease, transform .1s ease;
}
.check:active { transform: scale(0.88); }
.check.checked { background: var(--color-text-success); border-color: var(--color-text-success); }
.check.checked i { font-size: 14px; animation: check-pop .25s ease; }
.check.dashed {
  border-style: dashed;
  border-color: var(--color-border-tertiary);
  color: var(--color-text-tertiary);
}
.check.dashed i { font-size: 13px; }

.row-text-btn { flex: 1; min-width: 0; border: none; background: none; text-align: left; padding: 0; cursor: text; display: flex; flex-direction: column; gap: 2px; }
.row-note {
  font-size: 12px; color: var(--color-text-tertiary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
}
.row-time {
  flex-shrink: 0; font-size: 13px; font-variant-numeric: tabular-nums;
  color: var(--color-text-secondary); min-width: 38px;
}
.row-time.done { color: var(--color-text-tertiary); text-decoration: line-through; }
.row-text {
  font-size: 15px; color: var(--color-text-primary);
  position: relative; align-self: flex-start; max-width: 100%;
  transition: color .25s ease;
}
.row-text::after {
  content: ''; position: absolute; left: 0; top: 52%;
  width: 100%; height: 1.5px; background: currentColor; border-radius: 1px;
  transform: scaleX(0); transform-origin: left; transition: transform .25s ease;
}
.row-text.done { color: var(--color-text-tertiary); }
.row-text.done::after { transform: scaleX(1); }
.flag-dot {
  border: none; background: none; cursor: pointer; padding: 2px; flex-shrink: 0;
  display: flex; align-items: center; font-size: 16px; color: var(--color-text-tertiary);
}
.flag-dot.on { color: var(--color-text-info); }
.row-text.muted { font-size: 14px; color: var(--color-text-tertiary); }
.trow-add { background: none; border: none; width: 100%; text-align: left; }

.cat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

.drag-handle {
  display: flex; align-items: center; flex-shrink: 0;
  color: var(--color-text-tertiary); font-size: 18px;
  cursor: grab; padding: 0 2px; touch-action: none;
}
.drag-handle:active { cursor: grabbing; }
.drag-ghost { opacity: 0.4; }

.edit-bottom { display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap; padding: 0 5px; }
.edit-actions { width: 100%; display: flex; flex-direction: column; gap: 8px; padding: 0 10%; box-sizing: border-box; }
@media (max-width: 600px) { .edit-actions { padding: 0 5%; } }
.time-group { display: flex; align-items: center; gap: 4px; flex: 1; min-width: 0; }
.time-group .time-sel { flex: 1; min-width: 0; text-align: center; }
.unit { font-size: 12px; color: var(--color-text-tertiary); }
.time-row .dur-input { flex: 1; min-width: 0; }
.action-row { display: flex; gap: 10px; }
.action-row > button { flex: 1; justify-content: center; }
.eb-q { font-size: 14px; color: var(--color-text-secondary); }
.date-input {
  border: 0.5px solid var(--color-border-secondary);
  border-radius: var(--border-radius-md);
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  height: 34px; padding: 0 10px; font-size: 14px;
}
.date-input:focus { outline: none; border-color: var(--color-text-info); }

.add-form { display: flex; flex-direction: column; gap: 8px; padding: 6px 0; }
.edit-form {
  border-top: 0.5px solid var(--color-border-secondary);
  border-bottom: 0.5px solid var(--color-border-secondary);
  margin: 4px 0;
  padding: 12px 0 8px;
}
.add-input-row { display: flex; align-items: center; gap: 8px; }
.add-input {
  flex: 1;
  border: 0.5px solid var(--color-border-secondary);
  border-radius: var(--border-radius-md);
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  padding: 8px 10px;
  font-size: 15px;
}
.add-input:focus { outline: none; border-color: var(--color-text-info); }
.note-input {
  border: 0.5px solid var(--color-border-secondary);
  border-radius: var(--border-radius-md);
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  padding: 8px 10px; font-size: 14px; font-family: inherit; resize: vertical;
}
.note-input:focus { outline: none; border-color: var(--color-text-info); }
.time-row { display: flex; align-items: center; gap: 8px; color: var(--color-text-tertiary); }
.time-sel, .dur-input {
  border: 0.5px solid var(--color-border-secondary);
  border-radius: var(--border-radius-md);
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  height: 34px; padding: 0 8px; font-size: 14px; font-family: inherit; cursor: pointer;
}
.time-sel:focus, .dur-input:focus { outline: none; border-color: var(--color-text-info); }
.time-sel:disabled { opacity: 0.5; cursor: default; }
.add-confirm, .add-cancel {
  width: 34px; height: 34px; border-radius: var(--border-radius-md);
  border: none; cursor: pointer; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.add-confirm { background: var(--color-text-success); color: #fff; }
.add-cancel { background: var(--color-background-tertiary); color: var(--color-text-secondary); }

/* subtle press feedback on tap */
.flag-dot, .add-confirm, .add-cancel, .tomb-undo {
  transition: transform .1s ease, background-color .15s ease, color .15s ease;
}
.flag-dot:active, .add-confirm:active, .add-cancel:active, .tomb-undo:active { transform: scale(0.92); }

@keyframes check-pop {
  0% { transform: scale(0.2); opacity: 0; }
  60% { transform: scale(1.25); opacity: 1; }
  100% { transform: scale(1); }
}

.tomb-row { animation: tomb-in .2s ease; }
@keyframes tomb-in {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}

/* respect users who prefer less motion */
@media (prefers-reduced-motion: reduce) {
  .check, .check.checked i, .row-text, .row-text::after, .tomb-row,
  .flag-dot, .add-confirm, .add-cancel, .act-btn, .tomb-undo {
    transition: none !important; animation: none !important;
  }
  .row-text.done { text-decoration: line-through; }
  .row-text.done::after { display: none; }
}
</style>
