import Phaser from 'phaser'
import { rucksack, hausDaten, spielSpeichern } from '../state.js'
import { spieleTon, soundKlick } from '../sounds.js'
import { maleFigur } from '../figur.js'

class StadtSzene extends Phaser.Scene {
  constructor() {
    super('StadtSzene')
  }

  create(figurDaten) {
    this.figurDaten = figurDaten

    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🏙️ Himmel (grauer Stadt-Himmel)
    this.cameras.main.setBackgroundColor('#B0BEC5')

    // 🏢 Straße (unten)
    this.add.rectangle(breite / 2, hoehe - 40, breite, 80, 0x616161)
    // Straßen-Streifen
    for (let i = 0; i < breite; i += 80) {
      this.add.rectangle(i + 40, hoehe - 40, 40, 6, 0xFFFFFF).setAlpha(0.6)
    }
    // Bürgersteig
    this.add.rectangle(breite / 2, hoehe - 85, breite, 12, 0x9E9E9E)

    // 🏢 Häuser im Hintergrund
    const hausFarben = [0x5D4037, 0x795548, 0x4E342E, 0x6D4C41, 0x3E2723]
    for (let i = 0; i < 6; i++) {
      const hx = 70 + i * 140
      const hh = Phaser.Math.Between(120, 200)
      const hy = hoehe - 90 - hh / 2
      const farbe = hausFarben[i % hausFarben.length]
      this.add.rectangle(hx, hy, 100, hh, farbe).setDepth(0)
      // Fenster
      for (let fy = 0; fy < 3; fy++) {
        for (let fx = 0; fx < 2; fx++) {
          const fensterX = hx - 18 + fx * 36
          const fensterY = hy - hh / 2 + 30 + fy * 40
          const leuchtet = Math.random() > 0.3
          this.add.rectangle(fensterX, fensterY, 20, 22,
            leuchtet ? 0xFFF9C4 : 0x37474F).setDepth(1)
        }
      }
    }

    // 🍕 PIZZA-LADEN! (links in der Stadt)
    const ladenX = breite * 0.3
    const ladenY = hoehe - 170

    // 🏪 Laden-Gebäude
    this.add.rectangle(ladenX, ladenY, 140, 120, 0xBF360C).setDepth(2)
    this.add.rectangle(ladenX, ladenY - 65, 150, 15, 0xE65100).setDepth(3)

    // 🍕 Schild
    this.add.text(ladenX, ladenY - 62, '🍕 PIZZA MARIO 🍕', {
      fontSize: '13px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(4)

    // 🚪 Tür
    this.add.rectangle(ladenX, ladenY + 30, 35, 50, 0x4E342E).setDepth(3)
    this.add.circle(ladenX + 10, ladenY + 30, 2, 0xFFD700).setDepth(4)

    // 🪟 Schaufenster
    this.add.rectangle(ladenX - 40, ladenY - 10, 40, 35, 0xFFF9C4).setDepth(3)
    this.add.rectangle(ladenX + 40, ladenY - 10, 40, 35, 0xFFF9C4).setDepth(3)

    // 🍕 Pizza im Fenster
    this.add.text(ladenX - 40, ladenY - 10, '🍕', {
      fontSize: '20px'
    }).setOrigin(0.5).setDepth(4)
    this.add.text(ladenX + 40, ladenY - 10, '🍕', {
      fontSize: '20px'
    }).setOrigin(0.5).setDepth(4)

    // 👗 KLEIDUNGSLADEN FÜR MILO! (rechts in der Stadt)
    const modeX = breite * 0.72
    const modeY = hoehe - 170

    // 🏪 Mode-Gebäude (lila/pink!)
    this.add.rectangle(modeX, modeY, 140, 120, 0x7B1FA2).setDepth(2)
    this.add.rectangle(modeX, modeY - 65, 150, 15, 0xAB47BC).setDepth(3)

    // 👗 Schild
    this.add.text(modeX, modeY - 62, '👗 MILOS MODE 👗', {
      fontSize: '13px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(4)

    // 🚪 Tür
    this.add.rectangle(modeX, modeY + 30, 35, 50, 0x4E342E).setDepth(3)
    this.add.circle(modeX + 10, modeY + 30, 2, 0xFFD700).setDepth(4)

    // 🪟 Schaufenster
    this.add.rectangle(modeX - 40, modeY - 10, 40, 35, 0xFCE4EC).setDepth(3)
    this.add.rectangle(modeX + 40, modeY - 10, 40, 35, 0xFCE4EC).setDepth(3)

    // 👕👗 Kleidung im Fenster
    this.add.text(modeX - 40, modeY - 10, '👕', {
      fontSize: '20px'
    }).setOrigin(0.5).setDepth(4)
    this.add.text(modeX + 40, modeY - 10, '👗', {
      fontSize: '20px'
    }).setOrigin(0.5).setDepth(4)

    // 🧑 Spieler auf der Straße
    this.spieler = this.add.container(breite * 0.2, hoehe - 105)
    maleFigur(this, this.spieler, this.figurDaten, 0.75)
    this.spieler.setDepth(50)
    this.physics.add.existing(this.spieler)
    this.spieler.body.setSize(24, 40)
    this.spieler.body.setOffset(-12, -10)

    // 🧡 Milo läuft mit dir durch die Stadt!
    this.erstelleStadtMilo()

    // 🧑‍🤝‍🧑 Freunde in der Stadt! Leute die man kennenlernen kann!
    this.stadtGespraeche = {} // Wie oft hast du mit jemandem geredet?
    this.erstelleStadtFreunde()

    // 🏪 Pizza bestellen – Klick auf den Laden!
    const ladenZone = this.add.rectangle(ladenX, ladenY, 140, 120, 0xffffff, 0)
    ladenZone.setDepth(55).setInteractive({ useHandCursor: true })
    ladenZone.on('pointerdown', () => {
      this.pizzaBestellen()
    })

    // 👗 Kleidung kaufen – Klick auf den Mode-Laden!
    const modeZone = this.add.rectangle(modeX, modeY, 140, 120, 0xffffff, 0)
    modeZone.setDepth(55).setInteractive({ useHandCursor: true })
    modeZone.on('pointerdown', () => {
      this.kleidungKaufen()
    })

    // 🚗 Zurück-Button
    const zurueck = this.add.text(16, 16, '🔙 Nach Hause', {
      fontSize: '16px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#000000', strokeThickness: 3,
      backgroundColor: '#00000088', padding: { x: 12, y: 6 }
    }).setDepth(100)
    zurueck.setInteractive({ useHandCursor: true })
    zurueck.on('pointerdown', () => {
      this.zeigeNachricht('🚗 Du fährst nach Hause!')
      this.time.delayedCall(1000, () => {
        this.scene.start('HausSzene', this.figurDaten)
      })
    })

    // 🎒 Rucksack zeigen (mit Pizza!)
    this.rucksackAnzeige = this.add.text(breite - 16, 16, this.getRucksackText(), {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(1, 0).setDepth(100)

    // 🎵 Stadt-Musik (lustige Töne!)
    const stadtMelodie = [523, 587, 659, 698, 784, 698, 659, 587]
    stadtMelodie.forEach((note, i) => {
      setTimeout(() => spieleTon(note, 0.15, 0.05, 'triangle'), i * 150)
    })

    // 🏙️ Willkommen!
    this.zeigeNachricht('🏙️ Willkommen in der Stadt!')

    // 👆 Touch zum Laufen
    this.zielX = null
    this.input.on('pointerdown', (pointer) => {
      if (pointer.y < 60) return
      this.zielX = Phaser.Math.Clamp(pointer.x, 30, breite - 30)
    })

    // ⌨️ Tastatur
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys('A,D')
  }

  update() {
    const speed = 160
    let vx = 0

    // ⌨️ Tastatur
    if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -speed
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx = speed

    if (vx !== 0) {
      this.spieler.body.setVelocityX(vx)
      this.zielX = null
      return
    }

    // 👆 Touch
    if (this.zielX !== null) {
      const abstand = Math.abs(this.spieler.x - this.zielX)
      if (abstand > 5) {
        this.spieler.body.setVelocityX(this.spieler.x < this.zielX ? speed : -speed)
      } else {
        this.spieler.body.setVelocityX(0)
        this.zielX = null
      }
    } else {
      this.spieler.body.setVelocityX(0)
    }

    // 🧱 Auf der Straße bleiben
    if (this.spieler.x < 30) this.spieler.x = 30
    if (this.spieler.x > this.scale.width - 30) this.spieler.x = this.scale.width - 30

    // 🧡 Milo folgt dir!
    if (this.miloStadt) {
      const abstandMilo = this.spieler.x - this.miloStadt.x
      if (Math.abs(abstandMilo) > 40) {
        // Milo läuft dir hinterher! 🏃
        this.miloStadt.x += abstandMilo * 0.03
      }
      // Milo bleibt auch auf der Straße
      if (this.miloStadt.x < 30) this.miloStadt.x = 30
      if (this.miloStadt.x > this.scale.width - 30) this.miloStadt.x = this.scale.width - 30
    }
  }

  // 🍕 Pizza bestellen!
  pizzaBestellen() {
    soundKlick()

    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🖤 Overlay
    const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.7)
    overlay.setDepth(200).setInteractive()

    // 🍕 Menü
    const titel = this.add.text(breite / 2, hoehe * 0.12, '🍕 Pizza Mario 🍕', {
      fontSize: '28px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(201)

    const koch = this.add.text(breite / 2, hoehe * 0.28, '👨‍🍳 Ciao! Was darf es sein?', {
      fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(201)

    const elemente = [overlay, titel, koch]

    // 🍕 Pizza-Auswahl!
    const pizzen = [
      { name: '🧀 Margherita', preis: 3, emoji: '🍕' },
      { name: '🍄 Funghi', preis: 4, emoji: '🍕' },
      { name: '🌶️ Diavola', preis: 5, emoji: '🍕' },
    ]

    pizzen.forEach((p, i) => {
      const y = hoehe * 0.42 + i * 60
      const genug = rucksack.stein >= p.preis

      const btn = this.add.text(breite / 2, y,
        `${p.name}\n💰 Kostet ${p.preis} Steine`, {
        fontSize: '16px', fontFamily: 'Arial',
        color: genug ? '#ffffff' : '#999999',
        backgroundColor: genug ? '#4CAF50' : '#616161',
        padding: { x: 24, y: 10 },
        align: 'center'
      }).setOrigin(0.5).setDepth(201)

      if (genug) {
        btn.setInteractive({ useHandCursor: true })
        btn.on('pointerdown', () => {
          // 💰 Bezahlen!
          rucksack.stein -= p.preis
          rucksack.pizza += 1
          this.rucksackAnzeige.setText(this.getRucksackText())

          elemente.forEach(el => el.destroy())

          // 🍕 Pizza-Animations!
          const pizzaEmoji = this.add.text(breite / 2, hoehe * 0.4, '🍕', {
            fontSize: '64px'
          }).setOrigin(0.5).setDepth(300)
          this.tweens.add({
            targets: pizzaEmoji,
            scale: 1.5,
            y: hoehe * 0.3,
            duration: 500,
            yoyo: true,
            onComplete: () => pizzaEmoji.destroy()
          })

          // 👨‍🍳 Koch sagt danke!
          this.zeigeNachricht(`🍕 ${p.name} zum Mitnehmen!\n👨‍🍳 Guten Appetit!`)

          // 🎵 Klingel-Sound!
          const klingel = [659, 784, 1047]
          klingel.forEach((note, j) => {
            setTimeout(() => spieleTon(note, 0.15, 0.05, 'sine'), j * 100)
          })

          // 💾 Pizza im Spielstand speichern!
          spielSpeichern('StadtSzene', this.figurDaten, null)
        })
      }

      elemente.push(btn)
    })

    // ❌ Doch nicht
    const schliessen = this.add.text(breite / 2, hoehe * 0.85, '❌ Nein danke!', {
      fontSize: '16px', fontFamily: 'Arial', color: '#FF5252',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(201)
    schliessen.setInteractive({ useHandCursor: true })
    schliessen.on('pointerdown', () => {
      elemente.forEach(el => el.destroy())
    })
    elemente.push(schliessen)
  }

  // 👗 KLEIDUNG FÜR MILO KAUFEN!
  kleidungKaufen() {
    soundKlick()

    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🖤 Overlay
    const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.7)
    overlay.setDepth(200).setInteractive()

    // 👗 Titel
    const titel = this.add.text(breite / 2, hoehe * 0.08, '👗 Milos Mode 👗', {
      fontSize: '26px', fontFamily: 'Arial', color: '#CE93D8',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(201)

    const verkaeufer = this.add.text(breite / 2, hoehe * 0.2, '👩‍🎨 Ciao! Was soll Milo anziehen?', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(201)

    const elemente = [overlay, titel, verkaeufer]

    // 📂 3 Kategorien: Oberteil, Hose, Schuhe
    let seite = 'menu' // menu, oberteil, hose, schuhe

    // 🔝 Hauptmenü
    const kategorien = [
      { label: '👕 Oberteil', key: 'oberteil', emoji: '👕', preis: '2 Eisen' },
      { label: '👖 Hose', key: 'hose', emoji: '👖', preis: '2 Stein' },
      { label: '👟 Schuhe', key: 'schuhe', emoji: '👟', preis: '1 Eisen' }
    ]

    kategorien.forEach((kat, i) => {
      const btn = this.add.text(breite / 2, hoehe * 0.35 + i * 55,
        `${kat.label}\n💰 ${kat.preis}`, {
        fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
        backgroundColor: '#7B1FA2', padding: { x: 20, y: 10 },
        align: 'center'
      }).setOrigin(0.5).setDepth(201)
      btn.setInteractive({ useHandCursor: true })
      btn.on('pointerdown', () => {
        elemente.forEach(el => el.destroy())
        if (kat.key === 'oberteil') this.zeigeOberteile()
        if (kat.key === 'hose') this.zeigeHosen()
        if (kat.key === 'schuhe') this.zeigeSchuhe()
      })
      elemente.push(btn)
    })

    // ❌ Schließen
    const schliessen = this.add.text(breite / 2, hoehe * 0.85, '❌ Nein danke!', {
      fontSize: '16px', fontFamily: 'Arial', color: '#FF5252',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(201)
    schliessen.setInteractive({ useHandCursor: true })
    schliessen.on('pointerdown', () => {
      elemente.forEach(el => el.destroy())
    })
    elemente.push(schliessen)
  }

  // 👕 Oberteile für Milo!
  zeigeOberteile() {
    const breite = this.scale.width
    const hoehe = this.scale.height

    const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.7)
    overlay.setDepth(200).setInteractive()

    const titel = this.add.text(breite / 2, hoehe * 0.08, '👕 Oberteil wählen!', {
      fontSize: '22px', fontFamily: 'Arial', color: '#CE93D8',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(201)

    const elemente = [overlay, titel]
    const kosten = 2 // 2 Eisen
    const genugGeld = rucksack.eisen >= kosten

    // 3 Typen: T-Shirt, Kleid, Hoodie
    const typen = [
      { name: '👕 T-Shirt', typ: 0 },
      { name: '👗 Kleid', typ: 1 },
      { name: '🧥 Hoodie', typ: 2 }
    ]

    // Typ-Auswahl
    const typTexte = this.add.text(breite / 2, hoehe * 0.18, '🔷 Welcher Typ?', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(201)
    elemente.push(typTexte)

    let gewaehlterTyp = hausDaten.miloKleidung.kleidungTyp
    const typButtons = []

    typen.forEach((t, i) => {
      const btn = this.add.text(breite * 0.2 + i * (breite * 0.3), hoehe * 0.28,
        t.name, {
        fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
        backgroundColor: gewaehlterTyp === t.typ ? '#4CAF50' : '#5D4037',
        padding: { x: 10, y: 6 }
      }).setOrigin(0.5).setDepth(201)
      btn.setInteractive({ useHandCursor: true })
      btn.on('pointerdown', () => {
        gewaehlterTyp = t.typ
        soundKlick()
        // ✅ Aktiven Button markieren!
        typButtons.forEach((b, bi) => {
          b.setBackgroundColor(bi === i ? '#4CAF50' : '#5D4037')
        })
      })
      typButtons.push(btn)
      elemente.push(btn)
    })

    // 🎨 Farben!
    const farbTexte = this.add.text(breite / 2, hoehe * 0.4, '🎨 Welche Farbe?', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(201)
    elemente.push(farbTexte)

    const farben = [
      { farbe: 0xFF5252, name: 'Rot' },
      { farbe: 0x2196F3, name: 'Blau' },
      { farbe: 0x4CAF50, name: 'Grün' },
      { farbe: 0xFFEB3B, name: 'Gelb' },
      { farbe: 0xFF7043, name: 'Orange' },
      { farbe: 0xE040FB, name: 'Pink' },
      { farbe: 0x00BCD4, name: 'Türkis' },
      { farbe: 0x9C27B0, name: 'Lila' }
    ]

    let gewaehlteFarbe = hausDaten.miloKleidung.kleidungFarbe
    const oberFarbBtns = []

    farben.forEach((f, i) => {
      const spalte = i % 4
      const zeile = Math.floor(i / 4)
      const fx = breite * 0.2 + spalte * (breite * 0.2)
      const fy = hoehe * 0.5 + zeile * 40

      const farbBtn = this.add.circle(fx, fy, 16, f.farbe).setDepth(201)
      // ✅ Aktive Farbe bekommt goldene Umrandung!
      if (f.farbe === gewaehlteFarbe) {
        farbBtn.setStrokeStyle(4, 0xFFD700)
        farbBtn.setScale(1.15)
      } else {
        farbBtn.setStrokeStyle(2, 0xFFFFFF)
      }
      farbBtn.setInteractive({ useHandCursor: true })
      farbBtn.on('pointerdown', () => {
        gewaehlteFarbe = f.farbe
        soundKlick()
        // 🔄 Alle zurücksetzen, nur der neue aktiv!
        oberFarbBtns.forEach(b => { b.setStrokeStyle(2, 0xFFFFFF); b.setScale(1) })
        farbBtn.setStrokeStyle(4, 0xFFD700)
        farbBtn.setScale(1.15)
      })
      oberFarbBtns.push(farbBtn)
      elemente.push(farbBtn)
    })

    // ✅ Kaufen!
    const kaufBtn = this.add.text(breite / 2, hoehe * 0.75,
      genugGeld ? `✅ Kaufen! (${kosten} ⚙️ Eisen)` : `❌ Zu wenig Eisen! (${kosten} ⚙️)`, {
      fontSize: '16px', fontFamily: 'Arial',
      color: genugGeld ? '#ffffff' : '#999999',
      backgroundColor: genugGeld ? '#4CAF50' : '#616161',
      padding: { x: 16, y: 10 }
    }).setOrigin(0.5).setDepth(201)

    if (genugGeld) {
      kaufBtn.setInteractive({ useHandCursor: true })
      kaufBtn.on('pointerdown', () => {
        rucksack.eisen -= kosten
        hausDaten.miloKleidung.kleidungTyp = gewaehlterTyp
        hausDaten.miloKleidung.kleidungFarbe = gewaehlteFarbe
        this.rucksackAnzeige.setText(this.getRucksackText())
        spielSpeichern('StadtSzene', this.figurDaten, null)
        elemente.forEach(el => el.destroy())
        this.zeigeNachricht('👕 Milo hat neue Kleidung! 🎉')
        // 🎵 Einkauf-Sound!
        const melodie = [523, 659, 784]
        melodie.forEach((n, i) => setTimeout(() => spieleTon(n, 0.15, 0.05, 'sine'), i * 100))
      })
    }
    elemente.push(kaufBtn)

    // 🔙 Zurück
    const zurueck = this.add.text(breite / 2, hoehe * 0.88, '🔙 Zurück', {
      fontSize: '14px', fontFamily: 'Arial', color: '#FF5252',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(201)
    zurueck.setInteractive({ useHandCursor: true })
    zurueck.on('pointerdown', () => {
      elemente.forEach(el => el.destroy())
      this.kleidungKaufen()
    })
    elemente.push(zurueck)
  }

  // 👖 Hosen für Milo!
  zeigeHosen() {
    const breite = this.scale.width
    const hoehe = this.scale.height

    const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.7)
    overlay.setDepth(200).setInteractive()

    const titel = this.add.text(breite / 2, hoehe * 0.1, '👖 Hose wählen!', {
      fontSize: '22px', fontFamily: 'Arial', color: '#CE93D8',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(201)

    const elemente = [overlay, titel]
    const kosten = 2 // 2 Stein
    const genugGeld = rucksack.stein >= kosten

    const farben = [
      { farbe: 0x37474F, name: 'Dunkelgrau' },
      { farbe: 0x1565C0, name: 'Jeans-Blau' },
      { farbe: 0x2E7D32, name: 'Grün' },
      { farbe: 0x5D4037, name: 'Braun' },
      { farbe: 0x000000, name: 'Schwarz' },
      { farbe: 0xE91E63, name: 'Pink' },
      { farbe: 0xFF6F00, name: 'Orange' },
      { farbe: 0x4A148C, name: 'Lila' }
    ]

    let gewaehlteFarbe = hausDaten.miloKleidung.hosenFarbe
    const hosenFarbBtns = []

    const farbText = this.add.text(breite / 2, hoehe * 0.25, '🎨 Welche Farbe?', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(201)
    elemente.push(farbText)

    farben.forEach((f, i) => {
      const spalte = i % 4
      const zeile = Math.floor(i / 4)
      const fx = breite * 0.2 + spalte * (breite * 0.2)
      const fy = hoehe * 0.38 + zeile * 45

      const farbBtn = this.add.circle(fx, fy, 18, f.farbe).setDepth(201)
      // ✅ Aktive Farbe bekommt goldene Umrandung!
      if (f.farbe === gewaehlteFarbe) {
        farbBtn.setStrokeStyle(4, 0xFFD700)
        farbBtn.setScale(1.15)
      } else {
        farbBtn.setStrokeStyle(2, 0xFFFFFF)
      }
      farbBtn.setInteractive({ useHandCursor: true })
      farbBtn.on('pointerdown', () => {
        gewaehlteFarbe = f.farbe
        soundKlick()
        // 🔄 Alle zurücksetzen, nur der neue aktiv!
        hosenFarbBtns.forEach(b => { b.setStrokeStyle(2, 0xFFFFFF); b.setScale(1) })
        farbBtn.setStrokeStyle(4, 0xFFD700)
        farbBtn.setScale(1.15)
      })
      hosenFarbBtns.push(farbBtn)
      elemente.push(farbBtn)

      const label = this.add.text(fx, fy + 26, f.name, {
        fontSize: '10px', fontFamily: 'Arial', color: '#cccccc'
      }).setOrigin(0.5).setDepth(201)
      elemente.push(label)
    })

    // ✅ Kaufen!
    const kaufBtn = this.add.text(breite / 2, hoehe * 0.7,
      genugGeld ? `✅ Kaufen! (${kosten} 🪨 Steine)` : `❌ Zu wenig Steine! (${kosten} 🪨)`, {
      fontSize: '16px', fontFamily: 'Arial',
      color: genugGeld ? '#ffffff' : '#999999',
      backgroundColor: genugGeld ? '#4CAF50' : '#616161',
      padding: { x: 16, y: 10 }
    }).setOrigin(0.5).setDepth(201)

    if (genugGeld) {
      kaufBtn.setInteractive({ useHandCursor: true })
      kaufBtn.on('pointerdown', () => {
        rucksack.stein -= kosten
        hausDaten.miloKleidung.hosenFarbe = gewaehlteFarbe
        this.rucksackAnzeige.setText(this.getRucksackText())
        spielSpeichern('StadtSzene', this.figurDaten, null)
        elemente.forEach(el => el.destroy())
        this.zeigeNachricht('👖 Milo hat eine neue Hose! 🎉')
        const melodie = [523, 659, 784]
        melodie.forEach((n, i) => setTimeout(() => spieleTon(n, 0.15, 0.05, 'sine'), i * 100))
      })
    }
    elemente.push(kaufBtn)

    // 🔙 Zurück
    const zurueck = this.add.text(breite / 2, hoehe * 0.85, '🔙 Zurück', {
      fontSize: '14px', fontFamily: 'Arial', color: '#FF5252',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(201)
    zurueck.setInteractive({ useHandCursor: true })
    zurueck.on('pointerdown', () => {
      elemente.forEach(el => el.destroy())
      this.kleidungKaufen()
    })
    elemente.push(zurueck)
  }

  // 👟 Schuhe für Milo!
  zeigeSchuhe() {
    const breite = this.scale.width
    const hoehe = this.scale.height

    const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.7)
    overlay.setDepth(200).setInteractive()

    const titel = this.add.text(breite / 2, hoehe * 0.1, '👟 Schuhe wählen!', {
      fontSize: '22px', fontFamily: 'Arial', color: '#CE93D8',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(201)

    const elemente = [overlay, titel]
    const kosten = 1 // 1 Eisen
    const genugGeld = rucksack.eisen >= kosten

    const farben = [
      { farbe: 0x424242, name: 'Dunkelgrau' },
      { farbe: 0xF44336, name: 'Rot' },
      { farbe: 0x2196F3, name: 'Blau' },
      { farbe: 0xFFEB3B, name: 'Gelb' },
      { farbe: 0x000000, name: 'Schwarz' },
      { farbe: 0xFFFFFF, name: 'Weiß' },
      { farbe: 0x4CAF50, name: 'Grün' },
      { farbe: 0xFF69B4, name: 'Pink' }
    ]

    let gewaehlteFarbe = hausDaten.miloKleidung.schuhFarbe
    const schuhFarbBtns = []

    const farbText = this.add.text(breite / 2, hoehe * 0.25, '🎨 Welche Farbe?', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(201)
    elemente.push(farbText)

    farben.forEach((f, i) => {
      const spalte = i % 4
      const zeile = Math.floor(i / 4)
      const fx = breite * 0.2 + spalte * (breite * 0.2)
      const fy = hoehe * 0.38 + zeile * 45

      const farbBtn = this.add.circle(fx, fy, 18, f.farbe).setDepth(201)
      // ✅ Aktive Farbe bekommt goldene Umrandung!
      if (f.farbe === gewaehlteFarbe) {
        farbBtn.setStrokeStyle(4, 0xFFD700)
        farbBtn.setScale(1.15)
      } else {
        farbBtn.setStrokeStyle(2, 0xFFFFFF)
      }
      farbBtn.setInteractive({ useHandCursor: true })
      farbBtn.on('pointerdown', () => {
        gewaehlteFarbe = f.farbe
        soundKlick()
        // 🔄 Alle zurücksetzen, nur der neue aktiv!
        schuhFarbBtns.forEach(b => { b.setStrokeStyle(2, 0xFFFFFF); b.setScale(1) })
        farbBtn.setStrokeStyle(4, 0xFFD700)
        farbBtn.setScale(1.15)
      })
      schuhFarbBtns.push(farbBtn)
      elemente.push(farbBtn)

      const label = this.add.text(fx, fy + 26, f.name, {
        fontSize: '10px', fontFamily: 'Arial', color: '#cccccc'
      }).setOrigin(0.5).setDepth(201)
      elemente.push(label)
    })

    // ✅ Kaufen!
    const kaufBtn = this.add.text(breite / 2, hoehe * 0.7,
      genugGeld ? `✅ Kaufen! (${kosten} ⚙️ Eisen)` : `❌ Zu wenig Eisen! (${kosten} ⚙️)`, {
      fontSize: '16px', fontFamily: 'Arial',
      color: genugGeld ? '#ffffff' : '#999999',
      backgroundColor: genugGeld ? '#4CAF50' : '#616161',
      padding: { x: 16, y: 10 }
    }).setOrigin(0.5).setDepth(201)

    if (genugGeld) {
      kaufBtn.setInteractive({ useHandCursor: true })
      kaufBtn.on('pointerdown', () => {
        rucksack.eisen -= kosten
        hausDaten.miloKleidung.schuhFarbe = gewaehlteFarbe
        this.rucksackAnzeige.setText(this.getRucksackText())
        spielSpeichern('StadtSzene', this.figurDaten, null)
        elemente.forEach(el => el.destroy())
        this.zeigeNachricht('👟 Milo hat neue Schuhe! 🎉')
        const melodie = [523, 659, 784]
        melodie.forEach((n, i) => setTimeout(() => spieleTon(n, 0.15, 0.05, 'sine'), i * 100))
      })
    }
    elemente.push(kaufBtn)

    // 🔙 Zurück
    const zurueck = this.add.text(breite / 2, hoehe * 0.85, '🔙 Zurück', {
      fontSize: '14px', fontFamily: 'Arial', color: '#FF5252',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(201)
    zurueck.setInteractive({ useHandCursor: true })
    zurueck.on('pointerdown', () => {
      elemente.forEach(el => el.destroy())
      this.kleidungKaufen()
    })
    elemente.push(zurueck)
  }

  // 🧡 MILO IN DER STADT! Er begleitet dich als treuer Freund!
  erstelleStadtMilo() {
    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🧡 Milo-Container erstellen
    const milo = this.add.container(breite * 0.2 - 35, hoehe - 105)

    const stufe = hausDaten.miloWachstum || 0
    const kleidung = hausDaten.miloKleidung || {
      kleidungFarbe: 0xFF7043, kleidungTyp: 0,
      hosenFarbe: 0x5D4037, schuhFarbe: 0x424242
    }

    if (stufe >= 5) {
      // ⭐ Großer Milo!
      const miloDaten = {
        hautfarbe: 0xFFCC80, haarfarbe: 0xE65100, haarStil: 0,
        kleidungFarbe: kleidung.kleidungFarbe,
        kleidungTyp: kleidung.kleidungTyp,
        hosenFarbe: kleidung.hosenFarbe,
        schuhFarbe: kleidung.schuhFarbe
      }
      maleFigur(this, milo, miloDaten, 0.65)
    } else {
      // 🌱 Kleiner Milo!
      const groesse = 0.5 + stufe * 0.06
      const beinL = this.add.rectangle(-3 * groesse, 18 * groesse, 4 * groesse, 8 * groesse, kleidung.hosenFarbe)
      const beinR = this.add.rectangle(3 * groesse, 18 * groesse, 4 * groesse, 8 * groesse, kleidung.hosenFarbe)
      milo.add([beinL, beinR])
      const hemd = this.add.rectangle(0, 9 * groesse, 12 * groesse, 12 * groesse, kleidung.kleidungFarbe)
      milo.add(hemd)
      const kopf = this.add.circle(0, 0, 8 * groesse, 0xFFCC80)
      milo.add(kopf)
      const haar = this.add.circle(0, -6 * groesse, 7 * groesse, 0xE65100)
      milo.add(haar)
      const augeL = this.add.circle(-2.5 * groesse, -1.5 * groesse, 1.2 * groesse, 0x333333)
      const augeR = this.add.circle(2.5 * groesse, -1.5 * groesse, 1.2 * groesse, 0x333333)
      milo.add([augeL, augeR])
    }

    // 🏷️ Milo Name
    const nameY = stufe >= 5 ? -50 : -18
    const miloName = this.add.text(0, nameY, 'Milo 🧡', {
      fontSize: '10px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5)
    milo.add(miloName)

    milo.setDepth(49)
    this.miloStadt = milo
  }

  // 🧑‍🤝‍🧑 FREUNDE IN DER STADT! 4 tolle Leute zum Kennenlernen!
  erstelleStadtFreunde() {
    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🌟 Unsere Stadt-Freunde! Jeder hat einen eigenen Stil!
    this.stadtNPCs = [
      {
        name: 'Lina',
        x: breite * 0.12,
        emoji: '🌸',
        hautfarbe: 0xFFDBAC,
        haarfarbe: 0x8D6E63,
        haarStil: 1,
        kleidungFarbe: 0xE91E63,
        kleidungTyp: 1,
        hosenFarbe: 0xE91E63,
        schuhFarbe: 0xF48FB1,
        sprueche: [
          '🌸 Hallo! Ich bin Lina! Ich liebe Blumen!',
          '🌷 Wusstest du, dass Sonnenblumen zur Sonne gucken?',
          '🌻 Ich pflanze am liebsten bunte Blumen!',
          '🦋 Heute habe ich einen Schmetterling gesehen!',
          '🌺 Magst du auch Blumen? Die riechen so gut!'
        ],
        miloSagt: [
          '🧡 Lina ist total nett!',
          '🌸 Sie weiß alles über Blumen!',
          '😊 Lina ist toll!'
        ],
        freundSpruch: '🌸 Wir sind Freunde! Das ist so schön! 🎉'
      },
      {
        name: 'Finn',
        x: breite * 0.48,
        emoji: '🎨',
        hautfarbe: 0xD2A67A,
        haarfarbe: 0x333333,
        haarStil: 0,
        kleidungFarbe: 0x2196F3,
        kleidungTyp: 2,
        hosenFarbe: 0x37474F,
        schuhFarbe: 0xFF5722,
        sprueche: [
          '🎨 Hey! Ich bin Finn! Ich mal super gerne!',
          '🖌️ Heute habe ich ein Bild von der Stadt gemalt!',
          '🎨 Mein Lieblings-Farbe ist Blau! Und deine?',
          '✏️ Ich möchte mal Künstler werden!',
          '🖼️ Ich schenke dir mal ein Bild! Versprochen!'
        ],
        miloSagt: [
          '🧡 Finn ist cool!',
          '🎨 Er kann voll gut malen!',
          '😊 Finn ist lustig!'
        ],
        freundSpruch: '🎨 Yeah! Wir sind Freunde! Ich mal ein Bild von uns! 🎉'
      },
      {
        name: 'Nora',
        x: breite * 0.62,
        emoji: '🎵',
        hautfarbe: 0x8D5524,
        haarfarbe: 0x1A1A1A,
        haarStil: 2,
        kleidungFarbe: 0x9C27B0,
        kleidungTyp: 0,
        hosenFarbe: 0x1565C0,
        schuhFarbe: 0xFFEB3B,
        sprueche: [
          '🎵 Hi! Ich bin Nora! Ich liebe Musik!',
          '🎤 La la la! Ich singe total gerne!',
          '🎹 Ich lerne gerade Klavier spielen!',
          '🎶 Magst du auch Musik? Singen ist so toll!',
          '🎵 Mein Lieblingslied geht: Do Re Mi Fa Sol!'
        ],
        miloSagt: [
          '🧡 Nora singt voll schön!',
          '🎵 Sie ist mega musikalisch!',
          '😊 Nora ist super!'
        ],
        freundSpruch: '🎵 Juhu! Wir sind Freunde! Ich sing dir ein Lied! 🎉'
      },
      {
        name: 'Max',
        x: breite * 0.88,
        emoji: '🍪',
        hautfarbe: 0xFFE0BD,
        haarfarbe: 0xFFD54F,
        haarStil: 0,
        kleidungFarbe: 0xFF9800,
        kleidungTyp: 0,
        hosenFarbe: 0x5D4037,
        schuhFarbe: 0x4CAF50,
        sprueche: [
          '🍪 Hallo! Ich bin Max! Ich backe gerne Kekse!',
          '🧁 Gestern habe ich Muffins gebacken! Lecker!',
          '🍕 Pizza mag ich auch! Kennst du Pizza Mario?',
          '🍪 Mein Geheimnis: Extra viel Schokolade in den Teig!',
          '🎂 Ich backe dir mal einen Kuchen! Was ist dein Lieblingskuchen?'
        ],
        miloSagt: [
          '🧡 Max ist super nett!',
          '🍪 Seine Kekse sind lecker!',
          '😊 Max ist ein toller Freund!'
        ],
        freundSpruch: '🍪 Wir sind Freunde! Hier, ein Keks für dich! 🎉'
      }
    ]

    // 🧑‍🤝‍🧑 Für jeden NPC eine Figur erstellen!
    this.stadtNPCs.forEach((npc) => {
      const container = this.add.container(npc.x, hoehe - 105)

      // 🎨 Figur mit maleFigur() malen – wie richtige Spielfiguren!
      const figurDaten = {
        hautfarbe: npc.hautfarbe,
        haarfarbe: npc.haarfarbe,
        haarStil: npc.haarStil,
        kleidungFarbe: npc.kleidungFarbe,
        kleidungTyp: npc.kleidungTyp,
        hosenFarbe: npc.hosenFarbe,
        schuhFarbe: npc.schuhFarbe
      }
      maleFigur(this, container, figurDaten, 0.65)

      // 🏷️ Name über dem Kopf
      const istFreund = hausDaten.stadtFreunde.includes(npc.name)
      const nameText = this.add.text(0, -50, `${npc.emoji} ${npc.name}`, {
        fontSize: '11px', fontFamily: 'Arial',
        color: istFreund ? '#FFD700' : '#ffffff',
        stroke: '#000000', strokeThickness: 3
      }).setOrigin(0.5)
      container.add(nameText)

      // 💛 Freundschafts-Herz wenn schon befreundet!
      if (istFreund) {
        const herz = this.add.text(0, -62, '💛', {
          fontSize: '14px'
        }).setOrigin(0.5)
        container.add(herz)
        // 💛 Herz pulsiert!
        this.tweens.add({
          targets: herz,
          scale: 1.3,
          duration: 600,
          yoyo: true,
          repeat: -1
        })
      }

      container.setDepth(48)

      // 👆 Klick-Zone zum Reden!
      const klickZone = this.add.rectangle(npc.x, hoehe - 105, 50, 70, 0xffffff, 0)
      klickZone.setDepth(56).setInteractive({ useHandCursor: true })
      klickZone.on('pointerdown', () => {
        // Nur reden wenn nahe genug!
        const abstand = Math.abs(this.spieler.x - npc.x)
        if (abstand < 80) {
          this.mitFreundReden(npc)
        } else {
          this.zeigeNachricht(`🚶 Geh näher zu ${npc.name}!`)
        }
      })

      npc.container = container
      npc.klickZone = klickZone
    })

    // 🧍 NPCs wippen leicht hin und her (leben!)
    this.stadtNPCs.forEach((npc) => {
      this.tweens.add({
        targets: npc.container,
        y: hoehe - 107,
        duration: Phaser.Math.Between(800, 1200),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    })
  }

  // 💬 MIT EINEM FREUND IN DER STADT REDEN!
  mitFreundReden(npc) {
    soundKlick()

    const breite = this.scale.width
    const hoehe = this.scale.height

    // Wie oft haben wir schon geredet?
    if (!this.stadtGespraeche[npc.name]) this.stadtGespraeche[npc.name] = 0
    this.stadtGespraeche[npc.name]++
    const anzahl = this.stadtGespraeche[npc.name]

    const istSchonFreund = hausDaten.stadtFreunde.includes(npc.name)

    // 🖤 Overlay
    const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.7)
    overlay.setDepth(200).setInteractive()
    const elemente = [overlay]

    // 🏷️ Name oben
    const titel = this.add.text(breite / 2, hoehe * 0.06, `${npc.emoji} ${npc.name} ${npc.emoji}`, {
      fontSize: '24px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(201)
    elemente.push(titel)

    // 💬 Was sagt der Freund?
    let spruch = ''
    if (istSchonFreund) {
      // 💛 Schon befreundet – extra nette Sprüche!
      const freundSprueche = [
        `💛 Hey! Schön dich zu sehen, Freund!`,
        `💛 ${npc.name} freut sich dich zu sehen! 🤗`,
        npc.sprueche[Phaser.Math.Between(1, npc.sprueche.length - 1)],
        `💛 Toll dass du mit Milo vorbeischaust!`,
        `💛 Wir haben heute bestimmt viel Spaß!`
      ]
      spruch = freundSprueche[Phaser.Math.Between(0, freundSprueche.length - 1)]
    } else if (anzahl >= 3) {
      // 🎉 Jetzt werden wir Freunde!
      spruch = npc.freundSpruch
    } else {
      // 👋 Normaler Spruch
      const idx = Math.min(anzahl - 1, npc.sprueche.length - 1)
      spruch = npc.sprueche[idx]
    }

    // 💬 Sprechblase vom NPC
    const sprechblase = this.add.text(breite / 2, hoehe * 0.25, spruch, {
      fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
      align: 'center', wordWrap: { width: breite * 0.7 }
    }).setOrigin(0.5).setDepth(201)
    elemente.push(sprechblase)

    // 🧡 Was sagt Milo dazu?
    const miloIdx = Phaser.Math.Between(0, npc.miloSagt.length - 1)
    const miloText = this.add.text(breite / 2, hoehe * 0.45, `Milo: ${npc.miloSagt[miloIdx]}`, {
      fontSize: '14px', fontFamily: 'Arial', color: '#FFB74D',
      stroke: '#000000', strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5).setDepth(201)
    elemente.push(miloText)

    // 🎉 Freundschaft entsteht!
    if (!istSchonFreund && anzahl >= 3) {
      // 🎉 NEUER FREUND! 🎉
      hausDaten.stadtFreunde.push(npc.name)
      spielSpeichern('StadtSzene', this.figurDaten, null)

      // 🎉 Konfetti-Text!
      const konfetti = this.add.text(breite / 2, hoehe * 0.6,
        '🎉 Ihr seid jetzt Freunde! 💛', {
        fontSize: '20px', fontFamily: 'Arial', color: '#FFD700',
        stroke: '#000000', strokeThickness: 4,
        align: 'center'
      }).setOrigin(0.5).setDepth(201)
      elemente.push(konfetti)

      // ✨ Konfetti-Animation
      this.tweens.add({
        targets: konfetti,
        scale: 1.2,
        duration: 500,
        yoyo: true,
        repeat: 2
      })

      // 🎵 Freundschafts-Melodie! 🎶
      const melodie = [523, 659, 784, 1047, 784, 1047]
      melodie.forEach((note, i) => {
        setTimeout(() => spieleTon(note, 0.2, 0.05, 'sine'), i * 150)
      })

      // 💛 Herz über dem NPC hinzufügen!
      const herz = this.add.text(0, -62, '💛', {
        fontSize: '14px'
      }).setOrigin(0.5)
      npc.container.add(herz)
      this.tweens.add({
        targets: herz,
        scale: 1.3,
        duration: 600,
        yoyo: true,
        repeat: -1
      })

      // 🏷️ Name golden machen
      npc.container.list.forEach((child) => {
        if (child.type === 'Text' && child.text && child.text.includes(npc.name)) {
          child.setColor('#FFD700')
        }
      })
    } else if (!istSchonFreund) {
      // 📊 Fortschritt anzeigen
      const herzen = '💛'.repeat(anzahl) + '🤍'.repeat(3 - anzahl)
      const fortschritt = this.add.text(breite / 2, hoehe * 0.6,
        `Freundschaft: ${herzen}`, {
        fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
        stroke: '#000000', strokeThickness: 3,
        align: 'center'
      }).setOrigin(0.5).setDepth(201)
      elemente.push(fortschritt)
    } else {
      // 💛 Schon Freunde!
      const freundLabel = this.add.text(breite / 2, hoehe * 0.6,
        '💛💛💛 Beste Freunde! 💛💛💛', {
        fontSize: '16px', fontFamily: 'Arial', color: '#FFD700',
        stroke: '#000000', strokeThickness: 3,
        align: 'center'
      }).setOrigin(0.5).setDepth(201)
      elemente.push(freundLabel)
    }

    // 💬 Nochmal reden oder schließen
    const redenBtn = this.add.text(breite * 0.35, hoehe * 0.78, '💬 Nochmal reden', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: '#4CAF50', padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setDepth(201)
    redenBtn.setInteractive({ useHandCursor: true })
    redenBtn.on('pointerdown', () => {
      elemente.forEach(el => el.destroy())
      this.mitFreundReden(npc)
    })
    elemente.push(redenBtn)

    // ❌ Schließen
    const schliessen = this.add.text(breite * 0.65, hoehe * 0.78, '👋 Tschüss!', {
      fontSize: '14px', fontFamily: 'Arial', color: '#FF5252',
      backgroundColor: '#424242', padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setDepth(201)
    schliessen.setInteractive({ useHandCursor: true })
    schliessen.on('pointerdown', () => {
      elemente.forEach(el => el.destroy())
    })
    elemente.push(schliessen)
  }

  getRucksackText() {
    let text = `🎒 🪵${rucksack.holz} 🪨${rucksack.stein} ⚙️${rucksack.eisen}`
    if (rucksack.pizza > 0) text += ` 🍕${rucksack.pizza}`
    return text
  }

  zeigeNachricht(text) {
    const nachricht = this.add.text(this.scale.width / 2, this.scale.height * 0.15, text, {
      fontSize: '18px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#000000', strokeThickness: 3, align: 'center'
    }).setOrigin(0.5).setDepth(300)
    this.tweens.add({
      targets: nachricht,
      alpha: 0, y: nachricht.y - 30,
      duration: 1500, delay: 2000,
      onComplete: () => nachricht.destroy()
    })
  }
}

export default StadtSzene
