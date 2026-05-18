// ─────────────────────────────────────────────────────────────
// V3 — EDITORIAL
// Data-forward: tipografia gigantesca, números como protagonistas,
// grid editorial, monospace para metadados, micro-animações marcadas.
// ─────────────────────────────────────────────────────────────
function TodayEditorial({ tweaks, primary, chartStyle, onNavigate, route='today', onThemeChange }) {
  const P = primary;
  const bg = '#0C0C0E';
  const surface = '#141417';
  const stroke = 'rgba(255,255,255,0.08)';
  const ink = '#FAFAF7';
  const muted = 'rgba(250,250,247,0.55)';
  const dim = 'rgba(250,250,247,0.35)';
  const accent = '#F5F1E6';

  const chartData = window.LAST7.map((d,i) => ({ label: window.weekdayLabels()[i], value: d.eff }));
  const ttsDelta = window.AVG7.tts - window.AVG_PREV7.tts;
  const effDelta = window.AVG7.eff - window.AVG_PREV7.eff;

  // Number counter animation
  function useCount(target, dur=900) {
    const [v, setV] = React.useState(0);
    React.useEffect(() => {
      let raf, t0;
      const step = (t) => {
        if (!t0) t0 = t;
        const p = Math.min(1, (t-t0)/dur);
        const e = 1 - Math.pow(1-p, 3);
        setV(Math.round(e*target));
        if (p<1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return ()=> cancelAnimationFrame(raf);
    }, [target]);
    return v;
  }

  const ttsHours = Math.floor(window.TODAY.tts/60);
  const ttsMins = window.TODAY.tts%60;
  const animEff = useCount(window.TODAY.eff);

  if (route === 'diary') return <EditorialDiary onBack={()=>onNavigate('today')} primary={P}/>;
  if (route === 'history') return <EditorialHistory onBack={()=>onNavigate('today')} primary={P} chartStyle={chartStyle}/>;
  if (route === 'igi') return <EditorialIGI onBack={()=>onNavigate('today')} primary={P}/>;
  if (route === 'settings') return <AppearanceSettings themeId="editorial" primary={P} onBack={()=>onNavigate('today')} onSelect={(id)=>{ onThemeChange && onThemeChange(id); }}/>;

  return (
    <div style={{
      width:'100%', minHeight:'100%', background: bg, color: ink, fontFamily:'Inter, sans-serif',
      paddingBottom: 96, position:'relative', overflow:'hidden',
    }}>
      {/* Subtle grain */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none', opacity:0.04,
        backgroundImage:`radial-gradient(circle at 1px 1px, ${accent} 1px, transparent 0)`,
        backgroundSize:'4px 4px',
      }}/>

      {/* TOP META BAR */}
      <div style={{
        padding:'14px 18px 0', display:'flex', alignItems:'center', justifyContent:'space-between',
        fontFamily:'JetBrains Mono, monospace', fontSize:10, letterSpacing:'0.08em', color: muted, textTransform:'uppercase',
      }}>
        <div>EDIÇÃO Nº {String(window.STREAK).padStart(3,'0')} · QUA 20 MAI</div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ width:6, height:6, borderRadius:3, background: P, boxShadow:`0 0 8px ${P}` }}/>
          <span>AO VIVO · 06:32</span>
          <button onClick={()=>onNavigate('settings')} style={{
            background:'transparent', border:`1px solid ${stroke}`, color: muted, cursor:'pointer',
            padding:'3px 8px', borderRadius:0, fontFamily:'JetBrains Mono, monospace', fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase',
          }}>CFG ⚙</button>
        </div>
      </div>

      {/* MASTHEAD */}
      <div style={{ padding:'10px 18px 0' }}>
        <div style={{
          fontFamily:'Fraunces, serif', fontWeight:300, fontSize:34, lineHeight:0.95, letterSpacing:'-0.03em',
        }}>
          O <span style={{ fontStyle:'italic', color: P }}>diário</span><br/>
          do sono.
        </div>
        <div style={{
          marginTop:8, paddingTop:8, borderTop:`1px solid ${stroke}`,
          fontFamily:'JetBrains Mono, monospace', fontSize:10, color: muted, letterSpacing:'0.08em', textTransform:'uppercase',
          display:'flex', justifyContent:'space-between',
        }}>
          <span>Bom dia, Marina</span>
          <span>Streak {window.STREAK} · IGI {window.ISI_SCORE}</span>
        </div>
      </div>

      {/* HERO TTS — gigantesco */}
      <div style={{ padding:'14px 18px 0' }}>
        <div style={{
          background: surface, borderRadius:18, padding:'18px 18px 16px',
          border:`1px solid ${stroke}`, position:'relative', overflow:'hidden',
        }}>
          <div style={{
            fontFamily:'JetBrains Mono, monospace', fontSize:9, color: dim,
            letterSpacing:'0.16em', textTransform:'uppercase', marginBottom:6,
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <span>01 · TEMPO DE SONO</span>
            <span style={{ color: ttsDelta>=0 ? P : '#FF8A8A' }}>{ttsDelta>=0?'▲':'▼'} {Math.abs(ttsDelta)}m</span>
          </div>

          <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
            <div style={{
              fontFamily:'Fraunces, serif', fontWeight:300, fontSize:116, lineHeight:0.82, letterSpacing:'-0.06em',
              color: ink,
            }}>{ttsHours}</div>
            <div style={{
              fontFamily:'Fraunces, serif', fontWeight:400, fontStyle:'italic', fontSize:60, lineHeight:0.82,
              color: P, letterSpacing:'-0.04em', marginLeft:2,
            }}>h</div>
            <div style={{
              fontFamily:'Fraunces, serif', fontWeight:300, fontSize:96, lineHeight:0.82, letterSpacing:'-0.06em',
              color: ink, marginLeft:6,
            }}>{String(ttsMins).padStart(2,'0')}</div>
          </div>

          <div style={{ marginTop:14, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:0 }}>
            <EditStat label="EFICIÊNCIA" value={`${animEff}%`} accent={P} highlight stroke={stroke}/>
            <EditStat label="LATÊNCIA" value={`${window.TODAY.lis}min`} stroke={stroke}/>
            <EditStat label="WASO" value={`${window.TODAY.waso}min`} stroke={stroke} noBorder/>
          </div>
        </div>
      </div>

      {/* TIMELINE STRIP — visualização da noite */}
      <div style={{ padding:'14px 18px 0' }}>
        <SectionLabel num="02" label="A NOITE · 23:14 → 07:08" muted={dim}/>
        <NightTimeline P={P} stroke={stroke} muted={muted}/>
      </div>

      {/* TREND */}
      <div style={{ padding:'14px 18px 0' }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
          <SectionLabel num="03" label="TENDÊNCIA · 7 DIAS" muted={dim}/>
          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color: P, letterSpacing:'0.08em' }}>
            ↑ {effDelta}% MÉDIA
          </div>
        </div>
        <div style={{ padding:'14px 8px 6px', borderRadius:16, background: surface, border:`1px solid ${stroke}`, marginTop:4 }}>
          <TrendChart data={chartData} style={chartStyle} primary={P} track="rgba(255,255,255,0.06)" textColor={muted} height={130}/>
        </div>
        <div style={{ marginTop:10, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <CompareCard label="MÉDIA 7D" value={window.AVG7.eff+'%'} delta={`+${effDelta}%`} P={P} stroke={stroke} surface={surface} dim={dim} muted={muted}/>
          <CompareCard label="MÉDIA TTS" value={window.fmtHShort(window.AVG7.tts)} delta={`+${ttsDelta}m`} P={P} stroke={stroke} surface={surface} dim={dim} muted={muted}/>
        </div>
      </div>

      {/* CONSISTENCY HEATMAP */}
      <div style={{ padding:'14px 18px 0' }}>
        <SectionLabel num="04" label="CONSISTÊNCIA · 14 DIAS" muted={dim}/>
        <ConsistencyGrid P={P} dim={dim} muted={muted}/>
      </div>

      {/* CTA */}
      <div style={{ padding:'14px 18px 0' }}>
        <button onClick={()=>onNavigate('diary')} style={{
          width:'100%', padding:'18px 18px', borderRadius:16, border:0, cursor:'pointer',
          background: ink, color: bg, textAlign:'left', position:'relative', overflow:'hidden',
          display:'flex', alignItems:'center', gap:14,
        }}>
          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, letterSpacing:'0.18em', color: P, fontWeight:600 }}>05</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'Fraunces, serif', fontSize:22, fontWeight:500, letterSpacing:'-0.01em' }}>Preencher o diário →</div>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'rgba(12,12,14,0.5)', letterSpacing:'0.1em', textTransform:'uppercase', marginTop:2 }}>4 perguntas · ~2 min</div>
          </div>
          <div style={{ width:36, height:36, borderRadius:'50%', background: P, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
            <Icon.ArrowRight width="18" height="18"/>
          </div>
        </button>
      </div>

      {/* IGI row */}
      <div style={{ padding:'12px 18px 0' }}>
        <button onClick={()=>onNavigate('igi')} style={{
          width:'100%', padding:'12px 14px', borderRadius:14, border:`1px solid ${stroke}`,
          background: surface, color: ink, textAlign:'left', cursor:'pointer',
          display:'flex', alignItems:'center', gap:12,
        }}>
          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, letterSpacing:'0.16em', color: dim }}>06</div>
          <div style={{ flex:1, fontSize:12 }}>
            <span style={{ fontFamily:'Fraunces, serif', fontStyle:'italic', fontSize:16 }}>IGI</span>
            <span style={{ color: muted, marginLeft:8 }}>{window.ISI_SCORE}/28 · {window.ISI_LABEL}</span>
          </div>
          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color: P, letterSpacing:'0.08em' }}>+{window.NEXT_ISI_IN_DAYS}d</div>
        </button>
      </div>

      {/* Footer */}
      <div style={{ padding:'18px 18px 12px', display:'flex', justifyContent:'space-between', fontFamily:'JetBrains Mono, monospace', fontSize:9, color: dim, letterSpacing:'0.12em', textTransform:'uppercase' }}>
        <span>Dr. Fernando Azevedo</span>
        <span>EXP / 2026</span>
      </div>

      <BottomTabsE P={P} ink={ink} muted={muted} bg={bg} stroke={stroke}/>
    </div>
  );
}

