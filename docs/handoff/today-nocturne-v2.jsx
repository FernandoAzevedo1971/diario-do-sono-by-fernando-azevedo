// ─────────────────────────────────────────────────────────────
// V2 — NOCTURNE REFINADO (definitivo)
// Wellness escuro premium. Navy profundo, lavanda, lua, estrelas, glow suave.
// Mesma estrutura de refinos do Sereno V2, portada para a paleta dark:
//  • Hero virou carrossel (TTS / Eficiência / Latência) — dots + swipe
//  • Long-press na Eficiência → bottom-sheet com breakdown completo
//  • Page transitions slide+fade entre Today/Diário/Histórico/IGI/Aparência
//  • Stagger sutil dos blocos (40-60ms cada) na entrada
//  • Daily insight refinado: barra vertical fina com glow, sem ícone gritante
//  • Diário: escala numérica clínica em vez de emoji
//  • Sobriedade: menos sombra, mais respiro, decoração sideral mais contida
// Reaproveita hooks globais definidos em today-sereno-v2.jsx:
//  useLongPress, useSwipeIdx
// ─────────────────────────────────────────────────────────────

// ── Color tokens (Nocturne definitivo) ────────────────────────
const N2 = {
  bg: '#070914',
  bgDeep: '#050715',
  surface: 'rgba(255,255,255,0.04)',
  surfaceStrong: 'rgba(255,255,255,0.06)',
  stroke: 'rgba(255,255,255,0.08)',
  strokeStrong: 'rgba(255,255,255,0.16)',
  ink: '#FAFAF7',
  inkSoft: '#F0E9FF',
  muted: 'rgba(255,255,255,0.58)',
  dim: 'rgba(255,255,255,0.38)',
  ghost: 'rgba(255,255,255,0.16)',
};

function NocturneV2Styles() {
  return (
    <style>{`
      @keyframes nv2In { 0% { opacity:0; transform: translateY(10px); } 100% { opacity:1; transform: none; } }
      .nv2-block { animation: nv2In 480ms cubic-bezier(0.22,0.61,0.36,1) both; }
      @keyframes nv2Sheet { 0% { transform: translateY(100%); } 100% { transform: none; } }
      .nv2-sheet { animation: nv2Sheet 380ms cubic-bezier(0.22,0.61,0.36,1) both; }
      @keyframes nv2Fade { 0% { opacity:0; } 100% { opacity:1; } }
      .nv2-fade { animation: nv2Fade 280ms ease both; }
      @keyframes nv2Twinkle { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.9; } }
      .nv2-press { transition: transform 220ms cubic-bezier(0.22,0.61,0.36,1); }
      .nv2-press:active { transform: scale(0.985); }
      .nv2-tap { transition: opacity 160ms ease, transform 160ms ease; }
      .nv2-tap:active { opacity: 0.7; transform: translateY(1px); }
    `}</style>
  );
}

// ── Atmospheric backdrop (aurora + stars + moon) ──────────────
function NocturneBackdrop({ primary, withMoon = true }) {
  // Stars are stable across renders
  const stars = React.useMemo(() => Array.from({ length: 32 }, () => ({
    x: Math.random()*100,
    y: Math.random()*55,
    r: Math.random()*1.0 + 0.35,
    delay: Math.random()*4,
    dur: 2.4 + Math.random()*3,
  })), []);

  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
      {/* Aurora */}
      <div style={{
        position:'absolute', top:-180, left:-100, right:-100, height:560,
        background: `radial-gradient(ellipse at 30% 40%, ${primary}44, transparent 62%), radial-gradient(ellipse at 78% 58%, #4339A444, transparent 58%)`,
        filter: 'blur(46px)',
      }}/>
      {/* Grain */}
      <div style={{
        position:'absolute', inset:0, opacity:0.05,
        backgroundImage:'radial-gradient(circle at 1px 1px, #fff 0.6px, transparent 0)',
        backgroundSize:'3px 3px',
      }}/>
      {/* Stars */}
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" style={{ position:'absolute', top:0, left:0, width:'100%', height:'40%' }}>
        {stars.map((s,i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={0.7}>
            <animate attributeName="opacity" values="0.15;0.85;0.15" dur={`${s.dur}s`} begin={`${s.delay}s`} repeatCount="indefinite"/>
          </circle>
        ))}
      </svg>
      {/* Crescent moon */}
      {withMoon && (
        <div style={{
          position:'absolute', top: 84, right: 28, width: 64, height: 64, borderRadius:'50%',
          background: 'radial-gradient(circle at 30% 32%, #F0E9FF, #C8B9F0 55%, #6C5BBA)',
          boxShadow: `0 0 40px ${primary}66, inset -14px -8px 0 0 ${N2.bg}`,
          opacity: 0.88,
        }}/>
      )}
    </div>
  );
}

