import { useCallback, useEffect, useMemo } from 'react'
import { throttle } from 'lodash-es'
import type { IncenseStick, PersistedState } from '../types'
import { grantMerit } from './useMeritSystem'
import { makeId, type Notify, type StateRef, type UpdatePersonal } from './shared'

/** Manages incense and wooden-fish interactions, including click throttling. */
export function useIncenseActions(
  state: PersistedState,
  stateRef: StateRef,
  updatePersonal: UpdatePersonal,
  notify: Notify
) {
  const lightIncense = useCallback(
    (qty: 1 | 3) => {
      const current = stateRef.current
      const active = current.incense.filter(item => item.burnUntil > Date.now())
      if (active.length + qty > 9) {
        notify('Bàn hương chỉ giữ tối đa 9 nén đang cháy.')
        return false
      }
      const now = Date.now()
      const sticks: IncenseStick[] = Array.from({ length: qty }, () => ({
        id: makeId(),
        litAt: now,
        burnUntil: now + 300_000,
      }))
      const result = grantMerit(
        { ...current, incense: [...active, ...sticks], incenseLitThisSession: true },
        'incense',
        1,
        `Thắp ${qty} nén hương`,
        10
      )
      updatePersonal(() => result.state)
      return true
    },
    [notify, stateRef, updatePersonal]
  )

  const strike = useCallback(() => {
    updatePersonal(current => {
      const next = { ...current, mokiTaps: current.mokiTaps + 1 }
      return next.mokiTaps % 10 === 0 ? grantMerit(next, 'moki', 1, '10 tiếng mõ', 50).state : next
    })
  }, [updatePersonal])

  const strikeMoki = useMemo(() => throttle(strike, 100, { leading: true, trailing: false }), [strike])
  useEffect(() => () => strikeMoki.cancel(), [strikeMoki])

  return { incense: state.incense, mokiTaps: state.mokiTaps, lightIncense, strikeMoki }
}
