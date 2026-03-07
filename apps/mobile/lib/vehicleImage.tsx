import { View, Text, StyleSheet, Image } from 'react-native'
import { useState } from 'react'
import { SvgUri } from 'react-native-svg'

/**
 * Ultra-Premium Typographic & Brand-Logo Vehicle Placeholder
 * Replaces generic car icons with a sleek, high-end automotive telemetry aesthetic.
 * Integrates official brand logos via SimpleIcons API (SVG) with typographic fallback.
 */

const ACCENT_PALETTE = [
    { primary: '#258cf4', secondary: '#00f2ff', name: 'cyan' },
    { primary: '#60a5fa', secondary: '#c084fc', name: 'blue' },
    { primary: '#34d399', secondary: '#10b981', name: 'emerald' },
    { primary: '#fbbf24', secondary: '#f59e0b', name: 'amber' },
    { primary: '#f43f5e', secondary: '#rose', name: 'rose' },
    { primary: '#a78bfa', secondary: '#8b5cf6', name: 'violet' },
]

function getAccent(name: string) {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return ACCENT_PALETTE[Math.abs(hash) % ACCENT_PALETTE.length]
}

function getBrandLogoUrl(make: string) {
    // Mapping for SimpleIcons slugs
    const brandSlugs: { [key: string]: string } = {
        tesla: 'tesla',
        bmw: 'bmw',
        audi: 'audi',
        mercedes: 'mercedes',
        'mercedes-benz': 'mercedes',
        benz: 'mercedes',
        ford: 'ford',
        honda: 'honda',
        toyota: 'toyota',
        porsche: 'porsche',
        nissan: 'nissan',
        chevrolet: 'chevrolet',
        dodge: 'dodge',
        ferrari: 'ferrari',
        lamborghini: 'lamborghini',
        volkswagen: 'volkswagen',
        subaru: 'subaru',
        mazda: 'mazda',
        hyundai: 'hyundai',
        kia: 'kia',
        lexus: 'lexus',
        acura: 'acura',
        infiniti: 'infiniti',
        volvo: 'volvo',
        jeep: 'jeep',
        landrover: 'landrover',
        jaguar: 'jaguar',
        cadillac: 'cadillac',
        buick: 'buick',
        gmc: 'gmc',
        ram: 'ram',
        chrysler: 'chrysler',
        lincoln: 'lincoln',
        rivian: 'rivian',
        lucid: 'lucidmotors',
        polestar: 'polestar',
        mini: 'mini',
        fiat: 'fiat',
        alfa: 'alfaromeo',
        maserati: 'maserati',
        bentley: 'bentley',
        rolls: 'rollsroyce',
        aston: 'astonmartin',
        mclaren: 'mclaren',
        lotus: 'lotus',
    }

    const normalized = make.toLowerCase().replace(/[^a-z0-9-]/g, '')
    let slug: string | null = brandSlugs[normalized] || null
    if (!slug) {
        // Try partial match
        const key = Object.keys(brandSlugs).find(k => normalized.includes(k))
        slug = key ? brandSlugs[key] : null
    }

    // Using colored SVG from simpleicons.org
    return slug ? `https://cdn.simpleicons.org/${slug}` : null
}

interface Props {
    make: string
    model: string
    style?: any
}

