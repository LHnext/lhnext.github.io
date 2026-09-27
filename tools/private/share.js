// Wird beim Build in jede private Seite eingefügt (nach dem Entschlüsseln aktiv).
// Erzeugt eine statische Momentaufnahme ohne Skripte und teilt sie über p/v.html.
// Markierungen in den Seiten:
//   data-share-root    – nur diese Elemente teilen (sonst die ganze Seite)
//   data-share-exclude – Element nie teilen (z. B. Eingabebereich, Referenzdaten)
(() => {
  const MODE = '__MODE__';
  const VIEWER = new URL('v.html', location.href).href;
  const HUB = new URL('./', location.href).href;
  const LINK_WARN = 30000;

  const host = document.createElement('lhp-bar');
  host.setAttribute('data-share-exclude', '');
  const ui = host.attachShadow({ mode: 'open' });
  ui.innerHTML = `
<style>
  :host { all: initial; }
  .bar { position: fixed; right: 16px; bottom: 16px; z-index: 2147483647; display: flex; gap: 6px;
         font: 600 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
  button, a { all: unset; cursor: pointer; padding: 9px 12px; border-radius: 8px; background: #131a23;
         color: #e7edf3; border: 1px solid #223041; box-shadow: 0 4px 14px rgba(0,0,0,.25); }
  .primary { background: #ff5566; border-color: #ff5566; color: #fff; }
  .modal { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center;
           background: rgba(0,0,0,.55); padding: 16px; font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
  .modal[hidden] { display: none; }
  .box { width: 100%; max-width: 460px; background: #131a23; color: #e7edf3; border: 1px solid #223041;
         border-radius: 14px; padding: 20px; display: grid; gap: 12px; }
  .box h2 { margin: 0; font-size: 16px; }
  .box p { margin: 0; color: #9fb0c1; }
  .warn { color: #ffb454 !important; }
  .actions { display: flex; flex-wrap: wrap; gap: 6px; }
  .actions button { font-weight: 600; }
</style>
<div class="bar">
  ${MODE === 'hub' ? '' : '<a id="hub">Übersicht</a><button id="share" class="primary">Ergebnis teilen</button>'}
  <button id="lock">Sperren</button>
</div>
<div class="modal" id="modal" hidden>
  <div class="box" role="dialog" aria-modal="true" aria-labelledby="t">
    <h2 id="t">Ergebnis teilen</h2>
    <p>Geteilt wird eine statische Momentaufnahme ohne Programmlogik. Empfänger sehen nur das Ergebnis.</p>
    <p id="info"></p>
    <div class="actions">
      <button id="copy" class="primary">Link kopieren</button>
      <button id="native" hidden>Teilen …</button>
      <button id="download">HTML-Datei</button>
      <button id="preview">Vorschau</button>
      <button id="close">Schließen</button>
    </div>
  </div>
</div>`;
  document.body.appendChild(host);

  const $ = id => ui.getElementById(id);
  let current = null;

  $('lock').onclick = () => {
    try {
      for (const s of [sessionStorage, localStorage]) {
        Object.keys(s).filter(k => k.startsWith('lhp-key-')).forEach(k => s.removeItem(k));
      }
    } catch {}
    location.reload();
  };
  if (MODE === 'hub') return;

  $('hub').href = HUB;
  $('close').onclick = () => { $('modal').hidden = true; };
  $('share').onclick = async () => {
    $('share').textContent = 'Wird erstellt …';
    try {
      const html = snapshot();
      const link = VIEWER + '#v1.' + await pack(html);
      current = { html, link };
      const kb = n => (n / 1024).toFixed(1) + ' KB';
      $('info').textContent = `Linklänge: ${kb(link.length)}` +
        (link.length > LINK_WARN ? ' – sehr lang, manche Messenger kürzen Links. Dann besser die HTML-Datei senden.' : '');
      $('info').className = link.length > LINK_WARN ? 'warn' : '';
      ['copy', 'download', 'preview'].forEach(id => { $(id).hidden = false; });
      $('native').hidden = !navigator.share;
      $('copy').textContent = 'Link kopieren';
      $('modal').hidden = false;
    } catch (e) {
      alertInline('Momentaufnahme fehlgeschlagen: ' + e.message);
    } finally {
      $('share').textContent = 'Ergebnis teilen';
    }
  };
  $('copy').onclick = async () => {
    try {
      await navigator.clipboard.writeText(current.link);
      $('copy').textContent = 'Kopiert ✓';
    } catch {
      $('copy').textContent = 'Kopieren blockiert – „Vorschau“ öffnen und Adresse kopieren';
    }
  };
  $('native').onclick = () => navigator.share({ title: document.title, url: current.link }).catch(() => {});
  $('preview').onclick = () => window.open(current.link, '_blank', 'noopener');
  $('download').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([current.html], { type: 'text/html' }));
    a.download = (document.title || 'ergebnis').replace(/[^\w\-äöüÄÖÜß ]+/g, '').trim() + '.html';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  function alertInline(msg) {
    $('info').textContent = msg;
    $('info').className = 'warn';
    ['copy', 'native', 'download', 'preview'].forEach(id => { $(id).hidden = true; });
    $('modal').hidden = false;
  }

  function snapshot() {
    const clone = document.documentElement.cloneNode(true);
    const orig = document.documentElement.querySelectorAll('*');
    const copy = clone.querySelectorAll('*');

    // Live-Zustand (Eingaben, Auswahl, Canvas) in die Kopie übernehmen.
    orig.forEach((o, i) => {
      const c = copy[i];
      if (o instanceof HTMLInputElement) {
        if (o.type === 'checkbox' || o.type === 'radio') c.toggleAttribute('checked', o.checked);
        else if (o.type === 'password' || o.type === 'file') c.removeAttribute('value');
        else c.setAttribute('value', o.value);
      } else if (o instanceof HTMLTextAreaElement) {
        c.textContent = o.value;
      } else if (o instanceof HTMLSelectElement) {
        [...o.options].forEach((opt, j) => c.options[j].toggleAttribute('selected', opt.selected));
      } else if (o instanceof HTMLCanvasElement) {
        const img = document.createElement('img');
        try { img.src = o.toDataURL(); } catch {}
        for (const a of ['class', 'style', 'width', 'height', 'id']) if (o.hasAttribute(a)) img.setAttribute(a, o.getAttribute(a));
        c.replaceWith(img);
      } else if (o instanceof HTMLImageElement && o.currentSrc) {
        c.setAttribute('src', o.currentSrc);
        c.removeAttribute('srcset');
      } else if (o instanceof HTMLAnchorElement && o.hasAttribute('href')) {
        c.setAttribute('href', o.href);
      }
    });

    const head = clone.querySelector('head');
    const body = clone.querySelector('body');

    // Optional nur markierte Bereiche teilen.
    const roots = body.querySelectorAll('[data-share-root]');
    if (roots.length) body.replaceChildren(...roots);

    clone.querySelectorAll('script, noscript, template, iframe, object, embed, frame, frameset, base, ' +
      'meta[http-equiv], link, style, [data-share-exclude]').forEach(el => el.remove());

    for (const el of [clone, ...clone.querySelectorAll('*')]) {
      for (const { name, value } of [...el.attributes]) {
        if (/^on/i.test(name) || /^\s*javascript:/i.test(value)) el.removeAttribute(name);
      }
      if (el.matches('input, select, textarea, button')) el.setAttribute('inert', '');
    }

    // Aktuell wirksames CSS einsammeln (inkl. zur Laufzeit erzeugter Regeln).
    const css = [];
    const sheets = [...document.styleSheets, ...(document.adoptedStyleSheets || [])];
    for (const sheet of sheets) {
      if (sheet.ownerNode && sheet.ownerNode.closest && sheet.ownerNode.closest('[data-share-exclude]')) continue;
      try {
        css.push([...sheet.cssRules].map(r => r.cssText).join('\n'));
      } catch {
        if (sheet.href) {
          const l = document.createElement('link');
          l.rel = 'stylesheet';
          l.href = sheet.href;
          head.appendChild(l);
        }
      }
    }
    const style = document.createElement('style');
    style.textContent = css.join('\n');

    const meta = (attrs) => {
      const m = document.createElement('meta');
      for (const k in attrs) m.setAttribute(k, attrs[k]);
      return m;
    };
    const base = document.createElement('base');
    base.target = '_blank';
    head.prepend(
      meta({ charset: 'UTF-8' }),
      meta({ 'http-equiv': 'Content-Security-Policy',
             content: "default-src 'none'; img-src data: https:; style-src 'unsafe-inline' https:; font-src data: https:" }),
      meta({ name: 'viewport', content: 'width=device-width, initial-scale=1.0' }),
      meta({ name: 'robots', content: 'noindex, nofollow' }),
      base
    );
    head.appendChild(style);

    return '<!DOCTYPE html>\n' + clone.outerHTML;
  }

  async function pack(text) {
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
})();
