# Flip 7 Punktezähler – Angular Edition

Punkte-Tracker für das Kartenspiel Flip 7 (inkl. der Erweiterung „With a Vengeance“) als
installierbare Progressive Web App (PWA). Gebaut mit **Angular 22** (Standalone Components,
Signals, zoneless Change Detection) und deploybar auf **GitHub Pages**.

## Funktionsumfang

- Spieler hinzufügen, umbenennen, entfernen
- Regelwerke: Klassisch / With a Vengeance / Kombiniert (unter dem Zahnrad-Symbol)
- Brutal Mode (negative Rundenpunkte, Flip-7-Bonus einem Gegner abziehen)
- Rundenverlauf mit Aufschlüsselung, automatische Sieger-Erkennung
- Als PWA installierbar (Android & iOS), Daten bleiben lokal auf dem Gerät (`localStorage`)

## Projektstruktur

```
flip7/
├── src/
│   ├── types.ts                Typdefinitionen (Player, Round, GameState, ...)
│   ├── logic.ts                 Reine Punkteberechnung, Speichern/Laden (framework-unabhängig)
│   ├── logic.spec.ts            Unit-Tests für die Punktelogik
│   ├── main.ts                 Angular-Einstiegspunkt (bootstrapApplication)
│   ├── styles.css               Globales Design
│   ├── index.html               HTML-Shell (Manifest, Icons, Fonts)
│   └── app/
│       ├── app.ts / app.html    Root-Komponente, verdrahtet alle Komponenten
│       ├── app.config.ts        Angular Application Providers
│       ├── game-state.service.ts        Zustandsverwaltung (Signals) + localStorage-Persistenz
│       ├── game-state.service.spec.ts   Unit-Tests für den State-Service
│       ├── icons.ts             Inline-SVG-Icon-Komponenten
│       └── components/          Header, Standings, RoundModal, PlayersModal, HistoryModal,
│                                 SettingsModal, WinnerOverlay, Toast, EmptyState, TargetBar
├── public/                      manifest.json, service-worker.js, App-Icons (1:1 mitkopiert)
├── .github/workflows/deploy.yml Baut & deployt automatisch bei jedem Push auf main
├── angular.json                 Build-Konfiguration (⚠️ "baseHref" anpassen, siehe unten)
└── package.json
```

## Voraussetzungen

- **Node.js** `^22.22.3`, `^24.15.0` oder `>=26.0.0` (Vorgabe von Angular 22)
- **npm** ≥ 8

## Lokal einrichten

```bash
npm install
```

## Lokal ausführen / debuggen

```bash
npm run dev        # bzw. `npm start` – Dev-Server mit Hot Reload
```

Der Dev-Server läuft anschließend unter `http://localhost:4200/flip7` (der Pfad `/flip7`
kommt vom `baseHref` in `angular.json`, siehe Abschnitt GitHub Pages). Änderungen an
`src/**` werden automatisch neu geladen.

Nützliche Debugging-Optionen:

```bash
npx ng serve --port 4201     # anderen Port verwenden, falls 4200 belegt ist
npx ng serve --open          # Browser automatisch öffnen
```

Browser-DevTools (F12) funktionieren wie gewohnt; Angular liefert im Dev-Modus
zusätzliche Fehler-/Warnmeldungen in der Konsole (z. B. bei fehlerhaften Bindings).

## Tests ausführen

Die Test-Suite läuft mit **Vitest** (über den Angular Unit-Test-Builder) in einer
jsdom-Umgebung – kein echter Browser nötig.

```bash
npm test                       # einmaliger Lauf (Standard in Nicht-TTY-Umgebungen wie CI)
npx ng test --watch            # Watch-Modus: Tests laufen bei jeder Dateiänderung neu
npx ng test --coverage         # mit Code-Coverage-Report
npx ng test --filter "Runden"  # nur Tests ausführen, deren Name auf das Muster passt
```

