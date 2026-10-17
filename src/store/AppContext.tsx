import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useFirebaseAuth } from '../hooks/useFirebaseAuth'
import { useFirebaseSync } from '../hooks/useFirebaseSync'
import { useIncenseActions } from '../hooks/useIncenseActions'
import { useJourneyActions } from '../hooks/useJourneyActions'
import { useMeritSystem } from '../hooks/useMeritSystem'
import { useWishActions } from '../hooks/useWishActions'
import type { AppActions } from './appContextTypes'

const AppContext = createContext<AppActions | null>(null)

/** Composes authentication, realtime synchronization, and domain-specific application hooks. */
export function AppProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<string | null>(null)
  const notify = useCallback((message: string) => setToast(message), [])
  const authentication = useFirebaseAuth(notify)
  const sync = useFirebaseSync(authentication.user, authentication.firebaseReady, notify)
  const merit = useMeritSystem(sync.state, sync.stateRef, sync.updatePersonal)
  const incense = useIncenseActions(sync.state, sync.stateRef, sync.updatePersonal, notify)
  const wishes = useWishActions(sync.stateRef, notify)
  const journey = useJourneyActions(sync.stateRef, sync.updatePersonal, notify)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const value = useMemo<AppActions>(
    () => ({
      state: sync.state,
      leaderboard: sync.leaderboard,
      firebaseReady: authentication.firebaseReady,
      firebaseError: authentication.firebaseError,
      toast,
      setToast,
      addMerit: merit.addMerit,
      lightIncense: incense.lightIncense,
      strikeMoki: incense.strikeMoki,
      setSound: journey.setSound,
      addDraw: journey.addDraw,
      loginWithGoogle: authentication.loginWithGoogle,
      logout: authentication.logout,
      addWish: wishes.addWish,
      moderateWish: wishes.moderateWish,
      reactWish: wishes.reactWish,
      reportWish: wishes.reportWish,
      checkin: journey.checkin,
      toggleOffering: journey.toggleOffering,
    }),
    [authentication, incense, journey, merit.addMerit, sync.leaderboard, sync.state, toast, wishes]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

/** Reads the application API and guards against usage outside AppProvider. */
export function useApp() {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp must be inside provider')
  return value
}
