import { calculateSleepDiaryAverages, formatDuration } from '@diario-do-sono/core';
import type { PatientProfile, SleepDiaryEntry } from '../types';
import type { ReportType } from './pdfService';

// ─── constants ────────────────────────────────────────────────────────────────

const RANGE_START_H   = 18;
const RANGE_TOTAL_MIN = 20 * 60;
const AXIS_TICKS      = [18, 20, 22, 0, 2, 4, 6, 8, 10, 12, 14];

const SEG_COLOR = {
  latency: '#8B7FE8',
  sleep:   '#3ECFB0',
  waso:    '#FF8C42',
  inertia: '#F8C86A',
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function dd(isoDate: string): string {
  const [, m, d] = isoDate.split('-');
  return `${d}/${m}`;
}

function age(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let a = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) a--;
  return a;
}

function periodLabel(entries: SleepDiaryEntry[]): string {
  if (entries.length === 0) return '—';
  const first = dd(entries[0].input.entryDate);
  const last  = dd(entries[entries.length - 1].input.entryDate);
  return first === last ? first : `${first} – ${last}`;
}

function clockToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function offsetFromRange(hhmm: string): number {
  let mins = clockToMinutes(hhmm);
  if (mins < RANGE_START_H * 60) mins += 24 * 60;
  return mins - RANGE_START_H * 60;
}

