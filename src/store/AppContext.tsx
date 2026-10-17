import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { onIdTokenChanged, signInWithPopup, signOut } from 'firebase/auth'
import { collection, doc, onSnapshot, orderBy, query, runTransaction, setDoc, where, type DocumentData } from 'firebase/firestore'
import type { IncenseStick, LeaderboardEntry, MeritSource, Offering, PersistedState, User, Wish, WishStatus } from '../types'
import { pointsToday, todayKey } from '../lib/business'
import { auth, db, firebaseConfigured, googleProvider, requireFirebase } from '../lib/firebase'

const makeId = () => crypto.randomUUID()
const emptyState = (): PersistedState => ({
  guestId: '', user: null, users: [], merit: 0, meritLogs: [], incense: [], incenseLitThisSession: false,
  mokiTaps: 0, draws: [], wishes: [], reactions: [], reports: [], checkins: [], offerings: [], soundOn: false,
})

type PersonalData = Pick<PersistedState, 'merit'|'meritLogs'|'incense'|'mokiTaps'|'draws'|'checkins'|'offerings'|'soundOn'>
const personalData = (state: PersistedState): PersonalData => ({
  merit: state.merit, meritLogs: state.meritLogs, incense: state.incense, mokiTaps: state.mokiTaps,
  draws: state.draws, checkins: state.checkins, offerings: state.offerings, soundOn: state.soundOn,
})
const readPersonal = (data: DocumentData): Partial<PersonalData> => ({
  merit: typeof data.merit === 'number' ? data.merit : 0,
  meritLogs: Array.isArray(data.meritLogs) ? data.meritLogs : [],
  incense: Array.isArray(data.incense) ? data.incense : [],
  mokiTaps: typeof data.mokiTaps === 'number' ? data.mokiTaps : 0,
  draws: Array.isArray(data.draws) ? data.draws : [],
  checkins: Array.isArray(data.checkins) ? data.checkins : [],
  offerings: Array.isArray(data.offerings) ? data.offerings : [],
  soundOn: data.soundOn === true,
})

type AppActions = {
  state: PersistedState; leaderboard: LeaderboardEntry[]; firebaseReady: boolean; firebaseError: string | null
  toast: string | null; setToast: (value: string | null) => void
  addMerit: (source: MeritSource, points: number, label: string, sourceCap?: number) => number
  lightIncense: (qty: 1 | 3) => boolean; strikeMoki: () => void; setSound: (value: boolean) => void
  addDraw: (fortuneId: number) => void; loginWithGoogle: () => Promise<void>; logout: () => Promise<void>
  addWish: (content: string, anonymous: boolean) => void; moderateWish: (wishId: string, status: WishStatus) => void
  reactWish: (wishId: string) => boolean; reportWish: (wishId: string) => boolean
  checkin: () => boolean; toggleOffering: (offering: Offering) => void
}

