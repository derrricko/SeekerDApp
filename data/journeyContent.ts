/**
 * 11-slide onboarding journey — "Make the Donor the Hero"
 *
 * Story arc: Your neighbors need help → You can help them directly →
 * This is personal → Begin.
 *
 * Three acts:
 *   ACT 1 (1-4): Your Neighbors — slower pace, grounding in real human moments
 *   ACT 2 (5-8): You Can — normal pace, Seeker + Glimpse as the bridge
 *   ACT 3 (9-11): Your Impact — faster, product preview, the invitation
 */

export type JourneyAct = 1 | 2 | 3;

export type HapticEvent =
  | 'impactLight'
  | 'impactMedium'
  | 'notificationSuccess';

export interface JourneySlideData {
  id: string;
  act: JourneyAct;
  headlineBefore: string;
  emphasisWord: string;
  headlineAfter: string;
  subtitle?: string;
  visualId: string;
  ctaLabel: string;
  /** Use Typography.display (44px Georgia) for emotional peaks */
  isPeak: boolean;
  entranceDuration: number;
  stagger: number;
  entranceHaptic?: HapticEvent;
  ctaHaptic?: HapticEvent;
}

export const JOURNEY_SLIDES: JourneySlideData[] = [
  // ─── ACT 1: YOUR NEIGHBORS ─────────────────────────────────────
  {
    id: 'neighbor',
    act: 1,
    headlineBefore: 'Right now, your ',
    emphasisWord: 'neighbor',
    headlineAfter: ' needs help.',
    subtitle: 'Not across the world. Down the street.',
    visualId: 'neighbor',
    ctaLabel: 'Continue',
    isPeak: true,
    entranceDuration: 500,
    stagger: 150,
  },
  {
    id: 'mom',
    act: 1,
    headlineBefore: 'She skipped dinner so her kids wouldn\u2019t have to.',
    emphasisWord: '',
    headlineAfter: '',
    subtitle: 'She packs their lunches at 5am before her first shift.',
    visualId: 'mom',
    ctaLabel: 'Continue',
    isPeak: false,
    entranceDuration: 500,
    stagger: 150,
  },
  {
    id: 'notice',
    act: 1,
    headlineBefore: 'The notice said seventy-two ',
    emphasisWord: 'hours.',
    headlineAfter: '',
    subtitle: 'His daughter asked why they\u2019re packing boxes.',
    visualId: 'notice',
    ctaLabel: 'Continue',
    isPeak: false,
    entranceDuration: 500,
    stagger: 150,
  },
  {
    id: 'knew',
    act: 1,
    headlineBefore: 'You\u2019d help if you ',
    emphasisWord: 'knew.',
    headlineAfter: '',
    visualId: 'knew',
    ctaLabel: 'Continue',
    isPeak: false,
    entranceDuration: 500,
    stagger: 150,
    entranceHaptic: 'impactLight',
  },

  // ─── ACT 2: YOU CAN ────────────────────────────────────────────
  {
    id: 'turn',
    act: 2,
    headlineBefore: 'Now you ',
    emphasisWord: 'can.',
    headlineAfter: '',
    visualId: 'turn',
    ctaLabel: 'Tell me how',
    isPeak: true,
    entranceDuration: 300,
    stagger: 100,
    entranceHaptic: 'impactMedium',
  },
  {
    id: 'direct',
    act: 2,
    headlineBefore: 'This phone makes giving ',
    emphasisWord: 'direct.',
    headlineAfter: '',
    subtitle: 'No middlemen. Your full dollar arrives.',
    visualId: 'direct',
    ctaLabel: 'Continue',
    isPeak: false,
    entranceDuration: 300,
    stagger: 100,
  },
  {
    id: 'proof',
    act: 2,
    headlineBefore: 'And then you ',
    emphasisWord: 'see',
    headlineAfter: ' what happened.',
    subtitle: 'A photo. A name. A real story.',
    visualId: 'proof',
    ctaLabel: 'Continue',
    isPeak: false,
    entranceDuration: 300,
    stagger: 100,
  },
  {
    id: 'hero',
    act: 2,
    headlineBefore: '',
    emphasisWord: 'You\u2019re',
    headlineAfter: ' not just giving money.',
    subtitle: 'You\u2019re giving someone their week back.',
    visualId: 'hero',
    ctaLabel: 'Continue',
    isPeak: true,
    entranceDuration: 300,
    stagger: 100,
    entranceHaptic: 'impactMedium',
  },

  // ─── ACT 3: YOUR IMPACT ────────────────────────────────────────
  {
    id: 'impact',
    act: 3,
    headlineBefore: 'Groceries. Rent. A clean ',
    emphasisWord: 'shower.',
    headlineAfter: '',
    subtitle: 'Real needs from real neighbors.',
    visualId: 'impact',
    ctaLabel: 'Continue',
    isPeak: false,
    entranceDuration: 300,
    stagger: 80,
  },
  {
    id: 'story',
    act: 3,
    headlineBefore: 'The ',
    emphasisWord: 'real',
    headlineAfter: ' story, delivered to you.',
    visualId: 'story',
    ctaLabel: 'Continue',
    isPeak: false,
    entranceDuration: 300,
    stagger: 80,
  },
  {
    id: 'invitation',
    act: 3,
    headlineBefore: 'Every act of kindness starts with ',
    emphasisWord: 'someone.',
    headlineAfter: '',
    subtitle: 'This is your Glimpse.',
    visualId: 'invitation',
    ctaLabel: 'Begin',
    isPeak: true,
    entranceDuration: 300,
    stagger: 80,
    ctaHaptic: 'notificationSuccess',
  },
];

export const TOTAL_SLIDES = JOURNEY_SLIDES.length;
