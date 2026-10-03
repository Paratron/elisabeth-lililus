import { createElement, Store, X } from 'lucide'

export function baueHandel(welt, netzwerk) {
  const artikel = ['teddy', 'blume', 'kuchen', 'ball', 'muschel', 'perle', 'kristall']
  const namen = { teddy: 'Teddy', blume: 'Blume', kuchen: 'Kuchen', ball: 'Ball', muschel: 'Muschel', perle: 'Perle', kristall: 'Kristall' }
  const angebote = new Map()
  const zeilen = new Map()
  let konto = null
  let verbindet = false
  let naechsterVerkauf = 0

  function element(art, text) {
    const neu = document.createElement(art)
    if (text !== undefined) neu.textContent = text
    return neu
  }

  function knopf(text) {
    const neu = element('button', text)
    neu.type = 'button'
    neu.className = 'post-senden'
    neu.style.minWidth = '48px'
    neu.style.minHeight = '48px'
    neu.style.maxWidth = '100%'
    neu.style.whiteSpace = 'normal'
    neu.style.overflowWrap = 'anywhere'
    return neu
  }

  function auswahl(text) {
    const beschriftung = element('label', text)
    const feld = element('select')
    feld.setAttribute('aria-label', text)
    feld.style.minWidth = '48px'
    beschriftung.append(feld)
    handel.append(beschriftung)
    return feld
  }

  function fuelleAuswahl(feld, eintraege, leertext) {
    const bisher = feld.value
    feld.replaceChildren()
    for (const eintrag of eintraege) {
      const option = element('option', eintrag.text)
      option.value = eintrag.wert
      feld.append(option)
    }
    if (!eintraege.length) {
      const option = element('option', leertext)
      option.value = ''
      feld.append(option)
    }
    if (eintraege.some(eintrag => eintrag.wert === bisher)) feld.value = bisher
  }

  const handel = element('section')
  handel.className = 'online-post'
  handel.hidden = true
  handel.setAttribute('role', 'dialog')
  handel.setAttribute('aria-label', 'Handel')
  handel.style.overflowWrap = 'anywhere'
  const schliessen = knopf()
  schliessen.className = 'symbol post-schliessen'
  schliessen.setAttribute('aria-label', 'Handel schließen')
  schliessen.append(createElement(X, { width: 24, height: 24 }))
  const muenzen = element('p', 'Spielmünzen: -')
  const ladenLabel = element('label')
  ladenLabel.style.display = 'flex'
  ladenLabel.style.alignItems = 'center'
  ladenLabel.style.gap = '8px'
  ladenLabel.style.minHeight = '48px'
  const laden = element('input')
  laden.type = 'checkbox'
  laden.setAttribute('aria-label', 'Laden geöffnet')
  laden.style.width = '48px'
  laden.style.height = '48px'
  laden.style.flex = '0 0 48px'
  laden.style.margin = '0'
  ladenLabel.append(laden, document.createTextNode('Laden geöffnet'))
  const verbindung = element('p')
  const verbinden = knopf('Verbinden')
  verbinden.className = 'post-verbinden'
  const status = element('p')
  status.setAttribute('role', 'status')
  status.setAttribute('aria-live', 'polite')
  handel.append(element('h2', 'Dein Laden'), schliessen, muenzen, ladenLabel, verbindung, verbinden, status)

  const inventar = element('div')
  handel.append(inventar)
  for (const name of artikel) {
    const zeile = element('article')
    zeile.style.padding = '12px 0'
    zeile.style.borderBottom = '1px solid #dde5df'
    const anzahl = element('p')
    const aktionen = element('div')
    aktionen.style.display = 'flex'
    aktionen.style.flexWrap = 'wrap'
    aktionen.style.gap = '8px'
    const kaufen = artikel.indexOf(name) < 4 ? knopf('Kaufen · 5 Spielmünzen') : null
    const verkaufen = knopf('Verkaufen · +8 · Spielkunde')
    verkaufen.setAttribute('aria-label', `${namen[name]} verkaufen an Spielkunde, 8 Spielmünzen`)
    if (kaufen) {
      kaufen.setAttribute('aria-label', `${namen[name]} kaufen, 5 Spielmünzen`)
      kaufen.addEventListener('click', () => {
        aktualisiere()
        if (!kaufen.disabled) sende({ typ: 'kaufen', artikel: name })
      })
      aktionen.append(kaufen)
    }
    verkaufen.addEventListener('click', () => {
      aktualisiere()
      if (verkaufen.disabled) return
      if (sende({ typ: 'verkaufen', artikel: name })) {
        naechsterVerkauf = Date.now() + 1000
        aktualisiere()
        setTimeout(aktualisiere, 1000)
      }
    })
    aktionen.append(verkaufen)
    zeile.append(anzahl, aktionen)
    inventar.append(zeile)
    zeilen.set(name, { anzahl, kaufen, verkaufen })
  }

  handel.append(element('h3', 'Geschenke und Tausch'))
  const freund = auswahl('Onlinefreund')
  const gib = auswahl('Deine Sache')
  const nimm = auswahl('Gewünschte Sache beim Tausch')
  fuelleAuswahl(nimm, artikel.map(name => ({ wert: name, text: namen[name] })), '')
  const geschenk = knopf('Geschenk senden')
  const tausch = knopf('Tausch anbieten')
  const sendenLeiste = element('div')
  sendenLeiste.style.display = 'flex'
  sendenLeiste.style.flexWrap = 'wrap'
  sendenLeiste.style.gap = '8px'
  sendenLeiste.append(geschenk, tausch)
  const angebotListe = element('div')
  const postListe = element('div')
  handel.append(sendenLeiste, element('h3', 'Angebote für dich'), angebotListe, element('h3', 'Erhaltene Sachen'), postListe)
  welt.append(handel)

  const app = element('button')
  app.type = 'button'
  app.className = 'tablet-app'
  app.setAttribute('aria-label', 'Handel-App')
  app.style.minWidth = '48px'
  app.style.minHeight = '48px'
  app.append(createElement(Store, { width: 40, height: 40 }), document.createTextNode('Handel'))

  function sende(nachricht) {
    if (!netzwerk.istVerbunden()) {
      status.textContent = 'Du bist nicht verbunden.'
      aktualisiere()
      return false
    }
    const gesendet = netzwerk.senden(nachricht)
    status.textContent = gesendet ? 'Warte auf die Antwort.' : 'Senden hat nicht geklappt.'
    return gesendet
  }

  function aktualisiere() {
    const online = netzwerk.istVerbunden()
    const bereit = online && konto !== null
    verbindung.textContent = !online ? 'Nicht verbunden' : konto ? 'Verbunden' : 'Kontostand wird geladen.'
    verbinden.hidden = online
    verbinden.disabled = verbindet
    muenzen.textContent = `Spielmünzen: ${konto?.muenzen ?? '-'}`
    laden.checked = konto?.laden === true
    laden.disabled = !bereit
    for (const name of artikel) {
      const zeile = zeilen.get(name)
      const anzahl = konto?.inventar[name]
      zeile.anzahl.textContent = `${namen[name]} · Besitz: ${anzahl ?? '-'}`
      if (zeile.kaufen) zeile.kaufen.disabled = !bereit || konto.muenzen < 5 || anzahl >= 1000
      zeile.verkaufen.disabled = !bereit || !konto.laden || anzahl < 1 || konto.muenzen > 999992 || Date.now() < naechsterVerkauf
    }
    const freunde = online ? netzwerk.freunde() : []
    fuelleAuswahl(freund, freunde.map(person => ({ wert: person.id, text: person.figur?.name || 'MiNiMiNi' })), 'Kein Onlinefreund verbunden')
    fuelleAuswahl(gib, artikel.filter(name => konto?.inventar[name] > 0)
      .map(name => ({ wert: name, text: `${namen[name]} (${konto.inventar[name]})` })), 'Keine Sache vorhanden')
    freund.disabled = !bereit || freunde.length === 0
    gib.disabled = !bereit || !gib.value
    nimm.disabled = !bereit
    geschenk.disabled = !bereit || !freund.value || !gib.value
    tausch.disabled = geschenk.disabled || !nimm.value

    angebotListe.replaceChildren()
    if (!angebote.size) angebotListe.textContent = 'Keine offenen Angebote.'
    for (const angebot of angebote.values()) {
      const zeile = element('article')
      zeile.style.padding = '12px 0'
      const beschreibung = angebot.art === 'geschenk'
        ? `${angebot.name} schenkt dir: ${namen[angebot.artikel]}.`
        : `${angebot.name} bietet ${namen[angebot.gib]} für deine Sache: ${namen[angebot.nimm]}.`
      const annehmen = knopf('Annehmen')
      const ablehnen = knopf('Ablehnen')
      annehmen.disabled = !bereit || (angebot.art === 'tausch' && konto.inventar[angebot.nimm] < 1)
      ablehnen.disabled = !online
      annehmen.addEventListener('click', () => {
        if (netzwerk.istVerbunden() && konto && (angebot.art !== 'tausch' || konto.inventar[angebot.nimm] > 0)) {
          sende({ typ: 'angebot', id: angebot.id, annehmen: true })
        }
      })
      ablehnen.addEventListener('click', () => sende({ typ: 'angebot', id: angebot.id, annehmen: false }))
      const aktionen = element('div')
      aktionen.style.display = 'flex'
      aktionen.style.flexWrap = 'wrap'
      aktionen.style.gap = '8px'
      aktionen.append(annehmen, ablehnen)
      zeile.append(element('p', beschreibung), aktionen)
      angebotListe.append(zeile)
    }
    postListe.replaceChildren()
    if (!konto?.post.length) postListe.textContent = konto ? 'Noch keine Sachen erhalten.' : '-'
    for (const eintrag of [...(konto?.post ?? [])].reverse()) {
      postListe.append(element('p', `${eintrag.art === 'tausch' ? 'Tausch' : 'Geschenk'} von ${eintrag.von}: ${namen[eintrag.artikel] ?? eintrag.artikel}`))
    }
  }

  function oeffne() {
    netzwerk.beimOeffnen()
    aktualisiere()
    handel.hidden = false
    schliessen.focus()
  }

  app.addEventListener('click', oeffne)
  schliessen.addEventListener('click', () => { handel.hidden = true; app.focus() })
  handel.addEventListener('keydown', ereignis => {
    if (ereignis.key === 'Escape') { handel.hidden = true; app.focus() }
  })
  laden.addEventListener('change', () => {
    if (konto && netzwerk.istVerbunden()) sende({ typ: 'laden', offen: laden.checked })
    aktualisiere()
  })
  verbinden.addEventListener('click', async () => {
    if (verbindet) return
    verbindet = true
    konto = null
    aktualisiere()
    try { await netzwerk.verbinden() } catch {
      status.textContent = 'Verbinden hat nicht geklappt.'
    } finally {
      verbindet = false
      aktualisiere()
    }
  })
  geschenk.addEventListener('click', () => {
    aktualisiere()
    if (!geschenk.disabled) sende({ typ: 'geschenk', empfaenger: freund.value, artikel: gib.value })
  })
  tausch.addEventListener('click', () => {
    aktualisiere()
    if (!tausch.disabled) sende({ typ: 'tausch', empfaenger: freund.value, gib: gib.value, nimm: nimm.value })
  })
  for (const feld of [freund, gib, nimm]) feld.addEventListener('change', aktualisiere)

  aktualisiere()
  return {
    app, oeffne, istOffen: () => !handel.hidden, aktualisiere,
    empfange(nachricht) {
      if (nachricht?.typ === 'wirtschaft') {
        const daten = nachricht.daten
        if (!Number.isInteger(daten?.muenzen) || daten.muenzen < 0 || typeof daten.laden !== 'boolean' ||
            !artikel.every(name => Number.isInteger(daten.inventar?.[name]) && daten.inventar[name] >= 0)) return
        konto = { muenzen: daten.muenzen, laden: daten.laden, inventar: { ...daten.inventar },
          post: Array.isArray(daten.post) ? daten.post.map(eintrag => ({ ...eintrag })) : [] }
        aktualisiere()
      }
      if (nachricht?.typ === 'handel-status') {
        status.textContent = typeof nachricht.text === 'string' ? nachricht.text : ''
        aktualisiere()
      }
      if (nachricht?.typ === 'angebot') {
        const angebot = nachricht.daten
        if (typeof angebot?.id !== 'string' || typeof angebot.name !== 'string' ||
            !['geschenk', 'tausch'].includes(angebot.art) ||
            (angebot.art === 'geschenk' ? !artikel.includes(angebot.artikel) : !artikel.includes(angebot.gib) || !artikel.includes(angebot.nimm))) return
        angebote.set(angebot.id, { ...angebot })
        oeffne()
      }
      if (nachricht?.typ === 'angebot-ende') {
        angebote.delete(nachricht.id)
        aktualisiere()
      }
    },
  }
}