function SectionLabel({ num, label, muted }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10, marginBottom:8,
      fontFamily:'JetBrains Mono, monospace', fontSize:10, color: muted, letterSpacing:'0.16em', textTransform:'uppercase',
    }}>
      <span style={{ opacity:0.6 }}>{num}</span>
      <span style={{ flex:1, height:1, background:'currentColor', opacity:0.18 }}/>
      <span>{label}</span>
    </div>
  );
}

function EditStat({ label, value, accent, highlight, stroke, noBorder }) {
  return (
    <div style={{
      padding:'10px 12px', borderRight: noBorder?'none':`1px solid ${stroke}`,
      fontFamily:'JetBrains Mono, monospace',
    }}>
      <div style={{ fontSize:9, opacity:0.5, letterSpacing:'0.14em' }}>{label}</div>
      <div style={{
        fontFamily:'Fraunces, serif', fontWeight:400, fontSize:22, letterSpacing:'-0.02em',
        color: highlight ? accent : 'inherit', marginTop:2,
      }}>{value}</div>
    </div>
  );
}

function NightTimeline({ P, stroke, muted }) {
  // 8-hour timeline 23:14 → 07:08. Sleep stages: light/deep/rem.
  const stages = [
    { from: 0, to: 4, label:'L' },   // latency
    { from: 4, to: 22, label:'D' },  // deep
    { from: 22, to: 35, label:'R' },
    { from: 35, to: 42, label:'L' },
    { from: 42, to: 44, label:'W' }, // waso
    { from: 44, to: 60, label:'D' },
    { from: 60, to: 72, label:'R' },
    { from: 72, to: 88, label:'L' },
    { from: 88, to: 90, label:'W' },
    { from: 90, to: 100, label:'L' },
  ];
  const colorFor = (l) => ({
    L: P+'88',
    D: P,
    R: P+'DD',
    W: 'rgba(255,255,255,0.18)',
  }[l]);
  const height = (l) => ({ L: 32, D: 52, R: 42, W: 14 }[l]);
  return (
    <div style={{
      padding:'14px 14px 12px', borderRadius:16, background: '#141417', border:`1px solid ${stroke}`,
    }}>
      <div style={{ display:'flex', alignItems:'flex-end', gap:1, height: 60 }}>
        {stages.map((s,i) => (
          <div key={i} style={{
            flex: s.to-s.from, height: height(s.label),
            background: colorFor(s.label), borderRadius:2,
          }}/>
        ))}
      </div>
      <div style={{
        display:'flex', justifyContent:'space-between', marginTop:6,
        fontFamily:'JetBrains Mono, monospace', fontSize:9, color: muted, letterSpacing:'0.08em',
      }}>
        <span>23:14</span><span>01:00</span><span>03:00</span><span>05:00</span><span>07:08</span>
      </div>
      <div style={{ display:'flex', gap:14, marginTop:10, flexWrap:'wrap', fontSize:10, color: muted, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.08em', textTransform:'uppercase' }}>
        <span><span style={{ display:'inline-block', width:8, height:8, background:P, borderRadius:1, marginRight:5, verticalAlign:'middle' }}/>Profundo</span>
        <span><span style={{ display:'inline-block', width:8, height:8, background:P+'DD', borderRadius:1, marginRight:5, verticalAlign:'middle' }}/>REM</span>
        <span><span style={{ display:'inline-block', width:8, height:8, background:P+'88', borderRadius:1, marginRight:5, verticalAlign:'middle' }}/>Leve</span>
        <span><span style={{ display:'inline-block', width:8, height:8, background:'rgba(255,255,255,0.18)', borderRadius:1, marginRight:5, verticalAlign:'middle' }}/>Acordada</span>
      </div>
    </div>
  );
}

function CompareCard({ label, value, delta, P, stroke, surface, dim, muted }) {
  return (
    <div style={{ padding:'12px 14px', borderRadius:14, background: surface, border:`1px solid ${stroke}` }}>
      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, letterSpacing:'0.14em', color: dim }}>{label}</div>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginTop:4 }}>
        <div style={{ fontFamily:'Fraunces, serif', fontSize:22, fontWeight:400, letterSpacing:'-0.02em' }}>{value}</div>
        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:11, color: P }}>{delta}</div>
      </div>
    </div>
  );
}

