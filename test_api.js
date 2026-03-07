

async function test() {
    const res = await fetch('https://dynosync-api.dynosync-dev.workers.dev/ai/baseline-specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ make: 'BMW', model: 'M3', year: 2015, trim: 'Base' })
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text);
}

test();
