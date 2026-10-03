import { randomInt, randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const tauchartikel = ['muschel', 'perle', 'kristall']
const artikel = ['teddy', 'blume', 'kuchen', 'ball', ...tauchartikel]
const kontoMuster = /^[a-f0-9]{32}$/
const uuidMuster = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/
const startkonto = () => ({ muenzen: 20, inventar: { teddy: 2, blume: 3, kuchen: 3, ball: 2, muschel: 0, perle: 0, kristall: 0 }, post: [], briefe: [], laden: false })
const kopie = wert => structuredClone(wert)
const felder = (wert, namen) => wert !== null && typeof wert === 'object' && !Array.isArray(wert) &&
  Object.keys(wert).length === namen.length && namen.every(name => Object.hasOwn(wert, name))

const brieftext = text => typeof text === 'string' && !/[\u0000-\u001f\u007f-\u009f]/.test(text) &&
  text.trim().length > 0 && text.trim().length <= 160

function gueltigesKonto(konto) {
  return felder(konto, ['muenzen', 'inventar', 'post', 'briefe', 'laden']) &&
    Number.isInteger(konto.muenzen) && konto.muenzen >= 0 && konto.muenzen <= 1000000 &&
    Array.isArray(konto.briefe) && konto.briefe.length <= 30 && konto.briefe.every(eintrag =>
      felder(eintrag, ['id', 'von', 'text', 'zeit']) && typeof eintrag.id === 'string' && uuidMuster.test(eintrag.id) &&
      typeof eintrag.von === 'string' && eintrag.von.length > 0 && eintrag.von.length <= 24 &&
      brieftext(eintrag.text) && eintrag.text === eintrag.text.trim() &&
      Number.isSafeInteger(eintrag.zeit) && eintrag.zeit >= 0) &&
    typeof konto.laden === 'boolean' && felder(konto.inventar, artikel) &&
    artikel.every(name => Number.isInteger(konto.inventar[name]) && konto.inventar[name] >= 0 && konto.inventar[name] <= 1000) &&
    Array.isArray(konto.post) && konto.post.length <= 30 && konto.post.every(eintrag =>
      felder(eintrag, ['id', 'von', 'artikel', 'art', 'zeit']) && typeof eintrag.id === 'string' && uuidMuster.test(eintrag.id) &&
      typeof eintrag.von === 'string' && eintrag.von.length <= 24 && artikel.includes(eintrag.artikel) &&
      ['geschenk', 'tausch'].includes(eintrag.art) && Number.isSafeInteger(eintrag.zeit) && eintrag.zeit >= 0)
}

export function erstelleWirtschaft({ datei = resolve('.minimini-data/wirtschaft.json'), spieler, sende }) {
  let konten = new Map()
  const dauerhaft = new Set()
  const angebote = new Map()
  const ausgehend = new Map()
  const eingehend = new Map()
  const letzteVerkaeufe = new Map()
  const letzteBriefe = new Map()
  const tauchgaenge = new Map()

  if (datei !== null) {
    let gespeichert
    try { gespeichert = JSON.parse(readFileSync(datei, 'utf8')) } catch (fehler) {
      if (fehler.code !== 'ENOENT') throw new Error('Wirtschaftsdatei kann nicht geladen werden')
    }
    if (gespeichert !== undefined) {
      if (gespeichert?.konten !== null && typeof gespeichert?.konten === 'object' && !Array.isArray(gespeichert.konten)) {
        for (const konto of Object.values(gespeichert.konten)) {
          if (konto !== null && typeof konto === 'object' && !Array.isArray(konto) && !Object.hasOwn(konto, 'briefe')) {
            konto.briefe = []
          }
          if (konto?.inventar !== null && typeof konto?.inventar === 'object' && !Array.isArray(konto.inventar)) {
            for (const name of tauchartikel) {
              if (!Object.hasOwn(konto.inventar, name)) konto.inventar[name] = 0
            }
          }
        }
      }
      if (!felder(gespeichert, ['version', 'konten']) || gespeichert.version !== 1 ||
          gespeichert.konten === null || typeof gespeichert.konten !== 'object' || Array.isArray(gespeichert.konten) ||
          !Object.entries(gespeichert.konten).every(([kennung, konto]) => kontoMuster.test(kennung) && gueltigesKonto(konto))) {
        throw new Error('Wirtschaftsdatei ist ungueltig')
      }
      konten = new Map(Object.entries(gespeichert.konten))
      for (const kennung of konten.keys()) dauerhaft.add(kennung)
    }
  }

  function speichern(kandidat, festeKonten = dauerhaft) {
    if (datei === null) return
    const inhalt = JSON.stringify({ version: 1, konten: Object.fromEntries(
      [...kandidat].filter(([kennung]) => festeKonten.has(kennung))
    ) })
    mkdirSync(dirname(datei), { recursive: true })
    writeFileSync(`${datei}.tmp`, inhalt, { encoding: 'utf8', mode: 0o600 })
    renameSync(`${datei}.tmp`, datei)
  }

  function status(person, text, typ = 'handel-status') { sende(person.socket, { typ, text }) }
  function daten(person) { return kopie(konten.get(person.konto)) }
  function aktualisiere(kennungen) {
    for (const person of spieler()) {
      if (kennungen.has(person.konto)) sende(person.socket, { typ: 'wirtschaft', daten: daten(person) })
    }
  }
  function uebernehme(aenderungen, person, statustyp = 'handel-status') {
    const kandidat = new Map(konten)
    for (const [kennung, konto] of aenderungen) {
      if (!gueltigesKonto(konto)) { status(person, 'Das Konto ist voll.', statustyp); return false }
      kandidat.set(kennung, konto)
    }
    try { speichern(kandidat) } catch {
      status(person, 'Speichern klappt gerade nicht. Es wurde nichts veraendert.', statustyp)
      return false
    }
    konten = kandidat
    aktualisiere(new Set(aenderungen.keys()))
    return true
  }

  function anmelden(person, kennung) {
    const konto = kennung ?? `gast:${person.id}`
    if (!konten.has(konto)) {
      const kandidat = new Map(konten).set(konto, startkonto())
      const festeKonten = new Set(dauerhaft)
      if (kennung !== undefined) festeKonten.add(konto)
      try { speichern(kandidat, festeKonten) } catch {
        status(person, 'Dein Konto konnte nicht gespeichert werden. Bitte verbinde dich neu.')
        return false
      }
      konten = kandidat
      if (kennung !== undefined) dauerhaft.add(konto)
    }
    person.konto = konto
    return true
  }

  function beende(angebot, text) {
    if (!angebote.delete(angebot.id)) return
    clearTimeout(angebot.timer)
    ausgehend.delete(angebot.sender.konto)
    eingehend.delete(angebot.empfaenger.konto)
    sende(angebot.empfaenger.socket, { typ: 'angebot-ende', id: angebot.id })
    status(angebot.sender, text)
    status(angebot.empfaenger, text)
  }

  function entferne(person) {
    const tauchgang = tauchgaenge.get(person.konto)
    if (tauchgang?.person === person) beendeTauchen(person.konto)
    for (const angebot of [...angebote.values()]) {
      if (angebot.sender === person || angebot.empfaenger === person) beende(angebot, 'Das Angebot wurde beendet: Verbindung getrennt.')
    }
    if (person.konto?.startsWith('gast:')) {
      konten.delete(person.konto)
      letzteVerkaeufe.delete(person.konto)
      letzteBriefe.delete(person.konto)
    }
  }

  function post(konto, von, name, art, zeit) {
    konto.post.push({ id: randomUUID(), von: von.figur.name || 'MiNiMiNi', artikel: name, art, zeit })
    konto.post = konto.post.slice(-30)
  }

  function beendeTauchen(kennung) {
    const tauchgang = tauchgaenge.get(kennung)
    if (!tauchgang) return
    clearTimeout(tauchgang.timer)
    tauchgaenge.delete(kennung)
  }

  function tauchen(person, nachricht, jetzt) {
    if (![...spieler()].includes(person)) { status(person, 'Du bist nicht mehr verbunden.'); return true }
    let tauchgang = tauchgaenge.get(person.konto)
    if (tauchgang && jetzt >= tauchgang.start + 60000) {
      beendeTauchen(person.konto)
      tauchgang = undefined
    }
    if (nachricht.typ === 'tauchen') {
      if (tauchgang) { status(person, 'Dein Tauchgang laeuft noch.'); return true }
      const zufall = randomInt(100)
      const funde = ['muschel', randomInt(100) < 30 ? 'perle' : 'muschel',
        zufall < 10 ? 'kristall' : zufall < 30 ? 'perle' : 'muschel']
        .map(name => ({ id: randomUUID(), artikel: name }))
      tauchgang = { person, start: jetzt, letzterFund: -Infinity, funde }
      tauchgang.timer = setTimeout(() => beendeTauchen(person.konto), 60000)
      tauchgang.timer.unref()
      tauchgaenge.set(person.konto, tauchgang)
      sende(person.socket, { typ: 'tauchstart', funde: kopie(funde) })
      return true
    }
    if (!tauchgang || tauchgang.person !== person) {
      status(person, 'Dieser Tauchgang gehoert nicht zu deiner Verbindung.'); return true
    }
    const fund = tauchgang.funde.find(eintrag => eintrag.id === nachricht.id)
    if (!fund) { status(person, 'Dieser Fund ist nicht mehr verfuegbar.'); return true }
    if (jetzt - tauchgang.start < 1500 || jetzt - tauchgang.letzterFund < 500) {
      status(person, 'Du musst noch kurz weitertauchen.'); return true
    }
    const konto = daten(person)
    konto.inventar[fund.artikel]++
    if (uebernehme(new Map([[person.konto, konto]]), person)) {
      tauchgang.funde = tauchgang.funde.filter(eintrag => eintrag.id !== fund.id)
      tauchgang.letzterFund = jetzt
      if (tauchgang.funde.length === 0) beendeTauchen(person.konto)
      sende(person.socket, { typ: 'tauchfund', id: fund.id, artikel: fund.artikel })
    }
    return true
  }

  function nachricht(person, nachricht) {
    const typ = nachricht.typ
    if (!['laden', 'kaufen', 'verkaufen', 'standkauf', 'geschenk', 'tausch', 'angebot', 'tauchen', 'tauchfund', 'brief'].includes(typ)) return null
    const schema = {
      laden: ['typ', 'offen'], kaufen: ['typ', 'artikel'], verkaufen: ['typ', 'artikel'],
      geschenk: ['typ', 'empfaenger', 'artikel'], tausch: ['typ', 'empfaenger', 'gib', 'nimm'],
      angebot: ['typ', 'id', 'annehmen'], tauchen: ['typ'], tauchfund: ['typ', 'id'],
      brief: ['typ', 'empfaenger', 'text'], standkauf: ['typ', 'verkaeufer', 'artikel']
    }
    if (!person.raum || !person.konto || !felder(nachricht, schema[typ])) return false
    if (typ === 'laden' && typeof nachricht.offen !== 'boolean') return false
    if (['kaufen', 'verkaufen', 'geschenk'].includes(typ) && typeof nachricht.artikel !== 'string') return false
    if (typ === 'tausch' && (typeof nachricht.gib !== 'string' || typeof nachricht.nimm !== 'string')) return false
    if (['geschenk', 'tausch', 'brief'].includes(typ) && (typeof nachricht.empfaenger !== 'string' || !uuidMuster.test(nachricht.empfaenger))) return false
    if (typ === 'brief' && !brieftext(nachricht.text)) return false
    if (typ === 'angebot' && (typeof nachricht.id !== 'string' || !uuidMuster.test(nachricht.id) || typeof nachricht.annehmen !== 'boolean')) return false
    if (typ === 'tauchfund' && (typeof nachricht.id !== 'string' || !uuidMuster.test(nachricht.id))) return false
    if (typ === 'standkauf' && (typeof nachricht.verkaeufer !== 'string' || !uuidMuster.test(nachricht.verkaeufer) ||
        typeof nachricht.artikel !== 'string')) return false

    const jetzt = Date.now()
    if (typ === 'standkauf') {
      const aktive = [...spieler()]
      const verkaeufer = aktive.find(andere => andere.id === nachricht.verkaeufer)
      const name = nachricht.artikel
      if (!artikel.includes(name)) { status(person, 'Diese Sache gibt es nicht.'); return true }
      if (!aktive.includes(person) || !konten.has(person.konto) || !verkaeufer ||
          !konten.has(verkaeufer.konto) || verkaeufer.konto === person.konto || verkaeufer.raum !== person.raum ||
          typeof verkaeufer.hausId !== 'string' || !uuidMuster.test(verkaeufer.hausId) ||
          verkaeufer.ort !== `Haus:${verkaeufer.hausId}` || person.ort !== verkaeufer.ort) {
        status(person, 'Besuche den Stand eines anderen Spielers in deinem Raum.'); return true
      }
      const kaeuferKonto = daten(person)
      const verkaeuferKonto = daten(verkaeufer)
      if (!verkaeuferKonto.laden || verkaeuferKonto.inventar[name] < 1 || kaeuferKonto.muenzen < 8) {
        status(person, 'Der Stand ist geschlossen, die Sache fehlt oder du brauchst 8 Spielmuenzen.'); return true
      }
      kaeuferKonto.muenzen -= 8
      kaeuferKonto.inventar[name]++
      verkaeuferKonto.muenzen += 8
      verkaeuferKonto.inventar[name]--
      if (uebernehme(new Map([[person.konto, kaeuferKonto], [verkaeufer.konto, verkaeuferKonto]]), person)) {
        status(person, 'Am Stand gekauft fuer 8 Spielmuenzen.')
        status(verkaeufer, 'Am Stand verkauft fuer 8 Spielmuenzen.')
      }
      return true
    }
    if (typ === 'brief') {
      const aktive = [...spieler()]
      const empfaenger = aktive.find(andere => andere.id === nachricht.empfaenger)
      if (!aktive.includes(person) || !konten.has(person.konto)) {
        status(person, 'Du bist nicht mehr verbunden.', 'brief-status'); return true
      }
      if (!empfaenger || !konten.has(empfaenger.konto) || empfaenger.raum !== person.raum || empfaenger.konto === person.konto) {
        status(person, 'Waehle jemand anderen in deinem Raum.', 'brief-status'); return true
      }
      if (jetzt - (letzteBriefe.get(person.konto) ?? -Infinity) < 1000) {
        status(person, 'Warte kurz, bevor du den naechsten Brief sendest.', 'brief-status'); return true
      }
      const konto = daten(empfaenger)
      konto.briefe.push({ id: randomUUID(), von: person.figur.name || 'MiNiMiNi', text: nachricht.text.trim(), zeit: jetzt })
      konto.briefe = konto.briefe.slice(-30)
      if (uebernehme(new Map([[empfaenger.konto, konto]]), person, 'brief-status')) {
        letzteBriefe.set(person.konto, jetzt)
        status(person, 'Brief gesendet.', 'brief-status')
      }
      return true
    }
    if (['tauchen', 'tauchfund'].includes(typ)) return tauchen(person, nachricht, jetzt)
    for (const angebot of [...angebote.values()]) {
      if (angebot.ablauf <= jetzt) beende(angebot, 'Das Angebot ist abgelaufen.')
    }
    if (typ === 'angebot') {
      const angebot = angebote.get(nachricht.id)
      if (!angebot) return true
      if (angebot.empfaenger !== person) { status(person, 'Dieses Angebot ist nicht fuer dich.'); return true }
      if (!nachricht.annehmen) { beende(angebot, 'Das Angebot wurde abgelehnt.'); return true }
      const aktive = [...spieler()]
      if (!aktive.includes(angebot.sender) || !aktive.includes(person) || angebot.sender.raum !== person.raum) {
        beende(angebot, 'Das Angebot ist nicht mehr erreichbar.')
        return true
      }
      const senderKonto = daten(angebot.sender)
      const empfaengerKonto = daten(person)
      if (senderKonto.inventar[angebot.gib] < 1 || (angebot.art === 'tausch' && empfaengerKonto.inventar[angebot.nimm] < 1)) {
        beende(angebot, 'Es fehlen inzwischen Sachen fuer dieses Angebot.')
        return true
      }
      senderKonto.inventar[angebot.gib]--
      empfaengerKonto.inventar[angebot.gib]++
      post(empfaengerKonto, angebot.sender, angebot.gib, angebot.art, jetzt)
      if (angebot.art === 'tausch') {
        empfaengerKonto.inventar[angebot.nimm]--
        senderKonto.inventar[angebot.nimm]++
        post(senderKonto, person, angebot.nimm, angebot.art, jetzt)
      }
      if (uebernehme(new Map([[angebot.sender.konto, senderKonto], [person.konto, empfaengerKonto]]), person)) {
        beende(angebot, angebot.art === 'tausch' ? 'Tausch abgeschlossen.' : 'Geschenk angekommen.')
      } else {
        beende(angebot, 'Das Angebot konnte nicht abgeschlossen werden. Es wurde nichts uebergeben.')
      }
      return true
    }

    if (['geschenk', 'tausch'].includes(typ)) {
      const empfaenger = [...spieler()].find(andere => andere.id === nachricht.empfaenger)
      const gib = typ === 'geschenk' ? nachricht.artikel : nachricht.gib
      const nimm = typ === 'tausch' ? nachricht.nimm : undefined
      if (!artikel.includes(gib) || (typ === 'tausch' && !artikel.includes(nimm))) {
        status(person, 'Diese Sache gibt es nicht.'); return true
      }
      if (!empfaenger || empfaenger.raum !== person.raum || empfaenger.konto === person.konto) {
        status(person, 'Waehle jemand anderen in deinem Raum.'); return true
      }
      if (ausgehend.has(person.konto) || eingehend.has(empfaenger.konto)) {
        status(person, 'Es wartet schon ein Angebot.'); return true
      }
      if (konten.get(person.konto).inventar[gib] < 1 || (typ === 'tausch' && konten.get(empfaenger.konto).inventar[nimm] < 1)) {
        status(person, 'Es fehlen Sachen fuer dieses Angebot.'); return true
      }
      const angebot = { id: randomUUID(), art: typ, sender: person, empfaenger, gib, nimm, ablauf: jetzt + 120000 }
      angebot.timer = setTimeout(() => beende(angebot, 'Das Angebot ist abgelaufen.'), 120000)
      angebot.timer.unref()
      angebote.set(angebot.id, angebot)
      ausgehend.set(person.konto, angebot.id)
      eingehend.set(empfaenger.konto, angebot.id)
      sende(empfaenger.socket, { typ: 'angebot', daten: {
        id: angebot.id, art: typ, von: person.id, name: person.figur.name || 'MiNiMiNi',
        ...(typ === 'geschenk' ? { artikel: gib } : { gib, nimm })
      } })
      status(person, 'Dein Angebot wartet auf eine Antwort.')
      return true
    }

    const konto = daten(person)
    if (typ === 'laden') konto.laden = nachricht.offen
    else {
      const name = nachricht.artikel
      if (!artikel.includes(name)) { status(person, 'Diese Sache gibt es nicht.'); return true }
      if (typ === 'kaufen') {
        if (tauchartikel.includes(name)) { status(person, 'Diese Sache findest du nur unter Wasser.'); return true }
        if (konto.muenzen < 5 || konto.inventar[name] >= 1000) {
          status(person, 'Zu wenig Spielmuenzen oder kein Platz.'); return true
        }
        konto.muenzen -= 5
        konto.inventar[name]++
      } else {
        if (!konto.laden || konto.inventar[name] < 1 || konto.muenzen > 1000000 - 8) {
          status(person, 'Oeffne deinen Laden. Du brauchst eine Sache und Platz fuer Spielmuenzen.'); return true
        }
        if (jetzt - (letzteVerkaeufe.get(person.konto) ?? -Infinity) < 1000) {
          status(person, 'Der naechste Spielkunde kommt gleich.'); return true
        }
        konto.inventar[name]--
        konto.muenzen += 8
      }
    }
    if (uebernehme(new Map([[person.konto, konto]]), person)) {
      if (typ === 'verkaufen') letzteVerkaeufe.set(person.konto, jetzt)
      status(person, typ === 'verkaufen' ? 'Ein erfundener Spielkunde hat gekauft: 8 Spielmuenzen.' :
        typ === 'kaufen' ? 'Gekauft fuer 5 Spielmuenzen.' : konto.laden ? 'Dein Laden ist offen.' : 'Dein Laden ist geschlossen.')
    }
    return true
  }

  function aufraeumen() {
    for (const kennung of tauchgaenge.keys()) beendeTauchen(kennung)
    for (const angebot of [...angebote.values()]) beende(angebot, 'Das Angebot wurde beendet: Server geschlossen.')
  }
  return { anmelden, daten, nachricht, entferne, aufraeumen }
}