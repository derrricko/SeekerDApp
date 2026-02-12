import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, Easing, StyleSheet, Text, View} from 'react-native';
import GlassCard from '../../components/GlassCard';
import {useTheme, Typography} from '../../components/theme';
import ArtworkFrame from './ArtworkFrame';

interface JourneyVisualProps {
  visualId: string;
  isVisible: boolean;
}

export default function JourneyVisual({
  visualId,
  isVisible,
}: JourneyVisualProps) {
  switch (visualId) {
    case 'neighbor':
      return <NeighborVisual isVisible={isVisible} />;
    case 'mom':
      return <MomVisual isVisible={isVisible} />;
    case 'notice':
      return <NoticeVisual isVisible={isVisible} />;
    case 'knew':
      return <KnewVisual isVisible={isVisible} />;
    case 'turn':
      return <TurnVisual isVisible={isVisible} />;
    case 'direct':
      return <DirectVisual isVisible={isVisible} />;
    case 'proof':
      return <ProofVisual isVisible={isVisible} />;
    case 'hero':
      return <ArtworkFrame isVisible={isVisible} />;
    case 'impact':
      return <ImpactVisual isVisible={isVisible} />;
    case 'story':
      return <StoryVisual />;
    case 'invitation':
      return <InvitationVisual isVisible={isVisible} />;
    default:
      return null;
  }
}

// ─── Slide 1: "Your Neighbor" ──────────────────────────────────
// Concentric circles radiating outward — proximity, closeness, "right here"
function NeighborVisual({isVisible}: {isVisible: boolean}) {
  const {colors} = useTheme();
  const ring0 = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const rings = useMemo(() => [ring0, ring1, ring2], [ring0, ring1, ring2]);
  const centerOpacity = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isVisible && !hasAnimated.current) {
      hasAnimated.current = true;
      // Center dot appears first
      Animated.timing(centerOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      // Rings ripple outward
      rings.forEach((ring, i) => {
        setTimeout(() => {
          Animated.timing(ring, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }, 300 + i * 200);
      });
    }
  }, [isVisible, centerOpacity, rings]);

  const ringConfigs = [
    {size: 120, opacity: 0.25},
    {size: 200, opacity: 0.15},
    {size: 280, opacity: 0.08},
  ];

  return (
    <View style={neighborStyles.container}>
      {/* Ambient background glow */}
      <View
        style={[neighborStyles.glow, {backgroundColor: colors.primaryLight}]}
      />
      {/* Rings */}
      {ringConfigs.map((config, i) => (
        <Animated.View
          key={i}
          style={[
            neighborStyles.ring,
            {
              width: config.size,
              height: config.size,
              borderRadius: config.size / 2,
              borderColor: colors.primary,
              opacity: Animated.multiply(
                rings[i],
                new Animated.Value(config.opacity),
              ),
              transform: [
                {
                  scale: rings[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
      {/* Center — "you are here" */}
      <Animated.View
        style={[
          neighborStyles.center,
          {
            backgroundColor: colors.primary,
            opacity: centerOpacity,
          },
        ]}
      />
    </View>
  );
}

const neighborStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.06,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  center: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});

// ─── Slide 2: "The Mom" ────────────────────────────────────────
// A warm kitchen light — abstract, intimate. Single light source with
// a subtle table/counter shape below it. Dignity, not pity.
function MomVisual({isVisible}: {isVisible: boolean}) {
  const {colors} = useTheme();
  const lightOpacity = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isVisible && !hasAnimated.current) {
      hasAnimated.current = true;
      Animated.timing(lightOpacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        // Gentle pulse after appearing
        pulseRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(lightOpacity, {
              toValue: 0.7,
              duration: 2000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(lightOpacity, {
              toValue: 1,
              duration: 2000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        );
        pulseRef.current.start();
      });
    }
    return () => {
      pulseRef.current?.stop();
    };
  }, [isVisible, lightOpacity]);

  return (
    <View style={momStyles.container}>
      {/* Warm ambient glow — the kitchen light at 5am */}
      <Animated.View
        style={[
          momStyles.warmGlow,
          {
            backgroundColor: colors.primary,
            opacity: Animated.multiply(lightOpacity, new Animated.Value(0.06)),
          },
        ]}
      />
      {/* Light source */}
      <Animated.View
        style={[
          momStyles.lightCircle,
          {
            backgroundColor: colors.primary,
            opacity: Animated.multiply(lightOpacity, new Animated.Value(0.2)),
          },
        ]}
      />
      {/* Counter surface below */}
      <Animated.View
        style={[
          momStyles.surface,
          {
            backgroundColor: colors.primary,
            opacity: Animated.multiply(lightOpacity, new Animated.Value(0.08)),
          },
        ]}
      />
      {/* Small detail: lunch boxes on counter */}
      <Animated.View
        style={{opacity: lightOpacity, flexDirection: 'row', gap: 8}}>
        <View
          style={[
            momStyles.lunchBox,
            {backgroundColor: colors.primary, opacity: 0.15},
          ]}
        />
        <View
          style={[
            momStyles.lunchBox,
            {backgroundColor: colors.accent, opacity: 0.12},
          ]}
        />
        <View
          style={[
            momStyles.lunchBox,
            {backgroundColor: colors.primary, opacity: 0.1},
          ]}
        />
      </Animated.View>
    </View>
  );
}

const momStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  warmGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  lightCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 56,
  },
  surface: {
    width: '85%',
    height: 2,
    borderRadius: 1,
    marginBottom: 20,
  },
  lunchBox: {
    width: 36,
    height: 28,
    borderRadius: 5,
  },
});

// ─── Slide 3: "The Notice" ─────────────────────────────────────
// Urgent countdown feel — a large "72" with ticking clock energy.
function NoticeVisual({isVisible}: {isVisible: boolean}) {
  const {colors} = useTheme();
  const numberOpacity = useRef(new Animated.Value(0)).current;
  const numberScale = useRef(new Animated.Value(1.1)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isVisible && !hasAnimated.current) {
      hasAnimated.current = true;
      Animated.parallel([
        Animated.timing(numberOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(numberScale, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, numberOpacity, numberScale]);

  return (
    <View style={noticeStyles.container}>
      {/* Urgent glow */}
      <View
        style={[noticeStyles.urgentGlow, {backgroundColor: colors.primary}]}
      />
      <Animated.View
        style={{
          opacity: numberOpacity,
          transform: [{scale: numberScale}],
          alignItems: 'center',
        }}>
        <Text
          style={[
            {
              fontSize: 120,
              fontWeight: '200',
              fontFamily: Typography.display.fontFamily,
              color: colors.primary,
              letterSpacing: -3,
            },
          ]}>
          72
        </Text>
        <Text
          style={[
            Typography.body,
            {color: colors.textTertiary, marginTop: -4},
          ]}>
          hours
        </Text>
      </Animated.View>
    </View>
  );
}

const noticeStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  urgentGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.04,
  },
});

// ─── Slide 4: "You'd help if you knew" ─────────────────────────
// A slow pulse — the emotional beat before the turn. Minimal.
function KnewVisual({isVisible}: {isVisible: boolean}) {
  const {colors} = useTheme();
  const pulseOpacity = useRef(new Animated.Value(0)).current;
  const hasStarted = useRef(false);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isVisible && !hasStarted.current) {
      hasStarted.current = true;
      // Fade in then pulse
      Animated.timing(pulseOpacity, {
        toValue: 0.12,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        animRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseOpacity, {
              toValue: 0.06,
              duration: 2000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0.12,
              duration: 2000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        );
        animRef.current.start();
      });
    }
    return () => {
      animRef.current?.stop();
    };
  }, [isVisible, pulseOpacity]);

  return (
    <View style={knewStyles.container}>
      <Animated.View
        style={[
          knewStyles.pulse,
          {
            backgroundColor: colors.primary,
            opacity: pulseOpacity,
          },
        ]}
      />
    </View>
  );
}

const knewStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
  },
  pulse: {
    width: 240,
    height: 240,
    borderRadius: 120,
  },
});

// ─── Slide 5: "Now you can" ───────────────────────────────────
// Expanding warm circle — the emotional pivot. Bold, simple.
function TurnVisual({isVisible}: {isVisible: boolean}) {
  const {colors} = useTheme();
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isVisible && !hasAnimated.current) {
      hasAnimated.current = true;
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0.15,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 6,
          bounciness: 4,
        }),
      ]).start();
    }
  }, [isVisible, scale, opacity]);

  return (
    <View style={turnStyles.container}>
      <Animated.View
        style={[
          turnStyles.circle,
          {
            backgroundColor: colors.primary,
            opacity,
            transform: [{scale}],
          },
        ]}
      />
    </View>
  );
}

const turnStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  circle: {
    width: 280,
    height: 280,
    borderRadius: 140,
  },
});

// ─── Slide 6: "This phone makes giving direct" ────────────────
// Flow: phone → thick direct arrow → person with halo. Clean, bold.
function DirectVisual({isVisible}: {isVisible: boolean}) {
  const {colors} = useTheme();
  const flowOpacity = useRef(new Animated.Value(0)).current;
  const arrowWidth = useRef(new Animated.Value(0)).current;
  const personOpacity = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isVisible && !hasAnimated.current) {
      hasAnimated.current = true;
      // Phone appears
      Animated.timing(flowOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      // Arrow extends
      setTimeout(() => {
        Animated.timing(arrowWidth, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();
      }, 200);
      // Person appears
      setTimeout(() => {
        Animated.timing(personOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }, 500);
    }
  }, [isVisible, flowOpacity, arrowWidth, personOpacity]);

  const arrowWidthInterp = arrowWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={directStyles.container}>
      {/* Ambient glow */}
      <View
        style={[directStyles.glow, {backgroundColor: colors.primaryLight}]}
      />

      <View style={directStyles.flowRow}>
        {/* Phone icon */}
        <Animated.View style={{opacity: flowOpacity}}>
          <View style={[directStyles.phone, {borderColor: colors.primary}]}>
            <View
              style={[directStyles.phoneDot, {backgroundColor: colors.primary}]}
            />
          </View>
        </Animated.View>

        {/* Direct arrow */}
        <View style={directStyles.arrowTrack}>
          <Animated.View
            style={[
              directStyles.arrow,
              {backgroundColor: colors.primary, width: arrowWidthInterp},
            ]}
          />
        </View>

        {/* Person with halo */}
        <Animated.View
          style={[directStyles.personWrap, {opacity: personOpacity}]}>
          <View
            style={[directStyles.halo, {backgroundColor: colors.primaryLight}]}
          />
          <View
            style={[directStyles.person, {backgroundColor: colors.accent}]}
          />
        </Animated.View>
      </View>

      {/* Label */}
      <Animated.View style={{opacity: personOpacity, marginTop: 32}}>
        <Text
          style={[
            Typography.caption,
            {color: colors.textTertiary, textAlign: 'center'},
          ]}>
          100% of your gift arrives
        </Text>
      </Animated.View>
    </View>
  );
}

const directStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 200,
    borderRadius: 100,
    opacity: 0.06,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  phone: {
    width: 56,
    height: 92,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  phoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    opacity: 0.4,
  },
  arrowTrack: {
    width: 100,
    height: 8,
    overflow: 'hidden',
  },
  arrow: {
    height: 8,
    borderRadius: 4,
  },
  personWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  person: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
});

// ─── Slide 7: "Then you see what happened" ────────────────────
// Photo stack — 3 overlapping cards fanning out. Cinematic.
function ProofVisual({isVisible}: {isVisible: boolean}) {
  const {colors} = useTheme();
  const fanAnim = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isVisible && !hasAnimated.current) {
      hasAnimated.current = true;
      Animated.spring(fanAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 6,
        bounciness: 5,
        delay: 200,
      }).start();
    }
  }, [isVisible, fanAnim]);

  const cards = [
    {deg: -4, tx: -16, opacity: 0.4},
    {deg: 0, tx: 0, opacity: 1},
    {deg: 4, tx: 16, opacity: 0.4},
  ];

  return (
    <View style={proofStyles.container}>
      {cards.map((card, i) => {
        const rotate = fanAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${card.deg}deg`],
        });
        const translateX = fanAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, card.tx],
        });
        const isFront = i === 1;

        return (
          <Animated.View
            key={i}
            style={[
              proofStyles.card,
              {
                zIndex: isFront ? 3 : 1,
                backgroundColor: isFront
                  ? colors.card
                  : colors.backgroundSecondary,
                borderColor: colors.glassBorder,
                shadowColor: colors.shadow,
                transform: [{rotate}, {translateX}],
              },
            ]}>
            {/* Photo placeholder area */}
            <View
              style={[
                proofStyles.photoArea,
                {
                  backgroundColor: isFront
                    ? colors.primaryLight
                    : colors.border,
                },
              ]}
            />
            {isFront && (
              <View style={proofStyles.cardContent}>
                <Text
                  style={[Typography.bodySmall, {color: colors.textPrimary}]}>
                  Gift delivered
                </Text>
                <View style={proofStyles.verifiedRow}>
                  <View
                    style={[
                      proofStyles.badge,
                      {backgroundColor: colors.accent},
                    ]}>
                    <Text style={proofStyles.check}>✓</Text>
                  </View>
                  <Text style={[Typography.caption, {color: colors.accent}]}>
                    Verified on Solana
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>
        );
      })}
    </View>
  );
}

const proofStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  card: {
    position: 'absolute',
    width: 220,
    height: 280,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  photoArea: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cardContent: {
    padding: 16,
    gap: 6,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

// ─── Slide 9: "Groceries. Rent. A clean shower." ──────────────
function ImpactVisual({isVisible}: {isVisible: boolean}) {
  const {colors} = useTheme();
  const cardAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isVisible && !hasAnimated.current) {
      hasAnimated.current = true;
      cardAnims.forEach((anim, i) => {
        setTimeout(() => {
          Animated.spring(anim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 12,
            bounciness: 4,
          }).start();
        }, i * 100);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cardAnims are stable Animated.Value refs
  }, [isVisible]);

  const needs = [
    {
      title: 'Groceries for a single mom',
      amount: '$100',
      color: colors.primary,
    },
    {
      title: 'New tires so she can get to work',
      amount: '$400',
      color: colors.accent,
    },
    {
      title: 'A month of rent before the notice',
      amount: '$1,000',
      color: colors.secondary,
    },
  ];

  return (
    <View style={impactStyles.container}>
      {needs.map((need, i) => {
        const translateY = cardAnims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [40, 0],
        });
        return (
          <Animated.View
            key={i}
            style={{
              opacity: cardAnims[i],
              transform: [{translateY}],
            }}>
            <GlassCard variant={i === 0 ? 'primary' : 'secondary'}>
              <View style={impactStyles.needRow}>
                <View
                  style={[
                    impactStyles.accentBar,
                    {backgroundColor: need.color},
                  ]}
                />
                <View style={impactStyles.needText}>
                  <Text
                    style={[Typography.bodySmall, {color: colors.textPrimary}]}
                    numberOfLines={1}>
                    {need.title}
                  </Text>
                </View>
                <View
                  style={[
                    impactStyles.pill,
                    {backgroundColor: colors.primary},
                  ]}>
                  <Text
                    style={[
                      Typography.caption,
                      {color: colors.textOnPrimary, fontWeight: '600'},
                    ]}>
                    {need.amount}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        );
      })}
    </View>
  );
}

const impactStyles = StyleSheet.create({
  container: {
    gap: 12,
  },
  needRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accentBar: {
    width: 4,
    height: 36,
    borderRadius: 2,
  },
  needText: {
    flex: 1,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
});

// ─── Slide 10: "The real story, delivered to you" ──────────────
function StoryVisual() {
  const {colors} = useTheme();

  return (
    <GlassCard variant="primary">
      {/* Photo area */}
      <View
        style={[storyStyles.photoArea, {backgroundColor: colors.primaryLight}]}>
        <View
          style={[storyStyles.cameraIcon, {borderColor: colors.textTertiary}]}>
          <View
            style={[storyStyles.lens, {borderColor: colors.textTertiary}]}
          />
        </View>
      </View>

      <View style={storyStyles.content}>
        <Text
          style={[
            Typography.body,
            {color: colors.textPrimary, fontWeight: '500'},
          ]}>
          Gift delivered
        </Text>
        <Text
          style={[
            Typography.bodySmall,
            {color: colors.textSecondary, marginTop: 4},
          ]}>
          Your $100 bought groceries for Maria and her three kids. She left a
          note: "thank you for seeing us."
        </Text>
        <View style={storyStyles.verifiedRow}>
          <View style={[storyStyles.badge, {backgroundColor: colors.accent}]}>
            <Text style={storyStyles.checkText}>✓</Text>
          </View>
          <Text style={[Typography.caption, {color: colors.accent}]}>
            Verified on Solana
          </Text>
        </View>
        <Text
          style={[Typography.bodySmall, {color: colors.primary, marginTop: 8}]}>
          View full story →
        </Text>
      </View>
    </GlassCard>
  );
}

const storyStyles = StyleSheet.create({
  photoArea: {
    height: 120,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    width: 40,
    height: 32,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lens: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  content: {
    gap: 2,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  badge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

// ─── Slide 11: "The Invitation" ───────────────────────────────
function InvitationVisual({isVisible}: {isVisible: boolean}) {
  const {colors} = useTheme();
  const floatAnim = useRef(new Animated.Value(0)).current;
  const hasStarted = useRef(false);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isVisible && !hasStarted.current) {
      hasStarted.current = true;
      animRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -3,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 3,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      animRef.current.start();
    }
    return () => {
      animRef.current?.stop();
    };
  }, [isVisible, floatAnim]);

  return (
    <Animated.View style={{transform: [{translateY: floatAnim}]}}>
      <GlassCard variant="primary">
        <Text
          style={[
            Typography.subheading,
            {color: colors.textPrimary, marginBottom: 8},
          ]}>
          A clean shower and fresh clothes
        </Text>
        <Text
          style={[
            Typography.bodySmall,
            {color: colors.textSecondary, marginBottom: 16},
          ]}>
          For someone living on the street, this is dignity.
        </Text>

        <View style={invitationStyles.metaRow}>
          <View
            style={[invitationStyles.pill, {backgroundColor: colors.primary}]}>
            <Text
              style={[Typography.buttonSmall, {color: colors.textOnPrimary}]}>
              $25
            </Text>
          </View>
          <Text style={[Typography.caption, {color: colors.textTertiary}]}>
            BeHeard Movement
          </Text>
        </View>

        <View
          style={[
            invitationStyles.giveButton,
            {backgroundColor: colors.primary},
          ]}>
          <Text style={[Typography.buttonLarge, {color: colors.textOnPrimary}]}>
            Give Now
          </Text>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const invitationStyles = StyleSheet.create({
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  giveButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
});
