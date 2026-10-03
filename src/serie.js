import { createElement, Play, Pause, RotateCcw, X, Volume2, VolumeX } from 'lucide'

const ABSCHNITTE = [
  ['Anna feiert eine Teeparty mit ihrem Teddy.', 'Sie schenkt ihrem Teddy vorsichtig Tee ein.', 'Aus der Teekanne steigt warmer Dampf.', 'Anna schaut in die Teekanne. Dort funkelt etwas!'],
  ['In der Teekanne liegt ein Diamant.', 'Anna streckt ihre Hand nach dem Diamanten aus.', 'Sie berührt ihn. Plötzlich wird sie immer kleiner!', 'Anna ist jetzt so klein wie eine Ameise.'],
  ['Der Tisch und die Stühle sind jetzt riesengroß.', 'Große Schuhe bewegen sich durch das Zimmer.', 'Anna passt auf, damit niemand auf sie tritt.', 'Sie wartet und geht vorsichtig an den Schuhen vorbei.'],
  ['Die winzige Anna geht ins Badezimmer.', 'Sie läuft über die weiß-türkisen Fliesen.', 'Waschbecken und Badewanne ragen hoch über ihr auf.', 'Dort liegt ein zweiter, goldener Diamant!'],
  ['Anna geht zu dem zweiten Diamanten.', 'Sie berührt den goldenen Diamanten.', 'Anna wächst und wächst.', 'Jetzt ist Anna wieder normal groß.'],
  ['Anna ist wieder so groß wie vor der Teeparty.', 'Sie kehrt zu ihrem Teddy zurück.', 'Anna und ihr Teddy sitzen wieder am Teetisch.', 'Ende. Anna und der Zauberdiamant.'],
]

export const SERIEN_FOLGEN = [{ titel: 'Anna und der Zauberdiamant', dauer: 120, texte: ABSCHNITTE.map((texte) => texte[0]) }]
export function serienZeit(folge, zeit) {
  const begrenzt = Math.max(0, Math.min(SERIEN_FOLGEN[folge].dauer, Number.isNaN(zeit) ? 0 : zeit))
  const szene = Math.min(5, Math.floor(begrenzt / 20))
  return { zeit: begrenzt, szene, anteil: (begrenzt - szene * 20) / 20 }
}
export function serienText(folge, zeit) {
  const { szene, anteil } = serienZeit(folge, zeit)
  return ABSCHNITTE[szene][Math.min(3, Math.floor(anteil * 4))]
}

