import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
} from 'react-native';
import {useTheme} from './theme';

// Content Data
const WHY_CONTENT = {
  hero: "What if giving actually felt like something?",
  problem: [
    "Every year, hundreds of billions of dollars flow into charitable causes. But somewhere between the donation and the need, the connection gets lost.",
    "Donors get a thank-you letter. Recipients see cents on the dollar—most of the pie is gone before it reaches them. And the people running nonprofits? They spend more time chasing funding than doing the work they set out to do.",
  ],
  change: "The nonprofit industry hasn't fundamentally changed since 1969. That's over 55 years of the same model—layers of overhead, endless grant applications, and donors left wondering if their gift made any difference at all.",
  vision: "Giving should be better. So we built something that is.",
  mission: "Glimpse exists because you should feel what your generosity actually does. No middlemen taking their cut. No black box between you and the person you helped. Just you, helping someone who needs it—documented, verified, and meaningful to both of you.",
  whyGlimpse: {
    title: 'Why "Glimpse"?',
    subtitle: "The name carries three meanings:",
    meanings: [
      "A glimpse into the Kingdom—sacrificial giving reflects something bigger than ourselves",
      "A glimpse into the work—see the real effort partners put in on the ground",
      "A glimpse into someone's life—witness the real impact of your gift",
    ],
  },
};

const HOW_CONTENT = {
  hero: "Pick a direction. We handle the rest.",
  intro: "You're not here to browse causes or shop for a story that moves you. You're here to make a difference—and trust us to do it right.",
  steps: [
    {
      number: "1",
      title: "Choose your direction",
      description: "Select the community you want to support.",
    },
    {
      number: "2",
      title: "Give",
      description: "Your full donation goes to work. No platform fees. No admin cuts. Just groceries, gas, and rent—the stuff that actually matters.",
    },
    {
      number: "3",
      title: "Wait for it",
      description: "You won't know exactly who you helped—until after your gift lands. Then you'll see who it reached.",
    },
    {
      number: "4",
      title: "See the impact",
      description: "Photos. Receipts. The real story. Documented and delivered—proof that your generosity landed.",
    },
  ],
  closing: "Think of us as your personal giving team. We do the legwork. You get the proof.",
};

const FAQ_DATA = [
  {
    id: 'verified',
    question: "How are needs verified?",
    answer: "Every need is personally vetted. We talk to the people who actually know—community members, teachers, family, church leaders. The boots-on-the-ground people who have real relationships. You can't fake that kind of connection.",
  },
  {
    id: 'blockchain',
    question: "Why use blockchain?",
    answer: "Trust, but verify. Every donation is recorded on Solana—a public, permanent ledger anyone can verify. No one can edit it. No one can hide it. Not even us. It's instant, costs almost nothing to record, and completely transparent.",
  },
  {
    id: 'pick-person',
    question: "Do I pick the specific person?",
    answer: "No—and that's intentional. You pick a direction, not a person. After your gift is deployed, you'll see exactly who it helped.",
  },
  {
    id: 'selection',
    question: "How do you decide who receives my gift?",
    answer: "We select recipients based on merit, urgency of need, and queue order. We're committed to full transparency—we'll be documenting everything we do and how we make decisions as we grow.",
  },
  {
    id: 'communicate',
    question: "Can I communicate with the recipient?",
    answer: "You can leave a note of encouragement with your gift. We don't expect recipients to respond—but if they choose to, we'll make sure it reaches you.",
  },
  {
    id: 'received',
    question: "How do I know my gift was received?",
    answer: "You'll see it. Every receipt is photographed. Every transaction is time-stamped on-chain. With permission, you'll see photos of the impact. Permanent proof it happened.",
  },
  {
    id: 'minimum',
    question: "What's the minimum donation?",
    answer: "$25.",
  },
  {
    id: 'fees',
    question: "What percentage goes to fees?",
    answer: "For our Seeker launch: zero. No platform fees. No admin cuts. Your full gift goes to the need.",
  },
  {
    id: 'tax',
    question: "Is my donation tax-deductible?",
    answer: "Yes.",
  },
  {
    id: 'location',
    question: "Where does Glimpse operate?",
    answer: "We're based in Muscatine, Iowa. Partners are continually added as they are vetted.",
  },
  {
    id: 'who',
    question: "Who is behind Glimpse?",
    answer: "A small team that believes giving should feel like something. We know every partner by name and stake our reputation on every gift. This isn't a platform. It's a promise.",
  },
];

