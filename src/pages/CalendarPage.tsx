import { useMemo, useState } from 'react'
import { BellRing, ChevronLeft, ChevronRight, MoonStar } from 'lucide-react'
import { Solar } from 'lunar-typescript'

const lunarEvents: Record<number, string> = {
  1: 'Mùng Một · Khởi đầu an lành',
  8: 'Ngày Bát Quan Trai',
  15: 'Ngày Rằm · Tĩnh tâm, hướng thiện',
  23: 'Ngày lành sám hối',
}
const lunarFor = (year: number, month: number, day: number) => Solar.fromYmd(year, month, day).getLunar()

export function CalendarPage() {
  const now = new Date()
  const [view, setView] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const calendar = useMemo(() => {
    const year = view.getFullYear()
    const month = view.getMonth() + 1
    const first = view.getDay()
    const count = new Date(year, month, 0).getDate()
    const days = Array.from({ length: count }, (_, index) => {
      const solarDay = index + 1
      const lunar = lunarFor(year, month, solarDay)
      return { solarDay, lunarDay: lunar.getDay(), lunarMonth: lunar.getMonth() }
    })
    return { first, days, events: days.filter(day => lunarEvents[day.lunarDay]) }
  }, [view])
  const todayLunar = lunarFor(now.getFullYear(), now.getMonth() + 1, now.getDate())
  const prev = () => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))
  const next = () => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))
  return (
    <div className="page-container calendar-page">
      <header className="page-heading">
        <p className="eyebrow centered">
          <span /> Nhịp trăng, nhịp sống <span />
        </p>
        <h1>
          Lịch <em>an lành</em>
        </h1>
        <p>Một lời nhắc dịu dàng cho ngày mùng Một, ngày Rằm và những dịp ý nghĩa.</p>
      </header>
      <div className="calendar-layout">
        <section className="calendar-card">
          <div className="calendar-head">
            <button onClick={prev} aria-label="Tháng trước">
              <ChevronLeft />
            </button>
            <h2>
              Tháng {view.getMonth() + 1}, {view.getFullYear()}
            </h2>
            <button onClick={next} aria-label="Tháng sau">
              <ChevronRight />
            </button>
          </div>
          <div className="calendar-grid week">
            <b>CN</b>
            <b>T2</b>
            <b>T3</b>
            <b>T4</b>
            <b>T5</b>
            <b>T6</b>
            <b>T7</b>
          </div>
          <div className="calendar-grid">
            {Array.from({ length: calendar.first }, (_, i) => (
              <i key={`empty-${i}`} />
            ))}
            {calendar.days.map(day => (
              <button
                key={day.solarDay}
                className={`${day.solarDay === now.getDate() && view.getMonth() === now.getMonth() && view.getFullYear() === now.getFullYear() ? 'today' : ''} ${lunarEvents[day.lunarDay] ? 'holy' : ''}`}
                title={lunarEvents[day.lunarDay] || `Âm lịch: ${day.lunarDay}/${Math.abs(day.lunarMonth)}`}
              >
                <span>{day.solarDay}</span>
                <small>{day.lunarDay === 1 ? `${day.lunarDay}/${Math.abs(day.lunarMonth)}` : day.lunarDay}</small>
              </button>
            ))}
          </div>
          <p className="calendar-legend">
            <span /> Mùng Một, ngày 8, Rằm và ngày 23 âm lịch · <i /> Hôm nay
          </p>
        </section>
        <aside className="event-list">
          <div className="today-lunar">
            <MoonStar />
            <small>Hôm nay · Âm lịch</small>
            <strong>
              {todayLunar.getDay()} tháng {Math.abs(todayLunar.getMonth())}
            </strong>
            <span>{todayLunar.getMonth() < 0 ? 'Tháng nhuận · ' : ''}Ngày bình an · Nên giữ tâm tĩnh</span>
          </div>
          <h3>
            <BellRing /> Ngày đáng nhớ
          </h3>
          {calendar.events.map(day => (
            <article key={day.solarDay}>
              <div>
                <b>{day.solarDay}</b>
                <small>Dương lịch</small>
              </div>
              <p>
                {lunarEvents[day.lunarDay]}
                <span>
                  {day.lunarDay}/{Math.abs(day.lunarMonth)} âm lịch
                </span>
              </p>
            </article>
          ))}
          <p className="data-note">Âm lịch được tính trực tiếp từ ngày dương lịch, không dùng dữ liệu mẫu.</p>
        </aside>
      </div>
    </div>
  )
}
