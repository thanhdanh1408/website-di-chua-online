import { useMemo, useState } from 'react'
import { Flag, HandHeart, LockKeyhole, PenLine, Send, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { visibleWishes, validateWish } from '../lib/business'
import { useApp } from '../store/AppContext'

export function WishesPage() {
  const { state, addWish, reactWish, reportWish, setToast } = useApp()
  const [content, setContent] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [compose, setCompose] = useState(false)
  const wishes = useMemo(
    () => visibleWishes(state.wishes).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [state.wishes]
  )
  const submit = () => {
    const error = validateWish(content)
    if (error) {
      setToast(error)
      return
    }
    const today = state.wishes.filter(
      w => w.authorId === state.user?.id && new Date(w.createdAt).toDateString() === new Date().toDateString()
    ).length
    if (today >= 3) {
      setToast('Bạn đã gửi đủ 3 lời nguyện hôm nay.')
      return
    }
    addWish(content, anonymous)
    setContent('')
    setCompose(false)
  }
  return (
    <div className="page-container wishes-page">
      <header className="page-heading">
        <p className="eyebrow centered">
          <span /> Tường điều ước <span />
        </p>
        <h1>
          Nơi những lời nguyện <em>được lắng nghe</em>
        </h1>
        <p>Mỗi lời chân thành là một hạt mầm lành. Gửi lời chúc “Nam mô” để cùng vun tưới.</p>
        {state.user ? (
          <button className="button primary" onClick={() => setCompose(!compose)}>
            <PenLine /> Viết lời nguyện
          </button>
        ) : (
          <Link className="button primary" to="/tai-khoan">
            <LockKeyhole /> Đăng nhập để viết sớ
          </Link>
        )}
      </header>
      {compose && (
        <section className="wish-composer">
          <div className="composer-title">
            <span>
              <Sparkles />
            </span>
            <div>
              <h2>Gửi một lời nguyện</h2>
              <p>Lời nguyện sẽ được kiểm duyệt trước khi xuất hiện.</p>
            </div>
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            maxLength={280}
            placeholder="Mong rằng…"
          />
          <div className="composer-bottom">
            <label>
              <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} /> Đăng ẩn danh
            </label>
            <span>{content.length}/280</span>
            <button className="button primary" onClick={submit}>
              <Send /> Gửi lời nguyện
            </button>
          </div>
        </section>
      )}
      <div className="wish-wall">
        {wishes.map((wish, i) => (
          <article className={`wish-card tone-${i % 3}`} key={wish.id}>
            <div className="wish-top">
              <span className="wish-avatar">{wish.anonymous ? '☁' : wish.author[0]}</span>
              <div>
                <b>{wish.author}</b>
                <small>
                  {new Intl.RelativeTimeFormat('vi', { numeric: 'auto' }).format(
                    -Math.max(1, Math.round((Date.now() - +new Date(wish.createdAt)) / 3_600_000)),
                    'hour'
                  )}
                </small>
              </div>
              <button
                title="Báo cáo"
                onClick={() => {
                  if (!reportWish(wish.id))
                    setToast(state.user ? 'Bạn không thể báo cáo lời nguyện này.' : 'Hãy đăng nhập Google để báo cáo.')
                }}
              >
                <Flag />
              </button>
            </div>
            <p>{wish.content}</p>
            <div className="wish-bottom">
              <button
                onClick={() => {
                  if (!reactWish(wish.id))
                    setToast(
                      state.user
                        ? 'Mỗi người chỉ gửi một lời Nam mô và không thể tự thả cho mình.'
                        : 'Hãy đăng nhập Google để gửi lời Nam mô.'
                    )
                }}
              >
                <HandHeart /> Nam mô <span>{wish.reactions.length}</span>
              </button>
              <span>✿</span>
            </div>
          </article>
        ))}
      </div>
      <aside className="respect-note">
        <Sparkles />
        <p>
          <b>Không gian an toàn và tôn trọng</b>
          <br />
          Đừng chia sẻ thông tin cá nhân. Nội dung phản cảm, đường link, email và số điện thoại sẽ bị từ chối.
        </p>
      </aside>
    </div>
  )
}
