import { Hono } from 'hono'
import { createClient } from '@supabase/supabase-js'
import { authMiddleware } from '../middleware/auth'

type Bindings = { SUPABASE_URL: string; SUPABASE_ANON_KEY: string; SUPABASE_SERVICE_ROLE_KEY: string }
type Variables = { userId: string }

const leaderboard = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Use auth middleware to get the current user
leaderboard.use('*', authMiddleware)

// GET /leaderboard — list top dyno records globally or filtered
leaderboard.get('/', async (c) => {
    const userId = c.get('userId')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)

    const criteria = c.req.query('criteria') || 'whp'
    const region = c.req.query('region') || 'global'

    let query = supabase
        .from('dyno_records')
        .select(`
      id,
      whp,
      torque_nm,
      zero_to_sixty,
      quarter_mile,
      vehicle_id,
      recorded_at,
      vehicles!inner (
        make,
        model,
        year,
        trim,
        user_id,
        is_archived,
        is_public,
        users!inner (
          username,
          tier,
          region
        )
      )
    `)
        .neq('vehicles.users.tier', 'free')
        .eq('vehicles.is_archived', false)
        .eq('vehicles.is_public', true)

    // Apply Region Filter
    if (region === 'following') {
        const { data: followsData } = await supabase
            .from('build_follows')
            .select('vehicle_id')
            .eq('user_id', userId)

        const followedIds = followsData?.map(f => f.vehicle_id) || []

        if (followedIds.length === 0) {
            // Return empty straight away if user follows nobody
            return c.json([])
        }

        query = query.in('vehicle_id', followedIds)
    } else if (region !== 'global') {
        query = query.eq('vehicles.users.region', region)
    }

    // Apply Sorting Criteria
    if (criteria === '060') {
        // filter out nulls so we only see cars with recorded 0-60
        query = query.not('zero_to_sixty', 'is', null).order('zero_to_sixty', { ascending: true })
    } else if (criteria === '1/4') {
        query = query.not('quarter_mile', 'is', null).order('quarter_mile', { ascending: true })
    } else {
        // Default: 'whp' (or fallback for 'mods')
        query = query.order('whp', { ascending: false })
    }

    query = query.limit(50)

    const { data, error } = await query

    if (error) {
        return c.json({ error: error.message }, 500)
    }

    // Format response to be flat and easy to consume
    const formattedData = data.map((record: any) => ({
        id: record.id,
        whp: record.whp,
        torque_nm: record.torque_nm,
        zero_to_sixty: record.zero_to_sixty,
        quarter_mile: record.quarter_mile,
        recorded_at: record.recorded_at,
        vehicle: {
            id: record.vehicle_id,
            make: record.vehicles?.make,
            model: record.vehicles?.model,
            year: record.vehicles?.year,
            trim: record.vehicles?.trim,
        },
        user: {
            username: record.vehicles?.users?.username || 'Unknown Driver',
            tier: record.vehicles?.users?.tier || 'free',
            region: record.vehicles?.users?.region || 'global',
        }
    }))

    return c.json(formattedData)
})

export { leaderboard as leaderboardRouter }
