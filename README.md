# LH.next — Website

Statische Website für LH.next (Kleingewerbe von Nils Wiesmann, seit 2016): Diagnose, Reverse Engineering, SFD/SFD2-Freischaltung, Fahrzeug-Codierungen und Schulungen (Schwerpunkt SFD, SFD2, UNECE R155/R156) für den Volkswagen-Konzern.

> Hinweis: Der Markenname ist LH.next; die GitHub-Organisation und Domain heißen technisch `lhnext`.

## Struktur

- `index.html` — Startseite
- `ueber-uns.html` — Über uns (Firmengeschichte, klare Abgrenzung zu Auto-Intern/vcds.de)
- `werkzeuge.html` — Werkzeuge & Systeme (VCDS, VCP, ODIS, SFD/SFD2 im Detail)
- `portfolio.html` — Beispielhafte Projektarten
- `shop.html` — Leistungsverzeichnis mit Preisen, Warenkorb und Anfrageformular (mailto-basiert, kein Server/Zahlungsanbieter nötig)
- `img/*.svg` — eigene, abstrakte Illustrationen (keine Fotos)
- `impressum.html` — Impressum
- `datenschutz.html` — Datenschutzerklärung
- `agb.html` — Allgemeine Geschäftsbedingungen (Muster-Entwurf, siehe Hinweis unten)
- `widerruf.html` — Widerrufsbelehrung + Muster-Widerrufsformular (Muster-Entwurf, siehe Hinweis unten)
- `css/style.css`, `js/script.js` — Styles (inkl. Light/Dark-Mode-Umschalter, per Klick änderbar und in `localStorage` gemerkt), E-Mail-Verschleierung, Warenkorb- und Anfrageformular-Logik
- `js/consent.js` — Cookie-Banner und Google Analytics 4. GA wird erst nach Klick auf „Akzeptieren“ geladen; Entscheidung im `localStorage` (`lhnext_consent`, 12 Monate gültig), änderbar über den automatisch im Footer eingefügten Link „Cookie-Einstellungen“. Mess-ID steht in `GA_MEASUREMENT_ID` (aktuell `G-7SW473HGED`); mit dem Platzhalter `G-XXXXXXXXXX` bleiben Banner und Tracking aus.
- `woocommerce/` — separates Projekt für eine spätere WordPress+WooCommerce-Anbindung (eigener Ordner, aktuell inaktiv/nicht verlinkt, siehe unten)
- `p/`, `tools/private/` — verschlüsselter privater Bereich und dessen Build-Werkzeug (siehe unten); Quellen in `sites/` sind nicht im Repo
- `.nojekyll` — deaktiviert die Jekyll-Verarbeitung auf GitHub Pages

## Wichtig: Vor dem Live-Gang zu erledigen

1. **Preise:** In `shop.html` stehen aktuell alle Leistungen auf „Preis auf Anfrage“ bzw. „Nach Absprache“ — bei Bedarf durch feste Preise ersetzen.
2. **AGB & Widerrufsbelehrung prüfen lassen:** `agb.html` und `widerruf.html` sind Muster-Entwürfe auf Basis gängiger Standardklauseln bzw. des gesetzlichen Musters. Sie **ersetzen keine individuelle Rechtsberatung** — vor Verwendung von einem Rechtsanwalt oder Steuerberater prüfen lassen, insbesondere:
   - Haftungsklauseln und Zahlungsfristen in der AGB
   - Fristbeginn und vorzeitiges Erlöschen des Widerrufsrechts in der Widerrufsbelehrung
3. **Rechnungsstellung:** Kleinunternehmerregelung (§ 19 Abs. 1 UStG) ist berücksichtigt (keine USt ausgewiesen) — bei Überschreiten der Kleinunternehmer-Umsatzgrenzen mit Steuerberater abstimmen.

## Funktionsprinzip Shop

Es handelt sich bewusst **nicht** um einen Online-Shop mit direkter Zahlungsabwicklung — eine statische GitHub-Pages-Seite kann keine Zahlungen selbst verarbeiten. Stattdessen:

