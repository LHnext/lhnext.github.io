# Geplante Erweiterung: WordPress + WooCommerce

**Status: inaktiv / nur Planung.** Es ist aktuell nichts von diesem Plan live oder eingebunden. Die Website läuft weiterhin komplett statisch über GitHub Pages mit dem Anfrage-Warenkorb in `shop.html`.

## Warum das nicht "einfach dazu geschaltet" werden kann

WordPress + WooCommerce brauchen einen echten Server mit PHP und einer MySQL-Datenbank. GitHub Pages liefert nur statische Dateien (HTML/CSS/JS) aus und kann kein PHP ausführen. Ein "Plugin", das man in dieses Repository einbaut, gibt es dafür nicht — WooCommerce ist selbst ein Plugin *für eine bestehende WordPress-Installation*, kein eigenständiges Skript.

## Migrationsschritte, wenn es so weit ist

1. **Hosting wählen**: Anbieter mit PHP 8+/MySQL, idealerweise "Managed WordPress" (z. B. Raidboxes, IONOS, all-inkl) — spart Wartungsaufwand gegenüber selbst verwaltetem Server.
2. **WordPress + WooCommerce installieren**, deutsches Rechts-Plugin-Set einrichten (z. B. für Rechtstexte-Einbindung, Cookie-Consent falls dann Tracking/Analytics dazukommt).
3. **Produkte anlegen**: Die Leistungen aus `shop.html` (Steuergeräte-Codierung, SFD-/SFD2-Freischaltung, Diagnose, VCDS-/VCP-Schulungen) als WooCommerce-Produkte übertragen — mit den dann finalen echten Preisen statt der aktuellen `[PREIS ERGÄNZEN]`-Platzhalter.
4. **Zahlungsanbieter einrichten**: z. B. offizielles WooCommerce-Stripe- oder PayPal-Plugin. Wichtig: Bestell-Button muss nach § 312j BGB eindeutig mit "zahlungspflichtig bestellen" (oder vergleichbar) beschriftet sein (Button-Lösung).
5. **Rechtstexte erweitern**: Die bestehenden Entwürfe (`agb.html`, `widerruf.html`, `datenschutz.html`) müssen für einen echten Bestellprozess mit automatischer Zahlungsabwicklung ergänzt werden (Bestellbestätigung per E-Mail, Zahlungsabwickler als zusätzlicher Auftragsverarbeiter in der Datenschutzerklärung, ggf. Versandkosten/-bedingungen). Erneute rechtliche Prüfung nötig — die aktuellen Entwürfe sind auf das Anfrage-Modell ohne Online-Zahlung zugeschnitten.
6. **Hosting-Strategie festlegen**: Entweder komplette Migration der Seite auf den neuen WordPress-Server, oder Betrieb parallel unter einer Subdomain (z. B. `shop.lhcoding.de`), während die Hauptseite weiter statisch auf GitHub Pages bleibt. Bei einer Subdomain-Lösung braucht es einen eigenen Domain-/DNS-Eintrag (GitHub Pages allein reicht dafür nicht).
7. **Verlinkung**: Sobald aktiv, `shop.html` durch einen Verweis/Redirect auf den echten Shop ersetzen oder ergänzen.

## Voraussetzung für die Aktivierung

- Preise final festgelegt
- Rechtstexte für den echten Bestellprozess von einem Anwalt/Steuerberater geprüft
- Entscheidung für Hosting-Anbieter und Zahlungsanbieter getroffen
