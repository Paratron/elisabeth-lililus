import Phaser from 'phaser'
import { rucksack, hausDaten, spielSpeichern } from '../state.js'
import { spieleTon, soundKlick, soundTuer } from '../sounds.js'
import { maleFigur } from '../figur.js'

class HausSzene extends Phaser.Scene {
  constructor() {
    super('HausSzene')
  }

  preload() {}

  create(figurDaten) {
    this.figurDaten = figurDaten
    this.rucksack = rucksack
    this.einrichtenModus = false // 🔨 Erst aus
    this.schlaft = false // 😴 Nicht am Schlafen!
    this.moebelSprites = [] // Alle Möbel-Objekte im Raum

    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🏠 Raum zeichnen
    this.maleRaum()

    // 🚪 Tür (unten mittig) – zum Rausgehen!
    this.add.rectangle(breite / 2, hoehe - 40, 50, 80, 0x4E342E).setDepth(5)
    this.add.circle(breite / 2 + 15, hoehe - 40, 3, 0xFFD700).setDepth(6)
    this.add.rectangle(breite / 2, hoehe - 5, 60, 10, 0x8D6E63).setDepth(5)

    // 🚪 "Raus" Button über der Tür
    const raus = this.add.text(breite / 2, hoehe - 85, '🔼 Raus', {
      fontSize: '16px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#000000', strokeThickness: 3,
      backgroundColor: '#00000066', padding: { x: 10, y: 4 }
    }).setOrigin(0.5).setDepth(100)
    raus.setInteractive({ useHandCursor: true })
    raus.on('pointerdown', () => {
      spielSpeichern('BlumenwiesenSpiel', this.figurDaten, null)
      this.scene.start('BlumenwiesenSpiel', this.figurDaten)
    })

    // 🧑 Spieler im Haus
    this.spieler = this.erstelleSpieler(breite / 2, hoehe - 130)

    // 🎒 Rucksack-Anzeige
    this.rucksackAnzeige = this.add.text(16, 16, this.getRucksackText(), {
      fontSize: '14px', fontFamily: 'Arial', color: '#333333',
      stroke: '#ffffff', strokeThickness: 2, lineSpacing: 4
    }).setDepth(100)

    // 🪑 Möbel anzeigen die schon platziert wurden!
    this.zeigeMoebel()

    // 🔨 HAMMER-BUTTON (oben rechts)
    this.hammerBtn = this.add.text(breite - 16, 16, '🔨', {
      fontSize: '36px', backgroundColor: '#795548',
      padding: { x: 8, y: 4 }
    }).setOrigin(1, 0).setDepth(150)
    this.hammerBtn.setInteractive({ useHandCursor: true })
    this.hammerBtn.on('pointerdown', () => this.zeigeEinrichtenMenu())

    // 🎯 Ziel (Laufen)
    this.zielX = null
    this.zielY = null

    // 👆 Touch zum Laufen
    this.input.on('pointerdown', (pointer) => {
      if (this.einrichtenModus) return // Im Einrichten-Modus nicht laufen
      if (this.schlaft) return // Beim Schlafen nicht laufen
      if (pointer.y < 50) return
      // 🧱 Nur auf dem Boden laufen, nicht auf die Wände!
      this.zielX = Phaser.Math.Clamp(pointer.x, 50, breite - 50)
      this.zielY = Phaser.Math.Clamp(pointer.y, hoehe - 160, hoehe - 25)
    })

    // ⌨️ Tastatur
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys('W,A,S,D')

    // 🏠 Willkommen!
    soundTuer()
    this.zeigeNachricht('🏠 Willkommen zuhause!')
  }

  // === 🎨 RAUM MALEN ===
  maleRaum() {
    // Alten Raum löschen wenn vorhanden
    if (this.raumGrafik) this.raumGrafik.destroy()
    if (this.bodenGrafik) this.bodenGrafik.destroy()

    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🏠 Hintergrund-Farbe (heller als die Wand)
    this.cameras.main.setBackgroundColor('#FFF8E1')

    // 🪵 Boden
    this.bodenGrafik = this.add.graphics()
    this.bodenGrafik.fillStyle(hausDaten.bodenFarbe)
    this.bodenGrafik.fillRect(0, hoehe - 80, breite, 80)
    // Planken-Linien
    this.bodenGrafik.lineStyle(1, 0x00000022)
    for (let i = 0; i < breite; i += 60) {
      this.bodenGrafik.lineBetween(i, hoehe - 80, i, hoehe)
    }
    for (let j = hoehe - 80; j < hoehe; j += 20) {
      this.bodenGrafik.lineBetween(0, j, breite, j)
    }

    // 🧱 Wände
    this.raumGrafik = this.add.graphics()
    this.raumGrafik.fillStyle(hausDaten.wandFarbe)
    this.raumGrafik.fillRect(0, 0, 30, hoehe)
    this.raumGrafik.fillRect(breite - 30, 0, 30, hoehe)
    this.raumGrafik.fillStyle(hausDaten.dachFarbe)
    this.raumGrafik.fillRect(0, 0, breite, 35)

    // 🪟 Fenster links
    this.add.rectangle(80, hoehe * 0.35, 70, 60, 0xBBDEFB).setDepth(1)
    this.add.rectangle(80, hoehe * 0.35, 70, 2, 0x795548).setDepth(2)
    this.add.rectangle(80, hoehe * 0.35, 2, 60, 0x795548).setDepth(2)
    this.add.rectangle(80, hoehe * 0.35, 76, 66, 0x000000, 0).setStrokeStyle(3, 0x795548).setDepth(2)
    this.add.rectangle(100, hoehe * 0.45, 40, 100, 0xFFFF00, 0.06).setDepth(1)

    // 🪟 Fenster rechts
    this.add.rectangle(breite - 80, hoehe * 0.35, 70, 60, 0xBBDEFB).setDepth(1)
    this.add.rectangle(breite - 80, hoehe * 0.35, 70, 2, 0x795548).setDepth(2)
    this.add.rectangle(breite - 80, hoehe * 0.35, 2, 60, 0x795548).setDepth(2)
    this.add.rectangle(breite - 80, hoehe * 0.35, 76, 66, 0x000000, 0).setStrokeStyle(3, 0x795548).setDepth(2)
    this.add.rectangle(breite - 100, hoehe * 0.45, 40, 100, 0xFFFF00, 0.06).setDepth(1)
  }

  // === 🪑 MÖBEL ANZEIGEN ===
  zeigeMoebel() {
    const breite = this.scale.width
    const hoehe = this.scale.height

    // Alte Möbel-Sprites löschen
    this.moebelSprites.forEach(s => s.destroy())
    this.moebelSprites = []

    // Standard-Positionen für neue Möbel
    const standardPos = [
      { x: breite * 0.25, y: hoehe - 110 },
      { x: breite * 0.75, y: hoehe - 110 },
      { x: breite * 0.25, y: hoehe * 0.5 },
      { x: breite * 0.75, y: hoehe * 0.5 },
      { x: breite * 0.5, y: hoehe * 0.5 },
      { x: breite * 0.5, y: hoehe - 110 },
    ]

    hausDaten.moebel.forEach((m, i) => {
      // Gespeicherte Position oder Standard verwenden
      const px = m.x || (standardPos[i] ? standardPos[i].x : breite * 0.5)
      const py = m.y || (standardPos[i] ? standardPos[i].y : hoehe * 0.5)

      // 🛏️ Bett ist größer als andere Möbel!
      const istBett = m.name === 'Bett'
      const groesse = istBett ? '56px' : '36px'

      const sprite = this.add.text(px, py, m.emoji, {
        fontSize: groesse
      }).setOrigin(0.5).setDepth(10)

      // 🛏️ Wenn es ein Bett ist: Antippbar zum Schlafen!
      if (istBett) {
        sprite.setInteractive({ useHandCursor: true })
        sprite.on('pointerdown', () => {
          if (this.einrichtenModus) return // Im Einrichten-Modus nicht schlafen
          if (this.schlaft) return // Schon am Schlafen!
          this.schlafen(sprite)
        })
      }

      //  Wenn es ein Telefon ist: Antippen = In die Stadt fahren!
      const istTelefon = m.name === 'Telefon'
      if (istTelefon) {
        sprite.setInteractive({ useHandCursor: true })
        sprite.on('pointerdown', () => {
          if (this.einrichtenModus) return
          if (this.schlaft) return
          this.telefonAnrufen()
        })
      }

      // 💻 Wenn es ein Computer ist: Antippen = Spiel & Chat mit Milo!
      const istComputer = m.name === 'Computer'
      if (istComputer) {
        // 🪑 Tisch unter dem Computer malen!
        const tischBeine = this.add.graphics()
        tischBeine.fillStyle(0x5D4037) // Braune Tischbeine
        tischBeine.fillRect(px - 28, py + 10, 4, 22)  // Bein links
        tischBeine.fillRect(px + 24, py + 10, 4, 22)  // Bein rechts
        tischBeine.setDepth(8)
        this.moebelSprites.push(tischBeine)

        const tischPlatte = this.add.rectangle(px, py + 8, 64, 8, 0x795548)
        tischPlatte.setDepth(9)
        this.moebelSprites.push(tischPlatte)

        // 💻 Computer auf dem Tisch (etwas höher)
        sprite.setY(py - 8)
        sprite.setDepth(10)

        sprite.setInteractive({ useHandCursor: true })
        sprite.on('pointerdown', () => {
          if (this.einrichtenModus) return
          if (this.schlaft) return
          this.computerStarten()
        })
      }

      sprite.moebelIndex = i // Merken welches Möbel das ist
      this.moebelSprites.push(sprite)
    })

    if (hausDaten.moebel.length === 0) {
      const hinweis = this.add.text(breite / 2, hoehe * 0.4,
        '🏠 Noch keine Möbel...\nBaue draußen welche!', {
        fontSize: '18px', fontFamily: 'Arial', color: '#9E9E9E',
        align: 'center'
      }).setOrigin(0.5)
      this.moebelSprites.push(hinweis)
    }
  }