function pct(minutes: number): string {
  return `${Math.max(0, Math.min(100, (minutes / RANGE_TOTAL_MIN) * 100)).toFixed(3)}%`;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function fmtQuality(q: string | undefined | null): string {
  if (q === 'good') return 'Boa';
  if (q === 'regular') return 'Reg.';
  if (q === 'bad') return 'Ruim';
  return '—';
}

function fmtFeeling(f: string | undefined | null): string {
  if (f === 'rested') return 'Desc.';
  if (f === 'tired') return 'Cansado';
  if (f === 'sleepy') return 'Sonol.';
  return '—';
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CSS = `
  @page { size: A4; margin: 12mm 14mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #1a1a2e; background: #fff; }
  h2 { font-size: 12px; font-weight: 700; color: #1a1a2e; border-bottom: 2px solid #6D5DF6;
       padding-bottom: 4px; margin: 16px 0 10px; }

  /* ── Header ── */
  .header { background: #080B1F; color: #fff; padding: 12px 16px; margin-bottom: 4px; }
  .hdr-title { font-size: 20px; font-weight: 900; letter-spacing: 2px; }
  .hdr-sub { font-size: 9px; opacity: .6; letter-spacing: 1.5px; margin-top: 2px; }
  .hdr-row { display: flex; gap: 20px; margin-top: 8px; font-size: 10px; opacity: .9; }
  .hdr-row strong { font-weight: 700; }

  /* ── Transposed table ── */
  .trans-table { width: 100%; border-collapse: collapse; font-size: 8.5px; table-layout: fixed; }
  .trans-table thead tr { background: #080B1F; color: #fff; }
  .trans-table thead th { padding: 5px 3px; text-align: center; font-weight: 700; }
  .trans-table thead th:first-child { text-align: left; width: 26%; }
  .trans-table td { padding: 3.5px 4px; text-align: center; border-bottom: 1px solid #eee; }
  .param-lbl { text-align: left !important; color: #666; font-size: 8px; }
  .alt-row td { background: #f8f9ff; }
  .sec-hdr td { background: #d2f5f0; color: #1e8c78; font-size: 7.5px; font-weight: 800;
                letter-spacing: 0.6px; padding: 3px 6px; text-align: left !important; }
  .sec-calc td { background: #e6e4ff; color: #7060d8; }

  /* ── Metrics grid ── */
  .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
  .metric-card { background: #f0f2ff; border-radius: 7px; padding: 9px 7px; text-align: center; }
  .metric-val { font-size: 18px; font-weight: 900; color: #6D5DF6; line-height: 1; }
  .metric-lbl { font-size: 8px; color: #666; margin-top: 3px; text-transform: uppercase; letter-spacing: .4px; }

  /* ── ISI ── */
  .isi-box { background: #fff8e8; border: 1px solid #F8C86A; border-radius: 7px;
             padding: 9px 12px; display: flex; align-items: center; gap: 10px; margin-top: 10px; }
  .isi-score { font-size: 26px; font-weight: 900; color: #c8880a; }
  .isi-label { font-size: 10px; color: #7a5500; }
  .isi-interp { font-size: 9px; color: #9a6800; margin-top: 2px; }

  /* ── Actigraphy ── */
  .act-wrap { overflow: hidden; }
  .act-layout { display: flex; align-items: stretch; gap: 0; }
  .act-col-date { width: 30px; flex-shrink: 0; display: flex; flex-direction: column; }
  .act-col-track { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .act-col-stats { display: flex; flex-direction: row; }
  .act-stat-col { width: 30px; flex-shrink: 0; display: flex; flex-direction: column; text-align: center; }
  .act-axis-spacer { height: 18px; flex-shrink: 0; }
  .act-axis { position: relative; height: 18px; flex-shrink: 0; }
  .act-tick { position: absolute; transform: translateX(-50%); font-size: 7.5px; color: #999; top: 3px; }
  .act-tick-line { position: absolute; top: 12px; bottom: 0; width: 1px; background: #ddd; }
  .act-stat-hdr { height: 18px; flex-shrink: 0; font-size: 7.5px; color: #999;
                  display: flex; align-items: flex-end; justify-content: center; padding-bottom: 2px;
                  font-weight: 700; }
  .act-date { font-size: 7.5px; color: #777; text-align: right; padding-right: 4px;
              display: flex; align-items: center; justify-content: flex-end;
              border-bottom: 1px solid #f0f0f0; }
  .act-track { position: relative; height: 18px; background: #ececec; flex-shrink: 0;
               border-bottom: 1px solid #f4f4f4; }
  .act-seg { position: absolute; top: 2px; bottom: 2px; }
  .act-grid { position: absolute; top: 0; bottom: 0; width: 1px; background: rgba(255,255,255,0.6); }
  .act-stat { height: 18px; flex-shrink: 0; font-size: 7.5px; color: #444;
              display: flex; align-items: center; justify-content: center;
              border-bottom: 1px solid #f0f0f0; }
  .eff-hi { color: #2a9d5c; font-weight: 700; }
  .eff-lo { color: #c0392b; font-weight: 700; }
  .legend { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }
  .legend-item { display: flex; align-items: center; gap: 4px; font-size: 8.5px; color: #555; }
  .legend-dot { width: 12px; height: 10px; border-radius: 2px; flex-shrink: 0; }

  /* ── Metric bar charts ── */
  .chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .chart-box { }
  .chart-title { font-size: 9.5px; font-weight: 700; color: #444; margin-bottom: 5px; }
  .bar-row { display: flex; align-items: center; gap: 4px; margin-bottom: 3px; }
  .bar-date { width: 26px; font-size: 7.5px; color: #888; text-align: right; flex-shrink: 0; }
  .bar-track { flex: 1; height: 12px; background: #e8eaf6; border-radius: 3px; position: relative; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 3px; }
  .bar-ref { position: absolute; top: 0; bottom: 0; width: 1.5px; background: rgba(220,50,50,.7); }
  .bar-val { width: 30px; font-size: 7.5px; color: #555; flex-shrink: 0; }

  .page-break { page-break-after: always; }
  .footer { margin-top: 16px; padding-top: 7px; border-top: 1px solid #ddd;
            text-align: center; font-size: 8px; color: #aaa; }
`;

// ─── transposed data table ────────────────────────────────────────────────────

interface TransRow { label: string; getValue: (e: SleepDiaryEntry) => string; }

const INPUT_ROWS: TransRow[] = [
  { label: 'Hora deitar',    getValue: (e) => e.input.bedTime },
  { label: 'Latência (min)', getValue: (e) => String(e.input.sleepLatencyMinutes) },
  { label: 'Despertares',    getValue: (e) => String(e.input.nightAwakeningsCount) },
  { label: 'WASO (min)',     getValue: (e) => String(e.input.wasoMinutes) },
  { label: 'Hora acordar',   getValue: (e) => e.input.finalWakeTime },
  { label: 'Inércia (min)',  getValue: (e) => String(e.input.outOfBedLatencyMinutes) },
  { label: 'TTS percebido',  getValue: (e) => formatDuration(e.input.perceivedSleepMinutes) },
  { label: 'Qualidade sono', getValue: (e) => fmtQuality(e.input.sleepQuality) },
  { label: 'Ao acordar',     getValue: (e) => fmtFeeling(e.input.morningFeeling) },
  { label: 'Durante o dia',  getValue: (e) => fmtFeeling(e.input.daytimeFeeling) },
];

const CALC_ROWS: TransRow[] = [
  { label: 'Hora sair cama', getValue: (e) => e.metrics.outOfBedTime },
  { label: 'TTC',            getValue: (e) => formatDuration(e.metrics.ttcMinutes) },
  { label: 'TTS calculado',  getValue: (e) => formatDuration(e.metrics.ttsCalculatedMinutes) },
  { label: 'Eficiência',     getValue: (e) => `${e.metrics.sleepEfficiencyPercent}%` },
  { label: 'Fragmentação',   getValue: (e) => String(e.metrics.fragmentationCount) },
  { label: 'Dif. TTS',       getValue: (e) => {
    const d = e.metrics.perceivedCalculatedDiffMinutes;
    return d >= 0 ? `+${d}'` : `${d}'`;
  }},
];

function transposedTableHtml(entries: SleepDiaryEntry[]): string {
  const cols = entries.length;
  const heads = entries.map(e => `<th>${dd(e.input.entryDate)}</th>`).join('');

  function rows(defs: TransRow[], sectionCls: string): string {
    return defs.map((row, i) => {
      const cells = entries.map(e => `<td>${row.getValue(e)}</td>`).join('');
      const cls = i % 2 === 1 ? ' class="alt-row"' : '';
      return `<tr${cls}><td class="param-lbl">${row.label}</td>${cells}</tr>`;
    }).join('');
  }

  return `
    <table class="trans-table">
      <thead><tr><th>Parâmetro</th>${heads}</tr></thead>
      <tbody>
        <tr class="sec-hdr"><td colspan="${cols + 1}">ANOTADO</td></tr>
        ${rows(INPUT_ROWS, '')}
        <tr class="sec-hdr sec-calc"><td colspan="${cols + 1}">CALCULADO</td></tr>
        ${rows(CALC_ROWS, 'calc')}
      </tbody>
    </table>`;
}

function transposedTableSections(entries: SleepDiaryEntry[]): string {
  const chunks: SleepDiaryEntry[][] = [];
  for (let i = 0; i < entries.length; i += 7) chunks.push(entries.slice(i, i + 7));
  return chunks.map((chunk, ci) => `
    ${ci > 0 ? '<div class="page-break"></div>' : ''}
    <h2>Registros Diários · ${dd(chunk[0].input.entryDate)} – ${dd(chunk[chunk.length - 1].input.entryDate)}</h2>
    ${transposedTableHtml(chunk)}
  `).join('');
}

// ─── metrics grid ─────────────────────────────────────────────────────────────

function metricsGrid(avg: ReturnType<typeof calculateSleepDiaryAverages>): string {
  const cards = [
    { val: `${avg.sleepEfficiencyPercent}%`, lbl: 'Eficiência média' },
    { val: formatDuration(avg.ttsCalculatedMinutes), lbl: 'TTS calculado médio' },
    { val: formatDuration(avg.ttsPerceivedMinutes), lbl: 'TTS percebido médio' },
    { val: `${avg.lisMinutes} min`, lbl: 'Latência (LIS) média' },
    { val: `${avg.wasoMinutes} min`, lbl: 'WASO médio' },
    { val: String(avg.fragmentationCount), lbl: 'Despertares médios' },
  ];
  return `<div class="metrics-grid">${cards.map(c =>
    `<div class="metric-card"><div class="metric-val">${c.val}</div><div class="metric-lbl">${c.lbl}</div></div>`,
  ).join('')}</div>`;
}

// ─── ISI block ────────────────────────────────────────────────────────────────

function isiBlock(profile: PatientProfile): string {
  if (!profile.initialIsiScore && profile.initialIsiScore !== 0) return '';
  return `
    <h2>Índice de Gravidade de Insônia (IGI)</h2>
    <div class="isi-box">
      <div class="isi-score">${profile.initialIsiScore}</div>
      <div>
        <div class="isi-label">Pontuação IGI</div>
        <div class="isi-interp">${profile.initialIsiInterpretation ?? ''}</div>
      </div>
    </div>`;
}

// ─── actigraphy timeline ──────────────────────────────────────────────────────

function buildSegments(e: SleepDiaryEntry): Array<{ left: number; width: number; color: string }> {
  const segs: Array<{ left: number; width: number; color: string }> = [];

  const bedOff  = clamp(offsetFromRange(e.input.bedTime), 0, RANGE_TOTAL_MIN);
  const wakeOff = clamp(offsetFromRange(e.input.finalWakeTime), 0, RANGE_TOTAL_MIN);

  const lis     = clamp(e.input.sleepLatencyMinutes, 0, wakeOff - bedOff);
  const inertia = clamp(e.input.outOfBedLatencyMinutes, 0, RANGE_TOTAL_MIN - wakeOff);

  if (lis > 0) segs.push({ left: bedOff, width: lis, color: SEG_COLOR.latency });

  const sleepSpan = wakeOff - bedOff - lis;
  if (sleepSpan > 0) {
    const n = e.input.nightAwakeningsCount;
    const capWaso = clamp(e.input.wasoMinutes, 0, sleepSpan);
    if (n > 0 && capWaso > 0) {
      const wasoEach = capWaso / n;
      const netSleep = sleepSpan - capWaso;
      const seg = netSleep / (n + 1);
      let cur = bedOff + lis;
      for (let i = 0; i < n; i++) {
        if (seg > 0.5) { segs.push({ left: cur, width: seg, color: SEG_COLOR.sleep }); cur += seg; }
        segs.push({ left: cur, width: wasoEach, color: SEG_COLOR.waso }); cur += wasoEach;
      }
      if (seg > 0.5) segs.push({ left: cur, width: seg, color: SEG_COLOR.sleep });
    } else {
      segs.push({ left: bedOff + lis, width: sleepSpan, color: SEG_COLOR.sleep });
    }
  }

  if (inertia > 0) segs.push({ left: wakeOff, width: inertia, color: SEG_COLOR.inertia });

  return segs;
}

function actTimelineHtml(entries: SleepDiaryEntry[]): string {
  const gridLines = AXIS_TICKS.map((h) => {
    let mins = (h - RANGE_START_H) * 60;
    if (mins < 0) mins += 24 * 60;
    return `<div class="act-grid" style="left:${pct(mins)}"></div>`;
  }).join('');

  const ticks = AXIS_TICKS.map((h) => {
    let mins = (h - RANGE_START_H) * 60;
    if (mins < 0) mins += 24 * 60;
    const label = `${String(h).padStart(2, '0')}h`;
    return `<span class="act-tick" style="left:${pct(mins)}">${label}</span>
            <div class="act-tick-line" style="left:${pct(mins)}"></div>`;
  }).join('');

  const statHeaders = ['Efic.', 'TTS', 'LIS', 'Desp.'].map(h =>
    `<div class="act-stat-col"><div class="act-stat-hdr">${h}</div></div>`,
  ).join('');

  const rows = entries.map((e) => {
    const segs = buildSegments(e);
    const segHtml = segs.map(s =>
      `<div class="act-seg" style="left:${pct(s.left)};width:${pct(s.width)};background:${s.color}"></div>`,
    ).join('');
    const eff = e.metrics.sleepEfficiencyPercent;
    const effCls = eff >= 85 ? 'eff-hi' : eff < 75 ? 'eff-lo' : '';
    return `
      <div class="act-layout">
        <div class="act-col-date"><div class="act-date">${dd(e.input.entryDate)}</div></div>
        <div class="act-col-track"><div class="act-track">${gridLines}${segHtml}</div></div>
        <div class="act-col-stats">
          <div class="act-stat-col"><div class="act-stat ${effCls}">${eff}%</div></div>
          <div class="act-stat-col"><div class="act-stat">${formatDuration(e.metrics.ttsCalculatedMinutes)}</div></div>
          <div class="act-stat-col"><div class="act-stat">${e.metrics.lisMinutes}'</div></div>
          <div class="act-stat-col"><div class="act-stat">${e.input.nightAwakeningsCount}</div></div>
        </div>
      </div>`;
  }).join('');

  const axisRow = `
    <div class="act-layout">
      <div class="act-col-date"><div class="act-axis-spacer"></div></div>
      <div class="act-col-track"><div class="act-axis">${ticks}</div></div>
      <div class="act-col-stats">${statHeaders}</div>
    </div>`;

  const legend = [
    { color: SEG_COLOR.latency, label: 'Latência' },
    { color: SEG_COLOR.sleep,   label: 'Sono' },
    { color: SEG_COLOR.waso,    label: 'WASO' },
    { color: SEG_COLOR.inertia, label: 'Inércia' },
  ].map(l =>
    `<div class="legend-item"><div class="legend-dot" style="background:${l.color}"></div>${l.label}</div>`,
  ).join('');

  return `<div class="act-wrap">${axisRow}${rows}<div class="legend">${legend}</div></div>`;
}

// ─── metric trend bar charts ──────────────────────────────────────────────────

interface ChartDef {
  title: string; color: string; refValue: number | null;
  maxValue: number; getValue: (e: SleepDiaryEntry) => number; format: (v: number) => string;
}

const CHART_DEFS: ChartDef[] = [
  { title: 'Eficiência (%)', color: '#3ECFB0', refValue: 85,  maxValue: 100, getValue: e => e.metrics.sleepEfficiencyPercent, format: v => `${v}%` },
  { title: 'TTS calculado',  color: '#6D5DF6', refValue: 420, maxValue: 600, getValue: e => e.metrics.ttsCalculatedMinutes,   format: formatDuration },
  { title: 'Latência (min)', color: '#8B7FE8', refValue: 30,  maxValue: 120, getValue: e => e.metrics.lisMinutes,             format: v => `${v}'` },
  { title: 'WASO (min)',     color: '#FF8C42', refValue: 30,  maxValue: 120, getValue: e => e.metrics.wasoMinutes,            format: v => `${v}'` },
];

function barChartHtml(entries: SleepDiaryEntry[]): string {
  const last14 = entries.slice(-14);
  const charts = CHART_DEFS.map((def) => {
    const rows = last14.map((e) => {
      const val  = def.getValue(e);
      const fill = Math.min(100, (val / def.maxValue) * 100).toFixed(1);
      const ref  = def.refValue !== null
        ? `<div class="bar-ref" style="left:${Math.min(100, (def.refValue / def.maxValue) * 100).toFixed(1)}%"></div>`
        : '';
      return `<div class="bar-row">
        <span class="bar-date">${dd(e.input.entryDate)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${fill}%;background:${def.color}"></div>${ref}</div>
        <span class="bar-val">${def.format(val)}</span>
      </div>`;
    }).join('');
    return `<div class="chart-box"><div class="chart-title">${def.title}</div>${rows}</div>`;
  });
  return `<div class="chart-grid">${charts.join('')}</div>`;
}

// ─── public API ───────────────────────────────────────────────────────────────

function headerBlock(profile: PatientProfile, chrono: SleepDiaryEntry[], patientAge: string): string {
  return `
    <div class="header">
      <div class="hdr-title">DIÁRIO DO SONO</div>
      <div class="hdr-sub">BY FERNANDO AZEVEDO · PNEUMOLOGIA E MEDICINA DO SONO</div>
      <div class="hdr-row">
        <div><strong>${profile.name}</strong></div>
        ${patientAge ? `<div>${patientAge}</div>` : ''}
        <div>Período: ${periodLabel(chrono)}</div>
        <div>${chrono.length} ${chrono.length === 1 ? 'noite' : 'noites'}</div>
      </div>
    </div>`;
}

export function buildReportHtml(
  profile: PatientProfile,
  entries: SleepDiaryEntry[],
  reportType: ReportType,
): string {
  const chrono = [...entries].sort((a, b) => a.input.entryDate.localeCompare(b.input.entryDate));
  const avg = calculateSleepDiaryAverages(chrono.map(e => ({ input: e.input, metrics: e.metrics })));
  const patientAge = profile.birthDate ? `${age(profile.birthDate)} anos` : '';

  const footer = `<div class="footer">Diário do Sono · By Fernando Azevedo · Pneumologia e Medicina do Sono · ${new Date().toLocaleDateString('pt-BR')}</div>`;

  let body: string;

  if (reportType === 'consolidated') {
    // Pág 1 — médias + paciente + IGI
    // Pág 2 — actigrafia
    body = `
      ${headerBlock(profile, chrono, patientAge)}
      <h2>Médias do período (${avg.daysCount} ${avg.daysCount === 1 ? 'noite' : 'noites'})</h2>
      ${metricsGrid(avg)}
      ${isiBlock(profile)}

      <div class="page-break"></div>

      <h2>Linha do Tempo do Sono</h2>
      ${actTimelineHtml(chrono)}

      ${footer}
    `;
  } else {
    // Pág 1+ — tabela transposta
    // Pág n+1 — actigrafia
    // Pág n+2 — médias
    // Pág n+3 — gráficos de evolução
    body = `
      ${transposedTableSections(chrono)}

      <div class="page-break"></div>

      <h2>Linha do Tempo do Sono</h2>
      ${actTimelineHtml(chrono)}

      <div class="page-break"></div>

      ${headerBlock(profile, chrono, patientAge)}
      <h2>Médias do período (${avg.daysCount} ${avg.daysCount === 1 ? 'noite' : 'noites'})</h2>
      ${metricsGrid(avg)}
      ${isiBlock(profile)}

      <div class="page-break"></div>

      <h2>Evolução das métricas</h2>
      ${barChartHtml(chrono)}

      ${footer}
    `;
  }

  return `<!DOCTYPE html><html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${CSS}</style></head>
<body>${body}</body></html>`;
}
