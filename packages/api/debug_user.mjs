import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
    const email = 'joyeyan432@gmail.com'
    console.log(`--- DATA FOR ${email} ---`)
    const { data: user, error: uErr } = await supabase
        .from('users')
        .select('id, email, ai_credits_used, ai_credits_reset_at, tier')
        .eq('email', email)
        .single()

    if (uErr) console.error('User fetch error:', uErr)
    else console.log('User:', JSON.stringify(user, null, 2))

    if (user) {
        console.log('\n--- RECENT LOGS FOR USER ---')
        const { data: logs, error: lErr } = await supabase
            .from('ai_credit_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20)

        if (lErr) console.error('Logs fetch error:', lErr)
        else console.log('Logs:', JSON.stringify(logs, null, 2))
    }
}

debug()
