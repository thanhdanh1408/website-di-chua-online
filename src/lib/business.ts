import type { FortuneDraw, MeritLog, Wish } from '../types'

export const DAY = 86_400_000
export const todayKey = (date = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(date)
export const sameVietnamDay = (iso: string, date = new Date()) => todayKey(new Date(iso)) === todayKey(date)
export const pointsToday = (logs: MeritLog[], source?: string) => logs.filter(l => sameVietnamDay(l.at) && (!source || l.source === source)).reduce((s, l) => s + l.points, 0)
export const getLevel = (merit: number) => {
  const levels = [{name:'Sơ tâm',min:0},{name:'Tinh tấn',min:100},{name:'An nhiên',min:500},{name:'Thanh tịnh',min:1500},{name:'Từ bi',min:5000}]
  const current = [...levels].reverse().find(l => merit >= l.min)!
  const next = levels.find(l => l.min > merit)
  return { ...current, next, progress: next ? ((merit-current.min)/(next.min-current.min))*100 : 100 }
}
export const eligibleFortuneIds = (draws: FortuneDraw[], total: number, now = Date.now()) => {
  const recent = new Set(draws.filter(d => now - new Date(d.at).getTime() < 7 * DAY).map(d => d.fortuneId))
  return Array.from({length: total}, (_,i) => i+1).filter(id => !recent.has(id))
}
export const validateWish = (content: string) => {
  const value = content.trim()
  if (value.length < 10 || value.length > 280) return 'Nội dung cần từ 10 đến 280 ký tự.'
  if (/https?:\/\/|www\.|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(value)) return 'Vui lòng không chia sẻ đường link hoặc email.'
  if (/(?:\+?84|0)(?:\d[ .-]?){9,10}/.test(value)) return 'Vui lòng không chia sẻ số điện thoại.'
  if (/\b(?:địt|đụ|cặc|lồn|đéo)\b/i.test(value)) return 'Nội dung có từ ngữ chưa phù hợp với không gian chung.'
  return null
}
export const visibleWishes = (wishes: Wish[]) => wishes.filter(w => w.status === 'approved' && w.reports.length < 3)
