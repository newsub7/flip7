# Flip 7 Punktezähler – Installationsanleitung

Eine Web-App (PWA), die sich wie eine echte App auf deinem Android-Handy installieren lässt – inklusive Offline-Nutzung.

## Was ist enthalten
- `index.html`, `style.css`, `app.js` – die App selbst
- `manifest.json`, `service-worker.js` – machen die App installierbar & offline-fähig
- `icon-192.png`, `icon-512.png`, `icon-512-maskable.png` – App-Icons

## Funktionsumfang
- Spieler hinzufügen, umbenennen, entfernen
- Runde für Runde Punkte eintragen: Summe der Zahlenkarten, Modifikatoren, Flip-7-Bonus (+15), Bust-Button
- Automatische Gesamtstand-Berechnung, sortiert nach Punkten
- Rundenverlauf mit Aufschlüsselung pro Spieler
- Sieger-Erkennung, sobald die Zielpunktzahl (Standard 200, änderbar) erreicht ist
- Alle Daten bleiben lokal auf dem Gerät gespeichert (localStorage) – keine Internetverbindung nötig, keine Cloud

### Regelwerke (unter dem Zahnrad-Symbol einstellbar)
- **Klassisch** – das Original: x2-Karte, Modifikatoren +2 bis +10
- **With a Vengeance** – die Erweiterung: ÷2-Karte (rundet ab), Modifikatoren −2 bis −10, Null-Karte (Score wird 0 außer durch Flip-7-Bonus)
- **Kombiniert** – beide Kartensets gleichzeitig aktiv, falls ihr die Decks mischt

Zusätzlich gibt es den optionalen **Brutal Mode** (nur bei Vengeance/Kombiniert wählbar):
- Rundenpunkte dürfen negativ werden (normalerweise wird bei 0 gedeckelt)
- Der Flip-7-Bonus kann statt an einen selbst mit −15 Punkten an einen Gegner vergeben werden

Die Berechnungsreihenfolge folgt den offiziellen Regeln: Null-Karte übersteuert alles → x2 → ÷2 (abgerundet) → Modifikatoren addieren/subtrahieren → Deckelung bei 0 (außer Brutal Mode) → Flip-7-Bonus zum Schluss.

**Hinweis zu Sonderkarten der Erweiterung:** "Lucky 13" und "Unlucky 7" sowie die Action-Karten (Swap, Steal, Discard, Flip Four, Just One More) werden beim physischen Spielen am Tisch aufgelöst. Du trägst danach einfach die finale Summe eurer Zahlenkarten ein – die App muss diese Kartenaktionen nicht selbst nachbilden.

## Installation auf dem Android-Handy

Damit "Zum Startbildschirm hinzufügen" und Offline-Nutzung funktionieren, muss die App über **http(s)** aufgerufen werden (nicht als lokale Datei). Am einfachsten geht das kostenlos über GitHub Pages:

### Option A: GitHub Pages (empfohlen, kostenlos, dauerhaft)
1. Erstelle ein kostenloses Konto auf github.com (falls noch nicht vorhanden).
2. Erstelle ein neues Repository, z. B. `flip7-zaehler`.
3. Lade alle Dateien aus diesem Ordner in das Repository hoch ("Add file" → "Upload files").
4. Gehe zu **Settings → Pages**, wähle als Quelle den `main`-Branch und Ordner `/root`, speichern.
5. Nach ca. 1 Minute ist die App erreichbar unter `https://DEIN-NUTZERNAME.github.io/flip7-zaehler/`.
6. Öffne diesen Link auf dem Android-Handy in **Chrome** → Menü (⋮) → **"Zum Startbildschirm hinzufügen"** (bzw. "App installieren").

### Option B: Netlify Drop (noch schneller, ohne Konto nötig für den Test)
1. Gehe auf dem PC zu `app.netlify.com/drop`.
2. Ziehe den gesamten `flip7-zaehler`-Ordner in das Browserfenster.
3. Du erhältst sofort eine Live-URL – auf dem Handy öffnen und wie oben installieren.

### Option C: Im eigenen WLAN testen (ohne Upload)
1. Auf dem PC im Ordner ein Terminal öffnen und ausführen: `python3 -m http.server 8080`
2. Sicherstellen, dass Handy und PC im selben WLAN sind.
3. Auf dem Handy im Chrome-Browser die IP-Adresse des PCs aufrufen, z. B. `http://192.168.1.23:8080`
4. Funktioniert zum Testen, aber ohne HTTPS ist "Zum Startbildschirm hinzufügen" auf manchen Android-Versionen eingeschränkt (Offline-Funktion kann fehlen). Für den Dauereinsatz daher Option A oder B nutzen.

## Hinweis zu den Daten
Die Punktestände werden ausschließlich lokal im Browser des Geräts gespeichert. Bei "Browserdaten löschen" oder Neuinstallation gehen sie verloren. Ein Cloud-Sync ist bewusst nicht enthalten (Datenschutz, Einfachheit) – bei Bedarf kann ich das nachrüsten.
