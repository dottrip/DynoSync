import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { GeminiService, MODELS } from '../services/gemini'
import { getPerformanceDiagnosticContext } from '../lib/performance'
import { createClient } from '@supabase/supabase-js'

type Bindings = {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    GOOGLE_AI_API_KEY: string
}

export const aiRouter = new Hono<{ Bindings: Bindings, Variables: { userId: string } }>()

// Diagnostic route to verify if the router is reachable
aiRouter.get('/ping', (c) => c.json({ status: 'ok', service: 'AI Advisor' }))

// All AI routes require authentication
aiRouter.use('*', authMiddleware)

/**
 * POST /ai/analyze-dyno
 * Analyzes a dyno sheet image (base64) using Gemini 2.0 Flash (Fast OCR).
 */
aiRouter.post('/analyze-dyno', async (c) => {
    try {
        const { image } = await c.req.json()
        if (!image) return c.json({ error: 'No image provided' }, 400)

        const gemini = new GeminiService(c.env.GOOGLE_AI_API_KEY)
        const metrics = await gemini.extractDynoMetrics(image)

        if (!metrics) {
            return c.json({ error: 'Could not extract metrics from image' }, 422)
        }

        return c.json({
            ...metrics,
            recorded_at: new Date().toISOString(),
            confidence: 0.98
        })
    } catch (e: any) {
        console.error('AI Scan Error:', e)
        return c.json({ error: e.message }, 500)
    }
})

const ADVISOR_VERSION = 'v5';

/**
 * POST /ai/advisor
 * Provides deep tuning advice using Gemini 3.1 Pro (Logic Expert).
 * Falls back to 3.0 Flash if Pro times out or fails (High-Low Mix Fallback).
 */
