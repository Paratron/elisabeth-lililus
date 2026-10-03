import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { once } from 'node:events'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import WebSocket from 'ws'
import { registriereOnline } from './online.js'
import { erstelleWirtschaft } from './wirtschaft.js'

const kennung = () => randomBytes(16).toString('hex')
const figur = {
  name: 'Mini', haut: '#ffdbac', haare: '#6b3a2a', frisur: 'Kurz',
  oberteil: '#ed637b', hose: '#386cba', schuhe: '#f5c84c', kleidung: 'T-Shirt',
  geschlecht: 'Keine Auswahl', alter: 8
}
const start = { muenzen: 20, inventar: { teddy: 2, blume: 3, kuchen: 3, ball: 2, muschel: 0, perle: 0, kristall: 0 }, post: [], briefe: [], laden: false }

function temporaer(kontext) {
  const ordner = mkdtempSync(join(tmpdir(), 'minimini-wirtschaft-'))
  kontext.after(() => rmSync(ordner, { recursive: true, force: true }))
  return join(ordner, 'wirtschaft.json')
}

function wirtschaftProbe(kontext, datei = null) {
  const personen = []
  const ausgaben = []
  const wirtschaft = erstelleWirtschaft({ datei, spieler: () => personen,
    sende: (socket, nachricht) => ausgaben.push({ socket, nachricht }) })
  kontext.after(wirtschaft.aufraeumen)
  function verbinde(konto = kennung()) {
    const person = { id: randomUUID(), socket: {}, figur, raum: 'MINIMINIS3' }
    assert.equal(wirtschaft.anmelden(person, konto), true)
    personen.push(person)
    return person
  }
  function sende(person, nachricht) {
    ausgaben.length = 0
    assert.equal(wirtschaft.nachricht(person, nachricht), true)
    return ausgaben.filter(eintrag => eintrag.socket === person.socket).map(eintrag => eintrag.nachricht)
  }
  function trenne(person) {
    personen.splice(personen.indexOf(person), 1)
    wirtschaft.entferne(person)
  }
  return { wirtschaft, verbinde, sende, trenne, ausgaben }
}

async function testServer(kontext, wirtschaftDatei = null) {
  const server = createServer()
  const aufraeumen = registriereOnline(server, { wirtschaftDatei, besucheDatei: null })
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
  async function verbinde(konto = kennung(), raum = 'MINIMINIS3') {
    const socket = new WebSocket(`ws://127.0.0.1:${server.address().port}/minimini-online`)
    sockets.push(socket)
    const nachrichten = []
    const wartende = new Set()
    const client = { socket, nachrichten }
    socket.on('message', daten => {
      const nachricht = JSON.parse(daten.toString())
      if (nachricht.typ === 'willkommen') client.daten = nachricht.wirtschaft
      if (nachricht.typ === 'wirtschaft') client.daten = nachricht.daten
      nachrichten.push(nachricht)
      for (const pruefe of wartende) pruefe()
    })
    client.empfange = bedingung => new Promise((resolve, reject) => {
      const timer = setTimeout(() => { wartende.delete(pruefe); reject(new Error('Wirtschaftsantwort fehlt')) }, 2000)
      function pruefe() {
        const index = nachrichten.findIndex(bedingung)
        if (index < 0) return
        clearTimeout(timer)
        wartende.delete(pruefe)
        resolve(nachrichten.splice(index, 1)[0])
      }
      wartende.add(pruefe)
      pruefe()
    })
    client.sende = nachricht => socket.send(JSON.stringify(nachricht))
    client.aktion = async nachricht => {
      const pong = once(socket, 'pong')
      socket.ping()
      await pong
      for (let index = nachrichten.length - 1; index >= 0; index--) {
        if (nachrichten[index].typ === 'handel-status') nachrichten.splice(index, 1)
      }
      client.sende(nachricht)
      return client.empfange(daten => daten.typ === 'handel-status')
    }
    await once(socket, 'open')
    client.sende({ typ: 'beitreten', raum, figur, ...(konto === null ? {} : { konto }) })
    client.start = await client.empfange(daten => daten.typ === 'willkommen')
    client.id = client.start.id
    return client
  }
  return { verbinde, schliessen }
}

async function angebot(sender, empfaenger, details = { typ: 'geschenk', artikel: 'teddy' }) {
  const antwort = await sender.aktion({ ...details, empfaenger: empfaenger.id })
  assert.match(antwort.text, /wartet/)
  return (await empfaenger.empfange(daten => daten.typ === 'angebot')).daten
}

test('Standkauf uebertraegt atomar echte Sachen und Muenzen; prueft Ort, Raum, Konto und Guthaben', kontext => {
  const { wirtschaft, verbinde, sende, trenne } = wirtschaftProbe(kontext)
  const verkaeufer = verbinde()
  const kaeufer = verbinde()
  verkaeufer.hausId = randomUUID()
  verkaeufer.ort = `Haus:${verkaeufer.hausId}`
  kaeufer.ort = verkaeufer.ort
  sende(verkaeufer, { typ: 'laden', offen: true })
  const kauf = { typ: 'standkauf', verkaeufer: verkaeufer.id, artikel: 'blume' }
  for (const aenderung of [{ ort: 'Stadt' }, { raum: 'ANDERS' }]) {
    Object.assign(kaeufer, aenderung)
    sende(kaeufer, kauf)
    assert.equal(wirtschaft.daten(kaeufer).muenzen, 20)
    Object.assign(kaeufer, { raum: verkaeufer.raum, ort: verkaeufer.ort })
  }
  const selbst = verbinde(verkaeufer.konto)
  selbst.ort = verkaeufer.ort
  sende(selbst, kauf)
  assert.equal(wirtschaft.daten(verkaeufer).muenzen, 20)
  sende(kaeufer, kauf)
  assert.equal(wirtschaft.daten(kaeufer).muenzen, 12)
  assert.equal(wirtschaft.daten(kaeufer).inventar.blume, 4)
  assert.equal(wirtschaft.daten(verkaeufer).muenzen, 28)
  assert.equal(wirtschaft.daten(verkaeufer).inventar.blume, 2)
  sende(kaeufer, kauf)
  const vorher = [wirtschaft.daten(kaeufer), wirtschaft.daten(verkaeufer)]
  sende(kaeufer, kauf)
  assert.deepEqual([wirtschaft.daten(kaeufer), wirtschaft.daten(verkaeufer)], vorher)
  trenne(kaeufer)
  sende(kaeufer, kauf)
  assert.deepEqual(wirtschaft.daten(verkaeufer), vorher[1])
})

