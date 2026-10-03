import { createElement, Mail, Send, X } from 'lucide'

export function bauePost(welt, netzwerk) {
  let briefe = []
  try {
    const gespeichert = JSON.parse(localStorage.getItem('minimini-briefe'))
    if (Array.isArray(gespeichert)) briefe = gespeichert.filter(brief => typeof brief?.von === 'string' && typeof brief?.text === 'string').slice(-30)
  } catch {}
  const post = document.createElement('section')
  post.className = 'online-post'
  post.setAttribute('aria-label', 'Briefkasten')
  post.hidden = true
  post.innerHTML = '<h2>Deine Briefe</h2><button class="symbol post-schliessen" aria-label="Briefkasten schließen"></button><div class="post-liste"></div><form><label>Onlinefreund<select aria-label="Onlinefreund"></select></label><label>Dein Brief<textarea aria-label="Dein Brief" maxlength="160" rows="3"></textarea></label><button class="post-senden" type="submit">Senden</button></form><button class="post-verbinden">In die Stadt fahren</button><p role="status"></p>'
  welt.append(post)
  post.querySelector('.post-schliessen').append(createElement(X, { width: 24, height: 24 }))
  post.querySelector('.post-senden').prepend(createElement(Send, { width: 22, height: 22 }))
  const app = document.createElement('button')
  app.className = 'tablet-app'
  app.setAttribute('aria-label', 'Briefe-App')
  app.append(createElement(Mail, { width: 40, height: 40 }), document.createTextNode('Briefe'))
  const auswahl = post.querySelector('select')
  const text = post.querySelector('textarea')
  const status = post.querySelector('[role="status"]')
  function aktualisiere() {
    const bisher = auswahl.value
    auswahl.replaceChildren()
    const freunde = netzwerk.istVerbunden() ? netzwerk.freunde() : []
    for (const freund of freunde) {
      const option = document.createElement('option')
      option.value = freund.id
      option.textContent = freund.figur.name || 'MiNiMiNi'
      auswahl.append(option)
    }
    if (freunde.some(freund => freund.id === bisher)) auswahl.value = bisher
    if (!freunde.length) {
      const leer = document.createElement('option')
      leer.textContent = 'Kein Onlinefreund verbunden'
      auswahl.append(leer)
    }
    auswahl.disabled = freunde.length === 0
    post.querySelector('.post-senden').disabled = freunde.length === 0
    post.querySelector('.post-verbinden').hidden = netzwerk.istVerbunden()
    const liste = post.querySelector('.post-liste')
    liste.replaceChildren()
    if (!briefe.length) liste.textContent = 'Dein Briefkasten ist leer.'
    for (const brief of [...briefe].reverse()) {
      const eintrag = document.createElement('article')
      const von = document.createElement('strong')
      von.textContent = `Von ${brief.von}`
      const inhalt = document.createElement('p')
      inhalt.textContent = brief.text
      eintrag.append(von, inhalt)
      liste.append(eintrag)
    }
  }
  async function oeffne() {
    netzwerk.beimOeffnen()
    aktualisiere()
    post.hidden = false
    if (!netzwerk.istVerbunden()) {
      status.textContent = 'Verbinde mit deinen Onlinefreunden …'
      try { await netzwerk.verbinden() } catch {
        status.textContent = 'Die Verbindung klappt gerade nicht. Versuche es noch einmal.'
      }
      aktualisiere()
      if (netzwerk.istVerbunden()) status.textContent = auswahl.disabled ? 'Deine Schwester muss das Spiel auf demselben Server öffnen und sich verbinden.' : 'Wähle deinen Onlinefreund.'
    }
  }
  app.addEventListener('click', oeffne)
  post.querySelector('.post-schliessen').addEventListener('click', () => { post.hidden = true })
  post.querySelector('.post-verbinden').addEventListener('click', async () => {
    await netzwerk.verbinden()
    aktualisiere()
  })
  post.querySelector('form').addEventListener('submit', ereignis => {
    ereignis.preventDefault()
    status.textContent = netzwerk.senden(auswahl.value, text.value) ? 'Brief wird gesendet …' : 'Wähle einen Onlinefreund und schreibe deinen Brief.'
  })
  return {
    app, aktualisiere, oeffne,
    istOffen: () => !post.hidden,
    empfange(nachricht) {
      if (nachricht.typ === 'wirtschaft' && Array.isArray(nachricht.daten?.briefe)) {
        briefe = nachricht.daten.briefe.slice(-30)
        try { localStorage.setItem('minimini-briefe', JSON.stringify(briefe)) } catch {}
        aktualisiere()
      }
      if (nachricht.typ === 'brief-status') {
        status.textContent = nachricht.text
        if (nachricht.text === 'Brief gesendet.') text.value = ''
      }
    },
  }
}