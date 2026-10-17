export type MeritSource = 'incense' | 'moki' | 'fortune' | 'wish' | 'checkin'
export type MeritLog = { id: string; source: MeritSource; points: number; at: string; label: string }
export type IncenseStick = { id: string; litAt: number; burnUntil: number }
export type Fortune = {
  id: number; title: string; level: string; poem: string
  message: string; work: string; love: string; health: string
}
export type FortuneDraw = { fortuneId: number; at: string }
export type WishStatus = 'pending' | 'approved' | 'rejected' | 'hidden'
export type Wish = {
  id: string; authorId: string; author: string; content: string; anonymous: boolean
  status: WishStatus; reactions: string[]; reports: string[]; createdAt: string
}
export type User = { id: string; name: string; email: string; role: 'user' | 'admin'; photoURL?: string; meritTotal?: number }
export type LeaderboardEntry = { id: string; name: string; merit: number }
export type Offering = 'hoa-sen' | 'trai-cay' | 'den-nen'
export type PersistedState = {
  guestId: string; user: User | null; users: User[]; merit: number; meritLogs: MeritLog[]
  incense: IncenseStick[]; incenseLitThisSession: boolean; mokiTaps: number
  draws: FortuneDraw[]; wishes: Wish[]; reactions: string[]; reports: string[]
  checkins: string[]; offerings: Offering[]; soundOn: boolean
}
