import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
    const userId = '40520d6c-e8da-4b0f-9fac-8fa1f9198a5b' // joyeyan432@gmail.com
    console.log('--- RECENT AI LOGS FOR TARGET USER ---')
    const { data: logs, error } = await supabase
        .from('ai_credit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) console.error('Error:', error)
    else {
        console.log(`Log entries: ${logs?.length}`)
        const total = logs?.reduce((sum, l) => sum + (l.credits || 0), 0)
        console.log(`Calculated Total Usage: ${total}`)
        console.log('First 5 logs:', JSON.stringify(logs?.slice(0, 5), null, 2))
    }
}

debug()
