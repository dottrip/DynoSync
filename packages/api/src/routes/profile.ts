import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { createClient } from '@supabase/supabase-js'

type Bindings = { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }
type Variables = { userId: string; userEmail: string; userName: string }

const profile = new Hono<{ Bindings: Bindings; Variables: Variables }>()

profile.use('*', authMiddleware)

// GET /profile/me
profile.get('/me', async (c) => {
  const userId = c.get('userId')
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)

  const { data, error } = await supabase
    .from('users')
    .select('id, email, username, tier, avatar_url, instagram_handle, discord_id, created_at')
    .eq('id', userId)
    .single()

  if (error || !data) return c.json({ error: 'User not found' }, 404)
  return c.json(data)
})

// PATCH /profile/me — update avatar_url or push_token
profile.patch('/me', async (c) => {
  const userId = c.get('userId')
  const userEmail = c.get('userEmail')
  const userName = c.get('userName')
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
  const body = await c.req.json()

  // Only update fields that were actually provided in the request
  const updates: any = { updated_at: new Date().toISOString() }
  if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url
  if (body.push_token !== undefined) updates.push_token = body.push_token
  if (body.instagram_handle !== undefined) updates.instagram_handle = body.instagram_handle
  if (body.discord_id !== undefined) updates.discord_id = body.discord_id

  let { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select('id, email, username, tier, avatar_url, instagram_handle, discord_id, created_at')

  // Self-healing: if user record is missing, try to create it via upsert
  if (!error && (!data || data.length === 0)) {
    const { data: upsertData, error: upsertError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: userEmail,
        username: userName,
        updated_at: new Date().toISOString(),
        ...updates
      }, { onConflict: 'id' })
      .select('id, email, username, tier, avatar_url, instagram_handle, discord_id, created_at')

    data = upsertData
    error = upsertError
  }

  if (error) return c.json({ error: error.message ?? 'Update failed' }, 500)
  if (!data || data.length === 0) return c.json({ error: 'User not found' }, 404)

  return c.json(data[0])
})

export { profile as profileRouter }