export function starteSerie(zurueck = () => {}) {
  const vorherigerFokus = document.activeElement
  const overlay = document.createElement('section')
  overlay.className = 'minimini-serie'
  overlay.setAttribute('role', 'dialog')
  overlay.setAttribute('aria-modal', 'true')
  overlay.setAttribute('aria-label', 'Anna und die Welt der MiNiMiNis')
  overlay.innerHTML = `<style>
    .minimini-serie{position:fixed;inset:0;width:100%;height:100%;margin:0;padding:0;overflow:hidden;z-index:10000;background:#ceeaf0;color:#fff;font-family:'Trebuchet MS',sans-serif;isolation:isolate;display:flex;flex-direction:column}
    .minimini-serie *{box-sizing:border-box;letter-spacing:0}
    .minimini-serie .serie-bild{position:absolute;inset:0;z-index:0;display:grid;place-items:center;overflow:hidden;pointer-events:none}
    .minimini-serie canvas{display:block;pointer-events:none;position:absolute!important;left:50%!important;top:50%!important;margin:0!important;transform:translate(-50%,-50%)}
    .minimini-serie header,.minimini-serie footer{position:relative;z-index:1}
    .minimini-serie header{display:flex;align-items:center;gap:10px;padding:10px;background:#163c46e8;flex-wrap:wrap;flex-shrink:0}
    .minimini-serie h1{font-size:20px;margin:0;flex:1;min-width:160px}
    .minimini-serie button,.minimini-serie select{min-height:48px;min-width:48px;border:1px solid #ffffff80;border-radius:6px;background:#163c46;color:white;font:inherit;padding:10px;cursor:pointer}
    .minimini-serie svg{width:24px;height:24px;display:block}
    .minimini-serie select{max-width:100%;font-size:14px}
    .minimini-serie :focus-visible{outline:3px solid #ffd763;outline-offset:2px}
    .minimini-serie footer{margin-top:auto;padding:10px max(10px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom));background:#163c46ed;flex-shrink:0}
    .minimini-serie .serie-caption{margin:0 auto 6px;max-width:850px;min-height:48px;text-align:center;display:grid;place-items:center;font-size:19px;line-height:1.35}
    .minimini-serie .serie-controls{display:flex;align-items:center;gap:8px;max-width:960px;margin:auto}
    .minimini-serie input{flex:1;min-width:60px;height:48px;accent-color:#ffd763}
    .minimini-serie time{font-size:14px;white-space:nowrap;font-variant-numeric:tabular-nums}
    @media(max-width:600px){.minimini-serie h1{font-size:16px}.minimini-serie select{order:3;width:100%}.minimini-serie .serie-caption{font-size:16px;min-height:66px}.minimini-serie .serie-controls{flex-wrap:wrap}.minimini-serie input{order:5;flex-basis:100%}.minimini-serie time{margin-left:auto}}
    @media(max-height:450px){.minimini-serie header{padding:2px 8px;flex-wrap:nowrap}.minimini-serie h1{font-size:14px;min-width:0}.minimini-serie select{order:0;width:220px}.minimini-serie footer{padding:2px 8px}.minimini-serie .serie-caption{font-size:14px;min-height:20px;margin:0}.minimini-serie input{order:0;flex-basis:60px}}
  </style><div class="serie-bild"></div><header><h1>Anna und die Welt der MiNiMiNis</h1><select aria-label="Folge auswählen"><option value="0">Anna und der Zauberdiamant</option></select><button data-aktion="schliessen" type="button"></button></header>
  <footer><p class="serie-caption" role="status" aria-live="polite" aria-atomic="true"></p><div class="serie-controls"><button data-aktion="spielen" type="button"></button><button data-aktion="neustart" type="button"></button><button data-aktion="ton" type="button" aria-pressed="true"></button><input type="range" aria-label="Serienfortschritt" min="0" max="120" step="0.1" value="0"><time>0:00 / 2:00</time></div></footer>`
  document.body.append(overlay)
  const knopf = (aktion) => overlay.querySelector(`[data-aktion="${aktion}"]`)
  const symbol = (aktion, icon, titel) => {
    knopf(aktion).replaceChildren(createElement(icon))
    knopf(aktion).title = titel
    knopf(aktion).setAttribute('aria-label', titel)
  }
  let spiel, audio, geschlossen = false, zeit = 0, tonAn = true
  let spielt = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const toene = new Set()
  const stoppen = () => { for (const ton of toene) { try { ton.stop() } catch {} } toene.clear() }
  const aktualisieren = () => {
    overlay.dataset.szene = String(serienZeit(0, zeit).szene)
    overlay.dataset.folge = '0'
    const caption = overlay.querySelector('.serie-caption'), text = serienText(0, zeit)
    if (caption.textContent !== text) caption.textContent = text
    overlay.querySelector('input').value = zeit
    overlay.querySelector('time').textContent = `${Math.floor(zeit / 60)}:${String(Math.floor(zeit % 60)).padStart(2, '0')} / 2:00`
    const titel = spielt ? 'Pause' : 'Abspielen'
    if (knopf('spielen').title !== titel) symbol('spielen', spielt ? Pause : Play, titel)
  }
  const schliessen = () => {
    if (geschlossen) return
    geschlossen = true
    spielt = false
    stoppen()
    document.removeEventListener('keydown', tastatur)
    spiel?.destroy(true)
    if (audio) void audio.close().catch(() => {})
    overlay.remove()
    if (vorherigerFokus?.isConnected) vorherigerFokus.focus()
    zurueck()
  }
  function tastatur(event) {
    if (event.key === 'Escape') { event.preventDefault(); schliessen() }
    if (event.key === 'Tab') {
      const elemente = [...overlay.querySelectorAll('button,select,input')]
      const index = elemente.indexOf(document.activeElement)
      event.preventDefault()
      elemente[(index + (event.shiftKey ? elemente.length - 1 : 1)) % elemente.length].focus()
    }
  }
  symbol('schliessen', X, 'Serie schließen')
  symbol('neustart', RotateCcw, 'Neu starten')
  symbol('ton', Volume2, 'Ton ausschalten')
  aktualisieren()
  knopf('schliessen').onclick = schliessen
  knopf('schliessen').focus()
  document.addEventListener('keydown', tastatur)
  const audioStart = () => {
    if (!tonAn || geschlossen) return
    try {
      const AudioKlasse = window.AudioContext || window.webkitAudioContext
      if (!audio && AudioKlasse) audio = new AudioKlasse()
      if (audio?.state === 'suspended') void audio.resume().catch(() => {})
    } catch {}
  }
  function klang(frequenz, ende, dauer = 0.3, art = 'sine', laut = 0.035) {
    if (!tonAn || !spielt || audio?.state !== 'running') return
    const ton = audio.createOscillator(), pegel = audio.createGain(), jetzt = audio.currentTime
    ton.type = art
    ton.frequency.setValueAtTime(frequenz, jetzt)
    ton.frequency.exponentialRampToValueAtTime(ende, jetzt + dauer)
    pegel.gain.setValueAtTime(0.001, jetzt)
    pegel.gain.linearRampToValueAtTime(laut, jetzt + 0.025)
    pegel.gain.exponentialRampToValueAtTime(0.001, jetzt + dauer)
    ton.connect(pegel); pegel.connect(audio.destination)
    toene.add(ton)
    ton.onended = () => { toene.delete(ton); ton.disconnect(); pegel.disconnect() }
    ton.start(); ton.stop(jetzt + dauer)
  }
  knopf('spielen').onclick = () => {
    if (zeit >= 120) zeit = 0
    spielt = !spielt
    if (spielt) audioStart(); else stoppen()
    aktualisieren()
  }
  knopf('neustart').onclick = () => { stoppen(); zeit = 0; spielt = true; audioStart(); aktualisieren() }
  knopf('ton').onclick = () => {
    tonAn = !tonAn
    symbol('ton', tonAn ? Volume2 : VolumeX, tonAn ? 'Ton ausschalten' : 'Ton einschalten')
    knopf('ton').setAttribute('aria-pressed', String(tonAn))
    if (tonAn) audioStart(); else stoppen()
  }
  overlay.querySelector('input').oninput = (event) => { stoppen(); zeit = Number(event.target.value); if (zeit >= 120) spielt = false; aktualisieren() }
  audioStart()
  void import('phaser').then(({ default: Phaser }) => {
    if (geschlossen) return
    let zeichnen, letzterTon = -1, letzteZeit = -1
    spiel = new Phaser.Game({
      type: Phaser.CANVAS, width: 1280, height: 800, parent: overlay.querySelector('.serie-bild'),
      backgroundColor: '#ceeaf0', banner: false, audio: { noAudio: true },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: {
        create() { zeichnen = filmAufbauen(this); zeichnen(zeit); this.game.canvas.setAttribute('aria-label', 'Animierte 2D-Folge: Anna und der Zauberdiamant'); this.game.canvas.setAttribute('role', 'img') },
        update(laufzeit, delta) {
          if (geschlossen) return
          const vorher = zeit
          if (spielt && !document.hidden) zeit = Math.min(120, zeit + Math.min(delta, 100) / 1000)
          if (zeit === 120) { spielt = false; stoppen() }
          if (zeit !== letzteZeit) { zeichnen?.(zeit); aktualisieren(); letzteZeit = zeit }
          const schlag = Math.floor(zeit * 2)
          if (zeit > vorher && schlag !== letzterTon) {
            letzterTon = schlag
            if ((vorher < 30 && zeit >= 30) || (vorher < 90 && zeit >= 90)) klang(zeit < 60 ? 240 : 1100, zeit < 60 ? 1200 : 220, 2)
            else if (zeit >= 118 && vorher < 118) klang(660, 990, 1.2)
            else if (zeit < 10 && schlag % 4 === 0) klang(1200, 850, 0.12, 'triangle', 0.018)
            else if (zeit >= 40 && zeit < 88 && schlag % 2 === 0) klang(100, 65, 0.12, 'sine', 0.025)
          }
        },
      },
    })
  }).catch(() => {
    if (geschlossen) return
    spielt = false
    aktualisieren()
    overlay.querySelector('.serie-caption').textContent = 'Die Folge konnte nicht geladen werden. Bitte schließe sie und öffne sie erneut.'
  })
  return schliessen
}