test('Standkauf: geschlossen, ausverkauft, falsches Gastgeberhaus, volle Konten und Schreibfehler buchen keinen Teil', kontext => {
  const datei = temporaer(kontext)
  for (const fall of ['geschlossen', 'ausverkauft', 'haus', 'muenzen', 'inventar', 'speichern', 'erfolg']) {
    const kaeuferKennung = kennung()
    const verkaeuferKennung = kennung()
    const kaeuferKonto = structuredClone(start)
    const verkaeuferKonto = { ...structuredClone(start), laden: fall !== 'geschlossen' }
    if (fall === 'ausverkauft') verkaeuferKonto.inventar.teddy = 0
    if (fall === 'muenzen') verkaeuferKonto.muenzen = 999993
    if (fall === 'inventar') kaeuferKonto.inventar.teddy = 1000
    writeFileSync(datei, JSON.stringify({ version: 1, konten: { [kaeuferKennung]: kaeuferKonto, [verkaeuferKennung]: verkaeuferKonto } }))
    const { wirtschaft, verbinde, sende, ausgaben } = wirtschaftProbe(kontext, datei)
    const kaeufer = verbinde(kaeuferKennung)
    const verkaeufer = verbinde(verkaeuferKennung)
    verkaeufer.hausId = randomUUID()
    verkaeufer.ort = fall === 'haus' ? `Haus:${randomUUID()}` : `Haus:${verkaeufer.hausId}`
    kaeufer.ort = verkaeufer.ort
    if (fall === 'speichern') { rmSync(datei); mkdirSync(datei) }
    sende(kaeufer, { typ: 'standkauf', verkaeufer: verkaeufer.id, artikel: 'teddy' })
    if (fall === 'erfolg') {
      const gespeichert = JSON.parse(readFileSync(datei, 'utf8'))
      assert.equal(gespeichert.konten[kaeuferKennung].muenzen, 12)
      assert.equal(gespeichert.konten[verkaeuferKennung].muenzen, 28)
      assert.equal(gespeichert.konten[kaeuferKennung].inventar.teddy, 3)
      assert.equal(gespeichert.konten[verkaeuferKennung].inventar.teddy, 1)
    } else {
      assert.deepEqual(wirtschaft.daten(kaeufer), kaeuferKonto, fall)
      assert.deepEqual(wirtschaft.daten(verkaeufer), verkaeuferKonto, fall)
      assert.equal(ausgaben.filter(eintrag => eintrag.nachricht.typ === 'wirtschaft').length, 0, fall)
    }
    if (fall === 'speichern') rmSync(datei, { recursive: true })
  }
})

test('Geschenk braucht Zustimmung; nur Empfaenger darf antworten; doppelte Annahme bleibt wirkungslos', async kontext => {
  const { verbinde } = await testServer(kontext)
  const sender = await verbinde()
  const empfaenger = await verbinde()
  const fremde = await verbinde()
  assert.deepEqual(sender.daten, start)
  const paket = await angebot(sender, empfaenger)
  assert.deepEqual(Object.keys(paket).sort(), ['art', 'artikel', 'id', 'name', 'von'])
  assert.equal(paket.von, sender.id)
  assert.equal(paket.art, 'geschenk')
  assert.equal(paket.artikel, 'teddy')
  assert.deepEqual(sender.daten, start)
  assert.deepEqual(empfaenger.daten, start)
  await fremde.aktion({ typ: 'angebot', id: paket.id, annehmen: false })
  await fremde.aktion({ typ: 'angebot', id: paket.id, annehmen: true })
  assert.deepEqual(empfaenger.daten, start)
  await empfaenger.aktion({ typ: 'angebot', id: paket.id, annehmen: true })
  await sender.empfange(daten => daten.typ === 'wirtschaft')
  assert.equal(sender.daten.inventar.teddy, 1)
  assert.equal(empfaenger.daten.inventar.teddy, 3)
  assert.equal(sender.daten.post.length, 0)
  assert.deepEqual(Object.keys(empfaenger.daten.post[0]).sort(), ['art', 'artikel', 'id', 'von', 'zeit'])
  assert.equal(empfaenger.daten.post[0].art, 'geschenk')
  assert.equal(empfaenger.daten.post[0].von, 'Mini')
  assert.ok(Number.isSafeInteger(empfaenger.daten.post[0].zeit))
  await empfaenger.empfange(daten => daten.typ === 'angebot-ende' && daten.id === paket.id)
  empfaenger.sende({ typ: 'angebot', id: paket.id, annehmen: true })
  await empfaenger.aktion({ typ: 'laden', offen: true })
  assert.equal(empfaenger.daten.inventar.teddy, 3)
  assert.equal(empfaenger.daten.post.length, 1)
})

test('Tausch erhaelt alle Sachen und schreibt beide historischen Posteintraege', async kontext => {
  const { verbinde } = await testServer(kontext)
  const sender = await verbinde()
  const empfaenger = await verbinde()
  const paket = await angebot(sender, empfaenger, { typ: 'tausch', gib: 'teddy', nimm: 'blume' })
  assert.deepEqual(Object.keys(paket).sort(), ['art', 'gib', 'id', 'name', 'nimm', 'von'])
  await empfaenger.aktion({ typ: 'angebot', id: paket.id, annehmen: true })
  await sender.empfange(daten => daten.typ === 'wirtschaft')
  assert.deepEqual(sender.daten.inventar, { ...start.inventar, teddy: 1, blume: 4 })
  assert.deepEqual(empfaenger.daten.inventar, { ...start.inventar, teddy: 3, blume: 2 })
  assert.equal(sender.daten.post[0].artikel, 'blume')
  assert.equal(empfaenger.daten.post[0].artikel, 'teddy')
  assert.equal(sender.daten.post[0].art, 'tausch')
  assert.notEqual(sender.daten.post[0].id, empfaenger.daten.post[0].id)
  await sender.aktion({ typ: 'laden', offen: true })
  await sender.aktion({ typ: 'verkaufen', artikel: 'blume' })
  assert.equal(sender.daten.post.length, 1)
})

test('Ablehnen veraendert nichts und gibt die Angebotsplaetze wieder frei', async kontext => {
  const { verbinde } = await testServer(kontext)
  const sender = await verbinde()
  const empfaenger = await verbinde()
  const paket = await angebot(sender, empfaenger)
  await empfaenger.aktion({ typ: 'angebot', id: paket.id, annehmen: false })
  await empfaenger.empfange(daten => daten.typ === 'angebot-ende')
  assert.deepEqual(sender.daten, start)
  assert.deepEqual(empfaenger.daten, start)
  await angebot(sender, empfaenger)
})

