import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { randomBytes, randomUUID } from 'node:crypto'
import { once } from 'node:events'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as warte } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import WebSocket from 'ws'
import { registriereOnline } from './online.js'
import { erstelleBesuche } from './besuche.js'

const figur = {
  name: 'Mini', haut: '#ffdbac', haare: '#6b3a2a', frisur: 'Kurz',
  oberteil: '#ed637b', hose: '#386cba', schuhe: '#f5c84c', kleidung: 'T-Shirt',
  geschlecht: 'Keine Auswahl', alter: 8
}

async function testServer(kontext, optionen = {}) {
  const server = createServer()
  const aufraeumen = registriereOnline(server, { wirtschaftDatei: null, besucheDatei: null, ...optionen })
  const sockets = []
  let beendet = false
  async function schliessen() {
    if (beendet) return
    beendet = true
    for (const socket of sockets) socket.terminate()
    aufraeumen()
    await new Promise(resolve => server.close(resolve))
  }
  kontext.after(schliessen)
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const url = `ws://127.0.0.1:${server.address().port}/minimini-online`

  async function verbinde(optionen) {
    const socket = new WebSocket(url, optionen)
    sockets.push(socket)
    const nachrichten = []
    const wartende = new Set()
    socket.on('message', daten => {
      nachrichten.push(JSON.parse(daten.toString()))
      for (const pruefe of wartende) pruefe()
    })
    await once(socket, 'open')
    function empfange(bedingung) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          wartende.delete(pruefe)
          reject(new Error('Online-Nachricht fehlt'))
        }, 2000)
        function pruefe() {
          const index = nachrichten.findIndex(bedingung)
          if (index === -1) return
          clearTimeout(timer)
          wartende.delete(pruefe)
          resolve(nachrichten.splice(index, 1)[0])
        }
        wartende.add(pruefe)
        pruefe()
      })
    }
    return {
      socket, nachrichten, empfange,
      sende: nachricht => socket.send(JSON.stringify(nachricht)),
      async beitreten(raum = 'ABC123', eigeneFigur = figur, konto) {
        socket.send(JSON.stringify({ typ: 'beitreten', raum, figur: eigeneFigur, ...(konto === undefined ? {} : { konto }) }))
        return empfange(nachricht => nachricht.typ === 'willkommen')
      }
    }
  }
  return { verbinde, url, aufraeumen, server, schliessen }
}

const zuhause = { typ: 'zuhause', offen: true, farben: {
  wand: '#f4db68', dach: '#de6573', tuer: '#47725f', fenster: '#86d7e6'
}, briefkastenFarbe: '#123ABC', briefkastenGefunden: true }
const besuchStatus = daten => daten.typ === 'besuch-status'

test('Hausbesuch braucht aktiven offenen Gastgeber im eigenen Haus und selben Raum; Hausdaten sind oeffentlich', async kontext => {
  const { verbinde } = await testServer(kontext)
  const host = await verbinde()
  const konto = randomBytes(16).toString('hex')
  const hostStart = await host.beitreten('ABC123', figur, konto)
  const gast = await verbinde()
  const gastStart = await gast.beitreten()
  const fremde = await verbinde()
  await fremde.beitreten('ANDERS')
  const zweiterSocket = await verbinde()
  const zweiterStart = await zweiterSocket.beitreten('ABC123', figur, konto)
  assert.equal(zweiterStart.besuche.hausId, hostStart.besuche.hausId)
  assert.notEqual(gastStart.besuche.hausId, hostStart.besuche.hausId)
  gast.sende({ typ: 'besuchen', spielerId: hostStart.id })
  assert.match((await gast.empfange(besuchStatus)).text, /nicht/)
  host.sende(zuhause)
  await host.empfange(besuchStatus)
  const ort = `Haus:${hostStart.besuche.hausId}`
  const liste = await gast.empfange(daten => daten.typ === 'spieler' && daten.spieler.some(person => person.ort === ort))
  const person = liste.spieler.find(person => person.id === hostStart.id)
  assert.deepEqual(person.haus, { id: hostStart.besuche.hausId, offen: true, farben: zuhause.farben,
    briefkastenFarbe: zuhause.briefkastenFarbe, briefkastenGefunden: true, laden: false })
  assert.equal(person.x, 640)
  assert.equal(person.y, 620)
  assert.ok(!JSON.stringify(liste).includes(konto))
  for (const client of [fremde, zweiterSocket]) {
    client.sende({ typ: 'besuchen', spielerId: hostStart.id })
    assert.match((await client.empfange(besuchStatus)).text, /nicht/)
  }
  gast.sende({ typ: 'besuchen', spielerId: gastStart.id })
  assert.match((await gast.empfange(besuchStatus)).text, /nicht/)
  gast.sende({ typ: 'besuchen', spielerId: randomUUID() })
  assert.match((await gast.empfange(besuchStatus)).text, /nicht/)
  gast.sende({ typ: 'besuchen', spielerId: hostStart.id })
  assert.match((await gast.empfange(besuchStatus)).text, /besuchst/)
  await gast.empfange(daten => daten.typ === 'spieler' && daten.spieler.some(person => person.id === gastStart.id && person.ort === ort))
  gast.sende({ typ: 'bewegung', x: -50, y: 0 })
  await host.empfange(daten => daten.typ === 'spieler' && daten.spieler.some(person => person.id === gastStart.id && person.x === 45 && person.y === 120))
  host.sende({ ...zuhause, offen: false })
  assert.match((await gast.empfange(besuchStatus)).text, /beendet/)
  await gast.empfange(daten => daten.typ === 'spieler' && daten.spieler.some(person => person.id === gastStart.id && person.ort === 'Stadt' && person.y === 520))
  await host.empfange(besuchStatus)
  host.sende(zuhause)
  await host.empfange(besuchStatus)
  host.sende({ typ: 'ort', ort: 'Stadt', x: 640, y: 520 })
  await gast.empfange(daten => daten.typ === 'spieler' && daten.spieler.some(person => person.id === hostStart.id && person.ort === 'Stadt'))
  gast.sende({ typ: 'besuchen', spielerId: hostStart.id })
  assert.match((await gast.empfange(besuchStatus)).text, /nicht/)
})

