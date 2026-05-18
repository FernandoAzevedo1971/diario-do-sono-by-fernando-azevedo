// ─────────────────────────────────────────────────────────────
// AppearanceSettings — in-app theme picker
// Used inside any of the three Today variations.
// Tone-adaptive: switches palette based on the active theme.
// ─────────────────────────────────────────────────────────────

const THEME_CATALOG = [
  {
    id: 'nocturne',
    name: 'Nocturne',
    tag: 'Wellness escuro',
    desc: 'Profundo, etéreo. Tons de noite com lua e brilho suave.',
    dark: true,
    swatchBg: 'linear-gradient(135deg, #070914 0%, #1a1438 70%, #2d1f5e 100%)',
    accent: '#A76BFA',
  },
  {
    id: 'sereno',
    name: 'Sereno',
    tag: 'Clínico claro',
    desc: 'Calmo, generoso, com tipografia humanista e fundo cream.',
    dark: false,
    swatchBg: 'linear-gradient(135deg, #F4F1EB 0%, #EFE9DC 100%)',
    accent: '#7CC9B4',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    tag: 'Data-forward',
    desc: 'Tipografia gigante, monospace e dados como protagonistas.',
    dark: true,
    swatchBg: 'linear-gradient(135deg, #0C0C0E 0%, #141417 100%)',
    accent: '#E8A86B',
  },
];

