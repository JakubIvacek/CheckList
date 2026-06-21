<template>
  <transition name="sheet">
    <div v-if="modelValue" class="sheet-backdrop" @click.self="close">
      <div class="sheet">
        <div class="sheet-grip"></div>
        <div class="sheet-head">
          <div class="sheet-title">{{ t('cat.title') }}</div>
          <button class="icon-btn" @click="close" :aria-label="t('cat.closeAria')"><i class="ti ti-x"></i></button>
        </div>

        <div class="list">
          <div v-for="c in store.categories" :key="c.id" class="cat">
            <div class="cat-main">
              <div v-if="swipeId === c.id && swipeDx < 0" class="swipe-bg" :class="{ ready: swipeDx < -SWIPE_TH }">
                <i class="ti ti-trash"></i>
              </div>
              <div
                class="cat-fore"
                :class="{ swiping: swipeId === c.id }"
                :style="swipeStyle(c.id)"
                @touchstart="onDown($event, c)"
                @touchmove="onMove($event, c)"
                @touchend="onUp($event, c)"
              >
                <button
                  class="swatch"
                  :style="{ background: c.color }"
                  @click="editing = editing === c.id ? null : c.id"
                  :aria-label="t('cat.colorAria')"
                ></button>
                <input
                  class="cat-name"
                  :value="c.name"
                  @change="rename(c, ($event.target as HTMLInputElement).value)"
                >
                <button class="trash" @click="deleteCat(c)" :aria-label="t('cat.deleteAria')">
                  <i class="ti ti-trash"></i>
                </button>
              </div>
            </div>
            <div v-if="editing === c.id" class="palette">
              <button
                v-for="col in PALETTE"
                :key="col"
                class="chip"
                :class="{ on: col === c.color }"
                :style="{ background: col }"
                @click="store.updateCategory(c.id, { color: col }); editing = null"
              ></button>
              <label class="chip custom" :class="{ on: !PALETTE.includes(c.color) }" :aria-label="t('cat.customColorAria')">
                <input
                  type="color"
                  :value="c.color"
                  @change="store.updateCategory(c.id, { color: ($event.target as HTMLInputElement).value })"
                >
                <i class="ti ti-color-picker"></i>
              </label>
            </div>
          </div>

          <div v-for="tomb in tombstones" :key="'tomb-' + tomb.cat.id" class="cat-tomb">
            <span class="tomb-icon"><i class="ti ti-trash"></i></span>
            <span class="tomb-text">{{ tomb.cat.name }}</span>
            <button class="tomb-undo" @click="undoTomb(tomb)">
              <i class="ti ti-arrow-back-up"></i> {{ t('undo.action') }}
            </button>
          </div>

          <p v-if="!store.categories.length && !tombstones.length" class="empty">{{ t('cat.empty') }}</p>
        </div>

        <!-- new category -->
        <div class="new">
          <div class="new-row">
            <button class="swatch" :style="{ background: newColor }" @click="cyclePalette"></button>
            <input
              v-model="newName"
              class="cat-name"
              :placeholder="t('cat.newCategory')"
              @keyup.enter="add"
            >
            <button class="add-btn" :disabled="!newName.trim()" @click="add">{{ t('cat.add') }}</button>
          </div>
          <div class="palette">
            <button
              v-for="col in PALETTE"
              :key="col"
              class="chip"
              :class="{ on: col === newColor }"
              :style="{ background: col }"
              @click="newColor = col"
            ></button>
            <label class="chip custom" :class="{ on: !PALETTE.includes(newColor) }" :aria-label="t('cat.customColorAria')">
              <input type="color" :value="newColor" @input="newColor = ($event.target as HTMLInputElement).value">
              <i class="ti ti-color-picker"></i>
            </label>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategoriesStore } from '@/stores/categories'
import { PALETTE } from '@/lib/colors'
import type { Category } from '@/types'

const { t } = useI18n()

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

const store = useCategoriesStore()
const editing = ref<string | null>(null)
const newName = ref('')
const newColor = ref(PALETTE[5])

function close() { emit('update:modelValue', false) }

// delete (via trash tap or swipe-left) leaves an inline "undo" row for ~5s
type Tomb = { cat: Category; taskIds: string[] }
const tombstones = ref<Tomb[]>([])
const tombTimers = new Map<string, ReturnType<typeof setTimeout>>()

async function deleteCat(c: Category) {
  editing.value = null
  const taskIds = await store.deleteCategory(c.id)
  tombstones.value.push({ cat: { ...c }, taskIds })
  tombTimers.set(c.id, setTimeout(() => {
    tombstones.value = tombstones.value.filter(x => x.cat.id !== c.id)
    tombTimers.delete(c.id)
  }, 5000))
}

async function undoTomb(tomb: Tomb) {
  const tmr = tombTimers.get(tomb.cat.id)
  if (tmr) { clearTimeout(tmr); tombTimers.delete(tomb.cat.id) }
  tombstones.value = tombstones.value.filter(x => x.cat.id !== tomb.cat.id)
  await store.restoreCategory(tomb.cat, tomb.taskIds)
}

// swipe-left a category row to delete (touch)
const SWIPE_TH = 70
const swipeId = ref<string | null>(null)
const swipeDx = ref(0)
let sx = 0, sy = 0, swiping = false, horizontal = false