// ── Main shell: route slider ──────────────────────────────────
function TodayNocturneV2({ tweaks, primary, chartStyle, heroFont='instrument', onNavigate, route='today', onThemeChange }) {
  const order = ['today', 'diary', 'history', 'igi', 'settings'];
  const activeIdx = Math.max(0, order.indexOf(route));

  const renderRoute = (r) => {
    if (r === 'diary')    return <NocturneV2Diary   onBack={()=>onNavigate('today')} primary={primary}/>;
    if (r === 'history')  return <NocturneV2History onBack={()=>onNavigate('today')} primary={primary} chartStyle={chartStyle}/>;
    if (r === 'igi')      return <NocturneV2IGI     onBack={()=>onNavigate('today')} primary={primary}/>;
    if (r === 'settings') return <AppearanceSettings themeId="nocturne" primary={primary} onBack={()=>onNavigate('today')} onSelect={(id)=>{ onThemeChange && onThemeChange(id); }}/>;
    return <NocturneV2Today primary={primary} chartStyle={chartStyle} heroFont={heroFont} onNavigate={onNavigate}/>;
  };

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden', background: N2.bg }}>
      <NocturneV2Styles/>
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
              transition: 'transform 480ms cubic-bezier(0.22,0.61,0.36,1), opacity 320ms ease',
              opacity: isActive ? 1 : 0,
              pointerEvents: isActive ? 'auto' : 'none',
              willChange:'transform, opacity',
              background: N2.bg,
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
function NocturneV2Today({ primary, chartStyle, heroFont='instrument', onNavigate }) {
  const P = primary;
  const chartData = window.LAST7.map((d,i) => ({ label: window.weekdayLabels()[i], value: d.eff }));
  const ttsDelta = window.AVG7.tts - window.AVG_PREV7.tts;
  const effDelta = window.AVG7.eff - window.AVG_PREV7.eff;

  const [sheet, setSheet] = React.useState(null);

  // Slow ambient breathing for the hero halo
  const [breath, setBreath] = React.useState(0);
  React.useEffect(() => {
    let raf, t0;
    const tick = (t) => { if (!t0) t0 = t; setBreath((Math.sin((t-t0)/2400)+1)/2); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{
      width:'100%', minHeight:'100%', background: N2.bg, color: N2.ink,
      fontFamily:'Inter, sans-serif', paddingBottom: 96, position:'relative', overflow:'hidden',
    }}>
      <NocturneBackdrop primary={P}/>

      {/* HEADER */}
      <div className="nv2-block" style={{ animationDelay:'0ms', position:'relative', padding:'20px 24px 6px', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:11, letterSpacing:'0.16em', textTransform:'uppercase', color: N2.dim, fontWeight:500 }}>
            Quarta · 20 maio
          </div>
          <div style={{ fontFamily:'Fraunces, serif', fontSize:28, fontWeight:400, letterSpacing:'-0.01em', marginTop:6, lineHeight:1.05 }}>
            Bom dia, <span style={{ color: N2.inkSoft, fontStyle:'italic' }}>Marina</span>.
          </div>
          <div style={{ fontFamily:'Fraunces, serif', fontSize:14, color: N2.muted, fontStyle:'italic', marginTop:3 }}>
            Boa noite de descanso.
          </div>
        </div>
        <button
          className="nv2-tap"
          onClick={()=>onNavigate('settings')}
          aria-label="Configurações"
          style={{
            width:36, height:36, borderRadius:12, border:`1px solid ${N2.stroke}`,
            background:'rgba(255,255,255,0.04)', color: N2.ink, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            backdropFilter:'blur(8px)',
          }}>
          <Icon.User width="16" height="16"/>
        </button>
      </div>

      {/* HERO CAROUSEL */}
      <div className="nv2-block" style={{ animationDelay:'60ms', padding:'18px 24px 0', position:'relative' }}>
        {/* breathing halo behind */}
        <div style={{
          position:'absolute', top:-30, left:-10, width:240, height:240, borderRadius:'50%',
          background:`radial-gradient(circle, ${P}28, transparent 65%)`,
          transform: `scale(${0.85 + breath*0.18})`,
          transition:'transform 1.6s ease-in-out', pointerEvents:'none',
        }}/>
        <HeroCarouselN
          primary={P}
          heroFont={heroFont}
          onEffLongPress={()=>setSheet('breakdown')}
        />
      </div>

      {/* DAILY INSIGHT */}
      <div className="nv2-block" style={{ animationDelay:'140ms', position:'relative', padding:'18px 24px 0' }}>
        <DailyInsightN primary={P}/>
      </div>

      {/* CTA — preencher diário */}
      <div className="nv2-block" style={{ animationDelay:'200ms', position:'relative', padding:'16px 24px 0' }}>
        <button
          onClick={()=>onNavigate('diary')}
          className="nv2-press"
          style={{
            width:'100%', padding:'18px 18px', borderRadius:18, border:0, cursor:'pointer',
            background:`linear-gradient(135deg, ${P}, #5B47BF)`, color:'#fff', textAlign:'left',
            display:'flex', alignItems:'center', gap:14,
            boxShadow:`0 12px 32px ${P}55`,
          }}>
          <div style={{
            width:38, height:38, borderRadius:'50%', background:'rgba(255,255,255,0.18)',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>
            <Icon.Plus width="20" height="20"/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:'Fraunces, serif', fontSize:18, fontWeight:500, letterSpacing:'-0.01em' }}>Preencher diário de hoje</div>
            <div style={{ fontSize:11, opacity:0.78, marginTop:3, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.06em' }}>
              4 perguntas · cerca de 2 min
            </div>
          </div>
          <div style={{ opacity:0.8 }}><Icon.ArrowRight width="16" height="16"/></div>
        </button>
      </div>

      {/* WEEK TREND */}
      <div className="nv2-block" style={{ animationDelay:'260ms', position:'relative', padding:'22px 24px 0' }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:10 }}>
          <div>
            <div style={{ fontFamily:'Fraunces, serif', fontSize:20, letterSpacing:'-0.01em' }}>Sua semana</div>
            <div style={{ fontSize:11, color: N2.muted, marginTop:2 }}>
              Eficiência · <span style={{ color: P, fontWeight:600 }}>{window.AVG7.eff}%</span>
              <span style={{ color: effDelta>=0 ? P : '#FF8A8A', marginLeft:6 }}>{effDelta>=0?'+':''}{effDelta}%</span>
            </div>
          </div>
          <div style={{
            padding:'5px 10px', borderRadius:999, border:`1px solid ${N2.stroke}`,
            background:'rgba(255,255,255,0.04)', fontSize:11, color: N2.muted, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.06em',
          }}>7d</div>
        </div>
        <div style={{ padding:'14px 8px 6px', borderRadius:18, background: N2.surface, border:`1px solid ${N2.stroke}`, backdropFilter:'blur(8px)' }}>
          <TrendChart data={chartData} style={chartStyle} primary={P} track="rgba(255,255,255,0.08)" textColor={N2.muted} glow height={120}/>
        </div>
      </div>

      {/* IGI row */}
      <div className="nv2-block" style={{ animationDelay:'320ms', position:'relative', padding:'16px 24px 0' }}>
        <button
          onClick={()=>onNavigate('igi')}
          className="nv2-press"
          style={{
            width:'100%', padding:'14px 16px', borderRadius:16, border:`1px solid ${N2.stroke}`,
            background: N2.surfaceStrong, color: N2.ink, textAlign:'left', cursor:'pointer',
            display:'flex', alignItems:'center', gap:14, backdropFilter:'blur(8px)',
          }}>
          <div style={{ width:44, height:44, position:'relative', flexShrink:0 }}>
            <svg width="44" height="44" style={{ transform:'rotate(-90deg)' }}>
              <circle cx="22" cy="22" r="18" stroke="rgba(255,255,255,0.10)" strokeWidth="3" fill="none"/>
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
            <div style={{ fontSize:13, fontWeight:500 }}>IGI · {window.ISI_LABEL}</div>
            <div style={{ fontSize:11, color: N2.muted, marginTop:2 }}>
              Reavaliar em {window.NEXT_ISI_IN_DAYS} dias
            </div>
          </div>
          <Icon.ArrowRight width="16" height="16" color={N2.dim}/>
        </button>
      </div>

      {/* Quick actions */}
      <div className="nv2-block" style={{ animationDelay:'380ms', position:'relative', padding:'12px 24px 0', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <button onClick={()=>onNavigate('history')} className="nv2-press" style={tileBtnN2()}>
          <Icon.Chart width="18" height="18" color={P}/>
          <div>
            <div style={{ fontSize:12.5, fontWeight:500 }}>Histórico</div>
            <div style={{ fontSize:10.5, color: N2.dim, marginTop:1 }}>14 noites</div>
          </div>
        </button>
        <button className="nv2-press" style={tileBtnN2()}>
          <Icon.PDF width="18" height="18" color={P}/>
          <div>
            <div style={{ fontSize:12.5, fontWeight:500 }}>Enviar ao médico</div>
            <div style={{ fontSize:10.5, color: N2.dim, marginTop:1 }}>PDF · 2 cliques</div>
          </div>
        </button>
      </div>

      {/* Streak — discreet footer */}
      <div className="nv2-block" style={{ animationDelay:'440ms', position:'relative', padding:'18px 24px 0', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        <span style={{ width:5, height:5, borderRadius:3, background: P, boxShadow:`0 0 6px ${P}` }}/>
        <span style={{ fontSize:11, color: N2.muted, letterSpacing:'0.04em' }}>
          {window.STREAK} noites consecutivas preenchidas
        </span>
      </div>

      <BottomTabsN2 primary={P}/>

      {/* Long-press sheet */}
      {sheet === 'breakdown' && (
        <BreakdownSheetN primary={P} onClose={()=>setSheet(null)}/>
      )}
    </div>
  );
}

function tileBtnN2() {
  return {
    padding:'14px', borderRadius:14, border:`1px solid ${N2.stroke}`,
    background: N2.surface, color: N2.ink, textAlign:'left', cursor:'pointer',
    display:'flex', alignItems:'center', gap:10, backdropFilter:'blur(8px)',
  };
}

// ── HeroCarouselN: TTS / Eficiência / Latência (dark) ─────────
function HeroCarouselN({ primary, heroFont='instrument', onEffLongPress }) {
  const P = primary;
  const swipe = useSwipeIdx(3, { autoRotate: 0 });
  const heroFam = window.heroFontStack(heroFont);
  const heroItalic = heroFont !== 'mono'; // italic looks odd in mono
  // Mono needs slightly tighter letter-spacing for visual parity
  const heroLs = heroFont === 'mono' ? '-0.02em' : '-0.05em';
  const heroWeight = (heroFont === 'bricolage') ? 500 : (heroFont === 'mono' ? 500 : 300);
  const long = useLongPress(onEffLongPress, { delay: 480, threshold: 14 });

  const cardWrap = {
    flex:'0 0 100%', padding:'22px 22px 18px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))',
    borderRadius: 22, border:`1px solid ${N2.stroke}`,
    minHeight: 240, backdropFilter:'blur(12px)',
    position:'relative', overflow:'hidden',
  };

  return (
    <div style={{ position:'relative' }}>
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
          transition: swipe.drag.active ? 'none' : 'transform 480ms cubic-bezier(0.22,0.61,0.36,1)',
          gap: 12,
        }}>

          {/* 1 — TTS */}
          <div style={cardWrap}>
            <KickerN num="01" label="Tempo de sono" delta={`+${window.AVG7.tts - window.AVG_PREV7.tts}m vs semana`}/>
            <BigNumberHMN h={Math.floor(window.TODAY.tts/60)} m={window.TODAY.tts%60} primary={P} fam={heroFam} italic={heroItalic} ls={heroLs} weight={heroWeight}/>
            <NightBarN primary={P}/>
          </div>

          {/* 2 — Eficiência (long-press) */}
          <div {...long.handlers} className="nv2-press" style={cardWrap}>
            <KickerN num="02" label="Eficiência" delta={`+${window.AVG7.eff - window.AVG_PREV7.eff}% vs semana`}/>
            <div style={{ display:'flex', alignItems:'center', gap:18, marginTop:6 }}>
              <BigPctN value={window.TODAY.eff} primary={P} fam={heroFam} italic={heroItalic} ls={heroLs} weight={heroWeight}/>
              <div style={{ flex:1, minWidth:0 }}>
                <RingMiniN value={window.TODAY.eff} primary={P}/>
                <div style={{ fontSize:11, color: N2.muted, marginTop:8, lineHeight:1.45 }}>
                  Sono útil vs tempo na cama. Acima de <b style={{ color: N2.ink }}>85%</b> é considerado bom.
                </div>
              </div>
            </div>
            <div style={{
              marginTop:14, paddingTop:12, borderTop:`1px solid ${N2.stroke}`,
              display:'flex', alignItems:'center', justifyContent:'space-between',
              fontSize:10.5, color: N2.dim, letterSpacing:'0.08em', textTransform:'uppercase',
            }}>
              <span>Segure para detalhes</span>
              <span style={{ display:'inline-block', width:6, height:6, borderRadius:3, background: P, boxShadow:`0 0 8px ${P}` }}/>
            </div>
          </div>

          {/* 3 — Latência */}
          <div style={cardWrap}>
            <KickerN num="03" label="Latência" delta="estável"/>
            <div style={{ display:'flex', alignItems:'baseline', gap:6, marginTop:6 }}>
              <div style={{
                fontFamily: heroFam, fontSize:96, lineHeight:0.82,
                letterSpacing: heroLs, fontWeight: heroWeight,
              }}>{window.TODAY.lis}</div>
              <div style={{
                fontFamily: heroFam, fontSize:32, color: P, letterSpacing:'-0.02em',
                fontStyle: heroItalic ? 'italic' : 'normal', fontWeight: heroWeight,
              }}>min</div>
            </div>
            <div style={{ fontSize:12, color: N2.muted, marginTop:12, lineHeight:1.5 }}>
              Tempo entre deitar e adormecer. Abaixo de 20 min é considerado saudável.
            </div>
            <div style={{ marginTop:14 }}>
              <LatencyTrackN value={window.TODAY.lis} primary={P}/>
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
              background: swipe.idx===i ? '#fff' : N2.ghost,
              boxShadow: swipe.idx===i ? `0 0 6px ${P}88` : 'none',
              border:0, padding:0, cursor:'pointer',
              transition:'width 280ms ease, background 280ms ease',
            }}/>
        ))}
      </div>
    </div>
  );
}

