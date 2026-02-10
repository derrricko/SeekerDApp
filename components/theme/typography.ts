import {Platform, TextStyle} from 'react-native';

const DISPLAY_FONT = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const SYSTEM_FONT = Platform.OS === 'ios' ? 'System' : undefined;

export const Typography = {
  // Display — brand name, hero titles
  display: {
    fontSize: 44,
    fontWeight: '200' as TextStyle['fontWeight'],
    letterSpacing: 2,
    lineHeight: 52,
    fontFamily: DISPLAY_FONT,
  },
  // Heading — section titles, card amounts
  heading: {
    fontSize: 32,
    fontWeight: '200' as TextStyle['fontWeight'],
    letterSpacing: 1,
    lineHeight: 40,
    fontFamily: SYSTEM_FONT,
  },
  // Subheading — card titles, modal titles
  subheading: {
    fontSize: 22,
    fontWeight: '300' as TextStyle['fontWeight'],
    letterSpacing: 0.5,
    lineHeight: 30,
    fontFamily: SYSTEM_FONT,
  },
  // Body — primary content text, buttons
  body: {
    fontSize: 17,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 26,
    fontFamily: SYSTEM_FONT,
  },
  // Body Small — secondary text, labels, descriptions
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 20,
    fontFamily: SYSTEM_FONT,
  },
  // Caption — metadata, timestamps, version info
  caption: {
    fontSize: 12,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0.3,
    lineHeight: 16,
    fontFamily: SYSTEM_FONT,
  },
  // Brand — specifically for "Glimpse" brand name in headers
  brand: {
    fontSize: 24,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: 4,
    lineHeight: 30,
    fontFamily: DISPLAY_FONT,
  },
  // Button text styles
  buttonLarge: {
    fontSize: 17,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0.5,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0.3,
  },
  // Label — form labels, nav labels
  label: {
    fontSize: 14,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: 0.3,
  },
};
