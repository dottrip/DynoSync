const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres.voxrdzdeaqoyyecrlkxj:LYP82NLF%401988@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

client.connect()
    .then(() => client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS region VARCHAR(50) DEFAULT 'na';`))
    .then(() => client.query(`ALTER TABLE dyno_records ADD COLUMN IF NOT EXISTS quarter_mile FLOAT;`))
    .then(() => {
        console.log('Schema updated successfully');
        client.end();
    })
    .catch(err => {
        console.error('Error updating schema:', err);
        client.end();
    });