function KickerN({ num, label, delta }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:4 }}>
      <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
        <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color: N2.dim, letterSpacing:'0.14em' }}>{num}</span>
        <span style={{ fontSize:11, color: N2.muted, letterSpacing:'0.16em', textTransform:'uppercase', fontWeight:500 }}>{label}</span>
      </div>
      {delta && <span style={{ fontSize:10.5, color: N2.dim, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.04em' }}>{delta}</span>}
    </div>
  );
}

function BigNumberHMN({ h, m, primary, fam='Fraunces, serif', italic=true, ls='-0.05em', weight=300 }) {
  const num = { fontFamily: fam, fontSize:84, lineHeight:0.82, letterSpacing: ls, fontWeight: weight };
  const unit = { fontFamily: fam, fontSize:46, color: primary, letterSpacing:'-0.03em', fontStyle: italic ? 'italic' : 'normal', fontWeight: weight };
  return (
    <div style={{ display:'flex', alignItems:'baseline', gap:2, marginTop:6 }}>
      <div style={num}>{h}</div>
      <div style={unit}>h</div>
      <div style={{ ...num, marginLeft:2 }}>{String(m).padStart(2,'0')}</div>
    </div>
  );
}

function BigPctN({ value, primary, fam='Fraunces, serif', italic=true, ls='-0.05em', weight=300 }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline' }}>
      <div style={{ fontFamily: fam, fontSize:92, lineHeight:0.82, letterSpacing: ls, fontWeight: weight }}>{value}</div>
      <div style={{ fontFamily: fam, fontSize:36, color: primary, letterSpacing:'-0.02em', fontStyle: italic ? 'italic' : 'normal', fontWeight: weight, marginLeft:2 }}>%</div>
    </div>
  );
}

