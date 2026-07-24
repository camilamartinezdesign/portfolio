#!/usr/bin/env node
// Extract <image-slot> media from .image-slots.state.json into real files and
// wire each matching slot's src=. Slots that already have a src are left
// untouched. Orphan sidecar entries with no matching slot are skipped.
//
// Usage:  node extract-media.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const STATE = '.image-slots.state.json';
const HTML = 'index.html';
const OUTDIR = 'media';
const EXT = {
  'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg',
  'image/avif': 'avif', 'image/gif': 'gif',
};

const state = JSON.parse(readFileSync(STATE, 'utf8'));
mkdirSync(OUTDIR, { recursive: true });
if (!existsSync(HTML + '.bak')) writeFileSync(HTML + '.bak', readFileSync(HTML));

let html = readFileSync(HTML, 'utf8');
let written = 0, wired = 0, hadSrc = 0, orphan = [], bad = [];

// Walk every <image-slot ...> tag once; decide per-tag what to do.
html = html.replace(/<image-slot\b[^>]*>/g, (tag) => {
  const id = (tag.match(/\bid="([^"]+)"/) || [])[1];
  if (!id || !(id in state)) return tag;         // no id, or no sidecar entry

  const raw = state[id];
  const url = typeof raw === 'string' ? raw : raw && raw.u;
  const m = url && /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(url);
  if (!m) { bad.push(id); return tag; }

  const ext = EXT[m[1].toLowerCase()] || 'bin';
  const file = `${OUTDIR}/${id}.${ext}`;
  writeFileSync(file, Buffer.from(m[2], 'base64'));
  written++;

  if (/\bsrc="/.test(tag)) { hadSrc++; return tag; }   // keep author-set src
  wired++;
  return tag.replace(/>$/, ` src="./${file}">`);
});

// Report sidecar entries that matched no slot at all.
const slotIds = new Set([...html.matchAll(/<image-slot\b[^>]*\bid="([^"]+)"/g)].map(m => m[1]));
for (const id of Object.keys(state)) if (!slotIds.has(id)) orphan.push(id);

writeFileSync(HTML, html);
console.log(`wrote ${written} image file(s) to ./${OUTDIR}/`);
console.log(`wired src= on ${wired} slot(s); ${hadSrc} already had a src (left as-is)`);
if (orphan.length) console.log(`skipped ${orphan.length} orphan entr(ies): ${orphan.join(', ')}`);
if (bad.length) console.log(`skipped ${bad.length} undecodable entr(ies): ${bad.join(', ')}`);