// FAQ Item Component
interface FAQItemProps {
  item: typeof FAQ_DATA[0];
  isExpanded: boolean;
  onToggle: () => void;
}

function FAQItem({item, isExpanded, onToggle}: FAQItemProps) {
  const {colors} = useTheme();
  const expandHeight = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(expandHeight, {
        toValue: isExpanded ? 1 : 0,
        useNativeDriver: false,
        friction: 10,
        tension: 40,
      }),
      Animated.spring(rotateAnim, {
        toValue: isExpanded ? 1 : 0,
        useNativeDriver: true,
        friction: 10,
        tension: 40,
      }),
    ]).start();
  }, [isExpanded]);

  const contentHeight = expandHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 150],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={[styles.faqItem, {borderBottomColor: colors.border}]}>
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={onToggle}
        activeOpacity={0.7}>
        <Text style={[styles.faqQuestion, {color: colors.textPrimary}]}>
          {item.question}
        </Text>
        <Animated.View style={{transform: [{rotate}]}}>
          <Text style={[styles.faqIcon, {color: colors.primary}]}>+</Text>
        </Animated.View>
      </TouchableOpacity>
      <Animated.View style={{height: contentHeight, overflow: 'hidden'}}>
        <Text style={[styles.faqAnswer, {color: colors.textSecondary}]}>
          {item.answer}
        </Text>
      </Animated.View>
    </View>
  );
}

// X Icon Component
function XIcon({color}: {color: string}) {
  return (
    <View style={styles.xIconContainer}>
      <View style={[styles.xLine1, {backgroundColor: color}]} />
      <View style={[styles.xLine2, {backgroundColor: color}]} />
    </View>
  );
}

