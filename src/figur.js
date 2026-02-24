// =============================================================
// 🧑 FIGUR MALEN – Diese Funktion wird überall benutzt!
// So sieht die Figur in der Vorschau UND im Spiel gleich aus! ✨
// =============================================================

// 💇 Haare malen – für alle Frisuren!
export function maleHaare(scene, container, daten, s) {
  const farbe = daten.haarfarbe

  if (daten.haarStil === 0) {
    // Kurze Haare
    const haare = scene.add.circle(0, -28 * s, 19 * s, farbe)
    container.add(haare)
    const pony = scene.add.rectangle(0, -38 * s, 30 * s, 8 * s, farbe)
    container.add(pony)
  } else if (daten.haarStil === 1) {
    // Lange Haare
    const haareOben = scene.add.circle(0, -28 * s, 20 * s, farbe)
    container.add(haareOben)
    const straehneL = scene.add.rectangle(-14 * s, -6 * s, 10 * s, 35 * s, farbe)
    const straehneR = scene.add.rectangle(14 * s, -6 * s, 10 * s, 35 * s, farbe)
    container.add(straehneL)
    container.add(straehneR)
    const pony = scene.add.rectangle(0, -38 * s, 32 * s, 8 * s, farbe)
    container.add(pony)
  } else {
    // Zöpfe
    const haareOben = scene.add.circle(0, -30 * s, 19 * s, farbe)
    container.add(haareOben)
    const pony = scene.add.rectangle(0, -38 * s, 30 * s, 8 * s, farbe)
    container.add(pony)
    // Zopf links
    const zopfL1 = scene.add.rectangle(-18 * s, -16 * s, 6 * s, 25 * s, farbe)
    const zopfL2 = scene.add.circle(-18 * s, -2 * s, 4 * s, farbe)
    const gummiL = scene.add.circle(-18 * s, -4 * s, 3 * s, 0xE91E63)
    container.add(zopfL1)
    container.add(zopfL2)
    container.add(gummiL)
    // Zopf rechts
    const zopfR1 = scene.add.rectangle(18 * s, -16 * s, 6 * s, 25 * s, farbe)
    const zopfR2 = scene.add.circle(18 * s, -2 * s, 4 * s, farbe)
    const gummiR = scene.add.circle(18 * s, -4 * s, 3 * s, 0xE91E63)
    container.add(zopfR1)
    container.add(zopfR2)
    container.add(gummiR)
  }
}

export function maleFigur(scene, container, daten, s) {
  const d = daten

  // 🎨 Körper mit Graphics (alles schön rund!)
  const koerper = scene.add.graphics()

  // 💪 Arme HINTER dem Körper (runde Würstchen, starten am Körper)
  koerper.fillStyle(d.hautfarbe)
  koerper.fillRoundedRect(-16 * s, -6 * s, 7 * s, 22 * s, 3.5 * s)  // links
  koerper.fillRoundedRect(9 * s, -6 * s, 7 * s, 22 * s, 3.5 * s)   // rechts

  // ✊ Kugelhändchen (direkt am Arm dran)
  koerper.fillCircle(-12.5 * s, 18 * s, 5 * s)
  koerper.fillCircle(12.5 * s, 18 * s, 5 * s)

  // 🦵 Beine (starten direkt am Körper, keine Lücke)
  koerper.fillStyle(d.hosenFarbe || 0x37474F)
  koerper.fillRoundedRect(-9 * s, 12 * s, 8 * s, 20 * s, 4 * s)  // links
  koerper.fillRoundedRect(1 * s, 12 * s, 8 * s, 20 * s, 4 * s)   // rechts

  // 👟 Schuhe (direkt am Bein dran)
  koerper.fillStyle(d.schuhFarbe || 0x424242)
  koerper.fillCircle(-5 * s, 33 * s, 5 * s)
  koerper.fillCircle(5 * s, 33 * s, 5 * s)

  container.add(koerper)

  // 👕 Kleidung (überlappt Arme und Beine leicht)
  const kleidung = scene.add.graphics()
  if (d.kleidungTyp === 1) {
    // Kleid (runder Körper + Glockenrock)
    kleidung.fillStyle(d.kleidungFarbe)
    kleidung.fillRoundedRect(-13 * s, -12 * s, 26 * s, 22 * s, 8 * s)
    kleidung.fillEllipse(0, 16 * s, 28 * s, 20 * s)
  } else if (d.kleidungTyp === 2) {
    // Hoodie (runder, gemütlicher Körper)
    kleidung.fillStyle(d.kleidungFarbe)
    kleidung.fillRoundedRect(-14 * s, -14 * s, 28 * s, 32 * s, 10 * s)
    // Kapuzen-Kragen
    kleidung.fillEllipse(0, -14 * s, 16 * s, 8 * s)
    // Tasche
    const taschenFarbe = d.kleidungFarbe - 0x111111
    kleidung.fillStyle(taschenFarbe > 0 ? taschenFarbe : 0x333333)
    kleidung.fillRoundedRect(-8 * s, 6 * s, 16 * s, 8 * s, 3 * s)
  } else {
    // T-Shirt (runder Körper)
    kleidung.fillStyle(d.kleidungFarbe)
    kleidung.fillRoundedRect(-13 * s, -12 * s, 26 * s, 28 * s, 10 * s)
  }
  container.add(kleidung)

  // 💇 Haare – HINTER dem Kopf malen!
  maleHaare(scene, container, d, s)

  // 🧑 Kopf (schön rund, Animal-Crossing-Stil = großer Kopf!)
  const kopf = scene.add.circle(0, -22 * s, 18 * s, d.hautfarbe)
  container.add(kopf)

  // 👀 Augen (große süße Augen wie bei AC)
  const augeL = scene.add.circle(-6 * s, -24 * s, 4 * s, 0x000000)
  const augeR = scene.add.circle(6 * s, -24 * s, 4 * s, 0x000000)
  container.add(augeL)
  container.add(augeR)
  // Glanzpunkte in den Augen ✨
  const glanzL = scene.add.circle(-4 * s, -26 * s, 1.5 * s, 0xFFFFFF)
  const glanzR = scene.add.circle(8 * s, -26 * s, 1.5 * s, 0xFFFFFF)
  container.add(glanzL)
  container.add(glanzR)

  // 😊 Lächeln!
  const laecheln = scene.add.graphics()
  laecheln.lineStyle(2 * s, 0xE57373)
  laecheln.beginPath()
  laecheln.arc(0, -20 * s, 7 * s, 0.3, Math.PI - 0.3, false)
  laecheln.strokePath()
  container.add(laecheln)

  // 🥺 Rote Bäckchen (wie bei Animal Crossing!)
  const baeckchenL = scene.add.circle(-12 * s, -18 * s, 4 * s, 0xFFCDD2).setAlpha(0.6)
  const baeckchenR = scene.add.circle(12 * s, -18 * s, 4 * s, 0xFFCDD2).setAlpha(0.6)
  container.add(baeckchenL)
  container.add(baeckchenR)
}
