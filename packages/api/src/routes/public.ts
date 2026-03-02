import { Hono } from 'hono'
import { createClient } from '@supabase/supabase-js'

type Bindings = { SUPABASE_URL: string; SUPABASE_ANON_KEY: string; SUPABASE_SERVICE_ROLE_KEY: string; TURNSTILE_SECRET_KEY?: string }

const publicRoutes = new Hono<{ Bindings: Bindings }>()

// GET /public/vehicles — public leaderboard data
publicRoutes.get('/vehicles', async (c) => {
    const limit = parseInt(c.req.query('limit') || '50')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)

    const { data, error } = await supabase
        .from('vehicles')
        .select('*, dyno_records(whp, torque_nm), users(username)')
        .eq('is_public', true)
        .eq('is_archived', false)
        .order('id', { ascending: false })
        .limit(limit)

    if (error) return c.json({ error: error.message }, 500)
    return c.json(data)
})

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

// POST /public/verify-captcha — verify Turnstile token
publicRoutes.post('/verify-captcha', async (c) => {
    const { token } = await c.req.json()
    const secret = c.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA' // Testing secret

    const ip = c.req.header('CF-Connecting-IP')
    const isValid = await verifyTurnstile(token, secret, ip)

    if (!isValid) {
        return c.json({ success: false, error: 'Invalid captcha token' }, 400)
    }

    return c.json({ success: true, message: 'Captcha verified successfully' })
})

// Helper/Middleware for Turnstile verification
export async function verifyTurnstile(token: string, secret: string, ip?: string) {
    if (!token) return false

    // Testing keys handled by Cloudflare automatically if we use their test keys
    const formData = new FormData()
    formData.append('secret', secret)
    formData.append('response', token)
    if (ip) formData.append('remoteip', ip)

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData,
    })

    const outcome: any = await result.json()
    return outcome.success
}

export { publicRoutes }