function ConsistencyGrid({ P, dim, muted }) {
  const cells = window.SLEEP_DATA;
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(14, 1fr)', gap:4 }}>
        {cells.map((c,i) => {
          const intensity = c.eff / 100;
          const isToday = i===cells.length-1;
          return (
            <div key={i} style={{
              aspectRatio:'1', borderRadius:4,
              background: `${P}${Math.round(intensity*255).toString(16).padStart(2,'0')}`,
              border: isToday ? `1.5px solid ${P}` : '1px solid rgba(255,255,255,0.04)',
              position:'relative',
            }}>
              {isToday && <div style={{ position:'absolute', inset:-3, borderRadius:6, border:`1px solid ${P}`, opacity:0.5 }}/>}
            </div>
          );
        })}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontFamily:'JetBrains Mono, monospace', fontSize:9, color: muted, letterSpacing:'0.08em', textTransform:'uppercase' }}>
        <span>14 dias atrás</span>
        <span style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ display:'inline-block', width:8, height:8, background:`${P}30`, borderRadius:1 }}/>
          <span style={{ display:'inline-block', width:8, height:8, background:`${P}80`, borderRadius:1 }}/>
          <span style={{ display:'inline-block', width:8, height:8, background:P, borderRadius:1 }}/>
        </span>
        <span>Hoje</span>
      </div>
    </div>
  );
}

