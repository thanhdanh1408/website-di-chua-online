import { useEffect, useRef, useState } from 'react'
import { Clock3, Info, Sparkles, Volume2 } from 'lucide-react'
import { useApp } from '../store/AppContext'

let woodblockAudioContext: AudioContext | null = null
let woodblockSample: AudioBuffer | null = null
let woodblockSampleData: Promise<ArrayBuffer> | null = null

function preloadWoodblockSample(){
  woodblockSampleData??=fetch('/audio/mokugyo.mp3').then(response=>{if(!response.ok)throw new Error('Unable to load mokugyo sample');return response.arrayBuffer()})
}

function playSynthWoodblock(ctx:AudioContext){
  const now=ctx.currentTime;const master=ctx.createGain();const compressor=ctx.createDynamicsCompressor()
  master.gain.setValueAtTime(.68,now);master.gain.exponentialRampToValueAtTime(.001,now+.62);master.connect(compressor).connect(ctx.destination)
  ;[[176,.7,.42],[264,.38,.3],[396,.2,.2],[528,.08,.12]].forEach(([frequency,volume,duration])=>{
    const osc=ctx.createOscillator();const gain=ctx.createGain();osc.type=frequency<200?'sine':'triangle';osc.frequency.setValueAtTime(frequency,now);osc.frequency.exponentialRampToValueAtTime(frequency*.86,now+duration);gain.gain.setValueAtTime(volume,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);osc.connect(gain).connect(master);osc.start(now);osc.stop(now+duration+.03)
  })
  const buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.07),ctx.sampleRate);const channel=buffer.getChannelData(0)
  for(let i=0;i<channel.length;i++)channel[i]=(Math.random()*2-1)*(1-i/channel.length)
  const noise=ctx.createBufferSource();const filter=ctx.createBiquadFilter();const noiseGain=ctx.createGain();noise.buffer=buffer;filter.type='bandpass';filter.frequency.value=1150;filter.Q.value=.8;noiseGain.gain.setValueAtTime(.18,now);noiseGain.gain.exponentialRampToValueAtTime(.001,now+.075);noise.connect(filter).connect(noiseGain).connect(master);noise.start(now)
}

async function playWoodblock(){
  const AudioCtx=window.AudioContext||(window as any).webkitAudioContext;if(!AudioCtx)return
  const ctx=woodblockAudioContext??new AudioCtx();woodblockAudioContext=ctx
  if(ctx.state==='suspended')await ctx.resume()
  try{
    preloadWoodblockSample();if(!woodblockSample)woodblockSample=await ctx.decodeAudioData((await woodblockSampleData!).slice(0))
    const source=ctx.createBufferSource();const dry=ctx.createGain();const compressor=ctx.createDynamicsCompressor();const roomDelay=ctx.createDelay(.2);const roomFilter=ctx.createBiquadFilter();const roomGain=ctx.createGain()
    source.buffer=woodblockSample;source.playbackRate.value=.985+Math.random()*.03;dry.gain.value=.86;compressor.threshold.value=-12;compressor.knee.value=15;compressor.ratio.value=3;compressor.attack.value=.003;compressor.release.value=.18
    roomDelay.delayTime.value=.058+Math.random()*.012;roomFilter.type='lowpass';roomFilter.frequency.value=1500;roomGain.gain.value=.075
    source.connect(dry).connect(compressor).connect(ctx.destination);source.connect(roomDelay).connect(roomFilter).connect(roomGain).connect(compressor);source.start()
  }catch{playSynthWoodblock(ctx)}
}

