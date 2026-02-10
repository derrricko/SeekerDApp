/**
 * Shared content constants used across screens
 */

export const WHY_CONTENT = {
  hero: 'What if giving actually felt like something?',
  problem: [
    "Every year, hundreds of billions of dollars flow into charitable causes. But somewhere between the donation and the need, the connection gets lost.",
    "Donors get a thank-you letter. Recipients see cents on the dollar\u2014most of the pie is gone before it reaches them. And the people running nonprofits? They spend more time chasing funding than doing the work they set out to do.",
  ],
  change:
    "The nonprofit industry hasn't fundamentally changed since 1969. That's over 55 years of the same model\u2014layers of overhead, endless grant applications, and donors left wondering if their gift made any difference at all.",
  vision: 'Giving should be better. So we built something that is.',
  mission:
    "Glimpse exists because you should feel what your generosity actually does. No middlemen taking their cut. No black box between you and the person you helped. Just you, helping someone who needs it\u2014documented, verified, and meaningful to both of you.",
  whyGlimpse: {
    title: 'Why "Glimpse"?',
    subtitle: 'The name carries three meanings:',
    meanings: [
      'A glimpse into the Kingdom\u2014sacrificial giving reflects something bigger than ourselves',
      'A glimpse into the work\u2014see the real effort partners put in on the ground',
      "A glimpse into someone's life\u2014witness the real impact of your gift",
    ],
  },
};

export const HOW_CONTENT = {
  hero: 'Pick a direction. We handle the rest.',
  intro:
    "You're not here to browse causes or shop for a story that moves you. You're here to make a difference\u2014and trust us to do it right.",
  steps: [
    {
      number: '1',
      title: 'Choose your direction',
      description: 'Select a community you want to support:',
      options: [
        'Single moms getting back on their feet',
        'Low-income kids who need a hand up',
        'Neighbors experiencing homelessness',
        'People walking the road of recovery',
        'Seniors who could use a little help',
      ],
    },
    {
      number: '2',
      title: 'Give',
      description:
        "Your full donation goes to work. No platform fees. No admin cuts. Just groceries, gas, and rent\u2014the stuff that actually matters.",
    },
    {
      number: '3',
      title: 'Wait for it',
      description:
        "You won't know exactly who you helped\u2014until after your gift lands. Then you'll see who it reached.",
    },
    {
      number: '4',
      title: 'See the impact',
      description:
        'Photos. Receipts. The real story. Documented and delivered\u2014proof that your generosity landed. Updates usually appear in the app within 48 hours.',
    },
  ],
  closing:
    'Think of us as your personal giving team. We do the legwork. You get the proof.',
};

export const FAQ_DATA = [
  {
    id: 'verified',
    question: 'How are needs verified?',
    answer:
      "Every need is personally vetted. We talk to the people who actually know\u2014community members, teachers, family, church leaders. The boots-on-the-ground people who have real relationships. You can't fake that kind of connection.",
  },
  {
    id: 'blockchain',
    question: 'Why use blockchain?',
    answer:
      "Trust, but verify. Every donation is recorded on Solana\u2014a public, permanent ledger anyone can verify. No one can edit it. No one can hide it. Not even us. It's instant, costs almost nothing to record, and completely transparent.",
  },
  {
    id: 'pick-person',
    question: 'Do I pick the specific person?',
    answer:
      "No\u2014and that's intentional. You pick a need, not a person. After your gift is deployed, you'll see exactly who it helped.",
  },
  {
    id: 'selection',
    question: 'How do you decide who receives my gift?',
    answer:
      "We select recipients based on merit, urgency of need, and queue order. We're committed to full transparency\u2014we'll be documenting everything we do and how we make decisions as we grow.",
  },
  {
    id: 'communicate',
    question: 'Can I communicate with the recipient?',
    answer:
      "You can leave a note of encouragement with your gift. We don't expect recipients to respond\u2014but if they choose to, we'll make sure it reaches you.",
  },
  {
    id: 'minimum',
    question: "What's the minimum donation?",
    answer: '$10.',
  },
  {
    id: 'fees',
    question: 'What percentage goes to fees?',
    answer:
      'For our Seeker launch: zero. No platform fees. No admin cuts. Your full gift goes to the need.',
  },
  {
    id: 'overfunding',
    question: 'What if more is raised than a need costs?',
    answer:
      "Every dollar goes to work. If a need is fully funded and there\u2019s money left over, the excess is applied to the next verified need in the queue. If you\u2019d prefer a refund, just reach out\u2014we\u2019ll take care of it.",
  },
  {
    id: 'tax',
    question: 'Is my donation tax-deductible?',
    answer: 'Yes.',
  },
  {
    id: 'location',
    question: 'Where does Glimpse operate?',
    answer:
      "We're based in Muscatine, Iowa. Partners are continually added as they are vetted.",
  },
  {
    id: 'who',
    question: 'Who is behind Glimpse?',
    answer:
      "A small team that believes giving should feel like something. We know every partner by name and stake our reputation on every gift. This isn't a platform. It's a promise.",
  },
];

