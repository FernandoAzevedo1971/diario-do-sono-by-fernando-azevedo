// ─────────────────────────────────────────────────────────────
// V2 — SERENO REFINADO (definitivo)
// Mudanças vs V1:
//  • Hero virou carrossel (TTS / Eficiência / Latência) — dots + swipe + autorotate suave
//  • Long-press na Eficiência → bottom-sheet com breakdown (lat, WASO, despertares, qualidade)
//  • Page transitions slide+fade entre Today/Diário/Histórico/IGI/Aparência
//  • Stagger sutil dos blocos na entrada (40ms de delay cada)
//  • Daily insight refinado: barra vertical fina, sem ícone gritante
//  • Sobriedade: menos sombra, mais respiro, sem watermark, sem gamificação
//  • Diário: mood sem emojis, escala mais clínica
// ─────────────────────────────────────────────────────────────

// ── Hooks ─────────────────────────────────────────────────────
function useLongPress(callback, { delay = 480, threshold = 10 } = {}) {
  const timerRef = React.useRef(null);
  const startPos = React.useRef({ x:0, y:0 });
  const fired = React.useRef(false);

  const start = (e) => {
    fired.current = false;
    startPos.current = { x: e.clientX ?? 0, y: e.clientY ?? 0 };
    timerRef.current = setTimeout(() => { fired.current = true; callback(e); }, delay);
  };
  const move = (e) => {
    if (!timerRef.current) return;
    const dx = (e.clientX ?? 0) - startPos.current.x;
    const dy = (e.clientY ?? 0) - startPos.current.y;
    if (Math.hypot(dx, dy) > threshold) {
      clearTimeout(timerRef.current); timerRef.current = null;
    }
  };
  const cancel = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  return {
    handlers: {
      onPointerDown: start,
      onPointerMove: move,
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
    },
    didFire: () => fired.current,
  };
}

function useSwipeIdx(count, opts = {}) {
  const { autoRotate = 0 } = opts;
  const [idx, setIdx] = React.useState(0);
  const [drag, setDrag] = React.useState({ active:false, dx:0, startX:0, paused:false });

  React.useEffect(() => {
    if (!autoRotate || drag.paused) return;
    const t = setTimeout(() => setIdx(i => (i+1) % count), autoRotate);
    return () => clearTimeout(t);
  }, [idx, drag.paused, autoRotate, count]);

  const onDown = (e) => setDrag(d => ({ ...d, active:true, dx:0, startX: e.clientX, paused:true }));
  const onMove = (e) => setDrag(d => d.active ? ({ ...d, dx: e.clientX - d.startX }) : d);
  const onUp = () => setDrag(d => {
    if (!d.active) return d;
    const threshold = 48;
    let next = idx;
    if (d.dx < -threshold && idx < count-1) next = idx+1;
    else if (d.dx > threshold && idx > 0) next = idx-1;
    setIdx(next);
    return { active:false, dx:0, startX:0, paused: d.paused };
  });

  return { idx, setIdx, drag, onDown, onMove, onUp };
}

// ── Style scaffolding ─────────────────────────────────────────
function SerenoV2Styles() {
  return (
    <style>{`
      @keyframes sv2In { 0% { opacity:0; transform: translateY(10px); } 100% { opacity:1; transform: none; } }
      .sv2-block { animation: sv2In 460ms cubic-bezier(0.22,0.61,0.36,1) both; }
      @keyframes sv2Sheet { 0% { transform: translateY(100%); } 100% { transform: none; } }
      .sv2-sheet { animation: sv2Sheet 380ms cubic-bezier(0.22,0.61,0.36,1) both; }
      @keyframes sv2Fade { 0% { opacity:0; } 100% { opacity:1; } }
      .sv2-fade { animation: sv2Fade 280ms ease both; }
      @keyframes sv2Ring { 0% { stroke-dashoffset: var(--c); } 100% { stroke-dashoffset: var(--off); } }
      .sv2-press { transition: transform 220ms cubic-bezier(0.22,0.61,0.36,1); }
      .sv2-press:active { transform: scale(0.985); }
      .sv2-tap { transition: opacity 160ms ease, transform 160ms ease; }
      .sv2-tap:active { opacity: 0.7; transform: translateY(1px); }
    `}</style>
  );
}

// ── Color tokens (Sereno definitivo) ──────────────────────────
const S2 = {
  bg: '#F4F1EB',
  surface: '#FFFFFF',
  surfaceMute: '#FAF7F0',
  stroke: 'rgba(20,30,28,0.07)',
  strokeStrong: 'rgba(20,30,28,0.14)',
  ink: '#0E1A18',
  muted: '#5B6A66',
  dim: '#8A968F',
  warm: '#D8CDB6',
  warmDeep: '#B8A988',
};

