/* eslint-disable ab/no-raw-color -- CUSTOMERS' OWN BRAND COLOURS, sampled.
   The four values here are read from artwork the customers really published
   and are documented, per value, with where they were sampled from. A brand
   colour taken from the brand's own published work is a fact about that
   brand; replacing it with one of our tokens would misrepresent them. See
   BrandMedia.tsx; verify:w02 asserts the exemption list. */
/**
 * Campaign creative composed on a customer's own artwork.
 *
 * The scenes in ./media are neutral by construction, because they stand in
 * where we know nothing about how a customer's marketing looks. This file is
 * the opposite case: where a customer has published a campaign and the file is
 * in this repository, the composition is built on their photograph or their
 * render — not on a drawn approximation of it.
 *
 * That distinction is the whole point. A drawn stand-in for a real brand's
 * creative reads as a placeholder however carefully it is drawn, which is why
 * the Alpha Pro composition that used to live here is gone: their own artwork
 * is on disk, so there is nothing for us to approximate.
 *
 * Nothing here recolours, redraws or reletters a logo or an image. Marks are
 * the supplied files, placed. Photography and renders are the customers' own,
 * reframed by scripts/ and otherwise untouched.
 */

import type { CustomerId } from './customers'

/**
 * Read from public/brand/real-posts/alpha-pro-mena/ by sampling the artwork —
 * the accent they letter their headline in, and the ground behind it. A brand
 * colour taken from the brand's own published work is not an invented palette;
 * picking one that looked about right would have been.
 */
export const ALPHA_PRO_BRAND = {
  ground: '#151515',
  accent: '#e8375c',
  source:
    "Sampled from Alpha Pro MENA's own published Free AI Assessment creative, held at public/brand/real-posts/alpha-pro-mena/.",
} as const

/**
 * Read from public/brand/real-posts/shrimp-joint/ the same way: the most
 * common saturated orange in their own published creative, and the near-black
 * it sits on.
 */
export const SHRIMP_JOINT_BRAND = {
  ground: '#0a0605',
  accent: '#f87028',
  source:
    "Sampled from Shrimp Joint's own published “Crispy. Hot. Loaded.” creative, held at public/brand/real-posts/shrimp-joint/.",
} as const

/**
 * One shape, because every composition here works the same way: the
 * customer's own image, their mark on it, and type set on the ground it
 * resolves into.
 */
export type CreativeLayout = 'photoLed'

export interface CampaignCreative {
  customerId: CustomerId
  layout: CreativeLayout
  dir: 'ltr' | 'rtl'
  /** Two-part headline; the second half takes the brand accent. */
  headline: string
  headlineAccent: string
  kicker: string
  /** Sits beside the call to action, or alone under the rule. */
  productName?: string
  cta?: string
  /** The markets the customer says they serve, in their own words. */
  markets?: string
  /**
   * The customer's own image, reframed for this composition — never
   * generated, never retouched. `focal` is how the frame is cropped, and it
   * differs between languages so one image is composed twice rather than
   * mirrored once.
   */
  photo: { src: string; focal: string; alt: string }
  /** What the whole creative says, for anyone who cannot see it. */
  alt: string
}

export type CampaignCreativeId =
  'alpha-pro-assessment-ar' | 'shrimp-joint-crispy-en' | 'shrimp-joint-crispy-ar'

export const CAMPAIGN_CREATIVES: Record<CampaignCreativeId, CampaignCreative> = {
  /* The Arabic adaptation of Alpha Pro's assessment campaign.
  
     Their English creative runs on this render, so the Arabic one runs on it
     too — same campaign, same image, composed right to left rather than
     mirrored. The render is lifted straight out of their published artwork by
     scripts/crop-alpha-pro-creative.mjs; the Arabic type and the arrangement
     are Malaky's, and the section says so. */
  'alpha-pro-assessment-ar': {
    customerId: 'alpha-pro',
    layout: 'photoLed',
    dir: 'rtl',
    headline: 'تقييم الذكاء الاصطناعي',
    headlineAccent: 'مجانًا',
    kicker: 'لقادة المؤسسات',
    productName: 'تقييم استراتيجي يختصر الطريق إلى الذكاء الاصطناعي.',
    markets: 'الأردن · السعودية · عُمان',
    photo: {
      src: '/brand/customers/alpha-pro/assessment-render.png',
      focal: '50% 40%',
      alt: "The render from Alpha Pro MENA's own Free AI Assessment creative",
    },
    alt:
      'An Alpha Pro MENA campaign creative composed in Arabic for the same Free AI ' +
      'Assessment campaign, on the render from their own published artwork, for enterprise ' +
      'leaders across Jordan, Saudi Arabia and Oman.',
  },

  /* Their own campaign subject — the crispy fish sandwich — set the way their
     creative sets it: the product large, one line under it, an order prompt.
     Malaky's composition, their photograph and their brand values.

     The photograph is cropped from their published post by
     scripts/crop-shrimp-hero.mjs: the hands and the sandwich, above their own
     lettering, which is left behind so their type never mixes with ours. */
  'shrimp-joint-crispy-en': {
    customerId: 'shrimp-joint',
    layout: 'photoLed',
    dir: 'ltr',
    headline: 'Crispy',
    headlineAccent: 'to the last bite',
    kicker: 'Fried to order',
    cta: 'Order now',
    productName: 'The crispy fish sandwich',
    photo: {
      src: '/brand/customers/shrimp-joint/crispy-fish-hero.png',
      /* Centred: the sandwich squarely in the band. */
      focal: '50% 52%',
      alt: "Shrimp Joint's crispy fish sandwich, held in gloved hands",
    },
    alt:
      'A Shrimp Joint campaign creative on their own photograph of the crispy fish ' +
      'sandwich, headlined “Crispy, to the last bite”, with an order prompt.',
  },

  /* Composed in Arabic rather than translated: it opens on the promise, not on
     the product name, and closes on the order. */
  'shrimp-joint-crispy-ar': {
    customerId: 'shrimp-joint',
    layout: 'photoLed',
    dir: 'rtl',
    headline: 'مقرمش',
    headlineAccent: 'لآخر لُقْمَة',
    kicker: 'يُحضَّر عند الطلب',
    cta: 'اطلبه الآن',
    productName: 'ساندويتش السمك المقرمش',
    photo: {
      src: '/brand/customers/shrimp-joint/crispy-fish-hero.png',
      /* Set a little right of centre and higher in the frame than the English
         panel: the same photograph, composed a second time rather than
         repeated, so the type falls on a different part of it. */
      focal: '57% 44%',
      alt: "Shrimp Joint's crispy fish sandwich, held in gloved hands",
    },
    alt:
      'The same Shrimp Joint campaign composed in Arabic, headlined “crispy, to the last ' +
      'bite”, for the crispy fish sandwich, with an order prompt.',
  },
}

export function getCampaignCreative(id: CampaignCreativeId): CampaignCreative {
  return CAMPAIGN_CREATIVES[id]
}
