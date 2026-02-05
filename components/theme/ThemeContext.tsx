import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {useColorScheme, Appearance} from 'react-native';
import {LightColors, DarkColors, ThemeColors} from './ThemeColors';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  initialMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialMode = 'system',
}) => {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  // Determine if we should use dark mode
  const isDark =
    mode === 'system'
      ? systemColorScheme === 'dark'
      : mode === 'dark';

  const colors = isDark ? DarkColors : LightColors;

  // Listen for system color scheme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({colorScheme}) => {
      // Only triggers re-render if mode is 'system'
      if (mode === 'system') {
        // Force update by toggling state
        setMode('system');
      }
    });

    return () => subscription.remove();
  }, [mode]);

  const toggleMode = () => {
    setMode((current) => {
      switch (current) {
        case 'light':
          return 'dark';
        case 'dark':
          return 'system';
        case 'system':
          return 'light';
        default:
          return 'light';
      }
    });
  };

  const value: ThemeContextType = {
    mode,
    isDark,
    colors,
    setMode,
    toggleMode,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