test('Gast kann normal zurueck; Abschied des Gastgebers bringt verbleibende Gaeste in die Stadt', async kontext => {
  const { verbinde } = await testServer(kontext)
  const host = await verbinde()
  const hostStart = await host.beitreten()
  const gast = await verbinde()
  const gastStart = await gast.beitreten()
  host.sende(zuhause)
  await host.empfange(besuchStatus)
  for (const rueckweg of [{ typ: 'ort', ort: 'Stadt', x: 800, y: 500 }, { ...zuhause, offen: false }]) {
    gast.sende({ typ: 'besuchen', spielerId: hostStart.id })
    await gast.empfange(besuchStatus)
    gast.sende(rueckweg)
    const ort = rueckweg.typ === 'ort' ? 'Stadt' : `Haus:${gastStart.besuche.hausId}`
    await host.empfange(daten => daten.typ === 'spieler' && daten.spieler.some(person => person.id === gastStart.id && person.ort === ort))
    if (rueckweg.typ === 'zuhause') await gast.empfange(besuchStatus)
  }
  gast.sende({ typ: 'besuchen', spielerId: hostStart.id })
  await gast.empfange(besuchStatus)
  const geschlossen = once(host.socket, 'close')
  host.socket.close()
  await geschlossen
  assert.match((await gast.empfange(besuchStatus)).text, /beendet/)
  const liste = await gast.empfange(daten => daten.typ === 'spieler' && daten.spieler.length === 1)
  assert.equal(liste.spieler[0].ort, 'Stadt')
  assert.equal(liste.spieler[0].y, 520)
})

test('Haus-Schemas, Farben und Identitaeten sind strikt; Haus-Ort kann nicht direkt gesendet werden', async kontext => {
  const { verbinde } = await testServer(kontext)
  for (const nachricht of [
    { ...zuhause, offen: 1 }, { ...zuhause, briefkastenGefunden: 'ja' }, { ...zuhause, briefkastenFarbe: 'red' },
    { ...zuhause, farben: { wand: '#123456', dach: '#123456' } },
    { ...zuhause, farben: { ...zuhause.farben, tuer: '#fff' } }, { ...zuhause, hausId: randomUUID() },
    { typ: 'besuchen', spielerId: 'falsch' }, { typ: 'freund-anfrage', spielerId: randomUUID(), name: 'Fremd' },
    { typ: 'freund-antwort', id: randomUUID(), annehmen: 1 }
  ]) {
    const client = await verbinde()
    await client.beitreten()
    const geschlossen = once(client.socket, 'close')
    client.sende(nachricht)
    assert.equal((await geschlossen)[0], 1008)
  }
  const client = await verbinde()
  const start = await client.beitreten()
  const geschlossen = once(client.socket, 'close')
  client.sende({ typ: 'ort', ort: `Haus:${start.besuche.hausId}`, x: 640, y: 620 })
  assert.equal((await geschlossen)[0], 1008)
})

