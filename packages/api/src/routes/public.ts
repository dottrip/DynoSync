import { Hono } from 'hono'
import { createClient } from '@supabase/supabase-js'

type Bindings = { SUPABASE_URL: string; SUPABASE_ANON_KEY: string; SUPABASE_SERVICE_ROLE_KEY: string }

const publicRoutes = new Hono<{ Bindings: Bindings }>()

// GET /public/vehicles/:id — public vehicle profile
publicRoutes.get('/vehicles/:id', async (c) => {
    const id = c.req.param('id')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)

    const { data, error } = await supabase
        .from('vehicles')
        .select('*, dyno_records(*), mod_logs(*), users(username, instagram_handle, discord_id)')
        .eq('id', id)
        .eq('is_public', true)
        .eq('is_archived', false)
        .single()

    if (error || !data) return c.json({ error: 'Vehicle not found or not public' }, 404)
    return c.json(data)
})

export { publicRoutes }