function swipeStyle(id: string) {
  if (swipeId.value !== id) return undefined
  return { transform: `translateX(${swipeDx.value}px)`, transition: 'none' }
}
function onDown(e: TouchEvent, c: Category) {
  sx = e.touches[0].clientX; sy = e.touches[0].clientY
  swiping = true; horizontal = false
  swipeId.value = c.id; swipeDx.value = 0
}
function onMove(e: TouchEvent, _c: Category) {
  if (!swiping) return
  const dx = e.touches[0].clientX - sx
  const dy = e.touches[0].clientY - sy
  if (!horizontal) {
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) horizontal = true
    else if (Math.abs(dy) > 10) { swiping = false; swipeId.value = null; return }
    else return
  }
  if (dx > 0) { swipeDx.value = 0; return } // delete is left-only
  e.preventDefault()
  swipeDx.value = dx
}
function onUp(_e: TouchEvent, c: Category) {
  const dx = swipeDx.value
  swiping = false; horizontal = false
  swipeId.value = null; swipeDx.value = 0
  if (dx < -SWIPE_TH) deleteCat(c)
}

function rename(c: Category, name: string) {
  const v = name.trim()
  if (v && v !== c.name) store.updateCategory(c.id, { name: v })
}

function cyclePalette() {
  const i = PALETTE.indexOf(newColor.value)
  newColor.value = PALETTE[(i + 1) % PALETTE.length]
}

async function add() {
  const name = newName.value.trim()
  if (!name) return
  await store.addCategory(name, newColor.value)
  newName.value = ''
}
</script>

<style scoped>
.sheet-backdrop {
  position: absolute; inset: 0; z-index: 30;
  background: rgba(0,0,0,0.35);
  display: flex; align-items: flex-end;
}
.sheet {
  width: 100%;
  background: var(--color-background-primary);
  border-radius: 18px 18px 0 0;
  padding: 8px 0 max(16px, env(safe-area-inset-bottom));
  max-height: 85%; overflow-y: auto;
}
.sheet-grip { width: 36px; height: 5px; border-radius: 3px; background: var(--color-border-secondary); margin: 6px auto 4px; }
.sheet-head { display: flex; align-items: center; justify-content: space-between; padding: 6px 18px 8px; }
.sheet-title { font-size: 17px; font-weight: 500; }

.list { padding: 0 18px; }
.cat { padding: 8px 0; border-top: 0.5px solid var(--color-border-tertiary); }
.cat-main { position: relative; overflow: hidden; }
.cat-fore { display: flex; align-items: center; gap: 12px; background: var(--color-background-primary); }
.cat-fore.swiping { transition: transform .2s; }
.swipe-bg {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: flex-end;
  padding: 0 16px; background: var(--color-text-danger); color: #fff; font-size: 18px;
  filter: saturate(0.85) brightness(0.85);
}
.swipe-bg.ready { filter: none; }

.cat-tomb {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 0; border-top: 0.5px solid var(--color-border-tertiary);
  color: var(--color-text-tertiary); animation: tomb-in .2s ease;
}
.cat-tomb .tomb-icon { display: flex; align-items: center; font-size: 18px; }
.cat-tomb .tomb-text { flex: 1; min-width: 0; font-size: 15px; text-decoration: line-through; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tomb-undo {
  display: flex; align-items: center; gap: 5px; flex-shrink: 0;
  border: none; cursor: pointer; padding: 5px 12px; border-radius: 999px;
  background: var(--color-background-info); color: var(--color-text-info);
  font-size: 13px; font-weight: 500;
}
.tomb-undo i { font-size: 15px; }
@keyframes tomb-in { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
.swatch { width: 26px; height: 26px; border-radius: 50%; border: 0.5px solid var(--color-border-tertiary); flex-shrink: 0; cursor: pointer; padding: 0; }
.cat-name {
  flex: 1; border: none; background: none; color: var(--color-text-primary);
  font-size: 15px; padding: 6px 0;
}
.cat-name:focus { outline: none; }
.trash { border: none; background: none; color: var(--color-text-tertiary); cursor: pointer; font-size: 18px; padding: 4px; }
.empty { color: var(--color-text-tertiary); font-size: 14px; padding: 12px 0; }

.palette { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 10px 0 4px; }
.chip { width: 26px; height: 26px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; padding: 0; }
.chip.on { border-color: var(--color-text-primary); }
.chip.custom {
  position: relative; display: flex; align-items: center; justify-content: center;
  width: 27px; height: 27px;
  background: var(--color-text-tertiary); color: #fff;
}
.chip.custom input { position: absolute; inset: 0; opacity: 0; cursor: pointer; padding: 0; border: none; }
.chip.custom i { font-size: 14px; pointer-events: none; }

.new { padding: 12px 18px 4px; border-top: 0.5px solid var(--color-border-tertiary); margin-top: 6px; }
.new-row { display: flex; align-items: center; gap: 12px; }
.add-btn {
  border: none; background: var(--color-background-info); color: var(--color-text-info);
  border-radius: 14px; padding: 6px 14px; font-size: 13px; font-weight: 500; cursor: pointer;
}
.add-btn:disabled { opacity: 0.4; cursor: default; }

.sheet-enter-active, .sheet-leave-active { transition: opacity .2s; }
.sheet-enter-active .sheet, .sheet-leave-active .sheet { transition: transform .25s ease; }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet, .sheet-leave-to .sheet { transform: translateY(100%); }
</style>
