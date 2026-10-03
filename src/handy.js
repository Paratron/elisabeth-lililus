import { createElement, MessageCircle, Star, Grid2X2, Palette, Trash2, VolumeX, Send } from 'lucide'
import Phaser from 'phaser'

export function baueHandyApps(handy, netzwerk) {
  const start = handy.querySelector('.handy-start')
  const raster = handy.querySelector('.tablet-apps')
  const ansichten = new Map()
  const stumm = new Set()
  function oeffne(name) {
    start.hidden = Boolean(name)
    handy.querySelector('h2').textContent = name || 'MiNiMiNiS 3'
    for (const [titel, ansicht] of ansichten) ansicht.hidden = titel !== name
  }
  function app(name, icon, farbe) {
    const knopf = document.createElement('button')
    knopf.className = 'tablet-app'
    knopf.type = 'button'
    knopf.style.background = farbe
    knopf.setAttribute('aria-label', `${name}-App`)
    knopf.append(createElement(icon, { width: 40, height: 40 }), document.createTextNode(name))
    knopf.addEventListener('click', () => { oeffne(name); aktualisiere() })
    raster.append(knopf)
    const ansicht = document.createElement('section')
    ansicht.className = 'handy-app-inhalt'
    ansicht.hidden = true
    ansicht.setAttribute('aria-label', name)
    handy.append(ansicht)
    ansichten.set(name, ansicht)
    return ansicht
  }
  const home = document.createElement('button')
  home.className = 'symbol handy-home'
  home.setAttribute('aria-label', 'Alle Apps')
  home.append(createElement(Grid2X2, { width: 24, height: 24 }))
  home.addEventListener('click', () => oeffne(''))
  handy.append(home)
  const sterne = app('Sterne', Star, '#f9dd75')
  sterne.innerHTML = '<p class="sterne-punkte" role="status">Sterne: 0</p><div class="sterne-spielfeld"><button class="stern-sammeln" aria-label="Stern sammeln">⭐</button></div>'
  let punkte = 0
  try {
    const gespeichert = Number(localStorage.getItem('minimini-sterne'))
    if (Number.isSafeInteger(gespeichert) && gespeichert > 0) punkte = gespeichert
  } catch {}
  sterne.querySelector('p').textContent = `Sterne: ${punkte}`
  sterne.querySelector('button').addEventListener('click', () => {
    punkte++
    sterne.querySelector('p').textContent = `Sterne: ${punkte}`
    const stern = sterne.querySelector('button')
    stern.style.left = `${Phaser.Math.Between(0, 70)}%`
    stern.style.top = `${Phaser.Math.Between(0, 60)}%`
    try { localStorage.setItem('minimini-sterne', String(punkte)) } catch {}
  })
  const malen = app('Malen', Palette, '#a9ddea')
  malen.innerHTML = '<div class="mal-werkzeuge" role="group" aria-label="Malwerkzeuge"></div><canvas width="900" height="360" class="mal-bild" aria-label="Dein Bild"></canvas>'
  const leinwand = malen.querySelector('canvas')
  const pinsel = leinwand.getContext('2d')
  let farbe = '#ed637b'
  let zeichnet = false
  let beruehrt = false
  function leeren() { pinsel.fillStyle = '#ffffff'; pinsel.fillRect(0, 0, 900, 360) }
  function speichereBild() { try { localStorage.setItem('minimini-bild', leinwand.toDataURL('image/png')) } catch {} }
  leeren()
  for (const [name, wert] of [['Pink', '#ed637b'], ['Blau', '#428bdb'], ['Grün', '#4aa887'], ['Gelb', '#f5c84c'], ['Schwarz', '#30343c']]) {
    const knopf = document.createElement('button')
    knopf.type = 'button'
    knopf.className = 'farbknopf'
    knopf.style.setProperty('--farbe', wert)
    knopf.setAttribute('aria-label', `Pinsel: ${name}`)
    knopf.setAttribute('aria-pressed', String(farbe === wert))
    knopf.addEventListener('click', () => {
      farbe = wert
      malen.querySelectorAll('.farbknopf').forEach(auswahl => auswahl.setAttribute('aria-pressed', String(auswahl === knopf)))
    })
    malen.querySelector('.mal-werkzeuge').append(knopf)
  }
  const radieren = document.createElement('button')
  radieren.type = 'button'
  radieren.className = 'symbol'
  radieren.setAttribute('aria-label', 'Bild leeren')
  radieren.append(createElement(Trash2, { width: 24, height: 24 }))
  radieren.addEventListener('click', () => { beruehrt = true; leeren(); speichereBild() })
  malen.querySelector('.mal-werkzeuge').append(radieren)
  try {
    const gespeichert = localStorage.getItem('minimini-bild')
    if (gespeichert) {
      const bild = new Image()
      bild.onload = () => { if (!beruehrt) pinsel.drawImage(bild, 0, 0, 900, 360) }
      bild.src = gespeichert
    }
  } catch {}
  function punkt(ereignis) {
    const rahmen = leinwand.getBoundingClientRect()
    return { x: (ereignis.clientX - rahmen.left) * 900 / rahmen.width, y: (ereignis.clientY - rahmen.top) * 360 / rahmen.height }
  }
  leinwand.addEventListener('pointerdown', ereignis => {
    ereignis.preventDefault()
    zeichnet = true
    beruehrt = true
    leinwand.setPointerCapture(ereignis.pointerId)
    const ort = punkt(ereignis)
    pinsel.strokeStyle = farbe
    pinsel.lineWidth = 10
    pinsel.lineCap = 'round'
    pinsel.lineJoin = 'round'
    pinsel.beginPath()
    pinsel.moveTo(ort.x, ort.y)
    pinsel.lineTo(ort.x + 0.1, ort.y)
    pinsel.stroke()
  })
  leinwand.addEventListener('pointermove', ereignis => {
    if (!zeichnet) return
    const ort = punkt(ereignis)
    pinsel.lineTo(ort.x, ort.y)
    pinsel.stroke()
  })
  for (const ereignis of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    leinwand.addEventListener(ereignis, () => { if (zeichnet) { zeichnet = false; speichereBild() } })
  }
  const chat = app('Chat', MessageCircle, '#f7b8ce')
  chat.innerHTML = '<button class="chat-verbinden">Verbinden</button><p class="chat-status" role="status">Nicht verbunden</p><div class="chat-verlauf" role="log" aria-label="Nachrichten"></div><form class="chat-form"><input aria-label="Nachricht" maxlength="160" placeholder="Nachricht"><button type="submit">Senden</button></form>'
  const sendeknopf = chat.querySelector('button[type="submit"]')
  sendeknopf.setAttribute('aria-label', 'Nachricht senden')
  sendeknopf.title = 'Nachricht senden'
  sendeknopf.replaceChildren(createElement(Send, { width: 24, height: 24 }))
  function aktualisiere() {
    const verbunden = netzwerk.istVerbunden()
    chat.querySelector('.chat-status').textContent = verbunden ? 'Verbunden' : 'Nicht verbunden'
    chat.querySelector('.chat-verbinden').hidden = verbunden
    chat.querySelector('input').disabled = !verbunden
    sendeknopf.disabled = !verbunden
  }
  chat.querySelector('.chat-verbinden').addEventListener('click', async () => {
    const knopf = chat.querySelector('.chat-verbinden')
    knopf.disabled = true
    chat.querySelector('.chat-status').textContent = 'Verbinde …'
    try { await netzwerk.verbinden() } catch {}
    oeffne('Chat')
    aktualisiere()
    if (!netzwerk.istVerbunden()) chat.querySelector('.chat-status').textContent = 'Keine Verbindung. Bitte versuche es erneut.'
    knopf.disabled = false
  })
  chat.querySelector('form').addEventListener('submit', ereignis => {
    ereignis.preventDefault()
    const eingabe = chat.querySelector('input')
    if (!eingabe.value.trim()) return
    if (netzwerk.senden(eingabe.value.trim())) eingabe.value = ''
    else chat.querySelector('.chat-status').textContent = netzwerk.istVerbunden() ? 'Warte einen Moment.' : 'Nicht verbunden'
  })
  return {
    aktualisiere,
    oeffneChat() { oeffne('Chat'); aktualisiere() },
    empfange(nachricht) {
      if (stumm.has(nachricht.spielerId)) return false
      const verlauf = chat.querySelector('.chat-verlauf')
      const zeile = document.createElement('article')
      zeile.className = 'chat-nachricht'
      zeile.dataset.spieler = nachricht.spielerId
      const text = document.createElement('p')
      text.textContent = `${nachricht.name}: ${nachricht.text}`
      const ausblenden = document.createElement('button')
      ausblenden.type = 'button'
      ausblenden.className = 'symbol'
      ausblenden.setAttribute('aria-label', `${nachricht.name} stummschalten`)
      ausblenden.title = `${nachricht.name} stummschalten`
      ausblenden.append(createElement(VolumeX, { width: 20, height: 20 }))
      ausblenden.addEventListener('click', () => {
        stumm.add(nachricht.spielerId)
        for (const eintrag of [...verlauf.children]) if (eintrag.dataset.spieler === nachricht.spielerId) eintrag.remove()
      })
      zeile.append(text, ausblenden)
      verlauf.append(zeile)
      while (verlauf.children.length > 60) verlauf.firstElementChild.remove()
      verlauf.scrollTop = verlauf.scrollHeight
    },
  }
}