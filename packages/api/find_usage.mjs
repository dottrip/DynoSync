import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
    console.log('--- USERS WITH CONSUMPTION ---')
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, email, ai_credits_used, tier')
        .gt('ai_credits_used', 0)

    if (uErr) console.error('User fetch error:', uErr)
    else console.log(JSON.stringify(users, null, 2))

    console.log('\n--- TOTAL LOGS COUNT ---')
    const { count, error: cErr } = await supabase
        .from('ai_credit_logs')
        .select('*', { count: 'exact', head: true })

    if (cErr) console.error('Logs count error:', cErr)
    else console.log('Total logs:', count)
}

debug()