test('Echter Standkauf sendet nur Inventar und aktualisiert alle Besucher sowie Laden-Spielerlisten', async kontext => {
  const { verbinde } = await testServer(kontext)
  const host = await verbinde()
  const hostStart = await host.beitreten()
  const gast = await verbinde()
  await gast.beitreten()
  const zuschauer = await verbinde()
  await zuschauer.beitreten()
  host.sende(zuhause)
  await host.empfange(besuchStatus)
  const ersterStand = await host.empfange(daten => daten.typ === 'stand')
  assert.deepEqual(Object.keys(ersterStand.daten).sort(), ['inventar', 'name', 'offen', 'verkaeufer'])
  assert.equal(ersterStand.daten.offen, false)
  host.sende({ typ: 'laden', offen: true })
  await host.empfange(daten => daten.typ === 'handel-status')
  await gast.empfange(daten => daten.typ === 'spieler' && daten.spieler.some(person => person.id === hostStart.id && person.haus.laden))
  for (const client of [gast, zuschauer]) {
    client.sende({ typ: 'besuchen', spielerId: hostStart.id })
    await client.empfange(besuchStatus)
    const stand = await client.empfange(daten => daten.typ === 'stand')
    assert.equal(stand.daten.verkaeufer, hostStart.id)
    assert.equal(stand.daten.offen, true)
    assert.equal(stand.daten.inventar.teddy, 2)
  }
  gast.sende({ typ: 'standkauf', verkaeufer: hostStart.id, artikel: 'teddy' })
  const gekauft = await gast.empfange(daten => daten.typ === 'wirtschaft')
  assert.equal(gekauft.daten.muenzen, 12)
  assert.equal(gekauft.daten.inventar.teddy, 3)
  const verkauft = await host.empfange(daten => daten.typ === 'wirtschaft' && daten.daten.muenzen === 28)
  assert.equal(verkauft.daten.inventar.teddy, 1)
  for (const client of [gast, zuschauer]) {
    await client.empfange(daten => daten.typ === 'stand' && daten.daten.inventar.teddy === 1)
  }
  host.sende({ typ: 'laden', offen: false })
  await zuschauer.empfange(daten => daten.typ === 'stand' && !daten.daten.offen)
  await zuschauer.empfange(daten => daten.typ === 'spieler' && daten.spieler.some(person => person.id === hostStart.id && !person.haus.laden))
})

test('Freundschaft ueber echte Sockets aktualisiert eigene Kontoverbindungen und ueberlebt Server-Neustart', async kontext => {
  const ordner = mkdtempSync(join(tmpdir(), 'minimini-besuche-'))
  kontext.after(() => rmSync(ordner, { recursive: true, force: true }))
  const besucheDatei = join(ordner, 'besuche.json')
  const ersterServer = await testServer(kontext, { besucheDatei })
  const senderKonto = randomBytes(16).toString('hex')
  const empfaengerKonto = randomBytes(16).toString('hex')
  const sender = await ersterServer.verbinde()
  const senderStart = await sender.beitreten('ABC123', figur, senderKonto)
  const empfaenger = await ersterServer.verbinde()
  const empfaengerStart = await empfaenger.beitreten('ABC123', { ...figur, name: 'Mira' }, empfaengerKonto)
  const gleiche = await ersterServer.verbinde()
  await gleiche.beitreten('ANDERS', figur, senderKonto)
  sender.sende({ typ: 'freund-anfrage', spielerId: empfaengerStart.id })
  const anfrage = await empfaenger.empfange(daten => daten.typ === 'freund-anfrage')
  assert.equal(anfrage.spielerId, senderStart.id)
  assert.equal(anfrage.name, 'Mini')
  await sender.empfange(besuchStatus)
  assert.deepEqual(senderStart.besuche.freunde, [])
  empfaenger.sende({ typ: 'freund-antwort', id: anfrage.id, annehmen: true })
  const daten = (await sender.empfange(daten => daten.typ === 'besuche')).daten
  assert.deepEqual(daten, { hausId: senderStart.besuche.hausId, freunde: [{ hausId: empfaengerStart.besuche.hausId, name: 'Mira' }] })
  assert.deepEqual((await gleiche.empfange(daten => daten.typ === 'besuche')).daten, daten)
  const antwort = await empfaenger.empfange(daten => daten.typ === 'besuche')
  assert.deepEqual(antwort.daten.freunde, [{ hausId: senderStart.besuche.hausId, name: 'Mini' }])
  assert.ok(!JSON.stringify(antwort).includes(senderKonto))
  await ersterServer.schliessen()
  const zweiterServer = await testServer(kontext, { besucheDatei })
  const wieder = await zweiterServer.verbinde()
  const start = await wieder.beitreten('ABC123', figur, senderKonto)
  assert.notEqual(start.id, senderStart.id)
  assert.deepEqual(start.besuche, daten)
  assert.equal(start.spieler[0].haus.offen, false)
})

