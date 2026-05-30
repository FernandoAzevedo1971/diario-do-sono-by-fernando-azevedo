import { calculateSleepDiaryAverages, formatDuration, minutesBetweenClockTimes } from '@diario-do-sono/core';
import type { AwakeningDetail } from '@diario-do-sono/core';
import type { PatientProfile, SleepDiaryEntry } from '../types';

// ─── page constants ───────────────────────────────────────────────────────────

const PAGE_W  = 210;
const PAGE_H  = 297;
const MARGIN  = 15;
const CONTENT_W = PAGE_W - MARGIN * 2;

// Actigraphy window: 18:00 → 14:00 next day
const RANGE_START_HOUR  = 18;
const RANGE_TOTAL_MINUTES = 20 * 60;

// Transposed table dimensions (mm)
const TLAB_W      = 44;   // label column width
const TCOL_W      = 19;   // day column width (7 days → 133 mm; 44+133=177 < 180 ✓)
const TROW_H      = 6.5;  // data row height
const TSEC_H      = 5;    // section-header row height
const DAYS_PER_PAGE = 7;

// ─── colours ─────────────────────────────────────────────────────────────────

const SEG_COLOR = {
  latency: [139, 127, 232] as [number, number, number],
  sleep:   [62,  207, 176] as [number, number, number],
  waso:    [255, 140,  66] as [number, number, number],
  inertia: [248, 200, 106] as [number, number, number],
};

const C = {
  navy:       [8,   11,  31]  as [number, number, number],
  white:      [255, 255, 255] as [number, number, number],
  lightGray:  [184, 190, 218] as [number, number, number],
  metricBg:   [240, 242, 255] as [number, number, number],
  metricText: [30,  30,  60]  as [number, number, number],
  labelGray:  [120, 120, 150] as [number, number, number],
  darkText:   [20,  20,  50]  as [number, number, number],
  rowAlt:     [248, 249, 255] as [number, number, number],
  chartBg:    [248, 249, 255] as [number, number, number],
  refLine:    [200, 200, 220] as [number, number, number],
  inputSec:   [210, 245, 240] as [number, number, number],
  calcSec:    [230, 228, 255] as [number, number, number],
  inputText:  [30,  140, 120] as [number, number, number],
  calcText:   [113, 96,  216] as [number, number, number],
};

// ─── jsPDF wrapper types ──────────────────────────────────────────────────────

interface JsPDFInstance {
  setFillColor(r: number, g: number, b: number): void;
  setDrawColor(r: number, g: number, b: number): void;
  setTextColor(r: number, g: number, b: number): void;
  setFont(font: string, style: string): void;
  setFontSize(size: number): void;
  setLineWidth(width: number): void;
  setLineDash(dash: number[], phase?: number): void;
  rect(x: number, y: number, w: number, h: number, style?: string): void;
  roundedRect(x: number, y: number, w: number, h: number, rx: number, ry: number, style?: string): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  text(text: string, x: number, y: number, options?: { align?: string; maxWidth?: number }): void;
  addPage(): void;
  getNumberOfPages(): number;
  setPage(page: number): void;
  internal: { pageSize: { getWidth(): number; getHeight(): number } };
}

// ─── segment def ─────────────────────────────────────────────────────────────

interface SegmentDef {
  key: string;
  flex: number;
  color: [number, number, number] | null;
}

// ─── day slot (for gap-aware iteration) ──────────────────────────────────────

interface DaySlot { date: string; entry: SleepDiaryEntry | null; }

function buildDaySlots(entries: SleepDiaryEntry[]): DaySlot[] {
  if (entries.length === 0) return [];
  const byDate = new Map(entries.map(e => [e.input.entryDate, e]));
  const dates = [...byDate.keys()].sort();
  const start = new Date(dates[0] + 'T12:00:00Z');
  const end   = new Date(dates[dates.length - 1] + 'T12:00:00Z');
  const slots: DaySlot[] = [];
  for (const cur = new Date(start); cur <= end; cur.setUTCDate(cur.getUTCDate() + 1)) {
    const iso = cur.toISOString().slice(0, 10);
    slots.push({ date: iso, entry: byDate.get(iso) ?? null });
  }
  return slots;
}