// ── Main shell: route slider ──────────────────────────────────
function TodaySerenoV2({ tweaks, primary, chartStyle, onNavigate, route='today', onThemeChange }) {
  const order = ['today', 'diary', 'history', 'igi', 'settings'];
  const activeIdx = Math.max(0, order.indexOf(route));

  const renderRoute = (r) => {
    if (r === 'diary')    return <SerenoV2Diary   onBack={()=>onNavigate('today')} primary={primary}/>;
    if (r === 'history')  return <SerenoV2History onBack={()=>onNavigate('today')} primary={primary} chartStyle={chartStyle}/>;
    if (r === 'igi')      return <SerenoV2IGI     onBack={()=>onNavigate('today')} primary={primary}/>;
    if (r === 'settings') return <AppearanceSettings themeId="sereno" primary={primary} onBack={()=>onNavigate('today')} onSelect={(id)=>{ onThemeChange && onThemeChange(id); }}/>;
    return <SerenoV2Today primary={primary} chartStyle={chartStyle} onNavigate={onNavigate}/>;
  };

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden', background: S2.bg }}>
      <SerenoV2Styles/>
      {order.map((r, i) => {
        const offset = i - activeIdx;
        const isActive = offset === 0;
        return (
          <div
            key={r}
            className="no-scrollbar"
            style={{
              position:'absolute', inset:0,
              overflow: isActive ? 'auto' : 'hidden',
              transform: `translateX(${offset * 100}%)`,
              transition: 'transform 460ms cubic-bezier(0.22,0.61,0.36,1), opacity 320ms ease',
              opacity: isActive ? 1 : 0,
              pointerEvents: isActive ? 'auto' : 'none',
              willChange:'transform, opacity',
              background: S2.bg,
            }}
          >
            {renderRoute(r)}
          </div>
        );
      })}
    </div>
  );
}