export function Temple(){
  const {state,lightIncense,strikeMoki,toggleOffering}=useApp();const [qty,setQty]=useState<1|3>(1);const [plus,setPlus]=useState(0);const [striking,setStriking]=useState(false);const [lighting,setLighting]=useState(false);const [ceremonyQty,setCeremonyQty]=useState<1|3>(1);const [lightingId,setLightingId]=useState(0);const [now,setNow]=useState(Date.now());const lastTap=useRef(0);const strikeTimer=useRef<number|null>(null);const lightingTimer=useRef<number|null>(null);const insertionTimer=useRef<number|null>(null)
  useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t)},[])
  useEffect(()=>{preloadWoodblockSample()},[])
  useEffect(()=>()=>{if(strikeTimer.current)clearTimeout(strikeTimer.current)},[])
  useEffect(()=>()=>{if(lightingTimer.current)clearTimeout(lightingTimer.current);if(insertionTimer.current)clearTimeout(insertionTimer.current)},[])
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.code==='Space'&&!(e.target instanceof HTMLInputElement)&&!(e.target instanceof HTMLTextAreaElement)){e.preventDefault();hit()}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)})
  const active=state.incense.filter(i=>i.burnUntil>now)
  const hit=()=>{const t=Date.now();if(t-lastTap.current<110)return;lastTap.current=t;strikeMoki();setPlus(p=>p+1);setStriking(false);requestAnimationFrame(()=>setStriking(true));if(strikeTimer.current)clearTimeout(strikeTimer.current);strikeTimer.current=window.setTimeout(()=>setStriking(false),430);if(state.soundOn)void playWoodblock()}
  const beginLighting=()=>{if(active.length+qty>9){lightIncense(qty);return}const selectedQty=qty;setCeremonyQty(selectedQty);setLightingId(id=>id+1);setLighting(true);if(insertionTimer.current)clearTimeout(insertionTimer.current);insertionTimer.current=window.setTimeout(()=>lightIncense(selectedQty),430);if(lightingTimer.current)clearTimeout(lightingTimer.current);lightingTimer.current=window.setTimeout(()=>setLighting(false),1050)}
  return <div className="temple-page">
    <section className="temple-heading"><p className="eyebrow centered"><span/> An Nhiên Tự <span/></p><h1>Không gian <em>tĩnh tâm</em></h1><p>Hít một hơi thật sâu. Mọi nghi thức ở đây đều là lời nhắc để trở về với chính mình.</p></section>
    <section className={`altar-scene ${lighting?'is-lighting':''}`}>
      <div className="altar-halo"/><div className="buddha-symbol">☸</div>
      {lighting&&<div className="incense-ceremony sequence-candle-first" key={lightingId} aria-hidden="true"><span className={`prepared-incense qty-${ceremonyQty}`}>{Array.from({length:ceremonyQty},(_,i)=><i key={i}/>)}</span><span className="ceremony-ring ring-one"/><span className="ceremony-ring ring-two"/><span className="lighting-flame"><i/></span><span className="ember-shower">{Array.from({length:10},(_,i)=><i key={i}/>)}</span><p>Châm lửa · Cắm hương · Tĩnh tâm</p></div>}
      <div className="offering-display left">{state.offerings.includes('hoa-sen')&&<span className="lotus">✿</span>}{state.offerings.includes('trai-cay')&&<span className="fruit">● ● ●</span>}</div>
      <div className="incense-bowl">{active.map((stick,i)=><span className="incense-stick" key={stick.id} style={{left:`${42+(i%3)*8}%`,transform:`rotate(${(i%3-1)*4}deg)`}}><i/></span>)}<div className="bowl-mark">安</div></div>
      <div className="offering-display right">{state.offerings.includes('den-nen')&&<span className="candle">♨</span>}</div>
      <div className="altar-table"/>
    </section>
    <section className="ritual-controls">
      <div className="control-card incense-control"><div className="control-title"><span><Sparkles/></span><div><small>Nghi thức 01</small><h2>Thắp tâm hương</h2></div></div><p>Mỗi lần thắp cộng 1 công đức, tối đa 10 điểm mỗi ngày.</p>
        <div className="segment"><button className={qty===1?'active':''} onClick={()=>setQty(1)}>1 nén</button><button className={qty===3?'active':''} onClick={()=>setQty(3)}>3 nén</button></div>
        <button className={`button primary full incense-button ${lighting?'is-lighting':''}`} disabled={lighting} onClick={beginLighting}><Sparkles/> {lighting?'Đang thắp tâm hương…':'Thắp hương'}</button><div className="tiny-status"><Clock3/> {active.length?`${active.length} nén đang cháy · còn ${Math.ceil(Math.max(...active.map(i=>i.burnUntil-now))/60000)} phút`:'Bàn hương đang trống'}</div>
      </div>
      <div className="control-card moki-control" id="moki"><div className="control-title"><span><Volume2/></span><div><small>Nghi thức 02</small><h2>Gõ mõ tĩnh tâm</h2></div></div><p>Chạm vào mõ hoặc nhấn phím cách. Mỗi 10 tiếng được 1 công đức.</p>
        <button className={`woodblock ${striking?'is-striking':''}`} onClick={hit} aria-label="Gõ mõ"><span className="sound-wave wave-one"/><span className="sound-wave wave-two"/><span className="impact-glow" key={`impact-${plus}`}/><span className="stick" key={`stick-${plus}`}><i/></span><span className="wood-grain"/><i className="moki-mark">安</i>{plus>0&&<b key={plus}>+1</b>}<span className="impact-sparks" key={`sparks-${plus}`}>{[0,1,2,3,4].map(n=><i key={n}/>)}</span></button>
        <div className="moki-count"><strong>{state.mokiTaps.toLocaleString('vi-VN')}</strong><span>tiếng mõ hôm nay</span></div><small className="key-hint">Nhấn <kbd>Space</kbd> để gõ</small>
      </div>
    </section>
    <section className="offering-section"><div><p className="eyebrow"><span/> Dâng lễ</p><h2>Một chút lòng thành</h2><p>Chọn lễ vật tượng trưng để làm đẹp thêm bàn thờ. Không có giao dịch hay giá trị tiền tệ.</p></div><div className="offering-list">{([['hoa-sen','✿','Hoa sen'],['trai-cay','●','Trái lành'],['den-nen','♨','Đèn tâm']] as const).map(([id,icon,label])=><button onClick={()=>toggleOffering(id)} className={state.offerings.includes(id)?'selected':''} key={id}><i>{icon}</i><span>{label}</span><small>{state.offerings.includes(id)?'Đã dâng':'Chọn dâng'}</small></button>)}</div></section>
    <aside className="respect-note"><Info/><p><b>Một lời nhắc nhỏ</b><br/>Hãy thực hiện các nghi thức với sự chậm rãi và tôn trọng. Đây là trải nghiệm tĩnh tâm, không thay thế nghi lễ thực tế.</p></aside>
  </div>
}
