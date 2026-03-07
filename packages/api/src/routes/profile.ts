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
  const userEmail = c.get('userEmail')
  const userName = c.get('userName')
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)

  let { data, error } = await supabase
    .from('users')
    .select('id, email, username, tier, avatar_url, instagram_handle, discord_id, ai_credits_used, ai_credits_reset_at, created_at')
    .eq('id', userId)
    .single()

  // Self-healing: if user record is missing, create it
  if (error || !data) {
    const { data: upsertData, error: upsertError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: userEmail,
        username: userName,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select('id, email, username, tier, avatar_url, instagram_handle, discord_id, ai_credits_used, ai_credits_reset_at, created_at')
      .single()

    if (upsertError) return c.json({ error: upsertError.message ?? 'User not found & creation failed' }, 404)
    data = upsertData
  }

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
    .select('id, email, username, tier, avatar_url, instagram_handle, discord_id, ai_credits_used, ai_credits_reset_at, created_at')

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
      .select('id, email, username, tier, avatar_url, instagram_handle, discord_id, ai_credits_used, ai_credits_reset_at, created_at')

    data = upsertData
    error = upsertError
  }

  if (error) return c.json({ error: error.message ?? 'Update failed' }, 500)
  if (!data || data.length === 0) return c.json({ error: 'User not found' }, 404)

  return c.json(data[0])
})

// POST /profile/subscription/upgrade
profile.post('/subscription/upgrade', async (c) => {
  const userId = c.get('userId')
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
  const { tier } = await c.req.json()

  if (!['free', 'pro'].includes(tier)) {
    return c.json({ error: 'Invalid tier' }, 400)
  }

  // Update tier and reset credits for the new tier
  const { data, error } = await supabase
    .from('users')
    .update({
      tier,
      ai_credits_used: 0, // Reset usage on upgrade/downgrade for simplicity in this proto
      ai_credits_reset_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, user: data })
})

export { profile as profileRouter }