// ─── transposed row defs ──────────────────────────────────────────────────────

interface TransRowDef {
  label: string;
  getValue: (e: SleepDiaryEntry) => string;
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

function truncate(text: string | null | undefined, maxLen: number): string {
  if (!text?.trim()) return '—';
  const t = text.trim();
  return t.length > maxLen ? t.slice(0, maxLen - 1) + '…' : t;
}

const TRANS_INPUT_ROWS: TransRowDef[] = [
  { label: 'Hora deitar',    getValue: (e) => e.input.bedTime },
  { label: 'Latência (min)', getValue: (e) => String(e.input.sleepLatencyMinutes) },
  { label: 'Despertares',    getValue: (e) => String(e.input.nightAwakeningsCount) },
  { label: 'WASO (min)',     getValue: (e) => String(e.input.wasoMinutes) },
  { label: 'Hora acordar',   getValue: (e) => e.input.finalWakeTime },
  { label: 'Inércia (min)',  getValue: (e) => String(e.input.outOfBedLatencyMinutes) },
  { label: 'TTS percebido',  getValue: (e) => formatDuration(Math.round(e.input.perceivedSleepMinutes)) },
  { label: 'Qualidade sono', getValue: (e) => fmtQuality(e.input.sleepQuality) },
  { label: 'Ao acordar',     getValue: (e) => fmtFeeling(e.input.morningFeeling) },
  { label: 'Durante o dia',  getValue: (e) => fmtFeeling(e.input.daytimeFeeling) },
  { label: 'Medicação sono', getValue: (e) => {
    const m = e.input.sleepMedication;
    if (!m?.used) return '—';
    return truncate([m.name, m.dose].filter(Boolean).join(' ') || 'Sim', 18);
  }},
  { label: 'Obs. noite',    getValue: (e) => truncate(e.input.nightObservations, 18) },
  { label: 'Obs. dia',      getValue: (e) => truncate(e.input.dayObservations, 18) },
];

const TRANS_CALC_ROWS: TransRowDef[] = [
  { label: 'Hora sair cama', getValue: (e) => e.metrics.outOfBedTime },
  { label: 'TTC',            getValue: (e) => formatDuration(e.metrics.ttcMinutes) },
  { label: 'TTS calculado',  getValue: (e) => formatDuration(e.metrics.ttsCalculatedMinutes) },
  { label: 'Eficiência',     getValue: (e) => `${Math.round(e.metrics.sleepEfficiencyPercent)}%` },
  { label: 'Fragmentação',   getValue: (e) => String(e.metrics.fragmentationCount) },
  { label: 'Dif. TTS',       getValue: (e) => {
    const d = e.metrics.perceivedCalculatedDiffMinutes;
    return d >= 0 ? `+${d}'` : `${d}'`;
  }},
];

// ─── helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function offsetFromRangeStart(clockTime: string): number {
  const rangeStart = `${String(RANGE_START_HOUR).padStart(2, '0')}:00`;
  return minutesBetweenClockTimes(rangeStart, clockTime);
}

