import { Hono } from 'hono'
import { createClient } from '@supabase/supabase-js'

const auth = new Hono<{ Bindings: { SUPABASE_URL: string; SUPABASE_ANON_KEY: string } }>()

// POST /auth/register
auth.post('/register', async (c) => {
  const { email, password, username } = await c.req.json()

  if (!email || !password || !username) {
    return c.json({ error: 'email, password and username are required' }, 400)
  }

  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  })

  if (error) return c.json({ error: error.message }, 400)

  return c.json({ user: data.user, session: data.session }, 201)
})

// POST /auth/login
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json()

  if (!email || !password) {
    return c.json({ error: 'email and password are required' }, 400)
  }

  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY)

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return c.json({ error: error.message }, 401)

  return c.json({ user: data.user, session: data.session })
})

// POST /auth/logout
auth.post('/logout', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY)
  await supabase.auth.admin.signOut(token)

  return c.json({ success: true })
})

// POST /auth/google  — returns OAuth URL, client handles redirect
auth.post('/google', async (c) => {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: c.req.header('Origin') + '/auth/callback' },
  })

  if (error) return c.json({ error: error.message }, 400)

  return c.json({ url: data.url })
})

export { auth as authRouter }