export function VehiclePlaceholder({ make, model, style }: Props) {
    const accent = getAccent(`${make}${model}`)
    const displayMake = make.toUpperCase().substring(0, 10)
    const logoUrl = getBrandLogoUrl(make)
    const [logoError, setLogoError] = useState(false)

    return (
        <View style={[S.root, style]}>
            <View style={S.base} />

            {/* Dynamic Ambient Glows */}
            <View style={[S.ambientGlow, { backgroundColor: accent.primary, left: -60, bottom: -60, width: 200, height: 200 }]} />
            <View style={[S.ambientGlow, { backgroundColor: accent.secondary, right: -40, top: -40, width: 140, height: 140, opacity: 0.15 }]} />

            {/* Speed/Telemetry Lines */}
            <View style={S.speedLinesContainer}>
                {[10, 25, 45, 70, 85].map((top, i) => (
                    <View
                        key={`line-${i}`}
                        style={[
                            S.speedLine,
                            {
                                top: `${top}%`,
                                width: i % 2 === 0 ? '120%' : '80%',
                                left: i % 2 === 0 ? '-10%' : '20%',
                                opacity: 0.03 + (i * 0.01),
                                backgroundColor: accent.primary
                            }
                        ]}
                    />
                ))}
            </View>

            {/* Brand Logo (SVG) or Massive Typographic Watermark */}
            <View style={S.typeContainer}>
                {logoUrl && !logoError ? (
                    <View style={S.logoWrapper}>
                        <SvgUri
                            uri={logoUrl}
                            width="100%"
                            height="100%"
                            color={accent.primary}
                            onError={() => setLogoError(true)}
                        />
                    </View>
                ) : (
                    <Text
                        style={[S.massiveText, { color: accent.primary }]}
                        numberOfLines={1}
                        allowFontScaling={false}
                    >
                        {displayMake}
                    </Text>
                )}
            </View>

            {/* Precision Grid Overlay (Bottom) */}
            <View style={S.gridOverlay}>
                <View style={S.gridLineH} />
                <View style={[S.gridLineH, { bottom: 12 }]} />
                <View style={S.gridLineV} />
                <View style={[S.gridLineV, { right: 20, left: undefined }]} />
            </View>

            {/* Model ID Text - Positioned at TOP-RIGHT to avoid all bottom UI overlays */}
            <Text style={[S.modelIdText, { color: accent.primary }]} numberOfLines={1}>
                // {make.toUpperCase()} {model.toUpperCase()}
            </Text>
        </View>
    )
}

/**
 * Compact thumbnail variant for small cards (AI Lab, etc.)
 */
export function VehiclePlaceholderThumb({ make, model }: { make: string; model: string }) {
    const accent = getAccent(`${make}${model}`)
    const shortMake = make.substring(0, 2).toUpperCase()
    const logoUrl = getBrandLogoUrl(make)
    const [logoError, setLogoError] = useState(false)

    return (
        <View style={T.root}>
            <View style={[T.ambientGlow, { backgroundColor: accent.primary }]} />

            {/* Subtle diagonal line */}
            <View style={T.diagLine} />

            {logoUrl && !logoError ? (
                <View style={T.thumbLogoWrapper}>
                    <SvgUri
                        uri={logoUrl}
                        width="24"
                        height="24"
                        color={accent.primary}
                        onError={() => setLogoError(true)}
                    />
                </View>
            ) : (
                <Text style={[T.letterMark, { color: accent.primary }]} numberOfLines={1}>
                    {shortMake}
                </Text>
            )}
        </View>
    )
}

const S = StyleSheet.create({
    root: {
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#050a10',
    },
    base: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#050a10',
    },
    ambientGlow: {
        position: 'absolute',
        borderRadius: 200,
        opacity: 0.12,
        transform: [{ scaleX: 1.5 }],
    },
    speedLinesContainer: {
        ...StyleSheet.absoluteFillObject,
        transform: [{ skewY: '-12deg' }],
    },
    speedLine: {
        position: 'absolute',
        height: 1.5,
    },
    typeContainer: {
        position: 'absolute',
        right: 0,
        left: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.12, // Increased slightly for better visibility
    },
    logoWrapper: {
        width: 140,
        height: 140,
    },
    brandLogo: {
        width: '55%',
        height: '55%',
    },
    massiveText: {
        fontSize: 110,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: -4,
        includeFontPadding: false,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 10,
    },
    gridOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 40,
        overflow: 'hidden',
    },
    gridLineH: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 6,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    gridLineV: {
        position: 'absolute',
        left: 20,
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    modelIdText: {
        position: 'absolute',
        right: 16,
        top: 16, // Moved to TOP to avoid WHP overlap
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 2,
        opacity: 0.6,
        textAlign: 'right',
    },
})

const T = StyleSheet.create({
    root: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#08101a',
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    ambientGlow: {
        position: 'absolute',
        width: '150%',
        height: '150%',
        opacity: 0.15,
    },
    diagLine: {
        position: 'absolute',
        width: '200%',
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        transform: [{ rotate: '-45deg' }],
    },
    letterMark: {
        fontSize: 20,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: -1,
        opacity: 0.8,
    },
    thumbLogo: {
        width: 32,
        height: 32,
        opacity: 0.9,
    },
    thumbLogoWrapper: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
})
