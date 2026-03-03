const regex = /"advice":\s*"((?:[^"\\]|\\.)*)/;

const testCases = [
    {
        name: "Standard JSON",
        input: '{"advice": "Reviewing data."}',
        expected: "Reviewing data."
    },
    {
        name: "Internal Escaped Quotes (Literal \\\" )",
        input: '{"advice": "This forces \\"limp mode\\" on ECU."}',
        expected: 'This forces \\"limp mode\\" on ECU.'
    },
    {
        name: "Truncated Mid-word",
        input: '{"advice": "This forces ',
        expected: 'This forces '
    },
    {
        name: "Truncated Mid-Escaped-Quote",
        input: '{"advice": "This forces \\"',
        expected: 'This forces \\"'
    },
    {
        name: "Real Wordy Response",
        input: '{"advice": "The Audi A4L Stage 1 FWD. This forces',
        expected: 'The Audi A4L Stage 1 FWD. This forces'
    }
];

testCases.forEach(tc => {
    const match = tc.input.match(regex);
    const actual = match ? match[1] : "NO MATCH";
    console.log(`[${tc.name}]`);
    console.log(`  Actual: ${actual}`);
    console.log(`  Pass: ${actual === tc.expected}`);
    console.log('---');
});