function besucheProbe(kontext, datei = null) {
  const personen = []
  const ausgaben = []
  const besuche = erstelleBesuche({ datei, spieler: () => personen,
    sende: (socket, nachricht) => ausgaben.push({ socket, nachricht }), verteile: () => {}, stand: () => {} })
  kontext.after(besuche.aufraeumen)
  function verbinde(konto = randomBytes(16).toString('hex')) {
    const person = { id: randomUUID(), socket: {}, figur, raum: 'ABC123', konto }
    if (konto === null) person.konto = `gast:${person.id}`
    assert.equal(besuche.anmelden(person), true)
    personen.push(person)
    return person
  }
  function sende(person, nachricht) {
    ausgaben.length = 0
    assert.equal(besuche.nachricht(person, nachricht), true)
    return ausgaben.map(eintrag => eintrag.nachricht)
  }
  function frage(sender, empfaenger) {
    return sende(sender, { typ: 'freund-anfrage', spielerId: empfaenger.id }).find(daten => daten.typ === 'freund-anfrage')
  }
  function trenne(person) {
    personen.splice(personen.indexOf(person), 1)
    besuche.entferne(person)
  }
  return { besuche, verbinde, sende, frage, trenne, ausgaben }
}

test('Freundschaften brauchen Zustimmung und behalten oeffentliche IDs und Namen nach Reload; Gaeste bleiben getrennt', kontext => {
  const ordner = mkdtempSync(join(tmpdir(), 'minimini-besuche-'))
  kontext.after(() => rmSync(ordner, { recursive: true, force: true }))
  const datei = join(ordner, 'besuche.json')
  const { besuche, verbinde, sende, frage, trenne } = besucheProbe(kontext, datei)
  const sender = verbinde()
  const empfaenger = verbinde()
  const fremde = verbinde()
  const anfrage = frage(sender, empfaenger)
  assert.deepEqual(Object.keys(anfrage).sort(), ['id', 'name', 'spielerId', 'typ'])
  assert.equal(anfrage.spielerId, sender.id)
  assert.deepEqual(besuche.daten(sender).freunde, [])
  sende(fremde, { typ: 'freund-antwort', id: anfrage.id, annehmen: true })
  assert.deepEqual(besuche.daten(sender).freunde, [])
  const antworten = sende(empfaenger, { typ: 'freund-antwort', id: anfrage.id, annehmen: true })
  assert.equal(antworten.filter(daten => daten.typ === 'besuche').length, 2)
  assert.ok(!JSON.stringify(antworten).includes(sender.konto))
  assert.deepEqual(besuche.daten(sender).freunde, [{ hausId: empfaenger.hausId, name: 'Mini' }])
  assert.deepEqual(besuche.daten(empfaenger).freunde, [{ hausId: sender.hausId, name: 'Mini' }])
  sende(empfaenger, { typ: 'freund-antwort', id: anfrage.id, annehmen: true })
  assert.equal(besuche.daten(sender).freunde.length, 1)
  const neu = besucheProbe(kontext, datei)
  const wieder = neu.verbinde(sender.konto)
  assert.deepEqual(neu.besuche.daten(wieder), besuche.daten(sender))
  const gast = verbinde(null)
  const andererGast = verbinde(null)
  assert.notEqual(gast.hausId, andererGast.hausId)
  const gastAnfrage = frage(gast, sender)
  sende(sender, { typ: 'freund-antwort', id: gastAnfrage.id, annehmen: true })
  assert.equal(besuche.daten(sender).freunde.length, 2)
  assert.ok(!readFileSync(datei, 'utf8').includes(gast.hausId))
  trenne(gast)
  assert.equal(besuche.daten(sender).freunde.length, 1)
  const neueGast = verbinde(null)
  assert.notEqual(neueGast.hausId, gast.hausId)
  assert.deepEqual(besuche.daten(neueGast).freunde, [])
})

test('Freund-Anfragen: Ablehnung, Rate, nur eine ausgehend, andere Raeume, eigenes Konto und Ablauf nach 2 Minuten', kontext => {
  kontext.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 10000 })
  const { besuche, verbinde, sende, frage, trenne } = besucheProbe(kontext)
  const sender = verbinde()
  const empfaenger = verbinde()
  const gleiche = verbinde(sender.konto)
  const fremde = verbinde()
  fremde.raum = 'ANDERS'
  for (const andere of [sender, gleiche, fremde]) assert.equal(frage(sender, andere), undefined)
  const erste = frage(sender, empfaenger)
  assert.ok(erste)
  assert.equal(frage(gleiche, empfaenger), undefined)
  sende(empfaenger, { typ: 'freund-antwort', id: erste.id, annehmen: false })
  assert.deepEqual(besuche.daten(sender).freunde, [])
  assert.equal(frage(sender, empfaenger), undefined)
  kontext.mock.timers.tick(999)
  assert.equal(frage(sender, empfaenger), undefined)
  kontext.mock.timers.tick(1)
  const zweite = frage(sender, empfaenger)
  assert.ok(zweite)
  kontext.mock.timers.tick(120000)
  sende(empfaenger, { typ: 'freund-antwort', id: zweite.id, annehmen: true })
  assert.deepEqual(besuche.daten(sender).freunde, [])
  assert.ok(frage(sender, empfaenger))
  trenne(empfaenger)
  kontext.mock.timers.tick(1000)
  assert.ok(frage(sender, verbinde()))
})

