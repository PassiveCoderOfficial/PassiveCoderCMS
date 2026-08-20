import { execSync } from 'child_process';
import fs from 'fs';

// One-shot: run this after dropping the two client photos in _incoming/.
// Uploads, wires, re-seeds, builds, pushes.
const need = ['_incoming/plumbing.jpg', '_incoming/waterproofing.jpg'];
const missing = need.filter(f => !fs.existsSync(f));
if (missing.length) {
  console.log('Missing:', missing.join(', '));
  console.log('Drop the files there, then re-run this script.');
  process.exit(1);
}
const run = (c) => { console.log('\n$ ' + c); execSync(c, { stdio: 'inherit' }); };
run('node scripts/freebird/upload-client-photos.mjs');
run('node scripts/freebird/wire-client-photos.mjs');
run('node scripts/freebird/build-home.mjs');
run('node scripts/freebird/build-services.mjs');
run('node scripts/freebird/build-pages.mjs');
console.log('\nDone. Photos live (DB-driven, no deploy needed).');
