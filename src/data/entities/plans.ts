import type { Plan } from '@/data/types'

/**
 * The single pricing source: the marketing page (M1) and Billing (H1) both
 * render from these records, so the two can never drift.
 */
export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    credits: 100,
    entitlements: {
      channels: 2,
      slotsPerDay: 1,
      studio: false,
      modelTiers: ['free'],
      features: ['1 post a day', '2 connected channels', 'Preset tones', 'Balanced drafting model'],
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 29,
    credits: 500,
    entitlements: {
      channels: 4,
      slotsPerDay: 2,
      studio: true,
      modelTiers: ['free', 'pro'],
      features: [
        'Up to 2 posts a day',
        'All channels',
        'Custom tones',
        'Creative Studio',
        'Creative + Precise drafting models',
      ],
    },
  },
  {
    id: 'studio',
    name: 'Studio',
    priceMonthly: 79,
    credits: 1500,
    entitlements: {
      channels: 4,
      slotsPerDay: 3,
      studio: true,
      modelTiers: ['free', 'pro', 'studio'],
      features: [
        'Up to 3 posts a day',
        'All channels',
        'Custom tones',
        'Creative Studio, all models',
        'Priority generation',
      ],
    },
  },
]