test('Besuchsdatei lehnt ungueltige und einseitige Daten ab; Speicherfehler erzeugt keine Freundschaft', kontext => {
  const ordner = mkdtempSync(join(tmpdir(), 'minimini-besuche-'))
  kontext.after(() => rmSync(ordner, { recursive: true, force: true }))
  const datei = join(ordner, 'besuche.json')
  const { besuche, verbinde, frage, sende } = besucheProbe(kontext, datei)
  const sender = verbinde()
  const empfaenger = verbinde()
  const anfrage = frage(sender, empfaenger)
  mkdirSync(`${datei}.tmp`)
  assert.match(sende(empfaenger, { typ: 'freund-antwort', id: anfrage.id, annehmen: true })[0].text, /nichts/)
  assert.deepEqual(besuche.daten(sender).freunde, [])
  assert.deepEqual(besuche.daten(empfaenger).freunde, [])
  for (const inhalt of [
    '{', JSON.stringify({ version: 1, konten: { falsch: { hausId: randomUUID(), freunde: [] } } }),
    JSON.stringify({ version: 1, konten: { [sender.konto]: { hausId: sender.hausId, freunde: [{ hausId: empfaenger.hausId, name: 'Mini' }] } } })
  ]) {
    writeFileSync(datei, inhalt)
    assert.throws(() => besucheProbe(kontext, datei), /ungueltig|nicht geladen/)
  }
})

test('Zwei Spieler: Willkommen, Bewegung, Grenzen, Raumtrennung und Abschied', async kontext => {
  const { verbinde } = await testServer(kontext)
  const erste = await verbinde()
  const willkommen = await erste.beitreten()
  assert.match(willkommen.id, /^[a-f\d-]{36}$/)
  assert.deepEqual(willkommen.spieler, [{ id: willkommen.id, figur, x: 640, y: 520, ort: 'Stadt',
    haus: { id: willkommen.besuche.hausId, offen: false, briefkastenFarbe: '#de6573', briefkastenGefunden: false, laden: false } }])
  const zweite = await verbinde()
  const zweiterStart = await zweite.beitreten()
  assert.notEqual(willkommen.id, zweiterStart.id)
  assert.equal(zweiterStart.spieler.length, 2)
  await erste.empfange(nachricht => nachricht.typ === 'spieler' && nachricht.spieler.length === 2)
  const fremde = await verbinde()
  const fremderStart = await fremde.beitreten('ANDERS')
  await fremde.empfange(nachricht => nachricht.typ === 'spieler')

  erste.sende({ typ: 'bewegung', x: -200, y: 900 })
  const bewegt = nachricht => nachricht.typ === 'spieler' &&
    nachricht.spieler.some(spieler => spieler.id === willkommen.id && spieler.x === 45 && spieler.y === 730)
  await erste.empfange(bewegt)
  await zweite.empfange(bewegt)
  assert.equal(fremde.nachrichten.length, 0)
  assert.equal(fremderStart.spieler.length, 1)

  await warte(110)
  erste.sende({ typ: 'bewegung', x: 2000, y: 0 })
  await zweite.empfange(nachricht => nachricht.typ === 'spieler' &&
    nachricht.spieler.some(spieler => spieler.id === willkommen.id && spieler.x === 1235 && spieler.y === 300))
  const geschlossen = once(zweite.socket, 'close')
  zweite.socket.close()
  await geschlossen
  await erste.empfange(nachricht => nachricht.typ === 'spieler' && nachricht.spieler.length === 1)
  assert.equal(fremde.nachrichten.length, 0)
})

test('Gebaeudewechsel uebertraegt Ort und Position an Freunde', async kontext => {
  const { verbinde } = await testServer(kontext)
  const erste = await verbinde()
  const start = await erste.beitreten()
  const zweite = await verbinde()
  await zweite.beitreten()
  for (const ort of ['Laden', 'Caf\u00e9', 'Spielhaus', 'Stadt']) {
    erste.sende({ typ: 'ort', ort, x: 640, y: 620 })
    const nachricht = await zweite.empfange(daten => daten.typ === 'spieler' &&
      daten.spieler.some(spieler => spieler.id === start.id && spieler.ort === ort && spieler.y === 620))
    assert.equal(nachricht.spieler.find(spieler => spieler.id !== start.id).ort, 'Stadt')
  }
})

