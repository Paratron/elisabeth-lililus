import Phaser from 'phaser'
import './style.css'
import { starteLandschaft } from './landschaft.js'
import { baueAufnahme } from './aufnahme.js'
import { createElement, Volume2 } from 'lucide'

const standardFigur = {
  name: '', haut: '#ffdbac', haare: '#6b3a2a', frisur: 'Kurz',
  oberteil: '#ed637b', hose: '#386cba', schuhe: '#f5c84c', kleidung: 'T-Shirt',
  geschlecht: 'Keine Auswahl', alter: 8,
}
let figur = { ...standardFigur }
try {
  const gespeichert = JSON.parse(localStorage.getItem('minimini-figur'))
  if (gespeichert && typeof gespeichert === 'object') {
    for (const schluessel of Object.keys(standardFigur)) {
      if (typeof gespeichert[schluessel] === 'string') figur[schluessel] = gespeichert[schluessel]
    }
    figur.alter = Number.isInteger(gespeichert.alter) && gespeichert.alter >= 1 && gespeichert.alter <= 100
      ? gespeichert.alter : 8
  }
} catch {}

const farben = {
  haut: [['Hell', '#ffdbac'], ['Pfirsich', '#e8b88a'], ['Goldbraun', '#c68642'], ['Braun', '#8d5524'], ['Dunkelbraun', '#543326']],
  haare: [['Blond', '#f5d060'], ['Braun', '#6b3a2a'], ['Schwarz', '#252529'], ['Rot', '#cc4422'], ['Pink', '#ee72a5'], ['Weiss', '#ececea']],
  oberteil: [['Pink', '#ed637b'], ['Blau', '#428bdb'], ['Gruen', '#4aa887'], ['Gelb', '#f5c84c'], ['Lila', '#a879c7'], ['Weiss', '#fafaf5']],
  hose: [['Jeans', '#386cba'], ['Gruen', '#427c66'], ['Schwarz', '#30343c'], ['Pink', '#d7789b'], ['Grau', '#9aa3ad']],
  schuhe: [['Gelb', '#f5c84c'], ['Rot', '#dc5b61'], ['Weiss', '#fafaf5'], ['Schwarz', '#30343c'], ['Blau', '#428bdb']],
}

document.querySelector('#game').innerHTML = `
  <header><a class="marke" href="./">MiNiMiNiS <span>3</span></a><span class="kapitel">DEINE FIGUR</span></header>
  <main>
    <section class="vorschau" aria-label="Deine Figur">
      <div class="titel"><span class="kleiner-titel">HALLO, DAS BIST DU!</span><h1>Dein MiNiMiNi</h1></div>
      <div id="figur-bild"></div>
      <div class="namensschild" id="figurname">Mein MiNiMiNi</div>
      <div class="bodenpunkte"><span></span><span></span><span></span></div>
    </section>
    <section class="werkstatt" aria-label="Figur gestalten">
      <div class="werkstatt-kopf"><h2>So sehe ich aus</h2><div class="editor-werkzeuge"><button id="stimme-anhoeren" class="symbol" title="Stimme anhören" aria-label="Stimme anhören"></button><button id="zufall" class="symbol" title="Zufallsfigur" aria-label="Zufallsfigur">⚄</button></div></div>
      <div class="personalien">
        <div><label class="name-label" for="name">Mein Name</label><input id="name" maxlength="24" placeholder="Dein MiNiMiNi-Name" autocomplete="off"></div>
        <div><label class="name-label" for="alter">Alter</label><input id="alter" type="number" min="1" max="100" step="1" required inputmode="numeric"></div>
      </div>
      <div id="auswahl"></div>
      <footer><button id="speichern">Figur speichern <span aria-hidden="true">✓</span></button><p id="meldung" role="status" aria-live="polite"></p></footer>
    </section>
  </main>`

const aufnahme = baueAufnahme(document.querySelector('.editor-werkzeuge'), document.querySelector('#meldung'))
const stimmknopf = document.querySelector('#stimme-anhoeren')
stimmknopf.append(createElement(Volume2, { width: 24, height: 24, 'aria-hidden': 'true' }))
stimmknopf.addEventListener('click', () => {
  const meldung = document.querySelector('#meldung')
  meldung.textContent = ''
  if (!aufnahme.spieleAufnahme()) {
    meldung.textContent = 'Noch keine Aufnahme vorhanden.'
  }
})
window.addEventListener('beforeunload', () => aufnahme.beenden())

