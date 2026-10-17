import { BarChart3, Check, Clock3, EyeOff, Flag, ShieldAlert, Users, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext'
export function AdminPage() {
  const { state, moderateWish } = useApp()
  if (state.user?.role !== 'admin')
    return (
      <div className="page-container admin-locked">
        <ShieldAlert />
        <h1>Khu vực quản trị</h1>
        <p>Bạn cần đăng nhập đúng tài khoản Google đã được cấp quyền quản trị.</p>
        <Link className="button primary" to="/tai-khoan">
          Đăng nhập bằng Google
        </Link>
      </div>
    )
  const pending = state.wishes.filter(w => w.status === 'pending' || w.status === 'hidden')
  return (
    <div className="page-container admin-page">
      <header className="admin-head">
        <div>
          <p className="eyebrow">
            <span /> Trung tâm vận hành
          </p>
          <h1>Tổng quan quản trị</h1>
        </div>
        <span>Quản trị viên · {state.user.name}</span>
      </header>
      <section className="stat-grid">
        <article>
          <Users />
          <span>Thành viên</span>
          <b>{state.users.length}</b>
          <small>Tài khoản Google</small>
        </article>
        <article>
          <Clock3 />
          <span>Sớ chờ duyệt</span>
          <b>{pending.length}</b>
          <small>Cần xử lý</small>
        </article>
        <article>
          <Flag />
          <span>Báo cáo</span>
          <b>{state.wishes.filter(w => w.reports.length).length}</b>
          <small>Trong Firestore</small>
        </article>
        <article>
          <BarChart3 />
          <span>Tiếng mõ</span>
          <b>{state.mokiTaps.toLocaleString('vi-VN')}</b>
          <small>Tài khoản của bạn</small>
        </article>
      </section>
      <section className="moderation-panel">
        <div className="panel-title">
          <div>
            <h2>Kiểm duyệt lời nguyện</h2>
            <p>Nội dung đang chờ duyệt hoặc đã bị ẩn do báo cáo.</p>
          </div>
          <span>{pending.length} mục</span>
        </div>
        {pending.length ? (
          pending.map(w => (
            <article key={w.id}>
              <div className="moderation-meta">
                <b>{w.author}</b>
                <span>{new Date(w.createdAt).toLocaleString('vi-VN')}</span>
                <em className={w.status}>{w.status === 'hidden' ? 'Đã ẩn' : 'Chờ duyệt'}</em>
              </div>
              <p>{w.content}</p>
              <div>
                <button onClick={() => moderateWish(w.id, 'approved')}>
                  <Check /> Duyệt
                </button>
                <button onClick={() => moderateWish(w.id, 'rejected')}>
                  <X /> Từ chối
                </button>
                <button onClick={() => moderateWish(w.id, 'hidden')}>
                  <EyeOff /> Ẩn
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">Không có nội dung nào đang chờ. Mọi việc đã được xử lý.</div>
        )}
      </section>
    </div>
  )
}
