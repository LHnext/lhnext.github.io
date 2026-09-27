// Verschlüsselt die privaten Seiten aus sites/ nach p/.
//
//   node tools/private/build.mjs                 Passwort wird abgefragt
//   PRIVATE_PASSWORD=... node tools/private/build.mjs
//   node tools/private/build.mjs --new-password  Passwort wechseln
//
// Quellen: sites/<name>.html oder sites/<name>/index.html.
// Lokale CSS-, JS- und Bilddateien werden eingebettet, damit nichts unverschlüsselt veröffentlicht wird.

import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from 'node:crypto';
import { deflateRawSync, inflateRawSync } from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const SRC = path.join(ROOT, 'sites');
const CONFIG = path.join(HERE, 'config.json');
const RESERVED = new Set(['index', 'v']);

const MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.json': 'application/json',
};

const config = fs.existsSync(CONFIG)
  ? JSON.parse(fs.readFileSync(CONFIG, 'utf8'))
  : { outDir: 'p', iterations: 600000, salt: randomBytes(16).toString('base64') };
const OUT = path.join(ROOT, config.outDir);
const newPassword = process.argv.includes('--new-password');

const password = process.env.PRIVATE_PASSWORD || await ask('Passwort: ');
if (!password) fail('Kein Passwort angegeben.');

if (newPassword) {
  if (!process.env.PRIVATE_PASSWORD && await ask('Passwort wiederholen: ') !== password) fail('Passwörter stimmen nicht überein.');
  config.salt = randomBytes(16).toString('base64');
}
const salt = Buffer.from(config.salt, 'base64');
const key = pbkdf2Sync(password, salt, config.iterations, 32, 'sha256');

// Schutz vor Tippfehlern: neues Passwort nur mit --new-password.
const hubFile = path.join(OUT, 'index.html');
if (!newPassword && fs.existsSync(hubFile)) {
  try {
    decrypt(readPayload(fs.readFileSync(hubFile, 'utf8')));
  } catch {
    fail('Passwort passt nicht zum bestehenden Bereich. Zum Wechseln: --new-password');
  }
}

const loader = fs.readFileSync(path.join(HERE, 'loader.html'), 'utf8');
const shareJs = fs.readFileSync(path.join(HERE, 'share.js'), 'utf8');

const sites = findSites();
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.rmSync(path.join(OUT, f));

for (const site of sites) {
  let html = inline(fs.readFileSync(site.file, 'utf8'), path.dirname(site.file));
  html = inject(html, 'site');
  site.title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || site.slug).trim();
  write(`${site.slug}.html`, site.title, html);
  console.log(`  ${site.slug}.html  ←  ${path.relative(ROOT, site.file)}`);
}

write('index.html', 'Übersicht', inject(hub(sites), 'hub'));
fs.copyFileSync(path.join(HERE, 'viewer.html'), path.join(OUT, 'v.html'));
fs.writeFileSync(CONFIG, JSON.stringify(config, null, 2) + '\n');
console.log(`\n${sites.length} Seite(n) verschlüsselt nach ${config.outDir}/ (Einstieg: ${config.outDir}/index.html)`);

function findSites() {
  if (!fs.existsSync(SRC)) return [];
  const list = [];
  for (const e of fs.readdirSync(SRC, { withFileTypes: true })) {
    let slug, file;
    if (e.isFile() && e.name.endsWith('.html')) {
      slug = e.name.slice(0, -5);
      file = path.join(SRC, e.name);
    } else if (e.isDirectory() && fs.existsSync(path.join(SRC, e.name, 'index.html'))) {
      slug = e.name;
      file = path.join(SRC, e.name, 'index.html');
    } else continue;
    slug = slug.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
    if (RESERVED.has(slug)) fail(`Name "${slug}" ist reserviert – bitte umbenennen.`);
    if (list.some(s => s.slug === slug)) fail(`Doppelter Name "${slug}".`);
    list.push({ slug, file });
  }
  return list.sort((a, b) => a.slug.localeCompare(b.slug));
}

function isLocal(ref) {
  return ref && !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref);
}