function BottomTabsE({ P, ink, muted, bg, stroke }) {
  return (
    <div style={{
      position:'absolute', bottom:0, left:0, right:0, padding:'10px 16px 14px',
      background:'rgba(12,12,14,0.92)', borderTop:`1px solid ${stroke}`, backdropFilter:'blur(20px)',
      display:'flex', alignItems:'center', justifyContent:'space-around',
    }}>
      {[
        { id:'home', icon:<Icon.Home width="18" height="18" color={ink}/>, label:'01', active:true },
        { id:'chart', icon:<Icon.Chart width="18" height="18" color={muted}/>, label:'02' },
        { id:'add', primary:true },
        { id:'bell', icon:<Icon.Bell width="18" height="18" color={muted}/>, label:'04' },
        { id:'user', icon:<Icon.User width="18" height="18" color={muted}/>, label:'05' },
      ].map(t => t.primary ? (
        <button key={t.id} style={{
          width:50, height:50, borderRadius:'50%', border:0, cursor:'pointer',
          background: P, color:'#fff', marginTop:-16,
          boxShadow:`0 10px 22px ${P}66`,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}><Icon.Plus width="22" height="22"/></button>
      ) : (
        <button key={t.id} style={{
          background:'transparent', border:0, cursor:'pointer', color: t.active?ink:muted,
          display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'4px 6px',
          fontFamily:'JetBrains Mono, monospace',
        }}>
          {t.icon}
          <span style={{ fontSize:8, letterSpacing:'0.14em' }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Subroutes ─────────────────────────────────────────────────
function EditorialDiary({ onBack, primary }) {
  const [step, setStep] = React.useState(0);
  const steps = [
    { q:'Que horas você deitou?', value:'23:14', kind:'time' },
    { q:'Quanto tempo levou para dormir?', value:'11 min', kind:'num' },
    { q:'Acordou durante a noite?', value:'6 min', kind:'num' },
    { q:'Como se sente ao acordar?', value:4, kind:'mood' },
  ];
  const s = steps[step];
  return (
    <div style={{ background:'#0C0C0E', color:'#FAFAF7', minHeight:'100%', padding:'16px 18px 24px', fontFamily:'Inter' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:'JetBrains Mono, monospace', fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(250,250,247,0.55)' }}>
        <button onClick={onBack} style={{ background:'transparent', border:0, cursor:'pointer', color:'inherit', fontFamily:'inherit', fontSize:'inherit', letterSpacing:'inherit', padding:0 }}>← VOLTAR</button>
        <span>{String(step+1).padStart(2,'0')} / {String(steps.length).padStart(2,'0')}</span>
      </div>
      <div style={{ marginTop:18, height:2, background:'rgba(255,255,255,0.06)' }}>
        <div style={{ width:`${(step+1)/steps.length*100}%`, height:'100%', background: primary, transition:'width 320ms ease' }}/>
      </div>
      <div style={{ fontFamily:'Fraunces, serif', fontWeight:400, fontSize:36, marginTop:36, letterSpacing:'-0.02em', lineHeight:1.05 }}>
        <span style={{ fontStyle:'italic', color: primary }}>—</span> {s.q}
      </div>
      <div style={{ marginTop:36, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {s.kind==='mood' ? (
          <div style={{ display:'flex', gap:12 }}>
            {[1,2,3,4,5].map(n => (
              <div key={n} style={{
                width:46, height:46, borderRadius:'50%',
                background: n===s.value ? primary : 'transparent',
                border:`1px solid ${n===s.value?primary:'rgba(255,255,255,0.18)'}`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:22,
              }}>{['😴','😐','🙂','😊','🤩'][n-1]}</div>
            ))}
          </div>
        ) : (
          <div style={{ fontFamily:'Fraunces, serif', fontSize:88, color: primary, letterSpacing:'-0.04em', fontWeight:300 }}>{s.value}</div>
        )}
      </div>
      <div style={{ display:'flex', gap:10, marginTop:48 }}>
        {step>0 && <button onClick={()=>setStep(step-1)} style={{ flex:1, padding:'14px 0', borderRadius:0, border:'1px solid rgba(255,255,255,0.18)', background:'transparent', color:'#fff', cursor:'pointer', fontSize:11, letterSpacing:'0.14em', fontFamily:'JetBrains Mono, monospace', textTransform:'uppercase' }}>Anterior</button>}
        <button onClick={()=> step<steps.length-1 ? setStep(step+1) : onBack()} style={{
          flex:2, padding:'14px 0', borderRadius:0, background:'#FAFAF7', color:'#0C0C0E', border:0, cursor:'pointer',
          fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:'JetBrains Mono, monospace', fontWeight:700,
        }}>{step<steps.length-1 ? 'Próximo →' : 'Concluir →'}</button>
      </div>
    </div>
  );
}

function EditorialHistory({ onBack, primary, chartStyle }) {
  return (
    <div style={{ background:'#0C0C0E', color:'#FAFAF7', minHeight:'100%', padding:'16px 18px 24px' }}>
      <button onClick={onBack} style={{ background:'transparent', border:0, cursor:'pointer', color:'#FAFAF7', fontFamily:'JetBrains Mono, monospace', fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', padding:0 }}>← VOLTAR</button>
      <div style={{ fontFamily:'Fraunces, serif', fontSize:34, marginTop:10, letterSpacing:'-0.02em', fontWeight:300 }}>
        Histórico <span style={{ fontStyle:'italic', color: primary }}>— 14 noites</span>
      </div>
      <div style={{ marginTop:18, padding:'14px 8px', borderRadius:16, background:'#141417', border:'1px solid rgba(255,255,255,0.08)' }}>
        <TrendChart data={window.SLEEP_DATA.map((d,i)=>({ label: (i%2?'':String(14-i)), value:d.eff }))} style={chartStyle} primary={primary} track="rgba(255,255,255,0.06)" textColor="rgba(250,250,247,0.45)" height={150}/>
      </div>
      <div style={{ marginTop:16 }}>
        {window.SLEEP_DATA.slice().reverse().slice(0,8).map((d,i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'40px 1fr auto', gap:12, alignItems:'baseline', padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'rgba(250,250,247,0.45)', letterSpacing:'0.1em' }}>D{String(Math.abs(d.d)).padStart(2,'0')}</div>
            <div style={{ fontFamily:'Fraunces, serif', fontSize:22, letterSpacing:'-0.01em', fontWeight:400 }}>{window.fmtH(d.tts)}</div>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:12, color: primary }}>{d.eff}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditorialIGI({ onBack, primary }) {
  return (
    <div style={{ background:'#0C0C0E', color:'#FAFAF7', minHeight:'100%', padding:'16px 18px 24px' }}>
      <button onClick={onBack} style={{ background:'transparent', border:0, cursor:'pointer', color:'#FAFAF7', fontFamily:'JetBrains Mono, monospace', fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', padding:0 }}>← VOLTAR</button>
      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, letterSpacing:'0.14em', color: primary, marginTop:14, textTransform:'uppercase' }}>06 · ÍNDICE DE GRAVIDADE</div>
      <div style={{ fontFamily:'Fraunces, serif', fontWeight:300, fontSize:120, lineHeight:0.85, letterSpacing:'-0.06em', marginTop:10 }}>
        {window.ISI_SCORE}<span style={{ fontSize:42, color: primary, fontStyle:'italic' }}>/28</span>
      </div>
      <div style={{ marginTop:6, fontFamily:'Fraunces, serif', fontStyle:'italic', fontSize:22, color:'rgba(250,250,247,0.7)' }}>{window.ISI_LABEL}</div>

      <div style={{ marginTop:30, padding:'10px 0', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
        {[
          { from:0, to:7, label:'Ausência' },
          { from:8, to:14, label:'Subclínica' },
          { from:15, to:21, label:'Moderada' },
          { from:22, to:28, label:'Grave' },
        ].map((s,i) => {
          const is = window.ISI_SCORE>=s.from && window.ISI_SCORE<=s.to;
          return (
            <div key={s.label} style={{ display:'grid', gridTemplateColumns:'30px 1fr auto', gap:10, alignItems:'baseline', padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color: is?primary:'rgba(250,250,247,0.4)', letterSpacing:'0.1em' }}>0{i+1}</div>
              <div>
                <div style={{ fontFamily:'Fraunces, serif', fontSize:20, fontWeight:400, color: is?'#FAFAF7':'rgba(250,250,247,0.6)' }}>{s.label}</div>
                <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'rgba(250,250,247,0.4)', letterSpacing:'0.1em', marginTop:2 }}>{s.from}–{s.to} PTS</div>
              </div>
              {is && <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color: primary, letterSpacing:'0.14em' }}>● VOCÊ</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { TodayEditorial });
