import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// WICHTIG für GitHub Pages:
// Bei einem normalen Projekt-Repository (z. B. "flip7-zaehler") muss "base" auf
// "/<repo-name>/" gesetzt werden, sonst werden CSS/JS nach dem Deploy nicht gefunden.
// Nur bei einem User/Organisations-Root-Repo ("dein-name.github.io") bleibt es bei "/".
export default defineConfig({
  base: '/flip7/',
  plugins: [react()],
});
