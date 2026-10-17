import { useCallback, useEffect, useState } from 'react'
import { onIdTokenChanged, signInWithPopup, signOut } from 'firebase/auth'
import type { User } from '../types'
import { auth, firebaseConfigured, googleProvider, requireFirebase } from '../lib/firebase'
import { friendlyFirebaseError } from '../lib/firebaseErrors'
import type { Notify } from './shared'

/** Theo dõi Firebase Auth và ánh xạ custom claim admin sang user của ứng dụng. */
export function useFirebaseAuth(notify: Notify) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseReady, setFirebaseReady] = useState(false)
  const [firebaseError, setFirebaseError] = useState<string | null>(
    firebaseConfigured ? null : 'Thiếu cấu hình Firebase trong .env.local.'
  )

  useEffect(() => {
    if (!auth) {
      setFirebaseReady(true)
      return
    }
    const activeAuth = auth
    return onIdTokenChanged(
      activeAuth,
      async firebaseUser => {
        if (!firebaseUser) {
          setUser(null)
          setFirebaseError(null)
          setFirebaseReady(true)
          return
        }
        if (firebaseUser.isAnonymous) {
          await signOut(activeAuth)
          return
        }
        try {
          const token = await firebaseUser.getIdTokenResult()
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Thiện hữu',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || undefined,
            role: token.claims.admin === true ? 'admin' : 'user',
          })
          setFirebaseError(null)
        } catch (error) {
          const message = friendlyFirebaseError(error, 'Không thể xác minh tài khoản. Hãy đăng nhập lại.')
          setFirebaseError(message)
          notify(message)
        } finally {
          setFirebaseReady(true)
        }
      },
      error => {
        const message = friendlyFirebaseError(error, 'Không thể khởi tạo đăng nhập. Vui lòng tải lại trang.')
        setFirebaseError(message)
        setFirebaseReady(true)
        notify(message)
      }
    )
  }, [notify])

  const loginWithGoogle = useCallback(async () => {
    try {
      const { auth: activeAuth } = requireFirebase()
      await signInWithPopup(activeAuth, googleProvider)
      setFirebaseError(null)
      notify('Đăng nhập Google thành công.')
    } catch (error) {
      const message = friendlyFirebaseError(error, 'Không thể đăng nhập Google. Vui lòng thử lại.')
      setFirebaseError(message)
      notify(message)
      throw error
    }
  }, [notify])

  const logout = useCallback(async () => {
    try {
      const { auth: activeAuth } = requireFirebase()
      await signOut(activeAuth)
      notify('Bạn đã đăng xuất.')
    } catch (error) {
      notify(friendlyFirebaseError(error, 'Không thể đăng xuất. Vui lòng thử lại.'))
      throw error
    }
  }, [notify])

  return { user, firebaseReady, firebaseError, loginWithGoogle, logout }
}
