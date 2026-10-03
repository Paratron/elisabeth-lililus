export function baueStadt(szene, betreteLaden) {
  const stadt = szene.add.container(0, 0).setDepth(-1).setVisible(false)
  const zeichnung = szene.add.graphics()
  stadt.add(zeichnung)
  zeichnung.fillStyle(0xdaf0ef)
  zeichnung.fillRect(0, 0, 1280, 800)
  zeichnung.fillStyle(0xa5d779)
  zeichnung.fillRect(0, 260, 1280, 540)
  zeichnung.fillStyle(0xe5e6e3)
  zeichnung.fillRoundedRect(40, 300, 1200, 455, 8)
  zeichnung.lineStyle(2, 0xccd0cb)
  for (let hoehe = 340; hoehe < 760; hoehe += 60) zeichnung.lineBetween(40, hoehe, 1240, hoehe)
  for (let breite = 100; breite < 1240; breite += 100) zeichnung.lineBetween(breite, 300, breite, 755)
  for (const [breite, farbe, name, emoji] of [
    [85, 0xf4db68, 'Laden', '🏪'], [455, 0xeda5bb, 'Café', '☕'], [825, 0x8fc8ed, 'Spielhaus', '🎲'],
  ]) {
    zeichnung.fillStyle(farbe)
    zeichnung.fillRoundedRect(breite, 120, 320, 170, 8)
    zeichnung.fillStyle(0x557966)
    zeichnung.fillRoundedRect(breite - 10, 110, 340, 25, 6)
    zeichnung.fillRoundedRect(breite + 130, 205, 60, 85, 6)
    zeichnung.fillStyle(0xffffff)
    zeichnung.fillRoundedRect(breite + 25, 195, 70, 60, 6)
    zeichnung.fillRoundedRect(breite + 225, 195, 70, 60, 6)
    stadt.add(szene.add.text(breite + 160, 145, `${emoji} ${name}`, {
      fontFamily: '"Baloo 2", "Segoe UI Emoji", sans-serif', fontSize: '28px', color: '#304f43',
    }).setOrigin(0.5, 0))
    const eingang = szene.add.zone(breite + 160, 205, 320, 170).setInteractive()
    eingang.on('pointerup', () => betreteLaden(name))
    stadt.add(eingang)
  }
  zeichnung.fillStyle(0xb8c9be)
  zeichnung.fillEllipse(640, 465, 200, 125)
  zeichnung.fillStyle(0x58bfd5)
  zeichnung.fillEllipse(640, 457, 172, 100)
  zeichnung.fillStyle(0xffffff)
  zeichnung.fillEllipse(640, 449, 50, 28)
  zeichnung.fillStyle(0x86d7e6)
  zeichnung.fillRoundedRect(632, 375, 16, 80, 6)
  for (const [emoji, breite, hoehe] of [['🌳', 60, 380], ['🌳', 1220, 380], ['🌷', 90, 710], ['🌷', 1190, 710], ['🪑', 340, 480], ['🪑', 940, 480]]) {
    stadt.add(szene.add.text(breite, hoehe, emoji, {
      fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif', fontSize: '64px',
    }).setOrigin(0.5, 1))
  }
  return stadt
}

export function baueLaden(szene, name) {
  const innenraum = szene.add.container(0, 0).setDepth(-1)
  const bild = szene.add.graphics()
  innenraum.add(bild)
  const wandfarbe = name === 'Laden' ? 0xf4db68 : name === 'Café' ? 0xeda5bb : 0x8fc8ed
  bild.fillStyle(0xfafaf5)
  bild.fillRect(0, 0, 1280, 800)
  bild.fillStyle(wandfarbe)
  bild.fillRect(70, 90, 1140, 220)
  bild.fillStyle(0xdce5df)
  bild.fillRect(70, 310, 1140, 440)
  bild.lineStyle(2, 0xb8c9be)
  for (let hoehe = 350; hoehe < 750; hoehe += 50) bild.lineBetween(70, hoehe, 1210, hoehe)
  innenraum.add(szene.add.text(640, 150, name, {
    fontFamily: '"Baloo 2", sans-serif', fontSize: '38px', color: '#304f43',
  }).setOrigin(0.5))
  const ausstattung = name === 'Laden'
    ? [['🍎', 180, 255], ['🍌', 290, 255], ['🥕', 400, 255], ['🥖', 880, 255], ['🧃', 990, 255], ['🧺', 1100, 255], ['🛒', 210, 500], ['🛍️', 1000, 530]]
    : name === 'Café'
      ? [['🍰', 180, 255], ['🧁', 290, 255], ['☕', 950, 255], ['🍪', 1060, 255], ['🪑', 250, 520], ['🪑', 1000, 520], ['🌷', 640, 380]]
      : [['🧸', 200, 255], ['🎮', 330, 255], ['🎨', 940, 255], ['🧩', 1080, 255], ['🎲', 260, 500], ['🎯', 1000, 500], ['⚽', 800, 650]]
  bild.fillStyle(0xffffff)
  bild.fillRoundedRect(110, 275, 360, 40, 6)
  bild.fillRoundedRect(810, 275, 360, 40, 6)
  for (const [emoji, breite, hoehe] of ausstattung) {
    innenraum.add(szene.add.text(breite, hoehe, emoji, {
      fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif', fontSize: '70px',
    }).setOrigin(0.5))
  }
  return innenraum
}