test('Bei inzwischen fehlendem Inventar wird der ganze Tausch ohne Teiluebergabe beendet', async kontext => {
  kontext.mock.timers.enable({ apis: ['Date'], now: 10000 })
  const { verbinde } = await testServer(kontext)
  const sender = await verbinde()
  const empfaenger = await verbinde()
  const paket = await angebot(sender, empfaenger, { typ: 'tausch', gib: 'teddy', nimm: 'blume' })
  await empfaenger.aktion({ typ: 'laden', offen: true })
  for (let nummer = 0; nummer < 3; nummer++) {
    await empfaenger.aktion({ typ: 'verkaufen', artikel: 'blume' })
    kontext.mock.timers.tick(1000)
  }
  const vorher = structuredClone(empfaenger.daten)
  await empfaenger.aktion({ typ: 'angebot', id: paket.id, annehmen: true })
  await empfaenger.empfange(daten => daten.typ === 'angebot-ende')
  assert.deepEqual(empfaenger.daten, vorher)
  assert.deepEqual(sender.daten, start)
})

test('Raumtrennung, Selbsttransfer und Angebotsgrenzen gelten pro Konto statt pro Socket', async kontext => {
  const { verbinde } = await testServer(kontext)
  const konto = kennung()
  const sender = await verbinde(konto)
  const zweiterSender = await verbinde(konto)
  const zielKonto = kennung()
  const empfaenger = await verbinde(zielKonto)
  const zweiterEmpfaenger = await verbinde(zielKonto)
  const fremde = await verbinde(kennung(), 'ANDERS')
  const dritte = await verbinde()
  for (const ziel of [sender, zweiterSender, fremde]) {
    await sender.aktion({ typ: 'geschenk', empfaenger: ziel.id, artikel: 'teddy' })
    assert.deepEqual(sender.daten, start)
    assert.equal(ziel.nachrichten.filter(daten => daten.typ === 'angebot').length, 0)
  }
  const paket = await angebot(sender, empfaenger)
  assert.match((await zweiterSender.aktion({ typ: 'geschenk', empfaenger: dritte.id, artikel: 'ball' })).text, /schon/)
  assert.match((await dritte.aktion({ typ: 'geschenk', empfaenger: zweiterEmpfaenger.id, artikel: 'ball' })).text, /schon/)
  assert.match((await zweiterEmpfaenger.aktion({ typ: 'angebot', id: paket.id, annehmen: true })).text, /nicht fuer dich/)
  await empfaenger.aktion({ typ: 'angebot', id: paket.id, annehmen: true })
  await zweiterSender.empfange(daten => daten.typ === 'wirtschaft')
  await zweiterEmpfaenger.empfange(daten => daten.typ === 'wirtschaft')
  assert.deepEqual(zweiterSender.daten, sender.daten)
  assert.deepEqual(zweiterEmpfaenger.daten, empfaenger.daten)
  for (const client of [sender, empfaenger]) {
    assert.ok(!JSON.stringify(client.nachrichten).includes(konto))
    assert.ok(!Object.hasOwn(client.start, 'konto'))
    assert.ok(client.start.spieler.every(person => !Object.hasOwn(person, 'konto')))
  }
})

test('Kaufen kostet 5, NPC-Verkauf braucht Laden und verbraucht 1; Cooldown gilt auch fuer weitere Sockets und Reconnect', async kontext => {
  kontext.mock.timers.enable({ apis: ['Date'], now: 10000 })
  const { verbinde } = await testServer(kontext)
  const konto = kennung()
  const client = await verbinde(konto)
  await client.aktion({ typ: 'verkaufen', artikel: 'kuchen' })
  assert.deepEqual(client.daten, start)
  await client.aktion({ typ: 'kaufen', artikel: 'teddy' })
  assert.equal(client.daten.muenzen, 15)
  assert.equal(client.daten.inventar.teddy, 3)
  await client.aktion({ typ: 'laden', offen: true })
  assert.match((await client.aktion({ typ: 'verkaufen', artikel: 'kuchen' })).text, /erfundener Spielkunde/)
  assert.equal(client.daten.muenzen, 23)
  assert.equal(client.daten.inventar.kuchen, 2)
  const zweite = await verbinde(konto)
  await zweite.aktion({ typ: 'verkaufen', artikel: 'kuchen' })
  assert.equal(zweite.daten.muenzen, 23)
  for (const person of [client, zweite]) {
    const geschlossen = once(person.socket, 'close')
    person.socket.close()
    await geschlossen
  }
  const erneut = await verbinde(konto)
  kontext.mock.timers.tick(999)
  await erneut.aktion({ typ: 'verkaufen', artikel: 'kuchen' })
  assert.equal(erneut.daten.muenzen, 23)
  kontext.mock.timers.tick(1)
  await erneut.aktion({ typ: 'verkaufen', artikel: 'kuchen' })
  assert.equal(erneut.daten.muenzen, 31)
  assert.equal(erneut.daten.inventar.kuchen, 1)
  await erneut.aktion({ typ: 'laden', offen: false })
  for (let nummer = 0; nummer < 7; nummer++) await erneut.aktion({ typ: 'kaufen', artikel: 'ball' })
  assert.equal(erneut.daten.muenzen, 1)
  assert.equal(erneut.daten.inventar.ball, 8)
  assert.equal(erneut.daten.laden, false)
})

test('Abschied beider Seiten beendet Angebote und gibt Plaetze frei', async kontext => {
  const { verbinde } = await testServer(kontext)
  for (const senderGeht of [true, false]) {
    const sender = await verbinde()
    const empfaenger = await verbinde()
    const paket = await angebot(sender, empfaenger)
    const gehende = senderGeht ? sender : empfaenger
    const bleibende = senderGeht ? empfaenger : sender
    const geschlossen = once(gehende.socket, 'close')
    gehende.socket.close()
    await geschlossen
    assert.match((await bleibende.empfange(daten => daten.typ === 'handel-status')).text, /getrennt/)
    if (senderGeht) await empfaenger.empfange(daten => daten.typ === 'angebot-ende' && daten.id === paket.id)
    const neue = await verbinde()
    await angebot(senderGeht ? neue : sender, senderGeht ? empfaenger : neue)
  }
})

test('Angebote laufen nach zwei Minuten ab und koennen nicht spaet angenommen werden', async kontext => {
  kontext.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 10000 })
  const { verbinde } = await testServer(kontext)
  const sender = await verbinde()
  const empfaenger = await verbinde()
  const paket = await angebot(sender, empfaenger)
  kontext.mock.timers.tick(119999)
  assert.equal(empfaenger.nachrichten.filter(daten => daten.typ === 'angebot-ende').length, 0)
  kontext.mock.timers.tick(1)
  await empfaenger.empfange(daten => daten.typ === 'angebot-ende' && daten.id === paket.id)
  empfaenger.sende({ typ: 'angebot', id: paket.id, annehmen: true })
  await empfaenger.aktion({ typ: 'laden', offen: true })
  assert.deepEqual(sender.daten, start)
  assert.equal(empfaenger.daten.inventar.teddy, 2)
  await angebot(sender, empfaenger)
})

