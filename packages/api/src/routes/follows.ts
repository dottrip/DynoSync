import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { createClient } from '@supabase/supabase-js'

type Bindings = { SUPABASE_URL: string; SUPABASE_ANON_KEY: string; SUPABASE_SERVICE_ROLE_KEY: string; DATABASE_URL: string }
type Variables = { userId: string }

const follows = new Hono<{ Bindings: Bindings; Variables: Variables }>()

follows.use('*', authMiddleware)

// GET /follows/check/:vehicleId
follows.get('/check/:vehicleId', async (c) => {
    const userId = c.get('userId')
    const vehicleId = c.req.param('vehicleId')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)

    const { data, error } = await supabase
        .from('build_follows')
        .select('id')
        .eq('user_id', userId)
        .eq('vehicle_id', vehicleId)
        .single()

    if (error && error.code !== 'PGRST116') {
        return c.json({ error: error.message }, 500)
    }

    return c.json({ isFollowing: !!data })
})

// POST /follows/:vehicleId
follows.post('/:vehicleId', async (c) => {
    const userId = c.get('userId')
    const vehicleId = c.req.param('vehicleId')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)

    // Validate vehicle exists
    const { data: v } = await supabase.from('vehicles').select('id').eq('id', vehicleId).single()
    if (!v) return c.json({ error: 'Vehicle not found' }, 404)

    // Lazy sync user to public.users if missing (fixes implicit login FK violation)
    const { data: userExists } = await supabase.from('users').select('id').eq('id', userId).single()

    if (!userExists) {
        const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(userId)

        if (authErr || !authUser?.user) {
            return c.json({ error: 'Critical: Auth user not found in backend ' + (authErr?.message || '') }, 404)
        }

        let tempUsername = authUser.user.user_metadata?.username || authUser.user.email?.split('@')[0] || 'Unknown User'

        // Clean up any stale records with the same email but different ID to avoid unique constraint violations
        if (authUser.user.email) {
            await supabase.from('users').delete().eq('email', authUser.user.email).neq('id', userId)
        }

        let { error: syncError } = await supabase.from('users').upsert({
            id: userId,
            email: authUser.user.email,
            username: tempUsername,
            tier: 'free',
            region: 'na',
            updated_at: new Date().toISOString()
        })

        // If username is taken (unique constraint violation), try appending a unique suffix
        if (syncError && syncError.code === '23505') {
            tempUsername = `${tempUsername}-${userId.substring(0, 4)}`
            const { error: retryError } = await supabase.from('users').upsert({
                id: userId,
                email: authUser.user.email,
                username: tempUsername,
                tier: 'free',
                region: 'na',
                updated_at: new Date().toISOString()
            })
            syncError = retryError
        }

        if (syncError) {
            return c.json({ error: 'Critical Sync Failed: ' + syncError.message + ' (Code: ' + syncError.code + ')' }, 400)
        }
    }

    const { data, error } = await supabase
        .from('build_follows')
        .insert([{ id: crypto.randomUUID(), user_id: userId, vehicle_id: vehicleId }])
        .select()
        .single()

    if (error) {
        if (error.code === '23505') { // Postgres unique violation code
            return c.json({ success: true, message: 'Already following' })
        }
        return c.json({ error: error.message }, 500)
    }

    return c.json({ success: true, data })
})

// DELETE /follows/:vehicleId
follows.delete('/:vehicleId', async (c) => {
    const userId = c.get('userId')
    const vehicleId = c.req.param('vehicleId')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)

    const { error } = await supabase
        .from('build_follows')
        .delete()
        .eq('user_id', userId)
        .eq('vehicle_id', vehicleId)

    if (error) return c.json({ error: error.message }, 500)

    return c.json({ success: true })
})

export { follows as followsRouter }
