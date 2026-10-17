import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { BellRing, CircleUserRound, HeartHandshake, Menu, Volume2, VolumeX, X } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { getLevel } from '../lib/business'
import { AmbientEffects } from './AmbientEffects'

const nav=[['/chua/an-nhien','Vào chùa'],['/xin-xam','Xin xăm'],['/to-nguyen','Tỏ nguyện'],['/cong-duc','Công đức'],['/lich','Lịch an lành'],['/thien','Thiền']]

export function Layout({children}:{children:React.ReactNode}){
  const {state,setSound}=useApp();const [open,setOpen]=useState(false);const level=getLevel(state.merit)
  return <div className="app-shell">
    <AmbientEffects/>
    <header className="site-header">
      <Link className="brand" to="/" onClick={()=>setOpen(false)}><span className="brand-mark">安</span><span><strong>An Nhiên Tự</strong><small>Một khoảng lặng giữa đời</small></span></Link>
      <nav className={open?'main-nav open':'main-nav'} aria-label="Điều hướng chính">{nav.map(([to,label])=><NavLink key={to} to={to} onClick={()=>setOpen(false)}>{label}</NavLink>)}</nav>
      <div className="header-actions">
        <button className="icon-button" aria-label={state.soundOn?'Tắt âm thanh':'Bật âm thanh'} onClick={()=>setSound(!state.soundOn)}>{state.soundOn?<Volume2/>:<VolumeX/>}</button>
        <Link className="merit-pill" to="/cong-duc"><HeartHandshake/><span><b>{state.merit}</b><small>{level.name}</small></span></Link>
        <Link className="icon-button account" aria-label="Tài khoản" to="/tai-khoan"><CircleUserRound/></Link>
        <button className="menu-button" aria-label="Mở menu" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
      </div>
    </header>
    <main>{children}</main>
    <footer><div className="footer-brand"><span className="brand-mark small">安</span><div><b>An Nhiên Tự</b><p>Không gian số dành cho sự tĩnh tâm.</p></div></div><div className="footer-links"><Link to="/gioi-thieu">Giới thiệu & quyền riêng tư</Link><Link to="/admin">Quản trị</Link></div><p className="disclaimer"><BellRing size={15}/> Trải nghiệm mang tính giải trí và tĩnh tâm, không thay thế nghi lễ thực tế.</p></footer>
  </div>
}
