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
    background: '#EDE8FA',
    surface: '#F3EFFF',
    surfaceAlt: '#EDE8FA',
    border: '#1A1125',
    textPrimary: '#1A1125',
    textSecondary: '#4C4466',
    textTertiary: '#6E6787',
    accent: '#6554D1',
    accentPressed: '#5646C4',
    teal: '#47CBCD',
    danger: '#A83D62',
    success: '#2A9274',
    overlay: 'rgba(12, 10, 22, 0.3)',
    surfaceMuted: 'rgba(26,17,37,0.04)',
    borderMuted: 'rgba(26,17,37,0.12)',
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
    sm: 0,
    md: 0,
    lg: 0,
    xl: 0,
    pill: 999,
  },
  typography: {
    brand: 'CourierPrime-Regular',
    body: 'System',
    title: 44,
    h2: 28,
    h3: 22,
    bodySize: 18,
    caption: 14,
    label: 12,
  },
  shadows: {
    subtle: createShadow('#1A1125', 1, 0, 2, 2, 2),
    card: createShadow('#1A1125', 1, 0, 4, 4, 4),
    press: createShadow('#1A1125', 1, 0, 2, 2, 2),
  },
};

const darkTheme: AppTheme = {
  mode: 'dark',
  colors: {
    background: '#0A1628',
    surface: 'rgba(30,41,59,0.78)',
    surfaceAlt: '#13223A',
    border: 'rgba(255,255,255,0.12)',
    textPrimary: '#F7FAFC',
    textSecondary: '#A0AEC0',
    textTertiary: '#718096',
    accent: '#BF5AF2',
    accentPressed: '#A74ED4',
    teal: '#40E0D0',
    danger: '#FF6A85',
    success: '#30D158',
    overlay: 'rgba(3, 6, 12, 0.45)',
    surfaceMuted: 'rgba(255,255,255,0.04)',
    borderMuted: 'rgba(255,255,255,0.08)',
  },
  spacing: lightTheme.spacing,
  radius: lightTheme.radius,
  typography: lightTheme.typography,
  shadows: {
    subtle: createShadow('#000000', 0.2, 3, 0, 2, 2),
    card: createShadow('#000000', 0.3, 8, 0, 4, 3),
    press: createShadow('#000000', 0.2, 2, 0, 1, 1),
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