function buildSegments(
  bedOffset: number,
  lisMinutes: number,
  nightAwakeningsCount: number,
  wasoMinutes: number,
  finalWakeOffset: number,
  outOfBedLatencyMinutes: number,
  outOfBedOffset: number,
  awakeningDetails?: AwakeningDetail[] | null,
): SegmentDef[] {
  const segs: SegmentDef[] = [];

  const preBed = clamp(bedOffset, 0, RANGE_TOTAL_MINUTES);
  if (preBed > 0) segs.push({ key: 'void-pre', flex: preBed, color: null });

  const lis = clamp(lisMinutes, 0, RANGE_TOTAL_MINUTES);
  if (lis > 0) segs.push({ key: 'lis', flex: lis, color: SEG_COLOR.latency });

  const sleepPeriod = clamp(finalWakeOffset - bedOffset - lis, 0, RANGE_TOTAL_MINUTES);
  if (sleepPeriod > 0) {
    const hasExactTimes = awakeningDetails && awakeningDetails.length > 0 && awakeningDetails.every(a => a.time);
    if (hasExactTimes) {
      const sorted = [...awakeningDetails!].sort(
        (a, b) => offsetFromRangeStart(a.time!) - offsetFromRangeStart(b.time!),
      );
      const eachWaso = wasoMinutes / sorted.length;
      let cursor = bedOffset + lis;
      sorted.forEach((awk, i) => {
        const awkOff = clamp(offsetFromRangeStart(awk.time!), cursor, finalWakeOffset);
        const dur = clamp(awk.durationMinutes ?? eachWaso, 1, finalWakeOffset - awkOff);
        if (awkOff - cursor > 0.5) segs.push({ key: `sleep-${i}`, flex: awkOff - cursor, color: SEG_COLOR.sleep });
        segs.push({ key: `waso-${i}`, flex: dur, color: null });
        cursor = awkOff + dur;
      });
      if (finalWakeOffset - cursor > 0.5) segs.push({ key: 'sleep-last', flex: finalWakeOffset - cursor, color: SEG_COLOR.sleep });
    } else {
      const capWaso = clamp(wasoMinutes, 0, sleepPeriod);
      if (nightAwakeningsCount > 0 && capWaso > 0) {
        const wasoEach = capWaso / nightAwakeningsCount;
        const netSleep = sleepPeriod - capWaso;
        const seg = netSleep / (nightAwakeningsCount + 1);
        for (let i = 0; i < nightAwakeningsCount; i++) {
          if (seg > 0.5) segs.push({ key: `sleep-${i}`, flex: seg, color: SEG_COLOR.sleep });
          segs.push({ key: `waso-${i}`, flex: wasoEach, color: null });
        }
        if (seg > 0.5) segs.push({ key: 'sleep-last', flex: seg, color: SEG_COLOR.sleep });
      } else {
        segs.push({ key: 'sleep', flex: sleepPeriod, color: SEG_COLOR.sleep });
      }
    }
  }

  const inertia = clamp(outOfBedLatencyMinutes, 0, RANGE_TOTAL_MINUTES);
  if (inertia > 0) segs.push({ key: 'inertia', flex: inertia, color: SEG_COLOR.inertia });

  const postBed = RANGE_TOTAL_MINUTES - outOfBedOffset;
  if (postBed > 0) segs.push({ key: 'void-post', flex: postBed, color: null });

  return segs;
}

function formatDateDDMM(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return `${day}/${month}`;
}

function formatDateRange(entries: SleepDiaryEntry[]): string {
  if (entries.length === 0) return '—';
  const sorted = [...entries].sort((a, b) => a.input.entryDate.localeCompare(b.input.entryDate));
  const first = sorted[0].input.entryDate;
  const last = sorted[sorted.length - 1].input.entryDate;
  if (first === last) return formatDateDDMM(first);
  return `${formatDateDDMM(first)} – ${formatDateDDMM(last)}`;
}

// ─── drawing primitives ───────────────────────────────────────────────────────

function setFill(doc: JsPDFInstance, rgb: [number, number, number]): void {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}

function setDraw(doc: JsPDFInstance, rgb: [number, number, number]): void {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}

