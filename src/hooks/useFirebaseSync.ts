import { useCallback, useEffect, useRef, useState } from 'react'
import { collection, doc, limit, onSnapshot, orderBy, query, setDoc, where } from 'firebase/firestore'
import type { LeaderboardEntry, PersistedState, User, Wish } from '../types'
import { auth, db } from '../lib/firebase'
import { friendlyFirebaseError, retryFirestore } from '../lib/firebaseErrors'
import { emptyState, personalData, readPersonal, type Notify, type UpdatePersonal } from './shared'

/** Keeps personal and public Firestore data in sync with the authenticated account. */
export function useFirebaseSync(user: User | null, firebaseReady: boolean, notify: Notify) {
  const [state, setState] = useState<PersistedState>(() => emptyState())
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const stateRef = useRef(state)

  const replaceState = useCallback((next: PersistedState) => {
    stateRef.current = next
    setState(next)
  }, [])

  const savePersonal = useCallback(
    async (next: PersistedState) => {
      const firebaseUser = auth?.currentUser
      if (!db || !firebaseUser) return
      const activeDb = db

      try {
        await retryFirestore(() =>
          setDoc(
            doc(activeDb, 'user_states', firebaseUser.uid),
            { ...personalData(next), updatedAt: new Date().toISOString() },
            { merge: true }
          )
        )
        if (!firebaseUser.isAnonymous && next.user) {
          await retryFirestore(() =>
            setDoc(
              doc(activeDb, 'leaderboard', firebaseUser.uid),
              { name: next.user!.name, merit: next.merit, updatedAt: new Date().toISOString() },
              { merge: true }
            )
          )
        }
      } catch (error) {
        notify(friendlyFirebaseError(error, 'Không thể lưu thay đổi. Dữ liệu sẽ được đồng bộ lại khi kết nối ổn định.'))
      }
    },
    [notify]
  )

  const updatePersonal = useCallback<UpdatePersonal>(
    updater => {
      const next = updater(stateRef.current)
      replaceState(next)
      void savePersonal(next)
      return next
    },
    [replaceState, savePersonal]
  )

  useEffect(() => {
    if (!firebaseReady || !db) return

    const activeDb = db
    const subscriptions = new Set<() => void>()
    let active = true
    const subscribe = (unsubscribe: () => void) => subscriptions.add(unsubscribe)
    const handleReadError = (error: unknown) => {
      if (active) notify(friendlyFirebaseError(error, 'Không thể tải dữ liệu. Vui lòng kiểm tra kết nối và thử lại.'))
    }

    replaceState({ ...emptyState(), guestId: user?.id || crypto.randomUUID(), user })

    subscribe(
      onSnapshot(
        query(collection(activeDb, 'leaderboard'), orderBy('merit', 'desc'), limit(20)),
        snapshot => {
          if (!active) return
          setLeaderboard(
            snapshot.docs.map(item => ({
              id: item.id,
              name: String(item.data().name || 'Thiện hữu'),
              merit: Number(item.data().merit || 0),
            }))
          )
        },
        handleReadError
      )
    )

    const wishQuery =
      user?.role === 'admin'
        ? query(collection(activeDb, 'wishes'), orderBy('createdAt', 'desc'), limit(50))
        : query(
            collection(activeDb, 'wishes'),
            where('status', '==', 'approved'),
            orderBy('createdAt', 'desc'),
            limit(50)
          )
    subscribe(
      onSnapshot(
        wishQuery,
        snapshot => {
          if (!active) return
          replaceState({
            ...stateRef.current,
            wishes: snapshot.docs.map(item => ({ id: item.id, ...item.data() }) as Wish),
          })
        },
        handleReadError
      )
    )

    if (user) {
      const profile = auth?.currentUser
      if (profile) {
        void retryFirestore(() =>
          setDoc(
            doc(activeDb, 'users', user.id),
            {
              name: user.name,
              email: user.email,
              photoURL: user.photoURL || null,
              provider: 'google.com',
              createdAt: profile.metadata.creationTime || new Date().toISOString(),
              lastSeenAt: new Date().toISOString(),
            },
            { merge: true }
          )
        ).catch(handleReadError)
      }

      subscribe(
        onSnapshot(
          doc(activeDb, 'user_states', user.id),
          snapshot => {
            if (!active) return
            if (!snapshot.exists()) {
              void retryFirestore(() =>
                setDoc(snapshot.ref, { ...personalData(emptyState()), updatedAt: new Date().toISOString() })
              ).catch(handleReadError)
              return
            }
            const data = readPersonal(snapshot.data())
            replaceState({
              ...stateRef.current,
              ...data,
              guestId: user.id,
              user,
              incense: data.incense?.filter(item => item.burnUntil > Date.now()) || [],
            })
          },
          handleReadError
        )
      )

      if (user.role === 'admin') {
        subscribe(
          onSnapshot(
            collection(activeDb, 'users'),
            snapshot => {
              if (!active) return
              const users = snapshot.docs.map(item => {
                const data = item.data()
                return {
                  id: item.id,
                  name: String(data.name || 'Thiện hữu'),
                  email: String(data.email || ''),
                  role: item.id === user.id ? 'admin' : 'user',
                  photoURL: data.photoURL || undefined,
                } as User
              })
              replaceState({ ...stateRef.current, users })
            },
            handleReadError
          )
        )
      }
    }

    return () => {
      active = false
      subscriptions.forEach(unsubscribe => unsubscribe())
      subscriptions.clear()
    }
  }, [firebaseReady, notify, replaceState, user])

  return { state, stateRef, leaderboard, wishes: state.wishes, users: state.users, updatePersonal }
}
