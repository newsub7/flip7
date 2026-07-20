# Flip 7 Punktezähler – React + TypeScript Edition

Gleiche App wie die Vanilla-JS-Version, jetzt aber als React + TypeScript-Projekt mit Vite,
inklusive automatischem Build & Deploy auf GitHub Pages per GitHub Actions.

## Warum sieht es hier anders aus als die vorherige Version?
Diese Version läuft nicht direkt als fertige HTML-Datei, sondern muss einmal **gebaut** werden
(TypeScript → JavaScript, gebündelt von Vite). Das übernimmt für dich automatisch GitHub Actions,
sobald du den Code zu GitHub pushst – du musst dafür **nichts lokal installieren**.

## Funktionsumfang (identisch zur Vanilla-Version)
- Spieler hinzufügen, umbenennen, entfernen
- Regelwerke: Klassisch / With a Vengeance / Kombiniert (unter dem Zahnrad-Symbol)
- Brutal Mode (negative Rundenpunkte, Flip-7-Bonus einem Gegner abziehen)
- Rundenverlauf mit Aufschlüsselung, automatische Sieger-Erkennung
- Als PWA installierbar, Daten bleiben lokal auf dem Gerät (localStorage)

## Projektstruktur
```
flip7-react/
├── src/
│   ├── types.ts          Typdefinitionen (Player, Round, GameState, ...)
│   ├── logic.ts           Reine Punkteberechnung, Speichern/Laden (keine React-Abhängigkeit)
│   ├── App.tsx             Zustandsverwaltung, verdrahtet alle Komponenten
│   ├── main.tsx           React-Einstiegspunkt
│   ├── styles.css         Design (identisch zur Vanilla-Version)
│   └── components/        Header, Standings, RoundModal, PlayersModal, HistoryModal,
│                          SettingsModal, WinnerOverlay, Toast, Icons
├── public/                manifest.json, service-worker.js, Icons (werden 1:1 mitkopiert)
├── .github/workflows/deploy.yml   Baut & deployt automatisch bei jedem Push auf main
├── vite.config.ts         Build-Konfiguration (⚠️ "base"-Pfad anpassen, siehe unten)
└── package.json
```

## Einrichtung auf GitHub Pages (Schritt für Schritt)

### 1. Repository erstellen und Code hochladen
1. Erstelle auf github.com ein neues Repository, z. B. `flip7-zaehler`.
2. Lade den **gesamten Inhalt** dieses Ordners dort hoch (z. B. per "Add file → Upload files",
   oder falls du Git kennst: `git init`, `git add .`, `git commit -m "Initial commit"`,
   `git remote add origin <dein-repo-url>`, `git push -u origin main`).

### 2. Base-Pfad in vite.config.ts anpassen (wichtig!)
Öffne `vite.config.ts` und passe die Zeile `base: '/flip7-zaehler/'` an deinen **exakten
Repository-Namen** an, z. B. bei `github.com/dein-name/mein-flip7`:
```ts
base: '/mein-flip7/',
```
Falls dein Repository `dein-name.github.io` heißt (User/Organisations-Root-Seite), setze stattdessen:
```ts
base: '/',
```

### 3. GitHub Pages aktivieren
1. Gehe im Repository zu **Settings → Pages**.
2. Unter "Build and deployment" → **Source**: wähle **"GitHub Actions"** (nicht "Deploy from a branch").
3. Fertig – das war's an Einstellungen.

### 4. Automatischer Build
Sobald du auf den `main`-Branch pushst, baut die Datei `.github/workflows/deploy.yml`
die App automatisch (Node installieren → `npm ci` → `npm run build` → auf Pages veröffentlichen).
Den Fortschritt siehst du im Reiter **Actions** des Repositories. Nach ca. 1–2 Minuten ist die
App live unter `https://dein-name.github.io/<repo-name>/`.

### 5. Auf dem Android-Handy installieren
Öffne den Link in **Chrome** → Menü (⋮) → **"Zum Startbildschirm hinzufügen"** (bzw. "App installieren").

## Lokal entwickeln/testen (optional, benötigt Node.js ≥ 18)
Falls du Node.js auf deinem Rechner installiert hast und Änderungen vor dem Push testen willst:
```bash
npm install
npm run dev       # Entwicklungsserver mit Hot Reload, http://localhost:5173
npm run build     # Produktions-Build nach dist/ (inkl. TypeScript-Prüfung)
npm run preview   # Baut und zeigt den Produktions-Build lokal an
```

## Änderungen an der Punktelogik
Alle Regeln/Berechnungen liegen zentral in `src/logic.ts` – reines TypeScript ohne React-Abhängigkeit.
Das erleichtert spätere Anpassungen (z. B. weitere Erweiterungen) und macht die Logik leicht testbar.

## Hinweis zu den Daten
Punktestände werden ausschließlich lokal im Browser gespeichert (`localStorage`), genau wie in der
Vanilla-Version. Kein Cloud-Sync, keine Server-Komponente.