function setTextColor(doc: JsPDFInstance, rgb: [number, number, number]): void {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function drawFooter(doc: JsPDFInstance, pageNum: number): void {
  const y = PAGE_H - 8;
  doc.setLineWidth(0.2);
  setDraw(doc, C.lightGray);
  doc.line(MARGIN, y - 3, PAGE_W - MARGIN, y - 3);
  doc.setFontSize(8);
  setTextColor(doc, C.labelGray);
  doc.setFont('helvetica', 'normal');
  doc.text('By Fernando Azevedo · Pneumologia e Medicina do Sono', PAGE_W / 2, y, { align: 'center' });
  doc.text(String(pageNum), PAGE_W - MARGIN, y, { align: 'right' });
}

function sectionHeader(doc: JsPDFInstance, title: string, x: number, y: number): void {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  setTextColor(doc, C.darkText);
  doc.text(title, x, y);
  doc.setLineWidth(0.5);
  setDraw(doc, SEG_COLOR.latency);
  doc.line(x, y + 1.5, x + CONTENT_W, y + 1.5);
}

// ─── page 1+: transposed data table ──────────────────────────────────────────

function drawSingleTransposedTable(
  doc: JsPDFInstance,
  entries: SleepDiaryEntry[],  // 1..DAYS_PER_PAGE entries
  pageNum: number,
): void {
  const n = entries.length;
  const tableW = TLAB_W + n * TCOL_W;
  let y = MARGIN;

  sectionHeader(doc, 'REGISTROS DIÁRIOS', MARGIN, y);
  y += 8;

  // Date header row
  setFill(doc, C.navy);
  doc.rect(MARGIN, y, tableW, TROW_H, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  setTextColor(doc, C.white);
  doc.text('Parâmetro', MARGIN + 3, y + TROW_H * 0.66);
  for (let i = 0; i < n; i++) {
    const cx = MARGIN + TLAB_W + i * TCOL_W + TCOL_W / 2;
    doc.text(formatDateDDMM(entries[i].input.entryDate), cx, y + TROW_H * 0.66, { align: 'center' });
  }
  y += TROW_H;

  function drawSectionTag(label: string, bgColor: [number, number, number], textColor: [number, number, number]): void {
    setFill(doc, bgColor);
    doc.rect(MARGIN, y, tableW, TSEC_H, 'F');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    setTextColor(doc, textColor);
    doc.text(label, MARGIN + 3, y + TSEC_H * 0.72);
  }

  function drawDataRows(rows: TransRowDef[]): void {
    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri];
      if (ri % 2 === 1) {
        setFill(doc, C.rowAlt);
        doc.rect(MARGIN, y, tableW, TROW_H, 'F');
      }
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      setTextColor(doc, C.labelGray);
      doc.text(row.label, MARGIN + 3, y + TROW_H * 0.66);
      setTextColor(doc, C.darkText);
      for (let i = 0; i < n; i++) {
        const cx = MARGIN + TLAB_W + i * TCOL_W + TCOL_W / 2;
        doc.text(row.getValue(entries[i]), cx, y + TROW_H * 0.66, { align: 'center' });
      }
      setDraw(doc, [220, 222, 240] as [number, number, number]);
      doc.setLineWidth(0.1);
      doc.line(MARGIN, y + TROW_H, MARGIN + tableW, y + TROW_H);
      y += TROW_H;
    }
  }

  drawSectionTag('ANOTADO', C.inputSec, C.inputText);
  y += TSEC_H;
  drawDataRows(TRANS_INPUT_ROWS);

  drawSectionTag('CALCULADO', C.calcSec, C.calcText);
  y += TSEC_H;
  drawDataRows(TRANS_CALC_ROWS);

  drawFooter(doc, pageNum);
}

// ─── actigraphy timeline page ─────────────────────────────────────────────────

