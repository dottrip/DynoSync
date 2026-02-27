import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { createClient } from '@supabase/supabase-js'
import { TIER_LIMITS } from '@dynosync/types'

type Bindings = { SUPABASE_URL: string; SUPABASE_ANON_KEY: string; DATABASE_URL: string }
type Variables = { userId: string; userEmail: string }

const vehicles = new Hono<{ Bindings: Bindings; Variables: Variables }>()

vehicles.use('*', authMiddleware)

// GET /vehicles — list user's vehicles
vehicles.get('/', async (c) => {
  const userId = c.get('userId')
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY)

  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// POST /vehicles — create vehicle
vehicles.post('/', async (c) => {
  const userId = c.get('userId')
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY)

  // Enforce tier vehicle limit
  const { data: user } = await supabase
    .from('users')
    .select('tier')
    .eq('id', userId)
    .single()

  const tier = user?.tier ?? 'free'
  const limit = TIER_LIMITS[tier as keyof typeof TIER_LIMITS].vehicles

  if (limit !== Infinity) {
    const { count } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_archived', false)

    if ((count ?? 0) >= limit) {
      return c.json({ error: `Vehicle limit reached for ${tier} plan (max ${limit})` }, 403)
    }
  }

  const body = await c.req.json()
  const { make, model, year, trim, drivetrain } = body

  if (!make || !model || !year) {
    return c.json({ error: 'make, model and year are required' }, 400)
  }

  const { data, error } = await supabase
    .from('vehicles')
    .insert({ user_id: userId, make, model, year, trim, drivetrain })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

// GET /vehicles/:id
vehicles.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY)

  const { data, error } = await supabase
    .from('vehicles')
    .select('*, dyno_records(*), mod_logs(*)')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) return c.json({ error: 'Not found' }, 404)
  return c.json(data)
})

// PATCH /vehicles/:id
vehicles.patch('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY)

  const body = await c.req.json()
  const { make, model, year, trim, drivetrain, is_archived, is_public } = body

  const { data, error } = await supabase
    .from('vehicles')
    .update({ make, model, year, trim, drivetrain, is_archived, is_public, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error || !data) return c.json({ error: 'Not found' }, 404)
  return c.json(data)
})

// DELETE /vehicles/:id — archive instead of hard delete
vehicles.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY)

  const { data, error } = await supabase
    .from('vehicles')
    .update({ is_archived: true, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error || !data) return c.json({ error: 'Not found' }, 404)
  return c.json({ success: true })
})

export { vehicles as vehiclesRouter }