function filmAufbauen(szene) {
  const gruppe = (eltern, positionX = 0, positionY = 0) => {
    const neu = szene.add.container(positionX, positionY)
    if (eltern) eltern.add(neu)
    return neu
  }
  const grafik = (eltern) => { const neu = szene.add.graphics(); eltern.add(neu); return neu }
  const rechteck = (bild, farbe, positionX, positionY, breite, hoehe, radius = 0) => {
    bild.fillStyle(farbe); bild.fillRoundedRect(positionX, positionY, breite, hoehe, radius)
  }
  const ellipse = (bild, farbe, positionX, positionY, breite, hoehe) => {
    bild.fillStyle(farbe); bild.fillEllipse(positionX, positionY, breite, hoehe)
  }
  const linie = (bild, farbe, dicke, punkte) => {
    bild.lineStyle(dicke, farbe, 1); bild.beginPath(); bild.moveTo(...punkte[0])
    for (const punkt of punkte.slice(1)) bild.lineTo(...punkt)
    bild.strokePath()
  }
  const diamant = (eltern, farbe) => {
    const neu = gruppe(eltern), bild = grafik(neu)
    bild.fillStyle(farbe); bild.fillPoints([{ x: -18, y: -12 }, { x: 18, y: -12 }, { x: 28, y: 0 }, { x: 0, y: 34 }, { x: -28, y: 0 }], true)
    linie(bild, 0xffffff, 2, [[-18, -12], [0, 0], [18, -12]])
    linie(bild, 0xffffff, 2, [[-28, 0], [28, 0]])
    linie(bild, 0xffffff, 2, [[0, 0], [0, 30]])
    return neu
  }
  function maedchen(eltern) {
    const figur = gruppe(eltern), bild = grafik(figur)
    ellipse(bild, 0x533124, 0, -143, 82, 115)
    rechteck(bild, 0x533124, -43, -161, 24, 104, 12)
    rechteck(bild, 0x533124, 19, -161, 24, 104, 12)
    const beine = [-1, 1].map((seite) => {
      const bein = gruppe(figur, seite * 17, -43), stift = grafik(bein)
      rechteck(stift, 0xf8c6a5, -7, 0, 14, 36, 6)
      ellipse(stift, 0xad315c, 4, 36, 31, 15)
      return bein
    })
    const kleid = grafik(figur)
    rechteck(kleid, 0xed79ac, -28, -119, 56, 64, 15)
    kleid.fillStyle(0xe9649e); kleid.fillTriangle(-25, -90, -46, -39, 46, -39)
    rechteck(kleid, 0xffdd6c, -27, -81, 54, 7, 3)
    const arme = [-1, 1].map((seite) => {
      const arm = gruppe(figur, seite * 30, -108), stift = grafik(arm)
      rechteck(stift, 0xed79ac, -10, -5, 20, 25, 8)
      rechteck(stift, 0xf8c6a5, -6, 12, 12, 39, 6)
      ellipse(stift, 0xf8c6a5, 0, 51, 19, 19)
      return arm
    })
    const kopf = grafik(figur)
    ellipse(kopf, 0xf8c6a5, 0, -148, 67, 73)
    ellipse(kopf, 0x533124, -12, -180, 59, 24)
    ellipse(kopf, 0xf3989d, -23, -140, 13, 8); ellipse(kopf, 0xf3989d, 23, -140, 13, 8)
    linie(kopf, 0x913c56, 3, [[-9, -130], [0, -125], [9, -130]])
    ellipse(kopf, 0xffda66, 31, -173, 17, 14)
    const augen = grafik(figur)
    return { figur, arme, beine, augen }
  }
  const zimmer = gruppe(), bad = gruppe()
  const wand = grafik(zimmer)
  rechteck(wand, 0xf6e5d9, -2000, -1800, 5000, 2400)
  rechteck(wand, 0xc48f6c, -2000, 565, 5000, 1800)
  for (let positionY = 595; positionY < 1300; positionY += 70) linie(wand, 0xa97255, 3, [[-2000, positionY], [3000, positionY]])
  rechteck(wand, 0xffffff, 145, 130, 284, 255, 8)
  rechteck(wand, 0x9cdbeb, 157, 142, 260, 231)
  ellipse(wand, 0xffe68b, 345, 190, 63, 63)
  ellipse(wand, 0xffffff, 220, 220, 85, 25); ellipse(wand, 0xffffff, 302, 274, 98, 27)
  rechteck(wand, 0x71a878, 157, 332, 260, 41)
  rechteck(wand, 0xffffff, 280, 142, 10, 231); rechteck(wand, 0xffffff, 157, 251, 260, 10)
  rechteck(wand, 0xe08c99, 118, 121, 35, 279, 8); rechteck(wand, 0xe08c99, 420, 121, 35, 279, 8)
  rechteck(wand, 0x82aa98, 960, 400, 150, 170, 12)
  rechteck(wand, 0x688e7d, 980, 421, 110, 15, 5)
  ellipse(wand, 0xd1c4ec, 1028, 375, 54, 75); ellipse(wand, 0x53845a, 1035, 318, 82, 60)
  rechteck(wand, 0x684e41, 800, 355, 95, 278, 12)
  rechteck(wand, 0xd8a786, 810, 365, 75, 105, 8)
  rechteck(wand, 0x825b46, 795, 548, 110, 20, 6)
  const stuhl = grafik(zimmer)
  rechteck(stuhl, 0x825b46, 398, 535, 75, 130, 8)
  rechteck(stuhl, 0xd8a786, 405, 543, 61, 54, 6)
  rechteck(stuhl, 0x825b46, 387, 591, 96, 15, 5)
  stuhl.x = 165
  const tisch = grafik(zimmer)
  rechteck(tisch, 0x76523c, 535, 542, 29, 125, 5); rechteck(tisch, 0x76523c, 768, 542, 29, 125, 5)
  ellipse(tisch, 0xdca781, 667, 525, 380, 70)
  ellipse(tisch, 0xf9f5ed, 667, 518, 330, 45)
  for (const positionX of [570, 766]) {
    ellipse(tisch, 0xabcbd1, positionX, 513, 64, 13)
    rechteck(tisch, 0xffffff, positionX - 20, 480, 40, 30, 7)
    ellipse(tisch, 0x9b643e, positionX, 482, 34, 7)
    tisch.lineStyle(5, 0xffffff); tisch.strokeCircle(positionX + 25, 492, 9)
  }
  const teddy = gruppe(zimmer, 845, 538), pelz = grafik(teddy)
  for (const seite of [-1, 1]) {
    ellipse(pelz, 0xaa7449, seite * 29, -107, 31, 32)
    ellipse(pelz, 0xe7bb83, seite * 29, -107, 17, 18)
    ellipse(pelz, 0xaa7449, seite * 35, -44, 28, 50)
    ellipse(pelz, 0xaa7449, seite * 23, -5, 37, 29)
  }
  ellipse(pelz, 0xaa7449, 0, -40, 65, 74); ellipse(pelz, 0xe7bb83, 0, -37, 42, 47)
  ellipse(pelz, 0xaa7449, 0, -90, 70, 65); ellipse(pelz, 0xe7bb83, 0, -80, 39, 29)
  ellipse(pelz, 0x302722, -15, -96, 7, 9); ellipse(pelz, 0x302722, 15, -96, 7, 9)
  ellipse(pelz, 0x302722, 0, -84, 12, 8)
  linie(pelz, 0x302722, 2, [[0, -81], [0, -74], [7, -71]])
  rechteck(pelz, 0xe46a83, -27, -62, 54, 9, 4)
  const kanne = gruppe(zimmer, 670, 490), porzellan = grafik(kanne)
  porzellan.lineStyle(10, 0x83b8c6); porzellan.strokeEllipse(38, -25, 47, 45)
  porzellan.fillStyle(0xb8e2e8); porzellan.fillTriangle(-25, -10, -72, -55, -38, -57)
  ellipse(porzellan, 0xb8e2e8, 0, -24, 78, 63)
  ellipse(porzellan, 0x396674, 0, -54, 43, 10)
  ellipse(porzellan, 0xe5f5f6, -15, -26, 12, 28)
  const deckel = gruppe(kanne), deckelBild = grafik(deckel)
  ellipse(deckelBild, 0x83b8c6, 0, -56, 56, 12); ellipse(deckelBild, 0x83b8c6, 0, -65, 13, 14)
  const ersterDiamant = diamant(kanne, 0x8ce9f4)
  ersterDiamant.setPosition(0, -67).setScale(0.45)
  const tee = grafik(zimmer), dampf = grafik(zimmer), glanz = grafik(zimmer)
  const fliesen = grafik(bad)
  rechteck(fliesen, 0xf4fcfc, -2000, -1800, 5000, 2450)
  for (let positionY = 100; positionY < 565; positionY += 78) {
    for (let positionX = 0; positionX < 1400; positionX += 100) {
      rechteck(fliesen, (positionX / 100 + Math.floor(positionY / 78)) % 2 ? 0xdaf1ef : 0xffffff, positionX, positionY, 97, 75)
    }
  }
  rechteck(fliesen, 0x82c9c9, -2000, 565, 5000, 1600)
  for (let positionY = 565; positionY < 1600; positionY += 80) {
    for (let positionX = -500; positionX < 1800; positionX += 110) {
      rechteck(fliesen, (positionX / 110 + positionY / 80) % 2 > 1 ? 0xdff6f2 : 0xfaffff, positionX + 3, positionY + 3, 104, 74)
    }
  }
  const moebel = grafik(bad)
  rechteck(moebel, 0x76adb5, 153, 152, 235, 160, 8)
  rechteck(moebel, 0xc7ebee, 166, 164, 209, 136, 4)
  ellipse(moebel, 0xffffff, 210, 204, 54, 75)
  rechteck(moebel, 0xe2f0f1, 210, 404, 120, 193, 15)
  ellipse(moebel, 0x9ebfc8, 270, 390, 274, 66)
  ellipse(moebel, 0xffffff, 270, 380, 265, 55)
  ellipse(moebel, 0xb9d9df, 270, 379, 184, 28)
  linie(moebel, 0x799ba6, 14, [[285, 364], [285, 332], [260, 332], [260, 347]])
  rechteck(moebel, 0x92c8ce, 785, 401, 365, 183, 30)
  rechteck(moebel, 0xffffff, 795, 390, 345, 178, 28)
  ellipse(moebel, 0x72c8d7, 967, 405, 320, 57)
  linie(moebel, 0x799ba6, 13, [[1080, 393], [1080, 344], [1050, 344], [1050, 361]])
  rechteck(moebel, 0xeeb0bc, 460, 330, 110, 160, 8)
  linie(moebel, 0x799ba6, 10, [[439, 327], [586, 327]])
  const zweiterDiamant = diamant(bad, 0xffcc45)
  zweiterDiamant.setPosition(697, 643).setScale(0.22)
  const anna = maedchen(zimmer)
  const schuhe = [0, 1].map(() => {
    const schuh = gruppe(zimmer), stift = grafik(schuh)
    rechteck(stift, 0x687a85, -25, -420, 52, 382, 9)
    rechteck(stift, 0x283b48, -40, -67, 125, 64, 23)
    rechteck(stift, 0x142a35, -41, -13, 128, 13, 5)
    linie(stift, 0xedf2ee, 4, [[0, -52], [22, -45], [2, -38], [25, -30]])
    return schuh
  })
  const ende = szene.add.text(640, 270, 'Ende', { fontFamily: 'Trebuchet MS', fontSize: '54px', color: '#884565', stroke: '#ffffff', strokeThickness: 6 }).setOrigin(0.5)
  const kamera = szene.cameras.main
  const sanft = (wert) => { const begrenzt = Math.max(0, Math.min(1, wert)); return begrenzt * begrenzt * (3 - 2 * begrenzt) }
  return (zeit) => {
    const { szene: nummer, anteil } = serienZeit(0, zeit)
    const sekunden = anteil * 20
    zimmer.setVisible(nummer < 3 || nummer === 5); bad.setVisible(nummer === 3 || nummer === 4)
    ;(nummer === 3 || nummer === 4 ? bad : zimmer).add(anna.figur)
    ende.setVisible(nummer === 5 && sekunden > 15)
    let positionX = 600, positionY = 630, groesse = 1, zoom = 1, mitteX = 640, mitteY = 400
    let gehen = false, beruehren = false
    if (nummer === 1) {
      beruehren = sekunden >= 5 && sekunden < 12
      groesse = Math.exp(Math.log(0.14) * sanft((sekunden - 10) / 6))
      positionX = 600 + 40 * sanft(sekunden / 9)
      zoom = 1 + 1.6 * sanft((sekunden - 14) / 6)
      mitteX = 640 + (positionX - 640) * sanft((sekunden - 14) / 6)
      mitteY = 400 + 192 * sanft((sekunden - 14) / 6)
    } else if (nummer === 2) {
      groesse = 0.14; zoom = 2.6; mitteY = 592
      const flucht = sanft((sekunden - 2) / 16)
      positionX = 640 + 380 * flucht
      positionY = 630 - (sekunden > 2 && sekunden < 18 ? Math.abs(Math.sin(sekunden * 12)) * 3 : 0)
      mitteX = positionX + 20
      gehen = sekunden > 2 && sekunden < 18
    } else if (nummer === 3) {
      groesse = 0.14; zoom = 2.6; mitteY = 592
      positionX = 380 + 300 * sanft(sekunden / 19); mitteX = positionX; gehen = true
    } else if (nummer === 4) {
      positionX = 680 + 14 * sanft(sekunden / 5); positionY = 650
      groesse = Math.exp(Math.log(0.14) * (1 - sanft((sekunden - 10) / 6)))
      zoom = 2.6 - 1.6 * sanft((sekunden - 10) / 6)
      mitteX = 690 - 50 * sanft((sekunden - 10) / 6); mitteY = 592 - 192 * sanft((sekunden - 10) / 6)
      beruehren = sekunden >= 5 && sekunden < 12; gehen = sekunden < 5
    } else if (nummer === 5) { positionX = 1060 - 460 * sanft(sekunden / 9); positionY = 630 - 40 * sanft((sekunden - 9) / 3); gehen = sekunden < 9 }
    if (nummer === 0) positionY = 590
    anna.figur.setPosition(positionX, positionY).setScale(groesse)
    const rennt = nummer === 2 && gehen
    anna.beine.forEach((bein, index) => bein.setRotation(gehen ? Math.sin(zeit * (rennt ? 16 : 9) + index * Math.PI) * (rennt ? 0.75 : 0.35) : 0))
    if (nummer === 0 || (nummer === 5 && sekunden >= 12)) anna.beine.forEach((bein) => bein.setRotation(-0.85))
    anna.arme[0].setRotation(gehen ? Math.sin(zeit * 9) * 0.2 : 0.12)
    anna.arme[1].setRotation(beruehren ? -1.9 : nummer === 0 && sekunden < 10 ? -1.3 : nummer === 5 && sekunden > 15 ? -2.4 + Math.sin(zeit * 5) * 0.2 : -0.12)
    anna.arme[1].setScale(1)
    anna.figur.setRotation(rennt ? 0.15 : 0)
    if (rennt) {
      anna.arme[0].setRotation(Math.sin(zeit * 16) * 0.65)
      anna.arme[1].setRotation(-Math.sin(zeit * 16) * 0.65)
    }
    if (nummer === 1 && sekunden >= 5 && sekunden <= 10) anna.arme[1].setRotation(-Math.PI).setScale(1, 1.65)
    anna.augen.clear()
    for (const seite of [-1, 1]) {
      if (zeit % 4 < 0.18 || (nummer === 1 && sekunden > 10 && sekunden < 12)) linie(anna.augen, 0x3d2a26, 3, [[seite * 13 - 5, -154], [seite * 13, -152], [seite * 13 + 5, -154]])
      else { ellipse(anna.augen, 0xffffff, seite * 13, -155, 13, 17); ellipse(anna.augen, 0x3d2a26, seite * 13 + 2, -154, 7, 10) }
    }
    kamera.setZoom(zoom).setScroll(mitteX - 640, mitteY - 400)
    schuhe.forEach((schuh, index) => {
      schuh.setVisible(nummer === 2)
      const schritt = Math.max(0, Math.floor((sekunden - index * 0.7) / 1.4))
      const fussX = Math.min(positionX - 80 - index * 120, 475 + schritt * 32 - index * 120)
      schuh.setPosition(fussX, 654 - Math.max(0, Math.sin(sekunden * 4.4 + index * Math.PI)) * 65)
    })
    kanne.setPosition(nummer === 0 ? 655 : 670, nummer === 0 ? 454 : 490)
    kanne.setRotation(nummer === 0 ? -0.48 * Math.sin(Math.PI * sanft(sekunden / 10)) : 0)
    if (nummer === 0 && sekunden < 10) {
      const handX = kanne.x + Math.cos(kanne.rotation) * 45 + Math.sin(kanne.rotation) * 25
      const handY = kanne.y + Math.sin(kanne.rotation) * 45 - Math.cos(kanne.rotation) * 25
      const armX = handX - positionX - 30, armY = handY - positionY + 108
      anna.arme[1].setRotation(Math.atan2(-armX, armY)).setScale(1, Math.hypot(armX, armY) / 51)
    }
    deckel.setPosition(nummer === 1 ? 58 * sanft(sekunden / 5) : 0, nummer === 1 ? -45 * sanft(sekunden / 5) : 0)
    ersterDiamant.setVisible(nummer === 1 && sekunden < 16)
    tee.clear(); dampf.clear(); glanz.clear()
    if (nummer === 0 && sekunden > 1 && sekunden < 9) {
      const ausgussX = kanne.x - 64 * Math.cos(kanne.rotation) + 55 * Math.sin(kanne.rotation)
      const ausgussY = kanne.y - 64 * Math.sin(kanne.rotation) - 55 * Math.cos(kanne.rotation)
      linie(tee, 0xbb8550, 4, [[ausgussX, ausgussY], [570, 480]])
    }
    for (let index = 0; index < 3; index++) {
      const phase = (zeit * 14 + index * 18) % 65
      dampf.lineStyle(3, 0xffffff, (1 - phase / 65) * 0.7)
      dampf.beginPath(); dampf.moveTo(668 + Math.sin(zeit + index) * 7, 420 - phase)
      dampf.lineTo(673 + Math.sin(zeit + index + 1) * 8, 400 - phase); dampf.strokePath()
    }
    const magie = (nummer === 1 && sekunden >= 5 && sekunden < 17) || (nummer === 4 && sekunden >= 5 && sekunden < 17)
    if (magie) {
      const eltern = nummer === 4 ? bad : zimmer
      eltern.add(glanz)
      for (let index = 0; index < 12; index++) {
        const winkel = index * Math.PI / 6 + zeit, radius = 18 + (sekunden * 9 + index * 11) % 55
        const sternX = positionX + Math.cos(winkel) * radius * Math.max(0.25, groesse)
        const sternY = positionY - 95 * groesse + Math.sin(winkel) * radius * Math.max(0.25, groesse)
        linie(glanz, 0xffdc67, 2 / zoom, [[sternX - 4, sternY], [sternX + 4, sternY]])
        linie(glanz, 0xffffff, 2 / zoom, [[sternX, sternY - 4], [sternX, sternY + 4]])
      }
    }
    zweiterDiamant.setAlpha(nummer === 4 && sekunden > 10 ? 0.65 : 1)
  }
}