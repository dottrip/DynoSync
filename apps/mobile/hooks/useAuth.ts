import { useState, useEffect } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { clearAllCache } from '../lib/cache'
import { clearApiCache } from '../lib/api'
import { useVehicleStore } from '../store/useVehicleStore'
import { useActiveVehicle } from './useActiveVehicle'
import { useUserStore } from '../store/useUserStore'
import { useStatsStore } from '../store/useStatsStore'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://dynosync-api.dynosync-dev.workers.dev'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        clearAllCache()
        clearApiCache()
        useVehicleStore.getState().reset()
        useActiveVehicle.getState().reset()
        useUserStore.getState().reset()
        useStatsStore.getState().reset()
      }
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    })

    if (error) return { error }

    // Auto-sync happens on login/verification instead since user requires a session
    return { error: null, session: data.session }
  }

  const signOut = async () => {
    clearAllCache()
    clearApiCache()
    useVehicleStore.getState().reset()
    useActiveVehicle.getState().reset()
    useUserStore.getState().reset()
    useStatsStore.getState().reset()
    await supabase.auth.signOut()
  }

  return { session, user, loading, signIn, signUp, signOut }
}