function RingMiniN({ value, primary }) {
  const r = 22, c = 2*Math.PI*r;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" style={{ display:'block' }}>
      <defs>
        <filter id="ringGlowN2">
          <feGaussianBlur stdDeviation="2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="28" cy="28" r={r} stroke="rgba(255,255,255,0.10)" strokeWidth="4" fill="none"/>
      <circle cx="28" cy="28" r={r} stroke={primary} strokeWidth="4" fill="none"
        strokeDasharray={c} strokeDashoffset={c - (value/100)*c} strokeLinecap="round"
        transform="rotate(-90 28 28)" filter="url(#ringGlowN2)"/>
    </svg>
  );
}

function NightBarN({ primary }) {
  return (
    <div style={{ marginTop:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10.5, color: N2.dim, letterSpacing:'0.1em', marginBottom:6, fontFamily:'JetBrains Mono, monospace' }}>
        <span>23:14</span><span>07:08</span>
      </div>
      <div style={{ position:'relative', height: 22, borderRadius: 11, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'4%', background:'rgba(255,255,255,0.18)' }}/>
        <div style={{ position:'absolute', left:'4%', top:0, bottom:0, width:'94%', background:`linear-gradient(90deg, ${primary}, ${primary}CC)`, boxShadow:`0 0 14px ${primary}66` }}/>
        <div style={{ position:'absolute', left:'42%', top:0, bottom:0, width:'2%', background:'rgba(255,255,255,0.22)' }}/>
        <div style={{ position:'absolute', left:'68%', top:0, bottom:0, width:'1.5%', background:'rgba(255,255,255,0.22)' }}/>
      </div>
      <div style={{ display:'flex', gap:14, marginTop:8, fontSize:10, color: N2.muted }}>
        <span style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:8, height:8, borderRadius:2, background: primary }}/> Sono útil
        </span>
        <span style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:8, height:8, borderRadius:2, background:'rgba(255,255,255,0.22)' }}/> Acordada / latência
        </span>
      </div>
    </div>
  );
}

