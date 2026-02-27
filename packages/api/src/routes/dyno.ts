import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { createClient } from '@supabase/supabase-js'
import { TIER_LIMITS } from '@dynosync/types'

type Bindings = { SUPABASE_URL: string; SUPABASE_ANON_KEY: string }
type Variables = { userId: string }

const dyno = new Hono<{ Bindings: Bindings; Variables: Variables }>()

dyno.use('*', authMiddleware)

// GET /dyno/:vehicleId — list dyno records for a vehicle
dyno.get('/:vehicleId', async (c) => {
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
    .from('dyno_records')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('recorded_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// POST /dyno/:vehicleId — create dyno record
dyno.post('/:vehicleId', async (c) => {
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

  // Enforce tier dyno record limit
  const { data: user } = await supabase
    .from('users')
    .select('tier')
    .eq('id', userId)
    .single()

  const tier = user?.tier ?? 'free'
  const limit = TIER_LIMITS[tier as keyof typeof TIER_LIMITS].dynoRecords

  if (limit !== Infinity) {
    const { count } = await supabase
      .from('dyno_records')
      .select('*', { count: 'exact', head: true })
      .eq('vehicle_id', vehicleId)

    if ((count ?? 0) >= limit) {
      return c.json({ error: `Dyno record limit reached for ${tier} plan (max ${limit} per vehicle)` }, 403)
    }
  }

  const { whp, torque_nm, zero_to_sixty, notes, recorded_at } = await c.req.json()

  if (!whp) return c.json({ error: 'whp is required' }, 400)

  const { data, error } = await supabase
    .from('dyno_records')
    .insert({
      vehicle_id: vehicleId,
      whp,
      torque_nm,
      zero_to_sixty,
      notes,
      recorded_at: recorded_at ?? new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

// GET /dyno/:vehicleId/:id — single record
dyno.get('/:vehicleId/:id', async (c) => {
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
    .from('dyno_records')
    .select('*')
    .eq('id', id)
    .eq('vehicle_id', vehicleId)
    .single()

  if (error || !data) return c.json({ error: 'Not found' }, 404)
  return c.json(data)
})

// DELETE /dyno/:vehicleId/:id
dyno.delete('/:vehicleId/:id', async (c) => {
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
    .from('dyno_records')
    .delete()
    .eq('id', id)
    .eq('vehicle_id', vehicleId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

export { dyno as dynoRouter }
