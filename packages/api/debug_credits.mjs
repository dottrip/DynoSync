import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
    console.log('--- USER DATA ---')
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, email, ai_credits_used, ai_credits_reset_at')
        .ilike('email', '%@%')
        .limit(5)

    if (uErr) console.error('User fetch error:', uErr)
    else console.log(JSON.stringify(users, null, 2))

    console.log('\n--- RECENT CREDIT LOGS ---')
    const { data: logs, error: lErr } = await supabase
        .from('ai_credit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

    if (lErr) console.error('Logs fetch error:', lErr)
    else console.log(JSON.stringify(logs, null, 2))
}

debug()