test('Strenge Wirtschafts-Schemas schliessen mit 1008; unbekannte Artikel geben nur Status', async kontext => {
  const { verbinde } = await testServer(kontext)
  const fehler = [
    { typ: 'laden', offen: 1 }, { typ: 'laden', offen: true, extra: true },
    { typ: 'kaufen', artikel: null }, { typ: 'verkaufen', artikel: 'ball', preis: 8 },
    { typ: 'standkauf', verkaeufer: 'falsch', artikel: 'ball' },
    { typ: 'standkauf', verkaeufer: randomUUID(), artikel: null },
    { typ: 'standkauf', verkaeufer: randomUUID(), artikel: 'ball', preis: 1 },
    { typ: 'geschenk', empfaenger: 'falsch', artikel: 'ball' },
    { typ: 'tausch', empfaenger: randomUUID(), gib: 'ball', nimm: [] },
    { typ: 'angebot', id: randomUUID(), annehmen: 'ja' }, { typ: 'angebot', id: 'falsch', annehmen: true },
    { typ: 'angebot', id: randomUUID(), annehmen: false, extra: 1 },
    { typ: 'tauchen', funde: [] }, { typ: 'tauchfund' }, { typ: 'tauchfund', id: null },
    { typ: 'tauchfund', id: 'falsch' }, { typ: 'tauchfund', id: randomUUID(), artikel: 'kristall' }
  ]
  for (const nachricht of fehler) {
    const client = await verbinde()
    const geschlossen = once(client.socket, 'close')
    client.sende(nachricht)
    assert.equal((await geschlossen)[0], 1008)
  }
  const client = await verbinde()
  await client.aktion({ typ: 'kaufen', artikel: 'unbekannt' })
  await client.aktion({ typ: 'geschenk', empfaenger: randomUUID(), artikel: 'ball' })
  assert.deepEqual(client.daten, start)
  assert.equal(client.socket.readyState, WebSocket.OPEN)
})

test('Konto wird bei Wiederverbindung und Server-Neustart gespeichert; Gaeste bleiben temporaer', async kontext => {
  const datei = temporaer(kontext)
  const konto = kennung()
  const ersterServer = await testServer(kontext, datei)
  const client = await ersterServer.verbinde(konto)
  const gast = await ersterServer.verbinde(null)
  await client.aktion({ typ: 'laden', offen: true })
  await client.aktion({ typ: 'kaufen', artikel: 'ball' })
  const paket = await angebot(gast, client)
  await client.aktion({ typ: 'angebot', id: paket.id, annehmen: true })
  const vorher = structuredClone(client.daten)
  const geschlossen = once(client.socket, 'close')
  client.socket.close()
  await geschlossen
  assert.deepEqual((await ersterServer.verbinde(konto)).daten, vorher)
  await ersterServer.schliessen()
  const gespeichert = JSON.parse(readFileSync(datei, 'utf8'))
  assert.equal(Object.keys(gespeichert.konten).length, 1)
  const zweiterServer = await testServer(kontext, datei)
  assert.deepEqual((await zweiterServer.verbinde(konto)).daten, vorher)
  assert.deepEqual((await zweiterServer.verbinde(null)).daten, start)
})

test('Grenzen fuer Muenzen, Mengen und letzte 30 Posteintraege; Speicherfehler uebernimmt keinen Teilhandel', kontext => {
  const datei = temporaer(kontext)
  const senderKonto = kennung()
  const zielKonto = kennung()
  const voll = structuredClone(start)
  voll.muenzen = 1000000
  voll.laden = true
  voll.inventar.teddy = 1000
  writeFileSync(datei, JSON.stringify({ version: 1, konten: { [senderKonto]: start, [zielKonto]: voll } }))
  const personen = []
  const ausgaben = []
  const wirtschaft = erstelleWirtschaft({ datei, spieler: () => personen, sende: (socket, nachricht) => ausgaben.push({ socket, nachricht }) })
  kontext.after(wirtschaft.aufraeumen)
  function person(konto) {
    const person = { id: randomUUID(), socket: {}, figur, raum: 'MINIMINIS3' }
    assert.ok(wirtschaft.anmelden(person, konto))
    personen.push(person)
    return person
  }
  const sender = person(senderKonto)
  const ziel = person(zielKonto)
  wirtschaft.nachricht(ziel, { typ: 'kaufen', artikel: 'teddy' })
  wirtschaft.nachricht(ziel, { typ: 'verkaufen', artikel: 'kuchen' })
  assert.deepEqual(wirtschaft.daten(ziel), voll)
  wirtschaft.nachricht(sender, { typ: 'geschenk', empfaenger: ziel.id, artikel: 'teddy' })
  let paket = ausgaben.find(eintrag => eintrag.nachricht.typ === 'angebot').nachricht.daten
  wirtschaft.nachricht(ziel, { typ: 'angebot', id: paket.id, annehmen: true })
  assert.deepEqual(wirtschaft.daten(sender), start)
  assert.deepEqual(wirtschaft.daten(ziel), voll)
  wirtschaft.nachricht(ziel, { typ: 'angebot', id: paket.id, annehmen: false })

  // Eine blockierte Zieldatei simuliert einen fehlgeschlagenen atomaren Schreibvorgang.
  rmSync(datei)
  mkdirSync(datei)
  ausgaben.length = 0
  wirtschaft.nachricht(sender, { typ: 'tausch', empfaenger: ziel.id, gib: 'ball', nimm: 'blume' })
  paket = ausgaben.find(eintrag => eintrag.nachricht.typ === 'angebot').nachricht.daten
  wirtschaft.nachricht(ziel, { typ: 'angebot', id: paket.id, annehmen: true })
  assert.deepEqual(wirtschaft.daten(sender), start)
  assert.deepEqual(wirtschaft.daten(ziel), voll)
  assert.ok(ausgaben.some(eintrag => eintrag.nachricht.text?.includes('Speichern')))
  assert.equal(ausgaben.filter(eintrag => eintrag.nachricht.typ === 'wirtschaft').length, 0)
  assert.ok(ausgaben.some(eintrag => eintrag.nachricht.typ === 'angebot-ende' && eintrag.nachricht.id === paket.id))
  wirtschaft.nachricht(sender, { typ: 'kaufen', artikel: 'ball' })
  wirtschaft.nachricht(ziel, { typ: 'laden', offen: false })
  assert.deepEqual(wirtschaft.daten(sender), start)
  assert.deepEqual(wirtschaft.daten(ziel), voll)
  rmSync(datei, { recursive: true })
  ausgaben.length = 0
  wirtschaft.nachricht(sender, { typ: 'tausch', empfaenger: ziel.id, gib: 'ball', nimm: 'blume' })
  paket = ausgaben.find(eintrag => eintrag.nachricht.typ === 'angebot').nachricht.daten
  wirtschaft.nachricht(ziel, { typ: 'angebot', id: paket.id, annehmen: true })
  assert.equal(wirtschaft.daten(sender).inventar.ball, 1)
  assert.equal(wirtschaft.daten(ziel).inventar.ball, 3)
  for (let nummer = 0; nummer < 35; nummer++) {
    ausgaben.length = 0
    wirtschaft.nachricht(ziel, { typ: 'geschenk', empfaenger: sender.id, artikel: 'teddy' })
    paket = ausgaben.find(eintrag => eintrag.nachricht.typ === 'angebot').nachricht.daten
    wirtschaft.nachricht(sender, { typ: 'angebot', id: paket.id, annehmen: true })
  }
  const post = wirtschaft.daten(sender).post
  assert.equal(post.length, 30)
  assert.equal(new Set(post.map(eintrag => eintrag.id)).size, 30)
  assert.equal(wirtschaft.daten(ziel).inventar.teddy, 965)
})