const auswahl = document.querySelector('#auswahl')
function macheAuswahl(schluessel, titel, werte, istFarbe = false) {
  const gruppe = document.createElement('fieldset')
  const legende = document.createElement('legend')
  legende.textContent = titel
  gruppe.append(legende)
  const reihe = document.createElement('div')
  reihe.className = istFarbe ? 'farben' : 'segmente'
  for (const eintrag of werte) {
    const [name, wert] = istFarbe ? eintrag : [eintrag, eintrag]
    const knopf = document.createElement('button')
    knopf.type = 'button'
    knopf.dataset.schluessel = schluessel
    knopf.dataset.wert = wert
    knopf.title = name
    knopf.setAttribute('aria-label', `${titel}: ${name}`)
    if (istFarbe) {
      knopf.className = 'farbknopf'
      knopf.style.setProperty('--farbe', wert)
      knopf.innerHTML = '<span aria-hidden="true">✓</span>'
    } else knopf.textContent = name
    knopf.addEventListener('click', () => {
      figur[schluessel] = wert
      aktualisiere()
    })
    reihe.append(knopf)
  }
  gruppe.append(reihe)
  auswahl.append(gruppe)
  if (!werte.some(eintrag => (istFarbe ? eintrag[1] : eintrag) === figur[schluessel])) {
    figur[schluessel] = standardFigur[schluessel]
  }
}

macheAuswahl('geschlecht', 'Geschlecht', ['Weiblich', 'Männlich', 'Keine Auswahl'])
macheAuswahl('haut', 'Haut', farben.haut, true)
macheAuswahl('frisur', 'Frisur', ['Kurz', 'Lang', 'Zöpfe', 'Locken', 'Glatze'])
macheAuswahl('haare', 'Haarfarbe', farben.haare, true)
macheAuswahl('kleidung', 'Kleidung', ['T-Shirt', 'Kleid', 'Hoodie'])
macheAuswahl('oberteil', 'Oberteil', farben.oberteil, true)
macheAuswahl('hose', 'Hose', farben.hose, true)
macheAuswahl('schuhe', 'Schuhe', farben.schuhe, true)

const namensfeld = document.querySelector('#name')
const altersfeld = document.querySelector('#alter')
altersfeld.value = figur.alter
altersfeld.addEventListener('input', () => {
  if (altersfeld.validity.valid) figur.alter = altersfeld.valueAsNumber
  aktualisiere()
})
namensfeld.value = figur.name.slice(0, 24)
figur.name = namensfeld.value
namensfeld.addEventListener('input', () => {
  figur.name = namensfeld.value
  aktualisiere()
})
document.querySelector('#zufall').addEventListener('click', () => {
  for (const schluessel of Object.keys(farben)) {
    const palette = farben[schluessel]
    figur[schluessel] = Phaser.Utils.Array.GetRandom(palette)[1]
  }
  figur.frisur = Phaser.Utils.Array.GetRandom(['Kurz', 'Lang', 'Zöpfe', 'Locken', 'Glatze'])
  figur.kleidung = Phaser.Utils.Array.GetRandom(['T-Shirt', 'Kleid', 'Hoodie'])
  aktualisiere()
})
document.querySelector('#speichern').addEventListener('click', () => {
  if (!altersfeld.reportValidity()) return
  if (aufnahme.istBeschaeftigt()) {
    document.querySelector('#meldung').textContent = 'Stoppe zuerst die Aufnahme, bevor du deine Figur speicherst.'
    return
  }
  aufnahme.pausiere()
  try {
    localStorage.setItem('minimini-figur', JSON.stringify(figur))
    starteLandschaft(figur, maleFigur, () => { spiel.loop.wake(); spiel.scale.refresh() }, aufnahme)
    spiel.loop.sleep()
  } catch {
    document.querySelector('#meldung').textContent = 'Die Welt konnte nicht starten. Probier es noch einmal.'
  }
})

let zeichnung
function aktualisiere() {
  document.querySelector('#figurname').textContent = figur.name.trim() || 'Mein MiNiMiNi'
  document.querySelector('#meldung').textContent = ''
  for (const knopf of auswahl.querySelectorAll('button')) {
    knopf.setAttribute('aria-pressed', String(figur[knopf.dataset.schluessel] === knopf.dataset.wert))
  }
  if (zeichnung) maleFigur()
}

