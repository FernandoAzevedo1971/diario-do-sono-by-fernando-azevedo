// ─────────────────────────────────────────────────────────────
// Shared data, formatters and palette tokens for all variations
// ─────────────────────────────────────────────────────────────

// 14 nights of fake-but-plausible data. Most recent (today) is last.
// Each: { tts: minutes asleep, ttc: time in bed, lis: latency, waso, igi (only on day 0/7/14)
const SLEEP_DATA = [
  { d:-13, tts: 372, ttc: 480, lis: 32, waso: 18, eff: 77, mood: 2 },
  { d:-12, tts: 348, ttc: 465, lis: 45, waso: 22, eff: 75, mood: 2 },
  { d:-11, tts: 401, ttc: 470, lis: 18, waso: 12, eff: 85, mood: 3 },
  { d:-10, tts: 420, ttc: 475, lis: 15, waso: 8,  eff: 88, mood: 4 },
  { d: -9, tts: 365, ttc: 470, lis: 28, waso: 19, eff: 78, mood: 3 },
  { d: -8, tts: 388, ttc: 460, lis: 22, waso: 14, eff: 84, mood: 3 },
  { d: -7, tts: 412, ttc: 480, lis: 14, waso: 10, eff: 86, mood: 4 },
  { d: -6, tts: 432, ttc: 480, lis: 12, waso: 8,  eff: 90, mood: 4 },
  { d: -5, tts: 396, ttc: 465, lis: 20, waso: 13, eff: 85, mood: 3 },
  { d: -4, tts: 425, ttc: 470, lis: 10, waso: 9,  eff: 90, mood: 4 },
  { d: -3, tts: 408, ttc: 465, lis: 17, waso: 11, eff: 88, mood: 4 },
  { d: -2, tts: 440, ttc: 475, lis: 9,  waso: 7,  eff: 93, mood: 5 },
  { d: -1, tts: 421, ttc: 470, lis: 13, waso: 9,  eff: 90, mood: 4 },
  { d:  0, tts: 446, ttc: 475, lis: 11, waso: 6,  eff: 94, mood: 5 },
];

const TODAY = SLEEP_DATA[SLEEP_DATA.length - 1];
const LAST7 = SLEEP_DATA.slice(-7);
const PREV7 = SLEEP_DATA.slice(-14, -7);

const AVG7 = {
  tts: Math.round(LAST7.reduce((a,b)=>a+b.tts,0) / LAST7.length),
  eff: Math.round(LAST7.reduce((a,b)=>a+b.eff,0) / LAST7.length),
  lis: Math.round(LAST7.reduce((a,b)=>a+b.lis,0) / LAST7.length),
  waso: Math.round(LAST7.reduce((a,b)=>a+b.waso,0) / LAST7.length),
};
const AVG_PREV7 = {
  tts: Math.round(PREV7.reduce((a,b)=>a+b.tts,0) / PREV7.length),
  eff: Math.round(PREV7.reduce((a,b)=>a+b.eff,0) / PREV7.length),
};

const STREAK = 12; // dias consecutivos preenchidos
const ISI_SCORE = 9; // subclínica
const ISI_LABEL = 'Subclínica';
const ISI_LAST_DAYS = 6;
const NEXT_ISI_IN_DAYS = 8;

// Formatters
function fmtH(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${String(m).padStart(2,'0')}`;
}
function fmtHShort(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${String(m).padStart(2,'0')}`;
}
function fmtMin(min) { return `${min} min`; }

const WEEKDAYS_PT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
// Build labels for last 7 days ending today (Tue May 19 2026 ~ assume)
function weekdayLabels() {
  // Today is Wednesday hypothetically; just rotate
  const order = ['Qui','Sex','Sáb','Dom','Seg','Ter','Qua']; // last 7
  return order;
}

Object.assign(window, {
  SLEEP_DATA, TODAY, LAST7, PREV7, AVG7, AVG_PREV7,
  STREAK, ISI_SCORE, ISI_LABEL, ISI_LAST_DAYS, NEXT_ISI_IN_DAYS,
  fmtH, fmtHShort, fmtMin, weekdayLabels, WEEKDAYS_PT,
});
