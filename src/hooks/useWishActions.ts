import { useCallback } from 'react'
import { doc, runTransaction, setDoc } from 'firebase/firestore'
import type { Wish, WishStatus } from '../types'
import { auth, db } from '../lib/firebase'
import { friendlyFirebaseError, retryFirestore } from '../lib/firebaseErrors'
import { makeId, type Notify, type StateRef } from './shared'

/** Provides all wish creation, moderation, reaction, and reporting operations. */
export function useWishActions(stateRef: StateRef, notify: Notify) {
  const addWish = useCallback(
    (content: string, anonymous: boolean) => {
      const current = stateRef.current
      if (!current.user || !db) return
      const wish: Wish = {
        id: makeId(),
        authorId: current.user.id,
        author: anonymous ? 'Người hữu duyên' : current.user.name,
        content: content.trim(),
        anonymous,
        status: 'pending',
        reactions: [],
        reports: [],
        createdAt: new Date().toISOString(),
      }
      void retryFirestore(() => setDoc(doc(db!, 'wishes', wish.id), wish))
        .then(() => notify('Sớ đã được gửi và đang chờ duyệt.'))
        .catch(error => notify(friendlyFirebaseError(error, 'Không thể gửi sớ. Vui lòng thử lại.')))
    },
    [notify, stateRef]
  )

  const moderateWish = useCallback(
    (wishId: string, status: WishStatus) => {
      if (!db) return
      const activeDb = db
      void retryFirestore(() =>
        runTransaction(activeDb, async transaction => {
          const wishRef = doc(activeDb, 'wishes', wishId)
          const wishSnap = await transaction.get(wishRef)
          if (!wishSnap.exists()) return
          const wish = wishSnap.data() as Wish
          const userRef =
            status === 'approved' && wish.status !== 'approved' ? doc(activeDb, 'user_states', wish.authorId) : null
          const userSnap = userRef ? await transaction.get(userRef) : null
          transaction.update(wishRef, {
            status,
            moderatedAt: new Date().toISOString(),
            moderatedBy: auth?.currentUser?.uid,
          })
          if (userRef && userSnap?.exists()) {
            const data = userSnap.data()
            const logs = Array.isArray(data.meritLogs) ? data.meritLogs : []
            if (!logs.some((log: { label?: string }) => log.label === `Sớ ${wishId} được duyệt`)) {
              const nextMerit = Number(data.merit || 0) + 5
              transaction.update(userRef, {
                merit: nextMerit,
                meritLogs: [
                  {
                    id: makeId(),
                    source: 'wish',
                    points: 5,
                    at: new Date().toISOString(),
                    label: `Sớ ${wishId} được duyệt`,
                  },
                  ...logs,
                ],
              })
              transaction.set(
                doc(activeDb, 'leaderboard', wish.authorId),
                {
                  name: wish.anonymous ? 'Người hữu duyên' : wish.author,
                  merit: nextMerit,
                  updatedAt: new Date().toISOString(),
                },
                { merge: true }
              )
            }
          }
        })
      ).catch(error => notify(friendlyFirebaseError(error, 'Không thể cập nhật trạng thái sớ. Vui lòng thử lại.')))
    },
    [notify]
  )

  const reactWish = useCallback(
    (wishId: string) => {
      const current = stateRef.current
      const actorId = current.user?.id
      const wish = current.wishes.find(item => item.id === wishId)
      if (!db || !actorId || !wish || wish.authorId === actorId || wish.reactions.includes(actorId)) return false
      const activeDb = db
      void retryFirestore(() =>
        runTransaction(activeDb, async transaction => {
          const ref = doc(activeDb, 'wishes', wishId)
          const snap = await transaction.get(ref)
          if (!snap.exists()) return
          const reactions = (snap.data().reactions || []) as string[]
          if (!reactions.includes(actorId)) transaction.update(ref, { reactions: [...reactions, actorId] })
        })
      ).catch(error => notify(friendlyFirebaseError(error, 'Không thể gửi lời đồng cảm. Vui lòng thử lại.')))
      return true
    },
    [notify, stateRef]
  )

  const reportWish = useCallback(
    (wishId: string) => {
      const current = stateRef.current
      const actorId = current.user?.id
      const wish = current.wishes.find(item => item.id === wishId)
      if (!db || !actorId || !wish || wish.authorId === actorId || wish.reports.includes(actorId)) return false
      const activeDb = db
      void retryFirestore(() =>
        runTransaction(activeDb, async transaction => {
          const ref = doc(activeDb, 'wishes', wishId)
          const snap = await transaction.get(ref)
          if (!snap.exists()) return
          const reports = (snap.data().reports || []) as string[]
          if (!reports.includes(actorId)) {
            const next = [...reports, actorId]
            transaction.update(ref, { reports: next, ...(next.length >= 3 ? { status: 'hidden' } : {}) })
          }
        })
      )
        .then(() => notify('Cảm ơn bạn đã báo cáo. Ban quản trị sẽ xem xét.'))
        .catch(error => notify(friendlyFirebaseError(error, 'Không thể gửi báo cáo. Vui lòng thử lại.')))
      return true
    },
    [notify, stateRef]
  )

  return { addWish, moderateWish, reactWish, reportWish }
}
