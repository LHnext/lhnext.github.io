# LHCoding — Website

Statische Website für LHCoding (Kleingewerbe von Nils Wiesmann, seit 2016): Fahrzeug-Codierungen, SFD/SFD2-Freischaltung, Diagnosedienstleistungen und VCDS-/VCP-Schulungen für den Volkswagen-Konzern.

## Struktur

- `index.html` — Startseite
- `shop.html` — Leistungsverzeichnis mit Preisen und Anfrageformular (mailto-basiert, kein Server/Zahlungsanbieter nötig)
- `impressum.html` — Impressum
- `datenschutz.html` — Datenschutzerklärung
- `agb.html` — Allgemeine Geschäftsbedingungen (Muster-Entwurf, siehe Hinweis unten)
- `widerruf.html` — Widerrufsbelehrung + Muster-Widerrufsformular (Muster-Entwurf, siehe Hinweis unten)
- `css/style.css`, `js/script.js` — Styles, E-Mail-Verschleierung, Anfrageformular-Logik
- `.nojekyll` — deaktiviert die Jekyll-Verarbeitung auf GitHub Pages

## Wichtig: Vor dem Live-Gang zu erledigen

1. **Preise eintragen:** In `shop.html` alle `[PREIS ERGÄNZEN]`-Platzhalter durch echte Preise ersetzen.
2. **AGB & Widerrufsbelehrung prüfen lassen:** `agb.html` und `widerruf.html` sind Muster-Entwürfe auf Basis gängiger Standardklauseln bzw. des gesetzlichen Musters. Sie **ersetzen keine individuelle Rechtsberatung** — vor Verwendung von einem Rechtsanwalt oder Steuerberater prüfen lassen, insbesondere:
   - Haftungsklauseln und Zahlungsfristen in der AGB
   - Fristbeginn und vorzeitiges Erlöschen des Widerrufsrechts in der Widerrufsbelehrung
3. **Rechnungsstellung:** Kleinunternehmerregelung (§ 19 Abs. 1 UStG) ist berücksichtigt (keine USt ausgewiesen) — bei Überschreiten der Kleinunternehmer-Umsatzgrenzen mit Steuerberater abstimmen.

## Funktionsprinzip Shop

Es handelt sich bewusst **nicht** um einen Online-Shop mit direkter Zahlungsabwicklung — eine statische GitHub-Pages-Seite kann keine Zahlungen selbst verarbeiten. Stattdessen:

1. Kunde wählt eine Leistung in `shop.html` und sendet eine unverbindliche Anfrage über das Formular (öffnet das lokale E-Mail-Programm, es werden keine Daten an einen Server übertragen).
2. LHCoding bestätigt Auftrag, Preis und Termin manuell per E-Mail — erst hier kommt der Vertrag zustande (siehe `agb.html`, § 2).
3. Abrechnung erfolgt klassisch per Rechnung/Überweisung.

Das ist rechtlich einfacher und günstiger als ein echtes Zahlungs-Backend, erfordert aber manuelle Auftragsbestätigung durch LHCoding.

## Lokal ansehen

Einfach `index.html` im Browser öffnen, oder z. B. mit:

```
npx serve .
```

## Veröffentlichen mit GitHub Pages

1. Neues Repository auf GitHub anlegen, z. B. `lhcoding` unter dem Account `nirvananils`.
2. In diesem Ordner:

   ```
   git init
   git add .
   git commit -m "Initial commit: LHCoding Website"
   git branch -M main
   git remote add origin https://github.com/nirvananils/lhcoding.git
   git push -u origin main
   ```

3. Auf GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, Branch `main`, Ordner `/ (root)` auswählen und speichern.
4. Nach kurzer Zeit ist die Seite unter `https://nirvananils.github.io/lhcoding/` erreichbar.