test('Kaputte gespeicherte Konten werden nicht stillschweigend geloescht', kontext => {
  const datei = temporaer(kontext)
  const konto = kennung()
  writeFileSync(datei, JSON.stringify({ version: 1, konten: { [konto]: { ...start, muenzen: -1 } } }))
  assert.throws(() => erstelleWirtschaft({ datei, spieler: () => [], sende() {} }), /ungueltig/)
  writeFileSync(datei, '{')
  assert.throws(() => erstelleWirtschaft({ datei, spieler: () => [], sende() {} }), /geladen/)
})

test('Tauchen erzeugt drei Server-IDs; 1500 ms Startzeit, 500 ms Fundabstand und Einmal-Abholung', kontext => {
  kontext.mock.timers.enable({ apis: ['Date'], now: 10000 })
  const { wirtschaft, verbinde, sende } = wirtschaftProbe(kontext)
  const person = verbinde()
  const [startAntwort] = sende(person, { typ: 'tauchen' })
  assert.deepEqual(Object.keys(startAntwort).sort(), ['funde', 'typ'])
  assert.equal(startAntwort.typ, 'tauchstart')
  const { funde } = startAntwort
  assert.equal(funde.length, 3)
  assert.equal(new Set(funde.map(fund => fund.id)).size, 3)
  for (const fund of funde) {
    assert.deepEqual(Object.keys(fund).sort(), ['artikel', 'id'])
    assert.match(fund.id, /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/)
    assert.ok(['muschel', 'perle', 'kristall'].includes(fund.artikel))
  }
  assert.equal(funde[0].artikel, 'muschel')
  assert.ok(['muschel', 'perle'].includes(funde[1].artikel))
  assert.equal(sende(person, { typ: 'tauchen' })[0].typ, 'handel-status')
  for (const artikel of ['muschel', 'perle', 'kristall']) {
    assert.match(sende(person, { typ: 'kaufen', artikel })[0].text, /nur unter Wasser/)
  }
  assert.deepEqual(wirtschaft.daten(person), start)
  const abholen = fund => sende(person, { typ: 'tauchfund', id: fund.id })
  kontext.mock.timers.tick(1499)
  assert.equal(abholen(funde[0])[0].typ, 'handel-status')
  assert.deepEqual(wirtschaft.daten(person), start)
  kontext.mock.timers.tick(1)
  assert.equal(abholen({ id: randomUUID() })[0].typ, 'handel-status')
  const erwartetesInventar = structuredClone(start.inventar)
  for (let nummer = 0; nummer < funde.length; nummer++) {
    const fund = funde[nummer]
    const antworten = abholen(fund)
    erwartetesInventar[fund.artikel]++
    assert.deepEqual(antworten.map(antwort => antwort.typ), ['wirtschaft', 'tauchfund'])
    assert.deepEqual(antworten[1], { typ: 'tauchfund', id: fund.id, artikel: fund.artikel })
    assert.deepEqual(antworten[0].daten.inventar, erwartetesInventar)
    assert.equal(abholen(fund)[0].typ, 'handel-status')
    if (nummer < 2) {
      kontext.mock.timers.tick(499)
      assert.equal(abholen(funde[nummer + 1])[0].typ, 'handel-status')
      assert.deepEqual(wirtschaft.daten(person).inventar, erwartetesInventar)
      kontext.mock.timers.tick(1)
    }
  }
  assert.equal(wirtschaft.daten(person).muenzen, 20)
  assert.deepEqual(wirtschaft.daten(person).post, [])
  const [neuerStart] = sende(person, { typ: 'tauchen' })
  assert.equal(neuerStart.typ, 'tauchstart')
  assert.ok(neuerStart.funde.every(fund => !funde.some(alt => alt.id === fund.id)))
  assert.equal(abholen(funde[0])[0].typ, 'handel-status')
  assert.deepEqual(wirtschaft.daten(person).inventar, erwartetesInventar)
})

test('Tauchgang ist kontoexklusiv und verbindungsgebunden; fremder Abschied loescht ihn nicht', kontext => {
  kontext.mock.timers.enable({ apis: ['Date'], now: 10000 })
  const { wirtschaft, verbinde, sende, trenne, ausgaben } = wirtschaftProbe(kontext)
  const konto = kennung()
  const person = verbinde(konto)
  const zweite = verbinde(konto)
  const fremde = verbinde()
  const [startAntwort] = sende(person, { typ: 'tauchen' })
  const fund = startAntwort.funde[0]
  kontext.mock.timers.tick(1500)
  for (const andere of [zweite, fremde]) {
    assert.equal(sende(andere, { typ: 'tauchfund', id: fund.id })[0].typ, 'handel-status')
    assert.deepEqual(wirtschaft.daten(andere), start)
  }
  assert.match(sende(zweite, { typ: 'tauchen' })[0].text, /laeuft noch/)
  sende(person, { typ: 'tauchfund', id: fund.id })
  assert.deepEqual(ausgaben.map(eintrag => eintrag.nachricht.typ), ['wirtschaft', 'wirtschaft', 'tauchfund'])
  assert.deepEqual(wirtschaft.daten(zweite), wirtschaft.daten(person))
  assert.deepEqual(wirtschaft.daten(fremde), start)
  trenne(zweite)
  assert.match(sende(person, { typ: 'tauchen' })[0].text, /laeuft noch/)
  const wieder = verbinde(konto)
  trenne(person)
  assert.equal(sende(wieder, { typ: 'tauchfund', id: startAntwort.funde[1].id })[0].typ, 'handel-status')
  assert.equal(sende(wieder, { typ: 'tauchen' })[0].typ, 'tauchstart')
})

