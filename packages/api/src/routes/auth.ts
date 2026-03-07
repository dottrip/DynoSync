import { Hono } from 'hono'
import { createClient } from '@supabase/supabase-js'

const auth = new Hono<{ Bindings: { SUPABASE_URL: string; SUPABASE_ANON_KEY: string; SUPABASE_SERVICE_ROLE_KEY: string }, Variables: { userId: string } }>()

import { authMiddleware } from '../middleware/auth'

// POST /auth/sync
// Called by the client after successful signup & OTP verification to sync to public users table
auth.post('/sync', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const { email, username } = await c.req.json()

  if (!email || !username) {
    return c.json({ error: 'email and username are required' }, 400)
  }

  const adminSupabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)

  // Clean up any stale records with the same email but different ID to avoid unique constraint violations
  await adminSupabase.from('users').delete().eq('email', email).neq('id', userId)

  // Upsert to handle potential race conditions (e.g. user retrying sync)
  let { error: syncError } = await adminSupabase.from('users').upsert({
    id: userId,
    email,
    username,
    tier: 'free',
    region: 'na',
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' })

  if (syncError && syncError.code === '23505') {
    const fallbackUsername = `${username}-${userId.substring(0, 4)}`
    const { error: retryError } = await adminSupabase.from('users').upsert({
      id: userId,
      email,
      username: fallbackUsername,
      tier: 'free',
      region: 'na',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' })
    syncError = retryError
  }

  if (syncError) return c.json({ error: syncError.message }, 400)

  return c.json({ success: true }, 201)
})

// POST /auth/login
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json()

  if (!email || !password) {
    return c.json({ error: 'email and password are required' }, 400)
  }

  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY)

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return c.json({ error: error.message }, 401)

  return c.json({ user: data.user, session: data.session })
})

// POST /auth/logout
auth.post('/logout', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY)
  await supabase.auth.admin.signOut(token)

  return c.json({ success: true })
})

// POST /auth/google  — returns OAuth URL, client handles redirect
auth.post('/google', async (c) => {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: c.req.header('Origin') + '/auth/callback' },
  })

  if (error) return c.json({ error: error.message }, 400)

  return c.json({ url: data.url })
})

// DELETE /auth/delete-account
auth.delete('/delete-account', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const adminSupabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)

  // 1. Delete from Postgres users table (Cascade will handle vehicles, logs, etc.)
  const { error: dbError } = await adminSupabase.from('users').delete().eq('id', userId)
  if (dbError) {
    console.error('Error deleting user from DB:', dbError)
    return c.json({ error: 'Failed to delete user profile' }, 500)
  }

  // 2. Delete from Supabase Auth
  const { error: authError } = await adminSupabase.auth.admin.deleteUser(userId)
  if (authError) {
    console.error('Error deleting user from Auth:', authError)
    // Even if auth delete fails, the DB profile is gone, but we should report it.
    return c.json({ error: 'Failed to delete authentication account' }, 500)
  }

  return c.json({ success: true })
})

export { auth as authRouter }