export default function AboutContent() {
  const {colors} = useTheme();
  const [activeSubTab, setActiveSubTab] = useState<'why' | 'how'>('why');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const handleFaqToggle = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const openX = () => {
    Linking.openURL('https://x.com/DerrickWKing');
  };

  return (
    <View style={styles.container}>
      {/* Sub Tab Bar */}
      <View style={[styles.tabBar, {backgroundColor: colors.card}]}>
        {(['why', 'how'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeSubTab === tab && {backgroundColor: colors.primary},
            ]}
            onPress={() => setActiveSubTab(tab)}
            activeOpacity={0.8}>
            <Text
              style={[
                styles.tabText,
                {color: activeSubTab === tab ? colors.textOnPrimary : colors.textTertiary},
              ]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* WHY Tab Content */}
      {activeSubTab === 'why' && (
        <View style={styles.tabContent}>
          <Text style={[styles.heroText, {color: colors.textPrimary}]}>
            {WHY_CONTENT.hero}
          </Text>

          {WHY_CONTENT.problem.map((paragraph, index) => (
            <Text
              key={index}
              style={[styles.bodyText, {color: colors.textSecondary}]}>
              {paragraph}
            </Text>
          ))}

          <View style={[styles.highlightCard, {backgroundColor: colors.primaryLight}]}>
            <Text style={[styles.highlightText, {color: colors.primary}]}>
              {WHY_CONTENT.change}
            </Text>
          </View>

          <Text style={[styles.visionText, {color: colors.textPrimary}]}>
            {WHY_CONTENT.vision}
          </Text>

          <Text style={[styles.bodyText, {color: colors.textSecondary}]}>
            {WHY_CONTENT.mission}
          </Text>

          <View style={styles.whyGlimpseSection}>
            <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>
              {WHY_CONTENT.whyGlimpse.title}
            </Text>
            <Text style={[styles.bodyText, {color: colors.textSecondary}]}>
              {WHY_CONTENT.whyGlimpse.subtitle}
            </Text>
            {WHY_CONTENT.whyGlimpse.meanings.map((meaning, index) => (
              <View key={index} style={styles.meaningItem}>
                <View style={[styles.bullet, {backgroundColor: colors.primary}]} />
                <Text style={[styles.meaningText, {color: colors.textSecondary}]}>
                  {meaning}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* HOW Tab Content */}
      {activeSubTab === 'how' && (
        <View style={styles.tabContent}>
          <Text style={[styles.heroText, {color: colors.textPrimary}]}>
            {HOW_CONTENT.hero}
          </Text>

          <Text style={[styles.bodyText, {color: colors.textSecondary}]}>
            {HOW_CONTENT.intro}
          </Text>

          {HOW_CONTENT.steps.map((step, index) => (
            <View
              key={index}
              style={[
                styles.stepCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.glassBorder,
                },
              ]}>
              <View style={[styles.stepNumber, {backgroundColor: colors.primary}]}>
                <Text style={[styles.stepNumberText, {color: colors.textOnPrimary}]}>
                  {step.number}
                </Text>
              </View>
              <Text style={[styles.stepTitle, {color: colors.textPrimary}]}>
                {step.title}
              </Text>
              <Text style={[styles.stepDescription, {color: colors.textSecondary}]}>
                {step.description}
              </Text>
            </View>
          ))}

          <View style={[styles.closingCard, {backgroundColor: colors.primaryLight}]}>
            <Text style={[styles.closingText, {color: colors.primary}]}>
              {HOW_CONTENT.closing}
            </Text>
          </View>
        </View>
      )}

      {/* FAQ Section */}
      <View style={styles.faqSection}>
        <Text style={[styles.faqTitle, {color: colors.textPrimary}]}>
          FAQ
        </Text>
        {FAQ_DATA.map(item => (
          <FAQItem
            key={item.id}
            item={item}
            isExpanded={expandedFaq === item.id}
            onToggle={() => handleFaqToggle(item.id)}
          />
        ))}
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={[styles.disclaimerText, {color: colors.textTertiary}]}>
          We're just getting started, and things may evolve as we learn. That's part of building something new. If you have questions, ideas, or just want to talk—I'm here.
        </Text>
        <TouchableOpacity
          style={styles.xLink}
          onPress={openX}
          activeOpacity={0.7}>
          <XIcon color={colors.primary} />
          <Text style={[styles.xHandle, {color: colors.primary}]}>
            @DerrickWKing
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 8,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },
  tabContent: {
    marginBottom: 32,
  },
  heroText: {
    fontSize: 26,
    fontWeight: '300',
    lineHeight: 34,
    marginBottom: 20,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 14,
  },
  highlightCard: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  highlightText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
  },
  visionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  whyGlimpseSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  meaningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 10,
  },
  meaningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  stepCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 22,
  },
  closingCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  closingText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'center',
  },
  faqSection: {
    marginTop: 8,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 14,
  },
  faqItem: {
    borderBottomWidth: 1,
    paddingVertical: 14,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingRight: 12,
  },
  faqIcon: {
    fontSize: 22,
    fontWeight: '300',
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 20,
    paddingTop: 10,
    paddingRight: 36,
  },
  disclaimer: {
    marginTop: 36,
    alignItems: 'center',
    paddingBottom: 20,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  xLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  xIconContainer: {
    width: 16,
    height: 16,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xLine1: {
    position: 'absolute',
    width: 16,
    height: 2,
    borderRadius: 1,
    transform: [{rotate: '45deg'}],
  },
  xLine2: {
    position: 'absolute',
    width: 16,
    height: 2,
    borderRadius: 1,
    transform: [{rotate: '-45deg'}],
  },
  xHandle: {
    fontSize: 14,
    fontWeight: '600',
  },
});
