import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Easing, Image, Platform, ActivityIndicator, Modal,
  FlatList, Alert, Linking
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { router } from 'expo-router'
import { MaterialIcons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons'
import { useVehicles } from '../../hooks/useVehicles'
import { useDynoRecords } from '../../hooks/useDynoRecords'
import { useCalibration } from '../../hooks/useCalibration'
import { useSettings } from '../../hooks/useSettings'
import { formatTorque, getTorqueUnit } from '../../lib/units'
import { api, Vehicle, AiAdvisorResult } from '../../lib/api'
import { useActiveVehicle } from '../../hooks/useActiveVehicle'
import { useTierLimits } from '../../hooks/useTierLimits'
import { VehiclePlaceholderThumb } from '../../lib/vehicleImage'

// ─── Neural Glow Animation ────────────────────────────────────────────────────
function NeuralPulse({ children }: { children: React.ReactNode }) {
  const pulse = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  const glow = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  })

  return (
    <Animated.View style={{ opacity: glow }}>
      {children}
    </Animated.View>
  )
}

// ─── AI Lab Screen ────────────────────────────────────────────────────────────
export default function AiLabScreen() {
  const { vehicles, loading: vLoading } = useVehicles()
  const { activeVehicleId, setActiveVehicleId } = useActiveVehicle()
  const { tier, limits } = useTierLimits()
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)

  const activeVehicle = selectedVehicleId
    ? vehicles.find(v => v.id === selectedVehicleId)
    : (activeVehicleId ? vehicles.find(v => v.id === activeVehicleId) : vehicles.find(v => !v.is_archived))

  useEffect(() => {
    if (selectedVehicleId && !vehicles.find(v => v.id === selectedVehicleId)) {
      setSelectedVehicleId(null)
    }
  }, [vehicles])

  useEffect(() => {
    if (selectedVehicleId) setActiveVehicleId(selectedVehicleId)
  }, [selectedVehicleId])

  const dyno = useDynoRecords(activeVehicle?.id || '')

  const [advisor, setAdvisor] = useState<AiAdvisorResult | null>(null)
  const [aLoading, setALoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSelector, setShowSelector] = useState(false)
  const [showCalibration, setShowCalibration] = useState(false)
  const [showVisual, setShowVisual] = useState(false)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [limitModalData, setLimitModalData] = useState<{ title: string, message: string }>({ title: '', message: '' })

  const { bias, depth, filter, setBias, setDepth, setFilter } = useCalibration()
  const { imperialUnits } = useSettings()

  const scanPulse = useRef(new Animated.Value(0)).current
  const animOpacity = useRef(new Animated.Value(0)).current

  const fetchAdvice = async (force = false) => {
    if (!activeVehicle || dyno.records.length === 0) return
    setALoading(true)
    setErrorMsg(null)
    setShowVisual(true)
    Animated.timing(animOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start()

    try {
      const res = await api.ai.getAdvisor({
        whp: dyno.records[0].whp,
        torque: dyno.records[0].torque_nm || 0,
        torqueUnit: getTorqueUnit(imperialUnits),
        forceRefresh: force,
        vehicle: {
          ...activeVehicle,
          status: activeVehicle.status || 'Stock',
          mods: [
            ...(activeVehicle.mods || []),
            ...(activeVehicle.trim ? [activeVehicle.trim] : []),
          ]
        } as Vehicle,
        calibration: { bias, depth, filter }
      })
      setAdvisor(res)


      // Keep "SYNC COMPLETE" visible for 2.5s
      setTimeout(() => {
        Animated.timing(animOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true
        }).start(() => setShowVisual(false))
      }, 2500)

    } catch (e: any) {
      const resData = e.response?.data
      const details = resData?.details || e.message
      const errHeader = resData?.error || 'Analysis Failed'

      // Handle AI Rate Limited (429) — show friendly alert
      if (errHeader === 'AI_RATE_LIMITED') {
        const retryAfter = resData?.retryAfter || 60
        Alert.alert(
          'Request Too Frequent',
          `You're sending requests too quickly. Please wait ${retryAfter} seconds before trying again.`
        )
        // Handle AI Limit Reached — show custom modal
      } else if (errHeader === 'AI_LIMIT_REACHED') {
        const isPro = tier === 'pro'
        setLimitModalData({
          title: isPro ? 'Pro Limit Reached' : 'AI Limit Reached',
          message: isPro
            ? `You have reached your monthly Pro limit of ${limits.aiCreditsPerMonth} AI tuning insights. Your credits will reset at the start of your next billing cycle.`
            : 'You have reached your limit of 3 free AI tuning insights for this month. Upgrade to PRO for 100 deep reasoning analytics and unlimited priority access.'
        })
        setShowLimitModal(true)
        // Don't set errorMsg — keep existing advisor result visible if any
      } else {
        setErrorMsg(`${errHeader}: ${details}`)
      }
      setShowVisual(false) // Hide on error
    } finally {
      setALoading(false)
    }
  }

  const handleCopy = () => {
    if (advisor?.advice) {
      Clipboard.setStringAsync(advisor.advice)
      Alert.alert('Analysis Copied', 'The neural advisor results have been copied to your clipboard.')
    }
  }

  const handleShop = () => {
    if (!activeVehicle || !advisor?.suggestion) return
    const query = `${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model} ${advisor.suggestion.title} performance parts`
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open browser for parts search.')
    })
  }

  // Auto-load cached analysis on vehicle switch
  useEffect(() => {
    if (activeVehicle?.last_advisor_result) {
      setAdvisor(activeVehicle.last_advisor_result)
      setErrorMsg(null)
    } else {
      setAdvisor(null)
    }
  }, [activeVehicle?.id])

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(scanPulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  const scanLinePos = scanPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120],
  })


  const nonArchivedVehicles = vehicles.filter(v => !v.is_archived)
  const isGarageEffectivelyEmpty = vehicles.length === 0 || nonArchivedVehicles.length === 0

  if (vLoading && vehicles.length === 0) return <View style={S.center}><ActivityIndicator color="#3ea8ff" /></View>

  if (!vLoading && isGarageEffectivelyEmpty) {
    return (
      <View style={S.root}>
        {/* Header */}
        <View style={S.header}>
          <View style={S.headerIcon}>
            <MaterialCommunityIcons name="brain" size={28} color="#258cf4" />
          </View>
          <Text style={S.headerTitle}>Neural Advisor</Text>
        </View>

        <View style={[S.center, { padding: 40, flex: 1 }]}>
          <View style={S.emptyIconContainer}>
            <MaterialCommunityIcons name="garage-variant" size={80} color="#1c2e40" />
            <View style={S.emptyOverlayIcon}>
              <MaterialIcons name="psychology" size={32} color="#258cf4" />
            </View>
          </View>
          <Text style={S.emptyTitle}>Your Garage is Empty</Text>
          <Text style={S.emptySub}>The Neural Advisor needs vehicle data to analyze performance and suggest optimizations.</Text>

          <TouchableOpacity
            style={S.mainAction}
            onPress={() => router.push('/add-vehicle')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add-circle-outline" size={20} color="#fff" />
            <Text style={S.mainActionText}>ADD YOUR FIRST VEHICLE</Text>
          </TouchableOpacity>
        </View>
      </View >
    )
  }

  return (
    <View style={S.root}>
      {/* Header */}
      <View style={S.header}>
        <View style={S.headerIcon}>
          <MaterialCommunityIcons name="brain" size={28} color="#258cf4" />
        </View>
        <Text style={S.headerTitle}>Neural Advisor</Text>
        <TouchableOpacity
          style={S.settingsBtn}
          onPress={() => setShowCalibration(true)}
        >
          <MaterialIcons name="tune" size={20} color={showCalibration ? C.blue : "#64748b"} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Car Identity (Clickable to change) */}
        {activeVehicle ? (
          <View style={{ marginBottom: 20 }}>
            <TouchableOpacity
              style={S.identityCard}
              onPress={() => setShowSelector(true)}
              activeOpacity={0.7}
            >
              <View style={S.carThumb}>
                {activeVehicle.image_url ? (
                  <Image source={{ uri: activeVehicle.image_url }} style={S.carImg} />
                ) : (
                  <VehiclePlaceholderThumb make={activeVehicle.make} model={activeVehicle.model} />
                )}
              </View>
              <View style={S.identityInfo}>
                <View style={S.carHeaderRow}>
                  <Text style={S.carName} numberOfLines={1}>{activeVehicle.year} {activeVehicle.make} {activeVehicle.model}</Text>
                  <MaterialIcons name="swap-horiz" size={16} color="#258cf4" />
                </View>
                <Text style={S.carStatus}>{activeVehicle.status || 'Stock'}</Text>
                <View style={S.statRow}>
                  <View style={S.miniBadge}><Text style={S.miniBadgeText}>{dyno.records[0]?.whp || '---'} WHP</Text></View>
                  <View style={[S.miniBadge, { borderColor: '#bc13fe30' }]}>
                    <Text style={[S.miniBadgeText, { color: '#bc13fe' }]}>{formatTorque(dyno.records[0]?.torque_nm, imperialUnits)}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* NEW: Prominent Primary Action Button */}
            <TouchableOpacity
              style={[S.primaryRunBtn, (aLoading || dyno.records.length === 0) && S.disabledBtn]}
              onPress={() => fetchAdvice(true)}
              disabled={aLoading || dyno.records.length === 0}
              activeOpacity={0.8}
            >
              <NeuralPulse>
                <MaterialCommunityIcons name="brain" size={20} color="#fff" />
              </NeuralPulse>
              <Text style={S.primaryRunBtnText}>
                {aLoading ? 'NEURAL SYNCING...' : 'RUN PERFORMANCE ANALYSIS'}
              </Text>
              <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={S.identityCard} onPress={() => setShowSelector(true)}>
            <Text style={{ color: '#4a6480', fontStyle: 'italic' }}>Select a vehicle from your garage</Text>
          </TouchableOpacity>
        )}

        {/* Neural Analysis Section */}
        <View style={S.analysisCard}>
          {/* Glow Decors */}
          <View style={[S.glowDecor, { top: -20, right: -20, backgroundColor: '#00f2ff20' }]} />
          <View style={[S.glowDecor, { bottom: -20, left: -20, backgroundColor: '#bc13fe20' }]} />

          <TouchableOpacity
            style={S.analysisHeader}
            activeOpacity={0.7}
            onPress={() => advisor && setIsExpanded(!isExpanded)}
          >
            <View style={S.analysisIconWrap}>
              <MaterialCommunityIcons name="lightning-bolt" size={20} color="#00f2ff" />
            </View>

            <View style={S.analysisTitleGroup}>
              <View style={S.titleWithBadge}>
                <Text style={S.analysisTitle} numberOfLines={1}>
                  {!activeVehicle ? 'No Car detected' : aLoading ? 'Analyzing...' : 'Performance Analysis'}
                </Text>
              </View>
              <View style={S.analysisSubRow}>
                <Text style={S.liveText}>LIVE NEURAL SYNC</Text>
                {advisor?.note && (
                  <View style={S.fallbackBadge}>
                    <Text style={S.fallbackBadgeText}>OPTIMIZED</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={S.headerActions}>
              {advisor && (
                <TouchableOpacity onPress={handleCopy} style={S.iconActionBtn}>
                  <MaterialCommunityIcons name="content-copy" size={18} color="#64748b" />
                </TouchableOpacity>
              )}
              <View style={S.toggleActionBtn}>
                <MaterialIcons
                  name={isExpanded ? "expand-less" : "expand-more"}
                  size={24}
                  color="#00f2ff"
                />
              </View>
            </View>
          </TouchableOpacity>

          {/* Neural Analysis Visual */}
          {(aLoading || showVisual) && (
            <Animated.View style={[S.visualArea, { opacity: animOpacity }]}>
              <View style={S.graphMock}>
                <View style={[S.curve, { bottom: '20%', width: '100%', height: 2, backgroundColor: '#258cf440', transform: [{ rotate: '-10deg' }] }]} />
                <View style={[S.curve, { bottom: '30%', width: '90%', height: 2, backgroundColor: '#00f2ff60', transform: [{ rotate: '-15deg' }] }]} />
              </View>

              <View style={StyleSheet.absoluteFill}>
                <Animated.View style={[S.scanLine, { transform: [{ translateY: scanLinePos }] }]} />
              </View>

              <View style={S.visualOverlay}>
                <NeuralPulse>
                  <MaterialCommunityIcons
                    name={aLoading ? "loading" : "chart-bell-curve-cumulative"}
                    size={32} color="#00f2ff"
                  />
                </NeuralPulse>
                <Text style={S.visualText}>
                  {aLoading ? 'UPDATING DIAGNOSTICS...' : 'DIAGNOSTIC SYNC COMPLETE'}
                </Text>
              </View>
            </Animated.View>
          )}

          <View style={[S.insightRow, { marginBottom: isExpanded ? 24 : 12 }]}>
            <MaterialIcons name="info-outline" size={16} color="#bc13fe" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text
                key={isExpanded ? 'expanded' : 'collapsed'}
                style={S.insightText}
                numberOfLines={isExpanded ? undefined : 4}
              >
                {advisor ? advisor?.advice : 'Scanning your latest dyno records for potential bottlenecks...'}
              </Text>
              {advisor?.advice && advisor.advice.length > 150 && (
                <TouchableOpacity
                  onPress={() => setIsExpanded(!isExpanded)}
                  style={S.expandBtn}
                >
                  <Text style={S.expandBtnText}>{isExpanded ? 'Show Less' : 'Read Full Analysis'}</Text>
                  <MaterialIcons name={isExpanded ? "expand-less" : "expand-more"} size={16} color="#258cf4" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {advisor?.note && (
            <View style={S.noteRow}>
              <MaterialIcons name="tips-and-updates" size={14} color="#64748b" />
              <Text style={S.noteText}>{advisor.note}</Text>
            </View>
          )}

          <TouchableOpacity
            style={S.fullCompareBtn}
            onPress={() => router.push({
              pathname: '/advisor-history',
              params: { vehicleId: activeVehicle?.id }
            })}
          >
            <Text style={S.fullCompareText}>View Neural Analysis History</Text>
          </TouchableOpacity>
        </View>

        {/* AI Suggestion */}
        <Text style={S.sectionLabel}>AI SUGGESTION</Text>

        {errorMsg ? (
          <View style={S.suggestionCard}>
            <View style={{ padding: 16, alignItems: 'center' }}>
              <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#ff4b4b" />
              <Text style={{ color: '#ff4b4b', fontWeight: '600', marginTop: 8 }}>Diagnostic Error</Text>
              <Text style={{ color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 4 }}>{errorMsg}</Text>
              <TouchableOpacity onPress={() => fetchAdvice(true)} style={{ marginTop: 12, padding: 8, backgroundColor: 'rgba(255,75,75,0.1)', borderRadius: 8 }}>
                <Text style={{ color: '#ff4b4b', fontSize: 12, fontWeight: 'bold' }}>RETRY SYNC</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : advisor ? (
          <View style={S.suggestionCard}>
            <View style={S.sugHeader}>
              <View style={{ flex: 1, flexShrink: 1, marginRight: 12 }}>
                <Text style={S.sugTag}>RECOMMENDED NEXT</Text>
                <Text style={S.sugTitle}>{advisor?.suggestion?.title}</Text>
              </View>
              <View style={[S.idBadge, { flexShrink: 0 }]}>
                <Text style={S.idBadgeText}>{advisor?.suggestion?.category}</Text>
              </View>
            </View>

            <View style={S.gainGrid}>
              <View style={S.gainItem}>
                <Text style={S.gainLabel}>Est. Power Gain</Text>
                <Text style={S.gainValue}>{advisor?.suggestion?.gain}</Text>
              </View>
              <View style={S.gainItem}>
                <Text style={S.gainLabel}>Difficulty Level</Text>
                <Text style={[S.gainValue, { color: '#bc13fe', fontSize: 14 }]}>{advisor?.suggestion?.difficulty}</Text>
              </View>
            </View>

            <TouchableOpacity style={S.shopBtn} onPress={handleShop} activeOpacity={0.8}>
              <MaterialIcons name="shopping-cart" size={16} color="#fff" />
              <Text style={S.shopBtnText}>Shop Performance Parts</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={S.suggestionCard}>
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              {aLoading ? (
                <>
                  <ActivityIndicator color="#258cf4" />
                  <Text style={{ color: '#64748b', marginTop: 10, fontSize: 12 }}>Calculating optimal mod path...</Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="psychology" size={48} color="#1c2e40" />
                  <Text style={{ color: '#64748b', marginTop: 10, fontSize: 12, textAlign: 'center' }}>
                    {!activeVehicle
                      ? 'Select a vehicle to unlock suggestions'
                      : 'Analyze performance to see suggestions'}
                  </Text>
                </>
              )}
            </View>
          </View>
        )}

        {/* Limit Reached Modal */}
        <Modal
          visible={showLimitModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLimitModal(false)}
        >
          <View style={S.limitModalOverlay}>
            <Animated.View style={S.limitModal}>
              <View style={S.limitIconContainer}>
                <MaterialCommunityIcons name="lightning-bolt" size={32} color={C.blue} />
              </View>

              <Text style={S.limitTitle}>{limitModalData.title}</Text>
              <Text style={S.limitMessage}>{limitModalData.message}</Text>

              <View style={S.limitActions}>
                {tier !== 'pro' && (
                  <TouchableOpacity
                    style={S.upgradeActionBtn}
                    onPress={() => {
                      setShowLimitModal(false)
                      router.push('/subscription')
                    }}
                  >
                    <Text style={S.upgradeActionText}>UPGRADE TO PRO</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[S.gotItBtn, tier === 'pro' ? { width: '100%' } : {}]}
                  onPress={() => setShowLimitModal(false)}
                >
                  <Text style={S.gotItText}>Got it</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </ScrollView>



      {/* Vehicle Selector Modal */}
      <Modal visible={showSelector} transparent animationType="slide">
        <View style={S.modalOverlay}>
          <View style={S.modalContent}>
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>Select Vehicle</Text>
              <TouchableOpacity onPress={() => setShowSelector(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={vehicles.filter(v => !v.is_archived)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[S.vehicleOption, item.id === activeVehicle?.id && S.vehicleOptionActive]}
                  onPress={() => {
                    setSelectedVehicleId(item.id)
                    setShowSelector(false)
                  }}
                >
                  <MaterialIcons
                    name="directions-car"
                    size={24}
                    color={item.id === activeVehicle?.id ? "#258cf4" : "#4a6480"}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[S.vehicleOptionName, item.id === activeVehicle?.id && { color: '#fff' }]}>
                      {item.year} {item.make} {item.model}
                    </Text>
                    <Text style={S.vehicleOptionSub}>{item.trim || 'Standard Trim'}</Text>
                  </View>
                  {item.id === activeVehicle?.id && (
                    <MaterialIcons name="check-circle" size={20} color="#258cf4" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Neural Calibration Modal */}
      <Modal visible={showCalibration} transparent animationType="fade" onRequestClose={() => setShowCalibration(false)}>
        <View style={S.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowCalibration(false)} />
          <View style={[S.modalContent, { backgroundColor: '#0d1f30' }]}>
            <View style={S.modalHeader}>
              <View>
                <Text style={S.modalTitle}>NEURAL CALIBRATION</Text>
                <Text style={{ color: '#4a6480', fontSize: 11, fontWeight: '700', marginTop: 4 }}>FINE-TUNE ADVISOR LOGIC</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCalibration(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Diagnostic Bias */}
              <View style={S.calibrationSection}>
                <Text style={S.calibrationLabel}>⚡ DIAGNOSTIC BIAS</Text>
                <View style={S.calibrationGrid}>
                  {(['reliability', 'balanced', 'performance'] as const).map(b => (
                    <TouchableOpacity
                      key={b}
                      style={[S.calibrationOption, bias === b && S.calibrationOptionActive]}
                      onPress={() => setBias(b)}
                    >
                      <Text style={[S.calibrationOptionText, bias === b && S.calibrationOptionTextActive]}>
                        {b.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={S.calibrationHint}>
                  {bias === 'reliability' && 'Prioritizes engine safety and long-term durability.'}
                  {bias === 'balanced' && 'Optimal mix of performance gains and safe tolerances.'}
                  {bias === 'performance' && 'Aggressive tuning logic for maximum power output.'}
                </Text>
              </View>

              {/* Reasoning Depth */}
              <View style={S.calibrationSection}>
                <Text style={S.calibrationLabel}>🔍 REASONING DEPTH</Text>
                <View style={S.calibrationGrid}>
                  {(['quick', 'deep'] as const).map(d => (
                    <TouchableOpacity
                      key={d}
                      style={[S.calibrationOption, depth === d && S.calibrationOptionActive]}
                      onPress={() => setDepth(d)}
                    >
                      <Text style={[S.calibrationOptionText, depth === d && S.calibrationOptionTextActive]}>
                        {d === 'quick' ? 'QUICK SCAN' : 'DEEP REASONING'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={S.calibrationHint}>
                  {depth === 'quick' && 'Flash inference for immediate performance feedback.'}
                  {depth === 'deep' && 'High-fidelity analysis for complex mechanical tracing.'}
                </Text>
              </View>

              {/* Noise Filter */}
              <View style={S.calibrationSection}>
                <Text style={S.calibrationLabel}>📊 DATA NOISE FILTER</Text>
                <View style={[S.calibrationGrid, { gap: 8 }]}>
                  {(['low', 'med', 'high'] as const).map(f => (
                    <TouchableOpacity
                      key={f}
                      style={[S.calibrationOption, filter === f && S.calibrationOptionActive]}
                      onPress={() => setFilter(f)}
                    >
                      <Text style={[S.calibrationOptionText, filter === f && S.calibrationOptionTextActive]}>
                        {f.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[S.mainAction, { marginTop: 20, marginBottom: 10, borderColor: C.blue }]}
                onPress={() => {
                  setShowCalibration(false);
                  fetchAdvice(true);
                }}
              >
                <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
                <Text style={S.mainActionText}>APPLY & RE-ANALYZE</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const C = {
  bg: '#101922',
  surface: '#1a2632',
  blue: '#258cf4',
  cyan: '#00f2ff',
  violet: '#bc13fe',
  text: '#fff',
  muted: '#64748b'
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 15,
    backgroundColor: C.bg, gap: 12
  },
  headerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1c2e40', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: C.text, fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' },
  settingsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1c2e40', alignItems: 'center', justifyContent: 'center' },

  scrollContent: { padding: 16, paddingBottom: 60 },

  identityCard: {
    flexDirection: 'row', gap: 16, padding: 12, borderRadius: 16,
    borderWidth: 1, borderColor: '#258cf420', backgroundColor: '#0d1f3050',
    alignItems: 'center', marginBottom: 20
  },
  carThumb: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#1a2a3a', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  carImg: { width: '100%', height: '100%' },
  identityInfo: { flex: 1 },
  carName: { color: C.text, fontSize: 18, fontWeight: '800' },
  carStatus: { color: C.blue, fontSize: 12, fontWeight: '600', marginTop: 2 },
  statRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  miniBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#00f2ff30', backgroundColor: '#00f2ff05' },
  miniBadgeText: { color: C.cyan, fontSize: 10, fontWeight: '800' },

  primaryRunBtn: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 18,
    backgroundColor: '#258cf4', borderRadius: 16, paddingHorizontal: 20,
    gap: 12, shadowColor: '#258cf4', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 15, elevation: 8
  },
  primaryRunBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', flex: 1, letterSpacing: 0.5 },
  disabledBtn: { backgroundColor: '#1c2e40', opacity: 0.7, shadowOpacity: 0 },

  analysisCard: {
    backgroundColor: '#0d1f30', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#00f2ff20', overflow: 'hidden',
    shadowColor: '#00f2ff', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20,
  },
  glowDecor: { position: 'absolute', width: 100, height: 100, borderRadius: 50, opacity: 0.5 },

  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12
  },
  analysisIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#00f2ff10', alignItems: 'center', justifyContent: 'center' },
  analysisTitleGroup: { flex: 1 },
  analysisSubRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveText: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5
  },
  analysisTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  iconActionBtn: {
    padding: 8,
  },
  toggleActionBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#00f2ff10', alignItems: 'center', justifyContent: 'center',
    marginLeft: 4
  },
  fallbackBadge: {
    paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#bc13fe15', borderRadius: 4
  },
  fallbackBadgeText: { color: '#bc13fe', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  headerCollapseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,242,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6
  },
  headerCollapseText: { color: C.cyan, fontSize: 11, fontWeight: '900' },

  visualArea: {
    height: 120, backgroundColor: '#050a0f', borderRadius: 12,
    marginBottom: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center'
  },
  graphMock: { ...StyleSheet.absoluteFillObject, opacity: 0.4 },
  curve: { position: 'absolute' },
  scanLine: { width: '100%', height: 2, backgroundColor: C.blue, shadowColor: C.blue, shadowRadius: 10, shadowOpacity: 0.8 },
  visualOverlay: { alignItems: 'center', gap: 8 },
  visualText: { color: C.cyan, fontSize: 9, fontWeight: '700', letterSpacing: 1 },

  insightRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  insightText: { color: '#8ba3b8', fontSize: 13, lineHeight: 19, paddingBottom: 4 },

  fullCompareBtn: { paddingVertical: 12, backgroundColor: '#258cf410', borderWidth: 1, borderColor: '#258cf430', borderRadius: 10, alignItems: 'center' },
  fullCompareText: { color: C.blue, fontSize: 13, fontWeight: '700' },

  sectionLabel: { color: C.text, fontSize: 15, fontWeight: '800', marginTop: 32, marginBottom: 12, marginLeft: 4 },

  suggestionCard: { backgroundColor: C.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1c2e40' },
  sugHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  sugTag: { color: C.blue, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  sugTitle: { color: C.text, fontSize: 18, fontWeight: '800' },
  idBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: '#1c2e40', flexShrink: 0 },
  idBadgeText: { color: C.muted, fontSize: 9, fontWeight: '700' },

  gainGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  gainItem: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#050a0f', borderWidth: 1, borderColor: '#1c2e40' },
  gainLabel: { color: C.muted, fontSize: 10, marginBottom: 4 },
  gainValue: { color: C.cyan, fontSize: 17, fontWeight: '800' },

  progressGroup: { marginBottom: 24 },
  progLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progLabel: { color: C.muted, fontSize: 11 },
  progVal: { color: C.text, fontSize: 11, fontWeight: '600' },
  progTrack: { height: 6, backgroundColor: '#050a0f', borderRadius: 3, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 3 },

  shopBtn: {
    flexDirection: 'row', paddingVertical: 14, backgroundColor: C.blue,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: C.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  shopBtnText: { color: '#fff', fontSize: 13, fontWeight: '700', marginLeft: 6 },

  // Limit Modal Styles
  limitModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  limitModal: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: 'rgba(37, 140, 244, 0.3)',
    alignItems: 'center',
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  limitIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(37, 140, 244, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  limitTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  limitMessage: {
    color: '#94a3b8',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  limitActions: {
    width: '100%',
    gap: 12,
  },
  upgradeActionBtn: {
    backgroundColor: C.blue,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  upgradeActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  gotItBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gotItText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'rgba(16,25,34,0.9)'
  },
  mainAction: {
    flexDirection: 'row', paddingVertical: 16, backgroundColor: '#1c2e40',
    borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1, borderColor: '#258cf450'
  },
  mainActionText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // --- New Styles ---
  carHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  expandBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  expandBtnText: { color: C.blue, fontSize: 12, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderColor: '#258cf430'
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#1c2e4030',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  vehicleOptionActive: {
    backgroundColor: '#258cf420',
    borderColor: '#258cf440'
  },
  vehicleOptionName: { color: '#64748b', fontSize: 16, fontWeight: '700' },
  vehicleOptionSub: { color: '#4a6480', fontSize: 12, marginTop: 2 },

  // --- Calibration Styles ---
  calibrationSection: { marginBottom: 24 },
  calibrationLabel: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  calibrationGrid: { flexDirection: 'row', gap: 10 },
  calibrationOption: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#1c2e4050', borderWidth: 1, borderColor: '#258cf420',
    alignItems: 'center'
  },
  calibrationOptionActive: { backgroundColor: '#258cf420', borderColor: '#258cf4' },
  calibrationOptionText: { color: '#64748b', fontSize: 10, fontWeight: '800' },
  calibrationOptionTextActive: { color: '#fff' },
  calibrationHint: { color: '#4a6480', fontSize: 11, marginTop: 10, lineHeight: 16 },

  // --- Empty State Styles ---
  emptyIconContainer: { position: 'relative', marginBottom: 24 },
  emptyOverlayIcon: {
    position: 'absolute', bottom: -5, right: -5,
    backgroundColor: '#0d1f30', borderRadius: 20, padding: 4
  },
  emptyTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  emptySub: { color: '#64748b', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 },

  // --- Fallback UI ---
  noteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 16, paddingHorizontal: 4, opacity: 0.8
  },
  noteText: { color: '#64748b', fontSize: 11, fontStyle: 'italic', flex: 1 }
})
