import React, {createContext, useContext, useMemo, useState} from 'react';
import {useColorScheme, ViewStyle} from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

type ShadowSet = {
  subtle: ViewStyle;
  card: ViewStyle;
  press: ViewStyle;
};

export interface AppTheme {
  mode: 'light' | 'dark';
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    accent: string;
    accentPressed: string;
    teal: string;
    danger: string;
    success: string;
    overlay: string;
    surfaceMuted: string;
    borderMuted: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };
  typography: {
    brand: string;
    display: string;
    displayRegular: string;
    body: string;
    title: number;
    h2: number;
    h3: number;
    bodySize: number;
    caption: number;
    label: number;
  };
  shadows: ShadowSet;
}

function createShadow(
  color: string,
  opacity: number,
  radius: number,
  x: number,
  y: number,
  elevation: number,
): ViewStyle {
  return {
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: {width: x, height: y},
    elevation,
  };
}

const lightTheme: AppTheme = {
  mode: 'light',
  colors: {
    background: '#F0F4F8',
    surface: 'rgba(255,255,255,0.88)',
    surfaceAlt: '#FFFFFF',
    border: '#CBD5E0',
    textPrimary: '#1A202C',
    textSecondary: '#4A5568',
    textTertiary: '#718096',
    accent: '#5856D6',
    accentPressed: '#4B49B8',
    teal: '#32D4DE',
    danger: '#E53E3E',
    success: '#34C759',
    overlay: 'rgba(15, 23, 42, 0.28)',
    surfaceMuted: 'rgba(255,255,255,0.68)',
    borderMuted: 'rgba(148,163,184,0.35)',
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 18,
    pill: 999,
  },
  typography: {
    brand: 'CourierPrime-Regular',
    display: 'CormorantGaramond-Light',
    displayRegular: 'CormorantGaramond-Regular',
    body: 'CourierPrime-Regular',
    title: 36,
    h2: 28,
    h3: 22,
    bodySize: 15,
    caption: 13,
    label: 11,
  },
  shadows: {
    subtle: createShadow('#1A1125', 0.06, 4, 0, 2, 2),
    card: createShadow('#1A1125', 0.1, 12, 0, 6, 3),
    press: createShadow('#1A1125', 0.06, 2, 0, 1, 1),
  },
};

const darkTheme: AppTheme = {
  mode: 'dark',
  colors: {
    background: '#0A1628',
    surface: 'rgba(30,41,59,0.68)',
    surfaceAlt: '#1E293B',
    border: 'rgba(255,255,255,0.16)',
    textPrimary: '#F7FAFC',
    textSecondary: '#A0AEC0',
    textTertiary: '#718096',
    accent: '#BF5AF2',
    accentPressed: '#A74ED4',
    teal: '#40E0D0',
    danger: '#FF6B6B',
    success: '#30D158',
    overlay: 'rgba(2, 6, 23, 0.52)',
    surfaceMuted: 'rgba(255,255,255,0.06)',
    borderMuted: 'rgba(255,255,255,0.1)',
  },
  spacing: lightTheme.spacing,
  radius: lightTheme.radius,
  typography: lightTheme.typography,
  shadows: {
    subtle: createShadow('#000000', 0.15, 4, 0, 2, 2),
    card: createShadow('#000000', 0.25, 12, 0, 4, 3),
    press: createShadow('#000000', 0.15, 2, 0, 1, 1),
  },
};

interface ThemeContextValue {
  theme: AppTheme;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  setMode: () => {},
});

export function ThemeProvider({
  children,
  initialMode = 'light',
}: {
  children: React.ReactNode;
  initialMode?: ThemeMode;
}) {
  const deviceMode = useColorScheme();
  const [modePreference, setModePreference] = useState<ThemeMode>(initialMode);

  const resolvedMode = useMemo<'light' | 'dark'>(() => {
    if (modePreference === 'system') {
      return deviceMode === 'dark' ? 'dark' : 'light';
    }
    return modePreference;
  }, [deviceMode, modePreference]);

  const value = useMemo(
    () => ({
      theme: resolvedMode === 'dark' ? darkTheme : lightTheme,
      setMode: setModePreference,
    }),
    [resolvedMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
