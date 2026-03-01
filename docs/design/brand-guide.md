# GLIMPSE — Brand Guide

> **Documenting Kindness**
>
> Transparent blockchain donations on Solana. Every gift tracked. Every impact documented.

---

## Table of Contents

1. [Brand Overview](#brand-overview)
2. [Logo System](#logo-system)
3. [Color Palette](#color-palette)
4. [Typography](#typography)
5. [Voice & Tone](#voice--tone)
6. [Design System](#design-system)
7. [Iconography](#iconography)
8. [Social Media Assets](#social-media-assets)
9. [Animation Specs](#animation-specs)
10. [File Structure](#file-structure)
11. [Theme Tokens (TypeScript)](#theme-tokens-typescript)
12. [Quick Reference Card](#quick-reference-card)

---

## Brand Overview

### Mission

Glimpse bridges the gap between charitable giving and verified impact. Every donation is recorded on Solana, every act of kindness is documented with proof, and every donor sees exactly where their money goes.

### Values

- **Transparency** — Every transaction is public, verifiable, permanent
- **Dignity** — We serve people, not "cases." Names, not numbers
- **Connection** — Donors don't just give — they witness the outcome
- **Simplicity** — No friction, no jargon, no gatekeeping

### Audience

- Primary: Gen Z & Millennials (18–35) who are crypto-native or crypto-curious
- Secondary: Faith-driven givers, nonprofit partners, Solana community
- Persona: Someone who wants to help but doesn't trust traditional charity overhead

### Biblical Anchor

> "But when you give to the needy, do not let your left hand know what your right hand is doing." — **Matthew 6:3**

### Social

- Handle: **@DerrickWKing**
- Hashtags: `#GiveAGlimpse` `#DocumentingKindness` `#SeeTheProof` `#BuiltOnSolana` `#TransparentGiving`

---

## Logo System

### The G Lettermark

A broken circle representing a "glimpse" through an opening — the moment kindness becomes visible. The horizontal bar draws the eye inward.

#### SVG Code

```svg
<svg viewBox="0 0 64 64" fill="none">
  <circle cx="32" cy="32" r="28" stroke="CURRENT_COLOR" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="140 36"/>
  <line x1="32" y1="32" x2="48" y2="32" stroke="CURRENT_COLOR" stroke-width="2.5" stroke-linecap="round"/>
</svg>
```

**Stroke width guidance:**
| Size | Stroke Width |
|------|-------------|
| 64px+ | 2.5 |
| 32–64px | 3 |
| 24–32px | 3.5 |
| < 24px | Not recommended |

#### Wordmark

- Font: Courier Prime, Regular 400
- Text: `GLIMPSE` (all uppercase)
- Letter-spacing: 6px
- Usage in body copy: "Glimpse" (title case)

#### Full Lockup

```
[ G Mark ]
[ 2px gradient line ]
[ GLIMPSE wordmark ]
```

Lockup stacks vertically with 16px gap between mark and line, 16px gap between line and wordmark. The gradient line is 32px wide, using the primary gradient.

### Variants

| Variant | Mark Color | Wordmark Color | Line |
|---------|-----------|---------------|------|
| Dark mode | #BF5AF2 | #F7FAFC | gradient(#BF5AF2, #40E0D0) |
| Light mode | #5856D6 | #1A202C | gradient(#5856D6, #32D4DE) |
| On gradient | #FFFFFF | #FFFFFF | rgba(255,255,255,0.6) |

### Clearspace

Minimum clearspace around any logo variant = 1x the height of the G mark.

### Minimum Size

- G Mark alone: 32px minimum (24px for favicons only)
- Wordmark alone: 80px width minimum
- Full lockup: 120px height minimum

### Usage Don'ts

- Do NOT stretch or distort proportions
- Do NOT use off-brand colors
- Do NOT rotate
- Do NOT add drop shadows, glow, bevel, or other effects
- Do NOT place on busy/photographic backgrounds without overlay
- Do NOT use below minimum size

---

## Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Purple Light | `#5856D6` | Light mode primary, buttons, links, accents |
| Purple Dark | `#BF5AF2` | Dark mode primary, buttons, links, accents |
| Teal Light | `#32D4DE` | Light mode secondary, highlights, badges |
| Teal Dark | `#40E0D0` | Dark mode secondary, highlights, badges |

### Neutral Colors — Light Mode

| Name | Hex | Usage |
|------|-----|-------|
| Background | `#F0F4F8` | Canvas, page background |
| Glass | `rgba(255,255,255,0.65)` | Card surfaces (with blur) |
| Glass Border | `rgba(255,255,255,0.3)` | Card borders |
| Text Primary | `#1A202C` | Headlines, key content |
| Text Secondary | `#4A5568` | Body text, descriptions |
| Text Tertiary | `#718096` | Metadata, timestamps, hints |

### Neutral Colors — Dark Mode

| Name | Hex | Usage |
|------|-----|-------|
| Background | `#0A1628` | Canvas, page background |
| Glass | `rgba(30,41,59,0.65)` | Card surfaces (with blur) |
| Glass Border | `rgba(255,255,255,0.08)` | Card borders |
| Text Primary | `#F7FAFC` | Headlines, key content |
| Text Secondary | `#A0AEC0` | Body text, descriptions |
| Text Tertiary | `#718096` | Metadata, timestamps, hints |

### Semantic Colors

| Name | Light | Dark | Usage |
|------|-------|------|-------|
| Success | `#34C759` | `#30D158` | Verified badges, confirmations |
| Warning | `#FF9500` | `#FF9F0A` | Pending states, cautions |
| Error | `#FF3B30` | `#FF453A` | Failures, destructive actions |

### Gradients

| Name | Value | Usage |
|------|-------|-------|
| Primary (Light) | `linear-gradient(135deg, #5856D6, #32D4DE)` | Brand line, accents, backgrounds |
| Primary (Dark) | `linear-gradient(135deg, #BF5AF2, #40E0D0)` | Brand line, accents, backgrounds |
| Glow | `radial-gradient(ellipse, rgba(88,86,214,0.08), transparent)` | Ambient background glow |

---

## Typography

### Font Imports

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### Font Families

| Role | Family | Weights | Usage |
|------|--------|---------|-------|
| Display / Headlines | Cormorant Garamond | 300, 400, 600 | Section headings, amounts, editorial text |
| Body / Brand / UI | Courier Prime | 400, 700 | Wordmark, taglines, labels, descriptions, buttons |
| System / Fallback | Inter | 300–700 | Body text, system UI, form inputs |

### Type Scale

| Size | Font | Weight | Spacing | Usage | Example |
|------|------|--------|---------|-------|---------|
| 48px | Courier Prime | 400 | 6px | Brand display | `GLIMPSE` |
| 36px | Cormorant Garamond | 300 | — | Hero amounts | `$25` |
| 28px | Cormorant Garamond | 300 | — | Section headings | `Give a Glimpse` |
| 18px | Cormorant Garamond | 600 | — | Card titles | `A Shower & Clean Clothes` |
| 16px | Inter | 400 | — | Body text | `Every gift tracked.` |
| 13px | Courier Prime | 400 | 3px | Tagline | `DOCUMENTING KINDNESS` |
| 10px | Courier Prime | 400 | 0.2em | Labels (uppercase) | `CHOOSE YOUR GIFT` |
| 9px | Courier Prime | 400 | — | Metadata, refs | `Matthew 6:3 · @DerrickWKing` |

### React Native Font Mapping

```typescript
const fonts = {
  display: {
    light: { fontFamily: 'CormorantGaramond-Light', fontWeight: '300' },
    regular: { fontFamily: 'CormorantGaramond-Regular', fontWeight: '400' },
    semiBold: { fontFamily: 'CormorantGaramond-SemiBold', fontWeight: '600' },
  },
  body: {
    regular: { fontFamily: 'CourierPrime-Regular', fontWeight: '400' },
    bold: { fontFamily: 'CourierPrime-Bold', fontWeight: '700' },
  },
  system: {
    regular: { fontFamily: 'Inter-Regular', fontWeight: '400' },
    medium: { fontFamily: 'Inter-Medium', fontWeight: '500' },
    semiBold: { fontFamily: 'Inter-SemiBold', fontWeight: '600' },
  },
};
```

---

## Voice & Tone

### Principles

| We Are | We Are Not |
|--------|-----------|
| **Direct** — Short sentences. Real numbers. No hedging. | **Preachy** — We don't guilt-trip. We inspire through proof. |
| **Purposeful** — Every word earns its place. | **Hypey** — No "revolutionary" or "game-changing." |
| **Human** — Names, not "users." Stories, not "use cases." | **Cold** — We care deeply. That's the whole point. |
| **Confident** — We believe in what we're building. | **Vague** — Specifics always. "$25" not "a small donation." |

### Do / Don't Examples

#### Do

> "$25. A warm shower. Fresh clothes. You'll see the proof."

> "Every transaction on Solana. Transparent. Permanent."

> "James got a warm meal today. Here's the receipt."

> "100 glimpses documented. 100 lives changed."

#### Don't

> "Your generous donation can help make a real difference in someone's life today!"

> "Leveraging cutting-edge blockchain technology to revolutionize charitable giving!"

> "Thanks to our amazing community, we were able to facilitate a positive outcome!"

> "We hope to one day create a more transparent future for philanthropy."

### Hashtags

| Hashtag | Usage |
|---------|-------|
| `#GiveAGlimpse` | Primary campaign tag |
| `#DocumentingKindness` | Brand tagline tag |
| `#SeeTheProof` | Impact proof posts |
| `#BuiltOnSolana` | Tech/platform posts |
| `#TransparentGiving` | Mission posts |

### Bio Templates

**X/Twitter:**
> Transparent donations on Solana. Every gift tracked. Every impact documented. #DocumentingKindness

**Instagram:**
> Documenting Kindness. Every gift tracked. Every impact proven. Built on @solana. Coming to @solanamobile Seeker.

**LinkedIn:**
> Glimpse is a transparent donation platform built on Solana. We connect donors directly to verified impact — every gift tracked, every outcome documented.

---

## Design System

### Glass Card Component

The signature UI pattern: iOS 18-style glassmorphism.

#### CSS (Web)

```css
/* Light Mode */
.glass-card {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

/* Dark Mode */
.glass-card-dark {
  background: rgba(30, 41, 59, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  padding: 20px;
}
```

#### React Native

```typescript
import { BlurView } from '@react-native-community/blur';

const GlassCard = ({ children }) => {
  const { colors, isDark } = useTheme();
  return (
    <View style={{
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(255, 255, 255, 0.3)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 24,
    }}>
      {Platform.OS === 'ios' && (
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={20}
        />
      )}
      <View style={{
        backgroundColor: isDark
          ? 'rgba(30, 41, 59, 0.65)'
          : 'rgba(255, 255, 255, 0.65)',
        padding: 20,
      }}>
        {children}
      </View>
    </View>
  );
};
```

### Buttons

| Property | Value |
|----------|-------|
| Border Radius | 10px |
| Padding | 12px 24px |
| Font | Courier Prime 700, 13px |
| Letter Spacing | 0.3px |
| Primary BG | `#5856D6` (light) / `#BF5AF2` (dark) |
| Primary Shadow | `0 3px 10px rgba(88, 86, 214, 0.3)` |
| Secondary | Transparent bg, 1.5px border in primary color |
| Teal BG | `#32D4DE` (light) / `#40E0D0` (dark) |
| Disabled BG | `rgba(255, 255, 255, 0.06)` |
| Disabled Text | `#718096` |

### Interactions

| Property | Value |
|----------|-------|
| Press Scale | `scale(0.98)` |
| Animation | Spring (mass: 1, damping: 15, stiffness: 150) |
| Duration | 200ms |
| Hover Shadow | Intensified (+2px offset, +0.1 opacity) |

### Spacing Scale

Base unit: **4px**

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Tight gaps, icon padding |
| `sm` | 8px | Inline spacing, small gaps |
| `md` | 12px | Component internal padding |
| `base` | 16px | Standard padding, card gaps |
| `lg` | 20px | Section padding |
| `xl` | 24px | Large gaps |
| `2xl` | 32px | Section spacing |
| `3xl` | 48px | Major section breaks |

### Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `badge` | 4px | Status badges, tags |
| `input` | 9px | Text inputs, dropdowns |
| `button` | 10px | All buttons |
| `card` | 16px | Glass cards, content cards |
| `modal` | 18px | Modals, sheets |
| `full` | 50% | Icons, avatars |

### Shadows

| Name | Light Mode | Dark Mode |
|------|-----------|-----------|
| Card | `0 8px 24px rgba(0,0,0,0.08)` | `0 8px 24px rgba(0,0,0,0.3)` |
| Button | `0 3px 10px rgba(88,86,214,0.3)` | `0 3px 10px rgba(191,90,242,0.3)` |
| Elevated | `0 16px 48px rgba(0,0,0,0.15)` | `0 16px 48px rgba(0,0,0,0.5)` |
| Phone Frame | `0 25px 60px rgba(0,0,0,0.5)` | `0 25px 60px rgba(0,0,0,0.5)` |

---

## Iconography

### Style

| Property | Value |
|----------|-------|
| Style | Line icons only (no filled) |
| Stroke Width | 1.5px |
| Stroke Linecap | Round |
| Stroke Linejoin | Round |
| ViewBox | 24 x 24 |
| Padding | 2px internal |
| Color | Inherits from text or brand color |

### Core Icons

| Icon | Name | Usage |
|------|------|-------|
| Heart | Give | Give tab, donation actions |
| Image/Gallery | Glimpses | Glimpses tab, impact photos |
| Activity/Pulse | Board | Leaderboard tab, activity |
| Clock | History | Transaction history |
| Check Circle | Verified | Proof-of-impact badges |
| Plus | Custom | Custom donation |
| Arrow Right | CTA | Call-to-action arrows |

---

## Social Media Assets

### Dimensions Reference

| Asset | Dimensions | Ratio | Background |
|-------|-----------|-------|-----------|
| Profile Picture | 400 x 400px | 1:1 | #0A1628, G mark centered |
| X/Twitter Banner | 1500 x 500px | 3:1 | #0A1628 + gradient glow |
| LinkedIn Banner | 1584 x 396px | 4:1 | #0A1628 + gradient glow |
| Instagram Post | 1080 x 1080px | 1:1 | Varies by template |
| Instagram Story | 1080 x 1920px | 9:16 | Varies by template |
| X/Twitter Post | 1200 x 675px | 16:9 | Varies by template |
| OG Image | 1200 x 630px | ~1.9:1 | #0A1628 + full lockup |
| App Icon | 1024 x 1024px | 1:1 | #0A1628, G mark |
| Favicon | 32 x 32px | 1:1 | Transparent, G mark |
| Feature Graphic | 1024 x 500px | ~2:1 | #0A1628 + wordmark |

### Post Templates

1. **Impact Stat** — Big number + label on dark bg. Weekly/monthly data.
2. **Quote / Mission** — Pull quote on gradient bg. Vision, scripture, mission.
3. **Feature Highlight** — Icon + headline + description on dark bg. Feature announcements.
4. **Announcement** — Badge + headline + CTA on gradient bg. Launches, milestones.
5. **Thread Opener** — G mark + headline + thread count on dark bg. Storytelling threads.
6. **Impact Story** — Name + description + verified badge. Weekly proof posts.
7. **Milestone** — Big number on gradient bg. Growth celebrations.

---

## Animation Specs

### Core Animations

#### fadeUp

```css
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- Duration: 0.8–1.2s
- Easing: `ease-out`
- Usage: Section entrances, card reveals, content loading

#### brandLine

```css
@keyframes brandLine {
  from { width: 0; }
  to { width: 56px; }
}
```

- Duration: 0.8–1s
- Easing: `ease-out`
- Delay: After brand text appears (0.6–1s)
- Usage: Brand line reveal on welcome/closing screens

#### Stagger Pattern

```
Element 1: delay 0.3s
Element 2: delay 0.5s
Element 3: delay 0.7s
Element 4: delay 0.9s
```

- Offset: 0.2s between siblings
- Usage: Card lists, tier reveals, leaderboard rows

#### Press Animation

```typescript
// React Native
const pressAnim = useRef(new Animated.Value(1)).current;

const handlePressIn = () => {
  Animated.spring(pressAnim, {
    toValue: 0.98,
    useNativeDriver: true,
    speed: 50,
    bounciness: 4,
  }).start();
};

const handlePressOut = () => {
  Animated.spring(pressAnim, {
    toValue: 1,
    useNativeDriver: true,
    speed: 50,
    bounciness: 4,
  }).start();
};
```

#### Transition Specs

| Animation | Duration | Easing | Delay |
|-----------|----------|--------|-------|
| Section fade-in | 0.8s | ease-out | — |
| Card reveal | 0.6–0.8s | ease-out | staggered |
| Brand reveal | 1.6–2.4s | cubic-bezier(0.25, 0.46, 0.45, 0.94) | 0.2s |
| Line expand | 0.8–1.8s | ease-out | after brand |
| Press scale | 200ms | spring | immediate |
| Nav bg change | 0.3s | ease | on scroll |
| Hover effects | 0.3s | ease | immediate |

---

## File Structure

```
SeekerDApp/
├── assets/
│   ├── brand/
│   │   ├── g-mark.svg            # G lettermark SVG
│   │   ├── g-mark-light.svg      # Light mode variant
│   │   ├── g-mark-gradient.svg   # White on gradient variant
│   │   ├── wordmark.svg          # GLIMPSE wordmark
│   │   └── lockup.svg            # Full lockup (mark + line + wordmark)
│   ├── icons/
│   │   ├── heart.svg
│   │   ├── gallery.svg
│   │   ├── activity.svg
│   │   └── ...
│   └── social/
│       ├── profile-400.png
│       ├── banner-x-1500x500.png
│       ├── banner-linkedin-1584x396.png
│       ├── og-image-1200x630.png
│       └── templates/
│           ├── impact-stat.png
│           ├── quote-mission.png
│           └── feature-highlight.png
├── components/
│   ├── theme/
│   │   ├── index.ts              # useTheme hook
│   │   ├── colors.ts             # Color tokens
│   │   ├── typography.ts         # Font tokens
│   │   └── spacing.ts            # Spacing/radius tokens
│   ├── GlassCard.tsx
│   ├── GlassButton.tsx
│   └── ...
├── brand-identity.html           # Brand identity presentation
├── social-media-kit.html         # Social media kit presentation
├── BRAND-GUIDE.md                # This file
└── CLAUDE.md                     # Development guide
```

---

## Theme Tokens (TypeScript)

### Colors

```typescript
export const colors = {
  light: {
    primary: '#5856D6',
    secondary: '#32D4DE',
    background: '#F0F4F8',
    glass: 'rgba(255, 255, 255, 0.65)',
    glassBorder: 'rgba(255, 255, 255, 0.3)',
    textPrimary: '#1A202C',
    textSecondary: '#4A5568',
    textTertiary: '#718096',
    shadow: '#000000',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
  },
  dark: {
    primary: '#BF5AF2',
    secondary: '#40E0D0',
    background: '#0A1628',
    glass: 'rgba(30, 41, 59, 0.65)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#F7FAFC',
    textSecondary: '#A0AEC0',
    textTertiary: '#718096',
    shadow: '#000000',
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
  },
} as const;

export type ColorMode = keyof typeof colors;
export type ColorTokens = typeof colors.light;
```

### Typography

```typescript
export const typography = {
  brandDisplay: {
    fontFamily: 'Courier Prime',
    fontSize: 48,
    fontWeight: '400' as const,
    letterSpacing: 6,
    textTransform: 'uppercase' as const,
  },
  heroAmount: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 36,
    fontWeight: '300' as const,
  },
  sectionHeading: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 28,
    fontWeight: '300' as const,
  },
  cardTitle: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  body: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400' as const,
  },
  tagline: {
    fontFamily: 'Courier Prime',
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
  },
  label: {
    fontFamily: 'Courier Prime',
    fontSize: 10,
    fontWeight: '400' as const,
    letterSpacing: 3.2, // 0.2em equivalent
    textTransform: 'uppercase' as const,
  },
  metadata: {
    fontFamily: 'Courier Prime',
    fontSize: 9,
    fontWeight: '400' as const,
  },
} as const;
```

### Spacing

```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const radius = {
  badge: 4,
  input: 9,
  button: 10,
  card: 16,
  modal: 18,
  full: 9999,
} as const;
```

---

## Quick Reference Card

```
GLIMPSE — Quick Reference
─────────────────────────────────────────

Brand:     GLIMPSE (uppercase in branding)
Tagline:   Documenting Kindness
Alt:       Creating Connections, Documenting Kindness
Handle:    @DerrickWKing
Verse:     Matthew 6:3

Colors:
  Purple   #5856D6 / #BF5AF2
  Teal     #32D4DE / #40E0D0
  BG       #F0F4F8 / #0A1628
  Text     #1A202C / #F7FAFC
  Gradient 135deg, purple → teal

Typography:
  Display  Cormorant Garamond (300, 400, 600)
  Brand    Courier Prime (400, 700)
  System   Inter (300–700)

Design:
  Glass    rgba(255,255,255,0.65), blur(20px)
  Cards    radius 16px
  Buttons  radius 10px, pad 12/24
  Press    scale(0.98), spring
  Spacing  4px base

Voice:
  DO       Direct. Numbers. Proof. Human.
  DON'T    Preachy. Hypey. Vague. Corporate.
```

---

*GLIMPSE Brand Guide v1.0 — @DerrickWKing*