aiRouter.post('/advisor', async (c) => {
    const { whp, torque, vehicle, forceRefresh, calibration } = await c.req.json()
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)

    // 1. Fetch latest vehicle state (3 separate queries for maximum robustness)
    console.log(`[AI Advisor] Checking state for vehicle: ${vehicle?.id}`)

    // Query 1: Vehicle Basic Info + Cache
    const { data: vData, error: vError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicle?.id)
        .single()

    if (vError || !vData) {
        console.error('[AI Advisor] Vehicle fetch failed:', vError?.message || 'No data', vError?.details);
        return c.json({ error: 'Vehicle state check failed (Vehicle Not Found)', details: vError?.message }, 404)
    }

    // Query 2: Mod Logs
    const { data: modsData } = await supabase
        .from('mod_logs')
        .select('id, updated_at')
        .eq('vehicle_id', vehicle?.id)

    // Query 3: Dyno Records
    const { data: dynoData } = await supabase
        .from('dyno_records')
        .select('id, recorded_at')
        .eq('vehicle_id', vehicle?.id)

    const fullVehicle = {
        ...vData,
        mod_logs: modsData || [],
        dyno_records: dynoData || []
    }

    // 2. Generate State Fingerprint (Version + Mods count/dates + Dyno count/dates)
    // This detects if anything meaningful changed since the last analysis
    const fingerprint = [
        ADVISOR_VERSION,
        fullVehicle.updated_at,
        fullVehicle.mod_logs?.length || 0,
        fullVehicle.mod_logs?.map((m: any) => m.updated_at).sort().pop() || '0',
        fullVehicle.dyno_records?.length || 0,
        fullVehicle.dyno_records?.map((d: any) => d.recorded_at).sort().pop() || '0',
        JSON.stringify(calibration || {})
    ].join('|')

    // 3. Cache Lookup
    if (!forceRefresh && fullVehicle.advisor_cache_key === fingerprint && fullVehicle.last_advisor_result) {
        console.log(`[AI Advisor] Serving cached analysis for ${vehicle.id} (Version: ${ADVISOR_VERSION})`)
        return c.json({
            ...fullVehicle.last_advisor_result,
            severity: 'info',
            provider: 'cached',
            cached_at: fullVehicle.updated_at
        })
    }

    // 4. Fetch User Tier
    const { data: userData } = await supabase
        .from('users')
        .select('tier')
        .eq('id', c.get('userId'))
        .single()
    const userTier = userData?.tier || 'free'
    const isSubscribed = userTier === 'pro' || userTier === 'elite'

    const updateCache = async (finalResult: any) => {
        try {
            await supabase.from('vehicles')
                .update({
                    advisor_cache_key: fingerprint,
                    last_advisor_result: finalResult,
                    updated_at: new Date().toISOString()
                })
                .eq('id', vehicle.id);
            console.log(`[AI Advisor] Cache updated successfully for ${vehicle.id}`);
        } catch (err) {
            console.error('[AI Advisor] Background cache update failed:', err);
        }
    }

    // 5. Cache Miss -> Proceed to AI Generation
    const diagnosticContext = getPerformanceDiagnosticContext(whp, torque, vehicle)
    const gemini = new GeminiService(c.env.GOOGLE_AI_API_KEY)

    try {
        console.log(`[AI Advisor] Final Prompt for Gemini (Tier: ${userTier}, Depth: ${calibration?.depth}):\n${diagnosticContext}`);

        let result = null;
        let lastError = null;

        // --- Intelligent Model Selection ---
        // If user expressly requested 'quick' scan, start with FLASH and skip PRO retries.
        const initialModel = calibration?.depth === 'quick' ? MODELS.FLASH : MODELS.PRO;
        const isProIntended = initialModel === MODELS.PRO;

        // Strategy: Subscribed users get up to 3 attempts for PRO, others get 1.
        // FLASH calls are always single-attempt.
        const maxAttempts = (isSubscribed && isProIntended) ? 3 : 1;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                if (attempt > 1) {
                    console.log(`[AI Advisor] Retry PRO attempt ${attempt}/${maxAttempts} for ${userTier} user...`);
                    await new Promise(r => setTimeout(r, 1000 * attempt));
                }

                result = await gemini.analyzePerformance(diagnosticContext, initialModel, calibration);
                if (result) break;
            } catch (e: any) {
                lastError = e;
                console.warn(`[AI Advisor] ${initialModel} Attempt ${attempt} failed: ${e.message}`);

                // Don't retry if it's not a transient error or if we're already on Flash
                if (!isProIntended || (!e.message.includes('503') && !e.message.includes('Timeout') && !e.message.includes('Currently experiencing high demand'))) {
                    break;
                }
            }
        }

        // --- Selective Fallback Mechanism ---
        // Only run fallback if the PRO model failed. If user chose FLASH or PRO succeeded, result is already set.
        if (!result && isProIntended) {
            console.log(`[AI Advisor] PRO failed all attempts, falling back to FLASH...`);
            try {
                const fallbackResult = await gemini.analyzePerformance(diagnosticContext, MODELS.FLASH, calibration);
                if (fallbackResult) {
                    result = {
                        ...fallbackResult,
                        severity: 'info',
                        provider: 'gemini-1.5-flash (forced fallback)',
                        note: 'High-fidelity reasoning bypassed due to upstream error.'
                    };
                }
            } catch (fallbackErr: any) {
                console.error('[AI Advisor] Fatal fallback error:', fallbackErr);
            }
        }

        if (!result) {
            throw lastError || new Error('AI Service returned null result');
        }

        const finalResult = {
            ...result,
            severity: 'info',
            provider: isProIntended ? 'gemini-3.1-pro' : 'gemini-1.5-flash'
        };

        // 6. Update Cache in Background
        c.executionCtx.waitUntil(updateCache(finalResult));

        return c.json(finalResult)
    } catch (e: any) {
        const proError = e.message;
        console.error(`[AI Advisor] Critical Failure: ${proError}`);
        return c.json({
            error: `AI Service Error: ${proError}`,
            debug: { details: e.message }
        }, 503)
    }
})
