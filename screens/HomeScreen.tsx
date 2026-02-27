import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useTheme} from '../theme/Theme';
import GridBackground from '../ui/GridBackground';

export default function HomeScreen({onContinue}: {onContinue: () => void}) {
  const {theme} = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handlePress = () => {
    if (isLeaving) {
      return;
    }

    setIsLeaving(true);

    // Keep Android tap sound and complete navigation quickly after click-down.
    setTimeout(() => {
      onContinue();
    }, 120);
  };

  return (
    <View style={[styles.root, {backgroundColor: '#EDE8FA'}]}>
      <GridBackground />

      <View style={styles.centerWrap}>
        <View style={styles.cartoonButtonWrap}>
          <View
            style={[
              styles.buttonShadowPlate,
              {
                borderColor: '#1A1125',
                backgroundColor: '#3F35AB',
                opacity: isPressed ? 0.2 : 1,
              },
            ]}
          />

          <Pressable
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            onPress={handlePress}
            android_disableSound={false}
            style={[
              styles.giveButton,
              {
                backgroundColor: '#6554D1',
                borderColor: '#1A1125',
              },
              isPressed && styles.giveButtonPressed,
            ]}>
            <View
              style={[
                styles.topHighlight,
                {backgroundColor: 'rgba(255,255,255,0.24)'},
              ]}
            />

            <Text
              style={[
                styles.giveText,
                {fontFamily: theme.typography.brand, color: '#FFFFFF'},
              ]}>
              give
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartoonButtonWrap: {
    position: 'relative',
    width: 236,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonShadowPlate: {
    position: 'absolute',
    width: 216,
    height: 86,
    borderRadius: 44,
    borderWidth: 4,
    transform: [{translateY: 10}, {translateX: 4}],
  },
  giveButton: {
    width: 216,
    height: 86,
    borderRadius: 44,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    transform: [{translateX: 0}, {translateY: 0}],
  },
  giveButtonPressed: {
    transform: [{translateX: 3}, {translateY: 8}],
  },
  topHighlight: {
    position: 'absolute',
    top: 9,
    width: '76%',
    height: 18,
    borderRadius: 999,
  },
  giveText: {
    fontSize: 39,
    letterSpacing: 3,
    textTransform: 'lowercase',
    fontWeight: '700',
    lineHeight: 42,
  },
});
