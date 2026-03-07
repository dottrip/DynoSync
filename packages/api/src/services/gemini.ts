/**
 * Gemini Service - Cloudflare Workers Compatible
 */

const API_VERSION = 'v1beta';
export const MODELS = {
    FLASH: 'gemini-3-flash-preview',
    PRO: 'gemini-3.1-pro-preview',
    LITE: 'gemini-3.1-flash-lite-preview'
};

export class GeminiService {
    private apiKey: string;
    private baseUrl: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.baseUrl = `https://generativelanguage.googleapis.com/${API_VERSION}`;
    }

    /**
     * Internal helper to call Gemini API
     */
    private async callModel(model: string, contents: any[], options?: { temperature?: number, maxTokens?: number, timeoutMs?: number, jsonMode?: boolean }) {
        const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 25000);

        try {
            const body = {
                contents,
                generationConfig: {
                    temperature: options?.temperature ?? 0.2,
                    maxOutputTokens: options?.maxTokens ?? 2048,
                    topP: 0.95,
                    responseMimeType: options?.jsonMode ? 'application/json' : 'text/plain'
                },
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                ]
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: controller.signal
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Gemini API Error: ${error}`);
            }

            const data: any = await response.json();

            if (!data.candidates || data.candidates.length === 0) {
                const finishReason = data.promptFeedback?.blockReason || 'unknown';
                throw new Error(`Gemini API returned no candidates. Reason: ${finishReason}`);
            }

            const firstCandidate = data.candidates[0];
            const finishReason = firstCandidate.finishReason;

            if (finishReason !== 'STOP') {
                console.warn(`[Gemini API] Warning: Response finished with reason: ${finishReason}`);
            }

            return firstCandidate.content?.parts?.[0]?.text;
        } catch (e: any) {
            if (e.name === 'AbortError') {
                throw new Error('Gemini API Timeout: Request took longer than 25s');
            }
            throw e;
        } finally {
            clearTimeout(timeout);
        }
    }

    /**
     * OCR Skill: Extract metrics from a dyno sheet image (Flash model)
     */
    async extractDynoMetrics(base64Image: string) {
        // Remove data:image/png;base64, prefix if present
        const cleanBase64 = base64Image.split(',').pop() || '';

        const contents = [{
            parts: [
                {
                    text: `Analyze this dyno sheet image. Extract the Peak WHP, Peak Torque (labeled as TQ or WTQ), and the RPM at which they occur. 

CRITICAL INSTRUCTION: You must return ONLY a valid, minified JSON object. Do NOT include any markdown formatting, do NOT include \`\`\`json tags. You MUST strictly escape all double quotes and newlines inside string values to ensure JSON.parse() does not fail.

Report in valid JSON format: { \"whp\": number, \"torque\": number, \"rpm_peak_whp\": number, \"rpm_peak_torque\": number, \"notes\": \"string\" }` },
                { inline_data: { mime_type: "image/jpeg", data: cleanBase64 } }
            ]
        }];

        const responseText = await this.callModel(MODELS.FLASH, contents, {
            jsonMode: true,
            temperature: 0.1
        });

        return this.parseBulletproofJson(responseText);
    }

    /**
     * OCR Skill: Extract VIN (Vehicle Identification Number) from image
     */
    async extractVin(base64Image: string) {
        const cleanBase64 = base64Image.split(',').pop() || '';

        const contents = [{
            parts: [
                {
                    text: `Scan this automotive image to identify the VIN (Vehicle Identification Number). 
                    
                    CRITICAL RULES:
                    1. Locate the most likely VIN string (typically 17 characters).
                    2. If a full 17-character VIN is not clearly visible, provide the most complete partial match found.
                    3. VINs do NOT contain the letters I, O, or Q. If you see them, they are likely 1 or 0 (OCR artifacts).
                    4. Return ONLY a JSON object with the "vin" key.
                    
                    Format: { "vin": "DETECTED_VIN_STRING" }` },
                { inline_data: { mime_type: "image/jpeg", data: cleanBase64 } }
            ]
        }];

        const responseText = await this.callModel(MODELS.LITE, contents, {
            jsonMode: true,
            temperature: 0.1
        });

        return this.parseBulletproofJson(responseText);
    }

    /**
     * Text-only analysis (Flash or Pro model)
     */
    async analyzeText(prompt: string, model: string = MODELS.FLASH, options?: { jsonMode?: boolean, temperature?: number }) {
        const contents = [{
            parts: [{ text: prompt }]
        }];

        const responseText = await this.callModel(model, contents, {
            jsonMode: options?.jsonMode,
            temperature: options?.temperature ?? 0.2
        });

        // Use our robust parser if jsonMode was expected, otherwise just return text
        if (options?.jsonMode) {
            return this.parseBulletproofJson(responseText);
        }
        return responseText;
    }

    /**
     * Diagnostic Skill: Deep performance analysis (Pro model by default, or Flash for fallback)
     */
    async analyzePerformance(diagnosticContext: string, model: string = MODELS.PRO, calibration?: { bias: string, depth: string, filter: string }, timeoutMs?: number) {
        // 1. Determine Model based on Depth Calibration
        // STABILITY FIX: If a model is explicitly passed (e.g. during fallback), use it.
        // Otherwise, prioritize Pro if 'deep' reasoning is requested.
        let targetModel = model;
        if (!model && calibration?.depth === 'deep') {
            targetModel = MODELS.PRO;
        }

        // 2. Build Calibration-Specific Instructions
        let calibrationInstructions = "";

        // Bias Logic
        if (calibration?.bias === 'reliability') {
            calibrationInstructions += "\n- CALIBRATION (BIAS): Prioritize ENGINE SAFETY and RELIABILITY. Be cautious with aggressive timing or boost suggestions. Focus on longevity.";
        } else if (calibration?.bias === 'performance') {
            calibrationInstructions += "\n- CALIBRATION (BIAS): Prioritize MAXIMUM POWER. Suggest aggressive modifications and tuning adjustments for track-ready output.";
        }

        // Depth Logic
        if (calibration?.depth === 'deep') {
            calibrationInstructions += "\n- CALIBRATION (DEPTH): Perform a DEEP TRACE analysis. Look for secondary mechanical dependencies and provide 'Chain of Thought' style reasoning in your diagnosis.";
        }

        // Filter Logic
        if (calibration?.filter === 'high') {
            calibrationInstructions += "\n- CALIBRATION (FILTER): Ignore minor data jitters. Focus ONLY on statistically significant power loss or gains.";
        }
        const contents = [{
            parts: [
                {
                    text: `You are a master performance tuning engineer with 10 years of hands-on experience with Dynojet and Mustang dynamometers. 

STAGE 0: UNIT AWARENESS & CROSS-CHECK
- All performance data provided includes specific units (e.g., WHP, NM, lb-ft).
- You MUST perform physical logic validation based on these units. 
- NOTE: 1 NM ≈ 0.74 lb-ft. Do NOT confuse them. If torque is high in NM but low in WHP, check the 5252 RPM crossover logic accordingly.

STAGE 1: First Principles Diagnosis (Core Directives)
Before providing mechanical diagnosis, you MUST first rule out common testing errors:
1. Incorrect RPM signal pickup leading to inflated torque values.
2. Testing in the wrong gear (non 1:1 ratio).
3. Torque converter lockup delay or tire slip causing sudden reading spikes.

STAGE 2: Baseline & Logic Validation
Before analysis, retrieve the factory wheel-horsepower baseline for this specific engine model.
- If the input data exceeds the baseline threshold by more than 20% without supporting hardware modifications, you MUST flag this at the top with [⚠️ Data Credibility Warning].

STAGE 3: Expert Concise Output (Strict Protocol)
- Tone: "Senior Field Engineer" (Professional, Direct, Zero-Fluff).
- Format: Use EXACTLY the three modules below.
- Limit: MAXIMUM 3 concise bullet points per section. 
- Rule: Avoid generic introductory sentences like "Based on the data..." or "I suggest...". Get straight to the technical findings.

⚙️ Data Validation:
(Cross-reference HP vs Torque ratio using provided units. Rule out dyno operator error.)

🔧 Hardware Match:
(Analyze if Mods support the curve. Spot "Stage Inflation".)

🔍 Dynamic Diagnosis:
(Practical, deep-level advice on timing, IAT, boost, or flow restrictions.)

CRITICAL JSON RULES:
1. You MUST return strictly valid JSON.
2. The "advice" field MUST contain the formatted 3-section report in English.
3. Use DOUBLE QUOTES for all keys and string values.
Report in valid JSON format:
{
  "advice": "Your 3-section analysis report content (English).",
  "suggestion": {
    "title": "Specific mod name (e.g. Upgraded Intercooler)",
    "gain": "Estimated WHP gain",
    "difficulty": "Moderate (DIY)",
    "category": "Intercooler / Fueling / Turbo / etc"
  }
}

NEURAL CALIBRATION CONTEXT:
${calibrationInstructions}

SOURCE DATA & VEHICLE INFO:
${diagnosticContext}`
                }
            ]
        }];

        const responseText = await this.callModel(targetModel, contents, {
            temperature: calibration?.bias === 'performance' ? 0.5 : 0.3, // Performance bias allows for slightly more creative problem solving
            maxTokens: targetModel === MODELS.PRO ? 8192 : 4096, // Ensure Pro model leverages larger output window
            jsonMode: true,
            timeoutMs: timeoutMs ?? (targetModel === MODELS.PRO ? 60000 : 25000)
        });

        return this.parseBulletproofJson(responseText);
    }

    /**
     * Bulletproof JSON Extraction and Sanitization
     */
    private parseBulletproofJson(responseText: string | undefined): any {
        if (!responseText) return null;

        const rawText = responseText;

        try {
            // Step 1: Strip markdown and noise
            const sanitizedText = rawText
                .replace(/```json/gi, '')
                .replace(/```/gi, '')
                .replace(/json\n?/gi, '')
                .trim();

            // Step 2: Try standard parse
            try {
                return JSON.parse(sanitizedText);
            } catch (e) {
                // Step 3: Minimal cleanup for trailing/leading noise before fallback
                const trimmed = sanitizedText.replace(/^[^[{]*/, '').replace(/[^}\]]*$/, '');
                return JSON.parse(trimmed);
            }
        } catch (parseError) {
            // 💥 SMART RECOVERY: If Gemini is truncating or returning raw JSON keys...
            console.error("[GeminiService] JSON Parse Failed. attempting smart recovery. Raw:", rawText.slice(0, 100));

            // Try to extract the content of the "advice" field even if it's truncated or malformed
            const adviceMatch = rawText.match(/"advice":\s*"((?:[^"\\]|\\.)*)/);
            let recoveredAdvice = adviceMatch ? adviceMatch[1].trim() : rawText;

            // Remove trailing JSON artifacts and noise (e.g., ", "suggestion": { )
            recoveredAdvice = recoveredAdvice
                .replace(/",\s*"[a-z_]*":\s*{?.*$/is, '')
                .replace(/"\s*}$/, '')
                .replace(/",\s*$/, '');

            // Step 4: Decode escape sequences (CRITICAL for \n display)
            let cleanAdvice = recoveredAdvice
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\t/g, '\t')
                .replace(/\\\\/g, '\\')
                .trim();

            // Final check: if it still looks like a raw JSON block (starts with {), it's a double failure
            if (cleanAdvice.startsWith('{')) {
                const subMatch = cleanAdvice.match(/"advice":\s*"((?:[^"\\]|\\.)*)/);
                if (subMatch) cleanAdvice = subMatch[1].trim();
            }

            return {
                advice: cleanAdvice,
                warning: "Note: AI output was recovered from a truncated response.",
                suggestion: {
                    title: "System Evaluation",
                    gain: "Stability",
                    difficulty: "Retry Recommended",
                    category: "Service Busy"
                }
            };
        }
    }
}
