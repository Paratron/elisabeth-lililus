import { defineConfig } from 'vite'
import { registriereOnline } from './server/online.js'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [{
    name: 'minimini-online',
    configureServer(viteServer) {
      if (viteServer.httpServer) registriereOnline(viteServer.httpServer)
      const onlineDateien = ['online.js', 'wirtschaft.js', 'besuche.js'].map(name => resolve('server', name))
      viteServer.watcher.add(onlineDateien)
      const starteNeu = datei => {
        if (onlineDateien.includes(resolve(datei))) void viteServer.restart()
      }
      viteServer.watcher.on('change', starteNeu)
      viteServer.httpServer?.once('close', () => viteServer.watcher.off('change', starteNeu))
    }
  }],
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
