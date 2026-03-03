import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { GeminiService, MODELS } from '../services/gemini'
import { getPerformanceDiagnosticContext } from '../lib/performance'
import { createClient } from '@supabase/supabase-js'
import { TIER_LIMITS, AI_CREDIT_COSTS } from '@dynosync/types'

type Bindings = {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    GOOGLE_AI_API_KEY: string
}

export const aiRouter = new Hono<{ Bindings: Bindings, Variables: { userId: string } }>()

aiRouter.get('/ping', (c) => c.json({ status: 'ok', service: 'AI Advisor' }))

aiRouter.use('*', authMiddleware)

/**
 * Shared credit check + deduction helper.
 * Returns { allowed, creditsUsed, creditsLimit, nextReset } or throws on DB error.
 */
async function checkAndConsumeCredits(
    supabase: any,
    userId: string,
    cost: number
): Promise<{ allowed: boolean; creditsUsed: number; creditsLimit: number; nextReset: string }> {
    const { data: userData, error } = await supabase
        .from('users')
        .select('tier, ai_credits_used, ai_credits_reset_at')
        .eq('id', userId)
        .single()

    if (error || !userData) throw new Error('User profile check failed')

    const tier = (userData.tier || 'free') as 'free' | 'pro'
    const limit = TIER_LIMITS[tier].aiCreditsPerMonth

    // Rolling 30-day reset
    const now = new Date()
    const resetAt = new Date(userData.ai_credits_reset_at || now)
    const needsReset = (now.getTime() - resetAt.getTime()) >= 30 * 24 * 60 * 60 * 1000

    const currentUsed = needsReset ? 0 : (userData.ai_credits_used || 0)
    const newResetAt = needsReset ? now.toISOString() : userData.ai_credits_reset_at
    const nextReset = new Date(new Date(newResetAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

    if (currentUsed + cost > limit) {
        return { allowed: false, creditsUsed: currentUsed, creditsLimit: limit, nextReset }
    }

    // Deduct credits (fire-and-forget, non-blocking)
    supabase.from('users').update({
        ai_credits_used: currentUsed + cost,
        ai_credits_reset_at: newResetAt,
        updated_at: now.toISOString()
    }).eq('id', userId).then(() => {
        console.log(`[Credits] User ${userId}: ${currentUsed} + ${cost} / ${limit}`)
    })

    return { allowed: true, creditsUsed: currentUsed + cost, creditsLimit: limit, nextReset }
}

/**
 * POST /ai/analyze-dyno
 * OCR scan of a dyno sheet image. Costs 1 credit.
 */
aiRouter.post('/analyze-dyno', async (c) => {
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const userId = c.get('userId')

    try {
        const { image } = await c.req.json()
        if (!image) return c.json({ error: 'No image provided' }, 400)

        const credit = await checkAndConsumeCredits(supabase, userId, AI_CREDIT_COSTS.ocr_scan)
        if (!credit.allowed) {
            return c.json({
                error: 'AI_LIMIT_REACHED',
                message: `You've used all ${credit.creditsLimit} AI credits for this cycle.`,
                credits_used: credit.creditsUsed,
                credits_limit: credit.creditsLimit,
                next_reset: credit.nextReset
            }, 403)
        }

        const gemini = new GeminiService(c.env.GOOGLE_AI_API_KEY)
        const metrics = await gemini.extractDynoMetrics(image)

        if (!metrics) return c.json({ error: 'Could not extract metrics from image' }, 422)

        return c.json({
            ...metrics,
            recorded_at: new Date().toISOString(),
            confidence: 0.98,
            credits_used: credit.creditsUsed,
            credits_limit: credit.creditsLimit
        })
    } catch (e: any) {
        console.error('AI Scan Error:', e)
        return c.json({ error: e.message }, 500)
    }
})

const ADVISOR_VERSION = 'v6';

/**
 * POST /ai/advisor
 * Deep tuning analysis.
 * - depth=quick: Flash model, costs 1 credit
 * - depth=deep:  Pro model, costs 3 credits; falls back to Flash on failure (still costs 3)
 * - Pro users hitting 100-credit cap get Flash fallback instead of rejection
 */
aiRouter.post('/advisor', async (c) => {
    const { whp, torque, vehicle, forceRefresh, calibration } = await c.req.json()
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const userId = c.get('userId')

    // 1. Fetch vehicle + related data in parallel
    const [vResult, modsResult, dynoResult] = await Promise.all([
        supabase.from('vehicles').select('*').eq('id', vehicle?.id).single(),
        supabase.from('mod_logs').select('id, updated_at').eq('vehicle_id', vehicle?.id),
        supabase.from('dyno_records').select('id, recorded_at').eq('vehicle_id', vehicle?.id)
    ])

    if (vResult.error || !vResult.data) {
        return c.json({ error: 'Vehicle not found', details: vResult.error?.message }, 404)
    }

    const fullVehicle = {
        ...vResult.data,
        mod_logs: modsResult.data || [],
        dyno_records: dynoResult.data || []
    }

    // 2. Fingerprint for cache
    const fingerprint = [
        ADVISOR_VERSION,
        fullVehicle.updated_at,
        fullVehicle.mod_logs.length,
        fullVehicle.mod_logs.map((m: any) => m.updated_at).sort().pop() || '0',
        fullVehicle.dyno_records.length,
        fullVehicle.dyno_records.map((d: any) => d.recorded_at).sort().pop() || '0',
        JSON.stringify(calibration || {})
    ].join('|')

    // 3. Cache hit — no credit charge
    if (!forceRefresh && fullVehicle.advisor_cache_key === fingerprint && fullVehicle.last_advisor_result) {
        console.log(`[AI Advisor] Cache hit for ${vehicle.id}`)
        return c.json({
            ...fullVehicle.last_advisor_result,
            provider: 'cached',
            cached_at: fullVehicle.updated_at
        })
    }

    // 4. Determine cost and model
    const isDeep = calibration?.depth !== 'quick'
    const cost = isDeep ? AI_CREDIT_COSTS.advisor_deep : AI_CREDIT_COSTS.advisor_quick

    // 5. Credit check
    const credit = await checkAndConsumeCredits(supabase, userId, cost)

    // Pro users over limit: degrade to Flash instead of blocking
    let forceFallback = false
    if (!credit.allowed) {
        const { data: userData } = await supabase.from('users').select('tier').eq('id', userId).single()
        if (userData?.tier === 'pro') {
            console.log(`[AI Advisor] Pro user ${userId} over credit limit — degrading to Flash`)
            forceFallback = true
        } else {
            return c.json({
                error: 'AI_LIMIT_REACHED',
                message: `You've used all ${credit.creditsLimit} AI credits for this cycle.`,
                credits_used: credit.creditsUsed,
                credits_limit: credit.creditsLimit,
                next_reset: credit.nextReset
            }, 403)
        }
    }

    // 6. Generate
    const diagnosticContext = getPerformanceDiagnosticContext(whp, torque, vehicle)
    const gemini = new GeminiService(c.env.GOOGLE_AI_API_KEY)

    const initialModel = (isDeep && !forceFallback) ? MODELS.PRO : MODELS.FLASH
    const isProIntended = initialModel === MODELS.PRO

    try {
        let result = null
        let lastError = null

        // Pro model: up to 2 attempts before fallback
        const maxAttempts = isProIntended ? 2 : 1

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                if (attempt > 1) await new Promise(r => setTimeout(r, 1500))
                result = await gemini.analyzePerformance(diagnosticContext, initialModel, calibration)
                if (result) break
            } catch (e: any) {
                lastError = e
                console.warn(`[AI Advisor] ${initialModel} attempt ${attempt} failed: ${e.message}`)
                const isTransient = e.message.includes('503') || e.message.includes('Timeout') || e.message.includes('high demand')
                if (!isTransient) break
            }
        }

        // Flash fallback
        if (!result && isProIntended) {
            console.log(`[AI Advisor] Falling back to Flash for ${userId}`)
            try {
                const fallback = await gemini.analyzePerformance(diagnosticContext, MODELS.FLASH, calibration)
                if (fallback) result = { ...fallback, note: 'Served by Flash due to Pro model unavailability.' }
            } catch (e: any) {
                console.error('[AI Advisor] Flash fallback failed:', e)
            }
        }

        if (!result) throw lastError || new Error('AI service returned null')

        const finalResult = {
            ...result,
            provider: result.note ? 'gemini-flash (fallback)' : (isProIntended ? 'gemini-pro' : 'gemini-flash'),
            credits_used: credit.creditsUsed,
            credits_limit: credit.creditsLimit
        }

        // 7. Update vehicle cache in background
        c.executionCtx.waitUntil(
            Promise.resolve(supabase.from('vehicles').update({
                advisor_cache_key: fingerprint,
                last_advisor_result: finalResult,
                updated_at: new Date().toISOString()
            }).eq('id', vehicle.id))
        )

        return c.json(finalResult)
    } catch (e: any) {
        console.error(`[AI Advisor] Critical failure:`, e)
        return c.json({ error: `AI Service Error: ${e.message}` }, 503)
    }
})

/**
 * GET /ai/credits
 * Returns current credit usage for the authenticated user.
 */
aiRouter.get('/credits', async (c) => {
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
        .from('users')
        .select('tier, ai_credits_used, ai_credits_reset_at')
        .eq('id', c.get('userId'))
        .single()

    if (error || !data) return c.json({ error: 'User not found' }, 404)

    const tier = (data.tier || 'free') as 'free' | 'pro'
    const limit = TIER_LIMITS[tier].aiCreditsPerMonth
    const resetAt = new Date(data.ai_credits_reset_at || new Date())
    const needsReset = (Date.now() - resetAt.getTime()) >= 30 * 24 * 60 * 60 * 1000
    const used = needsReset ? 0 : (data.ai_credits_used || 0)

    return c.json({
        tier,
        credits_used: used,
        credits_limit: limit,
        credits_remaining: Math.max(0, limit - used),
        next_reset: new Date(resetAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        costs: AI_CREDIT_COSTS
    })
})
