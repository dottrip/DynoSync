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
import { profileRouter } from './routes/profile'

type Bindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  DATABASE_URL: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', logger())
app.use('*', cors())

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

// Routes to be added per phase:
// app.route('/dyno', dynoRouter)
// app.route('/mods', modsRouter)

export default app
