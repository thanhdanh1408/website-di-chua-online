import { useState } from 'react'
import { HeartHandshake, LogIn, LogOut, ShieldCheck } from 'lucide-react'
import { useApp } from '../store/AppContext'

export function AccountPage() {
  const { state, loginWithGoogle, logout, firebaseReady, firebaseError } = useApp()
  const [working, setWorking] = useState(false)
  const login = async () => {
    setWorking(true)
    try {
      await loginWithGoogle()
    } catch {
      /* Thông báo lỗi do context hiển thị. */
    } finally {
      setWorking(false)
    }
  }
  if (state.user)
    return (
      <div className="page-container account-page">
        <header className="page-heading">
          <p className="eyebrow centered">
            <span /> Hồ sơ thiện duyên <span />
          </p>
          <h1>
            Chào, <em>{state.user.name}</em>
          </h1>
        </header>
        <section className="profile-card">
          {state.user.photoURL ? (
            <img className="profile-avatar" src={state.user.photoURL} alt="" referrerPolicy="no-referrer" />
          ) : (
            <div className="profile-avatar">{state.user.name[0].toUpperCase()}</div>
          )}
          <div>
            <h2>{state.user.name}</h2>
            <p>{state.user.email}</p>
            <span>
              <ShieldCheck /> {state.user.role === 'admin' ? 'Quản trị viên' : 'Thành viên Google'}
            </span>
          </div>
          <div className="profile-merit">
            <HeartHandshake />
            <b>{state.merit}</b>
            <small>công đức</small>
          </div>
        </section>
        <button className="button outline logout" onClick={() => void logout()}>
          <LogOut /> Đăng xuất
        </button>
      </div>
    )
  return (
    <div className="page-container account-page">
      <header className="page-heading">
        <p className="eyebrow centered">
          <span /> Lưu hành trình <span />
        </p>
        <h1>
          Đăng nhập để <em>kết nối</em>
        </h1>
        <p>Dữ liệu hành trình được đồng bộ an toàn qua Firebase trên các thiết bị của bạn.</p>
      </header>
      <section className="auth-card">
        <div className="auth-art">
          <span>安</span>
          <h2>Mỗi ngày một chút an</h2>
          <p>
            Khách có thể tham quan mà không cần tài khoản. Thành viên và quản trị viên đăng nhập duy nhất bằng Google.
          </p>
        </div>
        <div className="firebase-auth-panel">
          <h2>Chào bạn trở lại</h2>
          <p>Tiếp tục bằng tài khoản Google để viết lời nguyện, điểm danh và đồng bộ công đức.</p>
          {firebaseError && <p className="firebase-error">{firebaseError}</p>}
          <button
            className="button primary full"
            type="button"
            disabled={!firebaseReady || working || !!firebaseError}
            onClick={() => void login()}
          >
            <LogIn /> {!firebaseReady ? 'Đang kết nối Firebase…' : working ? 'Đang mở Google…' : 'Tiếp tục với Google'}
          </button>
          <small>Ứng dụng không hỗ trợ tài khoản mật khẩu riêng.</small>
        </div>
      </section>
    </div>
  )
}
