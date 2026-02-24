import { defineConfig } from 'vite'

export default defineConfig({
  // Der Dev-Server läuft auf Port 5173
  server: {
    host: true, // Damit man auch vom Tablet im gleichen Netzwerk testen kann
    port: 5173
  },
  build: {
    outDir: 'dist',
    // Für bessere Kompatibilität mit dem Fire HD 10 Browser
    target: 'es2015'
  }
})
