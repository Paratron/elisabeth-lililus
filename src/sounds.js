// =============================================================
// 🔊 GERÄUSCHE – Wir erzeugen Töne direkt im Computer! 🎵
// Keine Sound-Dateien nötig – der Computer macht die Töne selbst!
// =============================================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

// 🎵 Einen Ton spielen (wie eine Note auf dem Klavier!)
export function spieleTon(frequenz, dauer, lautstaerke = 0.15, typ = 'square') {
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = typ // 'sine' = weich, 'square' = retro, 'sawtooth' = scharf
  osc.frequency.value = frequenz // Höhe des Tons (Hz)
  gain.gain.value = lautstaerke
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dauer)
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.start()
  osc.stop(audioCtx.currentTime + dauer)
}

// 🪓 Holz hacken – "Tschack!"
export function soundHolzHacken() {
  spieleTon(200, 0.1, 0.2, 'sawtooth')
  setTimeout(() => spieleTon(150, 0.15, 0.15, 'square'), 50)
}

// ⛏️ Stein klopfen – "Klonk!"
export function soundSteinKlopfen() {
  spieleTon(400, 0.08, 0.2, 'square')
  setTimeout(() => spieleTon(300, 0.1, 0.15, 'square'), 40)
  setTimeout(() => spieleTon(200, 0.12, 0.1, 'sine'), 80)
}

// ✨ Material einsammeln – "Pling!"
export function soundEinsammeln() {
  spieleTon(600, 0.1, 0.12, 'sine')
  setTimeout(() => spieleTon(900, 0.15, 0.1, 'sine'), 80)
}

// 🏠 Haus gebaut – "Tada!" 🎉
export function soundHausGebaut() {
  spieleTon(523, 0.2, 0.15, 'square')  // C
  setTimeout(() => spieleTon(659, 0.2, 0.15, 'square'), 150)  // E
  setTimeout(() => spieleTon(784, 0.2, 0.15, 'square'), 300)  // G
  setTimeout(() => spieleTon(1047, 0.4, 0.2, 'square'), 450) // C hoch!
}

// 🚪 Tür öffnen – "Knarr!"
export function soundTuer() {
  spieleTon(120, 0.2, 0.1, 'sawtooth')
  setTimeout(() => spieleTon(100, 0.3, 0.08, 'sawtooth'), 100)
}

// ⛏️ Mine betreten – "Grusel-Echo"
export function soundMine() {
  spieleTon(100, 0.4, 0.1, 'sine')
  setTimeout(() => spieleTon(80, 0.5, 0.08, 'sine'), 200)
  setTimeout(() => spieleTon(60, 0.6, 0.05, 'sine'), 400)
}

// 🌳 Baum fällt – "Timber!"
export function soundBaumFaellt() {
  spieleTon(180, 0.15, 0.2, 'sawtooth')
  setTimeout(() => spieleTon(120, 0.25, 0.15, 'sawtooth'), 100)
  setTimeout(() => spieleTon(80, 0.4, 0.12, 'sawtooth'), 250)
}

// 🪨 Stein zerbricht – "Krach!"
export function soundSteinZerbricht() {
  // Weißes Rauschen für Krach-Effekt
  spieleTon(300, 0.05, 0.2, 'square')
  spieleTon(250, 0.05, 0.2, 'sawtooth')
  setTimeout(() => spieleTon(150, 0.1, 0.15, 'square'), 50)
  setTimeout(() => spieleTon(100, 0.15, 0.1, 'sawtooth'), 100)
}

// 🎉 Konfetti / Jubel – "Jippie!"
export function soundKonfetti() {
  const noten = [523, 587, 659, 784, 880, 1047]
  noten.forEach((note, i) => {
    setTimeout(() => spieleTon(note, 0.15, 0.1, 'sine'), i * 60)
  })
}

// 🆘 Hilferuf – "Hilfe!"
export function soundHilferuf() {
  spieleTon(800, 0.3, 0.12, 'sine')
  setTimeout(() => spieleTon(600, 0.3, 0.12, 'sine'), 350)
  setTimeout(() => spieleTon(800, 0.3, 0.12, 'sine'), 700)
}

// 🎉 Person befreit – "Juhu!"
export function soundBefreit() {
  spieleTon(440, 0.15, 0.12, 'sine')
  setTimeout(() => spieleTon(554, 0.15, 0.12, 'sine'), 150)
  setTimeout(() => spieleTon(659, 0.15, 0.12, 'sine'), 300)
  setTimeout(() => spieleTon(880, 0.3, 0.18, 'sine'), 450)
}

// 🔨 Werkzeug wechseln – "Klick!"
export function soundKlick() {
  spieleTon(500, 0.05, 0.08, 'square')
}

// 🪒 Graben – "Schüpp!"
export function soundGraben() {
  spieleTon(150, 0.12, 0.15, 'sawtooth')
  setTimeout(() => spieleTon(200, 0.08, 0.1, 'sine'), 80)
}

// 🎮 Spiel starten – fröhliche Melodie!
export function soundSpielStart() {
  const melodie = [523, 659, 784, 1047, 784, 1047]
  melodie.forEach((note, i) => {
    setTimeout(() => spieleTon(note, 0.2, 0.1, 'square'), i * 120)
  })
}

// 🚶 Schritte – leises Tappen
export function soundSchritt() {
  spieleTon(100 + Math.random() * 50, 0.05, 0.03, 'sine')
}

// 🐕 Hund bellt – "Wuff wuff!"
export function soundBellen() {
  spieleTon(400, 0.12, 0.15, 'square')
  setTimeout(() => spieleTon(500, 0.1, 0.12, 'square'), 200)
  setTimeout(() => spieleTon(400, 0.12, 0.15, 'square'), 500)
  setTimeout(() => spieleTon(500, 0.1, 0.12, 'square'), 700)
}

// 🚁 Helikopter – "Wop wop wop!"
export function soundHeli() {
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      spieleTon(80, 0.08, 0.12, 'sawtooth')
      spieleTon(120, 0.05, 0.08, 'square')
    }, i * 120)
  }
}

// 🐕 Hund fiept freudig – "Wuuuff!"
export function soundHundFreut() {
  spieleTon(500, 0.15, 0.12, 'sine')
  setTimeout(() => spieleTon(700, 0.15, 0.12, 'sine'), 150)
  setTimeout(() => spieleTon(900, 0.2, 0.15, 'sine'), 300)
  setTimeout(() => spieleTon(1100, 0.3, 0.12, 'sine'), 450)
}
