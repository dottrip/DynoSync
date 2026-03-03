import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authRouter } from './routes/auth'
import { vehiclesRouter } from './routes/vehicles'
import { dynoRouter } from './routes/dyno'
import { modsRouter } from './routes/mods'
import { leaderboardRouter } from './routes/leaderboard'
import { publicRoutes } from './routes/public'
import { followsRouter } from './routes/follows'
import { feedbackRouter } from './routes/feedback'
import { aiRouter } from './routes/ai'
import { profileRouter } from './routes/profile'

type Bindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  DATABASE_URL: string
  GOOGLE_AI_API_KEY: string
  TURNSTILE_SECRET_KEY?: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', logger())

// Hardened CORS Middleware to ensure preflight and all responses are covered
app.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-supabase-auth',
        'Access-Control-Max-Age': '86400',
      },
    })
  }
  await next()
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-supabase-auth')
})

app.get('/', (c) => c.json({ name: 'DynoSync API', version: '0.1.0' }))

app.route('/auth', authRouter)
app.route('/vehicles', vehiclesRouter)
app.route('/dyno', dynoRouter)
app.route('/mods', modsRouter)
app.route('/leaderboard', leaderboardRouter)
app.route('/public', publicRoutes)
app.route('/follows', followsRouter)
app.route('/feedback', feedbackRouter)
app.route('/profile', profileRouter)
app.route('/ai', aiRouter)

// Routes to be added per phase:
// app.route('/dyno', dynoRouter)
// app.route('/mods', modsRouter)

export default app