test('Privater Chat erreicht den ganzen Raum mit Server-Identitaet, aber ohne Historie', async kontext => {
  const { verbinde } = await testServer(kontext)
  const erste = await verbinde()
  const start = await erste.beitreten()
  const zweite = await verbinde()
  const zweiterStart = await zweite.beitreten('ABC123', { ...figur, name: '' })
  const fremde = await verbinde()
  await fremde.beitreten('ANDERS')
  zweite.sende({ typ: 'ort', ort: 'Laden', x: 640, y: 620 })
  await erste.empfange(daten => daten.typ === 'spieler' &&
    daten.spieler.some(spieler => spieler.id === zweiterStart.id && spieler.ort === 'Laden'))

  const vorher = Date.now()
  erste.sende({ typ: 'chat', text: '  <script>Hallo</script>  ' })
  const chat = await erste.empfange(daten => daten.typ === 'chat')
  assert.deepEqual(await zweite.empfange(daten => daten.typ === 'chat'), chat)
  assert.deepEqual(Object.keys(chat).sort(), ['nachricht', 'typ'])
  assert.deepEqual(Object.keys(chat.nachricht).sort(), ['id', 'name', 'spielerId', 'text', 'zeit'])
  assert.match(chat.nachricht.id, /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/)
  assert.notEqual(chat.nachricht.id, start.id)
  assert.equal(chat.nachricht.spielerId, start.id)
  assert.equal(chat.nachricht.name, figur.name)
  assert.equal(chat.nachricht.text, '<script>Hallo</script>')
  assert.ok(Number.isInteger(chat.nachricht.zeit))
  assert.ok(chat.nachricht.zeit >= vorher && chat.nachricht.zeit <= Date.now())

  const text = '\u{1F600}'.repeat(80)
  assert.equal(text.length, 160)
  zweite.sende({ typ: 'chat', text: ` ${text} ` })
  const antwort = await erste.empfange(daten => daten.typ === 'chat')
  assert.deepEqual(await zweite.empfange(daten => daten.typ === 'chat'), antwort)
  assert.equal(antwort.nachricht.name, 'MiNiMiNi')
  assert.equal(antwort.nachricht.spielerId, zweiterStart.id)
  assert.equal(antwort.nachricht.text, text)
  assert.notEqual(antwort.nachricht.id, chat.nachricht.id)
  assert.equal(fremde.nachrichten.filter(daten => daten.typ === 'chat').length, 0)

  const neue = await verbinde()
  await neue.beitreten()
  assert.equal(neue.nachrichten.filter(daten => daten.typ === 'chat').length, 0)
})

test('Ungueltiger Chat schliesst mit 1008, auch bei zu schneller Nachricht', async kontext => {
  const { verbinde } = await testServer(kontext)
  const faelle = [
    { typ: 'chat' },
    ...['', '   ', 'A'.repeat(161), '\u{1F600}'.repeat(81), null, 7, true, [], {}]
      .map(text => ({ typ: 'chat', text })),
    ...Array.from({ length: 65 }, (_, nummer) => nummer < 32 ? nummer : nummer + 95)
      .map(code => ({ typ: 'chat', text: `Hallo${String.fromCharCode(code)}` })),
    { typ: 'chat', text: '\nHallo' },
    ...['extra', 'name', 'id', 'spielerId', 'zeit', 'raum', 'nachricht']
      .map(feld => ({ typ: 'chat', text: 'Hallo', [feld]: 'Fremd' }))
  ]
  for (const nachricht of faelle) {
    const client = await verbinde()
    await client.beitreten()
    client.sende({ typ: 'chat', text: 'Gueltig' })
    await client.empfange(daten => daten.typ === 'chat')
    const geschlossen = once(client.socket, 'close')
    client.sende(nachricht)
    assert.equal((await geschlossen)[0], 1008)
    assert.equal(client.nachrichten.filter(daten => daten.typ === 'chat').length, 0)
  }
})

