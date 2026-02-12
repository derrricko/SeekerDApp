/**
 * Safe haptic feedback wrapper.
 * Gracefully no-ops when the native module isn't available
 * (e.g., on emulators or before a native rebuild).
 */

let HapticFeedback: any = null;

try {
  HapticFeedback = require('react-native-haptic-feedback').default;
} catch {
  // Native module not linked — haptics will be silently skipped
}

type HapticType =
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'notificationSuccess'
  | 'notificationWarning'
  | 'notificationError';

export function triggerHaptic(type: HapticType = 'impactLight') {
  try {
    HapticFeedback?.trigger(type);
  } catch {
    // Swallow errors on devices/emulators without haptic support
  }
}
