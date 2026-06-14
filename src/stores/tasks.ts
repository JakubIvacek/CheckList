import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Task, TaskStatus } from '@/types'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const loading = ref(false)

  // napr. pondelok–nedeľa daného týždňa ('2026-06-08', '2026-06-14')
  async function fetchRange(from: string, to: string) {
    loading.value = true
    const { data, error } = await supabase
      .from('tasks').select('*')
      .gte('task_date', from).lte('task_date', to)
      .order('task_date', { ascending: true })
    loading.value = false
    if (error) throw error
    tasks.value = data ?? []
  }

  async function addTask(title: string, task_date: string, category_id: string | null = null) {
    const { data, error } = await supabase
      .from('tasks').insert({ title, task_date, category_id }).select().single()
    if (error) throw error
    tasks.value.push(data)
  }

  async function toggleTask(task: Task) {
    const next: TaskStatus = task.status === 'done' ? 'todo' : 'done'
    const completed_at = next === 'done' ? new Date().toISOString() : null
    const { error } = await supabase
      .from('tasks').update({ status: next, completed_at }).eq('id', task.id)
    if (error) throw error
    task.status = next
    task.completed_at = completed_at
  }

  async function deleteTask(id: string) {
    const { error } = await supabase
      .from('tasks').delete().eq('id', id)
    if (error) throw error
    tasks.value = tasks.value.filter(t => t.id !== id)
  }

  async function updateTask(id: string, updates: Partial<Task>) {
    const { error } = await supabase
      .from('tasks').update(updates).eq('id', id)
    if (error) throw error
    const idx = tasks.value.findIndex(t => t.id === id)
    if (idx >= 0) Object.assign(tasks.value[idx], updates)
  }

  return { tasks, loading, fetchRange, addTask, toggleTask, deleteTask, updateTask }
})