test('Tauchgang laeuft exakt nach 60 Sekunden ab; Timer und Server-Abschluss geben ihn frei', kontext => {
  kontext.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 10000 })
  const { wirtschaft, verbinde, sende } = wirtschaftProbe(kontext)
  const person = verbinde()
  const [alt] = sende(person, { typ: 'tauchen' })
  kontext.mock.timers.tick(59999)
  assert.equal(sende(person, { typ: 'tauchen' })[0].typ, 'handel-status')
  kontext.mock.timers.tick(1)
  assert.equal(sende(person, { typ: 'tauchfund', id: alt.funde[0].id })[0].typ, 'handel-status')
  assert.deepEqual(wirtschaft.daten(person), start)
  assert.equal(sende(person, { typ: 'tauchen' })[0].typ, 'tauchstart')
  wirtschaft.aufraeumen()
  assert.equal(sende(person, { typ: 'tauchen' })[0].typ, 'tauchstart')
})

test('Serverzeit verhindert spaete Funde auch ohne abgelaufenen Timer', kontext => {
  kontext.mock.timers.enable({ apis: ['Date'], now: 10000 })
  const { wirtschaft, verbinde, sende } = wirtschaftProbe(kontext)
  const person = verbinde()
  const [alt] = sende(person, { typ: 'tauchen' })
  kontext.mock.timers.tick(60000)
  assert.equal(sende(person, { typ: 'tauchfund', id: alt.funde[0].id })[0].typ, 'handel-status')
  assert.deepEqual(wirtschaft.daten(person), start)
  assert.equal(sende(person, { typ: 'tauchen' })[0].typ, 'tauchstart')
})

test('Tauchfund wird dauerhaft gespeichert und vor Bestaetigung verteilt; IDs ueberleben keinen Neustart', async kontext => {
  kontext.mock.timers.enable({ apis: ['Date'], now: 10000 })
  const datei = temporaer(kontext)
  const konto = kennung()
  const erster = await testServer(kontext, datei)
  const client = await erster.verbinde(konto)
  const zweite = await erster.verbinde(konto)
  client.sende({ typ: 'tauchen' })
  const { funde } = await client.empfange(daten => daten.typ === 'tauchstart')
  kontext.mock.timers.tick(1500)
  client.sende({ typ: 'tauchfund', id: funde[0].id })
  assert.deepEqual(await client.empfange(daten => daten.typ === 'tauchfund'),
    { typ: 'tauchfund', ...funde[0] })
  await zweite.empfange(daten => daten.typ === 'wirtschaft')
  assert.equal(client.daten.inventar.muschel, 1)
  assert.deepEqual(zweite.daten, client.daten)
  const gespeichert = JSON.parse(readFileSync(datei, 'utf8'))
  assert.deepEqual(gespeichert, { version: 1, konten: { [konto]: client.daten } })
  await client.aktion({ typ: 'tauchfund', id: funde[0].id })
  assert.equal(client.daten.inventar.muschel, 1)
  await erster.schliessen()
  const neuer = await testServer(kontext, datei)
  const wieder = await neuer.verbinde(konto)
  assert.deepEqual(wieder.daten, gespeichert.konten[konto])
  await wieder.aktion({ typ: 'tauchfund', id: funde[1].id })
  assert.deepEqual(wieder.daten, gespeichert.konten[konto])
  wieder.sende({ typ: 'tauchen' })
  assert.equal((await wieder.empfange(daten => daten.typ === 'tauchstart')).funde.length, 3)
})

test('Speicherfehler verbraucht weder Fund-ID noch Cooldown; volles Inventar erlaubt spaeteren Versuch', kontext => {
  kontext.mock.timers.enable({ apis: ['Date'], now: 10000 })
  const datei = temporaer(kontext)
  const konto = kennung()
  const voll = structuredClone(start)
  voll.inventar.muschel = 1000
  voll.laden = true
  writeFileSync(datei, JSON.stringify({ version: 1, konten: { [konto]: voll } }))
  const { wirtschaft, verbinde, sende, ausgaben } = wirtschaftProbe(kontext, datei)
  const person = verbinde(konto)
  const [startAntwort] = sende(person, { typ: 'tauchen' })
  const fund = startAntwort.funde[0]
  kontext.mock.timers.tick(1500)
  assert.match(sende(person, { typ: 'tauchfund', id: fund.id })[0].text, /voll/)
  assert.deepEqual(wirtschaft.daten(person), voll)
  sende(person, { typ: 'verkaufen', artikel: 'muschel' })
  const vorher = wirtschaft.daten(person)
  rmSync(datei)
  mkdirSync(datei)
  assert.match(sende(person, { typ: 'tauchfund', id: fund.id })[0].text, /Speichern/)
  assert.deepEqual(wirtschaft.daten(person), vorher)
  assert.deepEqual(ausgaben.map(eintrag => eintrag.nachricht.typ), ['handel-status'])
  rmSync(datei, { recursive: true })
  assert.deepEqual(sende(person, { typ: 'tauchfund', id: fund.id }).map(antwort => antwort.typ), ['wirtschaft', 'tauchfund'])
  assert.equal(wirtschaft.daten(person).inventar.muschel, 1000)
  assert.equal(JSON.parse(readFileSync(datei, 'utf8')).konten[konto].inventar.muschel, 1000)
  assert.equal(sende(person, { typ: 'tauchfund', id: fund.id })[0].typ, 'handel-status')
})

test('Version-1-Migration ergaenzt nur fehlende Tauchfelder und behaelt Guthaben, Inventar und Post', kontext => {
  const datei = temporaer(kontext)
  const konto = kennung()
  const alt = { muenzen: 137, inventar: { teddy: 9, blume: 8, kuchen: 7, ball: 6 },
    post: [{ id: randomUUID(), von: 'Mini', artikel: 'ball', art: 'geschenk', zeit: 10000 }], laden: true }
  for (const inventar of [alt.inventar, { ...alt.inventar, muschel: 4 }, { ...alt.inventar, perle: 2, kristall: 1 }]) {
    writeFileSync(datei, JSON.stringify({ version: 1, konten: { [konto]: { ...alt, inventar } } }))
    const { wirtschaft, verbinde, sende } = wirtschaftProbe(kontext, datei)
    const person = verbinde(konto)
    const erwartet = { ...alt, briefe: [], inventar: { ...inventar,
      muschel: inventar.muschel ?? 0, perle: inventar.perle ?? 0, kristall: inventar.kristall ?? 0 } }
    assert.deepEqual(wirtschaft.daten(person), erwartet)
    sende(person, { typ: 'laden', offen: true })
    assert.deepEqual(JSON.parse(readFileSync(datei, 'utf8')), { version: 1, konten: { [konto]: erwartet } })
  }
})