// ─── Needs-based giving model ───────────────────────────────────────────────

export interface Need {
  id: string;
  amount: number;
  title: string;
  description: string;
  partner?: string;
  funded: number;
  icon: string;
}

export const NEEDS: Need[] = [
  {
    id: 'shower',
    amount: 25,
    title: 'A clean shower and fresh clothes',
    description:
      "For someone living on the street, a hot shower and clean clothes aren't just hygiene\u2014they're dignity. The feeling of being human again. Walking into a room without the weight of shame.",
    partner: 'BeHeard Movement \u00B7 Tulsa, OK',
    funded: 0,
    icon: 'shower',
  },
  {
    id: 'groceries',
    amount: 100,
    title: 'Groceries for a single mom',
    description:
      "She skips meals so her kids don't have to. Your gift fills a fridge, quiets the worry at 2am, and lets a mom sit at the table with her family instead of staring at an empty one.",
    funded: 0,
    icon: 'basket-shopping',
  },
  {
    id: 'wardrobe',
    amount: 250,
    title: 'New wardrobe for a foster kid',
    description:
      "When a child enters foster care, everything they own fits in a trash bag\u2014if they have anything at all. New clothes that are theirs say something no words can: you matter, and someone thought of you.",
    funded: 0,
    icon: 'shirt',
  },
  {
    id: 'tires',
    amount: 400,
    title: 'New tires for a family in need',
    description:
      "She white-knuckles the steering wheel every morning, praying the bald tires hold\u2014to get her kids to school, herself to work, and everyone home safe. New tires mean she can stop holding her breath.",
    funded: 0,
    icon: 'car',
  },
  {
    id: 'rent',
    amount: 1000,
    title: "Full month's rent for a family",
    description:
      "An eviction notice doesn't just mean losing a home\u2014it means a child wondering where they'll sleep tomorrow. One month's rent buys a family the one thing money can't usually buy: time to breathe.",
    funded: 0,
    icon: 'house',
  },
];

export const CHIP_IN_AMOUNTS = [10, 25, 50] as const;

export const CUSTOM_TIER = {
  id: 'custom',
  title: 'Something bigger?',
  subtitle: "Let's talk.",
  cta: 'Connect \u2192',
};

export const ONBOARDING_SLIDES = [
  {
    id: 'transparency',
    headline: 'See where your gift goes',
    body: 'Your full donation reaches someone who needs it. No middlemen. No mystery.',
  },
  {
    id: 'direction',
    headline: 'Pick a direction, not a person',
    body: 'Choose a community to support. We handle the rest.',
  },
  {
    id: 'proof',
    headline: 'Get proof it landed',
    body: 'Photos. Receipts. Real impact\u2014documented on-chain.',
  },
  {
    id: 'ready',
    headline: 'Ready?',
    body: 'Your generosity is about to mean something.',
  },
];
