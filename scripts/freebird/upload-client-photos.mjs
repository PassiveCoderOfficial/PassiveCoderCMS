import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { SUPABASE_URL, SERVICE_KEY, TENANT_ID } from './_lib.mjs';

// Client-supplied job photos replacing the stock shots on two service pages.
// Drop the originals in _incoming/ and run this; it crops, re-encodes and
// uploads to Supabase storage, then prints the public URLs to wire in.
const INCOMING = path.resolve('_incoming');
const BUCKET = 'media';

const JOBS = [
  {
    file: 'plumbing.jpg',
    key: 'svcPlumbing',
    // Screenshot of a phone gallery app: trim the Android status bar at the
    // top and the thumbnail strip / nav bar at the bottom so only the
    // collage itself remains. Ratios, not pixels, so it survives a
    // differently-sized re-export.
    // Measured on the 720x1600 original: the collage occupies y 280-1140,
    // i.e. everything above is the Android status bar + close button and
    // everything below is the thumbnail strip and nav bar.
    cropRatio: { top: 0.172, bottom: 0.278, left: 0.0, right: 0.0 },
    contain: true,
  },
  {
    file: 'waterproofing.jpg',
    key: 'svcWaterproof',
    // Clean photo — no chrome to remove.
    cropRatio: null,
  },
];

async function upload(name, buf, contentType) {
  const objectPath = `uploads/freebirdsg/${name}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: buf,
  });
  if (!res.ok) throw new Error(`upload ${name}: ${res.status} ${await res.text()}`);
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;
}

const results = {};
for (const job of JOBS) {
  const src = path.join(INCOMING, job.file);
  if (!fs.existsSync(src)) {
    console.log(`MISSING  ${job.file} — put it in _incoming/ and re-run`);
    continue;
  }
  let img = sharp(src).rotate(); // honour EXIF orientation
  const meta = await img.metadata();

  if (job.cropRatio) {
    const { top, bottom, left, right } = job.cropRatio;
    const y = Math.round(meta.height * top);
    const x = Math.round(meta.width * left);
    const h = Math.round(meta.height * (1 - top - bottom));
    const w = Math.round(meta.width * (1 - left - right));
    img = img.extract({ top: y, left: x, width: w, height: h });
  }

  // Service cards render at 4:3. A normal photo is cover-cropped to fill the
  // frame, but the plumbing collage is a tall grid — cover-cropping it would
  // cut whole rows of the client's work off. Contain it on a dark backdrop
  // instead so every tile survives.
  const buf = await img
    .resize(1200, 900, job.contain
      ? { fit: 'contain', background: { r: 15, g: 23, b: 42 } }
      : { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();

  const outName = job.file.replace(/\.[^.]+$/, '') + '.jpg';
  const url = await upload(outName, buf, 'image/jpeg');
  results[job.key] = url;

  // Keep a local copy of exactly what was uploaded, for eyeballing.
  fs.writeFileSync(path.join(INCOMING, `_processed_${outName}`), buf);
  console.log(`OK  ${job.key}\n    ${url}`);
}

if (Object.keys(results).length) {
  fs.writeFileSync(
    path.join(INCOMING, 'urls.json'),
    JSON.stringify(results, null, 2),
  );
  console.log('\nurls.json written — run wire-client-photos.mjs next');
}
