import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
    const userId = '40520d6c-e8da-4b0f-9fac-8fa1f9198a5b'
    console.log(`--- FULL AUDIT FOR ${userId} ---`)

    const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

    console.log('User Record:', JSON.stringify(user, null, 2))

    const { count: creditLogsCount } = await supabase
        .from('ai_credit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

    console.log('Total Credit Logs:', creditLogsCount)

    const { data: recentCredits } = await supabase
        .from('ai_credit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

    console.log('Recent Credit Logs:', JSON.stringify(recentCredits, null, 2))

    const { count: advisorLogsCount } = await supabase
        .from('advisor_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

    console.log('Total Advisor Logs:', advisorLogsCount)
}

debug()
