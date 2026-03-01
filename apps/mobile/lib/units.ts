/**
 * Conversion utility for DynoSync.
 * 
 * Base database metrics:
 * - WHP (Wheel Horsepower): Universal, no conversion needed.
 * - Torque (Nm): Metric base. 1 Nm = 0.737562149 lb-ft.
 * - Speed (0-60mph, 1/4 mile): Typically time based in seconds, universal. 
 *   If we store km/h trap speeds in the future, we'll add conversions here.
 */

const NM_TO_LBFT = 0.737562149

export function convertTorque(nm: number | null | undefined, toImperial: boolean): number | null {
    if (nm == null) return null
    if (!toImperial) return nm
    return nm * NM_TO_LBFT
}

export function formatTorque(nm: number | null | undefined, isImperial: boolean): string {
    if (nm == null) return '—'
    const val = convertTorque(nm, isImperial)!
    const rounded = Math.round(val)
    return `${rounded} ${isImperial ? 'lb-ft' : 'Nm'}`
}

export function formatTorqueValueOnly(nm: number | null | undefined, isImperial: boolean): string {
    if (nm == null) return '—'
    const val = convertTorque(nm, isImperial)!
    return Math.round(val).toString()
}

export function getTorqueUnit(isImperial: boolean): string {
    return isImperial ? 'lb-ft' : 'Nm'
}