// Die Figur wird aus runden Formen gemalt, wie in deinen anderen MiNiMiNi-Spielen.
function maleFigur(grafik = zeichnung, daten = figur, gesicht = {}) {
  const zeichnung = grafik
  const figur = daten
  zeichnung.clear()
  const farbzahl = farbe => Phaser.Display.Color.HexStringToColor(farbe).color
  const kreis = (mitteX, mitteY, radius, farbe, deckkraft = 1) => {
    zeichnung.fillStyle(farbzahl(farbe), deckkraft)
    zeichnung.fillCircle(mitteX, mitteY, radius)
  }
  const rechteck = (links, oben, breite, hoehe, rundung, farbe) => {
    zeichnung.fillStyle(farbzahl(farbe))
    zeichnung.fillRoundedRect(links, oben, breite, hoehe, rundung)
  }
  zeichnung.fillStyle(0x467962, 0.12)
  zeichnung.fillEllipse(0, 40, 48, 8)
  rechteck(-16, -6, 7, 22, 3.5, figur.haut)
  rechteck(9, -6, 7, 22, 3.5, figur.haut)
  kreis(-12.5, 18, 5, figur.haut)
  kreis(12.5, 18, 5, figur.haut)
  rechteck(-9, 12, 8, 20, 4, figur.hose)
  rechteck(1, 12, 8, 20, 4, figur.hose)
  kreis(-5, 33, 5.5, figur.schuhe)
  kreis(5, 33, 5.5, figur.schuhe)
  if (figur.kleidung === 'Kleid') {
    rechteck(-10, -12, 20, 23, 6, figur.oberteil)
    zeichnung.fillStyle(farbzahl(figur.oberteil))
    zeichnung.beginPath()
    zeichnung.moveTo(-8, 7)
    zeichnung.lineTo(8, 7)
    zeichnung.lineTo(13, 24)
    zeichnung.lineTo(-13, 24)
    zeichnung.closePath()
    zeichnung.fillPath()
  } else {
    rechteck(-13, -12, 26, 28, 10, figur.oberteil)
  }
  if (figur.kleidung === 'Hoodie') {
    rechteck(-14, -14, 28, 32, 10, figur.oberteil)
    rechteck(-8, 6, 16, 7, 3, '#ffffff')
    rechteck(-4, -8, 1, 9, 0, '#ffffff')
    rechteck(3, -8, 1, 9, 0, '#ffffff')
  }
  if (figur.frisur !== 'Glatze') kreis(0, -28, 19, figur.haare)
  if (figur.frisur === 'Lang') {
    rechteck(-21, -31, 13, 47, 6, figur.haare)
    rechteck(8, -31, 13, 47, 6, figur.haare)
  }
  if (figur.frisur === 'Zöpfe') {
    for (const seite of [-1, 1]) {
      rechteck(seite * 19 - 4, -27, 8, 28, 4, figur.haare)
      kreis(seite * 19, -4, 4, figur.oberteil)
    }
  }
  if (figur.frisur === 'Locken') {
    for (const [mitteX, mitteY] of [[-18, -26], [-16, -37], [-7, -43], [5, -44], [16, -37], [18, -25]]) {
      kreis(mitteX, mitteY, 8, figur.haare)
    }
  }
  kreis(0, -22, 18, figur.haut)
  if (figur.frisur !== 'Glatze') {
    zeichnung.fillStyle(farbzahl(figur.haare))
    zeichnung.fillEllipse(-4, -37, 26, 10)
  }
  const blickX = gesicht.blickX || 0
  const blickY = gesicht.blickY || 0
  if (gesicht.schlaeft) {
    zeichnung.lineStyle(2, 0x252529)
    zeichnung.lineBetween(-10, -24, -3, -24)
    zeichnung.lineBetween(3, -24, 10, -24)
  } else {
    kreis(-6 + blickX, -24 + blickY, 4, '#252529')
    kreis(6 + blickX, -24 + blickY, 4, '#252529')
    kreis(-4.5 + blickX, -25.5 + blickY, 1.5, '#ffffff')
    kreis(7.5 + blickX, -25.5 + blickY, 1.5, '#ffffff')
  }
  if (gesicht.traurig) {
    zeichnung.lineStyle(1.5, 0x6b4b43)
    zeichnung.lineBetween(-10 + blickX, -30, -3 + blickX, -33)
    zeichnung.lineBetween(3 + blickX, -33, 10 + blickX, -30)
  }
  kreis(-12, -18, 3.5, '#f18d9e', 0.55)
  kreis(12, -18, 3.5, '#f18d9e', 0.55)
  zeichnung.lineStyle(1.7, 0xc96575)
  zeichnung.beginPath()
  if (gesicht.traurig) {
    zeichnung.arc(blickX * 0.4, -10, 7, Math.PI + 0.35, Math.PI * 2 - 0.35, false)
  } else {
    zeichnung.arc(0, -20, 7, 0.35, Math.PI - 0.35, false)
  }
  zeichnung.strokePath()
}

const spiel = new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'figur-bild',
  transparent: true,
  width: 420,
  height: 440,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: {
    create() {
      zeichnung = this.add.graphics({ x: 210, y: 240 })
      zeichnung.setScale(3.8)
      maleFigur()
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.tweens.add({ targets: zeichnung, y: 234, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
      }
      this.game.canvas.setAttribute('role', 'img')
      this.game.canvas.setAttribute('aria-label', 'Vorschau deiner MiNiMiNi-Figur')
      try {
        const spielstand = JSON.parse(localStorage.getItem('minimini-welt'))
        if (spielstand && typeof spielstand === 'object' && localStorage.getItem('minimini-figur')) {
          this.time.delayedCall(0, () => document.querySelector('#speichern').click())
        }
      } catch {}
    },
  },
})
aktualisiere()