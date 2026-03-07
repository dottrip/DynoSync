import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const testData = {
    user_id: '40520d6c-e8da-4b0f-9fac-8fa1f9198a5b',
    vehicle_id: '889cea56-e5d4-4959-af70-465c268e6cef',
    whp: 400,
    torque: 401,
    torque_unit: 'lb-ft',
    advice: 'Expert test advice from scratch script',
    suggestion: { title: 'Test Mod', gain: '10hp', difficulty: 'Easy', category: 'Intake' },
    created_at: new Date().toISOString()
}

async function test() {
    console.log('Attempting insert with:', testData)
    const { data, error, status } = await supabase.from('advisor_logs').insert(testData)
    if (error) {
        console.error('Insert FAILED:', error)
    } else {
        console.log('Insert SUCCESS, status:', status)
    }
}

test()
