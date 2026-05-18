import { calculateSleepDiaryAverages, formatDuration, minutesBetweenClockTimes } from '@diario-do-sono/core';
import type { PatientProfile, SleepDiaryEntry } from '../types';

// ─── constants ───────────────────────────────────────────────────────────────

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 15;
const CONTENT_W = PAGE_W - MARGIN * 2;

const RANGE_START_HOUR = 18;
const RANGE_TOTAL_MINUTES = 20 * 60; // 18:00 → 14:00 next day

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
};

// ─── types ────────────────────────────────────────────────────────────────────

interface SegmentDef {
  key: string;
  flex: number;
  color: [number, number, number] | null; // null = transparent
}

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
): SegmentDef[] {
  const segs: SegmentDef[] = [];

  const preBed = clamp(bedOffset, 0, RANGE_TOTAL_MINUTES);
  if (preBed > 0) segs.push({ key: 'void-pre', flex: preBed, color: null });

  const lis = clamp(lisMinutes, 0, RANGE_TOTAL_MINUTES);
  if (lis > 0) segs.push({ key: 'lis', flex: lis, color: SEG_COLOR.latency });

  const sleepPeriod = clamp(finalWakeOffset - bedOffset - lis, 0, RANGE_TOTAL_MINUTES);
  if (sleepPeriod > 0) {
    const capWaso = clamp(wasoMinutes, 0, sleepPeriod);
    if (nightAwakeningsCount > 0 && capWaso > 0) {
      const wasoEach = capWaso / nightAwakeningsCount;
      const netSleep = sleepPeriod - capWaso;
      const seg = netSleep / (nightAwakeningsCount + 1);
      for (let i = 0; i < nightAwakeningsCount; i++) {
        if (seg > 0.5) segs.push({ key: `sleep-${i}`, flex: seg, color: SEG_COLOR.sleep });
        segs.push({ key: `waso-${i}`, flex: wasoEach, color: SEG_COLOR.waso });
      }
      if (seg > 0.5) segs.push({ key: 'sleep-last', flex: seg, color: SEG_COLOR.sleep });
    } else {
      segs.push({ key: 'sleep', flex: sleepPeriod, color: SEG_COLOR.sleep });
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

// ─── page 1 ───────────────────────────────────────────────────────────────────

function drawPage1(
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

  // Info section
  let y = 52;
  const labelX = MARGIN;
  const valueX = MARGIN + 28;

  doc.setFontSize(9);

  doc.setFont('helvetica', 'normal');
  setTextColor(doc, C.labelGray);
  doc.text('Paciente:', labelX, y);
  doc.setFont('helvetica', 'bold');
  setTextColor(doc, C.darkText);
  doc.text(profile.name, valueX, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  setTextColor(doc, C.labelGray);
  doc.text('Período:', labelX, y);
  doc.setFont('helvetica', 'normal');
  setTextColor(doc, C.darkText);
  doc.text(formatDateRange(entries), valueX, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  setTextColor(doc, C.labelGray);
  doc.text('Noites registradas:', labelX, y);
  doc.setFont('helvetica', 'bold');
  setTextColor(doc, C.darkText);
  doc.text(String(entries.length), valueX + 14, y);

  y += 8;

  // ISI block
  if (profile.initialIsiScore != null) {
    setFill(doc, [230, 230, 250] as [number, number, number]);
    setDraw(doc, SEG_COLOR.latency);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, y, CONTENT_W, 14, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    setTextColor(doc, C.darkText);
    doc.text('IGI (Índice de Gravidade de Insônia):', MARGIN + 4, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Pontuação ${profile.initialIsiScore}${profile.initialIsiInterpretation ? ' — ' + profile.initialIsiInterpretation : ''}`,
      MARGIN + 4,
      y + 10.5,
    );

    y += 20;
  }

  // Metrics grid
  const gridLabel = 'MÉTRICAS MÉDIAS';
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  setTextColor(doc, C.labelGray);
  doc.text(gridLabel, MARGIN, y);
  y += 5;

  const BOX_W = 55;
  const BOX_H = 22;
  const BOX_GAP = (CONTENT_W - BOX_W * 3) / 2;

  const metrics: Array<{ label: string; value: string }> = [
    { label: 'Eficiência média', value: `${Math.round(averages.sleepEfficiencyPercent)}%` },
    { label: 'TTS calculado', value: formatDuration(Math.round(averages.ttsCalculatedMinutes)) },
    { label: 'TTS percebido', value: formatDuration(Math.round(averages.ttsPerceivedMinutes)) },
    { label: 'WASO médio', value: `${Math.round(averages.wasoMinutes)} min` },
    { label: 'Latência (LIS)', value: `${Math.round(averages.lisMinutes)} min` },
    { label: 'TTC médio', value: formatDuration(Math.round(averages.ttcMinutes)) },
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

// ─── page 2 ───────────────────────────────────────────────────────────────────

function drawTimelinePage(
  doc: JsPDFInstance,
  chronological: SleepDiaryEntry[],
  pageNum: number,
): void {
  let y = MARGIN;

  sectionHeader(doc, 'LINHA DO TEMPO DO SONO', MARGIN, y);
  y += 8;

  // Hour axis
  const hourLabels = ['20h', '22h', '00h', '02h', '04h', '06h', '08h', '10h', '12h'];
  const hourOffsets = [120, 240, 360, 480, 600, 720, 840, 960, 1080]; // minutes from 18:00

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  setTextColor(doc, C.labelGray);

  for (let i = 0; i < hourLabels.length; i++) {
    const ratio = hourOffsets[i] / RANGE_TOTAL_MINUTES;
    const x = MARGIN + 14 + ratio * (CONTENT_W - 30);
    doc.text(hourLabels[i], x, y, { align: 'center' });
  }
  y += 4;

  const BAR_H = 7;
  const ROW_GAP = 3;
  const DATE_W = 14;
  const EFF_W = 12;
  const BAR_AREA_W = CONTENT_W - DATE_W - EFF_W - 4;
  const BAR_X = MARGIN + DATE_W + 2;

  let currentPage = pageNum;

  for (const entry of chronological) {
    if (y + BAR_H + ROW_GAP > PAGE_H - 30) {
      drawFooter(doc, currentPage);
      doc.addPage();
      currentPage += 1;
      y = MARGIN;
      sectionHeader(doc, 'LINHA DO TEMPO DO SONO (cont.)', MARGIN, y);
      y += 8;
    }

    // Date label
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    setTextColor(doc, C.darkText);
    doc.text(formatDateDDMM(entry.input.entryDate), MARGIN, y + BAR_H * 0.7);

    // Bar background
    setFill(doc, [230, 230, 240] as [number, number, number]);
    setDraw(doc, [220, 220, 235] as [number, number, number]);
    doc.setLineWidth(0.1);
    doc.rect(BAR_X, y, BAR_AREA_W, BAR_H, 'F');

    const bedOffset = clamp(offsetFromRangeStart(entry.input.bedTime), 0, RANGE_TOTAL_MINUTES);
    const wakeOffset = clamp(offsetFromRangeStart(entry.input.finalWakeTime), 0, RANGE_TOTAL_MINUTES);
    const outOfBedOffset = clamp(
      offsetFromRangeStart(entry.metrics.outOfBedTime),
      0,
      RANGE_TOTAL_MINUTES,
    );

    const segments = buildSegments(
      bedOffset,
      entry.input.sleepLatencyMinutes,
      entry.input.nightAwakeningsCount,
      entry.input.wasoMinutes,
      wakeOffset,
      entry.input.outOfBedLatencyMinutes,
      outOfBedOffset,
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

    // Efficiency label
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    setTextColor(doc, C.darkText);
    const eff = `${Math.round(entry.metrics.sleepEfficiencyPercent)}%`;
    doc.text(eff, BAR_X + BAR_AREA_W + 2, y + BAR_H * 0.75);

    y += BAR_H + ROW_GAP;
  }

  // Legend
  y += 4;
  const legendItems: Array<{ color: [number, number, number]; label: string }> = [
    { color: SEG_COLOR.latency, label: 'Latência' },
    { color: SEG_COLOR.sleep,   label: 'Sono' },
    { color: SEG_COLOR.waso,    label: 'WASO' },
    { color: SEG_COLOR.inertia, label: 'Inércia' },
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

// ─── page 3 ───────────────────────────────────────────────────────────────────

interface ChartSpec {
  title: string;
  values: number[];
  barColor: [number, number, number];
  refValue: number;
  refLabel: string;
  formatValue: (v: number) => string;
}

function drawMiniBarChart(
  doc: JsPDFInstance,
  spec: ChartSpec,
  dates: string[],
  cx: number,
  cy: number,
  cw: number,
  ch: number,
): void {
  // Chart background
  setFill(doc, C.chartBg);
  setDraw(doc, [210, 215, 235] as [number, number, number]);
  doc.setLineWidth(0.2);
  doc.roundedRect(cx, cy, cw, ch, 2, 2, 'FD');

  // Title
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setTextColor(doc, C.darkText);
  doc.text(spec.title, cx + cw / 2, cy + 6, { align: 'center' });

  const plotX = cx + 6;
  const plotY = cy + 10;
  const plotW = cw - 12;
  const plotH = ch - 18;
  const baselineY = plotY + plotH;

  const allValues = [...spec.values, spec.refValue];
  const maxVal = Math.max(...allValues) * 1.15 || 1;

  const n = spec.values.length;
  if (n === 0) return;

  const barW = Math.min((plotW / n) * 0.6, 8);
  const stepX = plotW / n;

  // Reference line (dashed)
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

  // Bars
  for (let i = 0; i < n; i++) {
    const v = spec.values[i];
    const barH = Math.max((v / maxVal) * plotH, 0.5);
    const bx = plotX + i * stepX + (stepX - barW) / 2;
    const bTop = baselineY - barH;

    setFill(doc, spec.barColor);
    doc.rect(bx, bTop, barW, barH, 'F');

    // Value label
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    setTextColor(doc, C.metricText);
    doc.text(spec.formatValue(v), bx + barW / 2, bTop - 1, { align: 'center' });

    // Date label
    if (n <= 14) {
      doc.setFontSize(5);
      doc.setFont('helvetica', 'normal');
      setTextColor(doc, C.labelGray);
      doc.text(dates[i], bx + barW / 2, baselineY + 4, { align: 'center' });
    }
  }

  // Baseline
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

  const dates = chronological.map((e) => formatDateDDMM(e.input.entryDate));
  const CW = (CONTENT_W - 5) / 2;
  const CH = 50;

  const charts: ChartSpec[] = [
    {
      title: 'Eficiência do Sono (%)',
      values: chronological.map((e) => e.metrics.sleepEfficiencyPercent),
      barColor: [109, 93, 246],
      refValue: 85,
      refLabel: '85%',
      formatValue: (v) => `${Math.round(v)}%`,
    },
    {
      title: 'TTS Calculado',
      values: chronological.map((e) => e.metrics.ttsCalculatedMinutes),
      barColor: SEG_COLOR.sleep,
      refValue: 420,
      refLabel: '7h',
      formatValue: (v) => formatDuration(Math.round(v)),
    },
    {
      title: 'Latência — LIS (min)',
      values: chronological.map((e) => e.metrics.lisMinutes),
      barColor: SEG_COLOR.latency,
      refValue: 30,
      refLabel: '30 min',
      formatValue: (v) => `${Math.round(v)}'`,
    },
    {
      title: 'WASO (min)',
      values: chronological.map((e) => e.metrics.wasoMinutes),
      barColor: SEG_COLOR.waso,
      refValue: 30,
      refLabel: '30 min',
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

// ─── page 4+ ─────────────────────────────────────────────────────────────────

const TABLE_COL_WIDTHS = [20, 17, 14, 17, 14, 17, 22, 22, 15];
const TABLE_TOTAL_W = TABLE_COL_WIDTHS.reduce((s, w) => s + w, 0);
const TABLE_X = MARGIN + (CONTENT_W - TABLE_TOTAL_W) / 2;
const TABLE_ROW_H = 8;
const TABLE_HEADERS = [
  'Data', 'Deitar', 'LIS', 'Despert.', 'WASO', 'Acordar', 'TTS calc.', 'TTS perc.', 'Efic.',
];

function drawTableRow(
  doc: JsPDFInstance,
  cols: string[],
  rowY: number,
  isHeader: boolean,
  isAlt: boolean,
): void {
  if (isHeader) {
    setFill(doc, C.navy);
    doc.rect(TABLE_X, rowY, TABLE_TOTAL_W, TABLE_ROW_H, 'F');
  } else if (isAlt) {
    setFill(doc, C.rowAlt);
    doc.rect(TABLE_X, rowY, TABLE_TOTAL_W, TABLE_ROW_H, 'F');
  } else {
    setFill(doc, C.white);
    doc.rect(TABLE_X, rowY, TABLE_TOTAL_W, TABLE_ROW_H, 'F');
  }

  const textY = rowY + TABLE_ROW_H * 0.65;
  let cx = TABLE_X;

  for (let i = 0; i < cols.length; i++) {
    const cellCenterX = cx + TABLE_COL_WIDTHS[i] / 2;
    if (isHeader) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      setTextColor(doc, C.white);
    } else {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      setTextColor(doc, C.darkText);
    }
    doc.text(cols[i], cellCenterX, textY, { align: 'center' });
    cx += TABLE_COL_WIDTHS[i];
  }

  // Row border
  setDraw(doc, [220, 222, 240] as [number, number, number]);
  doc.setLineWidth(0.1);
  doc.line(TABLE_X, rowY + TABLE_ROW_H, TABLE_X + TABLE_TOTAL_W, rowY + TABLE_ROW_H);
}

function drawTablePages(
  doc: JsPDFInstance,
  chronological: SleepDiaryEntry[],
  startPageNum: number,
): void {
  let y = MARGIN;
  let currentPage = startPageNum;

  sectionHeader(doc, 'REGISTROS DIÁRIOS', MARGIN, y);
  y += 8;

  drawTableRow(doc, TABLE_HEADERS, y, true, false);
  y += TABLE_ROW_H;

  for (let i = 0; i < chronological.length; i++) {
    if (y + TABLE_ROW_H > PAGE_H - 18) {
      drawFooter(doc, currentPage);
      doc.addPage();
      currentPage += 1;
      y = MARGIN;
      sectionHeader(doc, 'REGISTROS DIÁRIOS (cont.)', MARGIN, y);
      y += 8;
      drawTableRow(doc, TABLE_HEADERS, y, true, false);
      y += TABLE_ROW_H;
    }

    const entry = chronological[i];
    const cols = [
      formatDateDDMM(entry.input.entryDate),
      entry.input.bedTime,
      `${entry.input.sleepLatencyMinutes}'`,
      String(entry.input.nightAwakeningsCount),
      `${entry.input.wasoMinutes}'`,
      entry.input.finalWakeTime,
      formatDuration(entry.metrics.ttsCalculatedMinutes),
      formatDuration(entry.metrics.ttsPerceivedMinutes),
      `${Math.round(entry.metrics.sleepEfficiencyPercent)}%`,
    ];

    drawTableRow(doc, cols, y, false, i % 2 === 1);
    y += TABLE_ROW_H;
  }

  drawFooter(doc, currentPage);
}

// ─── public API ──────────────────────────────────────────────────────────────

export type ReportType = 'consolidated' | 'detailed';

/**
 * consolidated — capa com médias + gráficos de evolução (2 páginas)
 * detailed     — capa + linha do tempo + gráficos + tabela completa (4+ páginas)
 */
export async function generateSleepDiaryPdf(
  profile: PatientProfile,
  entries: SleepDiaryEntry[],
  reportType: ReportType = 'detailed',
): Promise<Blob> {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as unknown as JsPDFInstance;

  // Entries arrive newest-first; reverse for chronological display
  const chronological = [...entries].reverse();

  const averages = calculateSleepDiaryAverages(
    chronological.map((e) => ({ input: e.input, metrics: e.metrics })),
  );

  // Page 1 — cover & averages (both modes)
  drawPage1(doc, profile, chronological, averages);
  drawFooter(doc, 1);

  if (reportType === 'consolidated') {
    // Page 2 — metric trend charts only
    doc.addPage();
    drawChartsPage(doc, chronological, 2);
  } else {
    // Page 2 — timeline (up to 14 most recent)
    doc.addPage();
    const timelineEntries = chronological.slice(-14);
    drawTimelinePage(doc, timelineEntries, 2);

    // Page 3 — metric charts
    doc.addPage();
    drawChartsPage(doc, chronological, 3);

    // Page 4+ — data table
    doc.addPage();
    drawTablePages(doc, chronological, 4);
  }

  return (doc as unknown as { output(type: string): Blob }).output('blob');
}
