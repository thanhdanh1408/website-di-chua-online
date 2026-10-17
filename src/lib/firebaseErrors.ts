import { FirebaseError } from 'firebase/app'

const messages: Record<string, string> = {
  'auth/popup-closed-by-user': 'Cửa sổ đăng nhập đã được đóng trước khi hoàn tất.',
  'auth/popup-blocked': 'Trình duyệt đang chặn cửa sổ đăng nhập. Hãy cho phép popup rồi thử lại.',
  'auth/cancelled-popup-request': 'Một yêu cầu đăng nhập khác đang được xử lý.',
  'auth/network-request-failed': 'Kết nối mạng bị gián đoạn. Hãy kiểm tra mạng rồi thử lại.',
  'auth/unauthorized-domain': 'Tên miền hiện tại chưa được cho phép trong Firebase Authentication.',
  'auth/operation-not-allowed': 'Đăng nhập Google chưa được bật trong Firebase Console.',
  'permission-denied': 'Bạn không có quyền thực hiện thao tác này.',
  unavailable: 'Không thể kết nối máy chủ. Ứng dụng sẽ tự thử lại.',
  'deadline-exceeded': 'Máy chủ phản hồi quá chậm. Vui lòng thử lại.',
  aborted: 'Dữ liệu vừa thay đổi ở nơi khác. Vui lòng thử lại.',
}

/** Chuyển lỗi Firebase kỹ thuật thành thông báo ngắn, an toàn cho người dùng. */
export function friendlyFirebaseError(error: unknown, fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.') {
  const rawCode = error instanceof FirebaseError ? error.code : (error as { code?: string })?.code
  const code = rawCode?.replace(/^firestore\//, '')
  return (code && messages[code]) || fallback
}

const retryableCodes = new Set(['unavailable', 'deadline-exceeded', 'aborted', 'resource-exhausted', 'internal'])

/** Thử lại thao tác Firestore tạm thời thất bại với exponential backoff ngắn. */
export async function retryFirestore<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      const rawCode = (error as { code?: string })?.code?.replace(/^firestore\//, '')
      if (!rawCode || !retryableCodes.has(rawCode) || attempt === attempts - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 250 * 2 ** attempt))
    }
  }
  throw lastError
}
