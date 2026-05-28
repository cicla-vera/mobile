/**
 * Generates a 144x144 PNG of the Cicla MoonMark crescent for the system
 * overlay floating bubble. Mirrors `components/calendar/moon-mark.tsx`.
 *
 * Run with: node scripts/generate-bubble-icon.cjs
 */

const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const SIZE = 144;
const MOON_COLOR = { r: 0xc4, g: 0x45, b: 0x9f };
const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'assets',
  'images',
  'security-bubble-icon.png',
);

const png = new PNG({ width: SIZE, height: SIZE, colorType: 6 });

const moonRadius = SIZE * 0.42;
const moonCenter = { x: SIZE * 0.5 - SIZE * 0.04, y: SIZE * 0.5 };
const cutoutRadius = SIZE * 0.42;
const cutoutCenter = { x: moonCenter.x + SIZE * 0.16, y: moonCenter.y - SIZE * 0.01 };

const moonAngle = (-10 * Math.PI) / 180;
const cutoutAngle = (8 * Math.PI) / 180;

function rotate(point, center, angle) {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

function smoothCircleAlpha(pixel, center, radius) {
  const dx = pixel.x - center.x;
  const dy = pixel.y - center.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const edge = radius - distance;
  if (edge >= 1) {
    return 1;
  }
  if (edge <= 0) {
    return 0;
  }
  return edge;
}

for (let y = 0; y < SIZE; y += 1) {
  for (let x = 0; x < SIZE; x += 1) {
    const pixel = { x: x + 0.5, y: y + 0.5 };

    const moonPixel = rotate(pixel, moonCenter, -moonAngle);
    const moonAlpha = smoothCircleAlpha(moonPixel, moonCenter, moonRadius);

    const cutoutPixel = rotate(pixel, cutoutCenter, -cutoutAngle);
    const cutoutAlpha = smoothCircleAlpha(
      cutoutPixel,
      cutoutCenter,
      cutoutRadius,
    );

    const alpha = Math.max(0, moonAlpha - cutoutAlpha);

    const idx = (SIZE * y + x) << 2;
    png.data[idx] = MOON_COLOR.r;
    png.data[idx + 1] = MOON_COLOR.g;
    png.data[idx + 2] = MOON_COLOR.b;
    png.data[idx + 3] = Math.round(alpha * 255);
  }
}

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });

png
  .pack()
  .pipe(fs.createWriteStream(OUTPUT_PATH))
  .on('finish', () => {
    console.log(`[generate-bubble-icon] wrote ${OUTPUT_PATH}`);
  });
