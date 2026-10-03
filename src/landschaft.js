import Phaser from 'phaser'
import { createElement, ArrowLeft, ArrowUp, ArrowDown, ArrowRight, Pencil, House, Check, DoorOpen, Paintbrush, X, Smartphone, Wifi, MessageCircle } from 'lucide'
import { stoppeStimme } from './stimme.js'
import { baueStadt, baueLaden, verbindeStadt } from './stadt.js'
import { baueHandyApps } from './handy.js'
import { starteTauchen } from './tauchen.js'
import { bauePost } from './briefe.js'
import { baueHandel } from './handel.js'
import { baueBesuche } from './besuche.js'
import { baueSchatz } from './schatz.js'

export function starteLandschaft(figur, maleFigur, zurueck, aufnahme) {
  let gespeichert = {}
  try {
    const geladen = JSON.parse(localStorage.getItem('minimini-welt'))
    if (geladen && typeof geladen === 'object') gespeichert = geladen
  } catch {}
  function ladeFarben(ziel, quelle) {
    for (const teil of Object.keys(ziel)) {
      if (typeof quelle?.[teil] === 'string' && /^#[0-9a-f]{6}$/i.test(quelle[teil])) ziel[teil] = quelle[teil]
    }
  }
  function ladePosition(position, standard, drinnen = false) {
    return {
      x: Number.isFinite(position?.x) ? Phaser.Math.Clamp(position.x, drinnen ? 140 : 45, drinnen ? 1140 : 1235) : standard.x,
      y: Number.isFinite(position?.y) ? Phaser.Math.Clamp(position.y, drinnen ? 285 : 120, drinnen ? 680 : 730) : standard.y,
    }
  }
  const welt = document.createElement('section')
  welt.className = 'landschaft'
  welt.setAttribute('aria-label', 'Deine 2D-Landschaft')
  welt.innerHTML = '<div id="wiesen-bild"></div><div class="welt-leiste"><div class="welt-name"><strong>MiNiMiNiS 3</strong><span></span></div><button class="welt-knopf" aria-label="Figur bearbeiten" title="Figur bearbeiten"></button></div><div class="steuerkreuz" role="group" aria-label="Bewegung"></div>'
  welt.querySelector('.welt-name span').textContent = figur.name.trim() || 'Mein MiNiMiNi'
  welt.querySelector('.welt-knopf').append(createElement(Pencil, { width: 24, height: 24, 'aria-hidden': 'true' }))
  const sprachmeldung = document.createElement('p')
  sprachmeldung.className = 'sprechblase'
  sprachmeldung.setAttribute('role', 'status')
  sprachmeldung.hidden = true
  welt.append(sprachmeldung)
  const hausknopf = document.createElement('button')
  hausknopf.className = 'haus-versprechen'
  hausknopf.type = 'button'
  hausknopf.hidden = true
  hausknopf.append(createElement(House, { width: 24, height: 24, 'aria-hidden': 'true' }), document.createTextNode('Ich baue dir ein Haus'))
  welt.append(hausknopf)
  const zusage = document.createElement('p')
  zusage.className = 'spieler-zusage'
  zusage.setAttribute('role', 'status')
  zusage.textContent = 'Du: Ich baue dir ein Haus.'
  zusage.hidden = true
  welt.append(zusage)
  const hausfarben = { wand: '#f4db68', dach: '#de6573' }
  ladeFarben(hausfarben, gespeichert.hausfarben)
  const farbwerkstatt = document.createElement('section')
  farbwerkstatt.className = 'haus-farben'
  farbwerkstatt.setAttribute('aria-label', 'Haus färben')
  farbwerkstatt.hidden = true
  farbwerkstatt.innerHTML = '<h2>Dein Haus</h2>'
  for (const [teil, titel, palette] of [
    ['wand', 'Wände', [['Gelb', '#f4db68'], ['Pink', '#eda5bb'], ['Blau', '#8fc8ed'], ['Grün', '#9bceab'], ['Weiß', '#fafaf5']]],
    ['dach', 'Dach', [['Rot', '#de6573'], ['Blau', '#467ab3'], ['Grün', '#478e73'], ['Lila', '#a879c7'], ['Grau', '#60676e']]],
  ]) {
    const gruppe = document.createElement('fieldset')
    const legende = document.createElement('legend')
    legende.textContent = titel
    gruppe.append(legende)
    const reihe = document.createElement('div')
    reihe.className = 'farben'
    for (const [name, farbe] of palette) {
      const knopf = document.createElement('button')
      knopf.className = 'farbknopf'
      knopf.type = 'button'
      knopf.title = `${titel}: ${name}`
      knopf.setAttribute('aria-label', `${titel}: ${name}`)
      knopf.setAttribute('aria-pressed', String(hausfarben[teil] === farbe))
      knopf.style.setProperty('--farbe', farbe)
      knopf.innerHTML = '<span aria-hidden="true">✓</span>'
      knopf.addEventListener('click', () => {
        hausfarben[teil] = farbe
        for (const auswahl of reihe.children) auswahl.setAttribute('aria-pressed', String(auswahl === knopf))
        maleHaus()
        speichereSpielstand()
      })
      reihe.append(knopf)
    }
    gruppe.append(reihe)
    farbwerkstatt.append(gruppe)
  }
  const fertigknopf = document.createElement('button')
  fertigknopf.className = 'haus-fertig'
  fertigknopf.type = 'button'
  fertigknopf.append(createElement(Check, { width: 24, height: 24, 'aria-hidden': 'true' }), document.createTextNode('Fertig'))
  farbwerkstatt.append(fertigknopf)
  fertigknopf.addEventListener('click', () => {
    farbwerkstatt.hidden = true
    sprachmeldung.textContent = 'Danke!'
    sprachmeldung.hidden = false
    hausFertig = true
    speichereSpielstand()
    planeFreundewunsch()
  })
  welt.append(farbwerkstatt)
  const eingang = document.createElement('button')
  eingang.className = 'haus-versprechen'
  eingang.type = 'button'
  eingang.hidden = true
  function beschrifteEingang(text) {
    eingang.replaceChildren(createElement(DoorOpen, { width: 24, height: 24, 'aria-hidden': 'true' }), document.createTextNode(text))
  }
  beschrifteEingang('Rausgehen')
  welt.append(eingang)
  const handyknopf = document.createElement('button')
  handyknopf.className = 'welt-knopf handy-knopf'
  handyknopf.type = 'button'
  handyknopf.title = 'Handy öffnen'
  handyknopf.setAttribute('aria-label', 'Handy öffnen')
  handyknopf.setAttribute('aria-expanded', 'false')
  handyknopf.hidden = true
  handyknopf.append(createElement(Smartphone, { width: 26, height: 26, 'aria-hidden': 'true' }))
  const handy = document.createElement('section')
  handy.className = 'handy'
  handy.setAttribute('aria-label', 'Dein Handy')
  handy.hidden = true
  handy.innerHTML = '<h2>MiNiMiNiS 3</h2><div class="handy-start"><div class="tablet-apps"></div><input type="hidden" id="freundescode"><p class="online-status" role="status"></p></div>'
  const handyZu = document.createElement('button')
  handyZu.className = 'symbol handy-schliessen'
  handyZu.type = 'button'
  handyZu.setAttribute('aria-label', 'Handy schließen')
  handyZu.append(createElement(X, { width: 24, height: 24, 'aria-hidden': 'true' }))
  const stadtfahrt = document.createElement('button')
  stadtfahrt.className = 'tablet-app'
  stadtfahrt.type = 'button'
  stadtfahrt.title = 'In die Stadt fahren'
  stadtfahrt.setAttribute('aria-label', 'Stadt-App')
  stadtfahrt.append(createElement(Wifi, { width: 40, height: 40, 'aria-hidden': 'true' }), document.createTextNode('Stadt'))
  handy.querySelector('.tablet-apps').append(stadtfahrt)
  handy.append(handyZu)
  welt.append(handyknopf, handy)
  const freundescode = handy.querySelector('input')
  freundescode.value = 'MINIMINIS3'
  function zeigeHandy(anzeigen) {
    handy.hidden = !anzeigen
    handyknopf.setAttribute('aria-expanded', String(anzeigen))
    if (anzeigen) handyApps.aktualisiere()
  }
  handyknopf.addEventListener('click', () => {
    stoppen()
    zeigeEinrichtung(false)
    zeigeHandy(handy.hidden)
    if (!onlineUnterwegs()) {
      sprachmeldung.textContent = 'Ich möchte Freunde in MiNiMiNiS 3 haben!'
      sprachmeldung.hidden = false
      freundeWunschGesehen = true
      speichereSpielstand()
    }
  })
  handyZu.addEventListener('click', () => zeigeHandy(false))
  const stadtmeldung = document.createElement('p')
  stadtmeldung.className = 'stadt-status'
  stadtmeldung.setAttribute('role', 'status')
  stadtmeldung.hidden = true
  const heimknopf = document.createElement('button')
  heimknopf.className = 'haus-versprechen'
  heimknopf.type = 'button'
  heimknopf.hidden = true
  heimknopf.append(createElement(House, { width: 24, height: 24, 'aria-hidden': 'true' }), document.createTextNode('Nach Hause'))
  welt.append(stadtmeldung, heimknopf)
  const ladenZurueck = document.createElement('button')
  ladenZurueck.className = 'haus-versprechen laden-zurueck'
  ladenZurueck.type = 'button'
  ladenZurueck.hidden = true
  ladenZurueck.append(createElement(ArrowLeft, { width: 24, height: 24, 'aria-hidden': 'true' }), document.createTextNode('Zum Stadtplatz'))
  welt.append(ladenZurueck)
  const stadtchat = document.createElement('button')
  stadtchat.className = 'welt-knopf stadt-chat-knopf'
  stadtchat.type = 'button'
  stadtchat.hidden = true
  stadtchat.title = 'In der Stadt chatten'
  stadtchat.setAttribute('aria-label', 'In der Stadt chatten')
  stadtchat.append(createElement(MessageCircle, { width: 26, height: 26, 'aria-hidden': 'true' }))
  stadtchat.addEventListener('click', () => {
    stoppen()
    zeigeHandy(true)
    handyApps.oeffneChat()
  })
  welt.append(stadtchat)
  const zimmerfarben = { wand: '#f4db68', boden: '#dce5df' }
  const moebel = { bett: '🛏️', sofa: '🛋️', pflanze: '🪴', spielzeug: '🧸' }
  ladeFarben(zimmerfarben, gespeichert.zimmerfarben)
  for (const [teil, auswahl] of Object.entries({ bett: ['🛏️', '🛌'], sofa: ['🛋️', '🪑'], pflanze: ['🪴', '🌻'], spielzeug: ['🧸', '🎮'] })) {
    if (auswahl.includes(gespeichert.moebel?.[teil])) moebel[teil] = gespeichert.moebel[teil]
  }
  const gestaltungsknopf = document.createElement('button')
  gestaltungsknopf.className = 'welt-knopf zimmer-knopf'
  gestaltungsknopf.type = 'button'
  gestaltungsknopf.hidden = true
  gestaltungsknopf.title = 'Zimmer gestalten'
  gestaltungsknopf.setAttribute('aria-label', 'Zimmer gestalten')
  gestaltungsknopf.setAttribute('aria-expanded', 'false')
  gestaltungsknopf.setAttribute('aria-controls', 'zimmer-auswahl')
  gestaltungsknopf.append(createElement(Paintbrush, { width: 24, height: 24, 'aria-hidden': 'true' }))
  welt.append(gestaltungsknopf)
  const einrichtung = document.createElement('section')
  einrichtung.id = 'zimmer-auswahl'
  einrichtung.className = 'haus-farben zimmer-gestaltung'
  einrichtung.setAttribute('aria-label', 'Zimmer gestalten')
  einrichtung.hidden = true
  einrichtung.innerHTML = '<h2>Dein Zimmer</h2>'
  function zeigeEinrichtung(anzeigen) {
    einrichtung.hidden = !anzeigen
    gestaltungsknopf.setAttribute('aria-expanded', String(anzeigen))
  }
  gestaltungsknopf.addEventListener('click', () => zeigeEinrichtung(einrichtung.hidden))
  const schliessen = document.createElement('button')
  schliessen.className = 'symbol zimmer-schliessen'
  schliessen.type = 'button'
  schliessen.title = 'Einrichtung schließen'
  schliessen.setAttribute('aria-label', 'Einrichtung schließen')
  schliessen.append(createElement(X, { width: 24, height: 24, 'aria-hidden': 'true' }))
  schliessen.addEventListener('click', () => zeigeEinrichtung(false))
  einrichtung.append(schliessen)
  for (const [teil, titel, palette] of [
    ['wand', 'Wand', [['Gelb', '#f4db68'], ['Pink', '#eda5bb'], ['Weiß', '#fafaf5']]],
    ['boden', 'Boden', [['Hell', '#dce5df'], ['Blau', '#8fc8ed'], ['Grün', '#9bceab']]],
  ]) {
    const gruppe = document.createElement('fieldset')
    const legende = document.createElement('legend')
    legende.textContent = titel
    gruppe.append(legende)
    const reihe = document.createElement('div')
    reihe.className = 'farben'
    for (const [name, farbe] of palette) {
      const knopf = document.createElement('button')
      knopf.type = 'button'
      knopf.className = 'farbknopf'
      knopf.setAttribute('aria-label', `Zimmer ${titel}: ${name}`)
      knopf.setAttribute('aria-pressed', String(zimmerfarben[teil] === farbe))
      knopf.style.setProperty('--farbe', farbe)
      knopf.innerHTML = '<span aria-hidden="true">✓</span>'
      knopf.addEventListener('click', () => {
        zimmerfarben[teil] = farbe
        for (const auswahl of reihe.children) auswahl.setAttribute('aria-pressed', String(auswahl === knopf))
        maleZimmer()
        speichereSpielstand()
      })
      reihe.append(knopf)
    }
    gruppe.append(reihe)
    einrichtung.append(gruppe)
  }
  for (const [teil, titel, auswahl] of [
    ['bett', 'Bett', [['🛏️', 'Bett'], ['🛌', 'Kuschelbett']]],
    ['sofa', 'Sitzplatz', [['🛋️', 'Sofa'], ['🪑', 'Stuhl']]],
    ['pflanze', 'Pflanze', [['🪴', 'Topfpflanze'], ['🌻', 'Sonnenblume']]],
    ['spielzeug', 'Spielzeug', [['🧸', 'Teddy'], ['🎮', 'Spielkonsole']]],
  ]) {
    const gruppe = document.createElement('fieldset')
    const legende = document.createElement('legend')
    legende.textContent = titel
    gruppe.append(legende)
    const reihe = document.createElement('div')
    reihe.className = 'emoji-auswahl'
    for (const [emoji, name] of auswahl) {
      const knopf = document.createElement('button')
      knopf.type = 'button'
      knopf.textContent = emoji
      knopf.title = name
      knopf.setAttribute('aria-label', `Möbel: ${name}`)
      knopf.setAttribute('aria-pressed', String(moebel[teil] === emoji))
      knopf.addEventListener('click', () => {
        moebel[teil] = emoji
        for (const nachbar of reihe.children) nachbar.setAttribute('aria-pressed', String(nachbar === knopf))
        maleZimmer()
        speichereSpielstand()
      })
      reihe.append(knopf)
    }
    gruppe.append(reihe)
    einrichtung.append(gruppe)
  }
  welt.append(einrichtung)
  let schautSichUm = true
  document.body.append(welt)
  document.querySelector('#game').hidden = true
  document.body.classList.add('in-der-welt')
  stoppeStimme()
  const gedrueckt = new Set()
  const steuerung = new AbortController()
  const optionen = { signal: steuerung.signal }
  const tasten = { ArrowUp: 'oben', KeyW: 'oben', ArrowDown: 'unten', KeyS: 'unten', ArrowLeft: 'links', KeyA: 'links', ArrowRight: 'rechts', KeyD: 'rechts' }
  for (const [richtung, symbol, name] of [['oben', ArrowUp, 'Vorwärts'], ['links', ArrowLeft, 'Nach links'], ['unten', ArrowDown, 'Rückwärts'], ['rechts', ArrowRight, 'Nach rechts']]) {
    const knopf = document.createElement('button')
    knopf.dataset.richtung = richtung
    knopf.disabled = true
    knopf.setAttribute('aria-label', name)
    knopf.title = name
    knopf.append(createElement(symbol, { width: 28, height: 28, 'aria-hidden': 'true' }))
    knopf.addEventListener('pointerdown', ereignis => {
      if (schautSichUm) return
      ereignis.preventDefault()
      knopf.setPointerCapture(ereignis.pointerId)
      gedrueckt.add(richtung)
      knopf.classList.add('gedrueckt')
    })
    for (const ereignis of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      knopf.addEventListener(ereignis, () => {
        gedrueckt.delete(richtung)
        knopf.classList.remove('gedrueckt')
        speichereSpielstand()
      })
    }
    welt.querySelector('.steuerkreuz').append(knopf)
  }
  window.addEventListener('keydown', ereignis => {
    if (ereignis.target instanceof HTMLElement && ereignis.target.closest('input, textarea, [contenteditable="true"]')) return
    if (tasten[ereignis.code]) {
      ereignis.preventDefault()
      if (!schautSichUm) gedrueckt.add(tasten[ereignis.code])
    }
  }, optionen)
  window.addEventListener('keyup', ereignis => {
    gedrueckt.delete(tasten[ereignis.code])
    speichereSpielstand()
  }, optionen)
  function stoppen() {
    gedrueckt.clear()
    welt.querySelectorAll('.gedrueckt').forEach(knopf => knopf.classList.remove('gedrueckt'))
    speichereSpielstand()
  }
  window.addEventListener('blur', stoppen, optionen)
  document.addEventListener('visibilitychange', stoppen, optionen)
  window.addEventListener('pagehide', stoppen, optionen)
  let spieler
  let hausZeichnung
  let innenraum
  let moebelBild
  let stadt
  let inStadt = false
  let besuchHaus = ''
  let besuchsBild
  let besuchsEigenschaften = ''
  let wirtschaftLaden = false
  function eigenerOrt() { return besuchHaus || ladenName || 'Stadt' }
  function onlineUnterwegs() { return inStadt || Boolean(besuchHaus) }
  let ladenName = ''
  let ladenBild
  let platzPosition
  let stadtVerbindung
  let reiseLaeuft = false
  let weltGeschlossen = false
  let rueckfahrt
  let stadtUmgebung = []
  const freunde = new Map()
  let onlineSpieler = []
  let onlineId
  const chatblasen = new Map()
  function zeigeChatblase(nachricht) {
    if (!onlineUnterwegs()) return
    const gast = onlineSpieler.find(person => person.id === nachricht.spielerId)
    const ort = gast?.ort || 'Stadt'
    if (ort !== eigenerOrt()) return
    chatblasen.get(nachricht.spielerId)?.element.remove()
    const element = document.createElement('p')
    element.className = 'stadt-sprechblase'
    element.setAttribute('role', 'status')
    element.textContent = nachricht.text
    welt.append(element)
    chatblasen.set(nachricht.spielerId, { element, ort, ende: Date.now() + 7000 })
  }
  let freundeWunschGesehen = gespeichert.freundeWunschGesehen === true
  let hausGebaut = gespeichert.hausGebaut === true || gespeichert.hausFertig === true
  let hausFertig = hausGebaut && gespeichert.hausFertig === true
  let brilleGefunden = gespeichert.brilleGefunden === true
  let briefkastenGefunden = gespeichert.briefkastenGefunden === true
  let hausBriefkasten
  let hausStand = []
  const tauchstation = document.createElement('button')
  tauchstation.className = 'tauchstation-knopf'
  tauchstation.textContent = '🤿 Tauchstation'
  tauchstation.hidden = true
  welt.append(tauchstation)
  tauchstation.addEventListener('click', () => {
    if (!brilleGefunden || !hausFertig || imHaus || onlineUnterwegs() || reiseLaeuft) return
    stoppen()
    sprachmeldung.hidden = true
    spieler.scene.scene.pause()
    starteTauchen(() => {
      stoppen()
      spieler.scene.scene.resume()
    }, figur, maleFigur, {
      briefkastenGefunden,
      mitnehmen: () => {
        briefkastenGefunden = true
        speichereSpielstand()
      },
    })
  })
  let imHaus = false
  let wiesenPosition
  let sichtbareWelt = []
  let schritte = 0
  let zuletztGespeichert = 0
  const gesicht = { traurig: !hausGebaut, blickX: 0, blickY: 0 }
  let wohnAktion
  let wohnEffekt
  const aufstehen = document.createElement('button')
  aufstehen.className = 'tauchstation-knopf'
  aufstehen.textContent = 'Aufstehen'
  aufstehen.hidden = true
  welt.append(aufstehen)
  function beendeWohnAktion() {
    if (!wohnAktion) return
    gesicht.schlaeft = false
    maleFigur(spieler.first, figur, gesicht)
    wohnAktion.teddy?.setVisible(true)
    spieler.scene.tweens.killTweensOf(spieler.first)
    spieler.first.setAngle(0).setScale(1).setY(0)
    wohnEffekt?.destroy()
    wohnEffekt = undefined
    spieler.setPosition(wohnAktion.x, wohnAktion.y).setDepth(wohnAktion.y + 55)
    wohnAktion = undefined
    aufstehen.hidden = true
    sprachmeldung.hidden = true
  }
  aufstehen.addEventListener('click', beendeWohnAktion)
  function benutzeMoebel(teil) {
    if (!imHaus || onlineUnterwegs() || !handy.hidden || briefpost.istOffen() || handel.istOffen() || besuche.istOffen()) return
    stoppen()
    beendeWohnAktion()
    wohnAktion = { x: spieler.x, y: spieler.y }
    aufstehen.hidden = false
    aufstehen.textContent = teil === 'bett' ? 'Aufwachen' : teil === 'spielzeug' ? 'Kuscheln beenden' : 'Aufstehen'
    const schrift = { fontFamily: '"Segoe UI Emoji", sans-serif', fontSize: '36px' }
    if (teil === 'bett') {
      gesicht.schlaeft = true
      maleFigur(spieler.first, figur, gesicht)
      spieler.setPosition(285, 405).setDepth(600)
      spieler.first.setAngle(-80)
      wohnEffekt = spieler.scene.add.text(335, 320, 'Zzz', { ...schrift, color: '#304f43' })
      spieler.scene.tweens.add({ targets: wohnEffekt, y: 292, alpha: 0.25, duration: 1500, yoyo: true, repeat: -1 })
      sprachmeldung.textContent = 'Ich schlafe …'
    } else if (teil === 'sofa') {
      spieler.setPosition(1000, 391).setDepth(600)
      spieler.first.setScale(1, 0.8)
      sprachmeldung.textContent = 'Gemütlich!'
      spieler.scene.time.delayedCall(1500, () => {
        if (sprachmeldung.textContent === 'Gemütlich!') sprachmeldung.hidden = true
      })
    } else {
      wohnAktion.teddy = moebelBild.list.find(objekt => objekt.getData('moebelTeil') === 'spielzeug')
      wohnAktion.teddy?.setVisible(false)
      spieler.setPosition(800, 580).setDepth(635)
      wohnEffekt = spieler.scene.add.text(800, 574, '🧸', { ...schrift, fontSize: '42px' }).setOrigin(0.5).setDepth(636)
      spieler.scene.tweens.add({ targets: spieler.first, angle: 5, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
      sprachmeldung.textContent = 'Ich kuschle mit meinem Teddy.'
    }
    sprachmeldung.hidden = false
  }
  const briefpost = bauePost(welt, {
    istVerbunden: () => Boolean(stadtVerbindung?.istVerbunden()),
    freunde: () => onlineSpieler.filter(gast => gast.id !== onlineId),
    senden: (empfaenger, text) => stadtVerbindung?.sendeBrief(empfaenger, text) || false,
    verbinden: fahreStadt,
    beimOeffnen: () => { stoppen(); zeigeHandy(false) },
  })
  handy.querySelector('.tablet-apps').append(briefpost.app)
  const handel = baueHandel(welt, {
    istVerbunden: () => Boolean(stadtVerbindung?.istVerbunden()),
    freunde: () => onlineSpieler.filter(gast => gast.id !== onlineId),
    senden: nachricht => stadtVerbindung?.sendeHandel(nachricht) || false,
    verbinden: fahreStadt,
    beimOeffnen: () => { stoppen(); zeigeHandy(false) },
  })
  handy.querySelector('.tablet-apps').append(handel.app)
  const besuche = baueBesuche(welt, {
    istVerbunden: () => Boolean(stadtVerbindung?.istVerbunden()),
    spieler: () => onlineSpieler,
    eigeneId: () => onlineId,
    eigenerOrt,
    hausFertig: () => hausFertig,
    senden: nachricht => stadtVerbindung?.sendeHandel(nachricht) || false,
    verbinden: fahreStadt,
    zuhause: geheOnlineZuhause,
    zurStadt: () => stadtVerbindung?.wechsleOrt('Stadt', 640, 620),
    beimOeffnen: () => { stoppen(); zeigeHandy(false) },
  })
  handy.querySelector('.tablet-apps').append(besuche.app)
  const schatz = baueSchatz(welt, () => {
    stoppen()
    beendeWohnAktion()
    zeigeHandy(false)
  })
  function geheOnlineZuhause(offen = false) {
    if (!hausFertig) return
    stadtVerbindung?.sendeHandel({ typ: 'zuhause', offen,
      farben: { ...hausfarben, tuer: '#47725f', fenster: '#86d7e6' },
      briefkastenFarbe: '#de6573', briefkastenGefunden })
  }
  async function oeffneHausStand() {
    if (besuchHaus && onlineSpieler.find(person => person.id === onlineId)?.haus?.id !== besuchHaus.slice(5)) {
      besuche.oeffne()
      return
    }
    if (!stadtVerbindung?.istVerbunden()) await fahreStadt()
    if (!stadtVerbindung?.istVerbunden()) return
    if (!besuchHaus) geheOnlineZuhause(false)
    handel.oeffne()
  }
  const handyApps = baueHandyApps(handy, {
    istVerbunden: () => Boolean(stadtVerbindung?.istVerbunden?.()),
    senden: text => {
      const gesendet = stadtVerbindung?.sendeChat?.(text) || false
      if (gesendet && onlineUnterwegs()) zeigeHandy(false)
      return gesendet
    },
    verbinden: async () => { await fahreStadt(); zeigeHandy(true) },
  })
  function planeFreundewunsch() {
    if (freundeWunschGesehen) return
    spieler.scene.time.delayedCall(2000, () => {
      if (onlineUnterwegs() || freundeWunschGesehen) return
      sprachmeldung.textContent = 'Ich möchte Freunde in MiNiMiNiS 3 haben!'
      sprachmeldung.hidden = false
      freundeWunschGesehen = true
      speichereSpielstand()
    })
  }
  function speichereSpielstand() {
    if (!spieler) return
    try {
      localStorage.setItem('minimini-welt', JSON.stringify({
        version: 1, hausGebaut, hausFertig, hausfarben, zimmerfarben, moebel, imHaus,
        position: onlineUnterwegs() ? rueckfahrt : { x: spieler.x, y: spieler.y }, wiesenPosition,
        freundescode: /^[A-Z0-9]{4,12}$/.test(freundescode.value.trim().toUpperCase()) ? freundescode.value.trim().toUpperCase() : gespeichert.freundescode,
        freundeWunschGesehen, brilleGefunden, briefkastenGefunden,
      }))
    } catch {
      sprachmeldung.textContent = 'Dein Browser kann gerade nicht speichern. Bitte lösche keine Browserdaten.'
      sprachmeldung.hidden = false
    }
  }
  function wechsleZimmer() {
    if (onlineUnterwegs()) return
    beendeWohnAktion()
    stoppen()
    sprachmeldung.hidden = true
    if (!imHaus) {
      wiesenPosition = { x: spieler.x, y: spieler.y }
      sichtbareWelt = spieler.scene.children.list.filter(objekt => objekt !== spieler && objekt !== innenraum && objekt !== moebelBild && objekt.visible)
      sichtbareWelt.forEach(objekt => objekt.setVisible(false))
      maleZimmer()
      innenraum.setVisible(true)
      moebelBild.setVisible(true)
      spieler.setPosition(640, 620)
    } else {
      innenraum.setVisible(false)
      moebelBild.setVisible(false)
      sichtbareWelt.forEach(objekt => objekt.setVisible(true))
      spieler.setPosition(wiesenPosition.x, wiesenPosition.y)
    }
    imHaus = !imHaus
    zeigeEinrichtung(false)
    gestaltungsknopf.hidden = !imHaus
    spieler.setDepth(spieler.y + 55)
    spieler.first.y = 0
    eingang.hidden = !imHaus
    spieler.scene.game.canvas.setAttribute('aria-label', imHaus ? 'Zimmer in deinem Haus mit deinem MiNiMiNi' : '2D-Wiese mit deinem MiNiMiNi')
    speichereSpielstand()
  }
  eingang.addEventListener('click', wechsleZimmer)
  function onlineStatus(text) {
    handy.querySelector('.online-status').textContent = text
    stadtmeldung.textContent = text
  }
  function maleStand(szene, gruppe, offen = wirtschaftLaden) {
    const bild = szene.add.graphics({ x: 735, y: 520 }).setDepth(520)
    bild.fillStyle(0x47725f)
    bild.fillRect(-65, -75, 10, 75)
    bild.fillRect(55, -75, 10, 75)
    bild.fillStyle(0xffffff)
    bild.fillRect(-80, -95, 160, 28)
    bild.fillStyle(0xde6573)
    for (let streifen = -80; streifen < 80; streifen += 40) bild.fillRect(streifen, -95, 20, 28)
    bild.fillStyle(0xf4db68)
    bild.fillRoundedRect(-75, -25, 150, 45, 6)
    const schild = szene.add.text(735, 516, `STAND\n${offen ? 'offen' : 'geschlossen'}`, {
      fontFamily: '"Baloo 2", sans-serif', fontSize: '18px', color: '#304f43', align: 'center',
    }).setOrigin(0.5).setDepth(521)
    const zone = szene.add.zone(735, 480, 170, 125).setInteractive({ useHandCursor: true })
    zone.on('pointerup', () => { if (hausFertig && handy.hidden && !reiseLaeuft) oeffneHausStand() })
    if (gruppe) gruppe.add([bild, schild, zone])
    return [bild, schild, zone]
  }
  function maleBesuchsHaus(host) {
    const szene = spieler.scene
    const gruppe = szene.add.container(0, 0).setDepth(-1)
    const bild = szene.add.graphics()
    gruppe.add(bild)
    const farben = host.haus.farben || { wand: '#f4db68', dach: '#de6573', tuer: '#47725f', fenster: '#86d7e6' }
    const farbe = wert => Phaser.Display.Color.HexStringToColor(wert).color
    bild.fillStyle(0xa5d779)
    bild.fillRect(0, 0, 1280, 800)
    bild.lineStyle(55, 0xf2e7bd)
    bild.lineBetween(0, 545, 1280, 545)
    bild.fillStyle(0x58bfd5)
    bild.fillEllipse(930, 345, 310, 180)
    bild.fillStyle(farbe(farben.wand))
    bild.fillRoundedRect(310, 325, 220, 150, 6)
    bild.fillStyle(farbe(farben.dach))
    bild.fillTriangle(285, 330, 420, 230, 555, 330)
    bild.fillStyle(farbe(farben.tuer))
    bild.fillRoundedRect(395, 397, 50, 78, 6)
    bild.fillStyle(farbe(farben.fenster))
    bild.fillRect(325, 362, 40, 40)
    bild.fillRect(475, 362, 40, 40)
    if (host.haus.briefkastenGefunden) {
      bild.fillStyle(0x47725f)
      bild.fillRect(594, 432, 10, 48)
      bild.fillStyle(farbe(host.haus.briefkastenFarbe))
      bild.fillRoundedRect(573, 405, 52, 34, 6)
      bild.lineStyle(3, 0xffffff)
      bild.lineBetween(584, 419, 613, 419)
      const postZone = szene.add.zone(600, 442, 70, 85).setInteractive({ useHandCursor: true })
      postZone.on('pointerup', () => briefpost.oeffne())
      gruppe.add(postZone)
    }
    gruppe.add(szene.add.text(420, 205, host.figur.name || 'MiNiMiNi', {
      fontFamily: '"Baloo 2", sans-serif', fontSize: '28px', color: '#304f43',
    }).setOrigin(0.5))
    maleStand(szene, gruppe, host.haus.laden)
    return gruppe
  }
  function synchronisiereOnlineOrt(liste, id) {
    if (!onlineUnterwegs()) return
    const selbst = liste.find(person => person.id === id)
    if (!selbst) return
    const ort = selbst.ort || 'Stadt'
    const host = ort.startsWith('Haus:') ? liste.find(person => person.haus?.id === ort.slice(5) && person.ort === ort) : null
    if (ort.startsWith('Haus:') && !host) return
    const eigenschaften = host ? JSON.stringify({ haus: host.haus, name: host.figur.name }) : ''
    if (ort === eigenerOrt()) {
      if (host && eigenschaften !== besuchsEigenschaften) {
        besuchsBild?.destroy(true)
        besuchsBild = maleBesuchsHaus(host)
        besuchsEigenschaften = eigenschaften
      }
      return
    }
    stoppen()
    ladenBild?.destroy()
    ladenBild = undefined
    ladenName = ''
    besuchsBild?.destroy(true)
    besuchsBild = undefined
    besuchHaus = host ? ort : ''
    besuchsEigenschaften = eigenschaften
    inStadt = !host
    stadt.setVisible(!host)
    if (host) besuchsBild = maleBesuchsHaus(host)
    else if (ort !== 'Stadt') { ladenName = ort; stadt.setVisible(false); ladenBild = baueLaden(spieler.scene, ort) }
    spieler.setPosition(selbst.x, selbst.y).setDepth(selbst.y + 55)
    ladenZurueck.hidden = !host && !ladenName
    ladenZurueck.lastChild.textContent = host ? 'Zur Stadt' : 'Zum Stadtplatz'
    spieler.scene.game.canvas.setAttribute('aria-label', host ? `Haus von ${host.figur.name || 'MiNiMiNi'}` : 'Online-Stadt in MiNiMiNiS 3')
  }
  function zeigeFreunde(liste, eigeneId) {
    if (!onlineUnterwegs()) return
    const vorhanden = new Set()
    for (const gast of liste) {
      if (gast.id === eigeneId) continue
      vorhanden.add(gast.id)
      let freund = freunde.get(gast.id)
      if (!freund) {
        const bild = spieler.scene.add.graphics()
        maleFigur(bild, gast.figur, { traurig: false })
        bild.setScale(1.55)
        const name = spieler.scene.add.text(0, -105, gast.figur.name || 'MiNiMiNi', {
          fontFamily: '"Baloo 2", sans-serif', fontSize: '18px', color: '#304f43', backgroundColor: '#ffffff', padding: { x: 6, y: 3 },
        }).setOrigin(0.5, 1)
        freund = spieler.scene.add.container(gast.x, gast.y, [bild, name])
        freunde.set(gast.id, freund)
      }
      freund.setPosition(gast.x, gast.y).setDepth(gast.y + 55)
      freund.setVisible((gast.ort || 'Stadt') === eigenerOrt())
    }
    for (const [id, freund] of freunde) {
      if (!vorhanden.has(id)) {
        freund.destroy()
        freunde.delete(id)
      }
    }
    const anzahl = liste.filter(gast => gast.id === eigeneId || (gast.ort || 'Stadt') === eigenerOrt()).length
    onlineStatus(`${besuchHaus ? 'Hausbesuch' : ladenName || 'Stadt'} · ${anzahl} ${anzahl === 1 ? 'MiNiMiNi' : 'MiNiMiNis'}`)
  }
  async function fahreStadt() {
    if (besuchHaus) { stadtVerbindung?.wechsleOrt('Stadt', 640, 620); return }
    if (inStadt) { zeigeHandy(false); return }
    if (reiseLaeuft) return
    const raum = freundescode.value.trim().toUpperCase()
    if (!/^[A-Z0-9]{4,12}$/.test(raum)) {
      onlineStatus('Der Freundescode braucht 4 bis 12 Buchstaben oder Zahlen.')
      return
    }
    freundescode.value = raum
    stoppen()
    reiseLaeuft = true
    stadtfahrt.disabled = true
    freundescode.disabled = true
    onlineStatus('Verbinde mit der Stadt …')
    let gaeste = []
    let eigeneId
    const verbindung = verbindeStadt(figur, raum, (liste, id) => {
      gaeste = liste
      eigeneId = id
      onlineSpieler = liste
      onlineId = id
      briefpost.aktualisiere()
      handel.aktualisiere()
      synchronisiereOnlineOrt(liste, id)
      besuche.aktualisiere()
      zeigeFreunde(liste, id)
    }, text => {
      for (const freund of freunde.values()) freund.destroy()
      freunde.clear()
      onlineStatus(text)
      handyApps.aktualisiere()
      briefpost.aktualisiere()
      handel.aktualisiere()
      besuche.aktualisiere()
    }, nachricht => {
      if (handyApps.empfange(nachricht) !== false) zeigeChatblase(nachricht)
    }, nachricht => {
      if (nachricht.typ === 'wirtschaft') wirtschaftLaden = nachricht.daten.laden === true
      briefpost.empfange(nachricht)
      handel.empfange(nachricht)
      besuche.empfange(nachricht)
      schatz.empfange(nachricht)
    })
    stadtVerbindung = verbindung
    try {
      await verbindung.fertig
      if (weltGeschlossen) return
      beendeWohnAktion()
      rueckfahrt = { x: spieler.x, y: spieler.y }
      stadtUmgebung = spieler.scene.children.list.filter(objekt => objekt !== spieler && objekt !== stadt && objekt.visible)
      stadtUmgebung.forEach(objekt => objekt.setVisible(false))
      stadt.setVisible(true)
      inStadt = true
      spieler.setPosition(640, 620).setDepth(675)
      spieler.first.y = 0
      sprachmeldung.hidden = true
      gestaltungsknopf.hidden = true
      eingang.hidden = true
      heimknopf.hidden = false
      stadtmeldung.hidden = false
      zeigeEinrichtung(false)
      zeigeHandy(false)
      spieler.scene.game.canvas.setAttribute('aria-label', 'Online-Stadt in MiNiMiNiS 3')
      zeigeFreunde(gaeste, eigeneId)
      synchronisiereOnlineOrt(gaeste, eigeneId)
      besuche.aktualisiere()
      verbindung.bewege(spieler.x, spieler.y)
      speichereSpielstand()
    } catch (fehler) {
      verbindung.beenden()
      if (!weltGeschlossen) onlineStatus(fehler.message)
    } finally {
      reiseLaeuft = false
      stadtfahrt.disabled = false
      freundescode.disabled = inStadt
    }
  }
  stadtfahrt.addEventListener('click', fahreStadt)
  function oeffneLaden(name) {
    if (!inStadt || ladenName || !handy.hidden) return
    stoppen()
    platzPosition = { x: spieler.x, y: spieler.y }
    ladenName = name
    stadt.setVisible(false)
    ladenBild = baueLaden(spieler.scene, name)
    spieler.setPosition(640, 620).setDepth(675)
    spieler.first.y = 0
    stadtVerbindung?.wechsleOrt(name, spieler.x, spieler.y)
    zeigeFreunde(onlineSpieler, onlineId)
    ladenZurueck.hidden = false
    spieler.scene.game.canvas.setAttribute('aria-label', `${name} von innen`)
  }
  function verlasseLaden() {
    if (besuchHaus) { stadtVerbindung?.wechsleOrt('Stadt', 640, 620); return }
    if (!ladenName) return
    stoppen()
    ladenBild.destroy()
    ladenBild = undefined
    ladenName = ''
    stadt.setVisible(true)
    spieler.setPosition(platzPosition.x, platzPosition.y).setDepth(platzPosition.y + 55)
    stadtVerbindung?.wechsleOrt('Stadt', spieler.x, spieler.y)
    zeigeFreunde(onlineSpieler, onlineId)
    ladenZurueck.hidden = true
    spieler.scene.game.canvas.setAttribute('aria-label', 'Online-Stadt in MiNiMiNiS 3')
  }
  ladenZurueck.addEventListener('click', verlasseLaden)
  heimknopf.addEventListener('click', () => {
    verlasseLaden()
    stoppen()
    stadtVerbindung?.beenden()
    stadtVerbindung = undefined
    for (const freund of freunde.values()) freund.destroy()
    freunde.clear()
    stadt.setVisible(false)
    stadtUmgebung.forEach(objekt => objekt.setVisible(true))
    besuchsBild?.destroy(true)
    besuchsBild = undefined
    besuchHaus = ''
    besuchsEigenschaften = ''
    inStadt = false
    spieler.setPosition(rueckfahrt.x, rueckfahrt.y).setDepth(rueckfahrt.y + 55)
    eingang.hidden = !imHaus
    gestaltungsknopf.hidden = !imHaus
    heimknopf.hidden = true
    ladenZurueck.hidden = true
    stadtmeldung.hidden = true
    freundescode.disabled = false
    zeigeHandy(false)
    onlineStatus('')
    onlineSpieler = []
    onlineId = undefined
    besuche.aktualisiere()
    spieler.scene.game.canvas.setAttribute('aria-label', imHaus ? 'Zimmer in deinem Haus mit deinem MiNiMiNi' : '2D-Wiese mit deinem MiNiMiNi')
    speichereSpielstand()
  })
  function maleZimmer() {
    innenraum.clear()
    innenraum.fillStyle(0xfafaf5)
    innenraum.fillRect(0, 0, 1280, 800)
    innenraum.fillStyle(Phaser.Display.Color.HexStringToColor(zimmerfarben.wand).color)
    innenraum.fillRect(100, 80, 1080, 230)
    innenraum.fillStyle(Phaser.Display.Color.HexStringToColor(zimmerfarben.boden).color)
    innenraum.fillRect(100, 310, 1080, 440)
    innenraum.lineStyle(3, 0xb8c9be)
    for (let hoehe = 350; hoehe < 750; hoehe += 50) innenraum.lineBetween(100, hoehe, 1180, hoehe)
    innenraum.fillStyle(0xffffff)
    innenraum.fillRoundedRect(530, 120, 220, 145, 6)
    innenraum.fillStyle(0x86d7e6)
    innenraum.fillRect(540, 130, 200, 125)
    innenraum.lineStyle(8, 0xffffff)
    innenraum.lineBetween(640, 130, 640, 255)
    innenraum.lineBetween(540, 192, 740, 192)
    moebelBild.removeAll(true)
    for (const [teil, breite, hoehe, groesse] of [['bett', 285, 485, 150], ['sofa', 1000, 440, 140], ['pflanze', 380, 340, 96], ['spielzeug', 800, 580, 80]]) {
      const emoji = innenraum.scene.add.text(breite, hoehe, moebel[teil], {
        fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif', fontSize: `${groesse}px`,
      }).setOrigin(0.5, 1)
      if (teil === 'bett' || teil === 'sofa' || (teil === 'spielzeug' && moebel.spielzeug === '🧸')) {
        emoji.setInteractive({ useHandCursor: true }).on('pointerup', () => benutzeMoebel(teil))
      }
      emoji.setData('moebelTeil', teil)
      moebelBild.add(emoji)
    }
  }
  function maleHaus() {
    hausZeichnung.clear()
    hausZeichnung.fillStyle(0x548047, 0.2)
    hausZeichnung.fillEllipse(0, 8, 270, 35)
    hausZeichnung.fillStyle(Phaser.Display.Color.HexStringToColor(hausfarben.wand).color)
    hausZeichnung.fillRoundedRect(-110, -145, 220, 150, 6)
    hausZeichnung.lineStyle(3, 0x557966)
    hausZeichnung.strokeRoundedRect(-110, -145, 220, 150, 6)
    hausZeichnung.fillStyle(Phaser.Display.Color.HexStringToColor(hausfarben.dach).color)
    hausZeichnung.fillTriangle(-135, -140, 0, -240, 135, -140)
    hausZeichnung.lineStyle(3, 0x557966)
    hausZeichnung.strokeTriangle(-135, -140, 0, -240, 135, -140)
    hausZeichnung.fillStyle(0x47725f)
    hausZeichnung.fillRoundedRect(-25, -78, 50, 83, 6)
    hausZeichnung.fillStyle(0xf4db68)
    hausZeichnung.fillCircle(12, -36, 3)
    for (const mitte of [-70, 70]) {
      hausZeichnung.fillStyle(0xffffff)
      hausZeichnung.fillRoundedRect(mitte - 24, -108, 48, 48, 5)
      hausZeichnung.fillStyle(0x86d7e6)
      hausZeichnung.fillRect(mitte - 19, -103, 38, 38)
      hausZeichnung.lineStyle(4, 0xffffff)
      hausZeichnung.lineBetween(mitte, -103, mitte, -65)
      hausZeichnung.lineBetween(mitte - 19, -84, mitte + 19, -84)
    }
    hausZeichnung.fillStyle(0xffffff)
    hausZeichnung.fillCircle(0, -171, 16)
    hausZeichnung.fillStyle(0x86d7e6)
    hausZeichnung.fillCircle(0, -171, 11)
  }
  hausknopf.addEventListener('click', () => {
    if (schautSichUm || !gesicht.traurig) return
    stoppen()
    gesicht.traurig = false
    maleFigur(spieler.first, figur, gesicht)
    sprachmeldung.hidden = true
    hausknopf.hidden = true
    zusage.hidden = false
    hausZeichnung.scene.time.delayedCall(1500, () => {
      zusage.hidden = true
      maleHaus()
      hausZeichnung.setVisible(true)
      farbwerkstatt.hidden = false
      hausGebaut = true
      speichereSpielstand()
    })
  })
  const hindernisse = []
  const wiesenSpiel = new Phaser.Game({
    type: Phaser.CANVAS,
    parent: 'wiesen-bild',
    width: 1280,
    height: 800,
    backgroundColor: '#a5d779',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: {
      create() {
        this.game.canvas.setAttribute('role', 'img')
        this.game.canvas.setAttribute('aria-label', '2D-Wiese mit deinem MiNiMiNi')
        const boden = this.add.graphics()
        boden.fillStyle(0x96c96c)
        for (let nummer = 0; nummer < 90; nummer++) {
          boden.fillEllipse((nummer * 137 + 29) % 1280, (nummer * 83 + 51) % 800, 45, 15)
        }
        boden.lineStyle(70, 0xf2e7bd)
        boden.beginPath()
        boden.moveTo(0, 510)
        boden.lineTo(460, 510)
        boden.lineTo(760, 720)
        boden.lineTo(1280, 720)
        boden.strokePath()
        boden.fillStyle(0xf0e5b8)
        boden.fillEllipse(930, 345, 340, 210)
        boden.fillStyle(0x58bfd5)
        boden.fillEllipse(930, 345, 310, 180)
        this.add.zone(930, 345, 310, 180).setInteractive({ useHandCursor: true }).on('pointerup', () => {
          if (!hausFertig || imHaus || onlineUnterwegs() || reiseLaeuft) return
          stoppen()
          brilleGefunden = true
          sprachmeldung.textContent = 'Du hast eine Taucherbrille gefunden! Geh auf Tauchstation.'
          sprachmeldung.hidden = false
          speichereSpielstand()
        })
        boden.lineStyle(4, 0xa5e2e9)
        for (const [breite, hoehe] of [[865, 320], [965, 360], [1010, 310]]) {
          boden.lineBetween(breite, hoehe, breite + 30, hoehe)
        }
        for (let nummer = 0; nummer < 75; nummer++) {
          const breite = (nummer * 193 + 45) % 1240 + 20
          const hoehe = (nummer * 97 + 65) % 740 + 30
          if (((breite - 930) / 190) ** 2 + ((hoehe - 345) / 125) ** 2 < 1 || Math.abs(hoehe - 510) < 40) continue
          boden.lineStyle(2, 0x57924f)
          boden.lineBetween(breite, hoehe, breite, hoehe - 10)
          boden.fillStyle([0xfffaf0, 0xf8cc54, 0xed83ac][nummer % 3])
          for (const [abstandX, abstandY] of [[-4, 0], [4, 0], [0, -4], [0, 4]]) boden.fillCircle(breite + abstandX, hoehe - 12 + abstandY, 4)
          boden.fillStyle(0xe7b644)
          boden.fillCircle(breite, hoehe - 12, 2.5)
        }
        for (const [breite, hoehe, pink] of [[180,240,false],[360,190,false],[580,230,false],[1120,200,true],[1170,520,false],[970,660,true],[430,700,false],[100,660,false]]) {
          const baum = this.add.graphics({ x: breite, y: hoehe })
          baum.setDepth(hoehe)
          baum.fillStyle(0x7db561, 0.45)
          baum.fillEllipse(0, 5, 110, 30)
          baum.fillStyle(0x957052)
          baum.fillRoundedRect(-12, -70, 24, 75, 5)
          baum.fillStyle(pink ? 0xeaa2be : 0x4b9b60)
          baum.fillCircle(-32, -85, 40)
          baum.fillCircle(32, -85, 40)
          baum.fillCircle(0, -115, 47)
          baum.fillStyle(pink ? 0xf5bed0 : 0x73b66c)
          baum.fillEllipse(-14, -130, 40, 20)
          hindernisse.push({ breite, hoehe })
        }
        hausZeichnung = this.add.graphics({ x: 420, y: 470 })
        hausZeichnung.setDepth(470)
        hausZeichnung.setVisible(false)
        hausZeichnung.setInteractive(new Phaser.Geom.Rectangle(-135, -240, 270, 245), Phaser.Geom.Rectangle.Contains)
        hausZeichnung.on('pointerup', () => {
          if (hausFertig && !imHaus) wechsleZimmer()
        })
        hausBriefkasten = this.add.text(600, 475, '📬', {
          fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif', fontSize: '64px',
        }).setOrigin(0.5, 1).setDepth(475).setVisible(briefkastenGefunden).setInteractive({ useHandCursor: true })
        hausBriefkasten.on('pointerup', () => {
          if (imHaus || onlineUnterwegs() || !briefkastenGefunden) return
          briefpost.oeffne()
        })
        innenraum = this.add.graphics().setDepth(-1).setVisible(false)
        hausStand = maleStand(this)
        moebelBild = this.add.container(0, 0).setDepth(300).setVisible(false)
        maleZimmer()
        stadt = baueStadt(this, oeffneLaden)
        const zeichnung = this.add.graphics()
        maleFigur(zeichnung, figur, gesicht)
        spieler = this.add.container(640, 450, [zeichnung])
        spieler.setScale(1.55)
        spieler.setDepth(505)
        if (hausGebaut) {
          schautSichUm = false
          maleHaus()
          hausZeichnung.setVisible(true)
          farbwerkstatt.hidden = hausFertig
          const draussen = ladePosition(gespeichert.imHaus ? gespeichert.wiesenPosition : gespeichert.position, { x: 640, y: 450 })
          spieler.setPosition(draussen.x, draussen.y)
          if (hausFertig && gespeichert.imHaus === true) {
            const drinnen = ladePosition(gespeichert.position, { x: 640, y: 620 }, true)
            wechsleZimmer()
            spieler.setPosition(drinnen.x, drinnen.y)
          }
          spieler.setDepth(spieler.y + 55)
          welt.querySelectorAll('[data-richtung]').forEach(knopf => { knopf.disabled = false })
          speichereSpielstand()
          if (hausFertig) planeFreundewunsch()
          return
        }
        speichereSpielstand()
        this.time.delayedCall(4000, () => {
          stoppen()
          schautSichUm = false
          sprachmeldung.hidden = false
          sprachmeldung.textContent = 'Ich brauche ein Haus.'
          hausknopf.hidden = false
          welt.querySelectorAll('[data-richtung]').forEach(knopf => { knopf.disabled = false })
        })
      },
      update(zeit, delta) {
        hausBriefkasten.setVisible(briefkastenGefunden && !imHaus && !onlineUnterwegs())
        hausStand.forEach(teil => teil.setVisible(hausFertig && !imHaus && !onlineUnterwegs()))
        hausStand[1]?.setText(`STAND\n${wirtschaftLaden ? 'offen' : 'geschlossen'}`)
        tauchstation.hidden = !hausFertig || !brilleGefunden || imHaus || onlineUnterwegs() || !handy.hidden
        handyknopf.hidden = !hausFertig
        stadtchat.hidden = !onlineUnterwegs()
        const bild = this.game.canvas.getBoundingClientRect()
        const massstab = bild.width / 1280
        for (const [id, blase] of chatblasen) {
          if (Date.now() >= blase.ende || !onlineUnterwegs()) {
            blase.element.remove()
            chatblasen.delete(id)
            continue
          }
          const figur = id === onlineId ? spieler : freunde.get(id)
          blase.element.hidden = !figur?.visible || blase.ort !== eigenerOrt()
          if (blase.element.hidden) continue
          const mitte = bild.left + figur.x * massstab
          blase.element.style.left = `${Phaser.Math.Clamp(mitte, Math.min(130, welt.clientWidth / 2), Math.max(130, welt.clientWidth - 130))}px`
          blase.element.style.top = `${Math.max(bild.top + 64, bild.top + (figur.y - 125) * massstab)}px`
        }
        const kopfHoehe = bild.top + (spieler.y - 80) * massstab
        sprachmeldung.style.left = `${Phaser.Math.Clamp(bild.left + spieler.x * massstab, 140, welt.clientWidth - 140)}px`
        sprachmeldung.style.top = `${kopfHoehe < 150 ? bild.top + (spieler.y + 65) * massstab : kopfHoehe - 12}px`
        sprachmeldung.style.transform = kopfHoehe < 150 ? 'translate(-50%, 0)' : 'translate(-50%, -100%)'
        const gesperrt = schautSichUm || reiseLaeuft || !handy.hidden || briefpost.istOffen() || handel.istOffen() || besuche.istOffen()
        const waagerecht = gesperrt ? 0 : Number(gedrueckt.has('rechts')) - Number(gedrueckt.has('links'))
        const senkrecht = gesperrt ? 0 : Number(gedrueckt.has('unten')) - Number(gedrueckt.has('oben'))
        const richtung = new Phaser.Math.Vector2(waagerecht, senkrecht)
        if (schatz.istOffen()) return
        if (wohnAktion) {
          if (richtung.lengthSq() === 0) return
          beendeWohnAktion()
        }
        const blickX = waagerecht !== 0 || senkrecht !== 0
          ? waagerecht * 1.8
          : Math.round(Math.sin(zeit * 0.0012) * 6) * 0.3
        const blickY = senkrecht * 1.1
        if (gesicht.blickX !== blickX || gesicht.blickY !== blickY) {
          gesicht.blickX = blickX
          gesicht.blickY = blickY
          maleFigur(spieler.first, figur, gesicht)
        }
        if (richtung.lengthSq() === 0) {
          spieler.first.y = 0
          return
        }
        richtung.normalize().scale(Math.min(delta, 50) * 0.24)
        const lokalDrinnen = imHaus && !onlineUnterwegs()
        const lokalDraussen = !imHaus && !onlineUnterwegs()
        const breite = Phaser.Math.Clamp(spieler.x + richtung.x, lokalDrinnen ? 140 : 45, lokalDrinnen ? 1140 : 1235)
        const hoehe = Phaser.Math.Clamp(spieler.y + richtung.y, besuchHaus ? 120 : inStadt ? 300 : lokalDrinnen ? 285 : 120, lokalDrinnen ? 680 : 730)
        const fussHoehe = hoehe + 55
        const imTeich = (lokalDraussen || besuchHaus) && ((breite - 930) / 180) ** 2 + ((fussHoehe - 345) / 120) ** 2 < 1
        const amBaum = lokalDraussen && hindernisse.some(baum => Math.hypot(breite - baum.breite, fussHoehe - baum.hoehe) < 30)
        const amHaus = (besuchHaus || (lokalDraussen && hausZeichnung.visible)) && breite > 292 && breite < 548 && fussHoehe > 305 && fussHoehe < 485
        const anMoebeln = lokalDrinnen && ((moebel.bett && breite > 145 && breite < 425 && fussHoehe < 600) || (moebel.sofa && breite > 885 && breite < 1125 && fussHoehe < 495))
        const amBrunnen = inStadt && !ladenName && ((breite - 640) / 120) ** 2 + ((fussHoehe - 465) / 85) ** 2 < 1
        if (!imTeich && !amBaum && !amHaus && !anMoebeln && !amBrunnen) {
          spieler.setPosition(breite, hoehe)
          spieler.setDepth(fussHoehe)
          schritte += delta * 0.012
          spieler.first.y = Math.sin(schritte) * 2
          if (onlineUnterwegs()) stadtVerbindung?.bewege(breite, hoehe)
          if (zeit - zuletztGespeichert > 1000) {
            zuletztGespeichert = zeit
            speichereSpielstand()
          }
        }
      },
    },
  })
  welt.querySelector('.welt-knopf').addEventListener('click', () => {
    speichereSpielstand()
    weltGeschlossen = true
    schatz.beenden()
    stadtVerbindung?.beenden()
    aufnahme?.pausiere()
    stoppeStimme()
    steuerung.abort()
    wiesenSpiel.destroy(true)
    welt.remove()
    document.querySelector('#game').hidden = false
    document.body.classList.remove('in-der-welt')
    zurueck()
  })
}