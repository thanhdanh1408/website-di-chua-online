import { describe, expect, it } from 'vitest'
import { eligibleFortuneIds, getLevel, pointsToday, validateWish, visibleWishes } from './business'
import type { FortuneDraw, MeritLog, Wish } from '../types'

describe('quy tắc công đức', () => {
  it('xác định đúng cấp bậc', () => {
    expect(getLevel(0).name).toBe('Sơ tâm')
    expect(getLevel(100).name).toBe('Tinh tấn')
    expect(getLevel(1500).name).toBe('Thanh tịnh')
  })
  it('chỉ cộng nhật ký trong ngày Việt Nam', () => {
    const logs = [{ id: '1', source: 'incense', points: 3, at: new Date().toISOString(), label: 'test' }] as MeritLog[]
    expect(pointsToday(logs, 'incense')).toBe(3)
  })
})

describe('quy tắc xin quẻ', () => {
  it('loại quẻ đã rút trong bảy ngày', () => {
    const draws: FortuneDraw[] = [{ fortuneId: 2, at: new Date().toISOString() }]
    expect(eligibleFortuneIds(draws, 3)).toEqual([1, 3])
  })
})

describe('kiểm duyệt lời nguyện', () => {
  it('chặn nội dung quá ngắn, email, số điện thoại và liên kết', () => {
    expect(validateWish('ngắn')).toBeTruthy()
    expect(validateWish('Liên hệ tôi tại hello@example.com nhé')).toBeTruthy()
    expect(validateWish('Số điện thoại của tôi là 0912345678')).toBeTruthy()
    expect(validateWish('Xem thêm tại https://example.com nhé')).toBeTruthy()
  })
  it('chấp nhận nội dung tích cực hợp lệ', () =>
    expect(validateWish('Mong mọi người luôn mạnh khỏe và bình an.')).toBeNull())
  it('chỉ hiện nội dung đã duyệt và chưa đủ ba báo cáo', () => {
    const base = {
      authorId: 'u',
      author: 'An',
      content: 'Một lời nguyện đủ dài',
      anonymous: false,
      reactions: [],
      createdAt: new Date().toISOString(),
    }
    const wishes = [
      { ...base, id: '1', status: 'approved', reports: [] },
      { ...base, id: '2', status: 'pending', reports: [] },
      { ...base, id: '3', status: 'approved', reports: ['a', 'b', 'c'] },
    ] as Wish[]
    expect(visibleWishes(wishes).map(w => w.id)).toEqual(['1'])
  })
})
