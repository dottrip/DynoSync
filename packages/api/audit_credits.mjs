import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
    const email = 'joyeyan432@gmail.com'
    console.log(`--- ANALYZING LOGS FOR ${email} ---`)

    const { data: user } = await supabase
        .from('users')
        .select('id, ai_credits_used, tier')
        .eq('email', email)
        .single()

    if (!user) {
        console.error('User not found')
        return
    }

    console.log(`Current Used: ${user.ai_credits_used}, Tier: ${user.tier}`)

    const { data: logs } = await supabase
        .from('ai_credit_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

    console.log('Recent Credit Logs:', JSON.stringify(logs, null, 2))

    const { data: advisorLogs } = await supabase
        .from('advisor_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

    console.log('Recent Advisor Results:', JSON.stringify(advisorLogs, null, 2))
}

debug()
