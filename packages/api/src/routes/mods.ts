import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { createClient } from '@supabase/supabase-js'
import { TIER_LIMITS } from '@dynosync/types'

type Bindings = { SUPABASE_URL: string; SUPABASE_ANON_KEY: string }
type Variables = { userId: string }

const mods = new Hono<{ Bindings: Bindings; Variables: Variables }>()

mods.use('*', authMiddleware)

// GET /mods/:vehicleId — list mod logs for a vehicle
mods.get('/:vehicleId', async (c) => {
  const userId = c.get('userId')
  const vehicleId = c.req.param('vehicleId')
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY)

  // Verify vehicle ownership
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id')
    .eq('id', vehicleId)
    .eq('user_id', userId)
    .single()

  if (!vehicle) return c.json({ error: 'Vehicle not found' }, 404)

  const { data, error } = await supabase
    .from('mod_logs')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('installed_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// POST /mods/:vehicleId — create mod log
mods.post('/:vehicleId', async (c) => {
  const userId = c.get('userId')
  const vehicleId = c.req.param('vehicleId')
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY)

  // Verify vehicle ownership
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id')
    .eq('id', vehicleId)
    .eq('user_id', userId)
    .single()

  if (!vehicle) return c.json({ error: 'Vehicle not found' }, 404)

  // Enforce tier mod log limit
  const { data: user } = await supabase
    .from('users')
    .select('tier')
    .eq('id', userId)
    .single()

  const tier = user?.tier ?? 'free'
  const limit = TIER_LIMITS[tier as keyof typeof TIER_LIMITS].modLogs

  if (limit !== Infinity) {
    const { count } = await supabase
      .from('mod_logs')
      .select('*', { count: 'exact', head: true })
      .eq('vehicle_id', vehicleId)

    if ((count ?? 0) >= limit) {
      return c.json({ error: `Mod log limit reached for ${tier} plan (max ${limit} per vehicle)` }, 403)
    }
  }

  const { category, description, cost, installed_at } = await c.req.json()

  if (!category || !description) {
    return c.json({ error: 'category and description are required' }, 400)
  }

  const { data, error } = await supabase
    .from('mod_logs')
    .insert({
      vehicle_id: vehicleId,
      category,
      description,
      cost,
      installed_at: installed_at ?? new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

// GET /mods/:vehicleId/:id — single mod log
mods.get('/:vehicleId/:id', async (c) => {
  const userId = c.get('userId')
  const { vehicleId, id } = c.req.param()
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY)

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id')
    .eq('id', vehicleId)
    .eq('user_id', userId)
    .single()

  if (!vehicle) return c.json({ error: 'Vehicle not found' }, 404)

  const { data, error } = await supabase
    .from('mod_logs')
    .select('*')
    .eq('id', id)
    .eq('vehicle_id', vehicleId)
    .single()

  if (error || !data) return c.json({ error: 'Not found' }, 404)
  return c.json(data)
})

// DELETE /mods/:vehicleId/:id
mods.delete('/:vehicleId/:id', async (c) => {
  const userId = c.get('userId')
  const { vehicleId, id } = c.req.param()
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY)

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id')
    .eq('id', vehicleId)
    .eq('user_id', userId)
    .single()

  if (!vehicle) return c.json({ error: 'Vehicle not found' }, 404)

  const { error } = await supabase
    .from('mod_logs')
    .delete()
    .eq('id', id)
    .eq('vehicle_id', vehicleId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

export { mods as modsRouter }