// ── Mini preview rendered inside each theme card ──────────────
function ThemePreview({ themeId, primary }) {
  if (themeId === 'nocturne') {
    return (
      <div style={{
        width:'100%', aspectRatio:'9/16', borderRadius:14, overflow:'hidden',
        background:'radial-gradient(ellipse at 30% 30%, #2d1f5e 0%, #0a0f24 55%, #050715 100%)',
        position:'relative', padding:'12px 10px',
      }}>
        {/* moon */}
        <div style={{ position:'absolute', top:14, right:12, width:22, height:22, borderRadius:'50%',
          background:'radial-gradient(circle at 30% 35%, #F0E9FF, #6C5BBA)',
          boxShadow:`0 0 12px ${primary}aa`,
        }}/>
        {/* stars */}
        {[[0.15,0.1],[0.6,0.06],[0.3,0.2],[0.85,0.18],[0.05,0.28]].map(([x,y],i)=>(
          <div key={i} style={{ position:'absolute', left:`${x*100}%`, top:`${y*100}%`, width:2, height:2, borderRadius:1, background:'#fff', opacity:0.8 }}/>
        ))}
        <div style={{ fontSize:7, color:'rgba(255,255,255,0.55)', letterSpacing:'0.12em', textTransform:'uppercase', marginTop:14 }}>QUA · 20 MAI</div>
        <div style={{ fontFamily:'Fraunces, serif', fontSize:14, color:'#fff', marginTop:3 }}>Bom dia,<br/><span style={{ fontStyle:'italic', color:'#F0E9FF' }}>Marina</span></div>
        <div style={{ marginTop:10, padding:'8px 8px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', border:`3px solid ${primary}`, borderRightColor:'transparent', boxShadow:`0 0 8px ${primary}88` }}/>
            <div>
              <div style={{ fontFamily:'Fraunces, serif', fontSize:14, color:'#fff', lineHeight:1 }}>7h26</div>
              <div style={{ fontSize:6, color:'rgba(255,255,255,0.5)', marginTop:2, letterSpacing:'0.1em' }}>DORMIU</div>
            </div>
          </div>
        </div>
        <div style={{ marginTop:8, display:'flex', alignItems:'flex-end', gap:2, height:24 }}>
          {[0.4,0.6,0.5,0.7,0.55,0.85,0.95].map((h,i)=>(
            <div key={i} style={{ flex:1, height:`${h*100}%`, borderRadius:2, background: i===6?primary:`${primary}55`, boxShadow: i===6?`0 0 6px ${primary}`:'none' }}/>
          ))}
        </div>
      </div>
    );
  }

  if (themeId === 'sereno') {
    return (
      <div style={{
        width:'100%', aspectRatio:'9/16', borderRadius:14, overflow:'hidden',
        background:'#F4F1EB', padding:'12px 10px', position:'relative',
      }}>
        <div style={{ fontSize:7, color:'#8A968F', letterSpacing:'0.12em', textTransform:'uppercase' }}>QUA · 20 MAI</div>
        <div style={{ fontFamily:'"Instrument Serif", serif', fontSize:13, color:'#0E1A18', marginTop:3, lineHeight:1.1 }}>Bom dia, Marina.<br/><span style={{ fontStyle:'italic', color:'#5B6A66' }}>Boa noite.</span></div>
        <div style={{ marginTop:10, padding:'10px 8px', borderRadius:10, background:'#fff', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontFamily:'"Instrument Serif", serif', fontSize:24, color:'#0E1A18', lineHeight:0.9 }}>
            7<span style={{ color: primary }}>h</span>26
          </div>
          <div style={{ marginTop:6, height:5, borderRadius:3, background:'#EFEAE0', overflow:'hidden' }}>
            <div style={{ width:'4%', height:'100%', background:'#D8CDB6', float:'left' }}/>
            <div style={{ width:'94%', height:'100%', background: primary, float:'left' }}/>
          </div>
          <div style={{ fontSize:6, color:'#8A968F', marginTop:4, letterSpacing:'0.1em', textTransform:'uppercase' }}>Eficiência 94%</div>
        </div>
        <div style={{ marginTop:8, padding:'8px', borderRadius:8, background:'#fff' }}>
          <svg viewBox="0 0 100 30" style={{ width:'100%', display:'block' }}>
            <path d="M0 22 Q 14 18 28 14 T 56 8 T 84 6 T 100 5" stroke={primary} strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M0 22 Q 14 18 28 14 T 56 8 T 84 6 T 100 5 L 100 30 L 0 30 Z" fill={primary} fillOpacity="0.15"/>
          </svg>
        </div>
      </div>
    );
  }

  // editorial
  return (
    <div style={{
      width:'100%', aspectRatio:'9/16', borderRadius:14, overflow:'hidden',
      background:'#0C0C0E', padding:'10px 8px', position:'relative', color:'#FAFAF7',
    }}>
      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:6, letterSpacing:'0.14em', color:'rgba(250,250,247,0.55)', display:'flex', justifyContent:'space-between' }}>
        <span>Nº 012 · QUA</span>
        <span style={{ color: primary }}>● AO VIVO</span>
      </div>
      <div style={{ fontFamily:'Fraunces, serif', fontWeight:300, fontSize:18, lineHeight:0.92, letterSpacing:'-0.03em', marginTop:6 }}>
        O <span style={{ fontStyle:'italic', color: primary }}>diário</span><br/>do sono.
      </div>
      <div style={{ marginTop:10, padding:'8px', borderRadius:6, background:'#141417', border:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:5, color:'rgba(255,255,255,0.4)', letterSpacing:'0.14em' }}>01 · TEMPO</div>
        <div style={{ display:'flex', alignItems:'baseline', gap:1, marginTop:2 }}>
          <span style={{ fontFamily:'Fraunces, serif', fontSize:34, lineHeight:0.85, fontWeight:300, letterSpacing:'-0.05em' }}>7</span>
          <span style={{ fontFamily:'Fraunces, serif', fontStyle:'italic', fontSize:20, color: primary }}>h</span>
          <span style={{ fontFamily:'Fraunces, serif', fontSize:28, lineHeight:0.85, fontWeight:300, letterSpacing:'-0.05em', marginLeft:2 }}>26</span>
        </div>
      </div>
      <div style={{ marginTop:8, display:'grid', gridTemplateColumns:'repeat(14,1fr)', gap:1.5 }}>
        {Array.from({length:14}).map((_,i)=>{
          const op = 0.2 + (i/14)*0.8;
          return <div key={i} style={{ aspectRatio:'1', borderRadius:1, background: `${primary}${Math.round(op*255).toString(16).padStart(2,'0')}` }}/>;
        })}
      </div>
    </div>
  );
}

