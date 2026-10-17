import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

const hasEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST)
describe.skipIf(!hasEmulator)('Firestore security rules', () => {
  let env: RulesTestEnvironment
  beforeAll(async () => {
    const [host, port] = process.env.FIRESTORE_EMULATOR_HOST!.split(':')
    env = await initializeTestEnvironment({
      projectId: 'demo-di-chua-online',
      firestore: { host, port: Number(port), rules: readFileSync('firestore.rules', 'utf8') },
    })
  })
  beforeEach(async () => env.clearFirestore())
  afterAll(async () => env.cleanup())

  it('khách chưa đăng nhập không thể ghi trạng thái hoặc gửi sớ', async () => {
    const guest = env.unauthenticatedContext().firestore()
    await assertFails(setDoc(doc(guest, 'user_states/guest-1'), { merit: 0 }))
    await assertFails(setDoc(doc(guest, 'wishes/w1'), {
      authorId: 'guest-1', author: 'Khách', content: 'Một lời nguyện đủ dài', anonymous: false,
      status: 'pending', reactions: [], reports: [], createdAt: new Date().toISOString(),
    }))
  })

  it('Google được gửi sớ, người thường không đọc sớ chờ duyệt, admin đọc được', async () => {
    const member = env.authenticatedContext('member-1', { firebase: { sign_in_provider: 'google.com' } }).firestore()
    const other = env.authenticatedContext('member-2', { firebase: { sign_in_provider: 'google.com' } }).firestore()
    const admin = env.authenticatedContext('admin-1', { admin: true, firebase: { sign_in_provider: 'google.com' } }).firestore()
    await assertSucceeds(setDoc(doc(member, 'wishes/w1'), {
      authorId: 'member-1', author: 'Minh An', content: 'Mong gia đình luôn được bình an', anonymous: false,
      status: 'pending', reactions: [], reports: [], createdAt: new Date().toISOString(),
    }))
    await assertFails(getDoc(doc(other, 'wishes/w1')))
    await assertSucceeds(getDoc(doc(admin, 'wishes/w1')))
    await assertFails(updateDoc(doc(other, 'wishes/w1'), { status: 'approved' }))
    await assertSucceeds(updateDoc(doc(admin, 'wishes/w1'), { status: 'approved' }))
  })

  it('khách được đọc sớ đã duyệt nhưng chỉ tài khoản đăng nhập được reaction', async () => {
    await env.withSecurityRulesDisabled(async context => setDoc(doc(context.firestore(), 'wishes/w2'), {
      authorId: 'member-1', author: 'Minh An', content: 'Mong mọi người luôn được bình an', anonymous: false,
      status: 'approved', reactions: [], reports: [], createdAt: new Date().toISOString(),
    }))
    const guest = env.unauthenticatedContext().firestore()
    const member = env.authenticatedContext('member-2', { firebase: { sign_in_provider: 'google.com' } }).firestore()
    const author = env.authenticatedContext('member-1', { firebase: { sign_in_provider: 'google.com' } }).firestore()
    await assertSucceeds(getDoc(doc(guest, 'wishes/w2')))
    await assertFails(updateDoc(doc(guest, 'wishes/w2'), { reactions: ['guest-1'] }))
    await assertSucceeds(updateDoc(doc(member, 'wishes/w2'), { reactions: ['member-2'] }))
    await assertFails(updateDoc(doc(author, 'wishes/w2'), { reactions: ['member-2', 'member-1'] }))
    expect((await getDoc(doc(guest, 'wishes/w2'))).data()?.reactions).toEqual(['member-2'])
  })
})
