const sharp = require("sharp");
const path = require("path");

const SRC_LOGO = path.resolve(__dirname, "../../../public/branding/passivecoder-icon.png");
const OUT_DIR = path.resolve(__dirname, "../assets");
const SIZE = 1024;

// Orange gradient rounded-box background (Passive Coder brand orange).
function bgSvg(size, radiusFrac) {
  const r = Math.round(size * radiusFrac);
  return Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff8a3d"/>
          <stop offset="100%" stop-color="#f2610c"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#g)"/>
    </svg>
  `);
}

// Recolor any (opaque-ish) glyph to flat solid white by keeping only its
// alpha channel and painting white everywhere that alpha is present —
// tint() alone doesn't flatten a two-tone source to pure white since it
// scales existing luminance rather than replacing it.
async function toSolidWhite(buf, size) {
  const resized = sharp(buf).resize(size, size, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });
  const { data, info } = await resized.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // Overwrite every pixel's RGB to white, keep its original alpha —
  // flattens a multi-tone glyph to a flat white silhouette.
  for (let i = 0; i < data.length; i += info.channels) {
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .png()
    .toBuffer();
}

async function main() {
  // 1. Recolor the source glyph (orange-on-transparent) to pure white,
  //    keeping its alpha channel — used as the foreground on the gradient box.
  const whiteGlyph = await toSolidWhite(SRC_LOGO, Math.round(SIZE * 0.58));

  // 2. Main app icon: full-bleed rounded gradient box + centered white glyph.
  const bg = bgSvg(SIZE, 0.22);
  await sharp(bg)
    .composite([{ input: whiteGlyph, gravity: "center" }])
    .png()
    .toFile(path.join(OUT_DIR, "icon.png"));

  // 3. Android adaptive icon foreground: transparent bg, glyph only, smaller
  //    (system applies the mask/background separately — keep content inside
  //    the safe zone, roughly the center 66%).
  const adaptiveFg = await toSolidWhite(SRC_LOGO, Math.round(SIZE * 0.5));
  await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: adaptiveFg, gravity: "center" }])
    .png()
    .toFile(path.join(OUT_DIR, "adaptive-icon.png"));

  // 4. Splash icon: same white glyph, larger, on transparent (composited onto
  //    the splash backgroundColor by Expo at runtime).
  const splashGlyph = await toSolidWhite(SRC_LOGO, Math.round(SIZE * 0.42));
  await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: splashGlyph, gravity: "center" }])
    .png()
    .toFile(path.join(OUT_DIR, "splash-icon.png"));

  // 5. Android adaptive-icon monochrome (SDK 33+ themed icons) — same glyph
  //    silhouette, single-channel white-on-transparent works fine here too.
  await sharp(adaptiveFg).png().toFile(path.join(OUT_DIR, "adaptive-icon-monochrome.png"));

  console.log("Generated icon.png, adaptive-icon.png, splash-icon.png, adaptive-icon-monochrome.png in", OUT_DIR);
}

main().catch((e) => { console.error(e); process.exit(1); });
