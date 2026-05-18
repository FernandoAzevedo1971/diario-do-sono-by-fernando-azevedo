// Main app — wires DesignCanvas + AndroidDevice + Tweaks
// NOCTURNE escolhido como direção definitiva. Refinado em today-nocturne-v2.jsx.
// Canvas:
//  1) "Nocturne · definitivo" — app ao vivo navegável (seletor de tema continua funcional)
//  2) "Telas · Nocturne V2" — 5 telas lado a lado
//  3) "Outras direções · referência" — Sereno V2 (cream) e Editorial (originais)

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "primary": "#A76BFA",
  "chartStyle": "bars",
  "heroFont": "instrument"
}/*EDITMODE-END*/;

// Resolve heroFont tweak key → CSS font-family stack (used for big sleep-time number)
window.HERO_FONTS = {
  instrument:  '"Instrument Serif", "Times New Roman", serif',
  newsreader:  'Newsreader, "Times New Roman", serif',
  bricolage:   '"Bricolage Grotesque", Inter, system-ui, sans-serif',
  mono:        '"JetBrains Mono", ui-monospace, monospace',
  fraunces:    'Fraunces, "Times New Roman", serif',
};
window.heroFontStack = (key) => window.HERO_FONTS[key] || window.HERO_FONTS.instrument;

// Renders the right Today variant for a given themeId.
// Nocturne now uses V2 refinado. Sereno escolhe V2 (cream) também.
function TodayByTheme({ themeId, tweaks, onNavigate, route, onThemeChange }) {
  if (themeId === 'sereno')    return <TodaySerenoV2   tweaks={tweaks} primary={tweaks.primary} chartStyle={tweaks.chartStyle} heroFont={tweaks.heroFont} onNavigate={onNavigate} route={route} onThemeChange={onThemeChange}/>;
  if (themeId === 'editorial') return <TodayEditorial   tweaks={tweaks} primary={tweaks.primary} chartStyle={tweaks.chartStyle} heroFont={tweaks.heroFont} onNavigate={onNavigate} route={route} onThemeChange={onThemeChange}/>;
  return <TodayNocturneV2 tweaks={tweaks} primary={tweaks.primary} chartStyle={tweaks.chartStyle} heroFont={tweaks.heroFont} onNavigate={onNavigate} route={route} onThemeChange={onThemeChange}/>;
}

const BG_BY_THEME = { nocturne:'#070914', sereno:'#F4F1EB', editorial:'#0C0C0E' };
const DARK_BY_THEME = { nocturne:true, sereno:false, editorial:true };

// Themes that handle their own internal route transitions (no parent scroll)
const SELF_SLIDING = { nocturne: true, sereno: true };

// ── Live artboard (theme switchable). Defaults to Nocturne V2. ──
function LiveAppArtboard({ tweaks, initialTheme='nocturne', initialRoute='today' }) {
  const [route, setRoute] = React.useState(initialRoute);
  const [themeId, setThemeId] = React.useState(initialTheme);
  const [flash, setFlash] = React.useState(false);

  const handleThemeChange = (id) => {
    if (id === themeId) return;
    setFlash(true);
    setThemeId(id);
    setTimeout(() => setFlash(false), 600);
    setTimeout(() => setRoute('today'), 250);
  };

  const selfSliding = SELF_SLIDING[themeId];

  return (
    <AndroidDevice width={412} height={892} dark={DARK_BY_THEME[themeId]}>
      <div style={{ width:'100%', height:'100%', background: BG_BY_THEME[themeId], overflow:'hidden', position:'relative' }}>
        {selfSliding ? (
          <TodayByTheme themeId={themeId} tweaks={tweaks} onNavigate={setRoute} route={route} onThemeChange={handleThemeChange}/>
        ) : (
          <div className="no-scrollbar" style={{ width:'100%', height:'100%', overflow:'auto' }}>
            <TodayByTheme themeId={themeId} tweaks={tweaks} onNavigate={setRoute} route={route} onThemeChange={handleThemeChange}/>
          </div>
        )}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          background: tweaks.primary, opacity: flash ? 0.18 : 0,
          transition: 'opacity 500ms ease',
        }}/>
      </div>
    </AndroidDevice>
  );
}

// ── Single-route artboard for showing one Nocturne V2 screen ──
function NocturneRouteArtboard({ tweaks, route }) {
  const [r, setR] = React.useState(route);
  return (
    <AndroidDevice width={412} height={892} dark={true}>
      <div style={{ width:'100%', height:'100%', background:'#070914', overflow:'hidden', position:'relative' }}>
        <TodayNocturneV2
          tweaks={tweaks}
          primary={tweaks.primary}
          chartStyle={tweaks.chartStyle}
          heroFont={tweaks.heroFont}
          route={r}
          onNavigate={setR}
          onThemeChange={()=>{}}
        />
      </div>
    </AndroidDevice>
  );
}

