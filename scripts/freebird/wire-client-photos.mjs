import fs from 'fs';
import path from 'path';

// Point the image map at the client's own photos. Kept as a separate step
// from the upload so the seed scripts stay the single source of truth: this
// rewrites _content.mjs, then the normal build-* scripts re-seed every page
// that references those services.
const urls = JSON.parse(fs.readFileSync(path.resolve('_incoming/urls.json'), 'utf8'));
const target = path.resolve('scripts/freebird/_content.mjs');
let src = fs.readFileSync(target, 'utf8');

let changed = 0;
for (const [key, url] of Object.entries(urls)) {
  // Match either the original U(...) helper call or a previously wired URL.
  const re = new RegExp(`(\\n  ${key}: )(U\\([^)]*\\)|'[^']*')`);
  if (!re.test(src)) {
    console.log(`SKIP  ${key} — no entry in _content.mjs`);
    continue;
  }
  src = src.replace(re, `$1'${url}'`);
  changed++;
  console.log(`wired ${key}`);
}

if (changed) {
  fs.writeFileSync(target, src);
  console.log(`\n${changed} image(s) wired. Now run:`);
  console.log('  node scripts/freebird/build-home.mjs');
  console.log('  node scripts/freebird/build-services.mjs');
  console.log('  node scripts/freebird/build-pages.mjs');
}