1. Kunde sammelt eine oder mehrere Leistungen in `shop.html` über den Warenkorb (Button "In den Warenkorb", unten rechts als Widget sichtbar) — rein clientseitig im `localStorage` des Browsers, keine Serverübertragung.
2. Über "Zur Anfrage" springt man zum Anfrageformular, der Warenkorb-Inhalt wird automatisch in die Anfrage übernommen.
3. Beim Absenden öffnet sich das lokale E-Mail-Programm mit einer vorausgefüllten, unverbindlichen Anfrage — es werden keine Daten an einen Server übertragen.
4. LH.next bestätigt Auftrag, Preis und Termin manuell per E-Mail — erst hier kommt der Vertrag zustande (siehe `agb.html`, § 2).
5. Abrechnung erfolgt klassisch per Rechnung/Überweisung.

Das ist rechtlich einfacher und günstiger als ein echtes Zahlungs-Backend, erfordert aber manuelle Auftragsbestätigung durch LH.next. Für eine echte Online-Zahlung siehe `woocommerce/README.md` (aktuell nicht aktiviert).

## Privater Bereich (`p/`)

Nicht verlinkter, passwortgeschützter Bereich für eigene Analyse-Werkzeuge. Da GitHub Pages rein statisch ist und das Repository öffentlich ist, schützt kein Server die Seiten, sondern Verschlüsselung:

- Quellseiten liegen in `sites/` (`sites/<name>.html` oder `sites/<name>/index.html`). Der Ordner steht in `.gitignore` und wird **nie** committet.
- `node tools/private/build.mjs` fragt das Passwort ab, bettet lokale CSS-, JS- und Bilddateien ein und schreibt pro Seite eine AES-256-GCM-verschlüsselte Datei nach `p/<name>.html` sowie eine verschlüsselte Übersicht `p/index.html`. Schlüsselableitung: PBKDF2-SHA-256, 600.000 Iterationen, Salt in `tools/private/config.json`.
- Im Browser wird nach Passworteingabe lokal entschlüsselt. Optional „Auf diesem Gerät merken“ (Schlüssel im `localStorage`), sonst nur für die Browser-Sitzung. „Sperren“ löscht den gespeicherten Schlüssel.
- Das Passwort muss bei jedem Build gleich sein; ein abweichendes Passwort bricht ab. Wechsel mit `--new-password`. Alte Versionen bleiben in der Git-Historie mit dem alten Passwort lesbar.
- Seiten dürfen keine weiteren Dateien zur Laufzeit nachladen (`fetch('daten.json')` o. Ä.), da diese sonst unverschlüsselt veröffentlicht werden müssten.

**Teilen:** Jede private Seite erhält unten rechts „Ergebnis teilen“. Erzeugt wird eine statische Momentaufnahme des aktuellen Zustands ohne Skripte und ohne Event-Handler; Eingabefelder werden eingefroren, Canvas-Grafiken als Bild übernommen. Der Link zeigt auf `p/v.html`, die Momentaufnahme steckt komprimiert im `#`-Teil der URL (wird nicht an den Server übertragen) und wird in einem sandboxed `iframe` ohne Skriptausführung angezeigt. Alternativ lässt sie sich als HTML-Datei herunterladen. Steuerung in den Quellseiten:

- `data-share-root` — nur diese Elemente teilen (z. B. den Ergebnisbereich)
- `data-share-exclude` — Element nie teilen (z. B. Eingabemaske, eingebettete Referenzdaten)

## Lokal ansehen

Einfach `index.html` im Browser öffnen, oder z. B. mit:

```
npx serve .
```

## Veröffentlichen mit GitHub Pages

Da für den persönlichen Account `nirvananils.github.io` eine Custom Domain (`nilswiesmann.net`) hinterlegt ist, würde jede Unterseite unter `nirvananils.github.io/*` — auch die von LH.next — automatisch mit dorthin umgeleitet. Deshalb läuft LH.next über eine eigene, kostenlose GitHub-Organisation (technischer Name `lhnext`):

1. Organisation `lhnext` auf GitHub angelegt.
2. Darin ein Repository angelegt, das exakt `lhnext.github.io` heißt (nur dieser exakte Name ergibt eine eigene `*.github.io`-Domain).
3. Lokales Repo darauf verbunden:

   ```
   git remote add origin https://github.com/lhnext/lhnext.github.io.git
   git push -u origin main
   ```

4. Für Repos mit dem Namensmuster `<name>.github.io` aktiviert GitHub Pages sich in der Regel automatisch; falls nicht, unter **Settings → Pages → Build and deployment → Source: Deploy from a branch**, Branch `main`, Ordner `/ (root)` einstellen.
5. Die Seite ist unter `https://lhnext.github.io/` erreichbar — unabhängig von `nirvananils.github.io`/`nilswiesmann.net`.
