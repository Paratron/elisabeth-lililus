import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const uuidMuster = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/
const farbe = wert => typeof wert === 'string' && /^#[a-f\d]{6}$/i.test(wert)
const felder = (wert, namen) => wert !== null && typeof wert === 'object' && !Array.isArray(wert) &&
  Object.keys(wert).length === namen.length && namen.every(name => Object.hasOwn(wert, name))
const nameGueltig = wert => typeof wert === 'string' && wert.length > 0 && wert.length <= 24 && /^[\p{L}\p{M}\p{N} ._-]+$/u.test(wert)
const name = person => person.figur.name || 'MiNiMiNi'

export function erstelleBesuche({ datei = resolve('.minimini-data/besuche.json'), spieler, sende, verteile, stand }) {
  let konten = new Map()
  const anfragen = new Map()
  const ausgehend = new Map()
  const letzteAnfragen = new Map()

  if (datei !== null) {
    let gespeichert
    try { gespeichert = JSON.parse(readFileSync(datei, 'utf8')) } catch (fehler) {
      if (fehler.code !== 'ENOENT') throw new Error('Besuchsdatei kann nicht geladen werden')
    }
    if (gespeichert !== undefined) {
      if (!felder(gespeichert, ['version', 'konten']) || gespeichert.version !== 1 ||
          gespeichert.konten === null || typeof gespeichert.konten !== 'object' || Array.isArray(gespeichert.konten) ||
          !Object.entries(gespeichert.konten).every(([kennung, konto]) => /^[a-f0-9]{32}$/.test(kennung) &&
            felder(konto, ['hausId', 'freunde']) && typeof konto.hausId === 'string' && uuidMuster.test(konto.hausId) &&
            Array.isArray(konto.freunde) && konto.freunde.every(freund => felder(freund, ['hausId', 'name']) &&
              typeof freund.hausId === 'string' && uuidMuster.test(freund.hausId) && nameGueltig(freund.name)) &&
            new Set(konto.freunde.map(freund => freund.hausId)).size === konto.freunde.length &&
            !konto.freunde.some(freund => freund.hausId === konto.hausId))) {
        throw new Error('Besuchsdatei ist ungueltig')
      }
      konten = new Map(Object.entries(gespeichert.konten))
      const haeuser = new Map([...konten.values()].map(konto => [konto.hausId, konto]))
      if (haeuser.size !== konten.size || [...konten.values()].some(konto => konto.freunde.some(freund =>
        !haeuser.get(freund.hausId)?.freunde.some(andere => andere.hausId === konto.hausId)))) {
        throw new Error('Freundschaften sind ungueltig')
      }
    }
  }

  function speichern(kandidat) {
    if (datei === null) return
    const festeKonten = [...kandidat].filter(([kennung]) => /^[a-f0-9]{32}$/.test(kennung))
    const festeHaeuser = new Set(festeKonten.map(([, konto]) => konto.hausId))
    const inhalt = { version: 1, konten: Object.fromEntries(festeKonten.map(([kennung, konto]) =>
      [kennung, { hausId: konto.hausId, freunde: konto.freunde.filter(freund => festeHaeuser.has(freund.hausId)) }])) }
    mkdirSync(dirname(datei), { recursive: true })
    writeFileSync(`${datei}.tmp`, JSON.stringify(inhalt), { encoding: 'utf8', mode: 0o600 })
    renameSync(`${datei}.tmp`, datei)
  }

  function status(person, text) { sende(person.socket, { typ: 'besuch-status', text }) }
  function daten(person) { return structuredClone(konten.get(person.konto)) }
  function aktualisiere(kennungen) {
    for (const person of spieler()) {
      if (kennungen.has(person.konto)) sende(person.socket, { typ: 'besuche', daten: daten(person) })
    }
  }
  function anmelden(person) {
    if (!konten.has(person.konto)) {
      const kandidat = new Map(konten).set(person.konto, { hausId: randomUUID(), freunde: [] })
      try { speichern(kandidat) } catch { return false }
      konten = kandidat
    }
    person.hausId = konten.get(person.konto).hausId
    person.haus = { id: person.hausId, offen: false, briefkastenFarbe: '#de6573', briefkastenGefunden: false }
    return true
  }

  function verlasseHaus(person) {
    person.haus.offen = false
    for (const gast of spieler()) {
      if (gast.besuchsHostId !== person.id) continue
      delete gast.besuchsHostId
      Object.assign(gast, { ort: 'Stadt', x: 640, y: 520 })
      status(gast, 'Der Hausbesuch ist beendet. Du bist wieder in der Stadt.')
    }
  }
  function beende(anfrage, text) {
    anfragen.delete(anfrage.id)
    ausgehend.delete(anfrage.sender.konto)
    clearTimeout(anfrage.timer)
    status(anfrage.sender, text)
    status(anfrage.empfaenger, text)
  }
  function entferne(person) {
    if (person.haus) verlasseHaus(person)
    for (const anfrage of [...anfragen.values()]) {
      if (anfrage.sender === person || anfrage.empfaenger === person) beende(anfrage, 'Die Freundschaftsanfrage wurde beendet: Verbindung getrennt.')
    }
    if (person.konto?.startsWith('gast:')) {
      konten.delete(person.konto)
      letzteAnfragen.delete(person.konto)
      const geaendert = new Set()
      for (const [kennung, konto] of konten) {
        if (!konto.freunde.some(freund => freund.hausId === person.hausId)) continue
        konten.set(kennung, { ...konto, freunde: konto.freunde.filter(freund => freund.hausId !== person.hausId) })
        geaendert.add(kennung)
      }
      aktualisiere(geaendert)
    }
  }

  function nachricht(person, nachricht) {
    const schema = {
      zuhause: ['typ', 'offen', 'farben', 'briefkastenFarbe', 'briefkastenGefunden'],
      besuchen: ['typ', 'spielerId'], 'freund-anfrage': ['typ', 'spielerId'], 'freund-antwort': ['typ', 'id', 'annehmen']
    }
    if (!Object.hasOwn(schema, nachricht.typ)) return null
    if (!person.raum || !person.haus || !felder(nachricht, schema[nachricht.typ])) return false
    if (nachricht.typ === 'zuhause') {
      if (typeof nachricht.offen !== 'boolean' || typeof nachricht.briefkastenGefunden !== 'boolean' ||
          !farbe(nachricht.briefkastenFarbe) || !felder(nachricht.farben, ['wand', 'dach', 'tuer', 'fenster']) ||
          !Object.values(nachricht.farben).every(farbe)) return false
      if (!nachricht.offen) verlasseHaus(person)
      delete person.besuchsHostId
      Object.assign(person.haus, { offen: nachricht.offen, farben: structuredClone(nachricht.farben),
        briefkastenFarbe: nachricht.briefkastenFarbe, briefkastenGefunden: nachricht.briefkastenGefunden })
      Object.assign(person, { ort: `Haus:${person.hausId}`, x: 640, y: 620 })
      status(person, nachricht.offen ? 'Dein Haus ist offen.' : 'Dein Haus ist geschlossen.')
      stand(person, person)
      verteile(person.raum)
      return true
    }
    const antwort = nachricht.typ === 'freund-antwort'
    const kennung = antwort ? nachricht.id : nachricht.spielerId
    if (typeof kennung !== 'string' || !uuidMuster.test(kennung) || (antwort && typeof nachricht.annehmen !== 'boolean')) return false
    const aktive = [...spieler()]
    if (nachricht.typ === 'besuchen') {
      const host = aktive.find(andere => andere.id === kennung)
      if (!host || host.konto === person.konto || host.raum !== person.raum ||
          host.ort !== `Haus:${host.hausId}` || !host.haus.offen) {
        status(person, 'Dieses Haus ist gerade nicht fuer Besuche offen.'); return true
      }
      verlasseHaus(person)
      person.besuchsHostId = host.id
      Object.assign(person, { ort: host.ort, x: 640, y: 620 })
      status(person, `Du besuchst ${name(host)}.`)
      stand(person, host)
      verteile(person.raum)
      return true
    }
    const jetzt = Date.now()
    for (const anfrage of [...anfragen.values()]) {
      if (anfrage.ablauf <= jetzt) beende(anfrage, 'Die Freundschaftsanfrage ist abgelaufen.')
    }
    if (antwort) {
      const anfrage = anfragen.get(kennung)
      if (!anfrage || anfrage.empfaenger !== person) { status(person, 'Diese Anfrage ist nicht fuer dich oder nicht mehr gueltig.'); return true }
      if (!nachricht.annehmen) { beende(anfrage, 'Die Freundschaftsanfrage wurde abgelehnt.'); return true }
      if (!aktive.includes(anfrage.sender) || !aktive.includes(person) || anfrage.sender.raum !== person.raum) {
        beende(anfrage, 'Die Freundschaftsanfrage ist nicht mehr erreichbar.'); return true
      }
      const kandidat = new Map(konten)
      for (const [eigene, andere] of [[person, anfrage.sender], [anfrage.sender, person]]) {
        const konto = structuredClone(konten.get(eigene.konto))
        konto.freunde = konto.freunde.filter(freund => freund.hausId !== andere.hausId)
        konto.freunde.push({ hausId: andere.hausId, name: name(andere) })
        kandidat.set(eigene.konto, konto)
      }
      try { speichern(kandidat) } catch { status(person, 'Speichern klappt gerade nicht. Es wurde nichts veraendert.'); return true }
      konten = kandidat
      aktualisiere(new Set([person.konto, anfrage.sender.konto]))
      beende(anfrage, 'Ihr seid jetzt Freunde.')
      return true
    }
    const empfaenger = aktive.find(andere => andere.id === kennung)
    if (!empfaenger || empfaenger.raum !== person.raum || empfaenger.konto === person.konto) {
      status(person, 'Waehle jemand anderen in deinem Raum.'); return true
    }
    if (ausgehend.has(person.konto) || jetzt - (letzteAnfragen.get(person.konto) ?? -Infinity) < 1000) {
      status(person, 'Es wartet schon eine Anfrage oder du musst noch kurz warten.'); return true
    }
    if (konten.get(person.konto).freunde.some(freund => freund.hausId === empfaenger.hausId)) {
      status(person, 'Ihr seid bereits Freunde.'); return true
    }
    const anfrage = { id: randomUUID(), sender: person, empfaenger, ablauf: jetzt + 120000 }
    anfrage.timer = setTimeout(() => beende(anfrage, 'Die Freundschaftsanfrage ist abgelaufen.'), 120000)
    anfrage.timer.unref()
    anfragen.set(anfrage.id, anfrage)
    ausgehend.set(person.konto, anfrage.id)
    letzteAnfragen.set(person.konto, jetzt)
    sende(empfaenger.socket, { typ: 'freund-anfrage', id: anfrage.id, spielerId: person.id, name: name(person) })
    status(person, 'Deine Freundschaftsanfrage wartet auf eine Antwort.')
    return true
  }
  function aufraeumen() {
    for (const anfrage of [...anfragen.values()]) beende(anfrage, 'Die Freundschaftsanfrage wurde beendet: Server geschlossen.')
  }
  return { anmelden, daten, nachricht, entferne, verlasseHaus, aufraeumen }
}