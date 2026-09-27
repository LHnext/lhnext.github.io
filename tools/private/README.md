# Geschützter Bereich (`/p/`)

Nicht verlinkter, passwortgeschützter Bereich für interne Werkzeuge (z. B. VCDS Debug Parser).
Jedes Werkzeug hat eine Leiste „Ergebnis teilen“, die nur eine statische Momentaufnahme weitergibt –
Empfänger sehen das Ergebnis, können das Werkzeug aber nicht selbst benutzen.

## Funktionsweise

- **Quellen:** `sites/*.html` im Repo-Root, Klartext, per `.gitignore` ausgeschlossen. Wird nie committet.
- **Build:** `tools/private/build.mjs` verschlüsselt jede Seite mit AES-256-GCM
  (Schlüssel per PBKDF2-SHA-256, 600 000 Iterationen) und schreibt nach `p/`:
  - `p/index.html` – verschlüsselte Übersicht aller Werkzeuge
  - `p/<name>.html` – verschlüsseltes Werkzeug mit eingebauter Teilen-Leiste (`share.js`)
  - `p/v.html` – öffentlicher Viewer für geteilte Ergebnisse
- **Öffnen:** `https://www.lhnext.de/p/` → Passwort eingeben → Übersicht. Ein Login gilt für alle
  Seiten desselben Builds (pro Tab; optional „Auf diesem Gerät merken“). „Sperren“ löscht den Schlüssel.
- **Teilen:** Momentaufnahme des aktuellen Zustands (DOM + wirksames CSS, Canvas als Bild),
  ohne Skripte, Event-Handler, Formulare und Teilen-Leiste. Wird komprimiert in den `#`-Teil
  des Links gepackt (`p/v.html#v1.…`) – der Teil nach `#` wird nie an den Server gesendet.
  Der Viewer zeigt sie in einem Sandbox-iframe ohne Skriptausführung. Alternativ „HTML-Datei“
  herunterladen und direkt versenden (sinnvoll ab ca. 30 KB Linklänge).

## Neues Werkzeug hinzufügen

1. Eigenständige HTML-Datei (CSS/JS inline, keine lokalen Zusatzdateien) nach `sites/` legen.
   Andere Dateitypen werden übersprungen und nicht veröffentlicht.
2. Optional in der Seite markieren, was geteilt wird:
   - `data-share-root` – nur diese Elemente teilen (z. B. Ergebnisbereich)
   - `data-share-exclude` – Element nie teilen (z. B. Upload-Bereich, Filter, Rohdaten)
3. Build ausführen (Repo-Root):

   ```
   node tools/private/build.mjs
   ```

   Passwort wird abgefragt (mindestens 12 Zeichen). Alternativ Umgebungsvariable `LHP_PASSWORD`.
4. `p/` committen und pushen. Nach jedem Build gilt ein neues Salt – gemerkte Logins müssen
   einmal neu eingegeben werden. Seiten, die nicht mehr in `sites/` liegen, entfernt der Build aus `p/`.

## Grenzen

- GitHub Pages ist statisch und öffentlich: Die verschlüsselten Dateien kann jeder herunterladen
  und offline Passwörter durchprobieren. Schutz = Passwortstärke. Langes, zufälliges Passwort
  verwenden (z. B. aus einem Passwortmanager).
- Wer ein geteiltes Ergebnis hat, kann es weitergeben. Enthaltene Daten (z. B. VIN) daher vor dem
  Teilen per `data-share-exclude` ausblenden, wenn sie nicht raus sollen.
- `p/v.html` rendert jeden gültigen Link. Ein Dritter könnte eigene Inhalte unter der Domain
  anzeigen lassen – ohne Skripte und ohne Formulare, aber mit Links.
