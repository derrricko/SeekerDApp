import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme, Typography} from '../components/theme';
import VaultCard from '../components/VaultCard';
import DepositModal from '../components/DepositModal';
import {useEntrance, ENTRANCE_STAGGER} from '../utils/animations';
import {MOCK_VAULTS} from '../data/mockData';
import type {Vault} from '../data/mockData';
import type {VaultStackParamList} from '../navigation/AppNavigator';

type VaultListNav = NativeStackNavigationProp<VaultStackParamList, 'VaultList'>;

export default function VaultListScreen() {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const navigation = useNavigation<VaultListNav>();

  // Deposit modal state
  const [depositVault, setDepositVault] = useState<Vault | null>(null);
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositVisible, setDepositVisible] = useState(false);

  const headerEntrance = useEntrance(0);

  const handleDeposit = (vault: Vault, amount: number) => {
    setDepositVault(vault);
    setDepositAmount(amount);
    setDepositVisible(true);
  };

  const renderVault = ({item, index}: {item: Vault; index: number}) => (
    <AnimatedVaultCard
      vault={item}
      index={index}
      onPress={() => navigation.navigate('VaultDetail', {vaultId: item.id})}
      onDeposit={(amount: number) => handleDeposit(item, amount)}
    />
  );

  return (
    <View style={[vaultListStyles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View
        style={[
          vaultListStyles.header,
          {
            paddingTop: insets.top + 12,
            borderBottomColor: colors.glassBorder,
          },
        ]}>
        <Animated.View
          style={{
            opacity: headerEntrance.opacity,
            transform: [{translateY: headerEntrance.translateY}],
          }}>
          <Text style={[vaultListStyles.headerTitle, {color: colors.accent}]}>
            Vaults
          </Text>
          <Text
            style={[
              vaultListStyles.headerSub,
              {color: colors.textTertiary},
            ]}>
            Fund verified needs directly
          </Text>
        </Animated.View>
      </View>

      <FlatList
        data={MOCK_VAULTS}
        keyExtractor={item => item.id}
        renderItem={renderVault}
        contentContainerStyle={[
          vaultListStyles.list,
          {paddingBottom: 100 + insets.bottom},
        ]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        windowSize={5}
      />

      <DepositModal
        visible={depositVisible}
        vault={depositVault}
        amount={depositAmount}
        onClose={() => setDepositVisible(false)}
      />
    </View>
  );
}

/** Vault card with staggered entrance animation */
function AnimatedVaultCard({
  vault,
  index,
  onPress,
  onDeposit,
}: {
  vault: Vault;
  index: number;
  onPress: () => void;
  onDeposit: (amount: number) => void;
}) {
  const entrance = useEntrance(ENTRANCE_STAGGER * (index + 1));

  return (
    <Animated.View
      style={[
        vaultListStyles.cardWrap,
        {
          opacity: entrance.opacity,
          transform: [{translateY: entrance.translateY}],
        },
      ]}>
      <VaultCard
        vault={vault}
        index={index}
        onPress={onPress}
        onDeposit={onDeposit}
      />
    </Animated.View>
  );
}

const vaultListStyles = StyleSheet.create({
  container: {flex: 1},
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '200',
    letterSpacing: 1,
    lineHeight: 40,
    marginBottom: 4,
  },
  headerSub: {
    ...Typography.bodySmall,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  list: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  cardWrap: {
    marginBottom: 16,
  },
});
