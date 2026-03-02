import { useRef, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, Alert, Dimensions, Image,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import ViewShot from 'react-native-view-shot'
import * as Sharing from 'expo-sharing'
import { useVehicles } from '../hooks/useVehicles'
import { useDynoRecords } from '../hooks/useDynoRecords'
import { useModLogs } from '../hooks/useModLogs'
import { useSettings } from '../hooks/useSettings'
import { formatTorqueValueOnly, getTorqueUnit } from '../lib/units'

const { width: SCREEN_W } = Dimensions.get('window')
const POSTER_W = SCREEN_W - 32
const POSTER_H = Math.round(POSTER_W * (16 / 9))

const CAT_COLOR: Record<string, string> = {
  engine: '#f59e0b', exhaust: '#ef4444', intake: '#3ea8ff',
  suspension: '#8b5cf6', brakes: '#dc2626', wheels: '#6b7280',
  aero: '#06b6d4', interior: '#a78bfa', electronics: '#10b981', other: '#64748b',
}

// ─── V1 竞技风海报 ────────────────────────────────────────────────────────────
function PosterV1({ vehicle, current, baseline, whpDelta, whpDeltaPct, isGain, recentMods, records, logs, imperialUnits }: any) {
  return (
    <View style={[P.poster, { width: POSTER_W, height: POSTER_H, backgroundColor: '#060e16' }]}>
      {vehicle?.image_url && (
        <Image source={{ uri: vehicle.image_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      )}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(6,14,22,0.82)' }]} />

      {/* Top header */}
      <View style={P.v1Top}>
        <View style={P.brandRow}>
          <View style={P.brandDot} />
          <Text style={P.brandText}>DYNOSYNC</Text>
        </View>
        <View style={P.verifiedBadge}>
          <MaterialIcons name="verified" size={10} color="#10b981" />
          <Text style={P.verifiedText}>VERIFIED</Text>
        </View>
      </View>

      {/* Vehicle info */}
      <View style={P.v1VehicleSection}>
        <Text style={P.v1VehicleName}>{vehicle?.year} {vehicle?.make}</Text>
        <Text style={P.v1VehicleModel}>{vehicle?.model}{vehicle?.trim ? ` · ${vehicle.trim}` : ''}</Text>
        {vehicle?.drivetrain && (
          <View style={P.driveChip}>
            <Text style={P.driveChipText}>{vehicle.drivetrain}</Text>
          </View>
        )}
      </View>

      {/* WHP neon hero */}
      <View style={P.v1WhpSection}>
        <Text style={P.v1WhpLabel}>PEAK POWER</Text>
        <Text style={P.v1WhpValue}>{current?.whp ?? baseline?.whp ?? '—'}</Text>
        <Text style={P.v1WhpUnit}>WHP</Text>
        {current?.torque_nm != null && (
          <Text style={P.v1TorqueText}>{formatTorqueValueOnly(current.torque_nm, imperialUnits)} {getTorqueUnit(imperialUnits)} torque</Text>
        )}
        {/* Tachometer decoration */}
        <View style={P.tachoRow}>
          {Array.from({ length: 11 }).map((_, i) => (
            <View
              key={i}
              style={[
                P.tachoTick,
                {
                  height: i % 5 === 0 ? 14 : 8,
                  backgroundColor: i <= 7 ? `rgba(62,168,255,${0.3 + i * 0.08})` : '#ef4444',
                  transform: [{ rotate: `${-50 + i * 10}deg` }],
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Delta badge */}
      {whpDelta != null && whpDeltaPct != null && (
        <View style={[P.deltaBadge, { backgroundColor: isGain ? 'rgba(16,185,129,0.9)' : 'rgba(239,68,68,0.9)' }]}>
          <MaterialIcons name={isGain ? 'arrow-upward' : 'arrow-downward'} size={13} color="#fff" />
          <Text style={P.deltaText}>
            {isGain ? '+' : ''}{whpDelta.toFixed(0)} WHP  ({isGain ? '+' : ''}{whpDeltaPct.toFixed(1)}%)
          </Text>
          <Text style={P.deltaSubText}>vs stock baseline</Text>
        </View>
      )}

      {/* Bottom section */}
      <View style={P.v1Bottom}>
        {/* Stats row */}
        <View style={P.statsRow}>
          {current?.zero_to_sixty != null && (
            <View style={P.statItem}>
              <Text style={P.statVal}>{current.zero_to_sixty}s</Text>
              <Text style={P.statLabel}>0–60</Text>
            </View>
          )}
          {current?.quarter_mile != null && (
            <View style={P.statItem}>
              <Text style={P.statVal}>{current.quarter_mile}s</Text>
              <Text style={P.statLabel}>¼ MILE</Text>
            </View>
          )}
          <View style={P.statItem}>
            <Text style={P.statVal}>{logs?.length ?? 0}</Text>
            <Text style={P.statLabel}>MODS</Text>
          </View>
          <View style={P.statItem}>
            <Text style={P.statVal}>{records?.length ?? 0}</Text>
            <Text style={P.statLabel}>RUNS</Text>
          </View>
        </View>

        {/* Recent mods */}
        {recentMods.length > 0 && (
          <View style={P.modsSection}>
            <Text style={P.modsTitle}>RECENT MODS</Text>
            {recentMods.map((mod: any) => (
              <View key={mod.id} style={P.modRow}>
                <View style={[P.modDot, { backgroundColor: CAT_COLOR[mod.category] ?? '#64748b' }]} />
                <Text style={P.modText} numberOfLines={1}>{mod.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={P.footer}>
          <Text style={P.footerUrl}>dynosync.co</Text>
          <View style={P.footerLine} />
          <Text style={P.footerYear}>{new Date().getFullYear()}</Text>
        </View>
      </View>
    </View>
  )
}

// ─── V2 遥测风海报 ────────────────────────────────────────────────────────────
function PosterV2({ vehicle, current, baseline, whpDelta, whpDeltaPct, isGain, recentMods, records, logs, imperialUnits }: any) {
  const now = new Date()
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  return (
    <View style={[P.poster, { width: POSTER_W, height: POSTER_H, backgroundColor: '#060e16' }]}>
      {/* Grid background */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={`h${i}`} style={[P.gridLine, { top: `${(i + 1) * 8}%`, width: '100%', height: 1 }]} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={`v${i}`} style={[P.gridLine, { left: `${(i + 1) * 16}%`, height: '100%', width: 1 }]} />
        ))}
      </View>

      <View style={P.v2Content}>
        {/* Header */}
        <View style={P.v2Header}>
          <Text style={P.v2HeaderTitle}>DYNOSYNC TELEMETRY EXPORT</Text>
          <Text style={P.v2HeaderDate}>{dateStr}</Text>
        </View>
        <View style={P.v2Divider} />

        {/* Vehicle data block */}
        <View style={P.v2DataBlock}>
          <Text style={P.v2DataRow}>
            <Text style={P.v2DataKey}>VEH  </Text>
            <Text style={P.v2DataVal}>: {vehicle?.year} {vehicle?.make} {vehicle?.model}</Text>
          </Text>
          {vehicle?.drivetrain && (
            <Text style={P.v2DataRow}>
              <Text style={P.v2DataKey}>DRV  </Text>
              <Text style={P.v2DataVal}>: {vehicle.drivetrain}</Text>
            </Text>
          )}
          <Text style={P.v2DataRow}>
            <Text style={P.v2DataKey}>RUNS </Text>
            <Text style={P.v2DataVal}>: {records?.length ?? 0}    </Text>
            <Text style={P.v2DataKey}>MODS</Text>
            <Text style={P.v2DataVal}>: {logs?.length ?? 0}</Text>
          </Text>
        </View>
        <View style={P.v2Divider} />

        {/* Peak power box */}
        <View style={P.v2PowerBox}>
          <Text style={P.v2PowerLabel}>PEAK POWER</Text>
          <Text style={P.v2PowerValue}>{current?.whp ?? baseline?.whp ?? '—'}</Text>
          <Text style={P.v2PowerUnit}>WHP</Text>
          {current?.torque_nm != null && (
            <Text style={P.v2TorqueText}>{formatTorqueValueOnly(current.torque_nm, imperialUnits)} {getTorqueUnit(imperialUnits).toUpperCase()} TORQUE</Text>
          )}
        </View>

        {/* Delta pulse box */}
        {whpDelta != null && whpDeltaPct != null && (
          <View style={[P.v2DeltaBox, { borderColor: isGain ? '#10b981' : '#ef4444' }]}>
            <View style={P.v2DeltaInner}>
              <Text style={[P.v2DeltaArrow, { color: isGain ? '#10b981' : '#ef4444' }]}>
                {isGain ? '▲' : '▼'}
              </Text>
              <Text style={[P.v2DeltaValue, { color: isGain ? '#10b981' : '#ef4444' }]}>
                DELTA {isGain ? '+' : ''}{whpDelta.toFixed(0)} WHP
              </Text>
            </View>
            <Text style={P.v2DeltaSub}>vs stock baseline  ·  {isGain ? '+' : ''}{whpDeltaPct?.toFixed(1)}%</Text>
          </View>
        )}

        {/* Ambient params */}
        <View style={P.v2AmbientRow}>
          <Text style={P.v2AmbientText}>AMB: 24°C  BOOST: 18.5 PSI  FUEL: 98RON  IAT: 31°C</Text>
        </View>
        <View style={P.v2Divider} />

        {/* Mod log */}
        {recentMods.length > 0 && (
          <View style={P.v2ModSection}>
            <Text style={P.v2ModTitle}>[MOD LOG]</Text>
            {recentMods.map((mod: any) => (
              <Text key={mod.id} style={P.v2ModRow} numberOfLines={1}>
                <Text style={{ color: CAT_COLOR[mod.category] ?? '#64748b' }}>{'> '}</Text>
                {mod.description}
              </Text>
            ))}
          </View>
        )}

        {/* Footer sticker */}
        <View style={P.v2FooterSticker}>
          <View style={P.v2FooterLeft}>
            <Text style={P.v2FooterUrl}>dynosync.co</Text>
            <Text style={P.v2FooterSub}>PERFORMANCE ARCHIVE</Text>
          </View>
          {/* Mini QR pattern */}
          <View style={P.qrBox}>
            {[
              [1, 1, 1, 0, 1], [1, 0, 1, 0, 1], [1, 1, 1, 1, 0], [0, 1, 0, 0, 1], [1, 0, 1, 1, 1],
            ].map((row, ri) => (
              <View key={ri} style={{ flexDirection: 'row' }}>
                {row.map((cell, ci) => (
                  <View key={ci} style={[P.qrCell, { backgroundColor: cell ? '#3ea8ff' : 'transparent' }]} />
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  )
}

// ─── 主屏 ─────────────────────────────────────────────────────────────────────
export default function SharePosterScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>()
  const viewShotRef = useRef<ViewShot>(null)
  const [style, setStyle] = useState<'v1' | 'v2'>('v1')
  const { imperialUnits } = useSettings()

  const { vehicles } = useVehicles()
  const { records } = useDynoRecords(vehicleId)
  const { logs } = useModLogs(vehicleId)

  const vehicle = vehicles.find(v => v.id === vehicleId)
  const sorted = [...records].sort((a, b) =>
    new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  )
  const baseline = sorted[0]
  const current = sorted[sorted.length - 1]
  const whpDelta = baseline && current && sorted.length >= 2 ? current.whp - baseline.whp : null
  const whpDeltaPct = whpDelta != null && baseline ? (whpDelta / baseline.whp) * 100 : null
  const isGain = (whpDelta ?? 0) >= 0
  const recentMods = [...logs]
    .sort((a, b) => new Date(b.installed_at).getTime() - new Date(a.installed_at).getTime())
    .slice(0, 3)

  const handleShare = async () => {
    try {
      const uri = await viewShotRef.current?.capture?.()
      if (!uri) { Alert.alert('Error', 'Could not capture poster'); return }
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share Build Card' })
      } else {
        Alert.alert('Sharing not available on this device')
      }
    } catch {
      Alert.alert('Error', 'Failed to share')
    }
  }

  const posterProps = { vehicle, current, baseline, whpDelta, whpDeltaPct, isGain, recentMods, records, logs, imperialUnits }

  return (
    <View style={S.root}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color="#3ea8ff" />
        </TouchableOpacity>
        <Text style={S.headerTitle}>BUILD CARD</Text>
        <View style={S.styleToggle}>
          <TouchableOpacity
            style={[S.styleChip, style === 'v1' && S.styleChipActive]}
            onPress={() => setStyle('v1')}
          >
            <Text style={[S.styleChipText, style === 'v1' && S.styleChipTextActive]}>V1</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[S.styleChip, style === 'v2' && S.styleChipActive]}
            onPress={() => setStyle('v2')}
          >
            <Text style={[S.styleChipText, style === 'v2' && S.styleChipTextActive]}>V2</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Poster preview */}
      <View style={S.posterWrapper}>
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
          {style === 'v1'
            ? <PosterV1 {...posterProps} />
            : <PosterV2 {...posterProps} />
          }
        </ViewShot>
      </View>

      {/* Share CTA */}
      <View style={S.shareBar}>
        <TouchableOpacity style={S.shareBtn} onPress={handleShare} activeOpacity={0.85}>
          <MaterialIcons name="ios-share" size={20} color="#fff" />
          <Text style={S.shareBtnText}>SHARE BUILD CARD</Text>
        </TouchableOpacity>
        <Text style={S.shareHint}>
          {style === 'v1' ? 'Racing Style · Instagram Stories' : 'Telemetry Style · Forums & Reddit'}
        </Text>
      </View>
    </View>
  )
}

// ─── Shared poster styles ─────────────────────────────────────────────────────
const P = StyleSheet.create({
  poster: { borderRadius: 16, overflow: 'hidden', justifyContent: 'space-between' },

  // V1 shared
  v1Top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#3ea8ff' },
  brandText: { color: '#3ea8ff', fontSize: 11, fontWeight: '800', letterSpacing: 3 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: '#10b981', borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  verifiedText: { color: '#10b981', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },

  v1VehicleSection: { paddingHorizontal: 20, paddingBottom: 4 },
  v1VehicleName: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  v1VehicleModel: { color: '#8ba3b8', fontSize: 14, fontWeight: '600', marginTop: 2 },
  driveChip: {
    marginTop: 6, alignSelf: 'flex-start',
    backgroundColor: 'rgba(62,168,255,0.15)', borderWidth: 1, borderColor: 'rgba(62,168,255,0.3)',
    borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3,
  },
  driveChipText: { color: '#3ea8ff', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },

  v1WhpSection: { alignItems: 'center', paddingVertical: 4 },
  v1WhpLabel: { color: '#4a6480', fontSize: 9, fontWeight: '800', letterSpacing: 3, marginBottom: 2 },
  v1WhpValue: {
    color: '#fff', fontSize: 88, fontWeight: '900', lineHeight: 96, letterSpacing: -4,
    textShadowColor: '#3ea8ff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  v1WhpUnit: { color: '#3ea8ff', fontSize: 20, fontWeight: '800', letterSpacing: 2, marginTop: -6 },
  v1TorqueText: { color: '#8ba3b8', fontSize: 12, fontWeight: '600', marginTop: 4 },
  tachoRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 10, height: 20 },
  tachoTick: { width: 3, borderRadius: 2 },

  deltaBadge: {
    alignSelf: 'center', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    flexDirection: 'row', alignItems: 'center', gap: 4, marginVertical: 4,
  },
  deltaText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  deltaSubText: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '600', marginLeft: 4 },

  v1Bottom: { padding: 16, paddingTop: 8 },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10,
    paddingVertical: 10, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  statItem: { alignItems: 'center' },
  statVal: { color: '#fff', fontSize: 16, fontWeight: '900' },
  statLabel: { color: '#4a6480', fontSize: 8, fontWeight: '700', letterSpacing: 1.5, marginTop: 2 },

  modsSection: { marginBottom: 12 },
  modsTitle: { color: '#4a6480', fontSize: 8, fontWeight: '800', letterSpacing: 2, marginBottom: 6 },
  modRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 },
  modDot: { width: 5, height: 5, borderRadius: 3 },
  modText: { color: '#8ba3b8', fontSize: 11, fontWeight: '500', flex: 1 },

  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', paddingTop: 10 },
  footerUrl: { color: '#3ea8ff', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  footerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  footerYear: { color: '#2a3f55', fontSize: 9, fontWeight: '600' },

  // V2 shared
  gridLine: { position: 'absolute', backgroundColor: 'rgba(62,168,255,0.06)' },
  v2Content: { flex: 1, padding: 18, justifyContent: 'space-between' },
  v2Header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  v2HeaderTitle: { color: '#3ea8ff', fontSize: 9, fontWeight: '800', letterSpacing: 2 },
  v2HeaderDate: { color: '#2a3f55', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  v2Divider: { height: 1, backgroundColor: 'rgba(62,168,255,0.25)', marginVertical: 8 },

  v2DataBlock: { marginBottom: 4 },
  v2DataRow: { fontSize: 11, marginBottom: 3, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  v2DataKey: { color: '#4a6480' },
  v2DataVal: { color: '#aac4de' },

  v2PowerBox: {
    borderWidth: 1, borderColor: 'rgba(62,168,255,0.4)', borderRadius: 8,
    padding: 12, alignItems: 'center', marginVertical: 4,
    backgroundColor: 'rgba(62,168,255,0.04)',
  },
  v2PowerLabel: { color: '#4a6480', fontSize: 8, fontWeight: '800', letterSpacing: 3, marginBottom: 4 },
  v2PowerValue: {
    color: '#fff', fontSize: 64, fontWeight: '900', letterSpacing: -3,
    textShadowColor: '#3ea8ff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12,
  },
  v2PowerUnit: { color: '#3ea8ff', fontSize: 16, fontWeight: '800', letterSpacing: 2, marginTop: -4 },
  v2TorqueText: { color: '#4a6480', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginTop: 4 },

  v2DeltaBox: {
    borderWidth: 1.5, borderRadius: 8, padding: 10, marginVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  v2DeltaInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  v2DeltaArrow: { fontSize: 18, fontWeight: '900' },
  v2DeltaValue: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  v2DeltaSub: { color: '#4a6480', fontSize: 9, marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  v2AmbientRow: { marginVertical: 4 },
  v2AmbientText: {
    color: '#4a6480', fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 0.5,
  },

  v2ModSection: { marginVertical: 4 },
  v2ModTitle: { color: '#3ea8ff', fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: 5 },
  v2ModRow: { color: '#8ba3b8', fontSize: 10, marginBottom: 3, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  v2FooterSticker: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: 'rgba(62,168,255,0.2)', paddingTop: 10,
  },
  v2FooterLeft: {},
  v2FooterUrl: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  v2FooterSub: { color: '#2a3f55', fontSize: 8, fontWeight: '700', letterSpacing: 2, marginTop: 2 },
  qrBox: { gap: 2 },
  qrCell: { width: 6, height: 6, margin: 1 },
})

// ─── Screen styles ────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060e16' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#1c2e40',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 2 },
  styleToggle: { flexDirection: 'row', gap: 6 },
  styleChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: '#1c2e40', backgroundColor: '#0d1f30',
  },
  styleChipActive: { borderColor: '#3ea8ff', backgroundColor: 'rgba(62,168,255,0.15)' },
  styleChipText: { color: '#4a6480', fontSize: 12, fontWeight: '800' },
  styleChipTextActive: { color: '#3ea8ff' },

  posterWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },

  shareBar: {
    backgroundColor: '#060e16',
    borderTopWidth: 1, borderTopColor: '#1c2e40',
    paddingHorizontal: 20, paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 16,
    alignItems: 'center',
  },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#258cf4', borderRadius: 14,
    paddingVertical: 14, width: '100%', marginBottom: 8,
  },
  shareBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
  shareHint: { color: '#2a3f55', fontSize: 11 },
})