function readLocal(ref, dir) {
  const file = path.resolve(dir, decodeURIComponent(ref.split(/[?#]/)[0]));
  if (!fs.existsSync(file)) {
    console.warn(`  Warnung: ${path.relative(ROOT, file)} nicht gefunden`);
    return null;
  }
  return file;
}

function dataUri(file) {
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  return `data:${type};base64,${fs.readFileSync(file).toString('base64')}`;
}

function inlineCss(css, dir) {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, ref) => {
    if (!isLocal(ref)) return m;
    const file = readLocal(ref, dir);
    return file ? `url("${dataUri(file)}")` : m;
  });
}

function inline(html, dir) {
  html = html.replace(/<link\b[^>]*>/gi, tag => {
    if (!/rel\s*=\s*["']?stylesheet/i.test(tag)) return tag;
    const ref = tag.match(/href\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!isLocal(ref)) return tag;
    const file = readLocal(ref, dir);
    return file ? `<style>\n${inlineCss(fs.readFileSync(file, 'utf8'), path.dirname(file))}\n</style>` : tag;
  });
  html = html.replace(/<script\b([^>]*)\bsrc\s*=\s*["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (tag, a, ref, b) => {
    if (!isLocal(ref)) return tag;
    const file = readLocal(ref, dir);
    if (!file) return tag;
    const js = fs.readFileSync(file, 'utf8').replace(/<\/script/gi, '<\\/script');
    return `<script${a}${b}>\n${js}\n</script>`;
  });
  html = html.replace(/(<(?:img|source|video|audio)\b[^>]*?\b(?:src|poster)\s*=\s*)(["'])([^"']+)\2/gi, (m, pre, q, ref) => {
    if (!isLocal(ref)) return m;
    const file = readLocal(ref, dir);
    return file ? `${pre}${q}${dataUri(file)}${q}` : m;
  });
  html = html.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (m, a, css) => `<style${a}>${inlineCss(css, dir)}</style>`);
  return html;
}

function inject(html, mode) {
  const script = `<script>\n${shareJs.replace("'__MODE__'", () => JSON.stringify(mode))}\n</script>`;
  if (!/<meta[^>]+name=["']robots/i.test(html)) {
    html = html.replace(/<\/head>/i, h => `<meta name="robots" content="noindex, nofollow">\n${h}`);
  }
  return /<\/body>/i.test(html) ? html.replace(/<\/body>(?![\s\S]*<\/body>)/i, () => `${script}\n</body>`) : html + script;
}

function esc(s) {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

function hub(list) {
  const items = list.length
    ? list.map(s => `<li><a href="${s.slug}.html">${esc(s.title)}</a><span>${s.slug}</span></li>`).join('\n')
    : '<li class="empty">Noch keine Seiten. Dateien in <code>sites/</code> ablegen und neu bauen.</li>';
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Übersicht | Privat</title>
<style>
  :root { --bg:#0b0f14; --surface:#131a23; --border:#223041; --text:#e7edf3; --dim:#9fb0c1; --accent:#ff5566; }
  @media (prefers-color-scheme: light) {
    :root { --bg:#f7f8fa; --surface:#fff; --border:#dde1e8; --text:#14181f; --dim:#454f5c; --accent:#d9364a; }
  }
  body { margin:0; background:var(--bg); color:var(--text); font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif; }
  main { max-width:720px; margin:0 auto; padding:48px 16px 96px; }
  h1 { font-size:1.4rem; margin:0 0 24px; }
  h1 span { color:var(--accent); }
  ul { list-style:none; margin:0; padding:0; display:grid; gap:8px; }
  li { background:var(--surface); border:1px solid var(--border); border-radius:12px; display:flex; }
  li a { flex:1; padding:14px 16px; color:inherit; text-decoration:none; font-weight:600; }
  li a:hover { color:var(--accent); }
  li span { padding:14px 16px; color:var(--dim); font-family:ui-monospace,Consolas,monospace; font-size:.85em; }
  li.empty { padding:14px 16px; color:var(--dim); }
</style>
</head>
<body>
<main>
  <h1>LH<span>.</span>next · Privater Bereich</h1>
  <ul>
${items}
  </ul>
</main>
</body>
</html>`;
}

function write(name, title, html) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(deflateRawSync(Buffer.from(html, 'utf8'))), cipher.final(), cipher.getAuthTag()]);
  const payload = JSON.stringify({ v: 1, salt: config.salt, iter: config.iterations, iv: iv.toString('base64'), ct: ct.toString('base64') });
  fs.writeFileSync(path.join(OUT, name), loader.replace('__PAYLOAD__', () => payload));
}

function readPayload(page) {
  return JSON.parse(page.match(/<script type="application\/json" id="payload">([\s\S]*?)<\/script>/)[1]);
}

function decrypt(p) {
  const ct = Buffer.from(p.ct, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(p.iv, 'base64'));
  decipher.setAuthTag(ct.subarray(-16));
  return inflateRawSync(Buffer.concat([decipher.update(ct.subarray(0, -16)), decipher.final()])).toString('utf8');
}

function ask(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = s => { if (s.includes(question)) process.stdout.write(s); };
    rl.question(question, answer => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

function fail(msg) {
  console.error(msg);
  process.exit(1);
}
