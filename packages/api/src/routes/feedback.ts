import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { createClient } from '@supabase/supabase-js'

type Bindings = { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }
type Variables = { userId: string }

const feedback = new Hono<{ Bindings: Bindings; Variables: Variables }>()

feedback.use('*', authMiddleware)

// POST /feedback
feedback.post('/', async (c) => {
  const userId = c.get('userId')
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
  const { type, message } = await c.req.json()

  if (!type || !message?.trim()) {
    return c.json({ error: 'type and message are required' }, 400)
  }

  const { error } = await supabase.from('feedback').insert({
    id: crypto.randomUUID(),
    user_id: userId,
    type,
    message: message.trim(),
    created_at: new Date().toISOString(),
  })

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true }, 201)
})

export { feedback as feedbackRouter }
