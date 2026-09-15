/**
 * The seam between the signed-in frame and the screens in it (ORDER-SHELL-0915,
 * item 77). `AppFrame` provides the setter; a screen's `AppShell` declares its
 * top bar through it; anything else rendered in the frame — the route fallback
 * — can ask whether it is inside one. Its own module because a component file
 * may export only components (react-refresh).
 */
import { createContext, useContext, type ReactNode } from 'react'

/** What a screen tells the top bar about itself. */
export interface ShellChrome {
  title: string
  /** The one-line status under the title, e.g. "5 drafts ready · generated 6:02 AM". */
  context?: string
  actions?: ReactNode
}

/** The frame's setter, reachable only from inside the frame. */
export const ShellChromeContext = createContext<((chrome: ShellChrome) => void) | null>(null)

/** True under `AppFrame` — the route fallback centres in the frame's main there. */
export function useInShellFrame(): boolean {
  return useContext(ShellChromeContext) !== null
}
