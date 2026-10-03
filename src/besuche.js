import { createElement, Users, X } from 'lucide'

export function baueBesuche(welt, netzwerk) {
  let daten = { freunde: [] }
  let konto
  let stand
  let verbindet = false
  const anfragen = new Map()
  function element(art, text) {
    const neu = document.createElement(art)
    if (text !== undefined) neu.textContent = text
    return neu
  }
  function knopf(text, aktion) {
    const neu = element('button', text)
    neu.type = 'button'
    neu.className = 'post-senden'
    neu.addEventListener('click', aktion)
    return neu
  }
  const panel = element('section')
  panel.className = 'online-post besuche-panel'
  panel.hidden = true
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-label', 'Besuche und Freundschaften')
  const schliessen = knopf('', () => { panel.hidden = true; app.focus() })
  schliessen.className = 'symbol post-schliessen'
  schliessen.setAttribute('aria-label', 'Besuche schließen')
  schliessen.append(createElement(X, { width: 24, height: 24 }))
  const status = element('p')
  status.setAttribute('role', 'status')
  const verbinden = knopf('Verbinden', async () => {
    verbindet = true
    aktualisiere()
    try { await netzwerk.verbinden() } finally { verbindet = false; aktualisiere() }
  })
  const offen = element('input')
  offen.type = 'checkbox'
  offen.setAttribute('aria-label', 'Besuche erlauben')
  const erlaubnis = element('label')
  erlaubnis.className = 'besuche-erlaubnis'
  erlaubnis.append(offen, document.createTextNode('Besuche erlauben'))
  const zuhause = knopf('Zuhause online', () => netzwerk.zuhause(offen.checked))
  const stadt = knopf('Zur Stadt', () => netzwerk.zurStadt())
  const steuerung = element('div')
  steuerung.className = 'besuche-aktionen'
  steuerung.append(verbinden, erlaubnis, zuhause, stadt)
  const onlineListe = element('div')
  const freundListe = element('div')
  const anfrageListe = element('div')
  const standListe = element('div')
  panel.append(element('h2', 'Besuche'), schliessen, status, steuerung,
    element('h3', 'Online'), onlineListe, element('h3', 'Anfragen an dich'), anfrageListe,
    element('h3', 'Deine Freunde'), freundListe, standListe)
  welt.append(panel)
  const app = knopf('Besuche', () => oeffne())
  app.className = 'tablet-app'
  app.setAttribute('aria-label', 'Besuche-App')
  app.prepend(createElement(Users, { width: 40, height: 40 }))
  function sende(nachricht) {
    status.textContent = netzwerk.senden(nachricht) ? 'Warte auf die Antwort.' : 'Bitte erst verbinden.'
  }
  async function oeffne() {
    netzwerk.beimOeffnen()
    panel.hidden = false
    aktualisiere()
    schliessen.focus()
    if (!netzwerk.istVerbunden() && !verbindet) {
      verbindet = true
      status.textContent = 'Verbinde mit anderen Spielern …'
      aktualisiere()
      try { await netzwerk.verbinden() } catch {
        status.textContent = 'Die Verbindung klappt gerade nicht. Versuche es noch einmal.'
      } finally {
        verbindet = false
        aktualisiere()
      }
      if (netzwerk.istVerbunden()) status.textContent = 'Deine Schwester kann sich auch verbinden. Dann erscheint sie hier.'
    }
  }
  offen.addEventListener('change', () => {
    if (netzwerk.eigenerOrt() === `Haus:${daten.hausId}`) netzwerk.zuhause(offen.checked)
  })
  panel.addEventListener('keydown', ereignis => {
    if (ereignis.key === 'Escape') { panel.hidden = true; app.focus() }
  })
  function aktualisiere() {
    const online = netzwerk.istVerbunden()
    const personen = online ? netzwerk.spieler() : []
    const selbst = personen.find(person => person.id === netzwerk.eigeneId())
    verbinden.hidden = online
    verbinden.disabled = verbindet
    zuhause.disabled = !online || !netzwerk.hausFertig()
    stadt.disabled = !online || netzwerk.eigenerOrt() === 'Stadt'
    offen.disabled = !online || !netzwerk.hausFertig()
    if (selbst?.ort === `Haus:${daten.hausId}`) offen.checked = selbst.haus.offen
    onlineListe.replaceChildren()
    for (const person of personen.filter(person => person.id !== netzwerk.eigeneId())) {
      const zeile = element('article')
      const istFreund = daten.freunde.some(freund => freund.hausId === person.haus?.id)
      const besuchen = knopf('Besuchen', () => sende({ typ: 'besuchen', spielerId: person.id }))
      besuchen.disabled = !person.haus?.offen || person.ort !== `Haus:${person.haus.id}`
      const freund = knopf(istFreund ? 'Befreundet' : 'Freundschaft anfragen', () => sende({ typ: 'freund-anfrage', spielerId: person.id }))
      freund.disabled = istFreund
      zeile.append(element('p', `${person.figur.name || 'MiNiMiNi'} · ${person.ort.startsWith('Haus:') ? 'Zuhause' : person.ort}`), besuchen, freund)
      onlineListe.append(zeile)
    }
    if (!onlineListe.children.length) onlineListe.textContent = online ? 'Gerade niemand anderes online.' : 'Nicht verbunden.'
    freundListe.replaceChildren()
    for (const freund of daten.freunde) {
      const person = personen.find(person => person.haus?.id === freund.hausId)
      freundListe.append(element('p', `${freund.name} · ${person ? 'online' : 'offline'}`))
    }
    if (!daten.freunde.length) freundListe.textContent = 'Noch keine bestätigten Freunde.'
    anfrageListe.replaceChildren()
    for (const [kennung, anfrage] of anfragen) {
      if (!online || Date.now() >= anfrage.ende || !personen.some(person => person.id === anfrage.spielerId)) {
        anfragen.delete(kennung)
        continue
      }
      const zeile = element('article')
      zeile.append(element('p', `${anfrage.name} möchte mit dir befreundet sein.`))
      for (const [text, annehmen] of [['Annehmen', true], ['Ablehnen', false]]) {
        zeile.append(knopf(text, () => {
          sende({ typ: 'freund-antwort', id: kennung, annehmen })
          anfragen.delete(kennung)
          aktualisiere()
        }))
      }
      anfrageListe.append(zeile)
    }
    if (!anfrageListe.children.length) anfrageListe.textContent = 'Keine offenen Anfragen.'
    aktualisiereStand()
  }
  function aktualisiereStand() {
    standListe.replaceChildren()
    if (!stand || stand.verkaeufer === netzwerk.eigeneId()) return
    const host = netzwerk.spieler().find(person => person.id === stand.verkaeufer)
    if (!host || netzwerk.eigenerOrt() !== `Haus:${host.haus?.id}`) return
    standListe.append(element('h3', `Stand von ${stand.name}`),
      element('p', `${stand.offen ? 'Geöffnet' : 'Geschlossen'} · Spielmünzen: ${konto?.muenzen ?? '-'}`))
    for (const [artikel, name] of Object.entries({ teddy: 'Teddy', blume: 'Blume', kuchen: 'Kuchen', ball: 'Ball', muschel: 'Muschel', perle: 'Perle', kristall: 'Kristall' })) {
      const zeile = element('article')
      const kaufen = knopf(`${name} kaufen · 8 Spielmünzen`, () => {
        aktualisiere()
        if (!kaufen.disabled) sende({ typ: 'standkauf', verkaeufer: stand.verkaeufer, artikel })
      })
      kaufen.disabled = !netzwerk.istVerbunden() || !stand.offen || !konto || konto.muenzen < 8 ||
        stand.inventar[artikel] < 1 || konto.inventar[artikel] >= 1000 || host.ort !== netzwerk.eigenerOrt()
      zeile.append(element('p', `${name} · Vorrat: ${stand.inventar[artikel]}`), kaufen)
      standListe.append(zeile)
    }
  }
  return {
    app, oeffne, istOffen: () => !panel.hidden, aktualisiere,
    empfange(nachricht) {
      if (nachricht.typ === 'besuche') daten = nachricht.daten
      if (nachricht.typ === 'wirtschaft') konto = nachricht.daten
      if (nachricht.typ === 'stand') stand = nachricht.daten
      if (nachricht.typ === 'besuch-status' || nachricht.typ === 'handel-status') status.textContent = nachricht.text
      if (nachricht.typ === 'freund-anfrage') {
        anfragen.set(nachricht.id, { ...nachricht, ende: Date.now() + 120000 })
        setTimeout(aktualisiere, 120000)
        oeffne()
      }
      aktualisiere()
    },
  }
}