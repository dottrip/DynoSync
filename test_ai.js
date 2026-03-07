import { readFileSync } from 'fs';
import * as toml from 'toml';

// Mock script to run GeminiService locally using ts-node
const tomlData = toml.parse(readFileSync('./packages/api/wrangler.toml', 'utf-8'));
const vars = tomlData.vars;
const apiKey = vars.GOOGLE_AI_API_KEY;

// Directly import the service from the source code
const tsConfig = { "compilerOptions": { "module": "commonjs", "target": "es2022" } };
require('ts-node').register(tsConfig);
const { GeminiService, MODELS } = require('./packages/api/src/services/gemini.ts');

async function run() {
    const aiService = new GeminiService(apiKey);
    const prompt = `You are an expert automotive engineer. Based on the following vehicle information:
Make: BMW
Model: M3
Year: 2015
Trim: Base

Provide the estimated stock performance baseline for this exact vehicle.
Convert crank horsepower to estimated Wheel Horsepower (WHP), assuming standard drivetrain loss (e.g., ~15% for FWD/RWD, ~20% for AWD).
Also estimate the stock peak engine torque in Newton Meters (NM).
Also estimate the curb weight in pounds (LBS).

You MUST return a strict JSON object with EXACTLY these three keys:
{
  "whp": number,
  "torque_nm": number,
  "weight_lbs": number
}
If you are completely unsure about a value, return 0 for that value. Return ONLY the JSON object, no other text.`;

    try {
        const result = await aiService.analyzeText(prompt, MODELS.FLASH, { jsonMode: true });
        console.log("Raw Output:", result);
        console.log("Torque exists?", 'torque_nm' in result);
        console.log("Weight exists?", 'weight_lbs' in result);
    } catch (err) {
        console.error("Error:", err);
    }
}
run();
