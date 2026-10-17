import { useMemo, useState } from 'react'
import { ArrowRight, History, RotateCcw, ScrollText, Share2, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fortunes } from '../data/fortunes'
import { eligibleFortuneIds, sameVietnamDay } from '../lib/business'
import { useApp } from '../store/AppContext'

export function FortunePage() {
  const { state, addDraw, setToast } = useApp()
  const [drawing, setDrawing] = useState(false)
  const [selected, setSelected] = useState<number | null>(state.draws[0]?.fortuneId ?? null)
  const [tab, setTab] = useState<'message' | 'work' | 'love' | 'health'>('message')
  const todayCount = state.draws.filter(d => sameVietnamDay(d.at)).length
  const fortune = fortunes.find(f => f.id === selected)
  const draw = () => {
    if (!state.incenseLitThisSession) {
      setToast('Hãy thắp ít nhất một nén hương trong phiên này trước khi xin quẻ.')
      return
    }
    if (todayCount >= 3) {
      setToast('Bạn đã đủ 3 lần xin quẻ hôm nay. Hẹn gặp lại vào ngày mai.')
      return
    }
    setDrawing(true)
    setTimeout(() => {
      const ids = eligibleFortuneIds(state.draws, fortunes.length)
      const pool = ids.length ? ids : fortunes.map(f => f.id)
      const choice = pool[Math.floor(Math.random() * pool.length)]
      addDraw(choice)
      setSelected(choice)
      setDrawing(false)
    }, 1200)
  }
  const history = useMemo(
    () => state.draws.slice(0, 8).map(d => ({ ...d, fortune: fortunes.find(f => f.id === d.fortuneId)! })),
    [state.draws]
  )
  return (
    <div className="page-container fortune-page">
      <header className="page-heading">
        <p className="eyebrow centered">
          <span /> Một lời chỉ dẫn <span />
        </p>
        <h1>
          Xin một quẻ <em>an lành</em>
        </h1>
        <p>Giữ lòng tĩnh, nghĩ về điều bạn đang băn khoăn rồi nhẹ nhàng xin quẻ.</p>
      </header>
      {!fortune || drawing ? (
        <section className="fortune-draw-card">
          <div className={drawing ? 'fortune-tube shaking' : 'fortune-tube'}>
            <span>籤</span>
            <i />
            <i />
            <i />
            <i />
          </div>
          <h2>{drawing ? 'Đang lắng nghe lòng mình…' : 'Thành tâm xin quẻ'}</h2>
          <p>
            {state.incenseLitThisSession
              ? 'Bạn đã thắp tâm hương. Khi sẵn sàng, hãy xin một lời lành.'
              : 'Theo nghi thức, bạn cần thắp một nén tâm hương trước.'}
          </p>
          {!state.incenseLitThisSession ? (
            <Link className="button soft" to="/chua/an-nhien">
              Thắp hương trước <ArrowRight />
            </Link>
          ) : (
            <button disabled={drawing || todayCount >= 3} className="button primary" onClick={draw}>
              <Sparkles /> {drawing ? 'Đang xin quẻ…' : 'Xin quẻ hôm nay'}
            </button>
          )}
          <small>Còn {Math.max(0, 3 - todayCount)}/3 lượt hôm nay</small>
        </section>
      ) : (
        <section className="fortune-result">
          <div className="fortune-paper">
            <div className="fortune-number">Quẻ số {fortune.id.toString().padStart(2, '0')}</div>
            <span className="fortune-level">{fortune.level}</span>
            <h2>{fortune.title}</h2>
            <p className="poem">
              {fortune.poem.split(' / ').map(x => (
                <span key={x}>{x}</span>
              ))}
            </p>
            <div className="seal">
              安<br />然
            </div>
          </div>
          <div className="fortune-reading">
            <p className="eyebrow">
              <span /> Lời giải
            </p>
            <div className="reading-tabs">
              {(
                [
                  ['message', 'Tổng quan'],
                  ['work', 'Công việc'],
                  ['love', 'Tình cảm'],
                  ['health', 'Sức khỏe'],
                ] as const
              ).map(([id, label]) => (
                <button className={tab === id ? 'active' : ''} onClick={() => setTab(id)} key={id}>
                  {label}
                </button>
              ))}
            </div>
            <p className="reading-text">{fortune[tab]}</p>
            <p className="entertainment-note">
              Nội dung mang tính động viên và giải trí. Hãy tự tin vào lựa chọn của bạn.
            </p>
            <div className="result-actions">
              <button
                className="button outline"
                onClick={() => {
                  setSelected(null)
                  setTab('message')
                }}
              >
                <RotateCcw /> Xin quẻ khác
              </button>
              <button
                className="button soft"
                onClick={async () => {
                  const text = `Quẻ ${fortune.id}: ${fortune.title} — ${fortune.message}`
                  if (navigator.share) await navigator.share({ title: 'Quẻ an lành', text })
                  else {
                    await navigator.clipboard.writeText(text)
                    setToast('Đã sao chép nội dung quẻ để chia sẻ.')
                  }
                }}
              >
                <Share2 /> Chia sẻ
              </button>
            </div>
          </div>
        </section>
      )}
      {history.length > 0 && (
        <section className="history-section">
          <h2>
            <History /> Lịch sử xin quẻ
          </h2>
          <div className="history-list">
            {history.map(x => (
              <button onClick={() => setSelected(x.fortuneId)} key={x.at}>
                <span className="mini-scroll">
                  <ScrollText />
                </span>
                <span>
                  <b>
                    Quẻ {x.fortune.id.toString().padStart(2, '0')} · {x.fortune.title}
                  </b>
                  <small>{new Date(x.at).toLocaleString('vi-VN')}</small>
                </span>
                <em>{x.fortune.level}</em>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