test('Brief: Speicherfehler stellt nichts zu und verbraucht keinen Cooldown', kontext => {
  const datei = temporaer(kontext)
  const { wirtschaft, verbinde, sende, ausgaben } = wirtschaftProbe(kontext, datei)
  const sender = verbinde()
  const ziel = verbinde()
  rmSync(datei)
  mkdirSync(datei)
  assert.match(sende(sender, { typ: 'brief', empfaenger: ziel.id, text: ' Hallo! ' })[0].text, /Speichern/)
  assert.deepEqual(ausgaben.map(eintrag => eintrag.nachricht.typ), ['brief-status'])
  assert.deepEqual(wirtschaft.daten(ziel), start)
  rmSync(datei, { recursive: true })
  assert.deepEqual(sende(sender, { typ: 'brief', empfaenger: ziel.id, text: ' Hallo! ' }),
    [{ typ: 'brief-status', text: 'Brief gesendet.' }])
  assert.deepEqual(ausgaben.map(eintrag => eintrag.nachricht.typ), ['wirtschaft', 'brief-status'])
  const gespeichert = JSON.parse(readFileSync(datei, 'utf8'))
  assert.deepEqual(gespeichert.konten[ziel.konto], wirtschaft.daten(ziel))
  assert.equal(gespeichert.konten[ziel.konto].briefe[0].text, 'Hallo!')
  assert.deepEqual(wirtschaft.daten(sender), start)
})

test('Brief: echter Versand mit Serveridentitaet, Konto-Updates und Reload', async kontext => {
  const datei = temporaer(kontext)
  const zielKonto = kennung()
  const erster = await testServer(kontext, datei)
  const sender = await erster.verbinde()
  const ziel = await erster.verbinde(zielKonto)
  const zweite = await erster.verbinde(zielKonto)
  assert.deepEqual(sender.start.wirtschaft.briefe, [])
  assert.deepEqual(ziel.start.wirtschaft.briefe, [])
  const vorher = Date.now()
  sender.sende({ typ: 'brief', empfaenger: ziel.id, text: '  Hallo von mir!  ' })
  assert.deepEqual(await sender.empfange(daten => daten.typ === 'brief-status'),
    { typ: 'brief-status', text: 'Brief gesendet.' })
  await ziel.empfange(daten => daten.typ === 'wirtschaft')
  await zweite.empfange(daten => daten.typ === 'wirtschaft')
  const [brief] = ziel.daten.briefe
  assert.deepEqual(Object.keys(brief).sort(), ['id', 'text', 'von', 'zeit'])
  assert.match(brief.id, /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/)
  assert.equal(brief.von, figur.name)
  assert.equal(brief.text, 'Hallo von mir!')
  assert.ok(brief.zeit >= vorher && brief.zeit <= Date.now())
  assert.deepEqual(zweite.daten, ziel.daten)
  assert.deepEqual(sender.daten, start)
  const erwartet = structuredClone(ziel.daten)
  assert.deepEqual(JSON.parse(readFileSync(datei, 'utf8')).konten[zielKonto], erwartet)
  await erster.schliessen()
  const neuer = await testServer(kontext, datei)
  assert.deepEqual((await neuer.verbinde(zielKonto)).start.wirtschaft, erwartet)
})

test('Brief: nur verbundene Personen im selben Raum und niemals das eigene Konto', kontext => {
  const { wirtschaft, verbinde, sende, trenne, ausgaben } = wirtschaftProbe(kontext)
  const sender = verbinde()
  const eigene = verbinde(sender.konto)
  const fremde = verbinde()
  fremde.raum = 'ANDERS'
  const getrennte = verbinde()
  trenne(getrennte)
  for (const ziel of [sender, eigene, fremde, getrennte, { id: randomUUID() }]) {
    assert.match(sende(sender, { typ: 'brief', empfaenger: ziel.id, text: 'Hallo!' })[0].text, /anderen/)
    assert.deepEqual(ausgaben.map(eintrag => eintrag.nachricht.typ), ['brief-status'])
  }
  const ziel = verbinde()
  trenne(sender)
  assert.match(sende(sender, { typ: 'brief', empfaenger: ziel.id, text: 'Hallo!' })[0].text, /verbunden/)
  assert.deepEqual(wirtschaft.daten(ziel), start)
})

test('Brief: Cooldown gilt pro Konto, ueber Reconnect und exakt bis 1000 ms', kontext => {
  kontext.mock.timers.enable({ apis: ['Date'], now: 10000 })
  const { wirtschaft, verbinde, sende, trenne } = wirtschaftProbe(kontext)
  const sender = verbinde()
  const zweite = verbinde(sender.konto)
  const ziel = verbinde()
  const anderesZiel = verbinde()
  const brief = { typ: 'brief', empfaenger: ziel.id, text: 'Hallo!' }
  assert.equal(sende(sender, brief)[0].text, 'Brief gesendet.')
  assert.match(sende(zweite, { ...brief, empfaenger: anderesZiel.id })[0].text, /Warte/)
  trenne(sender)
  trenne(zweite)
  const wieder = verbinde(sender.konto)
  kontext.mock.timers.tick(999)
  assert.match(sende(wieder, brief)[0].text, /Warte/)
  kontext.mock.timers.tick(1)
  assert.equal(sende(wieder, brief)[0].text, 'Brief gesendet.')
  assert.equal(wirtschaft.daten(ziel).briefe.length, 2)
  assert.deepEqual(wirtschaft.daten(anderesZiel).briefe, [])
  assert.equal(sende(ziel, { ...brief, empfaenger: wieder.id })[0].text, 'Brief gesendet.')
})

test('Brief: strikt validierte Nachrichten geben false und erzeugen keine Briefe', async kontext => {
  const { wirtschaft, verbinde, ausgaben } = wirtschaftProbe(kontext)
  const sender = verbinde()
  const ziel = verbinde()
  const brief = { typ: 'brief', empfaenger: ziel.id, text: 'Hallo!' }
  const falsch = [
    { typ: 'brief' }, { ...brief, empfaenger: 'falsch' }, { ...brief, empfaenger: null },
    { ...brief, von: 'Erfundener Absender' }, { ...brief, id: randomUUID() }, { ...brief, zeit: 0 },
    ...[null, 12, [], {}, '', '   ', 'a'.repeat(161)].map(text => ({ ...brief, text })),
    ...Array.from({ length: 65 }, (_, nummer) => nummer < 32 ? nummer : nummer + 95)
      .map(code => ({ ...brief, text: `Hallo${String.fromCharCode(code)}` }))
  ]
  for (const nachricht of falsch) assert.equal(wirtschaft.nachricht(sender, nachricht), false)
  assert.equal(wirtschaft.nachricht(sender, { typ: 'unbekannt' }), null)
  assert.deepEqual(ausgaben, [])
  assert.deepEqual(wirtschaft.daten(ziel), start)
  const server = await testServer(kontext)
  for (const nachricht of [{ ...brief, von: 'Fake' }, { ...brief, text: '\nHallo' }]) {
    const client = await server.verbinde()
    const geschlossen = once(client.socket, 'close')
    client.sende(nachricht)
    assert.equal((await geschlossen)[0], 1008)
  }
})

