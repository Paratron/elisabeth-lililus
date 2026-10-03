import { createElement, Volume2, VolumeX, X } from 'lucide'

export function baueSchatz(welt, beimOeffnen, unterwasser = false) {
  let gefunden = false
  let geloest = false
  let stumm = false
  let klang
  let serieSchliessen
  let serieLaedt = false
  let beendet = false
  try {
    gefunden = localStorage.getItem('minimini-schatz-freund') === 'ja'
    geloest = localStorage.getItem('minimini-schatz-geloest') === 'ja'
    stumm = localStorage.getItem('minimini-schatz-stumm') === 'ja'
  } catch {}
  const truhe = document.createElement('button')
  truhe.className = 'schatz-truhe'
  truhe.setAttribute('aria-label', 'Schatztruhe öffnen')
  const truhenBild = document.createElement('img')
  truhenBild.src = '/assets/schatztruhe.png'
  truhenBild.alt = ''
  truhe.append(truhenBild)
  truhe.hidden = !unterwasser || !gefunden
  if (unterwasser) truhe.classList.add('schatz-unterwasser')
  const panel = document.createElement('section')
  panel.className = 'online-post schatz-panel'
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-label', 'Schatzrätsel')
  panel.hidden = true
  panel.innerHTML = '<h2>Die Unterwasser-Truhe</h2><button class="symbol post-schliessen" aria-label="Schatztruhe schließen"></button><button class="symbol schatz-ton"></button><p class="schatz-frage">Ich leuchte nachts am Himmel und werde manchmal rund. Was bin ich?</p><div class="schatz-antworten"></div><p class="schatz-meldung" role="status"></p>'
  welt.append(truhe, panel)
  const meldung = panel.querySelector('.schatz-meldung')
  const antworten = panel.querySelector('.schatz-antworten')
  const tonknopf = panel.querySelector('.schatz-ton')
  panel.querySelector('.post-schliessen').append(createElement(X, { width: 24, height: 24 }))
  function speichere(schluessel, wert) {
    try { localStorage.setItem(schluessel, wert) } catch {
      meldung.textContent = 'Dein Browser kann gerade nicht speichern.'
    }
  }
  function zeigeTon() {
    tonknopf.replaceChildren(createElement(stumm ? VolumeX : Volume2, { width: 24, height: 24 }))
    tonknopf.setAttribute('aria-label', stumm ? 'Schatzsounds einschalten' : 'Schatzsounds ausschalten')
    tonknopf.title = tonknopf.getAttribute('aria-label')
  }
  function spieleKlang(toene) {
    if (stumm) return
    try {
      const AudioKlasse = window.AudioContext || window.webkitAudioContext
      if (!AudioKlasse) return
      klang ||= new AudioKlasse()
      void klang.resume().catch(() => {})
      toene.forEach((frequenz, nummer) => {
        const ton = klang.createOscillator()
        const laut = klang.createGain()
        const start = klang.currentTime + nummer * 0.16
        ton.type = 'sine'
        ton.frequency.value = frequenz
        laut.gain.setValueAtTime(0, start)
        laut.gain.linearRampToValueAtTime(0.08, start + 0.015)
        laut.gain.exponentialRampToValueAtTime(0.001, start + 0.28)
        ton.connect(laut).connect(klang.destination)
        ton.start(start)
        ton.stop(start + 0.3)
      })
    } catch {}
  }
  tonknopf.addEventListener('click', () => {
    stumm = !stumm
    speichere('minimini-schatz-stumm', stumm ? 'ja' : 'nein')
    if (stumm) void klang?.suspend()
    zeigeTon()
  })
  function zeigeRaetsel() {
    antworten.hidden = geloest
    panel.querySelector('.schatz-frage').hidden = geloest
    if (geloest) meldung.textContent = 'Richtig! Der Mond. Du hast den leuchtenden Unterwasser-Schatz gefunden! ⭐'
  }
  for (const [text, richtig] of [['☀️ Sonne', false], ['🌙 Mond', true], ['🌻 Blume', false]]) {
    const knopf = document.createElement('button')
    knopf.className = 'post-senden'
    knopf.textContent = text
    knopf.addEventListener('click', () => {
      if (geloest) return
      if (!richtig) {
        meldung.textContent = 'Noch nicht! Denk an die Nacht. Versuch es noch einmal.'
        spieleKlang([260, 320])
        return
      }
      geloest = true
      speichere('minimini-schatz-geloest', 'ja')
      spieleKlang([523, 659, 784, 1047])
      truhe.textContent = '⭐'
      zeigeRaetsel()
    })
    antworten.append(knopf)
  }
  truhe.addEventListener('click', () => {
    beimOeffnen()
    panel.hidden = false
    spieleKlang([392, 523])
    zeigeRaetsel()
  })
  panel.querySelector('.post-schliessen').addEventListener('click', () => {
    panel.hidden = true
    void klang?.suspend()
  })
  const filmStart = document.createElement('button')
  filmStart.className = 'minimini-film-knopf post-senden'
  filmStart.textContent = 'Anna und die Welt der MiNiMiNis'
  filmStart.hidden = unterwasser
  if (!unterwasser) welt.append(filmStart)
  filmStart.addEventListener('click', async () => {
    if (unterwasser || beendet || serieLaedt || serieSchliessen) return
    serieLaedt = true
    filmStart.disabled = true
    beimOeffnen()
    panel.hidden = true
    try {
      const { starteSerie } = await import('./serie.js')
      if (beendet) return
      serieSchliessen = starteSerie(() => {
        serieSchliessen = undefined
        if (!beendet && filmStart.isConnected) filmStart.focus()
      })
    } catch {
      filmStart.textContent = 'Serie laden fehlgeschlagen. Noch einmal versuchen'
    } finally {
      serieLaedt = false
      filmStart.disabled = false
    }
  })
  zeigeTon()
  if (geloest) truhe.textContent = '⭐'
  return {
    istOffen: () => !panel.hidden || serieLaedt || Boolean(serieSchliessen),
    empfange(nachricht) {
      if (nachricht.typ !== 'besuche' || !Array.isArray(nachricht.daten?.freunde) || !nachricht.daten.freunde.length || gefunden) return
      gefunden = true
      truhe.hidden = !unterwasser
      speichere('minimini-schatz-freund', 'ja')
    },
    beenden() {
      beendet = true
      serieSchliessen?.()
      void klang?.close()
    },
  }
}