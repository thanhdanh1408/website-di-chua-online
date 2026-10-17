import { cert, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const required = ['FIREBASE_ADMIN_PROJECT_ID', 'FIREBASE_ADMIN_CLIENT_EMAIL', 'FIREBASE_ADMIN_PRIVATE_KEY', 'FIREBASE_ADMIN_EMAIL']
const missing = required.filter(name => !process.env[name])
if (missing.length) throw new Error(`Thiếu biến môi trường: ${missing.join(', ')}`)

initializeApp({ credential: cert({
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
}) })

const adminAuth = getAuth()
const target = await adminAuth.getUserByEmail(process.env.FIREBASE_ADMIN_EMAIL.trim().toLowerCase())
if (!target.providerData.some(provider => provider.providerId === 'google.com')) {
  throw new Error('Tài khoản admin phải đăng nhập Google vào ứng dụng ít nhất một lần trước khi cấp quyền.')
}

let pageToken
let demoted = 0
do {
  const page = await adminAuth.listUsers(1000, pageToken)
  for (const user of page.users) {
    if (user.uid !== target.uid && user.customClaims?.admin === true) {
      const { admin: _removed, ...claims } = user.customClaims
      await adminAuth.setCustomUserClaims(user.uid, claims)
      demoted++
    }
  }
  pageToken = page.pageToken
} while (pageToken)

await adminAuth.setCustomUserClaims(target.uid, { ...(target.customClaims || {}), admin: true })
console.log(`Đã đặt admin duy nhất: ${target.email} (${target.uid}). Đã gỡ quyền của ${demoted} tài khoản cũ.`)
console.log('Hãy đăng xuất rồi đăng nhập lại để nhận token quyền mới.')