// ── Today screen ──────────────────────────────────────────────
function SerenoV2Today({ primary, chartStyle, onNavigate }) {
  const P = primary;
  const chartData = window.LAST7.map((d,i) => ({ label: window.weekdayLabels()[i], value: d.eff }));
  const ttsDelta = window.AVG7.tts - window.AVG_PREV7.tts;
  const effDelta = window.AVG7.eff - window.AVG_PREV7.eff;

  const [sheet, setSheet] = React.useState(null); // null | 'breakdown'
  // Re-mount key to retrigger stagger when route returns
  const enterKey = React.useRef(0);

  return (
    <div style={{
      width:'100%', minHeight:'100%', background: S2.bg, color: S2.ink,
      fontFamily:'Inter, sans-serif', paddingBottom: 96, position:'relative',
    }}>
      {/* HEADER */}
      <div className="sv2-block" style={{ animationDelay:'0ms', padding:'18px 24px 6px', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:11, letterSpacing:'0.16em', textTransform:'uppercase', color: S2.dim, fontWeight:500 }}>
            Quarta · 20 maio
          </div>
          <div style={{ fontSize:28, fontFamily:'"Instrument Serif", serif', marginTop:6, letterSpacing:'-0.01em', lineHeight:1.05 }}>
            Bom dia, Marina.
          </div>
          <div style={{ fontSize:14, fontFamily:'"Instrument Serif", serif', color: S2.muted, fontStyle:'italic', marginTop:2 }}>
            Boa noite de descanso.
          </div>
        </div>
        <button
          className="sv2-tap"
          onClick={()=>onNavigate('settings')}
          aria-label="Configurações"
          style={{
            width:34, height:34, borderRadius:11, border:`1px solid ${S2.stroke}`,
            background: S2.surface, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>
          <Icon.User width="16" height="16" color={S2.ink}/>
        </button>
      </div>

      {/* HERO CAROUSEL */}
      <div className="sv2-block" style={{ animationDelay:'60ms', padding:'18px 24px 0' }}>
        <HeroCarousel
          primary={P}
          onEffLongPress={()=>setSheet('breakdown')}
        />
      </div>

      {/* DAILY INSIGHT */}
      <div className="sv2-block" style={{ animationDelay:'140ms', padding:'18px 24px 0' }}>
        <DailyInsight primary={P}/>
      </div>

      {/* CTA — preencher diário */}
      <div className="sv2-block" style={{ animationDelay:'200ms', padding:'16px 24px 0' }}>
        <button
          onClick={()=>onNavigate('diary')}
          className="sv2-press"
          style={{
            width:'100%', padding:'18px 18px', borderRadius:16, border:`1px solid ${S2.stroke}`,
            background: S2.ink, color:'#fff', cursor:'pointer', textAlign:'left',
            display:'flex', alignItems:'center', gap:14,
          }}>
          <div style={{
            width:38, height:38, borderRadius:'50%', background: P,
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>
            <Icon.Plus width="20" height="20" color="#fff"/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:500, letterSpacing:'-0.005em' }}>Preencher diário de hoje</div>
            <div style={{ fontSize:11, opacity:0.55, marginTop:3, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.06em' }}>
              4 perguntas · cerca de 2 min
            </div>
          </div>
          <div style={{ opacity:0.6 }}><Icon.ArrowRight width="16" height="16" color="#fff"/></div>
        </button>
      </div>

      {/* WEEK TREND */}
      <div className="sv2-block" style={{ animationDelay:'260ms', padding:'22px 24px 0' }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:10 }}>
          <div>
            <div style={{ fontFamily:'"Instrument Serif", serif', fontSize:20, letterSpacing:'-0.01em' }}>Eficiência semanal</div>
            <div style={{ fontSize:11, color: S2.muted, marginTop:2 }}>
              Média 7 dias · <span style={{ color: P, fontWeight:600 }}>{window.AVG7.eff}%</span>
              <span style={{ color: effDelta>=0 ? P : '#C7654E', marginLeft:6 }}>{effDelta>=0?'+':''}{effDelta}%</span>
            </div>
          </div>
          <div style={{
            padding:'5px 10px', borderRadius:999, border:`1px solid ${S2.stroke}`,
            background: S2.surface, fontSize:11, color: S2.muted, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.06em',
          }}>7d</div>
        </div>
        <div style={{ padding:'14px 8px 6px', borderRadius:16, background: S2.surface, border:`1px solid ${S2.stroke}` }}>
          <TrendChart data={chartData} style={chartStyle} primary={P} track="rgba(20,30,28,0.06)" textColor={S2.muted} height={120}/>
        </div>
      </div>

      {/* IGI row */}
      <div className="sv2-block" style={{ animationDelay:'320ms', padding:'16px 24px 0' }}>
        <button
          onClick={()=>onNavigate('igi')}
          className="sv2-press"
          style={{
            width:'100%', padding:'14px 16px', borderRadius:16, border:`1px solid ${S2.stroke}`,
            background: S2.surface, color: S2.ink, textAlign:'left', cursor:'pointer',
            display:'flex', alignItems:'center', gap:14,
          }}>
          <div style={{ width:44, height:44, position:'relative', flexShrink:0 }}>
            <svg width="44" height="44" style={{ transform:'rotate(-90deg)' }}>
              <circle cx="22" cy="22" r="18" stroke="rgba(20,30,28,0.08)" strokeWidth="3" fill="none"/>
              <circle cx="22" cy="22" r="18" stroke={P} strokeWidth="3" fill="none"
                strokeDasharray={2*Math.PI*18}
                strokeDashoffset={(1-(window.ISI_SCORE/28))*2*Math.PI*18}
                strokeLinecap="round"/>
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600 }}>
              {window.ISI_SCORE}
            </div>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600 }}>IGI · {window.ISI_LABEL}</div>
            <div style={{ fontSize:11, color: S2.muted, marginTop:2 }}>
              Reavaliar em {window.NEXT_ISI_IN_DAYS} dias
            </div>
          </div>
          <Icon.ArrowRight width="16" height="16" color={S2.dim}/>
        </button>
      </div>

      {/* Quick actions */}
      <div className="sv2-block" style={{ animationDelay:'380ms', padding:'12px 24px 0', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <button onClick={()=>onNavigate('history')} className="sv2-press" style={tileBtnS2()}>
          <Icon.Chart width="18" height="18" color={P}/>
          <div>
            <div style={{ fontSize:12.5, fontWeight:600 }}>Histórico</div>
            <div style={{ fontSize:10.5, color: S2.dim, marginTop:1 }}>14 noites</div>
          </div>
        </button>
        <button className="sv2-press" style={tileBtnS2()}>
          <Icon.PDF width="18" height="18" color={P}/>
          <div>
            <div style={{ fontSize:12.5, fontWeight:600 }}>Enviar ao médico</div>
            <div style={{ fontSize:10.5, color: S2.dim, marginTop:1 }}>PDF · 2 cliques</div>
          </div>
        </button>
      </div>

      {/* Streak — moved into a subtle footer chip (sober) */}
      <div className="sv2-block" style={{ animationDelay:'440ms', padding:'18px 24px 0', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        <span style={{ width:5, height:5, borderRadius:3, background: P }}/>
        <span style={{ fontSize:11, color: S2.muted, letterSpacing:'0.04em' }}>
          {window.STREAK} noites consecutivas preenchidas
        </span>
      </div>

      <BottomTabsS2 primary={P}/>

      {/* Long-press sheet */}
      {sheet === 'breakdown' && (
        <BreakdownSheet primary={P} onClose={()=>setSheet(null)}/>
      )}
    </div>
  );
}

function tileBtnS2() {
  return {
    padding:'14px', borderRadius:14, border:`1px solid ${S2.stroke}`,
    background: S2.surface, color: S2.ink, textAlign:'left', cursor:'pointer',
    display:'flex', alignItems:'center', gap:10,
  };
}

// ── HeroCarousel: TTS / Eficiência / Latência ─────────────────
function HeroCarousel({ primary, onEffLongPress }) {
  const P = primary;
  const swipe = useSwipeIdx(3, { autoRotate: 0 }); // autoRotate disabled — sober
  const long = useLongPress(onEffLongPress, { delay: 480, threshold: 14 });

  const cardWrap = {
    flex:'0 0 100%', padding:'22px 22px 18px',
    background: S2.surface, borderRadius: 22, border:`1px solid ${S2.stroke}`,
    boxShadow:'0 1px 0 rgba(20,30,28,0.025), 0 12px 36px -28px rgba(15,40,35,0.2)',
    minHeight: 230,
  };

  return (
    <div>
      {/* Carousel viewport */}
      <div
        onPointerDown={swipe.onDown}
        onPointerMove={swipe.onMove}
        onPointerUp={swipe.onUp}
        onPointerLeave={swipe.onUp}
        style={{ overflow:'hidden', touchAction:'pan-y', userSelect:'none', cursor: swipe.drag.active?'grabbing':'grab', borderRadius: 22 }}
      >
        <div style={{
          display:'flex',
          transform: swipe.drag.active
            ? `translateX(calc(${-swipe.idx*100}% + ${swipe.drag.dx}px))`
            : `translateX(${-swipe.idx*100}%)`,
          transition: swipe.drag.active ? 'none' : 'transform 460ms cubic-bezier(0.22,0.61,0.36,1)',
          gap: 12,
        }}>

          {/* 1 — TTS */}
          <div style={cardWrap}>
            <KickerS2 num="01" label="Tempo de sono" delta={`+${window.AVG7.tts - window.AVG_PREV7.tts}m vs semana`}/>
            <BigNumberHM h={Math.floor(window.TODAY.tts/60)} m={window.TODAY.tts%60} primary={P}/>
            <NightBar primary={P}/>
          </div>

          {/* 2 — Eficiência (long-pressable) */}
          <div {...long.handlers} className="sv2-press" style={{ ...cardWrap, position:'relative' }}>
            <KickerS2 num="02" label="Eficiência" delta={`+${window.AVG7.eff - window.AVG_PREV7.eff}% vs semana`}/>
            <div style={{ display:'flex', alignItems:'center', gap:18, marginTop:6 }}>
              <BigPct value={window.TODAY.eff} primary={P}/>
              <div style={{ flex:1 }}>
                <RingMini value={window.TODAY.eff} primary={P}/>
                <div style={{ fontSize:11, color: S2.muted, marginTop:8, lineHeight:1.4 }}>
                  Sono útil vs tempo na cama. Acima de <b style={{ color: S2.ink }}>85%</b> é considerado bom.
                </div>
              </div>
            </div>
            <div style={{
              marginTop:14, paddingTop:12, borderTop:`1px solid ${S2.stroke}`,
              display:'flex', alignItems:'center', justifyContent:'space-between',
              fontSize:10.5, color: S2.dim, letterSpacing:'0.08em', textTransform:'uppercase',
            }}>
              <span>Segure para detalhes</span>
              <span style={{ display:'inline-block', width:6, height:6, borderRadius:3, background: P, opacity:0.6 }}/>
            </div>
          </div>

          {/* 3 — Latência */}
          <div style={cardWrap}>
            <KickerS2 num="03" label="Latência" delta="11 min · estável"/>
            <div style={{ display:'flex', alignItems:'baseline', gap:6, marginTop:6 }}>
              <div style={{
                fontFamily:'"Instrument Serif", serif', fontSize:96, lineHeight:0.82,
                letterSpacing:'-0.04em', fontWeight:400, color: S2.ink,
              }}>{window.TODAY.lis}</div>
              <div style={{
                fontFamily:'"Instrument Serif", serif', fontSize:32, color: P, letterSpacing:'-0.02em',
              }}>min</div>
            </div>
            <div style={{ fontSize:12, color: S2.muted, marginTop:12, lineHeight:1.5 }}>
              Tempo entre deitar e adormecer. Abaixo de 20 min é considerado saudável.
            </div>
            <div style={{ marginTop:14 }}>
              <LatencyTrack value={window.TODAY.lis} primary={P}/>
            </div>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:14 }}>
        {[0,1,2].map(i => (
          <button
            key={i}
            onClick={()=>swipe.setIdx(i)}
            aria-label={`Card ${i+1}`}
            style={{
              width: swipe.idx===i ? 18 : 6, height:6, borderRadius:3,
              background: swipe.idx===i ? S2.ink : S2.warm,
              border:0, padding:0, cursor:'pointer',
              transition:'width 280ms ease, background 280ms ease',
            }}/>
        ))}
      </div>
    </div>
  );
}

function KickerS2({ num, label, delta }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:4 }}>
      <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
        <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color: S2.dim, letterSpacing:'0.14em' }}>{num}</span>
        <span style={{ fontSize:11, color: S2.muted, letterSpacing:'0.16em', textTransform:'uppercase', fontWeight:500 }}>{label}</span>
      </div>
      {delta && <span style={{ fontSize:10.5, color: S2.dim, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.04em' }}>{delta}</span>}
    </div>
  );
}

function BigNumberHM({ h, m, primary }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline', gap:2, marginTop:6 }}>
      <div style={{ fontFamily:'"Instrument Serif", serif', fontSize:84, lineHeight:0.82, letterSpacing:'-0.05em', fontWeight:400 }}>{h}</div>
      <div style={{ fontFamily:'"Instrument Serif", serif', fontSize:46, color: primary, letterSpacing:'-0.03em', fontStyle:'italic' }}>h</div>
      <div style={{ fontFamily:'"Instrument Serif", serif', fontSize:84, lineHeight:0.82, letterSpacing:'-0.05em', fontWeight:400, marginLeft:2 }}>{String(m).padStart(2,'0')}</div>
    </div>
  );
}

