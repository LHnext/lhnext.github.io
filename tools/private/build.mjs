// Baut den geschützten Bereich: verschlüsselt jede sites/*.html nach p/<name>.html,
// erzeugt eine verschlüsselte Übersicht p/index.html und kopiert den öffentlichen Viewer nach p/v.html.
//
//   node tools/private/build.mjs            Passwort wird abgefragt
//   LHP_PASSWORD=... node tools/private/build.mjs
//
// sites/ enthält Klartext und ist per .gitignore ausgeschlossen – nur p/ wird committet.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, resolve, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';
import { webcrypto as crypto } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const SRC = resolve(ROOT, process.env.LHP_SRC || 'sites');
const OUT = join(ROOT, 'p');
const ITER = 600000;
const MIN_PASSWORD = 12;
const RESERVED = new Set(['index', 'v']);

const template = name => readFileSync(join(HERE, name), 'utf8');
const b64 = u => Buffer.from(u).toString('base64');
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function titleOf(html, fallback) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, ' ').trim() || fallback : fallback;
}

function slugOf(file) {
  let slug = basename(file, extname(file)).toLowerCase()
    .replace(/[äöüß]/g, c => ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' })[c])
    .replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  if (RESERVED.has(slug)) slug += '-site';
  return slug;
}

function withShareBar(html, mode) {
  const code = template('share.js').replace('__MODE__', mode).replace(/<\/script/gi, '<\\/script');
  const tag = `<script>\n${code}\n</script>\n`;
  const at = html.toLowerCase().lastIndexOf('</body>');
  return at < 0 ? html + tag : html.slice(0, at) + tag + html.slice(at);
}

function hubPage(sites) {
  const items = sites.map(s =>
    `<li><a href="${esc(s.slug)}.html"><strong>${esc(s.title)}</strong><span>${esc(s.file)}</span></a></li>`).join('\n');
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow, noarchive">
<title>Interner Bereich | LH.next</title>
<style>
  :root { --bg:#0b0f14; --surface:#131a23; --border:#223041; --text:#e7edf3; --dim:#9fb0c1; --accent:#ff5566; }
  @media (prefers-color-scheme: light) {
    :root { --bg:#f7f8fa; --surface:#fff; --border:#dde1e8; --text:#14181f; --dim:#454f5c; --accent:#d9364a; }
  }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif; }
  main { max-width:720px; margin:0 auto; padding:40px 16px 96px; }
  h1 { font-size:1.4rem; margin:0 0 4px; }
  h1 span { color:var(--accent); }
  p { color:var(--dim); margin:0 0 24px; }
  ul { list-style:none; margin:0; padding:0; display:grid; gap:10px; }
  a { display:grid; gap:2px; padding:14px 16px; border-radius:12px; background:var(--surface);
      border:1px solid var(--border); color:inherit; text-decoration:none; }
  a:hover, a:focus-visible { border-color:var(--accent); }
  a span { color:var(--dim); font-size:.85rem; }
</style>
</head>
<body>
<main>
  <h1>LH<span>.</span>next – Interner Bereich</h1>
  <p>${sites.length} Werkzeug${sites.length === 1 ? '' : 'e'}. In jedem Werkzeug teilt „Ergebnis teilen“ nur eine statische Momentaufnahme.</p>
  <ul>
${items || '<li><p>Noch keine Seiten in sites/ vorhanden.</p></li>'}
  </ul>
</main>
</body>
</html>`;
}

async function encrypt(html, raw, salt) {
  const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, deflateRawSync(Buffer.from(html, 'utf8'), { level: 9 }));
  const payload = JSON.stringify({ v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(new Uint8Array(ct)) });
  return template('loader.html').replace('__PAYLOAD__', () => payload);
}

async function deriveKey(password, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITER }, base, 256));
}

function askPassword(question) {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY) return reject(new Error('Kein Terminal – Passwort über LHP_PASSWORD setzen.'));
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let value = '';
    const onData = ch => {
      for (const c of ch) {
        if (c === '\r' || c === '\n') {
          stdin.setRawMode(false); stdin.pause(); stdin.off('data', onData); stdout.write('\n');
          return resolve(value);
        }
        if (c === '\u0003') { stdout.write('\n'); process.exit(130); }
        if (c === '\u007f' || c === '\b') value = value.slice(0, -1);
        else value += c;
      }
    };
    stdin.on('data', onData);
  });
}

async function main() {
  if (!existsSync(SRC)) throw new Error(`Quellordner fehlt: ${SRC}`);
  const files = readdirSync(SRC).filter(f => /\.html?$/i.test(f)).sort();
  const skipped = readdirSync(SRC).filter(f => !/\.html?$/i.test(f) && !/^readme/i.test(f) && !f.startsWith('.'));
  if (skipped.length) {
    console.warn(`Übersprungen (nur eigenständige .html-Dateien werden verschlüsselt): ${skipped.join(', ')}`);
  }

  let password = process.env.LHP_PASSWORD;
  if (!password) {
    password = await askPassword('Passwort: ');
    if (password !== await askPassword('Wiederholen: ')) throw new Error('Passwörter stimmen nicht überein.');
  }
  if (password.length < MIN_PASSWORD) {
    throw new Error(`Passwort zu kurz (mindestens ${MIN_PASSWORD} Zeichen). Die verschlüsselten Dateien sind öffentlich und offline angreifbar.`);
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const raw = await deriveKey(password, salt);

  const sites = [];
  const seen = new Set();
  for (const file of files) {
    const html = readFileSync(join(SRC, file), 'utf8');
    const slug = slugOf(file);
    if (seen.has(slug)) throw new Error(`Doppelter Seitenname nach Umwandlung: ${slug}`);
    seen.add(slug);
    sites.push({ file, slug, title: titleOf(html, slug), html });
  }

  mkdirSync(OUT, { recursive: true });
  const written = new Set(['index.html', 'v.html']);
  for (const s of sites) {
    writeFileSync(join(OUT, s.slug + '.html'), await encrypt(withShareBar(s.html, 'site'), raw, salt));
    written.add(s.slug + '.html');
  }
  writeFileSync(join(OUT, 'index.html'), await encrypt(withShareBar(hubPage(sites), 'hub'), raw, salt));
  writeFileSync(join(OUT, 'v.html'), template('viewer.html'));

  for (const f of readdirSync(OUT)) {
    if (!written.has(f)) { rmSync(join(OUT, f)); console.log(`Entfernt: p/${f}`); }
  }

  console.log(`${sites.length} Seite(n) verschlüsselt nach p/:`);
  for (const s of sites) console.log(`  p/${s.slug}.html  ←  sites/${s.file}  (${s.title})`);
}

main().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
