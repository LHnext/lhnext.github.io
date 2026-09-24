# Roadmap — nächste Schritte

Stand: 2026-09-24. Diese Datei sammelt die nächsten Schritte für LHTech (technischer Name `lhnext`, vormals `lhcoding59348`).

## 1. Rename abschließen (lhcoding59348 → lhnext)

- [ ] Neue GitHub-Organisation `lhnext` anlegen
- [ ] Darin Repository `lhnext.github.io` anlegen (exakter Name nötig für eigene `*.github.io`-Domain)
- [ ] Lokales Remote ist bereits auf `https://github.com/lhnext/lhnext.github.io.git` gesetzt — nach Repo-Anlage: `git push -u origin main`
- [ ] GitHub Pages prüfen: Settings → Pages → Source = `main` / `/ (root)`
- [ ] Alte Organisation/Domain `lhcoding59348.github.io` nach erfolgreichem Umzug stilllegen oder als Weiterleitungshinweis stehen lassen
- [ ] Lokalen Projektordner von `Website_LHTech` auf `Website_LHnext` umbenennen (nach Repo-Umzug, siehe Hinweis unten)
- [ ] Prüfen, ob Kontakt-E-Mail `lhcoding59348@gmail.com` langfristig auf eine `lhnext`- oder `lhtech`-Adresse umgestellt werden soll (aktuell bewusst unverändert, da echter Account)

## 2. Vor Live-Gang (bestehende offene Punkte)

- [ ] Echte Preise in `shop.html` eintragen (`[PREIS ERGÄNZEN]`-Platzhalter ersetzen)
- [ ] `agb.html` von Anwalt/Steuerberater prüfen lassen (Haftungsklauseln, Zahlungsfristen)
- [ ] `widerruf.html` von Anwalt/Steuerberater prüfen lassen (Fristbeginn, vorzeitiges Erlöschen)
- [ ] Kleinunternehmer-Umsatzgrenzen im Auge behalten (§ 19 Abs. 1 UStG)

## 3. WooCommerce-Projekt (`woocommerce/`) — weiterhin inaktiv

- [ ] Hosting-Anbieter wählen (Managed WordPress, PHP 8+/MySQL)
- [ ] Zahlungsanbieter entscheiden (Stripe/PayPal via WooCommerce-Plugin)
- [ ] Rechtstexte für echten Bestellprozess erweitern (siehe `woocommerce/README.md`)
- [ ] Erst nach Preisfestlegung + rechtlicher Prüfung aktivieren — keine Verlinkung vom Hauptmenü, bis alle Voraussetzungen erfüllt sind

## 4. Danach (mittelfristig)

- [ ] Werkzeuge-Seite um weitere Systeme ergänzen (aktuell nur VCDS/VCP, ODIS als Platzhalter)
- [ ] Portfolio mit echten Beispielprojekten füllen
- [ ] Entscheidung: eigene Domain (z. B. `lhtech.de`) statt `*.github.io`, DNS-Konfiguration falls ja
