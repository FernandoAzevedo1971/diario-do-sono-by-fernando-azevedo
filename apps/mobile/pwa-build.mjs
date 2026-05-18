#!/usr/bin/env node
/**
 * pwa-build.mjs — executa após `expo export --platform web`
 *
 * 1. Gera ícones PNG (192, 512, 180) programaticamente — lua crescente dourada
 *    sobre fundo azul-marinho com estrelas, sem dependências externas.
 * 2. Cria manifest.json para instalação como PWA.
 * 3. Cria sw.js (service worker) com cache versionado pelo hash do bundle.
 * 4. Injeta <link rel="manifest">, apple-touch-icon e registro do SW no index.html.
 */

import { deflateSync } from 'zlib';
import { writeFileSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = join(__dirname, 'dist');

// ─── PNG generator (sem dependências externas) ────────────────────────────────

const CRC32_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC32_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcBuf]);
}

/** Gera um PNG RGB (sem alpha) a partir de drawFn(x, y) → [r, g, b]. */
function makePNG(size, drawFn) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const stride = 1 + size * 3;
  const raw = Buffer.allocUnsafe(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const [r, g, b] = drawFn(x, y, size);
      const base = y * stride + 1 + x * 3;
      raw[base]     = Math.min(255, Math.max(0, r | 0));
      raw[base + 1] = Math.min(255, Math.max(0, g | 0));
      raw[base + 2] = Math.min(255, Math.max(0, b | 0));
    }
  }

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ─── Desenho do ícone: lua crescente dourada em céu noturno ──────────────────

function drawIcon(x, y, size) {
  // Fundo: gradiente vertical azul-marinho → azul-escuro-roxo
  const t = y / (size - 1);
  const bgR = 8  + (18  - 8)  * t;
  const bgG = 11 + (11  - 11) * t;
  const bgB = 31 + (63  - 31) * t;

  const cx = size * 0.50;
  const cy = size * 0.50;

  // Lua crescente: círculo externo menos círculo recortado
  const r1   = size * 0.30;
  const moonX = cx - size * 0.03;
  const moonY = cy;

  const dx1 = x - moonX;
  const dy1 = y - moonY;
  const d1sq = dx1 * dx1 + dy1 * dy1;

  // Brilho (glow) ao redor da lua
  const glowR = r1 + size * 0.09;
  if (d1sq < glowR * glowR) {
    const cutX = moonX + r1 * 0.54;
    const cutY = moonY - r1 * 0.08;
    const r2   = r1 * 0.77;
    const dx2  = x - cutX;
    const dy2  = y - cutY;
    const inCut = dx2 * dx2 + dy2 * dy2 < r2 * r2;

    if (!inCut) {
      if (d1sq < r1 * r1) {
        // Corpo da lua — amarelo dourado #F8C86A
        return [248, 200, 106];
      }
      // Halo
      const dist = Math.sqrt(d1sq);
      const glow = 1 - (dist - r1) / (glowR - r1);
      return [
        bgR + (248 - bgR) * glow * 0.35,
        bgG + (200 - bgG) * glow * 0.35,
        bgB + (106 - bgB) * glow * 0.25,
      ];
    }
  }

  // Estrelas — distribuição determinística por posição
  const hash = ((x * 2053) ^ (y * 3001) ^ (x * y * 7)) & 0x7fff;
  if (hash < 30) {
    const brightness = 160 + (hash % 80);
    return [brightness, brightness, brightness + 20];
  }
  if (hash < 50) {
    const brightness = 80 + (hash % 60);
    return [brightness, brightness, brightness + 15];
  }

  return [bgR, bgG, bgB];
}

// ─── Cache version (hash do bundle gerado pelo Expo) ──────────────────────────

function getBundleHash() {
  try {
    const jsDir = join(dist, '_expo', 'static', 'js', 'web');
    const files = readdirSync(jsDir);
    const bundle = files.find((f) => f.startsWith('AppEntry-') && f.endsWith('.js'));
    const m = bundle?.match(/AppEntry-([a-f0-9]+)\.js$/);
    return m?.[1]?.slice(0, 8) ?? 'v1';
  } catch {
    return 'v1';
  }
}

// ─── Service Worker ───────────────────────────────────────────────────────────

function makeSW(cacheVer) {
  return `// Diário do Sono — Service Worker (cache: ${cacheVer})
const CACHE = 'diario-sono-${cacheVer}';

self.addEventListener('install', (e) =>
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(['/', '/manifest.json']))
      .then(() => self.skipWaiting()),
  ),
);

self.addEventListener('activate', (e) =>
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  ),
);

self.addEventListener('fetch', (e) => {
  // Navegação: tenta rede, cai para index.html em cache
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/')));
  }
});
`;
}

// ─── Manifest ─────────────────────────────────────────────────────────────────

const manifest = {
  name: 'Diário do Sono',
  short_name: 'Sono',
  description: 'Seu diário clínico do sono',
  lang: 'pt-BR',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#080B1F',
  theme_color: '#080B1F',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
};

// ─── Injeção no index.html ────────────────────────────────────────────────────

const headTags = `
  <link rel="manifest" href="/manifest.json" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Sono" />`;

const swScript = `  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () =>
        navigator.serviceWorker.register('/sw.js').catch(() => {}),
      );
    }
  </script>`;

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('🌙 Gerando assets PWA...');

writeFileSync(join(dist, 'icon-192.png'), makePNG(192, drawIcon));
writeFileSync(join(dist, 'icon-512.png'), makePNG(512, drawIcon));
writeFileSync(join(dist, 'apple-touch-icon.png'), makePNG(180, drawIcon));
console.log('✓ Ícones gerados (192, 512, 180)');

writeFileSync(join(dist, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('✓ manifest.json');

const cacheVer = getBundleHash();
writeFileSync(join(dist, 'sw.js'), makeSW(cacheVer));
console.log(`✓ sw.js (cache: ${cacheVer})`);

let html = readFileSync(join(dist, 'index.html'), 'utf8');
html = html.replace('</head>', headTags + '\n</head>');
html = html.replace('</body>', swScript + '\n</body>');
writeFileSync(join(dist, 'index.html'), html);
console.log('✓ index.html atualizado');

console.log('✅ PWA pronto!');
