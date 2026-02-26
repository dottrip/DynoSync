import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const app = new Hono()

app.use('*', logger())
app.use('*', cors())

app.get('/', (c) => c.json({ name: 'DynoSync API', version: '0.1.0' }))

// Routes (to be added per phase)
// app.route('/vehicles', vehiclesRouter)
// app.route('/dyno', dynoRouter)
// app.route('/mods', modsRouter)

export default app