test('Brief: 160 Zeichen, letzte 30 Briefe, Server-Fallback und keine automatisch erzeugten Briefe', kontext => {
  kontext.mock.timers.enable({ apis: ['Date'], now: 10000 })
  const { wirtschaft, verbinde, sende } = wirtschaftProbe(kontext)
  const sender = verbinde()
  sender.figur = { ...figur, name: '' }
  const ziel = verbinde()
  sende(ziel, { typ: 'laden', offen: true })
  sende(ziel, { typ: 'verkaufen', artikel: 'ball' })
  sende(ziel, { typ: 'kaufen', artikel: 'teddy' })
  assert.deepEqual(wirtschaft.daten(ziel).briefe, [])
  for (let nummer = 0; nummer < 35; nummer++) {
    assert.equal(sende(sender, { typ: 'brief', empfaenger: ziel.id,
      text: nummer === 34 ? `  ${'a'.repeat(160)}  ` : `Brief ${nummer}` })[0].text, 'Brief gesendet.')
    kontext.mock.timers.tick(1000)
  }
  const briefe = wirtschaft.daten(ziel).briefe
  assert.equal(briefe.length, 30)
  assert.equal(briefe[0].text, 'Brief 5')
  assert.equal(briefe[29].text, 'a'.repeat(160))
  assert.equal(new Set(briefe.map(brief => brief.id)).size, 30)
  assert.ok(briefe.every(brief => brief.von === 'MiNiMiNi'))
  assert.deepEqual(wirtschaft.daten(sender), start)
})

test('Brief: Migration aller alten Konten und striktes gespeichertes Briefschema', kontext => {
  const datei = temporaer(kontext)
  const konto = kennung()
  const anderesKonto = kennung()
  const { briefe, ...alt } = start
  writeFileSync(datei, JSON.stringify({ version: 1, konten: { [konto]: alt, [anderesKonto]: alt } }))
  const { wirtschaft, verbinde, sende } = wirtschaftProbe(kontext, datei)
  const person = verbinde(konto)
  assert.deepEqual(wirtschaft.daten(person), start)
  sende(person, { typ: 'laden', offen: false })
  assert.deepEqual(JSON.parse(readFileSync(datei, 'utf8')).konten, { [konto]: start, [anderesKonto]: start })
  const brief = { id: randomUUID(), von: 'Mini', text: 'Hallo!', zeit: 10000 }
  const { zeit, ...ohneZeit } = brief
  const falsch = [null, {}, [ohneZeit], Array(31).fill(brief),
    ...[{ id: 'falsch' }, { von: '' }, { von: 'a'.repeat(25) }, { text: ' Hallo ' },
      { text: '' }, { text: 'a'.repeat(161) }, { text: 'Hallo\u0085' }, { zeit: -1 },
      { zeit: 0.5 }, { zeit: '10000' }, { extra: true }].map(aenderung => [{ ...brief, ...aenderung }])]
  for (const briefe of falsch) {
    const inhalt = JSON.stringify({ version: 1, konten: { [konto]: { ...start, briefe } } })
    writeFileSync(datei, inhalt)
    assert.throws(() => erstelleWirtschaft({ datei, spieler: () => [], sende() {} }), /ungueltig/)
    assert.equal(readFileSync(datei, 'utf8'), inhalt)
  }
})

test('Migration repariert keine kaputten Werte oder unerlaubten Felder', kontext => {
  const datei = temporaer(kontext)
  const konto = kennung()
  const alt = { ...start, inventar: { teddy: 2, blume: 3, kuchen: 3, ball: 2 } }
  const kaputt = [
    { ...alt, muenzen: -1 }, { ...alt, extra: true }, { ...alt, inventar: null },
    { ...alt, inventar: [] }, { ...alt, inventar: { ...alt.inventar, teddy: null } },
    { ...alt, inventar: { blume: 3, kuchen: 3, ball: 2 } },
    { ...alt, inventar: { ...alt.inventar, unbekannt: 0 } }, { ...alt, post: [{}] }
  ]
  for (const artikel of ['muschel', 'perle', 'kristall']) {
    for (const wert of [null, '0', -1, 1001, 0.5, false]) {
      kaputt.push({ ...alt, inventar: { ...alt.inventar, [artikel]: wert } })
    }
  }
  for (const daten of kaputt) {
    const inhalt = JSON.stringify({ version: 1, konten: { [konto]: daten } })
    writeFileSync(datei, inhalt)
    assert.throws(() => erstelleWirtschaft({ datei, spieler: () => [], sende() {} }), /ungueltig/)
    assert.equal(readFileSync(datei, 'utf8'), inhalt)
  }
})

test('Alle Taucharten koennen verschenkt und getauscht werden, einschliesslich persistenter Post', kontext => {
  const datei = temporaer(kontext)
  const senderKonto = kennung()
  const zielKonto = kennung()
  const reich = structuredClone(start)
  reich.inventar.muschel = 2
  reich.inventar.perle = 2
  reich.inventar.kristall = 2
  writeFileSync(datei, JSON.stringify({ version: 1, konten: { [senderKonto]: reich, [zielKonto]: start } }))
  const { wirtschaft, verbinde, sende, ausgaben } = wirtschaftProbe(kontext, datei)
  const sender = verbinde(senderKonto)
  const ziel = verbinde(zielKonto)
  for (const artikel of ['muschel', 'perle', 'kristall']) {
    for (const typ of ['geschenk', 'tausch']) {
      sende(sender, { typ, empfaenger: ziel.id, ...(typ === 'geschenk' ? { artikel } : { gib: artikel, nimm: 'blume' }) })
      const angebot = ausgaben.find(eintrag => eintrag.nachricht.typ === 'angebot').nachricht.daten
      sende(ziel, { typ: 'angebot', id: angebot.id, annehmen: true })
    }
    assert.equal(wirtschaft.daten(sender).inventar[artikel], 0)
    assert.equal(wirtschaft.daten(ziel).inventar[artikel], 2)
  }
  assert.equal(wirtschaft.daten(sender).inventar.blume, 6)
  assert.equal(wirtschaft.daten(ziel).inventar.blume, 0)
  assert.deepEqual(wirtschaft.daten(ziel).post.map(eintrag => eintrag.artikel),
    ['muschel', 'muschel', 'perle', 'perle', 'kristall', 'kristall'])
  const neu = wirtschaftProbe(kontext, datei)
  assert.deepEqual(neu.wirtschaft.daten(neu.verbinde(zielKonto)), wirtschaft.daten(ziel))
})