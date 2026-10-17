import { CheckCircle2, X } from 'lucide-react'
import { useApp } from '../store/AppContext'
export function Toast(){const{toast,setToast}=useApp();if(!toast)return null;return <div className="toast" role="status"><CheckCircle2/><span>{toast}</span><button aria-label="Đóng" onClick={()=>setToast(null)}><X/></button></div>}
