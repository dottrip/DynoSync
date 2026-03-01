const { execSync } = require('child_process');

function putSecret(name, value) {
    try {
        console.log(`Putting secret ${name}...`);
        execSync(`npx wrangler secret put ${name}`, {
            input: Buffer.from(value),
            stdio: ['pipe', 'inherit', 'inherit']
        });
        console.log(`Success: ${name}`);
    } catch (err) {
        console.error(`Failed to put secret ${name}`);
    }
}

const SUPABASE_URL = "https://voxrdzdeaqoyyecrlkxj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZveHJkemRlYXFveXllY3Jsa3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTEzNjMsImV4cCI6MjA4NzcyNzM2M30.U7TQndtdiEZXUX2212KN_7gtmBj2OhjeGEl9IOGST-I";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZveHJkemRlYXFveXllY3Jsa3hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjE1MTM2MywiZXhwIjoyMDg3NzI3MzYzfQ.ztEeDdrg37XNelXastBthJexkm64JzABg4T3fLY8dUw";
const DATABASE_URL = "postgresql://postgres.voxrdzdeaqoyyecrlkxj:LYP82NLF%401988@aws-1-us-east-2.pooler.supabase.com:5432/postgres";

putSecret('SUPABASE_URL', SUPABASE_URL);
putSecret('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);
putSecret('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY);
putSecret('DATABASE_URL', DATABASE_URL);
