// Shared UI helpers: charts in 3 styles, icons, sparkline.
// Charts read primaryColor + chartStyle from props so the Tweaks panel can drive them.

// ─────────────────────────────────────────────────────────────
// TrendChart — 7-day trend, 3 render styles
// data: array of {label, value} (value 0–100 already normalized)
// style: 'bars' | 'line' | 'circles'
// ─────────────────────────────────────────────────────────────
function TrendChart({ data, style = 'bars', primary = '#A78BFA', track = 'rgba(255,255,255,0.08)', textColor = 'rgba(255,255,255,0.55)', height = 110, todayIdx, glow = false }) {
  const W = 280, H = height;
  const padX = 14, padY = 18;
  const innerW = W - padX*2, innerH = H - padY*2;
  const step = innerW / (data.length - 1 || 1);
  const max = 100, min = 0;
  const yFor = v => padY + innerH - ((v - min)/(max - min)) * innerH;
  const todayI = todayIdx ?? data.length - 1;

  if (style === 'line') {
    // smooth line + area
    const pts = data.map((d,i) => [padX + i*step, yFor(d.value)]);
    const path = pts.map((p,i) => i===0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`).join(' ');
    const area = `${path} L${pts.at(-1)[0]},${H-padY} L${pts[0][0]},${H-padY} Z`;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display:'block', overflow:'visible' }}>
        <defs>
          <linearGradient id="lg-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={primary} stopOpacity="0.32" />
            <stop offset="100%" stopColor={primary} stopOpacity="0" />
          </linearGradient>
          {glow && <filter id="glow-line" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>}
        </defs>
        {/* baseline grid */}
        {[0,50,100].map(v => (
          <line key={v} x1={padX} x2={W-padX} y1={yFor(v)} y2={yFor(v)} stroke={track} strokeWidth="1" strokeDasharray={v===50?'2 4':''}/>
        ))}
        <path d={area} fill="url(#lg-area)" />
        <path d={path} stroke={primary} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" filter={glow?'url(#glow-line)':undefined}/>
        {pts.map((p,i) => (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r={i===todayI ? 5 : 3} fill={i===todayI ? primary : '#fff'} stroke={primary} strokeWidth="2" />
          </g>
        ))}
        {data.map((d,i) => (
          <text key={i} x={padX + i*step} y={H-2} fontSize="9" fill={textColor} textAnchor="middle" fontFamily="Inter">{d.label}</text>
        ))}
      </svg>
    );
  }

  if (style === 'circles') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display:'block', overflow:'visible' }}>
        <defs>
          {glow && <filter id="glow-c" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>}
        </defs>
        {data.map((d,i) => {
          const cx = padX + i*step;
          const radius = 6 + (d.value/100) * 14;
          const isToday = i===todayI;
          return (
            <g key={i}>
              <circle cx={cx} cy={H/2 - 6} r={20} fill="none" stroke={track} strokeWidth="1" />
              <circle cx={cx} cy={H/2 - 6} r={radius} fill={primary} fillOpacity={isToday?1:0.45} filter={isToday&&glow?'url(#glow-c)':undefined}/>
              {isToday && <circle cx={cx} cy={H/2 - 6} r={radius+4} fill="none" stroke={primary} strokeWidth="1.5"/>}
              <text x={cx} y={H-2} fontSize="9" fill={textColor} textAnchor="middle" fontFamily="Inter">{d.label}</text>
            </g>
          );
        })}
      </svg>
    );
  }

  // bars (default)
  const barW = Math.min(22, (innerW / data.length) - 6);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display:'block', overflow:'visible' }}>
      <defs>
        <linearGradient id="lg-bar" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={primary} stopOpacity="1" />
          <stop offset="100%" stopColor={primary} stopOpacity="0.55" />
        </linearGradient>
        {glow && <filter id="glow-b" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>}
      </defs>
      {[0,50,100].map(v => (
        <line key={v} x1={padX} x2={W-padX} y1={yFor(v)} y2={yFor(v)} stroke={track} strokeWidth="1" strokeDasharray={v===50?'2 4':''}/>
      ))}
      {data.map((d,i) => {
        const x = padX + i*step - barW/2;
        const y = yFor(d.value);
        const h = (H-padY) - y;
        const isToday = i===todayI;
        return (
          <g key={i}>
            <rect x={x} y={padY} width={barW} height={innerH} rx={barW/2} fill={track} />
            <rect x={x} y={y} width={barW} height={h} rx={barW/2} fill={isToday ? primary : 'url(#lg-bar)'} fillOpacity={isToday?1:0.7} filter={isToday&&glow?'url(#glow-b)':undefined}/>
            <text x={padX + i*step} y={H-2} fontSize="9" fill={textColor} textAnchor="middle" fontFamily="Inter">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Ring — efficiency ring with sweeping animation
// ─────────────────────────────────────────────────────────────
function Ring({ value=94, size=128, stroke=10, primary='#A78BFA', track='rgba(255,255,255,0.10)', label='Eficiência', sublabel, animated=true, glow=false }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [v, setV] = React.useState(animated ? 0 : value);
  React.useEffect(() => {
    if (!animated) { setV(value); return; }
    let raf, start;
    const dur = 1100;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1-p, 3);
      setV(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, animated]);
  const offset = c - (v/100) * c;
  return (
    <div style={{ position:'relative', width:size, height:size }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <defs>
          {glow && <filter id={`glowring-${primary.replace('#','')}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>}
        </defs>
        <circle cx={size/2} cy={size/2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={primary} strokeWidth={stroke} fill="none"
                strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
                filter={glow?`url(#glowring-${primary.replace('#','')})`:undefined}
                style={{ transition: 'stroke-dashoffset 200ms linear' }} />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center' }}>
        <div style={{ fontSize: size*0.28, fontWeight: 600, lineHeight:1, letterSpacing:'-0.02em' }}>{v}<span style={{ fontSize: size*0.13, fontWeight:500, opacity:0.7 }}>%</span></div>
        <div style={{ fontSize: 10, marginTop: 4, opacity:0.6, letterSpacing:'0.08em', textTransform:'uppercase' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 9, opacity:0.45, marginTop: 2 }}>{sublabel}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sparkline — tiny inline trend
// ─────────────────────────────────────────────────────────────
function Sparkline({ data, color='#A78BFA', width=64, height=22, fill=false }) {
  const pts = data.map((v,i) => [(i/(data.length-1)) * width, height - (v/100)*height]);
  const path = pts.map((p,i) => (i===0?'M':'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display:'block' }}>
      {fill && <path d={`${path} L${width},${height} L0,${height} Z`} fill={color} fillOpacity="0.18"/>}
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Simple inline icons (stroke-based)
// ─────────────────────────────────────────────────────────────
const Icon = {
  Moon: (p) => <svg viewBox="0 0 24 24" {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>,
  Sun: (p) => <svg viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  Flame: (p) => <svg viewBox="0 0 24 24" {...p}><path d="M12 3s4 4 4 8a4 4 0 0 1-8 0c0-2 1.5-3 2-4 0 0 1-1 2-4Zm0 18a6 6 0 0 0 6-6c0-3-2-5-2-5s-1 2-2 2c0 0-1-1-2-3-2 3-6 4-6 8a6 6 0 0 0 6 4Z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round"/></svg>,
  Bolt: (p) => <svg viewBox="0 0 24 24" {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/></svg>,
  Chart: (p) => <svg viewBox="0 0 24 24" {...p}><path d="M4 4v16h16M8 16v-5M12 16V8M16 16v-3" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg>,
  Plus: (p) => <svg viewBox="0 0 24 24" {...p}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  ArrowRight: (p) => <svg viewBox="0 0 24 24" {...p}><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Bell: (p) => <svg viewBox="0 0 24 24" {...p}><path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 8H4c0-2 2-3 2-8Zm4 12a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  User: (p) => <svg viewBox="0 0 24 24" {...p}><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg>,
  Home: (p) => <svg viewBox="0 0 24 24" {...p}><path d="M4 11 12 4l8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1Z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/></svg>,
  PDF: (p) => <svg viewBox="0 0 24 24" {...p}><path d="M7 3h7l5 5v13H7Z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/><path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.6" fill="none"/></svg>,
  Check: (p) => <svg viewBox="0 0 24 24" {...p}><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>,
  Sparkle: (p) => <svg viewBox="0 0 24 24" {...p}><path d="M12 3v6m0 6v6m-9-9h6m6 0h6M6 6l3 3m6 6 3 3M6 18l3-3m6-6 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/></svg>,
};

Object.assign(window, { TrendChart, Ring, Sparkline, Icon });
