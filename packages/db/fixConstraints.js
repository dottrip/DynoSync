const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres.voxrdzdeaqoyyecrlkxj:LYP82NLF%401988@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function fix() {
    try {
        await client.connect();
        console.log('Connected to database.');

        // 1. Drop NOT NULL if it exists to be safe
        await client.query(`ALTER TABLE users ALTER COLUMN updated_at DROP NOT NULL;`);
        console.log('Dropped NOT NULL constraint for updated_at.');

        // 2. Set default value
        await client.query(`ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT now();`);
        console.log('Set DEFAULT now() for updated_at.');

        // 3. Fix any existing null values
        await client.query(`UPDATE users SET updated_at = now() WHERE updated_at IS NULL;`);
        console.log('Fixed existing NULL values in updated_at.');

        console.log('Database constraints fixed successfully!');
    } catch (err) {
        console.error('Error fixing database:', err);
    } finally {
        await client.end();
    }
}

fix();
