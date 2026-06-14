import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)

  async function init() {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    supabase.auth.onAuthStateChange((_e, s) => { session.value = s })
  }

  const signInWithGoogle = () => supabase.auth.signInWithOAuth({ provider: 'google' })
  const signOut = () => supabase.auth.signOut()

  return { session, init, signInWithGoogle, signOut }
})
