/**
 * Performance Utils - The "Hard Skills" for the AI Agent
 */

export type DrivetrainType = 'FWD' | 'RWD' | 'AWD' | '4WD';

/**
 * Calculates estimated crank power based on wheel power and drivetrain loss.
 * Standard industry estimates:
 * FWD: ~10-15%
 * RWD: ~15-18%
 * AWD/4WD: ~20-25%
 */
export function calculateDrivetrainLoss(whp: number, type: DrivetrainType = 'RWD'): { crank_hp: number; loss_percent: number } {
    let loss = 0.15; // default RWD

    switch (type) {
        case 'FWD': loss = 0.12; break;
        case 'RWD': loss = 0.15; break;
        case 'AWD':
        case '4WD': loss = 0.22; break;
    }

    return {
        crank_hp: Math.round(whp / (1 - loss)),
        loss_percent: Math.round(loss * 100)
    };
}

/**
 * Prepares a structured context for the AI Pro model to analyze anomalies.
 */
export function getPerformanceDiagnosticContext(
    peakWhp: number,
    peakTorque: number,
    torqueUnit: string,
    vehicle: { make: string; model: string; drivetrain: string; mods?: string[] }
) {
    const { crank_hp, loss_percent } = calculateDrivetrainLoss(peakWhp, (vehicle.drivetrain as DrivetrainType) || 'RWD');

    return `
VEHICLE CONTEXT:
- Model: ${vehicle.make} ${vehicle.model}
- Drivetrain: ${vehicle.drivetrain} (Estimated Path Loss: ${loss_percent}%)
- Current Mods: ${vehicle.mods?.join(', ') || 'No specific mods recorded'}

MEASURED DATA:
- Measured WHP: ${peakWhp}
- Measured Torque: ${peakTorque} ${torqueUnit}
- Calculated Crank HP: ${crank_hp}

DIAGNOSTIC GUIDELINE:
1. Compare Calculated Crank HP against industry standard targets for this vehicle's build stage.
2. Check for "The High-Low Anomaly": If torque is high but WHP is low, investigate top-end flow restrictions.
3. Suggest hardware bottlenecks based on torque delivery points.

STRICT REASONING RULES:
- You MUST acknowledge the current modification status (e.g., if it is Stage 1 Tuned).
- If the vehicle is ALREADY TUNED but peak HP is unusually low for the torque output, DO NOT suggest an ECU tune. 
- Instead, prioritize mechanical or environmental diagnostics: Heat Soak, Boost Leaks, Ignition Timing Pull, or Dyno Calibration errors.
- NEVER recommend an upgrade that the user has already installed.
    `.trim();
}
