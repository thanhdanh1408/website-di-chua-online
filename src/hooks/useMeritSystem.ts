import { useCallback } from 'react'
import { getLevel as calculateLevel, pointsToday } from '../lib/business'
import type { MeritSource, PersistedState } from '../types'
import { makeId, type StateRef, type UpdatePersonal } from './shared'

/** Applies daily and per-source caps, returning both the granted points and resulting state. */
export function grantMerit(
  current: PersistedState,
  source: MeritSource,
  points: number,
  label: string,
  sourceCap = 100
) {
  const granted = Math.max(
    0,
    Math.min(points, sourceCap - pointsToday(current.meritLogs, source), 100 - pointsToday(current.meritLogs))
  )
  return {
    granted,
    state: granted
      ? {
          ...current,
          merit: current.merit + granted,
          meritLogs: [
            { id: makeId(), source, points: granted, at: new Date().toISOString(), label },
            ...current.meritLogs,
          ],
        }
      : current,
  }
}

/** Exposes merit totals and the only mutation path for awarding merit. */
export function useMeritSystem(state: PersistedState, stateRef: StateRef, updatePersonal: UpdatePersonal) {
  const addMerit = useCallback(
    (source: MeritSource, points: number, label: string, sourceCap = 100) => {
      const result = grantMerit(stateRef.current, source, points, label, sourceCap)
      if (result.granted) updatePersonal(() => result.state)
      return result.granted
    },
    [stateRef, updatePersonal]
  )

  return {
    merit: state.merit,
    meritLogs: state.meritLogs,
    addMerit,
    getLevel: calculateLevel,
  }
}