test('Chat begrenzt jeden Spieler auf eine Nachricht pro Sekunde ohne Trennung', async kontext => {
  kontext.mock.timers.enable({ apis: ['Date'], now: 10000 })
  const { verbinde } = await testServer(kontext)
  const erste = await verbinde()
  const zweite = await verbinde()
  await erste.beitreten()
  await zweite.beitreten()
  erste.sende({ typ: 'chat', text: 'Erste' })
  await erste.empfange(daten => daten.typ === 'chat')
  await zweite.empfange(daten => daten.typ === 'chat')
  for (let nummer = 0; nummer < 20; nummer++) erste.sende({ typ: 'chat', text: 'Zu schnell' })
  let pong = once(erste.socket, 'pong')
  erste.socket.ping()
  await pong
  kontext.mock.timers.tick(999)
  erste.sende({ typ: 'chat', text: 'Noch zu schnell' })
  pong = once(erste.socket, 'pong')
  erste.socket.ping()
  await pong
  zweite.sende({ typ: 'chat', text: 'Eigene Sekunde' })
  const antwort = await erste.empfange(daten => daten.typ === 'chat')
  assert.equal(antwort.nachricht.text, 'Eigene Sekunde')
  assert.deepEqual(await zweite.empfange(daten => daten.typ === 'chat'), antwort)
  kontext.mock.timers.tick(1)
  erste.sende({ typ: 'chat', text: 'Nach genau 1000 ms' })
  const danach = await erste.empfange(daten => daten.typ === 'chat')
  assert.equal(danach.nachricht.text, 'Nach genau 1000 ms')
  assert.equal(danach.nachricht.zeit, 11000)
  assert.deepEqual(await zweite.empfange(daten => daten.typ === 'chat'), danach)
  for (const client of [erste, zweite]) {
    assert.equal(client.socket.readyState, WebSocket.OPEN)
    assert.equal(client.nachrichten.filter(daten => daten.typ === 'chat').length, 0)
  }
})

test('Bewegungsflut wird pro Client und Raum begrenzt', async kontext => {
  const { verbinde } = await testServer(kontext)
  const erste = await verbinde()
  const zweite = await verbinde()
  await erste.beitreten()
  await zweite.beitreten()
  await zweite.empfange(nachricht => nachricht.typ === 'spieler' && nachricht.spieler.length === 2)
  for (let nummer = 0; nummer < 100; nummer++) erste.sende({ typ: 'bewegung', x: 100 + nummer, y: 400 })
  for (let nummer = 0; nummer < 100; nummer++) zweite.sende({ typ: 'bewegung', x: 300 + nummer, y: 500 })
  await warte(350)
  const bewegungen = zweite.nachrichten.filter(nachricht => nachricht.typ === 'spieler')
  assert.equal(bewegungen.length, 1)
  assert.deepEqual(bewegungen[0].spieler.map(spieler => spieler.x), [100, 300])
})

test('Ungueltige Nachrichten werden abgewiesen', async kontext => {
  const { verbinde } = await testServer(kontext)
  const beitritt = { typ: 'beitreten', raum: 'ABC123', figur }
  const faelle = [
    ['{', 1008], [Buffer.from('binaer'), 1008], ['null', 1008], ['[]', 1008],
    [JSON.stringify({ ...beitritt, raum: 'abc123' }), 1008],
    [JSON.stringify({ ...beitritt, raum: 'ABC' }), 1008],
    [JSON.stringify({ ...beitritt, raum: 'ABCDEFGHIJKLM' }), 1008],
    ...[null, 7, '', 'A'.repeat(32), 'a'.repeat(31), 'a'.repeat(33), 'g'.repeat(32)]
      .map(konto => [JSON.stringify({ ...beitritt, konto }), 1008]),
    [JSON.stringify({ ...beitritt, konto: 'a'.repeat(32), extra: true }), 1008],
    ...[
      { name: '<script>' }, { name: 'A'.repeat(25) }, { name: 'Mini\n' },
      { frisur: 'Unbekannt' }, { kleidung: 'Unbekannt' }, { geschlecht: 'Unbekannt' },
      { haut: 'red' }, { alter: -1 }, { alter: 8.5 }, { email: 'nicht-erlaubt' }
    ].map(aenderung => [JSON.stringify({ ...beitritt, figur: { ...figur, ...aenderung } }), 1008]),
    [JSON.stringify({ typ: 'bewegung', x: 100, y: 400 }), 1008],
    [JSON.stringify({ typ: 'chat', text: 'Hallo' }), 1008],
    [JSON.stringify({ typ: 'laden', offen: true }), 1008],
    [JSON.stringify({ typ: 'kaufen', artikel: 'ball' }), 1008],
    ['A'.repeat(4097), 1009]
  ]
  for (const [daten, erwarteterCode] of faelle) {
    const client = await verbinde()
    const geschlossen = once(client.socket, 'close')
    client.socket.send(daten)
    const [code] = await geschlossen
    assert.equal(code, erwarteterCode)
    assert.equal(client.nachrichten.length, 0)
  }
  for (const nachricht of [beitritt, { typ: 'bewegung', x: '100', y: 400 }, { typ: 'bewegung', x: null, y: 400 }, { typ: 'bewegung', x: 100, y: 400, extra: true }, { typ: 'ort', ort: 'Unbekannt', x: 640, y: 620 }, { typ: 'ort', ort: 'Laden', x: null, y: 620 }]) {
    const client = await verbinde()
    await client.beitreten()
    const geschlossen = once(client.socket, 'close')
    client.sende(nachricht)
    assert.equal((await geschlossen)[0], 1008)
  }
})

