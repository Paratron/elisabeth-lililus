import { createServer } from 'node:http'
import { registriereOnline } from './online.js'

const server = createServer((anfrage, antwort) => {
  antwort.setHeader('Content-Type', 'application/json; charset=utf-8')
  antwort.setHeader('Cache-Control', 'no-store')
  if (anfrage.method === 'GET' && anfrage.url === '/health') {
    antwort.writeHead(200)
    antwort.end(JSON.stringify({ ok: true }))
    return
  }
  antwort.writeHead(404)
  antwort.end(JSON.stringify({ fehler: 'Nicht gefunden' }))
})

const aufraeumen = registriereOnline(server)
server.on('upgrade', (anfrage, socket) => {
  if (new URL(anfrage.url, 'http://localhost').pathname !== '/minimini-online') {
    socket.end('HTTP/1.1 404 Not Found\r\nConnection: close\r\nContent-Length: 0\r\n\r\n')
  }
})
server.listen(Number(process.env.PORT || 8787), () => {
  console.log(`Online-Server: Port ${server.address().port}, WebSocket /minimini-online`)
})

function beenden() {
  aufraeumen()
  server.close()
}

process.once('SIGINT', beenden)
process.once('SIGTERM', beenden)