// ── The screen itself ─────────────────────────────────────────
function AppearanceSettings({ themeId, primary, onBack, onSelect }) {
  const isDark = themeId !== 'sereno';
  const bg = themeId === 'nocturne' ? '#070914' : themeId === 'editorial' ? '#0C0C0E' : '#F4F1EB';
  const surface = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';
  const stroke = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,30,28,0.08)';
  const ink = isDark ? '#FAFAF7' : '#0E1A18';
  const muted = isDark ? 'rgba(255,255,255,0.55)' : '#5B6A66';
  const dim = isDark ? 'rgba(255,255,255,0.35)' : '#8A968F';

  // Typography per-theme
  const titleFont = themeId === 'sereno' ? '"Instrument Serif", serif' : 'Fraunces, serif';
  const titleStyle = themeId === 'editorial'
    ? { fontFamily:'Fraunces, serif', fontSize:32, fontWeight:300, letterSpacing:'-0.02em' }
    : { fontFamily: titleFont, fontSize:28, fontWeight:400, letterSpacing:'-0.01em' };
  const backLabel = themeId === 'editorial' ? '← VOLTAR' : '← Voltar';
  const backStyle = themeId === 'editorial'
    ? { fontFamily:'JetBrains Mono, monospace', fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase' }
    : { fontSize:13 };

  return (
    <div style={{ width:'100%', minHeight:'100%', background: bg, color: ink, padding:'18px 22px 90px', fontFamily:'Inter, sans-serif', position:'relative' }}>
      <button onClick={onBack} style={{ background:'transparent', border:0, cursor:'pointer', color: ink, padding:0, ...backStyle }}>{backLabel}</button>

      <div style={{ marginTop:14 }}>
        {themeId === 'editorial' && (
          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, letterSpacing:'0.16em', color: primary, textTransform:'uppercase' }}>CFG · 02 — APARÊNCIA</div>
        )}
        {themeId === 'sereno' && (
          <div style={{ fontSize:11, letterSpacing:'0.16em', textTransform:'uppercase', color: dim, fontWeight:500 }}>Configurações</div>
        )}
        {themeId === 'nocturne' && (
          <div style={{ fontSize:11, letterSpacing:'0.16em', textTransform:'uppercase', color: dim }}>Configurações</div>
        )}
        <div style={{ ...titleStyle, marginTop:4 }}>
          {themeId==='editorial' ? <>Aparência <span style={{ fontStyle:'italic', color: primary }}>—</span></> : 'Aparência'}
        </div>
        <div style={{ fontSize:12, color: muted, marginTop:6, lineHeight:1.45 }}>
          Escolha o visual que mais te agrada. Você pode mudar a qualquer momento.
        </div>
      </div>

      {/* Theme cards */}
      <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:14 }}>
        {THEME_CATALOG.map(theme => {
          const active = theme.id === themeId;
          return (
            <button key={theme.id} onClick={()=>onSelect(theme.id)} style={{
              padding:'14px', borderRadius:18, cursor:'pointer', textAlign:'left',
              background: active ? (isDark?'rgba(255,255,255,0.06)':'#FFFFFF') : (isDark?'rgba(255,255,255,0.025)':'#FFFFFF'),
              border: active ? `1.5px solid ${primary}` : `1px solid ${stroke}`,
              color: ink, display:'flex', gap:14, alignItems:'stretch',
              boxShadow: active ? `0 8px 28px -10px ${primary}66` : 'none',
              transition: 'border-color 200ms ease, box-shadow 200ms ease',
            }}>
              {/* Mini preview */}
              <div style={{ width: 84, flexShrink:0 }}>
                <ThemePreview themeId={theme.id} primary={theme.accent}/>
              </div>
              <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between', minWidth:0 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ fontSize:16, fontWeight:600 }}>{theme.name}</div>
                    {active && (
                      <div style={{
                        padding:'3px 8px', borderRadius:999, background: primary, color:'#fff',
                        fontSize:9, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
                      }}>Atual</div>
                    )}
                  </div>
                  <div style={{ fontSize:10, color: dim, marginTop:2, letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:500 }}>{theme.tag}</div>
                  <div style={{ fontSize:11.5, color: muted, marginTop:8, lineHeight:1.45 }}>{theme.desc}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:10 }}>
                  <span style={{ width:14, height:14, borderRadius:7, background: theme.accent, border:`1px solid ${stroke}` }}/>
                  <span style={{ width:14, height:14, borderRadius:7, background: theme.dark?'#fff':'#0E1A18', opacity: theme.dark?0.85:1, border:`1px solid ${stroke}` }}/>
                  <span style={{ width:14, height:14, borderRadius:7, background: theme.dark?'#1a1438':'#F4F1EB', border:`1px solid ${stroke}` }}/>
                  <div style={{ flex:1 }}/>
                  {!active && (
                    <div style={{ fontSize:11, color: primary, fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                      Aplicar <Icon.ArrowRight width="12" height="12"/>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop:18, fontSize:11, color: dim, textAlign:'center', lineHeight:1.5 }}>
        Configurações · Aparência<br/>
        <span style={{ fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.08em' }}>v1.0 · Dr. Fernando Azevedo</span>
      </div>
    </div>
  );
}

Object.assign(window, { AppearanceSettings, THEME_CATALOG });