export function verbindeStadt(figur, raum, zeigeSpieler, zeigeStatus, empfangeChat = () => {}, empfangePost = () => {}) {
  let verbindung
  let bereit = false
  let beendet = false
  let eigeneId
  let abbrechen
  let letzteBewegung = 0
  let letzteNachricht = -Infinity
  const fertig = new Promise((resolve, reject) => {
    abbrechen = reject
    try {
      const adresse = import.meta.env.VITE_ONLINE_URL || `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/minimini-online`
      verbindung = new WebSocket(adresse)
    } catch {
      reject(new Error('Die Online-Verbindung konnte nicht starten.'))
      return
    }
    verbindung.addEventListener('open', () => {
      let konto
      try {
        konto = localStorage.getItem('minimini-konto')
        if (!/^[a-f0-9]{32}$/.test(konto || '')) {
          konto = Array.from(crypto.getRandomValues(new Uint8Array(16)), zahl => zahl.toString(16).padStart(2, '0')).join('')
          localStorage.setItem('minimini-konto', konto)
        }
      } catch {
        reject(new Error('Deine Post kann gerade nicht gespeichert werden.'))
        verbindung.close()
        return
      }
      verbindung.send(JSON.stringify({ typ: 'beitreten', raum, figur, konto }))
    })
    verbindung.addEventListener('message', ereignis => {
      let daten
      try { daten = JSON.parse(ereignis.data) } catch { return }
      if (daten.typ === 'willkommen') {
        eigeneId = daten.id
        bereit = true
        if (daten.wirtschaft) empfangePost({ typ: 'wirtschaft', daten: daten.wirtschaft })
        if (daten.besuche) empfangePost({ typ: 'besuche', daten: daten.besuche })
        resolve()
      }
      if ((daten.typ === 'willkommen' || daten.typ === 'spieler') && Array.isArray(daten.spieler)) {
        zeigeSpieler(daten.spieler, eigeneId)
      }
      if (daten.typ === 'chat' && typeof daten.nachricht?.text === 'string' && typeof daten.nachricht?.name === 'string') {
        empfangeChat(daten.nachricht)
      }
      if (['wirtschaft', 'brief-status', 'handel-status', 'angebot', 'angebot-ende', 'tauchstart', 'tauchfund', 'besuche', 'besuch-status', 'freund-anfrage', 'stand'].includes(daten.typ)) empfangePost(daten)
    })
    verbindung.addEventListener('error', () => {
      if (!bereit) reject(new Error('Die Stadt ist gerade nicht erreichbar.'))
    })
    verbindung.addEventListener('close', () => {
      if (!bereit) reject(new Error('Keine Verbindung zur Stadt. Bitte versuche es später noch einmal.'))
      if (!beendet && bereit) zeigeStatus('Verbindung unterbrochen. Du kannst nach Hause zurückkehren.')
    })
  })
  const zeitlimit = setTimeout(() => {
    if (!bereit) {
      abbrechen(new Error('Die Stadt antwortet gerade nicht.'))
      verbindung?.close()
    }
  }, 8000)
  fertig.then(() => clearTimeout(zeitlimit), () => clearTimeout(zeitlimit))
  return {
    fertig,
    istVerbunden() { return bereit && verbindung?.readyState === WebSocket.OPEN },
    sendeHandel(nachricht) {
      if (!bereit || verbindung?.readyState !== WebSocket.OPEN) return false
      verbindung.send(JSON.stringify(nachricht))
      return true
    },
    sendeBrief(empfaenger, text) {
      if (!bereit || verbindung?.readyState !== WebSocket.OPEN) return false
      if (!text.trim() || text.length > 160 || /[\u0000-\u001f\u007f]/.test(text)) return false
      verbindung.send(JSON.stringify({ typ: 'brief', empfaenger, text: text.trim() }))
      return true
    },
    sendeChat(text) {
      const jetzt = performance.now()
      if (!bereit || verbindung?.readyState !== WebSocket.OPEN || jetzt - letzteNachricht < 1100) return false
      if (!text.trim() || text.length > 160 || /[\u0000-\u001f\u007f]/.test(text)) return false
      letzteNachricht = jetzt
      verbindung.send(JSON.stringify({ typ: 'chat', text: text.trim() }))
      return true
    },
    wechsleOrt(ort, breite, hoehe) {
      if (!bereit || verbindung.readyState !== WebSocket.OPEN) return
      verbindung.send(JSON.stringify({ typ: 'ort', ort, x: breite, y: hoehe }))
    },
    bewege(breite, hoehe) {
      const jetzt = performance.now()
      if (!bereit || verbindung.readyState !== WebSocket.OPEN || jetzt - letzteBewegung < 110) return
      letzteBewegung = jetzt
      verbindung.send(JSON.stringify({ typ: 'bewegung', x: breite, y: hoehe }))
    },
    beenden() {
      beendet = true
      clearTimeout(zeitlimit)
      abbrechen(new Error('Stadtfahrt abgebrochen.'))
      verbindung?.close()
    },
  }
}