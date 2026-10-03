import { randomUUID } from 'node:crypto'
import { WebSocket, WebSocketServer } from 'ws'
import { erstelleWirtschaft } from './wirtschaft.js'
import { erstelleBesuche } from './besuche.js'

const auswahl = {
  frisur: ['Kurz', 'Lang', 'Z\u00f6pfe', 'Locken', 'Glatze'],
  kleidung: ['T-Shirt', 'Kleid', 'Hoodie'],
  geschlecht: ['Weiblich', 'M\u00e4nnlich', 'Keine Auswahl']
}
const farbfelder = ['haut', 'haare', 'oberteil', 'hose', 'schuhe']
const figurfelder = ['name', ...farbfelder, ...Object.keys(auswahl), 'alter']

function istObjekt(wert) {
  return wert !== null && typeof wert === 'object' && !Array.isArray(wert)
}

function nurFelder(wert, felder) {
  return istObjekt(wert) && Object.keys(wert).length === felder.length &&
    felder.every(feld => Object.hasOwn(wert, feld))
}

function pruefeFigur(figur) {
  if (!nurFelder(figur, figurfelder)) return null
  if (typeof figur.name !== 'string' || figur.name.length > 24 ||
      !/^[\p{L}\p{M}\p{N} ._-]*$/u.test(figur.name)) return null
  if (!Number.isInteger(figur.alter) || figur.alter < 0 || figur.alter > 120) return null
  if (!farbfelder.every(feld => typeof figur[feld] === 'string' && /^#[a-f\d]{6}$/i.test(figur[feld]))) return null
  if (!Object.entries(auswahl).every(([feld, werte]) => werte.includes(figur[feld]))) return null
  return Object.fromEntries(figurfelder.map(feld => [feld, figur[feld]]))
}

// Der Rueckgabewert raeumt Verbindungen, Timer und den Server-Anschluss auf.
export function registriereOnline(server, optionen = {}) {
  const raeume = new Map()
  const verbindungen = new Map()
  const aktiveSpieler = () => [...verbindungen.values()].filter(person => person.raum && person.socket.readyState === WebSocket.OPEN)
  const wirtschaft = erstelleWirtschaft({
    datei: optionen.wirtschaftDatei,
    spieler: aktiveSpieler,
    sende
  })
  const besuche = erstelleBesuche({ datei: optionen.besucheDatei, spieler: aktiveSpieler, sende,
    verteile: raum => verteile(raeume.get(raum)), stand: sendeStand })
  const erlaubteOrigins = new Set((process.env.ONLINE_ORIGINS || '').split(',').map(wert => wert.trim()).filter(Boolean))
  const websocketServer = new WebSocketServer({ noServer: true, maxPayload: 4096, perMessageDeflate: false })
  let beendet = false

  function sende(socket, nachricht) {
    if (socket.readyState !== WebSocket.OPEN) return
    if (socket.bufferedAmount > 65536) {
      socket.terminate()
      return
    }
    socket.send(JSON.stringify(nachricht))
  }

  function spielerliste(raum) {
    return [...raum.spieler.values()].map(spieler => ({
      id: spieler.id, figur: spieler.figur, x: spieler.x, y: spieler.y, ort: spieler.ort,
      haus: { ...spieler.haus, laden: wirtschaft.daten(spieler).laden }
    }))
  }

  function sendeStand(person, host) {
    const konto = wirtschaft.daten(host)
    sende(person.socket, { typ: 'stand', daten: {
      verkaeufer: host.id, name: host.figur.name || 'MiNiMiNi', inventar: konto.inventar, offen: konto.laden
    } })
  }

  function aktualisiereStaende() {
    const aktive = aktiveSpieler()
    for (const host of aktive) {
      if (host.ort !== `Haus:${host.hausId}`) continue
      for (const person of aktive) {
        if (person.raum === host.raum && person.ort === host.ort &&
            (person === host || person.besuchsHostId === host.id)) sendeStand(person, host)
      }
    }
  }

  function verteile(raum) {
    clearTimeout(raum.timer)
    raum.timer = null
    raum.letzteSendung = Date.now()
    const nachricht = { typ: 'spieler', spieler: spielerliste(raum) }
    for (const spieler of raum.spieler.values()) sende(spieler.socket, nachricht)
  }

  function planeBewegung(raum) {
    if (raum.timer) return
    raum.timer = setTimeout(() => verteile(raum), Math.max(0, 100 - (Date.now() - raum.letzteSendung)))
  }

  function entferne(socket) {
    const spieler = verbindungen.get(socket)
    if (!spieler) return
    clearTimeout(spieler.beitrittsTimer)
    besuche.entferne(spieler)
    wirtschaft.entferne(spieler)
    verbindungen.delete(socket)
    if (!spieler.raum) return
    const raum = raeume.get(spieler.raum)
    raum.spieler.delete(spieler.id)
    if (raum.spieler.size === 0) {
      clearTimeout(raum.timer)
      raeume.delete(spieler.raum)
    } else if (!beendet) verteile(raum)
  }

  function ablehnen(socket) {
    entferne(socket)
    socket.close(1008, 'Ungueltige Online-Nachricht oder Raum voll')
  }

  websocketServer.on('connection', socket => {
    const spieler = { socket, id: randomUUID(), raum: null, lebt: true, letzteBewegung: -Infinity, letzterChat: -Infinity }
    verbindungen.set(socket, spieler)
    spieler.beitrittsTimer = setTimeout(() => socket.terminate(), 10000)
    socket.on('error', () => socket.terminate())
    socket.on('close', () => entferne(socket))
    socket.on('pong', () => { spieler.lebt = true })
    socket.on('message', (daten, binaer) => {
      if (!verbindungen.has(socket)) return
      if (binaer) return ablehnen(socket)
      let nachricht
      try { nachricht = JSON.parse(daten.toString('utf8')) } catch { return ablehnen(socket) }
      if (!istObjekt(nachricht)) return ablehnen(socket)

      if (nachricht.typ === 'beitreten') {
        const hatKonto = Object.hasOwn(nachricht, 'konto')
        if (spieler.raum || !nurFelder(nachricht, hatKonto ? ['typ', 'raum', 'figur', 'konto'] : ['typ', 'raum', 'figur']) ||
            (hatKonto && (typeof nachricht.konto !== 'string' || !/^[a-f0-9]{32}$/.test(nachricht.konto))) ||
            typeof nachricht.raum !== 'string' || !/^[A-Z0-9]{4,12}$/.test(nachricht.raum)) return ablehnen(socket)
        const figur = pruefeFigur(nachricht.figur)
        if (!figur) return ablehnen(socket)
        let raum = raeume.get(nachricht.raum)
        if ((!raum && raeume.size >= 100) || (raum && raum.spieler.size >= 12)) return ablehnen(socket)
        if (!wirtschaft.anmelden(spieler, nachricht.konto)) {
          entferne(socket)
          socket.close(1011, 'Konto konnte nicht gespeichert werden')
          return
        }
        if (!besuche.anmelden(spieler)) {
          entferne(socket)
          socket.close(1011, 'Haus konnte nicht gespeichert werden')
          return
        }
        if (!raum) {
          raum = { spieler: new Map(), timer: null, letzteSendung: 0 }
          raeume.set(nachricht.raum, raum)
        }
        clearTimeout(spieler.beitrittsTimer)
        Object.assign(spieler, { raum: nachricht.raum, figur, x: 640, y: 520, ort: 'Stadt' })
        raum.spieler.set(spieler.id, spieler)
        sende(socket, { typ: 'willkommen', id: spieler.id, spieler: spielerliste(raum), wirtschaft: wirtschaft.daten(spieler), besuche: besuche.daten(spieler) })
        verteile(raum)
        return
      }

      const besuchsAntwort = besuche.nachricht(spieler, nachricht)
      if (besuchsAntwort !== null) {
        if (!besuchsAntwort) ablehnen(socket)
        return
      }
      const wirtschaftAntwort = wirtschaft.nachricht(spieler, nachricht)
      if (wirtschaftAntwort !== null) {
        if (!wirtschaftAntwort) ablehnen(socket)
        else {
          aktualisiereStaende()
          if (nachricht.typ === 'laden') {
            for (const raum of raeume.values()) verteile(raum)
          }
        }
        return
      }

      if (nachricht.typ === 'chat') {
        if (!spieler.raum || !nurFelder(nachricht, ['typ', 'text']) ||
            typeof nachricht.text !== 'string' || /\p{Cc}/u.test(nachricht.text)) return ablehnen(socket)
        const text = nachricht.text.trim()
        if (!text || text.length > 160) return ablehnen(socket)
        const jetzt = Date.now()
        if (jetzt - spieler.letzterChat < 1000) return
        spieler.letzterChat = jetzt
        const chat = {
          typ: 'chat',
          nachricht: {
            id: randomUUID(), spielerId: spieler.id,
            name: spieler.figur.name || 'MiNiMiNi', text, zeit: jetzt
          }
        }
        for (const freund of raeume.get(spieler.raum).spieler.values()) sende(freund.socket, chat)
        return
      }

      if (nachricht.typ === 'ort') {
        if (!spieler.raum || !nurFelder(nachricht, ['typ', 'ort', 'x', 'y']) ||
            !['Stadt', 'Laden', 'Caf\u00e9', 'Spielhaus'].includes(nachricht.ort) ||
            !Number.isFinite(nachricht.x) || !Number.isFinite(nachricht.y)) return ablehnen(socket)
        besuche.verlasseHaus(spieler)
        delete spieler.besuchsHostId
        spieler.ort = nachricht.ort
        spieler.x = Math.max(45, Math.min(1235, nachricht.x))
        spieler.y = Math.max(300, Math.min(730, nachricht.y))
        planeBewegung(raeume.get(spieler.raum))
        return
      }
      if (nachricht.typ === 'bewegung') {
        if (!spieler.raum || !nurFelder(nachricht, ['typ', 'x', 'y']) ||
            !Number.isFinite(nachricht.x) || !Number.isFinite(nachricht.y)) return ablehnen(socket)
        const jetzt = Date.now()
        if (jetzt - spieler.letzteBewegung < 100) return
        spieler.letzteBewegung = jetzt
        spieler.x = Math.max(45, Math.min(1235, nachricht.x))
        spieler.y = Math.max(spieler.ort.startsWith('Haus:') ? 120 : 300, Math.min(730, nachricht.y))
        planeBewegung(raeume.get(spieler.raum))
        return
      }
      ablehnen(socket)
    })
  })

  function upgrade(anfrage, socket, kopf) {
    let pfad
    try { pfad = new URL(anfrage.url, 'http://localhost').pathname } catch { return }
    if (pfad !== '/minimini-online') return
    let originErlaubt = !anfrage.headers.origin
    if (anfrage.headers.origin) {
      try {
        const origin = new URL(anfrage.headers.origin)
        const protokoll = anfrage.socket.encrypted ? 'https:' : 'http:'
        originErlaubt = origin.origin === anfrage.headers.origin &&
          ((origin.protocol === protokoll && origin.host === anfrage.headers.host) || erlaubteOrigins.has(origin.origin))
      } catch { originErlaubt = false }
    }
    if (beendet || !originErlaubt || websocketServer.clients.size >= 1200) {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n')
      return
    }
    websocketServer.handleUpgrade(anfrage, socket, kopf, verbindung => websocketServer.emit('connection', verbindung, anfrage))
  }

  // Ping fragt regelmaessig nach, ob ein Handy noch verbunden ist.
  const herzschlag = setInterval(() => {
    for (const [socket, spieler] of verbindungen) {
      if (!spieler.lebt) { socket.terminate(); continue }
      spieler.lebt = false
      if (socket.readyState === WebSocket.OPEN) socket.ping()
    }
  }, 30000)
  herzschlag.unref()

  function aufraeumen() {
    if (beendet) return
    beendet = true
    clearInterval(herzschlag)
    server.off('upgrade', upgrade)
    server.off('close', aufraeumen)
    wirtschaft.aufraeumen()
    besuche.aufraeumen()
    for (const raum of raeume.values()) clearTimeout(raum.timer)
    for (const [socket, spieler] of verbindungen) {
      clearTimeout(spieler.beitrittsTimer)
      socket.terminate()
    }
    verbindungen.clear()
    raeume.clear()
    websocketServer.close()
  }

  server.on('upgrade', upgrade)
  server.once('close', aufraeumen)
  return aufraeumen
}