function BigPct({ value, primary }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline' }}>
      <div style={{ fontFamily:'"Instrument Serif", serif', fontSize:92, lineHeight:0.82, letterSpacing:'-0.05em', fontWeight:400 }}>{value}</div>
      <div style={{ fontFamily:'"Instrument Serif", serif', fontSize:36, color: primary, letterSpacing:'-0.02em', marginLeft:2 }}>%</div>
    </div>
  );
}

function RingMini({ value, primary }) {
  const r = 22, c = 2*Math.PI*r;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" style={{ display:'block' }}>
      <circle cx="28" cy="28" r={r} stroke="rgba(20,30,28,0.07)" strokeWidth="4" fill="none"/>
      <circle cx="28" cy="28" r={r} stroke={primary} strokeWidth="4" fill="none"
        strokeDasharray={c} strokeDashoffset={c - (value/100)*c} strokeLinecap="round"
        transform="rotate(-90 28 28)"/>
    </svg>
  );
}

function NightBar({ primary }) {
  return (
    <div style={{ marginTop:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10.5, color: S2.dim, letterSpacing:'0.1em', marginBottom:6, fontFamily:'JetBrains Mono, monospace' }}>
        <span>23:14</span><span>07:08</span>
      </div>
      <div style={{ position:'relative', height: 22, borderRadius: 11, background:'#EFEAE0', overflow:'hidden' }}>
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'4%', background: S2.warm }}/>
        <div style={{ position:'absolute', left:'4%', top:0, bottom:0, width:'94%', background: primary }}/>
        <div style={{ position:'absolute', left:'42%', top:0, bottom:0, width:'2%', background: S2.warm }}/>
        <div style={{ position:'absolute', left:'68%', top:0, bottom:0, width:'1.5%', background: S2.warm }}/>
      </div>
      <div style={{ display:'flex', gap:14, marginTop:8, fontSize:10, color: S2.muted }}>
        <span style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:8, height:8, borderRadius:2, background: primary }}/> Sono útil
        </span>
        <span style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:8, height:8, borderRadius:2, background: S2.warm }}/> Acordada / latência
        </span>
      </div>
    </div>
  );
}

