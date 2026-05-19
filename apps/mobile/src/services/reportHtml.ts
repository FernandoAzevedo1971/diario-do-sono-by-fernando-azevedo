import { calculateSleepDiaryAverages, formatDuration } from '@diario-do-sono/core';
import type { PatientProfile, SleepDiaryEntry } from '../types';
import type { ReportType } from './pdfService';

// ─── constants ────────────────────────────────────────────────────────────────

// Chart window: 18:00 → 14:00 next day (20 hours = 1200 min)
const RANGE_START_H = 18;
const RANGE_TOTAL_MIN = 20 * 60;

// Axis ticks every 2 hours
const AXIS_TICKS = [18, 20, 22, 0, 2, 4, 6, 8, 10, 12, 14];

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
  // wrap midnight
  if (mins < RANGE_START_H * 60) mins += 24 * 60;
  return mins - RANGE_START_H * 60;
}

function pct(minutes: number): string {
  return `${Math.max(0, Math.min(100, (minutes / RANGE_TOTAL_MIN) * 100)).toFixed(3)}%`;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CSS = `
  @page { size: A4; margin: 12mm 14mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #1a1a2e; background: #fff; }
  h2 { font-size: 12px; font-weight: 700; color: #1a1a2e; border-bottom: 2px solid #6D5DF6;
       padding-bottom: 4px; margin: 16px 0 10px; }

  /* ── Header ── */
  .header { background: #080B1F; color: #fff; padding: 12px 16px; }
  .hdr-title { font-size: 20px; font-weight: 900; letter-spacing: 2px; }
  .hdr-sub { font-size: 9px; opacity: .6; letter-spacing: 1.5px; margin-top: 2px; }
  .hdr-row { display: flex; gap: 20px; margin-top: 8px; font-size: 10px; opacity: .9; }
  .hdr-row strong { font-weight: 700; }

  /* ── Metrics grid ── */
  .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
  .metric-card { background: #f0f2ff; border-radius: 7px; padding: 9px 7px; text-align: center; }
  .metric-val { font-size: 18px; font-weight: 900; color: #6D5DF6; line-height: 1; }
  .metric-lbl { font-size: 8px; color: #666; margin-top: 3px; text-transform: uppercase; letter-spacing: .4px; }

  /* ── ISI ── */
  .isi-box { background: #fff8e8; border: 1px solid #F8C86A; border-radius: 7px;
             padding: 9px 12px; display: flex; align-items: center; gap: 10px; }
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

  /* Axis row */
  .act-axis-spacer { height: 18px; flex-shrink: 0; } /* matches .act-date height */
  .act-axis { position: relative; height: 18px; flex-shrink: 0; }
  .act-tick { position: absolute; transform: translateX(-50%); font-size: 7.5px; color: #999; top: 3px; }
  .act-tick-line { position: absolute; top: 12px; bottom: 0; width: 1px; background: #ddd; }
  .act-stat-hdr { height: 18px; flex-shrink: 0; font-size: 7.5px; color: #999;
                  display: flex; align-items: flex-end; justify-content: center; padding-bottom: 2px;
                  font-weight: 700; }

  /* Date cell */
  .act-date { font-size: 7.5px; color: #777; text-align: right; padding-right: 4px;
              display: flex; align-items: center; justify-content: flex-end;
              border-bottom: 1px solid #f0f0f0; }

  /* Track cell */
  .act-track { position: relative; height: 18px; background: #ececec; flex-shrink: 0;
               border-bottom: 1px solid #f4f4f4; }
  .act-seg { position: absolute; top: 2px; bottom: 2px; }
  .act-grid { position: absolute; top: 0; bottom: 0; width: 1px; background: rgba(255,255,255,0.6); }

  /* Stats cells */
  .act-stat { height: 18px; flex-shrink: 0; font-size: 7.5px; color: #444;
              display: flex; align-items: center; justify-content: center;
              border-bottom: 1px solid #f0f0f0; }
  .eff-hi { color: #2a9d5c; font-weight: 700; }
  .eff-lo { color: #c0392b; font-weight: 700; }

  /* Legend */
  .legend { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }
  .legend-item { display: flex; align-items: center; gap: 4px; font-size: 8.5px; color: #555; }
  .legend-dot { width: 12px; height: 10px; border-radius: 2px; flex-shrink: 0; }

  /* Metric bar charts */
  .chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .chart-box { }
  .chart-title { font-size: 9.5px; font-weight: 700; color: #444; margin-bottom: 5px; }
  .bar-row { display: flex; align-items: center; gap: 4px; margin-bottom: 3px; }
  .bar-date { width: 26px; font-size: 7.5px; color: #888; text-align: right; flex-shrink: 0; }
  .bar-track { flex: 1; height: 12px; background: #e8eaf6; border-radius: 3px; position: relative; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 3px; }
  .bar-ref { position: absolute; top: 0; bottom: 0; width: 1.5px; background: rgba(220,50,50,.7); }
  .bar-val { width: 30px; font-size: 7.5px; color: #555; flex-shrink: 0; }

  /* Table */
  table { width: 100%; border-collapse: collapse; font-size: 9px; }
  thead tr { background: #080B1F; color: #fff; }
  th { padding: 5px 3px; text-align: center; font-weight: 700; }
  td { padding: 3px; text-align: center; border-bottom: 1px solid #eee; }
  tr:nth-child(even) td { background: #f8f9ff; }

  .page-break { page-break-after: always; }
  .footer { margin-top: 16px; padding-top: 7px; border-top: 1px solid #ddd;
            text-align: center; font-size: 8px; color: #aaa; }
`;

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
// Horizontal stacked bars, one per night, time axis 18:00→14:00

function buildSegments(e: SleepDiaryEntry): Array<{ left: number; width: number; color: string }> {
  const segs: Array<{ left: number; width: number; color: string }> = [];

  const bedOff  = clamp(offsetFromRange(e.input.bedTime), 0, RANGE_TOTAL_MIN);
  const wakeOff = clamp(offsetFromRange(e.input.finalWakeTime), 0, RANGE_TOTAL_MIN);
  const outOff  = clamp(wakeOff + e.input.outOfBedLatencyMinutes, 0, RANGE_TOTAL_MIN);

  const lis   = clamp(e.input.sleepLatencyMinutes, 0, wakeOff - bedOff);
  const inertia = clamp(e.input.outOfBedLatencyMinutes, 0, RANGE_TOTAL_MIN - wakeOff);

  // Latency (in bed, not sleeping)
  if (lis > 0) segs.push({ left: bedOff, width: lis, color: SEG_COLOR.latency });

  // Sleep / WASO interleaved
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

  // Inertia (awake in bed after final wake)
  if (inertia > 0) segs.push({ left: wakeOff, width: inertia, color: SEG_COLOR.inertia });

  // Time-in-bed outline (transparent, just for reference — skip, visual clutter)
  void outOff;

  return segs;
}

function actTimelineHtml(entries: SleepDiaryEntry[]): string {
  // Grid lines at each axis tick
  const gridLines = AXIS_TICKS.map((h) => {
    let mins = (h - RANGE_START_H) * 60;
    if (mins < 0) mins += 24 * 60;
    return `<div class="act-grid" style="left:${pct(mins)}"></div>`;
  }).join('');

  // Axis tick labels
  const ticks = AXIS_TICKS.map((h) => {
    let mins = (h - RANGE_START_H) * 60;
    if (mins < 0) mins += 24 * 60;
    const label = `${String(h).padStart(2, '0')}h`;
    return `<span class="act-tick" style="left:${pct(mins)}">${label}</span>
            <div class="act-tick-line" style="left:${pct(mins)}"></div>`;
  }).join('');

  // Stat column headers
  const statHeaders = ['Efic.', 'TTS', 'LIS', 'Desp.'].map(h =>
    `<div class="act-stat-col"><div class="act-stat-hdr">${h}</div></div>`,
  ).join('');

  // Rows
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

  // Axis header row (spans same layout)
  const axisRow = `
    <div class="act-layout">
      <div class="act-col-date"><div class="act-axis-spacer"></div></div>
      <div class="act-col-track"><div class="act-axis">${ticks}</div></div>
      <div class="act-col-stats">${statHeaders}</div>
    </div>`;

  // Legend
  const legend = [
    { color: SEG_COLOR.latency, label: 'Latência (em cama, sem dormir)' },
    { color: SEG_COLOR.sleep,   label: 'Sono' },
    { color: SEG_COLOR.waso,    label: 'Despertar noturno (WASO)' },
    { color: SEG_COLOR.inertia, label: 'Inércia (acordado, ainda na cama)' },
  ].map(l =>
    `<div class="legend-item"><div class="legend-dot" style="background:${l.color}"></div>${l.label}</div>`,
  ).join('');

  return `<div class="act-wrap">${axisRow}${rows}<div class="legend">${legend}</div></div>`;
}

// ─── metric trend bar charts ─────────────────────────────────────────────────

interface ChartDef {
  title: string;
  color: string;
  refValue: number | null;
  maxValue: number;
  getValue: (e: SleepDiaryEntry) => number;
  format: (v: number) => string;
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

// ─── data table ───────────────────────────────────────────────────────────────

function dataTableHtml(entries: SleepDiaryEntry[]): string {
  const headers = ['Data', 'Deitar', 'Acordar', 'LIS', 'Desp.', 'WASO', 'TTS calc.', 'TTS perc.', 'Efic.'];
  const thead = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
  const rows = entries.map((e) => {
    const eff = e.metrics.sleepEfficiencyPercent;
    const cls = eff >= 85 ? 'eff-hi' : eff < 75 ? 'eff-lo' : '';
    return `<tr>
      <td>${dd(e.input.entryDate)}</td>
      <td>${e.input.bedTime}</td>
      <td>${e.input.finalWakeTime}</td>
      <td>${e.input.sleepLatencyMinutes}'</td>
      <td>${e.input.nightAwakeningsCount}</td>
      <td>${e.input.wasoMinutes}'</td>
      <td>${formatDuration(e.metrics.ttsCalculatedMinutes)}</td>
      <td>${formatDuration(e.metrics.ttsPerceivedMinutes)}</td>
      <td class="${cls}">${eff}%</td>
    </tr>`;
  }).join('');
  return `<table>${thead}<tbody>${rows}</tbody></table>`;
}

// ─── public API ───────────────────────────────────────────────────────────────

export function buildReportHtml(
  profile: PatientProfile,
  entries: SleepDiaryEntry[],
  reportType: ReportType,
): string {
  // sort chronologically (oldest → newest)
  const chrono = [...entries].sort((a, b) => a.input.entryDate.localeCompare(b.input.entryDate));
  const avg = calculateSleepDiaryAverages(chrono.map(e => ({ input: e.input, metrics: e.metrics })));
  const patientAge = profile.birthDate ? `${age(profile.birthDate)} anos` : '';

  const body = `
    <div class="header">
      <div class="hdr-title">DIÁRIO DO SONO</div>
      <div class="hdr-sub">BY FERNANDO AZEVEDO · PNEUMOLOGIA E MEDICINA DO SONO</div>
      <div class="hdr-row">
        <div><strong>${profile.name}</strong></div>
        ${patientAge ? `<div>${patientAge}</div>` : ''}
        <div>Período: ${periodLabel(chrono)}</div>
        <div>${chrono.length} ${chrono.length === 1 ? 'noite' : 'noites'}</div>
      </div>
    </div>

    <h2>Médias do período (${avg.daysCount} ${avg.daysCount === 1 ? 'noite' : 'noites'})</h2>
    ${metricsGrid(avg)}

    ${isiBlock(profile)}

    <h2>Gráfico de actgrafia do sono</h2>
    ${actTimelineHtml(chrono)}

    <h2>Evolução das métricas</h2>
    ${barChartHtml(chrono)}

    ${reportType === 'detailed' ? `
      <div class="page-break"></div>
      <h2>Registros detalhados</h2>
      ${dataTableHtml(chrono)}
    ` : ''}

    <div class="footer">Diário do Sono · By Fernando Azevedo · Pneumologia e Medicina do Sono · ${new Date().toLocaleDateString('pt-BR')}</div>
  `;

  return `<!DOCTYPE html><html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${CSS}</style></head>
<body>${body}</body></html>`;
}