test('Raumgrenze und Freigabe nach dem letzten Abschied', async kontext => {
  const { verbinde } = await testServer(kontext)
  const clients = []
  for (let nummer = 0; nummer < 12; nummer++) {
    const client = await verbinde()
    await client.beitreten()
    clients.push(client)
  }
  const zuViel = await verbinde()
  const geschlossen = once(zuViel.socket, 'close')
  zuViel.sende({ typ: 'beitreten', raum: 'ABC123', figur })
  assert.equal((await geschlossen)[0], 1008)
  for (const client of clients) {
    const abschied = once(client.socket, 'close')
    client.socket.close()
    await abschied
  }
  const neue = await verbinde()
  assert.equal((await neue.beitreten()).spieler.length, 1)
})

test('Maximal 100 Raeume; leere Raeume geben Platz frei', async kontext => {
  const { verbinde } = await testServer(kontext)
  let erste
  for (let nummer = 0; nummer < 100; nummer++) {
    const client = await verbinde()
    await client.beitreten(`R${String(nummer).padStart(3, '0')}`)
    erste ||= client
  }
  const client = await verbinde()
  const geschlossen = once(client.socket, 'close')
  client.sende({ typ: 'beitreten', raum: 'NEUER', figur })
  assert.equal((await geschlossen)[0], 1008)
  const abschied = once(erste.socket, 'close')
  erste.socket.close()
  await abschied
  const ersatz = await verbinde()
  assert.equal((await ersatz.beitreten('NEUER')).spieler.length, 1)
})

test('Origin: gleicher Host oder ausdrueckliche Freigabe; ohne Origin erlaubt', async kontext => {
  const vorher = process.env.ONLINE_ORIGINS
  process.env.ONLINE_ORIGINS = 'https://stadt.example'
  kontext.after(() => {
    if (vorher === undefined) delete process.env.ONLINE_ORIGINS
    else process.env.ONLINE_ORIGINS = vorher
  })
  const { verbinde, url } = await testServer(kontext)
  for (const origin of [url.replace('ws:', 'http:').replace('/minimini-online', ''), 'https://stadt.example']) {
    const client = await verbinde({ origin })
    assert.equal((await client.beitreten()).typ, 'willkommen')
  }
  for (const origin of ['https://fremd.example', 'null', 'http://[ungueltig', 'https://stadt.example/pfad']) {
    const socket = new WebSocket(url, { origin })
    const [, antwort] = await once(socket, 'unexpected-response')
    assert.equal(antwort.statusCode, 403)
    socket.on('error', () => {})
    antwort.resume()
    socket.terminate()
  }
})

test('Aufraeumen beendet Sockets und entfernt nur den eigenen Upgrade-Anschluss', async kontext => {
  const { verbinde, server, aufraeumen } = await testServer(kontext)
  const client = await verbinde()
  await client.beitreten()
  const geschlossen = once(client.socket, 'close')
  aufraeumen()
  aufraeumen()
  await geschlossen
  assert.equal(server.listenerCount('upgrade'), 0)
})

test('Heartbeat entfernt eine Verbindung ohne Pong', async kontext => {
  kontext.mock.timers.enable({ apis: ['setInterval'] })
  const { verbinde } = await testServer(kontext)
  const client = await verbinde({ autoPong: false })
  await client.beitreten()
  const ping = once(client.socket, 'ping')
  kontext.mock.timers.tick(30000)
  await ping
  const geschlossen = once(client.socket, 'close')
  kontext.mock.timers.tick(30000)
  await geschlossen
})

test('Einzelserver startet mit PORT und liefert nur einen Health-Endpunkt', { timeout: 5000 }, async kontext => {
  const prozess = spawn(process.execPath, [fileURLToPath(new URL('./index.js', import.meta.url))], {
    env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe']
  })
  kontext.after(async () => {
    if (prozess.exitCode !== null || prozess.signalCode !== null) return
    const geschlossen = once(prozess, 'close')
    prozess.kill()
    await geschlossen
  })
  const [ausgabe] = await once(prozess.stdout, 'data')
  const port = /Port (\d+)/.exec(ausgabe.toString())[1]
  const adresse = `http://127.0.0.1:${port}`
  const antwort = await fetch(`${adresse}/health`)
  assert.equal(antwort.status, 200)
  assert.deepEqual(await antwort.json(), { ok: true })
  assert.equal((await fetch(`${adresse}/`)).status, 404)
  const socket = new WebSocket(`${adresse.replace('http:', 'ws:')}/falscher-pfad`)
  const [, abgelehnt] = await once(socket, 'unexpected-response')
  assert.equal(abgelehnt.statusCode, 404)
  socket.on('error', () => {})
  abgelehnt.resume()
  socket.terminate()
})