import { useCallback } from 'react'
import { todayKey } from '../lib/business'
import type { Offering } from '../types'
import { grantMerit } from './useMeritSystem'
import type { Notify, StateRef, UpdatePersonal } from './shared'

/** Groups the remaining personal journey actions used throughout the application. */
export function useJourneyActions(stateRef: StateRef, updatePersonal: UpdatePersonal, notify: Notify) {
  const setSound = useCallback(
    (value: boolean) => updatePersonal(current => ({ ...current, soundOn: value })),
    [updatePersonal]
  )
  const addDraw = useCallback(
    (fortuneId: number) =>
      updatePersonal(current => {
        const first = !current.draws.some(d => todayKey(new Date(d.at)) === todayKey())
        const next = { ...current, draws: [{ fortuneId, at: new Date().toISOString() }, ...current.draws] }
        return first ? grantMerit(next, 'fortune', 3, 'Rút quẻ đầu ngày', 3).state : next
      }),
    [updatePersonal]
  )
  const checkin = useCallback(() => {
    const today = todayKey()
    if (stateRef.current.checkins.includes(today)) return false
    updatePersonal(
      current =>
        grantMerit({ ...current, checkins: [...current.checkins, today] }, 'checkin', 2, 'Điểm danh an lành', 2).state
    )
    notify('Điểm danh thành công · +2 công đức')
    return true
  }, [notify, stateRef, updatePersonal])
  const toggleOffering = useCallback(
    (offering: Offering) =>
      updatePersonal(current => ({
        ...current,
        offerings: current.offerings.includes(offering)
          ? current.offerings.filter(item => item !== offering)
          : [...current.offerings, offering],
      })),
    [updatePersonal]
  )
  return { setSound, addDraw, checkin, toggleOffering }
}
