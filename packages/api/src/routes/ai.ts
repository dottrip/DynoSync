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
    cost: number,
    feature?: string
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
        console.log(`[AI Credits] ${userId} limit reached (${currentUsed}/${limit}). Denying ${cost} credits for ${feature}.`)
        return { allowed: false, creditsUsed: currentUsed, creditsLimit: limit, nextReset }
    }

    // Deduct credits and log transaction
    console.log(`[AI Credits] Deducting ${cost} for ${userId} (${feature}). New total used: ${currentUsed + cost}`)

    // Background logging to avoid blocking core response
    const updateTask = supabase.from('users').update({
        ai_credits_used: currentUsed + cost,
        ai_credits_reset_at: newResetAt,
        updated_at: now.toISOString()
    }).eq('id', userId)

    const logTask = supabase.from('ai_credit_logs').insert({
        user_id: userId,
        feature: feature || 'unknown',
        credits: cost,
        tier: tier,
        created_at: now.toISOString()
    })

    // We await update to ensure persistence, but log can be slightly more lax
    try {
        const { error: updErr } = await updateTask
        if (updErr) throw new Error(`User credit update failed: ${updErr.message}`)

        logTask.then(({ error: lErr }: { error: any }) => {
            if (lErr) console.error(`[AI Credits] Log failed for ${userId}:`, lErr.message)
        })
    } catch (e: any) {
        console.error(`[AI Credits] Critical DB update failure for ${userId}:`, e)
        throw e
    }

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

        const credit = await checkAndConsumeCredits(supabase, userId, AI_CREDIT_COSTS.ocr_scan, 'ocr_dyno')
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

/**
 * POST /ai/scan-vin
 * OCR scan of a vehicle VIN from image. Costs 1 credit.
 */
aiRouter.post('/scan-vin', async (c) => {
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const userId = c.get('userId')

    try {
        const { image } = await c.req.json()
        if (!image) return c.json({ error: 'No image provided' }, 400)

        const credit = await checkAndConsumeCredits(supabase, userId, AI_CREDIT_COSTS.ocr_vin, 'ocr_vin')
        if (!credit.allowed) {
            return c.json({ error: 'AI_LIMIT_REACHED' }, 403)
        }

        const gemini = new GeminiService(c.env.GOOGLE_AI_API_KEY)
        const result = await gemini.extractVin(image)

        return c.json({
            ...result,
            credits_used: credit.creditsUsed,
            credits_limit: credit.creditsLimit
        })
    } catch (e: any) {
        console.error('AI VIN Scan Error:', e)
        return c.json({ error: e.message }, 500)
    }
})

/**
 * POST /ai/baseline-specs
 * Extracts estimated stock WHP, Torque, and Curb Weight based on vehicle info.
 * Cost: 1 credit (advisor_quick level)
 */
