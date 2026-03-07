import React, {createContext, useContext} from 'react';
import {ViewStyle} from 'react-native';

export type ThemeMode = 'light';

type ShadowSet = {
  subtle: ViewStyle;
  card: ViewStyle;
  press: ViewStyle;
};

export interface AppTheme {
  mode: 'light';
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
    surface: '#FAF7FF',
    surfaceAlt: '#F4EEFF',
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
    surfaceMuted: 'rgba(255,255,255,0.72)',
    borderMuted: 'rgba(26,17,37,0.14)',
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
    sm: 12,
    md: 16,
    lg: 20,
    xl: 28,
    pill: 999,
  },
  typography: {
    brand: 'CourierPrime-Regular',
    body: 'System',
    title: 40,
    h2: 30,
    h3: 24,
    bodySize: 17,
    caption: 13,
    label: 11,
  },
  shadows: {
    subtle: createShadow('#1A1125', 0.08, 10, 0, 4, 3),
    card: createShadow('#1A1125', 0.12, 18, 0, 10, 6),
    press: createShadow('#1A1125', 0.1, 8, 0, 4, 3),
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

export function ThemeProvider({children}: {children: React.ReactNode}) {
  return (
    <ThemeContext.Provider
      value={{
        theme: lightTheme,
        setMode: () => {},
      }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
