import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
    const userId = '40520d6c-e8da-4b0f-9fac-8fa1f9198a5b'
    console.log(`--- ADVISOR LOGS FOR ${userId} ---`)
    const { count, error } = await supabase
        .from('advisor_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

    if (error) console.error('Error:', error)
    else console.log(`Total advisor logs: ${count}`)

    const { data: recent } = await supabase
        .from('advisor_logs')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

    if (recent) console.log('Recent analysis timestamps:', JSON.stringify(recent, null, 2))
}

debug()