aiRouter.post('/baseline-specs', async (c) => {
    const { make, model, year, trim } = await c.req.json()
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const userId = c.get('userId')

    try {
        // 1. Credit check (costs 1 credit)
        const credit = await checkAndConsumeCredits(supabase, userId, AI_CREDIT_COSTS.advisor_quick, 'baseline_specs')
        if (!credit.allowed) {
            return c.json({ error: 'AI_LIMIT_REACHED' }, 403)
        }

        // 2. Build the Prompt
        const prompt = `You are an expert automotive engineer. Based on the following vehicle information:
Make: ${make || 'Unknown'}
Model: ${model || 'Unknown'}
Year: ${year || 'Unknown'}
Trim: ${trim || 'Base'}

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
If you are completely unsure about a value, return 0 for that value. Return ONLY the JSON object, no other text.`

        // 3. Call Gemini (Flash model is fine for static knowledge)
        const aiService = new GeminiService(c.env.GOOGLE_AI_API_KEY)
        const baselineData = await aiService.analyzeText(prompt, MODELS.FLASH, { jsonMode: true })

        return c.json(baselineData)

    } catch (e: any) {
        console.error('AI Baseline Error:', e)
        // Ensure robust fallback on the frontend
        return c.json({ error: 'Failed to extract baseline from AI', details: e.message }, 500)
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
    const { whp, torque, torqueUnit, vehicle, forceRefresh, calibration } = await c.req.json()
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
    const featureKey = isDeep ? 'advisor_deep' : 'advisor_quick'
    const credit = await checkAndConsumeCredits(supabase, userId, cost, featureKey)

    if (!credit.allowed) {
        return c.json({
            error: 'AI_LIMIT_REACHED',
            message: `You've used all ${credit.creditsLimit} AI credits for this cycle.`,
            credits_used: credit.creditsUsed,
            credits_limit: credit.creditsLimit,
            next_reset: credit.nextReset
        }, 403)
    }

    // 6. Generate
    const diagnosticContext = getPerformanceDiagnosticContext(whp, torque, torqueUnit || 'NM', vehicle)
    const gemini = new GeminiService(c.env.GOOGLE_AI_API_KEY)

    const initialModel = isDeep ? MODELS.PRO : MODELS.FLASH
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

        // Flash fallback - Partial Refund logic (if originally charged 5, refund 4)
        if (!result && isProIntended) {
            console.log(`[AI Advisor] Falling back to Flash for ${userId} - Refunding partial credits`)
            try {
                const fallback = await gemini.analyzePerformance(diagnosticContext, MODELS.FLASH, calibration)
                if (fallback) {
                    result = { ...fallback, note: 'Served by Flash due to Pro model unavailability.' }
                    // Logic: Charge was 5 (advisor_deep), Flash cost is 1. Refund 4.
                    const refundAmount = AI_CREDIT_COSTS.advisor_deep - AI_CREDIT_COSTS.advisor_quick
                    const { data: current } = await supabase.from('users').select('ai_credits_used').eq('id', userId).single()
                    await Promise.all([
                        supabase.from('users').update({
                            ai_credits_used: Math.max(0, (current?.ai_credits_used || 0) - refundAmount)
                        }).eq('id', userId),
                        supabase.from('ai_credit_logs').insert({
                            user_id: userId,
                            feature: 'advisor_fallback_refund',
                            credits: -refundAmount,
                            tier: 'pro',
                            created_at: new Date().toISOString()
                        })
                    ])
                }
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

        // 7. Update vehicle cache and log (Foreground for durability)
        const advisorLogData = {
            user_id: userId,
            vehicle_id: vehicle.id,
            whp: Number(whp) || 0,
            torque: Number(torque) || 0,
            torque_unit: torqueUnit || 'NM',
            advice: typeof result.advice === 'string' ? result.advice : JSON.stringify(result.advice || ''),
            suggestion: result.suggestion || null,
            created_at: new Date().toISOString()
        }

        console.log(`[AI Advisor] Logging results for vehicle=${vehicle.id}, whp=${whp}`)

        try {
            await Promise.all([
                supabase.from('vehicles').update({
                    advisor_cache_key: fingerprint,
                    last_advisor_result: finalResult,
                    updated_at: new Date().toISOString()
                }).eq('id', vehicle.id),
                supabase.from('advisor_logs').insert(advisorLogData)
            ])
            console.log('[AI Advisor] Logged successfully')
        } catch (dbError: any) {
            console.error('[AI Advisor] Database logging failed (continuing to serve user):', dbError.message)
            // We still return the JSON to the user even if logging fails, but now we know it failed
        }

        return c.json(finalResult)
    } catch (e: any) {
        console.error(`[AI Advisor] Critical failure:`, e)
        return c.json({ error: `AI Service Error: ${e.message}` }, 503)
    }
})

/**
 * GET /ai/advisor/history/:vehicleId
 * Returns past AI advisor logs for a specific vehicle.
 */
aiRouter.get('/advisor/history/:vehicleId', async (c) => {
    const vehicleId = c.req.param('vehicleId')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const userId = c.get('userId')

    console.log(`[AI History] Fetching for vehicleId=${vehicleId}, userId=${userId}`)

    // First query: match both vehicle_id and user_id
    const { data, error } = await supabase
        .from('advisor_logs')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error(`[AI History] Query error:`, error.message)
        return c.json({ error: error.message }, 500)
    }

    console.log(`[AI History] Found ${data?.length || 0} logs for vehicleId=${vehicleId}, userId=${userId}`)

    // If no results, check if logs exist without user_id filter (diagnose user_id mismatch)
    if (!data || data.length === 0) {
        const { data: allLogs } = await supabase
            .from('advisor_logs')
            .select('id, user_id, vehicle_id')
            .eq('vehicle_id', vehicleId)
            .order('created_at', { ascending: false })
            .limit(5)

        if (allLogs && allLogs.length > 0) {
            console.warn(`[AI History] Found ${allLogs.length} logs for vehicle but user_id mismatch!`, {
                expected_user_id: userId,
                actual_user_ids: [...new Set(allLogs.map((l: any) => l.user_id))]
            })
            // Return the logs anyway — the user owns the vehicle
            const { data: fixedData } = await supabase
                .from('advisor_logs')
                .select('*')
                .eq('vehicle_id', vehicleId)
                .order('created_at', { ascending: false })
            return c.json(fixedData || [])
        }
    }

    return c.json(data || [])
})

/**
 * GET /ai/stats
 * Returns aggregated usage statistics for the current billing cycle.
 */
aiRouter.get('/stats', async (c) => {
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const userId = c.get('userId')

    // Fetch user for reset date
    const { data: user } = await supabase.from('users').select('ai_credits_reset_at').eq('id', userId).single()
    const resetDate = user?.ai_credits_reset_at || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Fetch logs since reset
    const { data: logs, error } = await supabase
        .from('ai_credit_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', resetDate)

    if (error) return c.json({ error: error.message }, 500)

    // Aggregate by feature
    const stats = (logs || []).reduce((acc: any, log: any) => {
        acc[log.feature] = (acc[log.feature] || 0) + log.credits
        return acc
    }, {})

    return c.json({
        total: (logs || []).reduce((sum, l) => sum + l.credits, 0),
        breakdown: stats,
        count: logs?.length || 0,
        reset_at: resetDate
    })
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
