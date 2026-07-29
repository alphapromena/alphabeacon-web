/**
 * How a platform is named and drawn, in one place, so B1 and G1/G2 cannot
 * disagree about what "LinkedIn" looks like.
 *
 * Neutral glyphs, not brand marks: lucide dropped its brand icons in v1, and
 * shipping someone else's logo has licensing weight a placeholder should not
 * carry. The platform NAME is what identifies a channel.
 */
import { AtSign, Briefcase, Camera, Users, type LucideIcon } from 'lucide-react'
import type { Platform } from '@/data/types'

export const PLATFORMS: Record<Platform, { label: string; icon: LucideIcon }> = {
  facebook: { label: 'Facebook Page', icon: Users },
  instagram: { label: 'Instagram', icon: Camera },
  linkedin: { label: 'LinkedIn', icon: Briefcase },
  x: { label: 'X', icon: AtSign },
}
