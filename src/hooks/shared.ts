import type { MutableRefObject } from 'react'
import type { DocumentData } from 'firebase/firestore'
import type { PersistedState } from '../types'

export type Notify = (message: string) => void
export type UpdatePersonal = (updater: (current: PersistedState) => PersistedState) => PersistedState
export type StateRef = MutableRefObject<PersistedState>

export const makeId = () => crypto.randomUUID()

export const emptyState = (): PersistedState => ({
  guestId: makeId(),
  user: null,
  users: [],
  merit: 0,
  meritLogs: [],
  incense: [],
  incenseLitThisSession: false,
  mokiTaps: 0,
  draws: [],
  wishes: [],
  reactions: [],
  reports: [],
  checkins: [],
  offerings: [],
  soundOn: false,
})

export type PersonalData = Pick<
  PersistedState,
  'merit' | 'meritLogs' | 'incense' | 'mokiTaps' | 'draws' | 'checkins' | 'offerings' | 'soundOn'
>

export const personalData = (state: PersistedState): PersonalData => ({
  merit: state.merit,
  meritLogs: state.meritLogs,
  incense: state.incense,
  mokiTaps: state.mokiTaps,
  draws: state.draws,
  checkins: state.checkins,
  offerings: state.offerings,
  soundOn: state.soundOn,
})

export const readPersonal = (data: DocumentData): Partial<PersonalData> => ({
  merit: typeof data.merit === 'number' ? data.merit : 0,
  meritLogs: Array.isArray(data.meritLogs) ? data.meritLogs : [],
  incense: Array.isArray(data.incense) ? data.incense : [],
  mokiTaps: typeof data.mokiTaps === 'number' ? data.mokiTaps : 0,
  draws: Array.isArray(data.draws) ? data.draws : [],
  checkins: Array.isArray(data.checkins) ? data.checkins : [],
  offerings: Array.isArray(data.offerings) ? data.offerings : [],
  soundOn: data.soundOn === true,
})
