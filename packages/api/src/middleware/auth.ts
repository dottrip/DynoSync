import { Context, Next } from 'hono'
import { createClient } from '@supabase/supabase-js'

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_ANON_KEY,
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  c.set('userId', user.id)
  c.set('userEmail', user.email)
  await next()
}