const AppContext = createContext<AppActions | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(emptyState)
  const stateRef = useRef(state)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [firebaseReady, setFirebaseReady] = useState(false)
  const [firebaseError, setFirebaseError] = useState<string | null>(firebaseConfigured ? null : 'Thiếu cấu hình Firebase trong .env.local.')
  const [toast, setToast] = useState<string | null>(null)

  const replaceState = useCallback((next: PersistedState) => { stateRef.current = next; setState(next) }, [])
  const showError = useCallback((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Không thể kết nối Firebase.'
    setFirebaseError(message); setToast(`Firebase: ${message}`)
  }, [])
  const showDataError = useCallback((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Không thể đọc dữ liệu Firestore.'
    setToast(`Firestore: ${message}`)
  }, [])
  const savePersonal = useCallback(async (next: PersistedState) => {
    if (!db || !auth?.currentUser) return
    const uid = auth.currentUser.uid
    try {
      await setDoc(doc(db, 'user_states', uid), { ...personalData(next), updatedAt: new Date().toISOString() }, { merge: true })
      if (!auth.currentUser.isAnonymous && next.user) {
        await setDoc(doc(db, 'leaderboard', uid), { name: next.user.name, merit: next.merit, updatedAt: new Date().toISOString() }, { merge: true })
      }
    } catch (error) { showError(error) }
  }, [showError])
  const updatePersonal = useCallback((updater: (current: PersistedState) => PersistedState) => {
    const next = updater(stateRef.current); replaceState(next); void savePersonal(next); return next
  }, [replaceState, savePersonal])

  useEffect(() => {
    if (!auth || !db) { setFirebaseReady(true); return }
    const activeAuth = auth; const activeDb = db
    let unsubscribePersonal = () => {}; let unsubscribeWishes = () => {}; let unsubscribeUsers = () => {}; let unsubscribeLeaderboard = () => {}
    const unsubscribeAuth = onIdTokenChanged(activeAuth, async firebaseUser => {
      unsubscribePersonal(); unsubscribeWishes(); unsubscribeUsers(); unsubscribeLeaderboard()
      const subscribeSharedData = (isAdmin: boolean) => {
        unsubscribeLeaderboard = onSnapshot(query(collection(activeDb, 'leaderboard'), orderBy('merit', 'desc')),
          snapshot => setLeaderboard(snapshot.docs.slice(0, 20).map(item => ({ id: item.id, name: String(item.data().name || 'Thiện hữu'), merit: Number(item.data().merit || 0) }))), showDataError)
        const wishQuery = isAdmin ? query(collection(activeDb, 'wishes'), orderBy('createdAt', 'desc'))
          : query(collection(activeDb, 'wishes'), where('status', '==', 'approved'), orderBy('createdAt', 'desc'))
        unsubscribeWishes = onSnapshot(wishQuery, snapshot => {
          replaceState({ ...stateRef.current, wishes: snapshot.docs.map(item => ({ id: item.id, ...item.data() } as Wish)) })
        }, showDataError)
      }
      if (!firebaseUser) {
        replaceState({ ...emptyState(), guestId: makeId() }); setLeaderboard([])
        subscribeSharedData(false); setFirebaseReady(true); setFirebaseError(null); return
      }
      if (firebaseUser.isAnonymous) { await signOut(activeAuth); return }
      try {
        const token = await firebaseUser.getIdTokenResult()
        const isAdmin = token.claims.admin === true
        const appUser: User = {
          id: firebaseUser.uid, name: firebaseUser.displayName || 'Thiện hữu', email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || undefined, role: isAdmin ? 'admin' : 'user',
        }
        replaceState({ ...emptyState(), guestId: firebaseUser.uid, user: appUser })
        subscribeSharedData(isAdmin)
        void setDoc(doc(activeDb, 'users', firebaseUser.uid), {
          name: appUser.name, email: appUser.email, photoURL: appUser.photoURL || null, provider: 'google.com',
          createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(), lastSeenAt: new Date().toISOString(),
        }, { merge: true }).catch(showDataError)
        unsubscribePersonal = onSnapshot(doc(activeDb, 'user_states', firebaseUser.uid), async snapshot => {
          if (!snapshot.exists()) await setDoc(snapshot.ref, { ...personalData(emptyState()), updatedAt: new Date().toISOString() })
          else {
            const data = readPersonal(snapshot.data()); const current = stateRef.current
            replaceState({ ...current, ...data, guestId: firebaseUser.uid, user: appUser,
              incense: data.incense?.filter(item => item.burnUntil > Date.now()) || [] })
          }
          setFirebaseReady(true); setFirebaseError(null)
        }, showDataError)
        if (isAdmin) unsubscribeUsers = onSnapshot(collection(activeDb, 'users'), snapshot => {
          const users = snapshot.docs.map(item => { const data = item.data(); return {
            id: item.id, name: String(data.name || 'Thiện hữu'), email: String(data.email || ''),
            role: item.id === firebaseUser.uid ? 'admin' : 'user', photoURL: data.photoURL || undefined,
          } as User }); replaceState({ ...stateRef.current, users })
        }, showDataError)
        setFirebaseReady(true); setFirebaseError(null)
      } catch (error) { showError(error); setFirebaseReady(true) }
    })
    return () => { unsubscribeAuth(); unsubscribePersonal(); unsubscribeWishes(); unsubscribeUsers(); unsubscribeLeaderboard() }
  }, [replaceState, showDataError, showError])

  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 3200); return () => clearTimeout(timer) }, [toast])
  const grantMerit = (current: PersistedState, source: MeritSource, points: number, label: string, sourceCap = 100) => {
    const granted = Math.max(0, Math.min(points, sourceCap-pointsToday(current.meritLogs, source), 100-pointsToday(current.meritLogs)))
    return { granted, state: granted ? { ...current, merit: current.merit+granted, meritLogs: [{ id:makeId(), source, points:granted, at:new Date().toISOString(), label }, ...current.meritLogs] } : current }
  }
  const addMerit = useCallback((source: MeritSource, points: number, label: string, sourceCap = 100) => {
    const result = grantMerit(stateRef.current, source, points, label, sourceCap); if (result.granted) updatePersonal(() => result.state); return result.granted
  }, [updatePersonal])
  const lightIncense = (qty: 1 | 3) => {
    const current=stateRef.current; const active=current.incense.filter(item=>item.burnUntil>Date.now())
    if(active.length+qty>9){setToast('Bàn hương chỉ giữ tối đa 9 nén đang cháy.');return false}
    const now=Date.now(); const sticks:IncenseStick[]=Array.from({length:qty},()=>({id:makeId(),litAt:now,burnUntil:now+300_000}))
    const result=grantMerit({...current,incense:[...active,...sticks],incenseLitThisSession:true},'incense',1,`Thắp ${qty} nén hương`,10)
    updatePersonal(()=>result.state); return true
  }
  const strikeMoki=()=>updatePersonal(current=>{const next={...current,mokiTaps:current.mokiTaps+1};return next.mokiTaps%10===0?grantMerit(next,'moki',1,'10 tiếng mõ',50).state:next})
  const setSound=(value:boolean)=>updatePersonal(current=>({...current,soundOn:value}))
  const addDraw=(fortuneId:number)=>updatePersonal(current=>{const first=!current.draws.some(d=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(d.at))===todayKey());const next={...current,draws:[{fortuneId,at:new Date().toISOString()},...current.draws]};return first?grantMerit(next,'fortune',3,'Rút quẻ đầu ngày',3).state:next})
  const loginWithGoogle=async()=>{
    const { auth: activeAuth }=requireFirebase()
    try {
      await signInWithPopup(activeAuth,googleProvider)
      setToast('Đăng nhập Google thành công.')
    } catch(error){showError(error);throw error}
  }
  const logout=async()=>{const {auth:activeAuth}=requireFirebase();await signOut(activeAuth);setToast('Bạn đã đăng xuất.')}
  const addWish=(content:string,anonymous:boolean)=>{const current=stateRef.current;if(!current.user||!db)return;const wish:Wish={id:makeId(),authorId:current.user.id,author:anonymous?'Người hữu duyên':current.user.name,content:content.trim(),anonymous,status:'pending',reactions:[],reports:[],createdAt:new Date().toISOString()};void setDoc(doc(db,'wishes',wish.id),wish).then(()=>setToast('Sớ đã được gửi và đang chờ duyệt.')).catch(showError)}
  const moderateWish=(wishId:string,status:WishStatus)=>{if(!db)return;const activeDb=db;void runTransaction(activeDb,async transaction=>{
    const wishRef=doc(activeDb,'wishes',wishId);const wishSnap=await transaction.get(wishRef);if(!wishSnap.exists())return
    const wish=wishSnap.data() as Wish;let userRef;let userSnap
    if(status==='approved'&&wish.status!=='approved'){userRef=doc(activeDb,'user_states',wish.authorId);userSnap=await transaction.get(userRef)}
    transaction.update(wishRef,{status,moderatedAt:new Date().toISOString(),moderatedBy:auth?.currentUser?.uid})
    if(userRef&&userSnap?.exists()){const data=userSnap.data();const logs=Array.isArray(data.meritLogs)?data.meritLogs:[];if(!logs.some((log:{label?:string})=>log.label===`Sớ ${wishId} được duyệt`)){const nextMerit=Number(data.merit||0)+5;transaction.update(userRef,{merit:nextMerit,meritLogs:[{id:makeId(),source:'wish',points:5,at:new Date().toISOString(),label:`Sớ ${wishId} được duyệt`},...logs]});transaction.set(doc(activeDb,'leaderboard',wish.authorId),{name:wish.anonymous?'Người hữu duyên':wish.author,merit:nextMerit,updatedAt:new Date().toISOString()},{merge:true})}}
  }).catch(showError)}
  const reactWish=(wishId:string)=>{const current=stateRef.current;const actorId=current.user?.id;const wish=current.wishes.find(item=>item.id===wishId);if(!db||!actorId||!wish||wish.authorId===actorId||wish.reactions.includes(actorId))return false;const activeDb=db;void runTransaction(activeDb,async transaction=>{const ref=doc(activeDb,'wishes',wishId);const snap=await transaction.get(ref);if(!snap.exists())return;const reactions=(snap.data().reactions||[]) as string[];if(!reactions.includes(actorId))transaction.update(ref,{reactions:[...reactions,actorId]})}).catch(showDataError);return true}
  const reportWish=(wishId:string)=>{const current=stateRef.current;const actorId=current.user?.id;const wish=current.wishes.find(item=>item.id===wishId);if(!db||!actorId||!wish||wish.authorId===actorId||wish.reports.includes(actorId))return false;const activeDb=db;void runTransaction(activeDb,async transaction=>{const ref=doc(activeDb,'wishes',wishId);const snap=await transaction.get(ref);if(!snap.exists())return;const reports=(snap.data().reports||[]) as string[];if(!reports.includes(actorId)){const next=[...reports,actorId];transaction.update(ref,{reports:next,...(next.length>=3?{status:'hidden'}:{})})}}).then(()=>setToast('Cảm ơn bạn đã báo cáo. Ban quản trị sẽ xem xét.')).catch(showDataError);return true}
  const checkin=()=>{const today=todayKey();if(stateRef.current.checkins.includes(today))return false;updatePersonal(current=>grantMerit({...current,checkins:[...current.checkins,today]},'checkin',2,'Điểm danh an lành',2).state);setToast('Điểm danh thành công · +2 công đức');return true}
  const toggleOffering=(offering:Offering)=>updatePersonal(current=>({...current,offerings:current.offerings.includes(offering)?current.offerings.filter(item=>item!==offering):[...current.offerings,offering]}))

  const value=useMemo(()=>({state,leaderboard,firebaseReady,firebaseError,toast,setToast,addMerit,lightIncense,strikeMoki,setSound,addDraw,loginWithGoogle,logout,addWish,moderateWish,reactWish,reportWish,checkin,toggleOffering}),[state,leaderboard,firebaseReady,firebaseError,toast,addMerit])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp=()=>{const value=useContext(AppContext);if(!value)throw new Error('useApp must be inside provider');return value}