function drawTimelinePage(
  doc: JsPDFInstance,
  chronological: SleepDiaryEntry[],
  pageNum: number,
): void {
  let y = MARGIN;

  sectionHeader(doc, 'LINHA DO TEMPO DO SONO', MARGIN, y);
  y += 8;

  const hourLabels  = ['20h', '22h', '00h', '02h', '04h', '06h', '08h', '10h', '12h'];
  const hourOffsets = [120, 240, 360, 480, 600, 720, 840, 960, 1080];

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  setTextColor(doc, C.labelGray);
  for (let i = 0; i < hourLabels.length; i++) {
    const ratio = hourOffsets[i] / RANGE_TOTAL_MINUTES;
    const x = MARGIN + 14 + ratio * (CONTENT_W - 30);
    doc.text(hourLabels[i], x, y, { align: 'center' });
  }
  y += 4;

  const BAR_H    = 7;
  const ROW_GAP  = 3;
  const DATE_W   = 14;
  const EFF_W    = 12;
  const BAR_AREA_W = CONTENT_W - DATE_W - EFF_W - 4;
  const BAR_X    = MARGIN + DATE_W + 2;

  let currentPage = pageNum;

  const timelineSlots = buildDaySlots(chronological);
  for (const { date, entry } of timelineSlots) {
    if (y + BAR_H + ROW_GAP > PAGE_H - 30) {
      drawFooter(doc, currentPage);
      doc.addPage();
      currentPage += 1;
      y = MARGIN;
      sectionHeader(doc, 'LINHA DO TEMPO DO SONO (cont.)', MARGIN, y);
      y += 8;
    }

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    setTextColor(doc, entry ? C.darkText : C.labelGray);
    doc.text(formatDateDDMM(date), MARGIN, y + BAR_H * 0.7);

    if (entry === null) {
      setFill(doc, [242, 242, 246] as [number, number, number]);
      doc.setLineWidth(0.1);
      doc.rect(BAR_X, y, BAR_AREA_W, BAR_H, 'F');
      doc.setFontSize(5.5);
      setTextColor(doc, [185, 185, 195] as [number, number, number]);
      doc.text('NÃO PREENCHIDO', BAR_X + 4, y + BAR_H * 0.68);
      doc.setFontSize(7);
      setTextColor(doc, C.labelGray);
      doc.text('—', BAR_X + BAR_AREA_W + 2, y + BAR_H * 0.75);
    } else {
      setFill(doc, [230, 230, 240] as [number, number, number]);
      doc.setLineWidth(0.1);
      doc.rect(BAR_X, y, BAR_AREA_W, BAR_H, 'F');

      const bedOffset    = clamp(offsetFromRangeStart(entry.input.bedTime), 0, RANGE_TOTAL_MINUTES);
      const wakeOffset   = clamp(offsetFromRangeStart(entry.input.finalWakeTime), 0, RANGE_TOTAL_MINUTES);
      const outOfBedOffset = clamp(offsetFromRangeStart(entry.metrics.outOfBedTime), 0, RANGE_TOTAL_MINUTES);

      const segments = buildSegments(
        bedOffset, entry.input.sleepLatencyMinutes, entry.input.nightAwakeningsCount,
        entry.input.wasoMinutes, wakeOffset, entry.input.outOfBedLatencyMinutes, outOfBedOffset,
        entry.input.awakeningDetails,
      );

      let totalFlex = segments.reduce((s, sg) => s + sg.flex, 0);
      if (totalFlex === 0) totalFlex = 1;
      let segX = BAR_X;
      for (const seg of segments) {
        const segW = (seg.flex / totalFlex) * BAR_AREA_W;
        if (seg.color !== null) {
          setFill(doc, seg.color);
          doc.rect(segX, y, segW, BAR_H, 'F');
        }
        segX += segW;
      }

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      setTextColor(doc, C.darkText);
      doc.text(`${Math.round(entry.metrics.sleepEfficiencyPercent)}%`, BAR_X + BAR_AREA_W + 2, y + BAR_H * 0.75);
    }

    y += BAR_H + ROW_GAP;
  }

  y += 4;
  const legendItems: Array<{ color: [number, number, number]; label: string }> = [
    { color: SEG_COLOR.latency,               label: 'Latência' },
    { color: SEG_COLOR.sleep,                 label: 'Sono' },
    { color: [210, 210, 220] as [number, number, number], label: 'Acordado' },
    { color: SEG_COLOR.inertia,               label: 'Inércia' },
  ];
  let lx = MARGIN;
  for (const item of legendItems) {
    setFill(doc, item.color);
    doc.rect(lx, y, 5, 4, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    setTextColor(doc, C.labelGray);
    doc.text(item.label, lx + 7, y + 3.5);
    lx += 32;
  }

  drawFooter(doc, currentPage);
}

// ─── averages page (page 3) ───────────────────────────────────────────────────

function drawAveragesPage(
  doc: JsPDFInstance,
  profile: PatientProfile,
  entries: SleepDiaryEntry[],
  averages: ReturnType<typeof calculateSleepDiaryAverages>,
): void {
  // Header band
  setFill(doc, C.navy);
  doc.rect(0, 0, PAGE_W, 38, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  setTextColor(doc, C.white);
  doc.text('DIÁRIO DO SONO', PAGE_W / 2, 18, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setTextColor(doc, C.lightGray);
  doc.text('Relatório Clínico do Sono', PAGE_W / 2, 23, { align: 'center' });

  let y = 52;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  setTextColor(doc, C.labelGray);
  doc.text('Paciente:', MARGIN, y);
  doc.setFont('helvetica', 'bold');
  setTextColor(doc, C.darkText);
  doc.text(profile.name, MARGIN + 28, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  setTextColor(doc, C.labelGray);
  doc.text('Período:', MARGIN, y);
  setTextColor(doc, C.darkText);
  doc.text(formatDateRange(entries), MARGIN + 28, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  setTextColor(doc, C.labelGray);
  doc.text('Noites registradas:', MARGIN, y);
  doc.setFont('helvetica', 'bold');
  setTextColor(doc, C.darkText);
  doc.text(String(entries.length), MARGIN + 42, y);

  y += 8;

  if (profile.initialIsiScore != null) {
    setFill(doc, [230, 230, 250] as [number, number, number]);
    setDraw(doc, SEG_COLOR.latency);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, y, CONTENT_W, 14, 2, 2, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    setTextColor(doc, C.darkText);
    doc.text('ISI (Insomnia Severity Index):', MARGIN + 4, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Pontuação ${profile.initialIsiScore}${profile.initialIsiInterpretation ? ' — ' + profile.initialIsiInterpretation : ''}`,
      MARGIN + 4, y + 10.5,
    );
    y += 20;
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  setTextColor(doc, C.labelGray);
  doc.text('MÉTRICAS MÉDIAS', MARGIN, y);
  y += 5;

  const BOX_W = 55;
  const BOX_H = 22;
  const BOX_GAP = (CONTENT_W - BOX_W * 3) / 2;

  const metrics: Array<{ label: string; value: string }> = [
    { label: 'Eficiência média',  value: `${Math.round(averages.sleepEfficiencyPercent)}%` },
    { label: 'TTS calculado',     value: formatDuration(Math.round(averages.ttsCalculatedMinutes)) },
    { label: 'TTS percebido',     value: formatDuration(Math.round(averages.ttsPerceivedMinutes)) },
    { label: 'WASO médio',        value: `${Math.round(averages.wasoMinutes)} min` },
    { label: 'Latência (LIS)',    value: `${Math.round(averages.lisMinutes)} min` },
    { label: 'TTC médio',         value: formatDuration(Math.round(averages.ttcMinutes)) },
  ];

  for (let i = 0; i < metrics.length; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const bx = MARGIN + col * (BOX_W + BOX_GAP);
    const by = y + row * (BOX_H + 4);
    setFill(doc, C.metricBg);
    setDraw(doc, [210, 212, 240] as [number, number, number]);
    doc.setLineWidth(0.2);
    doc.roundedRect(bx, by, BOX_W, BOX_H, 3, 3, 'FD');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    setTextColor(doc, C.labelGray);
    doc.text(metrics[i].label, bx + BOX_W / 2, by + 6.5, { align: 'center' });
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    setTextColor(doc, C.metricText);
    doc.text(metrics[i].value, bx + BOX_W / 2, by + 16, { align: 'center' });
  }
}

// ─── charts page (page 4+) ────────────────────────────────────────────────────

interface ChartSpec {
  title: string;
  values: (number | null)[];
  barColor: [number, number, number];
  refValue: number;
  refLabel: string;
  formatValue: (v: number) => string;
}

function drawMiniBarChart(
  doc: JsPDFInstance,
  spec: ChartSpec,
  dates: string[],
  cx: number, cy: number, cw: number, ch: number,
): void {
  setFill(doc, C.chartBg);
  setDraw(doc, [210, 215, 235] as [number, number, number]);
  doc.setLineWidth(0.2);
  doc.roundedRect(cx, cy, cw, ch, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setTextColor(doc, C.darkText);
  doc.text(spec.title, cx + cw / 2, cy + 6, { align: 'center' });

  const plotX = cx + 6;
  const plotY = cy + 10;
  const plotW = cw - 12;
  const plotH = ch - 18;
  const baselineY = plotY + plotH;

  const numericValues = spec.values.filter(v => v !== null) as number[];
  const allValues = [...numericValues, spec.refValue];
  const maxVal = Math.max(...allValues) * 1.15 || 1;

  const n = spec.values.length;
  if (n === 0) return;

  const barW  = Math.min((plotW / n) * 0.6, 8);
  const stepX = plotW / n;

  const refY = baselineY - (spec.refValue / maxVal) * plotH;
  doc.setLineWidth(0.3);
  setDraw(doc, C.refLine);
  doc.setLineDash([1.5, 1.5], 0);
  doc.line(plotX, refY, plotX + plotW, refY);
  doc.setLineDash([], 0);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  setTextColor(doc, C.labelGray);
  doc.text(spec.refLabel, plotX + plotW - 1, refY - 1.5, { align: 'right' });

  for (let i = 0; i < n; i++) {
    const v = spec.values[i];
    const bx = plotX + i * stepX + (stepX - barW) / 2;
    if (v === null) {
      doc.setFontSize(5);
      doc.setFont('helvetica', 'normal');
      setTextColor(doc, [185, 185, 195] as [number, number, number]);
      doc.text('—', bx + barW / 2, plotY + plotH / 2, { align: 'center' });
    } else {
      const barH = Math.max((v / maxVal) * plotH, 0.5);
      const bTop = baselineY - barH;
      setFill(doc, spec.barColor);
      doc.rect(bx, bTop, barW, barH, 'F');
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      setTextColor(doc, C.metricText);
      doc.text(spec.formatValue(v), bx + barW / 2, bTop - 1, { align: 'center' });
    }
    if (n <= 14) {
      doc.setFontSize(5);
      doc.setFont('helvetica', 'normal');
      setTextColor(doc, C.labelGray);
      doc.text(dates[i], bx + barW / 2, baselineY + 4, { align: 'center' });
    }
  }

  setDraw(doc, [180, 185, 210] as [number, number, number]);
  doc.setLineWidth(0.3);
  doc.line(plotX, baselineY, plotX + plotW, baselineY);
}

function drawChartsPage(
  doc: JsPDFInstance,
  chronological: SleepDiaryEntry[],
  pageNum: number,
): void {
  let y = MARGIN;
  sectionHeader(doc, 'EVOLUÇÃO DAS MÉTRICAS', MARGIN, y);
  y += 10;

  const chartSlots = buildDaySlots(chronological).slice(-14);
  const dates = chartSlots.map(({ date }) => formatDateDDMM(date));
  const CW = (CONTENT_W - 5) / 2;
  const CH = 50;

  const charts: ChartSpec[] = [
    {
      title: 'Eficiência do Sono (%)',
      values: chartSlots.map(({ entry }) => entry ? entry.metrics.sleepEfficiencyPercent : null),
      barColor: [109, 93, 246],
      refValue: 85, refLabel: '85%',
      formatValue: (v) => `${Math.round(v)}%`,
    },
    {
      title: 'TTS Calculado',
      values: chartSlots.map(({ entry }) => entry ? entry.metrics.ttsCalculatedMinutes : null),
      barColor: SEG_COLOR.sleep,
      refValue: 420, refLabel: '7h',
      formatValue: (v) => formatDuration(Math.round(v)),
    },
    {
      title: 'Latência — LIS (min)',
      values: chartSlots.map(({ entry }) => entry ? entry.metrics.lisMinutes : null),
      barColor: SEG_COLOR.latency,
      refValue: 30, refLabel: '30 min',
      formatValue: (v) => `${Math.round(v)}'`,
    },
    {
      title: 'WASO (min)',
      values: chartSlots.map(({ entry }) => entry ? entry.metrics.wasoMinutes : null),
      barColor: SEG_COLOR.waso,
      refValue: 30, refLabel: '30 min',
      formatValue: (v) => `${Math.round(v)}'`,
    },
  ];

  const positions: Array<[number, number]> = [
    [MARGIN,          y],
    [MARGIN + CW + 5, y],
    [MARGIN,          y + CH + 8],
    [MARGIN + CW + 5, y + CH + 8],
  ];

  for (let i = 0; i < charts.length; i++) {
    const [cx, cy] = positions[i];
    drawMiniBarChart(doc, charts[i], dates, cx, cy, CW, CH);
  }

  drawFooter(doc, pageNum);
}

// ─── public API ──────────────────────────────────────────────────────────────

export type ReportType = 'consolidated' | 'detailed';

/**
 * consolidated — 2 páginas para consulta rápida:
 *   Pág 1  Médias clínicas + dados do paciente + IGI
 *   Pág 2  Gráfico de actigrafia (últimas 14 noites)
 *
 * detailed — relatório completo:
 *   Pág 1+  Tabela transposta por noite (7 dias/pág)
 *   Pág n+1 Gráfico de actigrafia
 *   Pág n+2 Médias clínicas + dados do paciente + IGI
 *   Pág n+3 Gráficos de evolução (eficiência, TTS, LIS, WASO)
 */
export async function generateSleepDiaryPdf(
  profile: PatientProfile,
  entries: SleepDiaryEntry[],
  reportType: ReportType = 'detailed',
): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as unknown as JsPDFInstance;

  const chronological = [...entries].reverse();
  const averages = calculateSleepDiaryAverages(
    chronological.map((e) => ({ input: e.input, metrics: e.metrics })),
  );

  if (reportType === 'consolidated') {
    // Pág 1 — actigrafia (últimas 14 noites)
    drawTimelinePage(doc, chronological.slice(-14), 1);

    // Pág 2 — médias + paciente + IGI
    doc.addPage();
    drawAveragesPage(doc, profile, chronological, averages);
    drawFooter(doc, doc.getNumberOfPages());

  } else {
    // Pág 1+: tabela transposta (7 dias por página)
    const chunks: SleepDiaryEntry[][] = [];
    for (let i = 0; i < chronological.length; i += DAYS_PER_PAGE) {
      chunks.push(chronological.slice(i, i + DAYS_PER_PAGE));
    }
    for (let ci = 0; ci < chunks.length; ci++) {
      if (ci > 0) doc.addPage();
      drawSingleTransposedTable(doc, chunks[ci], doc.getNumberOfPages());
    }

    // Actigrafia
    doc.addPage();
    drawTimelinePage(doc, chronological.slice(-14), doc.getNumberOfPages());

    // Médias
    doc.addPage();
    drawAveragesPage(doc, profile, chronological, averages);
    drawFooter(doc, doc.getNumberOfPages());

    // Gráficos de evolução
    doc.addPage();
    drawChartsPage(doc, chronological, doc.getNumberOfPages());
  }

  return (doc as unknown as { output(type: string): Blob }).output('blob');
}

/**
 * Native PDF via expo-print (iOS/Android). Returns local file URI.
 */
export async function generateSleepDiaryPdfNative(
  profile: PatientProfile,
  entries: SleepDiaryEntry[],
  reportType: ReportType = 'detailed',
): Promise<string> {
  const { buildReportHtml } = await import('./reportHtml');
  const Print = await import('expo-print');
  const html = buildReportHtml(profile, entries, reportType);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}