function LatencyTrackN({ value, primary }) {
  const pct = Math.min(100, (value/60)*100);
  return (
    <div>
      <div style={{ position:'relative', height: 8, borderRadius:4, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${(20/60)*100}%`, background:`${primary}44` }}/>
        <div style={{ position:'absolute', left:`${pct}%`, top:-3, width:2, height:14, background:'#fff', borderRadius:1, boxShadow:`0 0 8px ${primary}` }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:10, color: N2.dim, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.08em' }}>
        <span>0</span><span>20 min · ideal</span><span>60</span>
      </div>
    </div>
  );
}

// ── Daily insight (dark) ──────────────────────────────────────
function DailyInsightN({ primary }) {
  return (
    <div style={{ display:'flex', gap:12, padding:'12px 0' }}>
      <div style={{
        width:2, borderRadius:1, background: primary, flexShrink:0, alignSelf:'stretch',
        boxShadow:`0 0 8px ${primary}`,
      }}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:11, color: N2.muted, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:500 }}>
          Padrão da semana
        </div>
        <div style={{ fontSize:15, color: N2.ink, marginTop:4, lineHeight:1.45, fontFamily:'Fraunces, serif', fontWeight:400 }}>
          Você dormiu antes das 23:30 em <span style={{ fontStyle:'italic', color: primary }}>6 das últimas 7 noites</span>. Boa consistência de horário — siga assim para reforçar o ritmo circadiano.
        </div>
      </div>
    </div>
  );
}

// ── Long-press breakdown sheet (dark) ─────────────────────────
function BreakdownSheetN({ primary, onClose }) {
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
    <div className="nv2-fade" style={{
      position:'absolute', inset:0, zIndex:50,
      display:'flex', alignItems:'flex-end', justifyContent:'stretch',
    }}>
      <div onClick={onClose} style={{
        position:'absolute', inset:0, background:'rgba(5,7,18,0.55)', backdropFilter:'blur(4px)',
      }}/>
      <div className="nv2-sheet" style={{
        position:'relative', width:'100%',
        background:'linear-gradient(180deg, #0E1227, #07091A)',
        borderTopLeftRadius:26, borderTopRightRadius:26,
        boxShadow:'0 -8px 32px rgba(0,0,0,0.5)',
        padding:'14px 24px 28px', maxHeight:'78%', overflow:'auto',
        border:`1px solid ${N2.stroke}`, borderBottom:'none',
      }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:10 }}>
          <div style={{ width:38, height:4, borderRadius:2, background: N2.strokeStrong }}/>
        </div>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:11, color: N2.muted, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:500 }}>Detalhes da noite</div>
            <div style={{ fontFamily:'Fraunces, serif', fontSize:26, marginTop:4, letterSpacing:'-0.01em', fontWeight:400 }}>
              Eficiência <span style={{ fontStyle:'italic', color: primary }}>{window.TODAY.eff}%</span>
            </div>
          </div>
          <button onClick={onClose} className="nv2-tap" style={{
            background: N2.surface, border:`1px solid ${N2.stroke}`, color: N2.ink,
            padding:'6px 10px', borderRadius:10, cursor:'pointer', fontSize:12,
          }}>Fechar</button>
        </div>

        <div style={{
          marginTop:18, borderRadius:16,
          background: N2.surface, border:`1px solid ${N2.stroke}`,
        }}>
          {rows.map((r, i) => (
            <div key={r.label} style={{
              display:'grid', gridTemplateColumns:'1fr auto', gap:12,
              padding:'13px 16px',
              borderBottom: i < rows.length-1 ? `1px solid ${N2.stroke}` : 'none',
              alignItems:'baseline',
            }}>
              <div>
                <div style={{ fontSize:13, color: N2.ink, fontWeight:500 }}>{r.label}</div>
                <div style={{ fontSize:11, color: N2.muted, marginTop:2 }}>{r.hint}</div>
              </div>
              <div style={{ fontFamily:'Fraunces, serif', fontSize:20, color: N2.ink, letterSpacing:'-0.01em' }}>
                {r.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop:14, padding:'12px 14px', borderRadius:14,
          background:`${primary}1A`, border:`1px solid ${primary}33`,
          fontSize:12, color: N2.ink, lineHeight:1.55,
        }}>
          <b>Como interpretar:</b> a eficiência de 94% é considerada <span style={{ fontStyle:'italic' }}>excelente</span>. Continue priorizando rotina e ambiente escuro.
        </div>
      </div>
    </div>
  );
}

// ── Bottom tabs (dark) ────────────────────────────────────────
function BottomTabsN2({ primary }) {
  return (
    <div style={{
      position:'absolute', bottom:0, left:0, right:0, padding:'10px 18px 18px',
      background:'rgba(7,9,20,0.85)', borderTop:`1px solid ${N2.stroke}`,
      display:'flex', alignItems:'center', justifyContent:'space-around', backdropFilter:'blur(20px)',
    }}>
      {[
        { id:'home', icon: <Icon.Home width="20" height="20" color={N2.ink}/>, label:'Hoje', active:true },
        { id:'chart', icon: <Icon.Chart width="20" height="20" color={N2.muted}/>, label:'Tendência' },
        { id:'add', primary:true },
        { id:'bell', icon: <Icon.Bell width="20" height="20" color={N2.muted}/>, label:'Hábitos' },
        { id:'user', icon: <Icon.User width="20" height="20" color={N2.muted}/>, label:'Perfil' },
      ].map(t => t.primary ? (
        <button key={t.id} className="nv2-press" style={{
          width:52, height:52, borderRadius:18, border:0, cursor:'pointer',
          background:`linear-gradient(135deg, ${primary}, #5B47BF)`, color:'#fff',
          boxShadow:`0 10px 24px ${primary}88`,
          marginTop:-18,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}><Icon.Plus width="22" height="22"/></button>
      ) : (
        <button key={t.id} className="nv2-tap" style={{
          background:'transparent', border:0, cursor:'pointer', color: t.active?N2.ink:N2.muted,
          display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'4px 6px',
        }}>
          {t.icon}
          <span style={{ fontSize:9, fontWeight: t.active?600:500, letterSpacing:'0.04em' }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Subroute: Diary (no emojis, clinical) ─────────────────────
function NocturneV2Diary({ onBack, primary }) {
  const [step, setStep] = React.useState(0);
  const [vals, setVals] = React.useState({ bedtime:'23:14', latency:11, waso:6, mood:4 });
  const steps = [
    { key:'bedtime', q:'Que horas você deitou?',         kind:'time' },
    { key:'latency', q:'Quanto tempo levou para dormir?', kind:'num', unit:'min' },
    { key:'waso',    q:'Acordou durante a noite?',        kind:'num', unit:'min' },
    { key:'mood',    q:'Como se sente ao acordar?',       kind:'scale' },
  ];
  const s = steps[step];

  return (
    <div style={{ background: N2.bg, minHeight:'100%', padding:'20px 24px 28px', color: N2.ink, fontFamily:'Inter', position:'relative', overflow:'hidden' }}>
      <NocturneV2Styles/>
      <NocturneBackdrop primary={primary} withMoon={false}/>
      <div style={{ position:'relative' }}>
        <div className="nv2-block" style={{ animationDelay:'0ms', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <button onClick={onBack} className="nv2-tap" style={{ background:'transparent', border:0, cursor:'pointer', fontSize:13, color: N2.ink, padding:0 }}>← Voltar</button>
          <div style={{ fontSize:11, color: N2.muted, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.08em' }}>
            {String(step+1).padStart(2,'0')} / {String(steps.length).padStart(2,'0')}
          </div>
        </div>
        <div className="nv2-block" style={{ animationDelay:'60ms', marginTop:18, height:3, background:'rgba(255,255,255,0.08)', borderRadius:2 }}>
          <div style={{ width:`${(step+1)/steps.length*100}%`, height:'100%', background: primary, borderRadius:2, transition:'width 420ms cubic-bezier(0.22,0.61,0.36,1)', boxShadow:`0 0 8px ${primary}` }}/>
        </div>
        <div className="nv2-block" style={{ animationDelay:'120ms', fontFamily:'Fraunces, serif', fontSize:32, marginTop:40, letterSpacing:'-0.015em', lineHeight:1.1, fontWeight:300 }}>{s.q}</div>

        <div className="nv2-block" style={{ animationDelay:'200ms', marginTop:32, padding:'30px 20px', borderRadius:20, background: N2.surface, border:`1px solid ${N2.stroke}`, display:'flex', alignItems:'center', justifyContent:'center', minHeight: 180, backdropFilter:'blur(8px)' }}>
          {s.kind === 'time' && (
            <div style={{ fontFamily:'Fraunces, serif', fontSize:64, letterSpacing:'-0.03em', color: N2.ink, fontWeight:300 }}>
              {vals.bedtime.split(':')[0]}<span style={{ color: primary, fontStyle:'italic' }}>:</span>{vals.bedtime.split(':')[1]}
            </div>
          )}
          {s.kind === 'num' && (
            <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
              <div style={{ fontFamily:'Fraunces, serif', fontSize:72, color: primary, letterSpacing:'-0.04em', fontWeight:300 }}>
                {vals[s.key]}
              </div>
              <div style={{ fontFamily:'Fraunces, serif', fontSize:26, color: N2.muted, fontStyle:'italic' }}>{s.unit}</div>
            </div>
          )}
          {s.kind === 'scale' && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
              <div style={{ display:'flex', gap:10 }}>
                {[1,2,3,4,5].map(n => {
                  const active = n === vals.mood;
                  return (
                    <button key={n} onClick={()=>setVals(v=>({ ...v, mood:n }))} className="nv2-tap" style={{
                      width:46, height:46, borderRadius:'50%', cursor:'pointer',
                      background: active ? primary : 'rgba(255,255,255,0.05)',
                      border:`1px solid ${active ? primary : N2.strokeStrong}`,
                      color: active ? '#fff' : N2.ink,
                      fontFamily:'Fraunces, serif', fontSize:20, letterSpacing:'-0.01em',
                      boxShadow: active ? `0 0 16px ${primary}88` : 'none',
                    }}>{n}</button>
                  );
                })}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', width:'100%', maxWidth:260, fontSize:11, color: N2.muted }}>
                <span>Exausta</span><span>Descansada</span>
              </div>
            </div>
          )}
        </div>

        <div className="nv2-block" style={{ animationDelay:'260ms', display:'flex', gap:10, marginTop:20 }}>
          {step > 0 && (
            <button onClick={()=>setStep(step-1)} className="nv2-press" style={{ flex:1, padding:'14px 0', borderRadius:14, background:'rgba(255,255,255,0.05)', border:`1px solid ${N2.stroke}`, cursor:'pointer', fontSize:13, color: N2.ink }}>
              Anterior
            </button>
          )}
          <button onClick={()=> step<steps.length-1 ? setStep(step+1) : onBack()} className="nv2-press" style={{
            flex:2, padding:'14px 0', borderRadius:14, background:`linear-gradient(135deg, ${primary}, #5B47BF)`, color:'#fff',
            border:0, cursor:'pointer', fontSize:14, fontWeight:500, letterSpacing:'-0.005em',
            boxShadow:`0 8px 22px ${primary}55`,
          }}>{step < steps.length-1 ? 'Próximo' : 'Concluir'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Subroute: History ─────────────────────────────────────────
function NocturneV2History({ onBack, primary, chartStyle }) {
  return (
    <div style={{ background: N2.bg, minHeight:'100%', padding:'20px 24px 28px', color: N2.ink, position:'relative', overflow:'hidden' }}>
      <NocturneV2Styles/>
      <NocturneBackdrop primary={primary} withMoon={false}/>
      <div style={{ position:'relative' }}>
        <div className="nv2-block" style={{ animationDelay:'0ms' }}>
          <button onClick={onBack} className="nv2-tap" style={{ background:'transparent', border:0, cursor:'pointer', fontSize:13, padding:0, color: N2.ink }}>← Voltar</button>
        </div>
        <div className="nv2-block" style={{ animationDelay:'60ms', fontFamily:'Fraunces, serif', fontSize:32, marginTop:10, letterSpacing:'-0.015em', fontWeight:300 }}>
          Histórico
        </div>
        <div className="nv2-block" style={{ animationDelay:'100ms', fontSize:11, color: N2.dim, letterSpacing:'0.14em', textTransform:'uppercase', marginTop:4, fontFamily:'JetBrains Mono, monospace' }}>
          Últimas 14 noites
        </div>
        <div className="nv2-block" style={{ animationDelay:'160ms', marginTop:22, padding:'14px 10px', borderRadius:18, background: N2.surface, border:`1px solid ${N2.stroke}`, backdropFilter:'blur(8px)' }}>
          <TrendChart data={window.SLEEP_DATA.map((d,i)=>({ label: (i%2?'':String(14-i)), value:d.eff }))} style={chartStyle} primary={primary} track="rgba(255,255,255,0.08)" textColor={N2.muted} glow height={140}/>
        </div>
        <div style={{ marginTop:18 }}>
          {window.SLEEP_DATA.slice().reverse().slice(0,8).map((d,i) => (
            <div key={i} className="nv2-block" style={{
              animationDelay: `${200 + i*40}ms`,
              display:'grid', gridTemplateColumns:'40px 1fr auto', gap:12, alignItems:'center',
              padding:'14px 16px', borderRadius:14, background: N2.surface, border:`1px solid ${N2.stroke}`, marginBottom:8, backdropFilter:'blur(8px)',
            }}>
              <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color: N2.dim, letterSpacing:'0.06em' }}>D{Math.abs(d.d)}</div>
              <div>
                <div style={{ fontFamily:'Fraunces, serif', fontSize:22, letterSpacing:'-0.01em', fontWeight:400 }}>{window.fmtH(d.tts)}</div>
                <div style={{ height:3, marginTop:6, borderRadius:2, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                  <div style={{ width: d.eff+'%', height:'100%', background: primary, boxShadow:`0 0 6px ${primary}` }}/>
                </div>
              </div>
              <div style={{ fontSize:13, fontWeight:600, color: primary, fontFamily:'JetBrains Mono, monospace' }}>{d.eff}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Subroute: IGI ─────────────────────────────────────────────
function NocturneV2IGI({ onBack, primary }) {
  const segments = [
    { from:0, to:7, label:'Ausência',     color:'rgba(255,255,255,0.22)' },
    { from:8, to:14, label:'Subclínica',  color: primary },
    { from:15, to:21, label:'Moderada',   color:'#FFA86B' },
    { from:22, to:28, label:'Grave',      color:'#FF7A7A' },
  ];

  return (
    <div style={{ background: N2.bg, minHeight:'100%', padding:'20px 24px 28px', color: N2.ink, position:'relative', overflow:'hidden' }}>
      <NocturneV2Styles/>
      <NocturneBackdrop primary={primary} withMoon={false}/>
      <div style={{ position:'relative' }}>
        <div className="nv2-block" style={{ animationDelay:'0ms' }}>
          <button onClick={onBack} className="nv2-tap" style={{ background:'transparent', border:0, cursor:'pointer', fontSize:13, padding:0, color: N2.ink }}>← Voltar</button>
        </div>
        <div className="nv2-block" style={{ animationDelay:'60ms', fontFamily:'Fraunces, serif', fontSize:30, marginTop:10, letterSpacing:'-0.015em', lineHeight:1.1, fontWeight:300 }}>
          Índice de Gravidade da Insônia
        </div>
        <div className="nv2-block" style={{ animationDelay:'100ms', fontSize:11, color: N2.dim, marginTop:4, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.08em' }}>
          Último resultado · há {window.ISI_LAST_DAYS} dias
        </div>

        <div className="nv2-block" style={{ animationDelay:'160ms', marginTop:24, padding:'28px 20px', borderRadius:20, background: N2.surface, border:`1px solid ${N2.stroke}`, display:'flex', flexDirection:'column', alignItems:'center', backdropFilter:'blur(8px)' }}>
          <Ring value={(window.ISI_SCORE/28)*100} size={150} primary={primary} track="rgba(255,255,255,0.08)" glow label="de 28" sublabel={window.ISI_LABEL}/>
          <div style={{ fontFamily:'Fraunces, serif', fontSize:24, marginTop:12, letterSpacing:'-0.01em', fontWeight:400 }}>{window.ISI_SCORE} pontos</div>
          <div style={{ fontSize:12, color: N2.muted, marginTop:2 }}>Insônia {window.ISI_LABEL.toLowerCase()}</div>
        </div>

        <div className="nv2-block" style={{ animationDelay:'220ms', marginTop:20, padding:'4px 16px', borderRadius:18, background: N2.surface, border:`1px solid ${N2.stroke}`, backdropFilter:'blur(8px)' }}>
          {segments.map((s,i) => {
            const here = window.ISI_SCORE>=s.from && window.ISI_SCORE<=s.to;
            return (
              <div key={s.label} style={{ display:'grid', gridTemplateColumns:'10px 1fr auto', gap:12, alignItems:'center', padding:'14px 0', borderBottom: i<segments.length-1?`1px solid ${N2.stroke}`:'none' }}>
                <div style={{ width:6, height:32, borderRadius:3, background: s.color, boxShadow: here ? `0 0 8px ${s.color}` : 'none' }}/>
                <div>
                  <div style={{ fontSize:13.5, fontWeight: here ? 600 : 500, color: here ? N2.ink : N2.muted }}>{s.label}</div>
                  <div style={{ fontSize:11, color: N2.dim, marginTop:2, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.06em' }}>{s.from}–{s.to} pts</div>
                </div>
                {here && (
                  <div style={{ padding:'4px 9px', borderRadius:8, background:`${primary}33`, color: primary, fontSize:10, fontWeight:700, letterSpacing:'0.08em' }}>VOCÊ</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="nv2-block" style={{ animationDelay:'300ms', marginTop:18, padding:'14px 16px', borderRadius:14, background: `${primary}1A`, border:`1px solid ${primary}33`, fontSize:12, color: N2.ink, lineHeight:1.55 }}>
          Sua pontuação está na faixa <b>subclínica</b>. Vamos reavaliar em <b>{window.NEXT_ISI_IN_DAYS} dias</b> para acompanhar a evolução.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TodayNocturneV2 });
