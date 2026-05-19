import { calculateSleepDiaryAverages, formatDuration } from '@diario-do-sono/core';
import type { PatientProfile, SleepDiaryEntry } from '../types';
import type { ReportType } from './pdfService';

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
  ) {
    a--;
  }
  return a;
}

function periodLabel(entries: SleepDiaryEntry[]): string {
  if (entries.length === 0) return '—';
  const sorted = [...entries].sort((a, b) => a.input.entryDate.localeCompare(b.input.entryDate));
  const first = dd(sorted[0].input.entryDate);
  const last = dd(sorted[sorted.length - 1].input.entryDate);
  return first === last ? first : `${first} – ${last}`;
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CSS = `
  @page { size: A4; margin: 14mm 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1a1a2e; background: white; }
  h2 { font-size: 13px; font-weight: 700; color: #1a1a2e; border-bottom: 2px solid #6D5DF6;
       padding-bottom: 5px; margin: 20px 0 12px; }
  .header { background: #080B1F; color: white; padding: 14px 18px; }
  .header-title { font-size: 22px; font-weight: 900; letter-spacing: 2px; }
  .header-sub { font-size: 10px; opacity: 0.65; letter-spacing: 1.5px; margin-top: 3px; }
  .header-patient { margin-top: 10px; display: flex; gap: 24px; font-size: 11px; }
  .header-patient span { opacity: 0.85; }
  .header-patient strong { opacity: 1; }

  .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .metric-card { background: #f0f2ff; border-radius: 8px; padding: 10px 8px; text-align: center; }
  .metric-val { font-size: 20px; font-weight: 900; color: #6D5DF6; line-height: 1.1; }
  .metric-lbl { font-size: 9px; color: #666; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.5px; }

  .isi-box { background: #fff8e8; border: 1px solid #F8C86A; border-radius: 8px;
             padding: 10px 14px; display: flex; align-items: center; gap: 12px; }
  .isi-score { font-size: 28px; font-weight: 900; color: #c8880a; }
  .isi-label { font-size: 11px; color: #7a5500; }
  .isi-interp { font-size: 10px; color: #9a6800; margin-top: 2px; }

  /* Charts */
  .chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .chart-box { }
  .chart-title { font-size: 10px; font-weight: 700; color: #444; margin-bottom: 5px; }
  .bar-row { display: flex; align-items: center; gap: 5px; margin-bottom: 3px; }
  .bar-date { width: 28px; font-size: 8px; color: #888; text-align: right; flex-shrink: 0; }
  .bar-track { flex: 1; height: 13px; background: #e8eaf6; border-radius: 3px; position: relative; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 3px; }
  .bar-ref { position: absolute; top: 0; bottom: 0; width: 1px; background: rgba(255,100,100,0.7); }
  .bar-val { width: 32px; font-size: 8px; color: #555; flex-shrink: 0; }

  /* Timeline */
  .timeline-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
  .tl-date { width: 30px; font-size: 8px; color: #888; text-align: right; flex-shrink: 0; }
  .tl-track { flex: 1; height: 14px; background: #e0e0e0; border-radius: 3px; overflow: hidden;
              display: flex; }
  .tl-seg { height: 100%; }
  .tl-eff { width: 34px; font-size: 8px; color: #555; text-align: right; flex-shrink: 0; }

  /* Table */
  table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
  thead tr { background: #080B1F; color: white; }
  th { padding: 5px 4px; text-align: center; font-weight: 700; }
  td { padding: 4px; text-align: center; border-bottom: 1px solid #eee; }
  tr:nth-child(even) td { background: #f8f9ff; }
  .eff-hi { color: #2a9d5c; font-weight: 700; }
  .eff-lo { color: #c0392b; font-weight: 700; }

  .legend { display: flex; gap: 12px; margin-top: 6px; flex-wrap: wrap; }
  .legend-item { display: flex; align-items: center; gap: 4px; font-size: 9px; color: #555; }
  .legend-dot { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }

  .footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #ddd;
            text-align: center; font-size: 9px; color: #aaa; }
  .page-break { page-break-after: always; }
`;

// ─── section builders ─────────────────────────────────────────────────────────

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

// ─── bar chart section ────────────────────────────────────────────────────────

interface ChartDef {
  title: string;
  color: string;
  refValue: number | null; // reference line value (max scale basis)
  maxValue: number;        // chart scale maximum
  getValue: (e: SleepDiaryEntry) => number;
  format: (v: number) => string;
}

const CHART_DEFS: ChartDef[] = [
  {
    title: 'Eficiência do sono (%)',
    color: '#3ECFB0',
    refValue: 85,
    maxValue: 100,
    getValue: (e) => e.metrics.sleepEfficiencyPercent,
    format: (v) => `${v}%`,
  },
  {
    title: 'TTS calculado',
    color: '#6D5DF6',
    refValue: 420,
    maxValue: 600,
    getValue: (e) => e.metrics.ttsCalculatedMinutes,
    format: formatDuration,
  },
  {
    title: 'Latência para dormir (min)',
    color: '#8B7FE8',
    refValue: 30,
    maxValue: 120,
    getValue: (e) => e.metrics.lisMinutes,
    format: (v) => `${v}'`,
  },
  {
    title: 'WASO (min)',
    color: '#FF8C42',
    refValue: 30,
    maxValue: 120,
    getValue: (e) => e.metrics.wasoMinutes,
    format: (v) => `${v}'`,
  },
];

function barChartHtml(entries: SleepDiaryEntry[]): string {
  const charts = CHART_DEFS.map((def) => {
    const rows = entries.slice(-14).map((e) => {
      const val = def.getValue(e);
      const pct = Math.min(100, Math.round((val / def.maxValue) * 100));
      return `
        <div class="bar-row">
          <span class="bar-date">${dd(e.input.entryDate)}</span>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%;background:${def.color}"></div>
            ${def.refValue !== null
              ? `<div class="bar-ref" style="left:${Math.min(100, Math.round((def.refValue / def.maxValue) * 100))}%"></div>`
              : ''}
          </div>
          <span class="bar-val">${def.format(val)}</span>
        </div>`;
    }).join('');
    return `<div class="chart-box"><div class="chart-title">${def.title}</div>${rows}</div>`;
  });
  return `<div class="chart-grid">${charts.join('')}</div>`;
}

// ─── timeline section ─────────────────────────────────────────────────────────

const RANGE_START = 18 * 60; // 18:00 in minutes from midnight
const RANGE_TOTAL = 20 * 60; // 20 hours (18:00 → 14:00)

function clockToMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function offsetFromRange(hhmm: string): number {
  let mins = clockToMin(hhmm);
  if (mins < RANGE_START) mins += 24 * 60;
  return mins - RANGE_START;
}

function timelineHtml(entries: SleepDiaryEntry[]): string {
  const SEG = { latency: '#8B7FE8', sleep: '#3ECFB0', waso: '#FF8C42', inertia: '#F8C86A', void: 'transparent' };

  const rows = entries.slice(-14).map((e) => {
    const { bedTime, sleepLatencyMinutes: lis, nightAwakeningsCount, wasoMinutes: waso,
            finalWakeTime, outOfBedLatencyMinutes: inertia } = e.input;

    const bedOffset  = Math.max(0, offsetFromRange(bedTime));
    const wakeOffset = Math.min(RANGE_TOTAL, offsetFromRange(finalWakeTime));

    const segs: Array<{ w: number; color: string }> = [];
    const pct = (m: number) => Math.max(0, Math.min(100, (m / RANGE_TOTAL) * 100)).toFixed(2);

    // void before bed
    if (bedOffset > 0) segs.push({ w: bedOffset, color: SEG.void });
    // latency
    const lisC = Math.min(lis, wakeOffset - bedOffset);
    if (lisC > 0) segs.push({ w: lisC, color: SEG.latency });
    // sleep / waso
    const sleepSpan = wakeOffset - bedOffset - lisC;
    if (sleepSpan > 0) {
      const capWaso = Math.min(waso, sleepSpan);
      if (nightAwakeningsCount > 0 && capWaso > 0) {
        const wasoEach = capWaso / nightAwakeningsCount;
        const netSleep = sleepSpan - capWaso;
        const seg = netSleep / (nightAwakeningsCount + 1);
        for (let i = 0; i < nightAwakeningsCount; i++) {
          if (seg > 0.5) segs.push({ w: seg, color: SEG.sleep });
          segs.push({ w: wasoEach, color: SEG.waso });
        }
        if (seg > 0.5) segs.push({ w: seg, color: SEG.sleep });
      } else {
        segs.push({ w: sleepSpan, color: SEG.sleep });
      }
    }
    // inertia
    const inertiaC = Math.min(inertia, RANGE_TOTAL - wakeOffset);
    if (inertiaC > 0) segs.push({ w: inertiaC, color: SEG.inertia });
    // void after
    const postOffset = RANGE_TOTAL - wakeOffset - inertiaC;
    if (postOffset > 0) segs.push({ w: postOffset, color: SEG.void });

    const segHtml = segs.map(s =>
      `<div class="tl-seg" style="width:${pct(s.w)}%;background:${s.color}"></div>`,
    ).join('');

    return `
      <div class="timeline-row">
        <span class="tl-date">${dd(e.input.entryDate)}</span>
        <div class="tl-track">${segHtml}</div>
        <span class="tl-eff">${e.metrics.sleepEfficiencyPercent}%</span>
      </div>`;
  }).join('');

  const legend = [
    { color: SEG.latency, label: 'Latência' },
    { color: SEG.sleep, label: 'Sono' },
    { color: SEG.waso, label: 'WASO' },
    { color: SEG.inertia, label: 'Inércia' },
  ];

  return rows + `<div class="legend">${legend.map(l =>
    `<div class="legend-item"><div class="legend-dot" style="background:${l.color}"></div>${l.label}</div>`,
  ).join('')}</div>`;
}

// ─── data table ───────────────────────────────────────────────────────────────

function dataTableHtml(entries: SleepDiaryEntry[]): string {
  const headers = ['Data', 'Deitar', 'Acordar', 'LIS', 'Despert.', 'WASO', 'TTS calc.', 'TTS perc.', 'Efic.'];
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
  // newest-first → reverse to chronological
  const chrono = [...entries].sort((a, b) => a.input.entryDate.localeCompare(b.input.entryDate));
  const avg = calculateSleepDiaryAverages(chrono.map(e => ({ input: e.input, metrics: e.metrics })));
  const patientAge = profile.birthDate ? `${age(profile.birthDate)} anos` : '';

  const body = `
    <div class="header">
      <div class="header-title">DIÁRIO DO SONO</div>
      <div class="header-sub">BY FERNANDO AZEVEDO · PNEUMOLOGIA E MEDICINA DO SONO</div>
      <div class="header-patient">
        <div><strong>${profile.name}</strong></div>
        ${patientAge ? `<div><span>${patientAge}</span></div>` : ''}
        <div><span>Período: ${periodLabel(chrono)}</span></div>
        <div><span>${chrono.length} ${chrono.length === 1 ? 'noite' : 'noites'}</span></div>
      </div>
    </div>

    <h2>Médias do período (${avg.daysCount} ${avg.daysCount === 1 ? 'noite' : 'noites'})</h2>
    ${metricsGrid(avg)}

    ${isiBlock(profile)}

    <h2>Evolução das métricas</h2>
    ${barChartHtml(chrono)}

    ${reportType === 'detailed' ? `
      <div class="page-break"></div>

      <h2>Linha do tempo do sono</h2>
      ${timelineHtml(chrono)}

      <h2>Registros detalhados</h2>
      ${dataTableHtml(chrono)}
    ` : ''}

    <div class="footer">Diário do Sono · By Fernando Azevedo · Pneumologia e Medicina do Sono · Gerado em ${new Date().toLocaleDateString('pt-BR')}</div>
  `;

  return `<!DOCTYPE html><html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><style>${CSS}</style></head>
<body>${body}</body>
</html>`;
}
