import { ref } from 'vue'

// Personal weekly goal (target number of done tasks per week). Local-only
// preference shared between Stats (display) and Settings (set). No DB.
const KEY = 'stride-weekly-goal'

export const weeklyGoal = ref(Number(localStorage.getItem(KEY)) || 10)

export function setWeeklyGoal(v: number) {
  weeklyGoal.value = Math.max(1, Math.min(99, Math.round(v)))
  localStorage.setItem(KEY, String(weeklyGoal.value))
}
