import type { LeaderboardEntry, MeritSource, Offering, PersistedState, WishStatus } from '../types'

/** Public API exposed by AppProvider to pages and components. */
export type AppActions = {
  state: PersistedState
  leaderboard: LeaderboardEntry[]
  firebaseReady: boolean
  firebaseError: string | null
  toast: string | null
  setToast: (value: string | null) => void
  addMerit: (source: MeritSource, points: number, label: string, sourceCap?: number) => number
  lightIncense: (qty: 1 | 3) => boolean
  strikeMoki: () => void
  setSound: (value: boolean) => void
  addDraw: (fortuneId: number) => void
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  addWish: (content: string, anonymous: boolean) => void
  moderateWish: (wishId: string, status: WishStatus) => void
  reactWish: (wishId: string) => boolean
  reportWish: (wishId: string) => boolean
  checkin: () => boolean
  toggleOffering: (offering: Offering) => void
}