  // === 🔨 EINRICHTEN-MENÜ ===
  zeigeEinrichtenMenu() {
    const breite = this.scale.width
    const hoehe = this.scale.height
    this.einrichtenModus = true

    // Dunkler Hintergrund
    const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.6)
    overlay.setDepth(200)

    const titel = this.add.text(breite / 2, hoehe * 0.08, '🔨 Einrichten!', {
      fontSize: '26px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(201)

    const elemente = [overlay, titel]

    // === 🪑 MÖBEL VERSCHIEBEN ===
    const verschieben = this.add.text(breite / 2, hoehe * 0.25, '🪑 Möbel verschieben', {
      fontSize: '20px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: '#4CAF50', padding: { x: 20, y: 12 }
    }).setOrigin(0.5).setDepth(201)
    verschieben.setInteractive({ useHandCursor: true })
    verschieben.on('pointerdown', () => {
      elemente.forEach(el => el.destroy())
      this.starteMoebelVerschieben()
    })
    elemente.push(verschieben)

    // === 🎨 WAND-FARBE ÄNDERN ===
    const wandBtn = this.add.text(breite / 2, hoehe * 0.42, '🧱 Wand-Farbe ändern', {
      fontSize: '20px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: '#795548', padding: { x: 20, y: 12 }
    }).setOrigin(0.5).setDepth(201)
    wandBtn.setInteractive({ useHandCursor: true })
    wandBtn.on('pointerdown', () => {
      elemente.forEach(el => el.destroy())
      this.zeigeFarbwahlWand()
    })
    elemente.push(wandBtn)

    // === 🪵 BODEN-FARBE ÄNDERN ===
    const bodenBtn = this.add.text(breite / 2, hoehe * 0.59, '🪵 Boden-Farbe ändern', {
      fontSize: '20px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: '#A1887F', padding: { x: 20, y: 12 }
    }).setOrigin(0.5).setDepth(201)
    bodenBtn.setInteractive({ useHandCursor: true })
    bodenBtn.on('pointerdown', () => {
      elemente.forEach(el => el.destroy())
      this.zeigeFarbwahlBoden()
    })
    elemente.push(bodenBtn)

    // === ❌ SCHLIESSEN ===
    const schliessen = this.add.text(breite / 2, hoehe * 0.8, '❌ Zurück', {
      fontSize: '20px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(201)
    schliessen.setInteractive({ useHandCursor: true })
    schliessen.on('pointerdown', () => {
      elemente.forEach(el => el.destroy())
      this.einrichtenModus = false
    })
    elemente.push(schliessen)
  }

  // === 🪑 MÖBEL VERSCHIEBEN MODUS ===
  // 🎮 Benutzt Phasers Drag-System – funktioniert super auf Tablets! 📱
  starteMoebelVerschieben() {
    if (hausDaten.moebel.length === 0) {
      this.zeigeNachricht('Noch keine Möbel zum Verschieben!')
      this.einrichtenModus = false
      return
    }

    const breite = this.scale.width
    const hoehe = this.scale.height

    // 📝 Hinweis anzeigen
    const hinweis = this.add.text(breite / 2, 45, '👆 Ziehe Möbel an die richtige Stelle!', {
      fontSize: '16px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#000000', strokeThickness: 3,
      backgroundColor: '#00000088', padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setDepth(200)

    // ✅ Fertig-Button
    const fertigBtn = this.add.text(breite / 2, hoehe - 40, '✅ Fertig!', {
      fontSize: '22px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: '#4CAF50', padding: { x: 24, y: 8 }
    }).setOrigin(0.5).setDepth(200)
    fertigBtn.setInteractive({ useHandCursor: true })

    // 🖐️ Phaser Drag-System benutzen! Das funktioniert viel besser auf Tablets!
    const dragHandler = (pointer, gameObject, dragX, dragY) => {
      // 📏 Möbel darf nicht aus dem Haus raus!
      gameObject.x = Phaser.Math.Clamp(dragX, 50, breite - 50)
      gameObject.y = Phaser.Math.Clamp(dragY, 60, hoehe - 90)
      // ✨ Rahmen mitbewegen!
      if (gameObject.rahmen) {
        gameObject.rahmen.x = gameObject.x
        gameObject.rahmen.y = gameObject.y
      }
    }

    const dragEndHandler = (pointer, gameObject) => {
      // 💾 Position merken wenn man loslässt!
      const idx = gameObject.moebelIndex
      if (idx !== undefined && hausDaten.moebel[idx]) {
        hausDaten.moebel[idx].x = gameObject.x
        hausDaten.moebel[idx].y = gameObject.y
      }
    }

    this.input.on('drag', dragHandler)
    this.input.on('dragend', dragEndHandler)

    // ✅ Fertig gedrückt = alles aufräumen und speichern!
    fertigBtn.on('pointerdown', () => {
      hinweis.destroy()
      fertigBtn.destroy()

      // 🧹 Drag-Events aufräumen!
      this.input.off('drag', dragHandler)
      this.input.off('dragend', dragEndHandler)

      // 🧹 Rahmen aufräumen und Drag deaktivieren
      this.moebelSprites.forEach(s => {
        if (s.rahmen) { s.rahmen.destroy(); s.rahmen = null }
        if (s.input) {
          s.input.draggable = false
          s.disableInteractive()
        }
      })

      // 🪑 Möbel komplett neu aufbauen (mit allen Klick-Handlern!)
      this.zeigeMoebel()
      this.einrichtenModus = false

      // 💾 Positionen speichern!
      spielSpeichern('HausSzene', this.figurDaten, {
        x: this.spieler.x, y: this.spieler.y
      })
      this.zeigeNachricht('🏠 Sieht toll aus! 🎉')
    })

    // 🪑 Jedes echte Möbelstück ziehbar machen!
    this.moebelSprites.forEach(sprite => {
      // ⛔ Nur Sprites mit moebelIndex sind echte Möbel!
      if (sprite.moebelIndex === undefined) return

      // 🧹 Alte Klick-Handler entfernen
      sprite.removeAllListeners()
      if (sprite.input) sprite.removeInteractive()

      // 🎯 Interaktiv UND ziehbar machen! (draggable = true!)
      sprite.setInteractive({ useHandCursor: true, draggable: true })
      this.input.setDraggable(sprite, true)

      // ✨ Leuchtender Rahmen damit man sieht was man verschieben kann!
      const rahmen = this.add.rectangle(sprite.x, sprite.y, 60, 60, 0xFFEB3B, 0.3)
      rahmen.setStrokeStyle(2, 0xFFD700).setDepth(9)
      sprite.rahmen = rahmen

      // 💫 Pulsieren damit es schön leuchtet!
      this.tweens.add({
        targets: rahmen,
        alpha: 0.1, duration: 500, yoyo: true, repeat: -1
      })
    })
  }

  // === 🧱 WAND-FARBE WÄHLEN ===
  zeigeFarbwahlWand() {
    const breite = this.scale.width
    const hoehe = this.scale.height

    const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.6)
    overlay.setDepth(200)

    const titel = this.add.text(breite / 2, hoehe * 0.12, '🧱 Welche Wand-Farbe?', {
      fontSize: '22px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(201)

    const elemente = [overlay, titel]

    const farben = [
      { hex: 0x8D6E63, name: 'Braun' },
      { hex: 0xFFCDD2, name: 'Rosa' },
      { hex: 0xBBDEFB, name: 'Blau' },
      { hex: 0xC8E6C9, name: 'Grün' },
      { hex: 0xFFF9C4, name: 'Gelb' },
      { hex: 0xE1BEE7, name: 'Lila' },
      { hex: 0xFFE0B2, name: 'Orange' },
      { hex: 0xFFFFFF, name: 'Weiß' },
      { hex: 0xF5F5F5, name: 'Grau' },
      { hex: 0xFFCCBC, name: 'Lachs' }
    ]

    farben.forEach((f, i) => {
      const x = breite * 0.2 + (i % 5) * 75
      const y = hoehe * 0.35 + Math.floor(i / 5) * 80

      const kreis = this.add.circle(x, y, 25, f.hex)
      kreis.setStrokeStyle(3, 0x333333).setDepth(202)
      kreis.setInteractive({ useHandCursor: true })

      const label = this.add.text(x, y + 35, f.name, {
        fontSize: '12px', fontFamily: 'Arial', color: '#ffffff',
        stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(202)

      kreis.on('pointerdown', () => {
        hausDaten.wandFarbe = f.hex
        elemente.forEach(el => el.destroy())
        this.einrichtenModus = false
        // Raum neu zeichnen!
        this.scene.restart(this.figurDaten)
      })

      elemente.push(kreis, label)
    })

    // Zurück
    const zurueck = this.add.text(breite / 2, hoehe * 0.85, '❌ Zurück', {
      fontSize: '18px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(202)
    zurueck.setInteractive({ useHandCursor: true })
    zurueck.on('pointerdown', () => {
      elemente.forEach(el => el.destroy())
      this.einrichtenModus = false
    })
    elemente.push(zurueck)
  }

  // === 🪵 BODEN-FARBE WÄHLEN ===
  zeigeFarbwahlBoden() {
    const breite = this.scale.width
    const hoehe = this.scale.height

    const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.6)
    overlay.setDepth(200)

    const titel = this.add.text(breite / 2, hoehe * 0.12, '🪵 Welcher Boden?', {
      fontSize: '22px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(201)

    const elemente = [overlay, titel]

    const farben = [
      { hex: 0xBCAAA4, name: 'Holz hell' },
      { hex: 0x8D6E63, name: 'Holz dunkel' },
      { hex: 0x5D4037, name: 'Nussbaum' },
      { hex: 0xD7CCC8, name: 'Birke' },
      { hex: 0xEFEBE9, name: 'Marmor' },
      { hex: 0x90A4AE, name: 'Stein' },
      { hex: 0xE8F5E9, name: 'Minze' },
      { hex: 0xBBDEFB, name: 'Ozean' },
      { hex: 0xFCE4EC, name: 'Rosa' },
      { hex: 0xFFF8E1, name: 'Sand' }
    ]

    farben.forEach((f, i) => {
      const x = breite * 0.2 + (i % 5) * 75
      const y = hoehe * 0.35 + Math.floor(i / 5) * 80

      const kreis = this.add.circle(x, y, 25, f.hex)
      kreis.setStrokeStyle(3, 0x333333).setDepth(202)
      kreis.setInteractive({ useHandCursor: true })

      const label = this.add.text(x, y + 35, f.name, {
        fontSize: '12px', fontFamily: 'Arial', color: '#ffffff',
        stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(202)

      kreis.on('pointerdown', () => {
        hausDaten.bodenFarbe = f.hex
        elemente.forEach(el => el.destroy())
        this.einrichtenModus = false
        // Raum neu zeichnen!
        this.scene.restart(this.figurDaten)
      })

      elemente.push(kreis, label)
    })

    // Zurück
    const zurueck = this.add.text(breite / 2, hoehe * 0.85, '❌ Zurück', {
      fontSize: '18px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(202)
    zurueck.setInteractive({ useHandCursor: true })
    zurueck.on('pointerdown', () => {
      elemente.forEach(el => el.destroy())
      this.einrichtenModus = false
    })
    elemente.push(zurueck)
  }

  update() {
    if (this.einrichtenModus) {
      this.spieler.body.setVelocity(0, 0)
      return // Im Einrichten-Modus nicht laufen!
    }

    const geschwindigkeit = 160
    let vx = 0
    let vy = 0

    if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -geschwindigkeit
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx = geschwindigkeit
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -geschwindigkeit
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy = geschwindigkeit

    if (vx !== 0 || vy !== 0) {
      this.spieler.body.setVelocity(vx, vy)
      this.zielX = null
      this.zielY = null
      return
    }

    if (this.zielX !== null && this.zielY !== null) {
      const abstand = Phaser.Math.Distance.Between(
        this.spieler.x, this.spieler.y, this.zielX, this.zielY
      )
      if (abstand > 5) {
        this.physics.moveTo(this.spieler, this.zielX, this.zielY, geschwindigkeit)
      } else {
        this.spieler.body.setVelocity(0, 0)
        this.zielX = null
        this.zielY = null
      }
    } else {
      this.spieler.body.setVelocity(0, 0)
    }

    // 🧱 Spieler im Raum halten – nur auf dem Boden laufen!
    const hoehe = this.scale.height
    const breite = this.scale.width
    if (this.spieler.x < 50) { this.spieler.x = 50; this.spieler.body.setVelocityX(0) }
    if (this.spieler.x > breite - 50) { this.spieler.x = breite - 50; this.spieler.body.setVelocityX(0) }
    if (this.spieler.y < hoehe - 160) { this.spieler.y = hoehe - 160; this.spieler.body.setVelocityY(0) }
    if (this.spieler.y > hoehe - 25) { this.spieler.y = hoehe - 25; this.spieler.body.setVelocityY(0) }
  }

  // ===  TELEFON ANRUFEN ===
  telefonAnrufen() {
    soundKlick()

    const breite = this.scale.width
    const hoehe = this.scale.height

    // 📞 Klingel-Sound!
    const klingel = [880, 0, 880, 0, 880]
    klingel.forEach((note, i) => {
      if (note > 0) setTimeout(() => spieleTon(note, 0.15, 0.05, 'sine'), i * 150)
    })

    // 🖤 Dunkler Hintergrund
    const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.7)
    overlay.setDepth(200).setInteractive()

    // 📞 Titel
    const titel = this.add.text(breite / 2, hoehe * 0.15, '📞 Wen möchtest du anrufen?', {
      fontSize: '22px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(201)

    const elemente = [overlay, titel]

    // 🍕 Pizza-Laden anrufen!
    const pizzaBtn = this.add.text(breite / 2, hoehe * 0.4, '🍕 Pizza-Laden anrufen!\n🏙️ In die Stadt fahren', {
      fontSize: '18px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: '#E65100', padding: { x: 24, y: 14 },
      align: 'center'
    }).setOrigin(0.5).setDepth(201)
    pizzaBtn.setInteractive({ useHandCursor: true })
    pizzaBtn.on('pointerdown', () => {
      elemente.forEach(el => el.destroy())
      // 🚗 Ab in die Stadt!
      this.zeigeNachricht('🚗 Du fährst in die Stadt!')
      this.time.delayedCall(1000, () => {
        spielSpeichern('HausSzene', this.figurDaten, null)
        this.scene.start('StadtSzene', this.figurDaten)
      })
    })
    elemente.push(pizzaBtn)

    // ❌ Auflegen
    const auflegen = this.add.text(breite / 2, hoehe * 0.7, '📵 Auflegen', {
      fontSize: '18px', fontFamily: 'Arial', color: '#FF5252',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(201)
    auflegen.setInteractive({ useHandCursor: true })
    auflegen.on('pointerdown', () => {
      elemente.forEach(el => el.destroy())
    })
    elemente.push(auflegen)
  }

  // === 💻 COMPUTER STARTEN ===
  computerStarten() {
    soundKlick()

    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🎵 Computer-Start-Sound!
    const startToene = [262, 330, 392, 523]
    startToene.forEach((note, i) => {
      setTimeout(() => spieleTon(note, 0.1, 0.04, 'square'), i * 100)
    })

    // 💻 Bildschirm!
    const bildschirm = this.add.rectangle(breite / 2, hoehe / 2, breite * 0.85, hoehe * 0.75, 0x1a1a2e)
    bildschirm.setStrokeStyle(4, 0x4FC3F7).setDepth(300)

    const rahmen = this.add.rectangle(breite / 2, hoehe / 2, breite * 0.85 + 8, hoehe * 0.75 + 8, 0x333333)
    rahmen.setStrokeStyle(2, 0x666666).setDepth(299)

    // 🧑🧑 Milo sitzt neben dir am Computer! (unten links im Bildschirm)
    const miloEmoji = this.add.text(breite * 0.15, hoehe * 0.78, '🧑', {
      fontSize: '28px'
    }).setOrigin(0.5).setDepth(302)
    const miloBubble = this.add.text(breite * 0.28, hoehe * 0.76, '💬 Hey! Was\nspielen wir?', {
      fontSize: '10px', fontFamily: 'Arial', color: '#FF7043',
      backgroundColor: '#1a1a2e', padding: { x: 4, y: 2 },
      stroke: '#000000', strokeThickness: 1
    }).setOrigin(0, 0.5).setDepth(302)

    // 💻 Titel
    const titel = this.add.text(breite / 2, hoehe * 0.18, '💻 Milos Computer', {
      fontSize: '22px', fontFamily: 'Arial', color: '#4FC3F7',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(301)

    const elemente = [bildschirm, rahmen, titel, miloEmoji, miloBubble]

    // 🎮 Spiel-Button: Zahlen-Raten mit Milo!
    const spielBtn = this.add.text(breite / 2, hoehe * 0.33, '🎮 Zahlen-Raten mit Milo!\n🎲 Errate Milos Zahl!', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: '#7B1FA2', padding: { x: 16, y: 10 },
      align: 'center'
    }).setOrigin(0.5).setDepth(301)
    spielBtn.setInteractive({ useHandCursor: true })
    spielBtn.on('pointerdown', () => {
      elemente.forEach(el => el.destroy())
      this.zahlenRatenSpiel()
    })
    elemente.push(spielBtn)

    // 💬 Chat-Button: Mit Milo schreiben!
    const chatBtn = this.add.text(breite / 2, hoehe * 0.48, '💬 Mit Milo chatten!\n✏️ Schreib ihm was du willst!', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: '#1976D2', padding: { x: 16, y: 10 },
      align: 'center'
    }).setOrigin(0.5).setDepth(301)
    chatBtn.setInteractive({ useHandCursor: true })
    chatBtn.on('pointerdown', () => {
      elemente.forEach(el => el.destroy())
      this.computerChat()
    })
    elemente.push(chatBtn)

    // 🦔 Blitz-Button: Blitz-Geschichten gucken!
    const blitzBtn = this.add.text(breite / 2, hoehe * 0.64, '🦔 Blitz gucken!\n📺 Geschichten über den Igel!', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: '#388E3C', padding: { x: 16, y: 10 },
      align: 'center'
    }).setOrigin(0.5).setDepth(301)
    blitzBtn.setInteractive({ useHandCursor: true })
    blitzBtn.on('pointerdown', () => {
      elemente.forEach(el => el.destroy())
      this.blitzGucken()
    })
    elemente.push(blitzBtn)

    // ❌ Computer ausschalten
    const aus = this.add.text(breite / 2, hoehe * 0.82, '🔴 Aus', {
      fontSize: '12px', fontFamily: 'Arial', color: '#FF5252',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(301)
    aus.setInteractive({ useHandCursor: true })
    aus.on('pointerdown', () => {
      // 🎵 Ausschalt-Sound
      spieleTon(523, 0.1, 0.05, 'square')
      setTimeout(() => spieleTon(262, 0.15, 0.08, 'square'), 150)
      elemente.forEach(el => el.destroy())
    })
    elemente.push(aus)
  }

  // === 🎮 ZAHLEN-RATEN MIT MILO ===
  zahlenRatenSpiel() {
    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🎲 Milo denkt sich eine Zahl aus!
    const geheimeZahl = Phaser.Math.Between(1, 10)
    let versuche = 0

    // 💻 Bildschirm
    const bildschirm = this.add.rectangle(breite / 2, hoehe / 2, breite * 0.85, hoehe * 0.75, 0x1a1a2e)
    bildschirm.setStrokeStyle(4, 0x7B1FA2).setDepth(300)

    const titel = this.add.text(breite / 2, hoehe * 0.18, '🎲 Zahlen-Raten!\nMilo und du spielen zusammen! 🎮', {
      fontSize: '14px', fontFamily: 'Arial', color: '#CE93D8',
      stroke: '#000000', strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5).setDepth(301)

    // 🧑 Milo sitzt neben dir und reagiert!
    const miloGesicht = this.add.text(breite * 0.12, hoehe * 0.34, '🤔', {
      fontSize: '36px'
    }).setOrigin(0.5).setDepth(301)

    // 💬 Milos Sprechblase
    const miloSagt = this.add.text(breite * 0.12, hoehe * 0.45, 'Hehe, rate\nmal! 🤫', {
      fontSize: '10px', fontFamily: 'Arial', color: '#FF7043',
      stroke: '#000000', strokeThickness: 1,
      align: 'center'
    }).setOrigin(0.5).setDepth(301)

    const elemente = [bildschirm, titel, miloGesicht, miloSagt]

    // 🔢 Zahlen-Buttons (1-10)
    for (let z = 1; z <= 10; z++) {
      const spalte = (z - 1) % 5
      const zeile = Math.floor((z - 1) / 5)
      const x = breite * 0.2 + spalte * (breite * 0.15)
      const y = hoehe * 0.58 + zeile * 50

      const btn = this.add.text(x, y, `${z}`, {
        fontSize: '22px', fontFamily: 'Arial', color: '#ffffff',
        backgroundColor: '#5D4037',
        padding: { x: 14, y: 8 }
      }).setOrigin(0.5).setDepth(301)
      btn.setInteractive({ useHandCursor: true })

      btn.on('pointerdown', () => {
        versuche++
        spieleTon(400 + z * 50, 0.1, 0.04, 'sine')

        if (z === geheimeZahl) {
          // 🎉 RICHTIG!
          miloGesicht.setText('🥳')
          miloSagt.setText(`JAAA! ${z}! 🎉\n${versuche === 1 ? 'Erster Versuch!\nWOW! 🌟' : `${versuche}x geraten!`}`)
          miloSagt.setColor('#FFD700')

          // 🎵 Gewinn-Melodie!
          const melodie = [523, 659, 784, 1047]
          melodie.forEach((note, i) => {
            setTimeout(() => spieleTon(note, 0.15, 0.05, 'sine'), i * 150)
          })

          // Alle Buttons deaktivieren
          elemente.forEach(el => {
            if (el.input) el.removeInteractive()
          })

          // 🔄 Nochmal oder Zurück
          const nochmal = this.add.text(breite * 0.35, hoehe * 0.82, '🔄 Nochmal!', {
            fontSize: '14px', fontFamily: 'Arial', color: '#4CAF50',
            backgroundColor: '#2E7D32', padding: { x: 12, y: 6 }
          }).setOrigin(0.5).setDepth(301)
          nochmal.setInteractive({ useHandCursor: true })
          nochmal.on('pointerdown', () => {
            elemente.forEach(el => el.destroy())
            this.zahlenRatenSpiel()
          })
          elemente.push(nochmal)

          const zurueck = this.add.text(breite * 0.65, hoehe * 0.82, '💻 Zurück', {
            fontSize: '14px', fontFamily: 'Arial', color: '#FF5252',
            stroke: '#000000', strokeThickness: 2
          }).setOrigin(0.5).setDepth(301)
          zurueck.setInteractive({ useHandCursor: true })
          zurueck.on('pointerdown', () => {
            elemente.forEach(el => el.destroy())
            this.computerStarten()
          })
          elemente.push(zurueck)

        } else if (z < geheimeZahl) {
          // ⬆️ Zu klein!
          miloGesicht.setText('🤭')
          miloSagt.setText(`Nee! ${z} ist\nzu klein! ⬆️`)
          btn.setStyle({ backgroundColor: '#2196F3' })
          btn.removeInteractive()
        } else {
          // ⬇️ Zu groß!
          miloGesicht.setText('😏')
          miloSagt.setText(`Nee! ${z} ist\nzu groß! ⬇️`)
          btn.setStyle({ backgroundColor: '#FF9800' })
          btn.removeInteractive()
        }
      })
      elemente.push(btn)
    }

    // ❌ Aufhören
    const stop = this.add.text(breite / 2, hoehe * 0.82, '❌ Aufhören', {
      fontSize: '13px', fontFamily: 'Arial', color: '#FF5252',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(301)
    stop.setInteractive({ useHandCursor: true })
    stop.on('pointerdown', () => {
      elemente.forEach(el => el.destroy())
      this.computerStarten()
    })
    elemente.push(stop)
  }

  // === 🦔📺 BLITZ GUCKEN – Folgen über den Igel Blitz! ===
  blitzGucken() {
    soundKlick()

    const breite = this.scale.width
    const hoehe = this.scale.height

    // 📺 Alle Blitz-Folgen!
    const folgen = [
      {
        titel: 'Folge 1: Der große Regen',
        szenen: [
          { text: '🦔 Blitz der kleine Igel wacht auf...', emoji: '🦔', bg: 0x4CAF50, dauer: 3000 },
          { text: '☁️ "Oh nein! Es regnet!"', emoji: '🌧️', bg: 0x546E7A, dauer: 2500 },
          { text: '🦔 Blitz läuft los! Er sucht einen trockenen Platz!', emoji: '🏃', bg: 0x546E7A, dauer: 2500 },
          { text: '🍄 Er findet einen riesigen Pilz!', emoji: '🍄', bg: 0x795548, dauer: 2500 },
          { text: '🦔 "Perfekt!" Blitz kuschelt sich drunter!', emoji: '🦔', bg: 0x795548, dauer: 2500 },
          { text: '🐌 Eine Schnecke kommt vorbei!\n"Darf ich auch drunter?"', emoji: '🐌', bg: 0x795548, dauer: 3000 },
          { text: '🦔 "Na klar!" Zusammen ist es\nviel gemütlicher! 💕', emoji: '🦔🐌', bg: 0x795548, dauer: 3000 },
          { text: '☀️ Der Regen hört auf!\nEin Regenbogen erscheint! 🌈', emoji: '🌈', bg: 0x42A5F5, dauer: 3000 },
          { text: '🦔 "Was für ein toller Tag!" 🎉', emoji: '⭐', bg: 0x42A5F5, dauer: 3000 },
        ]
      },
      {
        titel: 'Folge 2: Der Schatz im Wald',
        szenen: [
          { text: '🦔 Blitz spaziert durch den Wald...', emoji: '🦔', bg: 0x2E7D32, dauer: 2500 },
          { text: '🗺️ Er findet eine alte Karte!', emoji: '🗺️', bg: 0x2E7D32, dauer: 2500 },
          { text: '🦔 "Ein Schatz?!" Blitz ist aufgeregt!', emoji: '😲', bg: 0x33691E, dauer: 2500 },
          { text: '🌳 Er folgt der Karte zum großen Baum!', emoji: '🌳', bg: 0x33691E, dauer: 2500 },
          { text: '🕳️ Am Baum ist ein Loch! Er guckt rein...', emoji: '👀', bg: 0x4E342E, dauer: 2500 },
          { text: '✨ ES GLITZERT! Ein wunderschöner Stein!', emoji: '💎', bg: 0x4E342E, dauer: 3000 },
          { text: '🦔 Blitz nimmt den Stein mit nach Hause!', emoji: '🦔', bg: 0x2E7D32, dauer: 2500 },
          { text: '🌙 Nachts leuchtet der Stein ganz sanft... ✨', emoji: '✨', bg: 0x1a237e, dauer: 3000 },
          { text: '🦔 Blitz schläft ein mit einem Lächeln! 😊', emoji: '💤', bg: 0x1a237e, dauer: 3000 },
        ]
      },
      {
        titel: 'Folge 3: Die Pizza-Party',
        szenen: [
          { text: '🦔 Blitz hat eine TOLLE Idee!', emoji: '💡', bg: 0xFF8F00, dauer: 2500 },
          { text: '🍕 "Ich mache eine Pizza-Party!"', emoji: '🍕', bg: 0xE65100, dauer: 2500 },
          { text: '🧀 Er sammelt Tomaten und Käse!', emoji: '🍅', bg: 0x4CAF50, dauer: 2500 },
          { text: '🍕 Blitz backt die Pizza!\nEs duftet soooo gut! 😋', emoji: '🍕', bg: 0xE65100, dauer: 3000 },
          { text: '🐿️ Das Eichhörnchen riecht es!\n"Mmmh was ist das?!"', emoji: '🐿️', bg: 0x4CAF50, dauer: 2500 },
          { text: '🐰 Auch der Hase kommt angehoppelt!', emoji: '🐰', bg: 0x4CAF50, dauer: 2500 },
          { text: '🦔🐿️🐰 Alle essen zusammen Pizza!\n"LECKER!" 🍕', emoji: '🍕', bg: 0xE65100, dauer: 3000 },
          { text: '🎉 Die beste Party EVER!', emoji: '🎉', bg: 0xE65100, dauer: 2500 },
          { text: '🦔 "Morgen machen wir das wieder!" 🍕💕', emoji: '⭐', bg: 0xFF8F00, dauer: 3000 },
        ]
      },
      {
        titel: 'Folge 4: Blitz lernt fliegen',
        szenen: [
          { text: '🦋 Ein Schmetterling fliegt vorbei...', emoji: '🦋', bg: 0x42A5F5, dauer: 2500 },
          { text: '🦔 "Ich will auch fliegen!"', emoji: '🦔', bg: 0x42A5F5, dauer: 2500 },
          { text: '🏔️ Blitz klettert auf einen Hügel!', emoji: '🦔', bg: 0x4CAF50, dauer: 2500 },
          { text: '🦔 Er springt... und fällt runter! 😅', emoji: '💥', bg: 0x795548, dauer: 2500 },
          { text: '🐦 "Du brauchst Flügel!" sagt ein Vogel.', emoji: '🐦', bg: 0x42A5F5, dauer: 2500 },
          { text: '💡 Blitz hat eine Idee!', emoji: '💡', bg: 0xFF8F00, dauer: 2000 },
          { text: '🍃 Er bastelt sich Flügel aus Blättern!', emoji: '🍃', bg: 0x4CAF50, dauer: 2500 },
          { text: '🦔🍃 Er springt... und GLEITET! WOHOOO!', emoji: '🦔', bg: 0x42A5F5, dauer: 3000 },
          { text: '🎉 "Ich bin GEFLOGEN!" 🐦🦋 Alle klatschen!\n\nNaja... fast! 😄', emoji: '⭐', bg: 0x42A5F5, dauer: 3500 },
        ]
      },
      {
        titel: 'Folge 5: Die Sternschnuppe',
        szenen: [
          { text: '🌙 Es ist Nacht. Blitz kann nicht schlafen...', emoji: '🌙', bg: 0x1a237e, dauer: 2500 },
          { text: '🦔 Er geht nach draußen und schaut hoch!', emoji: '🦔', bg: 0x1a237e, dauer: 2500 },
          { text: '⭐ WOW! So viele Sterne!', emoji: '⭐', bg: 0x0D47A1, dauer: 2500 },
          { text: '🌟 Ein Stern blinkt ganz hell!\n"Blinkt der nur für mich?"', emoji: '🌟', bg: 0x0D47A1, dauer: 3000 },
          { text: '💫 EINE STERNSCHNUPPE!!!', emoji: '💫', bg: 0x0D47A1, dauer: 2500 },
          { text: '🦔 Schnell! Blitz wünscht sich was!', emoji: '🦔', bg: 0x1a237e, dauer: 2500 },
          { text: '💕 "Ich wünsche mir...\ndass alle meine Freunde\nglücklich sind!"', emoji: '💕', bg: 0x1a237e, dauer: 3500 },
          { text: '⭐ Die Sterne leuchten noch heller! ✨', emoji: '✨', bg: 0x0D47A1, dauer: 2500 },
          { text: '🦔 Blitz lächelt und geht schlafen.\nMorgen wird ein toller Tag! 😊', emoji: '⭐', bg: 0x1a237e, dauer: 3500 },
        ]
      },
      {
        titel: 'Folge 6: Der mutige Igel',
        szenen: [
          { text: '🐿️ Das Eichhörnchen ruft um Hilfe!\n"Meine Nüsse sind weg!"', emoji: '🐿️', bg: 0x4CAF50, dauer: 3000 },
          { text: '🦔 Blitz kommt angerannt!\n"Ich helfe dir!"', emoji: '🦔', bg: 0x4CAF50, dauer: 2500 },
          { text: '🔍 Blitz folgt den Spuren im Gras...', emoji: '🔍', bg: 0x2E7D32, dauer: 2500 },
          { text: '🕳️ Die Spuren führen zu einer dunklen Höhle!', emoji: '🕳️', bg: 0x37474F, dauer: 2500 },
          { text: '🦔 Blitz schluckt... aber er geht rein!\nEr ist mutig! 💪', emoji: '💪', bg: 0x263238, dauer: 3000 },
          { text: '🐦 Drin sitzt ein kleiner Vogel!\nEr hatte Hunger! 🥺', emoji: '🐦', bg: 0x37474F, dauer: 3000 },
          { text: '🦔 "Hier, nimm die Hälfte.\nAber die anderen gehören dem Eichhörnchen!"', emoji: '🦔', bg: 0x4CAF50, dauer: 3500 },
          { text: '🐿️🐦 Alle teilen fair!\nDer Vogel hat jetzt Freunde! 💕', emoji: '💕', bg: 0x4CAF50, dauer: 3000 },
          { text: '🦔 Blitz ist ein Held! 🎉⭐', emoji: '⭐', bg: 0x4CAF50, dauer: 3000 },
        ]
      },
      {
        titel: 'Folge 7: Blitz im Schnee',
        szenen: [
          { text: '❄️ Es schneit! Alles ist weiß!', emoji: '❄️', bg: 0x90CAF9, dauer: 2500 },
          { text: '🦔 "SCHNEE! Wie cool!" ruft Blitz!', emoji: '🦔', bg: 0x90CAF9, dauer: 2500 },
          { text: '⛄ Er baut einen Schneemann!\nMit Karotten-Nase! 🥕', emoji: '⛄', bg: 0xBBDEFB, dauer: 3000 },
          { text: '🐰 Der Hase will auch mitmachen!\n"Ich mach die Arme!"', emoji: '🐰', bg: 0xBBDEFB, dauer: 2500 },
          { text: '❄️ SCHNEEBALLSCHLACHT! 🎯', emoji: '🎯', bg: 0x90CAF9, dauer: 2500 },
          { text: '🦔 PLATSCH! 😂 Blitz wird getroffen!', emoji: '💥', bg: 0x90CAF9, dauer: 2500 },
          { text: '🦔🐰🐿️ Alle lachen und spielen im Schnee!', emoji: '😂', bg: 0xBBDEFB, dauer: 2500 },
          { text: '☕ Danach gibt es heißen Kakao!\nMit Marshmallows! 🍫', emoji: '☕', bg: 0x5D4037, dauer: 3000 },
          { text: '🦔 "Das war der beste Schneetag ever!" ❄️⭐', emoji: '⭐', bg: 0x90CAF9, dauer: 3000 },
        ]
      },
      {
        titel: 'Folge 8: Das Geburtstags-Fest',
        szenen: [
          { text: '🎂 Heute hat Blitz Geburtstag!', emoji: '🎂', bg: 0xE91E63, dauer: 2500 },
          { text: '🦔 Aber... wo sind alle seine Freunde?\nEs ist so still! 🥺', emoji: '🦔', bg: 0x795548, dauer: 3000 },
          { text: '🦔 Blitz geht traurig spazieren...\n"Hat mich jeder vergessen?"', emoji: '😢', bg: 0x795548, dauer: 3000 },
          { text: '🦔 Er geht nach Hause zurück...', emoji: '🦔', bg: 0x795548, dauer: 2500 },
          { text: '🎉 ÜBERRASCHUNG!!!\n🐰🐿️🐦🐌 Alle sind da! 🎊', emoji: '🎉', bg: 0xE91E63, dauer: 3000 },
          { text: '🎂 Eine riesige Torte mit Kerzen!\n🕯️🕯️🕯️🕯️🕯️', emoji: '🎂', bg: 0xE91E63, dauer: 3000 },
          { text: '🦔 *pust!* Blitz bläst die Kerzen aus!\n"DANKE ihr seid die BESTEN!" 😭💕', emoji: '💕', bg: 0xE91E63, dauer: 3500 },
          { text: '🎁 So viele Geschenke!\n🐰 gibt ihm eine Mütze! 🧢', emoji: '🎁', bg: 0xE91E63, dauer: 2500 },
          { text: '🦔 Beste. Party. EVER! 🎉⭐💕', emoji: '⭐', bg: 0xE91E63, dauer: 3000 },
        ]
      }
    ]

    // 📺 Folgen-Auswahl Bildschirm!
    const bildschirm = this.add.rectangle(breite / 2, hoehe / 2, breite * 0.85, hoehe * 0.75, 0x1a1a2e)
    bildschirm.setStrokeStyle(4, 0x66BB6A).setDepth(300)

    const titel = this.add.text(breite / 2, hoehe * 0.16, '📺 Blitz - Der kleine Igel 🦔', {
      fontSize: '16px', fontFamily: 'Arial', color: '#66BB6A',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(301)

    const elemente = [bildschirm, titel]

    // 📺 Folgen-Liste zum Auswählen!
    const startY = hoehe * 0.28
    const abstand = 28

    folgen.forEach((folge, i) => {
      const y = startY + i * abstand
      const btn = this.add.text(breite / 2, y, `▶️ ${folge.titel}`, {
        fontSize: '12px', fontFamily: 'Arial', color: '#ffffff',
        stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(301)
      btn.setInteractive({ useHandCursor: true })
      btn.on('pointerover', () => btn.setColor('#66BB6A'))
      btn.on('pointerout', () => btn.setColor('#ffffff'))
      btn.on('pointerdown', () => {
        elemente.forEach(el => el.destroy())
        this.blitzFolgeAbspielen(folge)
      })
      elemente.push(btn)
    })

    // 🔙 Zurück-Button
    const zurueck = this.add.text(breite / 2, hoehe * 0.82, '💻 Zurück', {
      fontSize: '14px', fontFamily: 'Arial', color: '#FF5252',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(301)
    zurueck.setInteractive({ useHandCursor: true })
    zurueck.on('pointerdown', () => {
      elemente.forEach(el => el.destroy())
      this.computerStarten()
    })
    elemente.push(zurueck)
  }

  // === 📺 BLITZ-FOLGE ABSPIELEN! ===
  blitzFolgeAbspielen(folge) {
    soundKlick()

    const breite = this.scale.width
    const hoehe = this.scale.height

    // 📺 Bildschirm
    const bildschirm = this.add.rectangle(breite / 2, hoehe / 2, breite * 0.85, hoehe * 0.75, 0x000000)
    bildschirm.setStrokeStyle(4, 0x66BB6A).setDepth(300)

    // 🎬 Intro-Jingle!
    const jingle = [523, 659, 784, 1047, 784, 1047]
    jingle.forEach((note, i) => {
      setTimeout(() => spieleTon(note, 0.1, 0.06, 'sine'), i * 120)
    })

    // 📺 Intro: Titel einblenden!
    const introText = this.add.text(breite / 2, hoehe * 0.45, `📺 ${folge.titel}`, {
      fontSize: '18px', fontFamily: 'Arial', color: '#66BB6A',
      stroke: '#000000', strokeThickness: 4, align: 'center'
    }).setOrigin(0.5).setDepth(302).setAlpha(0)

    const elemente = [bildschirm, introText]

    // 🎬 Titel reinzoomen!
    this.tweens.add({
      targets: introText,
      alpha: 1, scale: { from: 0.3, to: 1 },
      duration: 800, ease: 'Back.easeOut'
    })

    // 📺 Nach 3 Sekunden: Erste Szene starten!
    this.time.delayedCall(3000, () => {
      introText.destroy()

      let szeneIndex = 0

      // 🎬 Hintergrund (mit sanftem Einblenden)
      const hg = this.add.rectangle(breite / 2, hoehe / 2, breite * 0.83, hoehe * 0.73, folge.szenen[0].bg)
      hg.setDepth(301).setAlpha(0)
      this.tweens.add({ targets: hg, alpha: 1, duration: 600 })
      elemente.push(hg)

      // 🦔 Großes Emoji – bewegt sich auf und ab wie es atmet!
      const grossesEmoji = this.add.text(breite / 2, hoehe * 0.38, folge.szenen[0].emoji, {
        fontSize: '52px'
      }).setOrigin(0.5).setDepth(303)
      elemente.push(grossesEmoji)

      // 🫁 Atem-Animation – Emoji bewegt sich sanft hoch und runter!
      const atemTween = this.tweens.add({
        targets: grossesEmoji,
        y: hoehe * 0.38 - 6,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })

      // ✨ Kleine Sterne/Funken die im Hintergrund schweben!
      const funken = []
      for (let i = 0; i < 5; i++) {
        const funke = this.add.text(
          Phaser.Math.Between(breite * 0.15, breite * 0.85),
          Phaser.Math.Between(hoehe * 0.18, hoehe * 0.6),
          Phaser.Math.RND.pick(['✨', '⭐', '💫', '·', '•']),
          { fontSize: Phaser.Math.Between(6, 12) + 'px' }
        ).setOrigin(0.5).setDepth(302).setAlpha(0.3)
        // 🌟 Jeder Funke schwebt langsam hoch!
        this.tweens.add({
          targets: funke,
          y: funke.y - Phaser.Math.Between(15, 40),
          alpha: { from: 0.1, to: 0.6 },
          duration: Phaser.Math.Between(2000, 4000),
          yoyo: true, repeat: -1,
          delay: Phaser.Math.Between(0, 2000)
        })
        funken.push(funke)
        elemente.push(funke)
      }

      // 📺 Text unten – größer damit man besser lesen kann!
      const szenenText = this.add.text(breite / 2, hoehe * 0.68, folge.szenen[0].text, {
        fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
        stroke: '#000000', strokeThickness: 3,
        align: 'center', wordWrap: { width: breite * 0.7 },
        lineSpacing: 6
      }).setOrigin(0.5).setDepth(303)
      elemente.push(szenenText)

      // 📺 Fortschrittsbalken unten
      const balkenHg = this.add.rectangle(breite / 2, hoehe * 0.87, breite * 0.6, 6, 0x333333)
      balkenHg.setDepth(303)
      elemente.push(balkenHg)
      const balken = this.add.rectangle(breite / 2 - (breite * 0.3), hoehe * 0.87, 0, 6, 0x66BB6A)
      balken.setOrigin(0, 0.5).setDepth(304)
      elemente.push(balken)

      // 🎵 Szenen-Sound
      const spieleSzenenSound = () => {
        const toene = [330 + szeneIndex * 30, 392 + szeneIndex * 20]
        toene.forEach((note, i) => {
          setTimeout(() => spieleTon(note, 0.08, 0.04, 'sine'), i * 100)
        })
      }
      spieleSzenenSound()

      // 📺 Nächste Szene Funktion
      const naechsteSzene = () => {
        szeneIndex++
        if (szeneIndex >= folge.szenen.length) {
          // 🎬 ENDE!
          hg.setFillStyle(0x1a237e)
          grossesEmoji.setText('⭐')
          atemTween.stop()
          // ⭐ Stern dreht sich am Ende!
          this.tweens.add({
            targets: grossesEmoji,
            angle: 360, scale: 1.3,
            duration: 1500, ease: 'Sine.easeInOut'
          })
          szenenText.setText('📺 Ende! 🦔⭐\n\nHat dir die Folge gefallen?')
          balken.setDisplaySize(breite * 0.6, 6)
          // ✨ Funken verschwinden lassen
          funken.forEach(f => this.tweens.add({ targets: f, alpha: 0, duration: 500 }))

          // 🎵 Ende-Jingle
          const endeJingle = [784, 659, 784, 1047]
          endeJingle.forEach((note, i) => {
            setTimeout(() => spieleTon(note, 0.12, 0.06, 'sine'), i * 200)
          })

          // 📺 Buttons: Nochmal oder Zurück
          const nochmal = this.add.text(breite * 0.35, hoehe * 0.84, '🔄 Nochmal!', {
            fontSize: '12px', fontFamily: 'Arial', color: '#4CAF50',
            backgroundColor: '#2E7D32', padding: { x: 8, y: 4 }
          }).setOrigin(0.5).setDepth(305)
          nochmal.setInteractive({ useHandCursor: true })
          nochmal.on('pointerdown', () => {
            elemente.forEach(el => el.destroy())
            nochmal.destroy()
            zurueck.destroy()
            this.blitzFolgeAbspielen(folge)
          })

          const zurueck = this.add.text(breite * 0.65, hoehe * 0.84, '📺 Andere Folge', {
            fontSize: '12px', fontFamily: 'Arial', color: '#FF5252',
            stroke: '#000000', strokeThickness: 2
          }).setOrigin(0.5).setDepth(305)
          zurueck.setInteractive({ useHandCursor: true })
          zurueck.on('pointerdown', () => {
            elemente.forEach(el => el.destroy())
            nochmal.destroy()
            zurueck.destroy()
            this.blitzGucken()
          })

          return
        }

        // 🎬 Nächste Szene!
        const szene = folge.szenen[szeneIndex]

        // 🎨 Hintergrund-Farbe sanft wechseln
        this.tweens.addCounter({
          from: 0, to: 1, duration: 600,
          onUpdate: (tween) => {
            hg.setFillStyle(szene.bg, 0.5 + tween.getValue() * 0.5)
          },
          onComplete: () => hg.setFillStyle(szene.bg)
        })

        // 🦔 Emoji wechseln – hüpft von der Seite rein!
        const vonLinks = szeneIndex % 2 === 0
        grossesEmoji.setText(szene.emoji)
        grossesEmoji.setX(vonLinks ? breite * 0.05 : breite * 0.95)
        grossesEmoji.setScale(0.5)
        grossesEmoji.setAngle(vonLinks ? -20 : 20)
        this.tweens.add({
          targets: grossesEmoji,
          x: breite / 2,
          scale: 1,
          angle: 0,
          duration: 600,
          ease: 'Back.easeOut'
        })

        // 📝 Text reinblenden mit leichtem Hochschieben
        szenenText.setText(szene.text)
        szenenText.setAlpha(0)
        szenenText.setY(hoehe * 0.72)
        this.tweens.add({
          targets: szenenText,
          alpha: 1,
          y: hoehe * 0.68,
          duration: 700,
          ease: 'Power2'
        })

        // ✨ Funken neue Positionen
        funken.forEach(f => {
          f.setX(Phaser.Math.Between(breite * 0.15, breite * 0.85))
          f.setText(Phaser.Math.RND.pick(['✨', '⭐', '💫', '·', '•']))
        })

        // 📊 Fortschrittsbalken updaten
        const fortschritt = (szeneIndex / (folge.szenen.length - 1)) * breite * 0.6
        this.tweens.add({ targets: balken, displayWidth: fortschritt, duration: 300 })

        // 🎵 Sound
        spieleSzenenSound()

        // ⏰ Timer für nächste Szene (x2 damit man lesen kann!)
        this.blitzTimer = this.time.delayedCall(szene.dauer * 2, naechsteSzene)
      }

      // ⏰ Timer für erste Szene starten! (x2 damit man lesen kann!)
      this.blitzTimer = this.time.delayedCall(folge.szenen[0].dauer * 2, naechsteSzene)

      // ⏸️ Antippen = Pause/Weiter
      bildschirm.setInteractive()
      let pausiert = false
      const pauseText = this.add.text(breite / 2, hoehe * 0.15, '', {
        fontSize: '11px', fontFamily: 'Arial', color: '#FFD700',
        stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(305)
      elemente.push(pauseText)

      bildschirm.on('pointerdown', () => {
        if (szeneIndex >= folge.szenen.length) return
        if (pausiert) {
          // ▶️ Weiter!
          pausiert = false
          pauseText.setText('')
          naechsteSzene()
        } else {
          // ⏸️ Pause!
          pausiert = true
          pauseText.setText('⏸️ Pause – Tippe zum Weitergucken!')
          if (this.blitzTimer) this.blitzTimer.remove()
        }
      })
    })
  }

  // === 💬 COMPUTER-CHAT MIT MILO ===
  computerChat() {
    const breite = this.scale.width
    const hoehe = this.scale.height

    // 💻 Bildschirm
    const bildschirm = this.add.rectangle(breite / 2, hoehe / 2, breite * 0.85, hoehe * 0.75, 0x1a1a2e)
    bildschirm.setStrokeStyle(4, 0x1976D2).setDepth(300)

    const titel = this.add.text(breite / 2, hoehe * 0.18, '💬 Chat mit Milo', {
      fontSize: '20px', fontFamily: 'Arial', color: '#4FC3F7',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(301)

    // 💬 Chat-Verlauf Bereich
    const chatBg = this.add.rectangle(breite / 2, hoehe * 0.44, breite * 0.75, hoehe * 0.38, 0x0d1b2a)
    chatBg.setStrokeStyle(1, 0x1976D2).setDepth(301)

    const elemente = [bildschirm, titel, chatBg]
    const chatNachrichten = []

    // 🧑 Milo begrüßt dich!
    const begruessung = this.add.text(breite * 0.18, hoehe * 0.3,
      '🧑 Milo: Hey! Schreib mir\nwas du willst! 😊', {
      fontSize: '11px', fontFamily: 'Arial', color: '#FF7043',
      stroke: '#000000', strokeThickness: 1,
      wordWrap: { width: breite * 0.6 }
    }).setDepth(302)
    elemente.push(begruessung)
    chatNachrichten.push(begruessung)

    let chatY = hoehe * 0.38

    // 📝 HTML-Eingabefeld
    const gameDiv = document.getElementById('game') || document.body
    const eingabeContainer = document.createElement('div')
    eingabeContainer.style.cssText = 'position:absolute;bottom:18%;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:999;'

    const eingabeFeld = document.createElement('input')
    eingabeFeld.type = 'text'
    eingabeFeld.placeholder = '✏️ Schreib Milo etwas...'
    eingabeFeld.maxLength = 80
    eingabeFeld.style.cssText = 'font-size:16px;padding:8px 14px;border-radius:16px;border:2px solid #4FC3F7;background:#1a1a2e;color:#fff;width:200px;outline:none;font-family:Arial;'

    const sendenBtn = document.createElement('button')
    sendenBtn.textContent = '📨'
    sendenBtn.style.cssText = 'font-size:22px;padding:6px 14px;border-radius:16px;border:2px solid #4FC3F7;background:#1976D2;cursor:pointer;'

    eingabeContainer.appendChild(eingabeFeld)
    eingabeContainer.appendChild(sendenBtn)
    gameDiv.appendChild(eingabeContainer)

    // 📨 Nachricht senden
    const sendeNachricht = () => {
      const text = eingabeFeld.value.trim()
      if (!text) return
      eingabeFeld.value = ''

      // 🎵 Sende-Sound
      spieleTon(600, 0.08, 0.03, 'sine')

      // Alte Nachrichten nach oben schieben
      chatNachrichten.forEach(n => {
        n.y -= 28
        if (n.y < hoehe * 0.26) { n.setAlpha(0.3) }
      })

      // 💬 Eigene Nachricht anzeigen
      const eigene = this.add.text(breite * 0.82, chatY,
        '🗣️ Du: ' + text, {
        fontSize: '11px', fontFamily: 'Arial', color: '#4FC3F7',
        stroke: '#000000', strokeThickness: 1,
        wordWrap: { width: breite * 0.6 }
      }).setOrigin(1, 0).setDepth(302)
      elemente.push(eigene)
      chatNachrichten.push(eigene)

      // 🧑 Milo antwortet nach kurzer Pause
      this.time.delayedCall(800, () => {
        // Nochmal schieben für Milos Antwort
        chatNachrichten.forEach(n => {
          n.y -= 28
          if (n.y < hoehe * 0.26) { n.setAlpha(0.3) }
        })

        // 🧠 Milo-Antwort generieren (nutze das gleiche System wie auf der Wiese!)
        const antwort = this.miloAntwortComputer(text)

        // 🎵 Milos Stimme
        const stimme = [300, 350, 330]
        stimme.forEach((note, i) => {
          setTimeout(() => spieleTon(note, 0.06, 0.03, 'triangle'), i * 80)
        })

        const miloMsg = this.add.text(breite * 0.18, chatY,
          '🧑 Milo: ' + antwort, {
          fontSize: '11px', fontFamily: 'Arial', color: '#FF7043',
          stroke: '#000000', strokeThickness: 1,
          wordWrap: { width: breite * 0.6 }
        }).setDepth(302)
        elemente.push(miloMsg)
        chatNachrichten.push(miloMsg)
      })
    }

    sendenBtn.addEventListener('click', sendeNachricht)
    eingabeFeld.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendeNachricht()
    })

    // ❌ Chat schließen
    const schliessen = this.add.text(breite / 2, hoehe * 0.82, '❌ Chat beenden', {
      fontSize: '13px', fontFamily: 'Arial', color: '#FF5252',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(301)
    schliessen.setInteractive({ useHandCursor: true })
    schliessen.on('pointerdown', () => {
      eingabeContainer.remove()
      elemente.forEach(el => el.destroy())
      this.computerStarten()
    })
    elemente.push(schliessen)
  }

  // 🧠 Milo-Antwort im Computer-Chat!
  miloAntwortComputer(nachricht) {
    const text = nachricht.toLowerCase()

    if (text.match(/hallo|hi |hey|guten|moin/)) {
      return Phaser.Math.RND.pick(['Hey! 😊', 'Hallo! Wie geht\'s? 👋', 'Hi! Schön von dir zu hören! 💕'])
    }
    if (text.match(/wie geht|geht es dir|geht dir/)) {
      return Phaser.Math.RND.pick(['Mir geht es super! 😄', 'Toll! Und dir? 🥰', 'Mega gut! 🌟'])
    }
    if (text.match(/lieb|freund|mag dich|best/)) {
      return Phaser.Math.RND.pick(['Aww! Du bist auch toll! ❤️', 'Ich hab dich auch lieb! 💕', 'Du bist meine beste Freundin! 🌟'])
    }
    if (text.match(/spiel|spaß|langweil/)) {
      return Phaser.Math.RND.pick(['Lass uns Zahlen raten! 🎲', 'Mir macht chatten Spaß! 😄', 'Wollen wir was bauen? 🏠'])
    }
    if (text.match(/hund|bello|welp/)) {
      return Phaser.Math.RND.pick(['Bello ist sooo süß! 🐕', 'Die Welpen sind knuffig! 🐾', 'Wuff wuff! Haha! 😄'])
    }
    if (text.match(/pizza|essen|hunger/)) {
      return Phaser.Math.RND.pick(['Mmh, Pizza! 🍕', 'Ich LIEBE Pizza! 😋', 'Hol mir eine Pizza! 🍕🥺'])
    }
    if (text.match(/witz|lustig|lach|haha/)) {
      return Phaser.Math.RND.pick(['Haha! 😂', 'Was ist orange und klingt\nwie ein Papagei? Eine Möhre! 🥕😂', 'Du bist SO lustig! 🤣'])
    }
    if (text.match(/nacht|schlaf|müde/)) {
      return Phaser.Math.RND.pick(['Gute Nacht! 💤🌙', 'Schlaf gut! Träum schön! 😴', 'Bis morgen! 🌟'])
    }
    if (text.match(/mine|grab|eisen|stein/)) {
      return Phaser.Math.RND.pick(['Die Mine ist spannend! ⛏️', 'Pass auf die Fledermäuse auf! 🦇', 'Such nach Edelsteinen! 💎'])
    }
    if (text.match(/blume|natur|baum|wiese/)) {
      return Phaser.Math.RND.pick(['Die Blumen sind hübsch! 🌸', 'Ich liebe die Wiese! 🌿', 'Pflück mir eine Blume! 🌺'])
    }
    if (text.match(/geheim|zauber|magie/)) {
      return Phaser.Math.RND.pick(['Psst! 🤫 Ich hab ein Geheimnis...', 'Magie ist überall! ✨', 'Du bist magisch! 🔮'])
    }

    return Phaser.Math.RND.pick([
      'Cool! 😊', 'Echt? Erzähl mehr! 🤩',
      'Hihi, das ist lustig! 😄', 'Wow! 🌟',
      'Ich mag wenn du mir schreibst! 💬',
      'Das finde ich auch! 👍',
      'Haha, du bist witzig! 😂',
      'Oooh, interessant! 🤔',
    ])
  }

  schlafen(bettSprite) {
    this.schlaft = true
    soundKlick()

    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🚶 Zum Bett laufen!
    this.zielX = bettSprite.x
    this.zielY = bettSprite.y

    // ⏳ Kurz warten bis Spieler am Bett ist
    this.time.delayedCall(800, () => {
      // 🚶 Spieler stoppen
      this.spieler.body.setVelocity(0, 0)
      this.zielX = null
      this.zielY = null

      // 🛏️ Spieler "legt sich hin" (verschwindet im Bett)
      this.tweens.add({
        targets: this.spieler,
        x: bettSprite.x,
        y: bettSprite.y + 5,
        alpha: 0.3,
        duration: 500
      })

      // 💤 "Zzz" Blasen!
      const zzz1 = this.add.text(bettSprite.x + 20, bettSprite.y - 20, '💤', {
        fontSize: '20px'
      }).setDepth(100).setAlpha(0)
      const zzz2 = this.add.text(bettSprite.x + 35, bettSprite.y - 40, '💤', {
        fontSize: '16px'
      }).setDepth(100).setAlpha(0)
      const zzz3 = this.add.text(bettSprite.x + 45, bettSprite.y - 60, '💤', {
        fontSize: '12px'
      }).setDepth(100).setAlpha(0)

      // 💤 Zzz nacheinander erscheinen und hochschweben!
      this.tweens.add({
        targets: zzz1, alpha: 1, y: zzz1.y - 15,
        duration: 800, delay: 300, yoyo: true, repeat: 2
      })
      this.tweens.add({
        targets: zzz2, alpha: 1, y: zzz2.y - 15,
        duration: 800, delay: 600, yoyo: true, repeat: 2
      })
      this.tweens.add({
        targets: zzz3, alpha: 1, y: zzz3.y - 15,
        duration: 800, delay: 900, yoyo: true, repeat: 2
      })

      // 🌙 Schlaf-Sound (leise, beruhigende Töne)
      const schlafMelodie = [262, 294, 330, 294, 262]
      schlafMelodie.forEach((note, i) => {
        setTimeout(() => spieleTon(note, 0.4, 0.05, 'sine'), i * 400)
      })

      // 🌙 Bildschirm wird langsam dunkel
      const dunkel = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0)
      dunkel.setDepth(90)
      this.tweens.add({
        targets: dunkel,
        alpha: 0.7,
        duration: 2500
      })

      // 🛏️ Gute-Nacht-Nachricht
      const guteNacht = this.add.text(breite / 2, hoehe * 0.3,
        '🌙 Gute Nacht! 💤\n🛏️ Du schläfst gemütlich...', {
          fontSize: '24px', fontFamily: 'Arial', color: '#FFD700',
          stroke: '#000000', strokeThickness: 4, align: 'center'
        }).setOrigin(0.5).setDepth(200).setAlpha(0)

      this.tweens.add({
        targets: guteNacht,
        alpha: 1,
        duration: 1000,
        delay: 1500
      })

      // ☀️ Nach 6 Sekunden: Aufwachen!
      this.time.delayedCall(6000, () => {
        guteNacht.destroy()
        zzz1.destroy()
        zzz2.destroy()
        zzz3.destroy()

        // ☀️ "Guten Morgen" Nachricht
        const morgen = this.add.text(breite / 2, hoehe * 0.3,
          '☀️ Guten Morgen! 😊\nDu hast super geschlafen!', {
            fontSize: '24px', fontFamily: 'Arial', color: '#FFD700',
            stroke: '#000000', strokeThickness: 4, align: 'center'
          }).setOrigin(0.5).setDepth(200)

        // ☀️ Aufwach-Sound (fröhlich!)
        const aufwachMelodie = [330, 392, 523, 659]
        aufwachMelodie.forEach((note, i) => {
          setTimeout(() => spieleTon(note, 0.2, 0.1, 'sine'), i * 150)
        })

        // ☀️ Bildschirm wird wieder hell
        this.tweens.add({
          targets: dunkel,
          alpha: 0,
          duration: 1500,
          onComplete: () => dunkel.destroy()
        })

        // 🚶 Spieler wacht auf!
        this.tweens.add({
          targets: this.spieler,
          alpha: 1,
          y: bettSprite.y - 30,
          duration: 800
        })

        this.time.delayedCall(2500, () => {
          morgen.destroy()
          this.schlaft = false
          // ☀️ Nach dem Schlafen ist es Morgen!
          hausDaten.tagesZeit = 'morgen'
          // 🌱 Merken: Kinder sollen auf der Wiese wachsen!
          hausDaten.kinderSollenWachsen = true
        })
      })
    })
  }

  erstelleSpieler(x, y) {
    const figur = this.add.container(x, y)
    maleFigur(this, figur, this.figurDaten, 0.75)

    if (this.figurDaten.name) {
      const namensSchild = this.add.text(0, 28, this.figurDaten.name, {
        fontSize: '12px', fontFamily: 'Arial', color: '#ffffff',
        backgroundColor: '#5D403799', padding: { x: 6, y: 2 },
        stroke: '#000000', strokeThickness: 1
      }).setOrigin(0.5)
      figur.add(namensSchild)
    }

    this.physics.add.existing(figur)
    figur.body.setSize(24, 40)
    figur.body.setOffset(-12, -10)
    figur.body.setCollideWorldBounds(true)
    figur.setDepth(50)
    return figur
  }

  getRucksackText() {
    let text = `🎒 🪵${this.rucksack.holz} 🪨${this.rucksack.stein} ⚙️${this.rucksack.eisen}`
    if (rucksack.pizza > 0) text += ` 🍕${rucksack.pizza}`
    return text
  }

  zeigeNachricht(text) {
    const nachricht = this.add.text(this.scale.width / 2, this.scale.height * 0.2, text, {
      fontSize: '20px', fontFamily: 'Arial', color: '#5D4037',
      stroke: '#ffffff', strokeThickness: 3
    }).setOrigin(0.5).setDepth(200)
    this.tweens.add({
      targets: nachricht,
      alpha: 0, y: nachricht.y - 30,
      duration: 1500, delay: 1000,
      onComplete: () => nachricht.destroy()
    })
  }
}


export default HausSzene
