import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://voxrdzdeaqoyyecrlkxj.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZveHJkemRlYXFveXllY3Jsa3hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjE1MTM2MywiZXhwIjoyMDg3NzI3MzYzfQ.ztEeDdrg37XNelXastBthJexkm64JzABg4T3fLY8dUw'
)

async function fix() {
    const { data, error } = await supabase.from('vehicles').update({ is_public: true }).neq('id', 'null')
    console.log('Update result:', data, error)
}
fix()