// ── Reference: Sereno V2 (cream) ──────────────────────────────
function SerenoV2Artboard({ tweaks }) {
  const [route, setRoute] = React.useState('today');
  return (
    <AndroidDevice width={412} height={892} dark={false}>
      <div style={{ width:'100%', height:'100%', background:'#F4F1EB', overflow:'hidden', position:'relative' }}>
        <TodaySerenoV2 tweaks={tweaks} primary={tweaks.primary} chartStyle={tweaks.chartStyle} heroFont={tweaks.heroFont} onNavigate={setRoute} route={route} onThemeChange={()=>{}}/>
      </div>
    </AndroidDevice>
  );
}

// ── Reference: Editorial (original) ───────────────────────────
function EditorialArtboard({ tweaks }) {
  const [route, setRoute] = React.useState('today');
  return (
    <AndroidDevice width={412} height={892} dark={true}>
      <div style={{ width:'100%', height:'100%', background:'#0C0C0E', overflow:'hidden' }}>
        <div className="no-scrollbar" style={{ width:'100%', height:'100%', overflow:'auto' }}>
          <TodayEditorial tweaks={tweaks} primary={tweaks.primary} chartStyle={tweaks.chartStyle} heroFont={tweaks.heroFont} onNavigate={setRoute} route={route}/>
        </div>
      </div>
    </AndroidDevice>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const palette = [
    '#A76BFA', // signature purple
    '#7CC9B4', // sage teal
    '#E8A86B', // warm amber
    '#6B9CFF', // soft blue
    '#FF9FB5', // dusk rose
  ];

  return (
    <>
      <DesignCanvas>
        <DCSection
          id="definitive"
          title="Nocturne · definitivo"
          subtitle="Wellness escuro. Hero carrossel (swipe + dots). Long-press na Eficiência abre breakdown. Transições slide+fade entre rotas. Stagger nos blocos. Lua e estrelas mantidas, mais discretas. Glow no primary."
        >
          <DCArtboard id="live-nocturne" label="App ao vivo · navegável" width={412} height={892}>
            <LiveAppArtboard tweaks={t} initialTheme="nocturne" initialRoute="today"/>
          </DCArtboard>
        </DCSection>

        <DCSection
          id="screens"
          title="Telas · Nocturne V2"
          subtitle="As mesmas telas em estados isolados. Continuam navegáveis dentro do frame."
        >
          <DCArtboard id="nv2-today" label="Today" width={412} height={892}>
            <NocturneRouteArtboard tweaks={t} route="today"/>
          </DCArtboard>
          <DCArtboard id="nv2-diary" label="Diário · wizard" width={412} height={892}>
            <NocturneRouteArtboard tweaks={t} route="diary"/>
          </DCArtboard>
          <DCArtboard id="nv2-history" label="Histórico" width={412} height={892}>
            <NocturneRouteArtboard tweaks={t} route="history"/>
          </DCArtboard>
          <DCArtboard id="nv2-igi" label="IGI" width={412} height={892}>
            <NocturneRouteArtboard tweaks={t} route="igi"/>
          </DCArtboard>
          <DCArtboard id="nv2-settings" label="Aparência" width={412} height={892}>
            <NocturneRouteArtboard tweaks={t} route="settings"/>
          </DCArtboard>
        </DCSection>

        <DCSection
          id="reference"
          title="Outras direções · referência"
          subtitle="Mantidas só para comparação. Não são mais o foco."
        >
          <DCArtboard id="sereno-ref" label="Sereno V2 (cream)" width={412} height={892}>
            <SerenoV2Artboard tweaks={t}/>
          </DCArtboard>
          <DCArtboard id="editorial-ref" label="Editorial (original)" width={412} height={892}>
            <EditorialArtboard tweaks={t}/>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Identidade visual">
          <TweakColor
            label="Cor primária"
            value={t.primary}
            options={palette}
            onChange={(v)=>setTweak('primary', v)}
          />
        </TweakSection>
        <TweakSection label="Visualização de dados">
          <TweakRadio
            label="Estilo do gráfico"
            value={t.chartStyle}
            options={[
              { value:'bars', label:'Barras' },
              { value:'line', label:'Linha' },
              { value:'circles', label:'Círculos' },
            ]}
            onChange={(v)=>setTweak('chartStyle', v)}
          />
        </TweakSection>
        <TweakSection label="Tipografia">
          <TweakSelect
            label="Fonte do tempo de sono"
            value={t.heroFont}
            options={[
              { value:'instrument', label:'Instrument Serif · refinada, alto contraste' },
              { value:'newsreader', label:'Newsreader · serifa editorial' },
              { value:'bricolage',  label:'Bricolage Grotesque · sans humanista' },
              { value:'mono',       label:'JetBrains Mono · clínica/dados' },
              { value:'fraunces',   label:'Fraunces · original' },
            ]}
            onChange={(v)=>setTweak('heroFont', v)}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