function LatencyTrack({ value, primary }) {
  // Scale 0–60 min. Mark zones: 0–20 good, 20–40 moderate, 40+ alert.
  const pct = Math.min(100, (value/60)*100);
  return (
    <div>
      <div style={{ position:'relative', height: 8, borderRadius:4, background:'#EFEAE0', overflow:'hidden' }}>
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${(20/60)*100}%`, background:`${primary}33` }}/>
        <div style={{ position:'absolute', left:`${pct}%`, top:-3, width:2, height:14, background: S2.ink, borderRadius:1 }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:10, color: S2.dim, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.08em' }}>
        <span>0</span><span>20 min · ideal</span><span>60</span>
      </div>
    </div>
  );
}

// ── Daily insight ─────────────────────────────────────────────
function DailyInsight({ primary }) {
  return (
    <div style={{ display:'flex', gap:12, padding:'12px 0' }}>
      <div style={{ width:2, borderRadius:1, background: primary, flexShrink:0, alignSelf:'stretch', opacity:0.7 }}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:11, color: S2.muted, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:500 }}>
          Padrão da semana
        </div>
        <div style={{ fontSize:15, color: S2.ink, marginTop:4, lineHeight:1.45, fontFamily:'"Instrument Serif", serif' }}>
          Você dormiu antes das 23:30 em <span style={{ fontStyle:'italic', color: primary }}>6 das últimas 7 noites</span>. Boa consistência de horário — siga assim para reforçar o ritmo circadiano.
        </div>
      </div>
    </div>
  );
}

// ── Long-press breakdown sheet ────────────────────────────────
function BreakdownSheet({ primary, onClose }) {
  // Lock background scroll while open
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const rows = [
    { label:'Tempo total na cama (TTC)', value:`${Math.floor(window.TODAY.ttc/60)}h ${String(window.TODAY.ttc%60).padStart(2,'0')}`, hint:'Da hora de deitar até levantar' },
    { label:'Tempo total de sono (TTS)', value:`${Math.floor(window.TODAY.tts/60)}h ${String(window.TODAY.tts%60).padStart(2,'0')}`, hint:'Sono útil, descontando despertares' },
    { label:'Latência inicial (LIS)',    value:`${window.TODAY.lis} min`, hint:'Tempo até adormecer' },
    { label:'Despertares (WASO)',         value:`${window.TODAY.waso} min`, hint:'Tempo acordada após adormecer' },
    { label:'Nº de despertares',          value:'2', hint:'Episódios de mais de 1 min' },
    { label:'Qualidade percebida',        value:'5 / 5', hint:'Como você se sentiu ao acordar' },
  ];

  return (
    <div className="sv2-fade" style={{
      position:'absolute', inset:0, zIndex:50,
      display:'flex', alignItems:'flex-end', justifyContent:'stretch',
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position:'absolute', inset:0, background:'rgba(14,26,24,0.32)', backdropFilter:'blur(2px)',
      }}/>
      {/* Sheet */}
      <div className="sv2-sheet" style={{
        position:'relative', width:'100%', background: S2.bg,
        borderTopLeftRadius:24, borderTopRightRadius:24,
        boxShadow:'0 -8px 32px -8px rgba(14,26,24,0.18)',
        padding:'14px 22px 26px', maxHeight:'78%', overflow:'auto',
      }}>
        {/* Grabber */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:10 }}>
          <div style={{ width:38, height:4, borderRadius:2, background: S2.strokeStrong }}/>
        </div>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:11, color: S2.muted, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:500 }}>Detalhes da noite</div>
            <div style={{ fontFamily:'"Instrument Serif", serif', fontSize:26, marginTop:4, letterSpacing:'-0.01em' }}>
              Eficiência <span style={{ fontStyle:'italic', color: primary }}>{window.TODAY.eff}%</span>
            </div>
          </div>
          <button onClick={onClose} className="sv2-tap" style={{
            background: S2.surface, border:`1px solid ${S2.stroke}`, color: S2.ink,
            padding:'6px 10px', borderRadius:10, cursor:'pointer', fontSize:12,
          }}>Fechar</button>
        </div>

        <div style={{
          marginTop:18, padding:'4px 0', borderRadius:16,
          background: S2.surface, border:`1px solid ${S2.stroke}`,
        }}>
          {rows.map((r, i) => (
            <div key={r.label} style={{
              display:'grid', gridTemplateColumns:'1fr auto', gap:12,
              padding:'12px 16px',
              borderBottom: i < rows.length-1 ? `1px solid ${S2.stroke}` : 'none',
              alignItems:'baseline',
            }}>
              <div>
                <div style={{ fontSize:13, color: S2.ink, fontWeight:500 }}>{r.label}</div>
                <div style={{ fontSize:11, color: S2.muted, marginTop:2 }}>{r.hint}</div>
              </div>
              <div style={{ fontFamily:'"Instrument Serif", serif', fontSize:20, color: S2.ink, letterSpacing:'-0.01em' }}>
                {r.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop:14, padding:'12px 14px', borderRadius:14,
          background: `${primary}12`, border:`1px solid ${primary}33`,
          fontSize:12, color: S2.ink, lineHeight:1.5,
        }}>
          <b>Como interpretar:</b> a eficiência de 94% é considerada <span style={{ fontStyle:'italic' }}>excelente</span>. Continue priorizando rotina e ambiente escuro.
        </div>
      </div>
    </div>
  );
}

// ── Bottom tabs ───────────────────────────────────────────────
function BottomTabsS2({ primary }) {
  return (
    <div style={{
      position:'absolute', bottom:0, left:0, right:0, padding:'10px 18px 18px',
      background:'rgba(244,241,235,0.93)', borderTop:`1px solid ${S2.stroke}`,
      display:'flex', alignItems:'center', justifyContent:'space-around', backdropFilter:'blur(20px)',
    }}>
      {[
        { id:'home', icon: <Icon.Home width="20" height="20" color={S2.ink}/>, label:'Hoje', active:true },
        { id:'chart', icon: <Icon.Chart width="20" height="20" color={S2.muted}/>, label:'Tendência' },
        { id:'add', primary:true },
        { id:'bell', icon: <Icon.Bell width="20" height="20" color={S2.muted}/>, label:'Hábitos' },
        { id:'user', icon: <Icon.User width="20" height="20" color={S2.muted}/>, label:'Perfil' },
      ].map(t => t.primary ? (
        <button key={t.id} className="sv2-press" style={{
          width:50, height:50, borderRadius:16, border:0, cursor:'pointer',
          background: primary, color:'#fff', marginTop:-18,
          boxShadow:`0 8px 18px ${primary}55`,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}><Icon.Plus width="20" height="20"/></button>
      ) : (
        <button key={t.id} className="sv2-tap" style={{
          background:'transparent', border:0, cursor:'pointer', color: t.active?S2.ink:S2.muted,
          display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'4px 6px',
        }}>
          {t.icon}
          <span style={{ fontSize:9, fontWeight: t.active?600:500, letterSpacing:'0.02em' }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Subroute: Diary (sober, no emojis) ────────────────────────
function SerenoV2Diary({ onBack, primary }) {
  const [step, setStep] = React.useState(0);
  const [vals, setVals] = React.useState({ bedtime:'23:14', latency:11, waso:6, mood:4 });
  const steps = [
    { key:'bedtime', q:'Que horas você deitou?',         kind:'time' },
    { key:'latency', q:'Quanto tempo levou para dormir?', kind:'num', unit:'min', range:[0, 90] },
    { key:'waso',    q:'Acordou durante a noite?',        kind:'num', unit:'min', range:[0, 60] },
    { key:'mood',    q:'Como se sente ao acordar?',       kind:'scale' },
  ];
  const s = steps[step];

  return (
    <div style={{ background: S2.bg, minHeight:'100%', padding:'20px 24px 28px', color: S2.ink, fontFamily:'Inter' }}>
      <SerenoV2Styles/>
      <div className="sv2-block" style={{ animationDelay:'0ms', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={onBack} className="sv2-tap" style={{ background:'transparent', border:0, cursor:'pointer', fontSize:13, color: S2.ink, padding:0 }}>← Voltar</button>
        <div style={{ fontSize:11, color: S2.muted, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.08em' }}>
          {String(step+1).padStart(2,'0')} / {String(steps.length).padStart(2,'0')}
        </div>
      </div>
      <div className="sv2-block" style={{ animationDelay:'60ms', marginTop:18, height:3, background:'rgba(20,30,28,0.08)', borderRadius:2 }}>
        <div style={{ width:`${(step+1)/steps.length*100}%`, height:'100%', background: primary, borderRadius:2, transition:'width 420ms cubic-bezier(0.22,0.61,0.36,1)' }}/>
      </div>
      <div className="sv2-block" style={{ animationDelay:'120ms', fontFamily:'"Instrument Serif", serif', fontSize:32, marginTop:40, letterSpacing:'-0.015em', lineHeight:1.1 }}>{s.q}</div>

      <div className="sv2-block" style={{ animationDelay:'200ms', marginTop:32, padding:'28px 20px', borderRadius:18, background: S2.surface, border:`1px solid ${S2.stroke}`, display:'flex', alignItems:'center', justifyContent:'center', minHeight: 180 }}>
        {s.kind === 'time' && (
          <div style={{ fontFamily:'"Instrument Serif", serif', fontSize:64, letterSpacing:'-0.03em', color: S2.ink }}>
            {vals.bedtime.split(':')[0]}<span style={{ color: primary }}>:</span>{vals.bedtime.split(':')[1]}
          </div>
        )}
        {s.kind === 'num' && (
          <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
            <div style={{ fontFamily:'"Instrument Serif", serif', fontSize:72, color: primary, letterSpacing:'-0.04em' }}>
              {vals[s.key]}
            </div>
            <div style={{ fontFamily:'"Instrument Serif", serif', fontSize:26, color: S2.muted, fontStyle:'italic' }}>{s.unit}</div>
          </div>
        )}
        {s.kind === 'scale' && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
            <div style={{ display:'flex', gap:10 }}>
              {[1,2,3,4,5].map(n => {
                const active = n === vals.mood;
                return (
                  <button key={n} onClick={()=>setVals(v=>({ ...v, mood:n }))} className="sv2-tap" style={{
                    width:46, height:46, borderRadius:'50%', cursor:'pointer',
                    background: active ? primary : S2.bg,
                    border:`1px solid ${active ? primary : S2.strokeStrong}`,
                    color: active ? '#fff' : S2.ink,
                    fontFamily:'"Instrument Serif", serif', fontSize:20, letterSpacing:'-0.01em',
                  }}>{n}</button>
                );
              })}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', width:'100%', maxWidth:260, fontSize:11, color: S2.muted }}>
              <span>Exausta</span><span>Descansada</span>
            </div>
          </div>
        )}
      </div>

      <div className="sv2-block" style={{ animationDelay:'260ms', display:'flex', gap:10, marginTop:20 }}>
        {step > 0 && (
          <button onClick={()=>setStep(step-1)} className="sv2-press" style={{ flex:1, padding:'14px 0', borderRadius:14, background: S2.surface, border:`1px solid ${S2.stroke}`, cursor:'pointer', fontSize:13, color: S2.ink }}>
            Anterior
          </button>
        )}
        <button onClick={()=> step<steps.length-1 ? setStep(step+1) : onBack()} className="sv2-press" style={{
          flex:2, padding:'14px 0', borderRadius:14, background: S2.ink, color:'#fff',
          border:0, cursor:'pointer', fontSize:14, fontWeight:500, letterSpacing:'-0.005em',
        }}>{step < steps.length-1 ? 'Próximo' : 'Concluir'}</button>
      </div>
    </div>
  );
}

// ── Subroute: History ─────────────────────────────────────────
function SerenoV2History({ onBack, primary, chartStyle }) {
  return (
    <div style={{ background: S2.bg, minHeight:'100%', padding:'20px 24px 28px', color: S2.ink }}>
      <SerenoV2Styles/>
      <div className="sv2-block" style={{ animationDelay:'0ms' }}>
        <button onClick={onBack} className="sv2-tap" style={{ background:'transparent', border:0, cursor:'pointer', fontSize:13, padding:0, color: S2.ink }}>← Voltar</button>
      </div>
      <div className="sv2-block" style={{ animationDelay:'60ms', fontFamily:'"Instrument Serif", serif', fontSize:32, marginTop:10, letterSpacing:'-0.015em' }}>
        Histórico
      </div>
      <div className="sv2-block" style={{ animationDelay:'100ms', fontSize:11, color: S2.dim, letterSpacing:'0.14em', textTransform:'uppercase', marginTop:4, fontFamily:'JetBrains Mono, monospace' }}>
        Últimas 14 noites
      </div>
      <div className="sv2-block" style={{ animationDelay:'160ms', marginTop:22, padding:'14px 10px', borderRadius:18, background: S2.surface, border:`1px solid ${S2.stroke}` }}>
        <TrendChart data={window.SLEEP_DATA.map((d,i)=>({ label: (i%2?'':String(14-i)), value:d.eff }))} style={chartStyle} primary={primary} track="rgba(20,30,28,0.06)" textColor={S2.muted} height={140}/>
      </div>
      <div style={{ marginTop:18 }}>
        {window.SLEEP_DATA.slice().reverse().slice(0,8).map((d,i) => (
          <div key={i} className="sv2-block" style={{
            animationDelay: `${200 + i*40}ms`,
            display:'grid', gridTemplateColumns:'40px 1fr auto', gap:12, alignItems:'center',
            padding:'14px 16px', borderRadius:14, background: S2.surface, border:`1px solid ${S2.stroke}`, marginBottom:8,
          }}>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color: S2.dim, letterSpacing:'0.06em' }}>D{Math.abs(d.d)}</div>
            <div>
              <div style={{ fontFamily:'"Instrument Serif", serif', fontSize:22, letterSpacing:'-0.01em' }}>{window.fmtH(d.tts)}</div>
              <div style={{ height:3, marginTop:6, borderRadius:2, background:'rgba(20,30,28,0.06)', overflow:'hidden' }}>
                <div style={{ width: d.eff+'%', height:'100%', background: primary }}/>
              </div>
            </div>
            <div style={{ fontSize:13, fontWeight:600, color: primary, fontFamily:'JetBrains Mono, monospace' }}>{d.eff}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Subroute: IGI ─────────────────────────────────────────────
function SerenoV2IGI({ onBack, primary }) {
  const segments = [
    { from:0, to:7, label:'Ausência',     color: S2.warm },
    { from:8, to:14, label:'Subclínica',  color: primary },
    { from:15, to:21, label:'Moderada',   color:'#E89A66' },
    { from:22, to:28, label:'Grave',      color:'#C7654E' },
  ];

  return (
    <div style={{ background: S2.bg, minHeight:'100%', padding:'20px 24px 28px', color: S2.ink }}>
      <SerenoV2Styles/>
      <div className="sv2-block" style={{ animationDelay:'0ms' }}>
        <button onClick={onBack} className="sv2-tap" style={{ background:'transparent', border:0, cursor:'pointer', fontSize:13, padding:0, color: S2.ink }}>← Voltar</button>
      </div>
      <div className="sv2-block" style={{ animationDelay:'60ms', fontFamily:'"Instrument Serif", serif', fontSize:30, marginTop:10, letterSpacing:'-0.015em', lineHeight:1.1 }}>
        Índice de Gravidade da Insônia
      </div>
      <div className="sv2-block" style={{ animationDelay:'100ms', fontSize:11, color: S2.dim, marginTop:4, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.08em' }}>
        Último resultado · há {window.ISI_LAST_DAYS} dias
      </div>

      <div className="sv2-block" style={{ animationDelay:'160ms', marginTop:24, padding:'28px 20px', borderRadius:20, background: S2.surface, border:`1px solid ${S2.stroke}`, display:'flex', flexDirection:'column', alignItems:'center' }}>
        <Ring value={(window.ISI_SCORE/28)*100} size={140} primary={primary} track="rgba(20,30,28,0.06)" label="de 28" sublabel={window.ISI_LABEL}/>
        <div style={{ fontFamily:'"Instrument Serif", serif', fontSize:24, marginTop:12, letterSpacing:'-0.01em' }}>{window.ISI_SCORE} pontos</div>
        <div style={{ fontSize:12, color: S2.muted, marginTop:2 }}>Insônia {window.ISI_LABEL.toLowerCase()}</div>
      </div>

      <div className="sv2-block" style={{ animationDelay:'220ms', marginTop:20, padding:'4px 16px', borderRadius:18, background: S2.surface, border:`1px solid ${S2.stroke}` }}>
        {segments.map((s,i) => {
          const here = window.ISI_SCORE>=s.from && window.ISI_SCORE<=s.to;
          return (
            <div key={s.label} style={{ display:'grid', gridTemplateColumns:'10px 1fr auto', gap:12, alignItems:'center', padding:'14px 0', borderBottom: i<segments.length-1?`1px solid ${S2.stroke}`:'none' }}>
              <div style={{ width:6, height:32, borderRadius:3, background: s.color }}/>
              <div>
                <div style={{ fontSize:13.5, fontWeight: here ? 600 : 500, color: here ? S2.ink : S2.muted }}>{s.label}</div>
                <div style={{ fontSize:11, color: S2.dim, marginTop:2, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.06em' }}>{s.from}–{s.to} pts</div>
              </div>
              {here && (
                <div style={{ padding:'4px 9px', borderRadius:8, background:`${primary}22`, color: primary, fontSize:10, fontWeight:700, letterSpacing:'0.08em' }}>VOCÊ</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="sv2-block" style={{ animationDelay:'300ms', marginTop:18, padding:'14px 16px', borderRadius:14, background: `${primary}10`, border:`1px solid ${primary}26`, fontSize:12, color: S2.ink, lineHeight:1.55 }}>
        Sua pontuação está na faixa <b>subclínica</b>. Vamos reavaliar em <b>{window.NEXT_ISI_IN_DAYS} dias</b> para acompanhar a evolução.
      </div>
    </div>
  );
}

Object.assign(window, { TodaySerenoV2 });
