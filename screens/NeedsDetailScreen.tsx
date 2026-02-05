import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const {width} = Dimensions.get('window');

// Neo Brutalist Color Palette (matching HomeScreen)
const Colors = {
  cream: '#FFFEF0',
  paper: '#FFFFFF',
  cardBg: '#FFFFFF',
  primary: '#FFDE59',
  secondary: '#FF6B6B',
  accent: '#4ECDC4',
  textDark: '#000000',
  textMedium: '#1A1A1A',
  textLight: '#4A4A4A',
  border: '#000000',
};

// Example completed donations
const COMPLETED = [
  {
    id: 'c1',
    title: 'New Tires for Maria',
    amount: '$450',
    description: 'Maria can now safely drive to work. Her kids get to school on time.',
    date: 'Jan 2026',
  },
  {
    id: 'c2',
    title: 'School Supplies for Room 204',
    amount: '$280',
    description: '32 kids started the year with new backpacks and supplies.',
    date: 'Dec 2025',
  },
  {
    id: 'c3',
    title: 'Friday Breakfasts for Harold',
    amount: '$180',
    description: '12 weeks of breakfast at his favorite diner. He made a new friend.',
    date: 'Nov 2025',
  },
];

// Example current needs
const CURRENT_NEEDS = [
  {
    id: 'n1',
    title: 'Diapers + Formula',
    recipient: 'Single mom, newborn twins',
    amount: '$200',
    description: '3-month supply to help her get back on her feet.',
  },
  {
    id: 'n2',
    title: '8th Grade Wardrobe',
    recipient: 'Marcus, 13',
    amount: '$200',
    description: 'New clothes for a fresh start. Confidence matters.',
  },
  {
    id: 'n3',
    title: 'Weekly Groceries',
    recipient: 'Elderly couple, fixed income',
    amount: '$150/month',
    description: 'Fresh food delivered every Saturday.',
  },
  {
    id: 'n4',
    title: 'Car Repair',
    recipient: 'Night shift nurse',
    amount: '$380',
    description: 'Brake pads and oil change. She can\'t miss another shift.',
  },
];

interface NeedsDetailScreenProps {
  onBack: () => void;
  onDonate: (amount: string, purpose: string) => void;
}