Enthaltene Tests:
- `src/logic.spec.ts` – Punkteberechnung (Modifikatoren, x2/÷2, Bust, Null-Karte, Flip-7-Bonus,
  Brutal-Mode-Diebstahl, Sieger-Ermittlung, `localStorage`-Persistenz)
- `src/app/game-state.service.spec.ts` – Zustandsverwaltung (Spieler-CRUD, Runden speichern,
  Standings-Berechnung, `startNewGame`)

## Produktions-Build lokal prüfen

```bash
npm run build                  # baut nach dist/browser (inkl. TypeScript-Prüfung)
npx http-server dist/browser -p 8080   # optional: Build lokal ansehen (npx installiert http-server bei Bedarf)
```

Öffne anschließend `http://localhost:8080/flip7/`.

## Einrichtung auf GitHub Pages (Schritt für Schritt)

### 1. Repository erstellen und Code hochladen

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<dein-name>/<repo-name>.git
git push -u origin main
```

(Alternativ per Weboberfläche: „Add file → Upload files“.)

### 2. Base-Pfad anpassen (wichtig, falls dein Repo nicht `flip7` heißt!)

Der Pfad, unter dem die App später erreichbar ist, muss zum Repository-Namen passen.
Passe dafür **zwei Stellen** an:

**`angular.json`** – im `build`-Target:
```json
"baseHref": "/<repo-name>/",
```

**`src/index.html`** – das `<base>`-Tag:
```html
<base href="/<repo-name>/" />
```

Falls dein Repository `<dein-name>.github.io` heißt (User/Organisations-Root-Seite), setze
stattdessen an beiden Stellen `/` statt `/<repo-name>/`.

### 3. GitHub Pages aktivieren

1. Gehe im Repository zu **Settings → Pages**.
2. Unter „Build and deployment“ → **Source**: wähle **„GitHub Actions“** (nicht „Deploy from
   a branch“).
3. Fertig – das war's an Einstellungen.

### 4. Automatischer Build

Sobald du auf den `main`-Branch pushst, baut `.github/workflows/deploy.yml` die App
automatisch (Node installieren → `npm ci` → `npm run build` → `dist/browser` auf Pages
veröffentlichen). Den Fortschritt siehst du im Reiter **Actions** des Repositories. Nach
ca. 1–2 Minuten ist die App live unter `https://<dein-name>.github.io/<repo-name>/`.

## App auf dem Smartphone installieren (PWA)

Die App lässt sich dank `manifest.json` und Service Worker (`public/service-worker.js`)
wie eine native App installieren und funktioniert danach auch offline.

### Android (Chrome)

1. Öffne den GitHub-Pages-Link in **Chrome**.
2. Tippe auf das Menü (⋮) oben rechts.
3. Wähle **„App installieren“** (bzw. „Zum Startbildschirm hinzufügen“).
4. Bestätigen – die App erscheint danach als eigenes Icon auf dem Homescreen und startet
   im Vollbild ohne Browser-Leiste.

### iOS / iPadOS (Safari)

Safari installiert PWAs über das Teilen-Menü (Chrome/Firefox auf iOS können das
systembedingt nicht, da sie intern ebenfalls WebKit nutzen, aber ohne diesen Menüpunkt):

1. Öffne den GitHub-Pages-Link in **Safari**.
2. Tippe auf das **Teilen-Symbol** (Quadrat mit Pfeil nach oben) in der unteren Leiste.
3. Wähle **„Zum Home-Bildschirm“**.
4. Namen bestätigen und mit **„Hinzufügen“** abschließen.

Die App startet danach ebenfalls im Vollbildmodus vom Homescreen aus.

## Änderungen an der Punktelogik

Alle Regeln/Berechnungen liegen zentral in `src/logic.ts` – reines TypeScript ohne
Angular-Abhängigkeit. Das erleichtert spätere Anpassungen und macht die Logik leicht
testbar (siehe `src/logic.spec.ts`).

## Hinweis zu den Daten

Punktestände werden ausschließlich lokal im Browser gespeichert (`localStorage`). Kein
Cloud-Sync, keine Server-Komponente.