export default function NeedsDetailScreen({onBack, onDonate}: NeedsDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'needs' | 'completed'>('needs');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top + 12}]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Real Needs</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, {paddingBottom: 40 + insets.bottom}]}
        showsVerticalScrollIndicator={false}>

        {/* Mission Statement */}
        <View style={styles.missionSection}>
          <Text style={styles.missionTitle}>We do things differently.</Text>
          <Text style={styles.missionText}>
            We're not trying to raise the most money. We want every dollar to go further than anywhere else.
          </Text>
          <Text style={styles.missionText}>
            Whether you give $10, $1,000, or $1 million — we view each dollar the same. We know the impact even a small amount can have on someone's life.
          </Text>
          <Text style={styles.missionHighlight}>
            Your donation matters. We understand the sacrifice it takes to give. It will not be in vain.
          </Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'needs' && styles.tabActive]}
            onPress={() => setActiveTab('needs')}>
            <Text style={[styles.tabText, activeTab === 'needs' && styles.tabTextActive]}>
              Current Needs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
            onPress={() => setActiveTab('completed')}>
            <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
              Completed
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on tab */}
        {activeTab === 'needs' ? (
          <View style={styles.cardsSection}>
            <Text style={styles.sectionSubtitle}>
              Choose where your donation goes. You can customize your gift to match your heart.
            </Text>
            {CURRENT_NEEDS.map(need => (
              <TouchableOpacity
                key={need.id}
                style={styles.needCard}
                activeOpacity={0.8}
                onPress={() => onDonate(need.amount, need.title)}>
                <View style={styles.needCardHeader}>
                  <Text style={styles.needCardTitle}>{need.title}</Text>
                  <Text style={styles.needCardAmount}>{need.amount}</Text>
                </View>
                <Text style={styles.needCardRecipient}>{need.recipient}</Text>
                <Text style={styles.needCardDesc}>{need.description}</Text>
                <View style={styles.needCardButton}>
                  <Text style={styles.needCardButtonText}>Give This Gift</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.cardsSection}>
            <Text style={styles.sectionSubtitle}>
              See the impact. Real receipts, real stories, real change.
            </Text>
            {COMPLETED.map(item => (
              <View key={item.id} style={styles.completedCard}>
                <View style={styles.completedCardHeader}>
                  <Text style={styles.completedCardTitle}>{item.title}</Text>
                  <Text style={styles.completedCardAmount}>{item.amount}</Text>
                </View>
                <Text style={styles.completedCardDesc}>{item.description}</Text>
                <Text style={styles.completedCardDate}>{item.date}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            We aim to use every dollar for the purpose it was given. While we can't guarantee your donation goes to a specific person, we promise transparency and direct impact.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  header: {
    backgroundColor: Colors.cream,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 3,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 80,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.cardBg,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  backButtonText: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 14,
    color: Colors.textDark,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 16,
    color: Colors.textDark,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  // Mission Section
  missionSection: {
    marginBottom: 32,
    padding: 20,
    backgroundColor: Colors.accent,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: Colors.border,
    shadowOffset: {width: 4, height: 4},
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  missionTitle: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 24,
    color: Colors.textDark,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  missionText: {
    fontFamily: 'CourierPrime-Regular',
    fontSize: 15,
    color: Colors.textDark,
    lineHeight: 24,
    marginBottom: 12,
  },
  missionHighlight: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 15,
    color: Colors.textDark,
    lineHeight: 24,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  // Tab Switcher - Neo Brutalist
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: Colors.cardBg,
    borderWidth: 3,
    borderColor: Colors.border,
    padding: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRightWidth: 3,
    borderRightColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 14,
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tabTextActive: {
    fontFamily: 'CourierPrime-Bold',
    color: Colors.textDark,
  },
  // Cards Section
  cardsSection: {
    marginBottom: 24,
  },
  sectionSubtitle: {
    fontFamily: 'CourierPrime-Regular',
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 16,
    lineHeight: 22,
  },
  // Need Card - Neo Brutalist
  needCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 0,
    padding: 20,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: Colors.border,
    shadowOffset: {width: 4, height: 4},
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  needCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  needCardTitle: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 18,
    color: Colors.textDark,
    flex: 1,
    textTransform: 'uppercase',
  },
  needCardAmount: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 20,
    color: Colors.textDark,
    marginLeft: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  needCardRecipient: {
    fontFamily: 'CourierPrime-Regular',
    fontSize: 13,
    color: Colors.textMedium,
    marginBottom: 8,
  },
  needCardDesc: {
    fontFamily: 'CourierPrime-Regular',
    fontSize: 14,
    color: Colors.textMedium,
    lineHeight: 22,
    marginBottom: 16,
  },
  needCardButton: {
    backgroundColor: Colors.primary,
    borderRadius: 0,
    borderWidth: 3,
    borderColor: Colors.border,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: Colors.border,
    shadowOffset: {width: 3, height: 3},
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  needCardButtonText: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 14,
    color: Colors.textDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Completed Card - Neo Brutalist
  completedCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 0,
    padding: 20,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: Colors.border,
    shadowOffset: {width: 4, height: 4},
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  completedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  completedCardTitle: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 16,
    color: Colors.textDark,
    flex: 1,
    textTransform: 'uppercase',
  },
  completedCardAmount: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 16,
    color: Colors.textDark,
    marginLeft: 12,
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  completedCardDesc: {
    fontFamily: 'CourierPrime-Regular',
    fontSize: 14,
    color: Colors.textMedium,
    lineHeight: 22,
    marginBottom: 8,
  },
  completedCardDate: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 12,
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Disclaimer
  disclaimer: {
    paddingTop: 20,
    paddingBottom: 8,
    borderTopWidth: 3,
    borderTopColor: Colors.border,
  },
  disclaimerText: {
    fontFamily: 'CourierPrime-Regular',
    fontSize: 12,
    color: Colors.textLight,
    lineHeight: 20,
    textAlign: 'center',
  },
});
