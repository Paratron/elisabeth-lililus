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
    this.welpenSchlafen = false // 🐶 Welpen auch wach!
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

      // 🛏️ Bett und Hundebett sind größer als andere Möbel!
      const istBett = m.name === 'Bett'
      const istHundebett = m.name === 'Hundebett'
      const groesse = istBett ? '56px' : (istHundebett ? '42px' : '36px')

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

      // 🐾 Wenn es ein Hundebett ist: Antippen = Welpen schlafen!
      if (istHundebett) {
        sprite.setInteractive({ useHandCursor: true })
        sprite.on('pointerdown', () => {
          if (this.einrichtenModus) return
          if (this.welpenSchlafen) return // Schlafen schon!
          this.welpenSchlafenLassen(sprite)
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

      // 🪞 Wenn es ein Spiegel ist: Antippen = Aussehen ändern!
      const istSpiegel = m.name === 'Spiegel'
      if (istSpiegel) {
        sprite.setInteractive({ useHandCursor: true })
        sprite.on('pointerdown', () => {
          if (this.einrichtenModus) return
          if (this.schlaft) return
          this.spiegelBenutzen()
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

  // === 🐾 WELPEN SCHLAFEN LASSEN ===
  welpenSchlafenLassen(hundebettSprite) {
    this.welpenSchlafen = true
    soundKlick()

    const bx = hundebettSprite.x
    const by = hundebettSprite.y

    // 🐶 3 kleine Welpen erscheinen im Hundebett!
    const welpenEmojis = []
    const welpenNamen = ['🐶 Flecki', '🐶 Schoki', '🐶 Sunny']
    for (let i = 0; i < 3; i++) {
      const wx = bx - 15 + i * 15
      const wy = by + 3
      const welpe = this.add.text(wx, wy, '🐶', {
        fontSize: '14px'
      }).setOrigin(0.5).setDepth(11)
      welpenEmojis.push(welpe)

      // 🐶 Hüpf rein!
      welpe.setScale(0)
      this.tweens.add({
        targets: welpe,
        scale: 1,
        duration: 400,
        delay: i * 200,
        ease: 'Back.easeOut'
      })
    }

    // 💤 Zzz über dem Hundebett!
    this.time.delayedCall(800, () => {
      const zzz = this.add.text(bx + 20, by - 25, '💤', {
        fontSize: '18px'
      }).setDepth(100).setAlpha(0)

      this.tweens.add({
        targets: zzz,
        alpha: 1, y: zzz.y - 10,
        duration: 700, yoyo: true, repeat: 3
      })

      this.zeigeNachricht('🐾 Die Welpen schlafen ein... So süß! 🥰')

      // ⏳ Nach 5 Sekunden aufwachen
      this.time.delayedCall(5000, () => {
        zzz.destroy()
        welpenEmojis.forEach((w, i) => {
          this.tweens.add({
            targets: w,
            scale: 1.3,
            duration: 300,
            delay: i * 150,
            yoyo: true,
            onComplete: () => w.destroy()
          })
        })
        this.zeigeNachricht('🐾 *Gähn!* Die Welpen sind aufgewacht! 🐶')
        this.welpenSchlafen = false
      })
    })
  }

  // === 🪞 SPIEGEL BENUTZEN – Aussehen ändern! ===
  spiegelBenutzen() {
    soundKlick()

    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🪞 Alle Elemente die wir am Ende wieder wegräumen
    const elemente = []

    // Dunkler Hintergrund
    const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.7)
    overlay.setDepth(300)
    elemente.push(overlay)

    // ✨ Spiegel-Rahmen (goldener Rand!)
    const rahmen = this.add.rectangle(breite * 0.22, hoehe * 0.42, 120, 160, 0xE8E8E8)
    rahmen.setStrokeStyle(4, 0xFFD700)
    rahmen.setDepth(301)
    elemente.push(rahmen)

    // 🏷️ Titel
    const titel = this.add.text(breite / 2, hoehe * 0.06, '🪞 Spiegel – Neues Outfit! ✨', {
      fontSize: '22px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(301)
    elemente.push(titel)

    // === 📋 Aktuelle Werte kopieren ===
    const auswahl = {
      hautfarbe: this.figurDaten.hautfarbe,
      haarfarbe: this.figurDaten.haarfarbe,
      haarStil: this.figurDaten.haarStil,
      kleidungFarbe: this.figurDaten.kleidungFarbe,
      kleidungTyp: this.figurDaten.kleidungTyp,
      hosenFarbe: this.figurDaten.hosenFarbe,
      schuhFarbe: this.figurDaten.schuhFarbe
    }

    // === 🧑 VORSCHAU im Spiegel ===
    let vorschauContainer = null
    const aktualisiereVorschau = () => {
      if (vorschauContainer) vorschauContainer.destroy()
      vorschauContainer = this.add.container(breite * 0.22, hoehe * 0.42)
      vorschauContainer.setDepth(302)
      maleFigur(this, vorschauContainer, auswahl, 2)
      elemente.push(vorschauContainer)
    }
    aktualisiereVorschau()

    // === 🎨 Farb-Button Helfer ===
    const erstelleFarbKreise = (startX, y, farben, aktiveFarbe, callback) => {
      const kreise = []
      farben.forEach((eintrag, index) => {
        const x = startX + index * 36
        const kreis = this.add.circle(x, y, 13, eintrag.farbe)
        kreis.setDepth(302)
        if (eintrag.farbe === aktiveFarbe) {
          kreis.setStrokeStyle(3, 0xFFD700)
          kreis.setScale(1.15)
        } else {
          kreis.setStrokeStyle(2, 0x333333)
        }
        kreis.setInteractive({ useHandCursor: true })
        kreis.on('pointerdown', () => {
          kreise.forEach(k => { k.setStrokeStyle(2, 0x333333); k.setScale(1) })
          kreis.setStrokeStyle(3, 0xFFD700)
          kreis.setScale(1.15)
          callback(eintrag.farbe)
          aktualisiereVorschau()
        })
        kreise.push(kreis)
        elemente.push(kreis)
      })
    }

    // === Auswahl-Buttons (rechte Seite) ===
    const labelX = breite * 0.40
    const farbX = breite * 0.56
    const startY = hoehe * 0.14
    const abstand = 42

    // --- 🧑 HAUTFARBE ---
    const hautLabel = this.add.text(labelX, startY, '🧑 Haut:', {
      fontSize: '15px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0, 0.5).setDepth(302)
    elemente.push(hautLabel)

    erstelleFarbKreise(farbX, startY, [
      { farbe: 0xFDECDA }, { farbe: 0xFFCC80 },
      { farbe: 0xD4A574 }, { farbe: 0x8D5524 }
    ], auswahl.hautfarbe, (f) => { auswahl.hautfarbe = f })

    // --- 💇 HAARFARBE ---
    const haarLabel = this.add.text(labelX, startY + abstand, '💇 Haare:', {
      fontSize: '15px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0, 0.5).setDepth(302)
    elemente.push(haarLabel)

    erstelleFarbKreise(farbX, startY + abstand, [
      { farbe: 0xFDD835 }, { farbe: 0x5D4037 },
      { farbe: 0x212121 }, { farbe: 0xE53935 },
      { farbe: 0xE91E63 }
    ], auswahl.haarfarbe, (f) => { auswahl.haarfarbe = f })

    // --- ✂️ FRISUR ---
    const frisurLabel = this.add.text(labelX, startY + abstand * 2, '✂️ Frisur:', {
      fontSize: '15px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0, 0.5).setDepth(302)
    elemente.push(frisurLabel)

    const frisuren = ['Kurz', 'Lang', 'Zöpfe']
    const frisurBtns = []
    frisuren.forEach((name, index) => {
      const btn = this.add.text(farbX + index * 70, startY + abstand * 2, name, {
        fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
        backgroundColor: index === auswahl.haarStil ? '#4CAF50' : '#78909C',
        padding: { x: 8, y: 4 }
      }).setOrigin(0, 0.5).setDepth(302)
      btn.setInteractive({ useHandCursor: true })
      btn.on('pointerdown', () => {
        auswahl.haarStil = index
        frisurBtns.forEach((b, i) => b.setBackgroundColor(i === index ? '#4CAF50' : '#78909C'))
        aktualisiereVorschau()
      })
      frisurBtns.push(btn)
      elemente.push(btn)
    })

    // --- 👕 KLEIDUNG FARBE ---
    const kleidLabel = this.add.text(labelX, startY + abstand * 3, '👕 Kleidung:', {
      fontSize: '15px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0, 0.5).setDepth(302)
    elemente.push(kleidLabel)

    erstelleFarbKreise(farbX, startY + abstand * 3, [
      { farbe: 0x2196F3 }, { farbe: 0xE53935 },
      { farbe: 0x4CAF50 }, { farbe: 0xFFEB3B },
      { farbe: 0x9C27B0 }, { farbe: 0xE91E63 }
    ], auswahl.kleidungFarbe, (f) => { auswahl.kleidungFarbe = f })

    // --- 👗 KLEIDUNG TYP ---
    const typLabel = this.add.text(labelX, startY + abstand * 4, '👗 Typ:', {
      fontSize: '15px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0, 0.5).setDepth(302)
    elemente.push(typLabel)

    const kleidTypen = ['T-Shirt', 'Kleid', 'Hoodie']
    const typBtns = []
    kleidTypen.forEach((name, index) => {
      const btn = this.add.text(farbX + index * 80, startY + abstand * 4, name, {
        fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
        backgroundColor: index === auswahl.kleidungTyp ? '#4CAF50' : '#78909C',
        padding: { x: 8, y: 4 }
      }).setOrigin(0, 0.5).setDepth(302)
      btn.setInteractive({ useHandCursor: true })
      btn.on('pointerdown', () => {
        auswahl.kleidungTyp = index
        typBtns.forEach((b, i) => b.setBackgroundColor(i === index ? '#4CAF50' : '#78909C'))
        aktualisiereVorschau()
      })
      typBtns.push(btn)
      elemente.push(btn)
    })

    // --- 👖 HOSEN-FARBE ---
    const hosenLabel = this.add.text(labelX, startY + abstand * 5, '👖 Hose:', {
      fontSize: '15px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0, 0.5).setDepth(302)
    elemente.push(hosenLabel)

    erstelleFarbKreise(farbX, startY + abstand * 5, [
      { farbe: 0x37474F }, { farbe: 0x1565C0 },
      { farbe: 0x4E342E }, { farbe: 0x212121 },
      { farbe: 0xE91E63 }, { farbe: 0x7B1FA2 }
    ], auswahl.hosenFarbe, (f) => { auswahl.hosenFarbe = f })

    // --- 👟 SCHUHE ---
    const schuhLabel = this.add.text(labelX, startY + abstand * 6, '👟 Schuhe:', {
      fontSize: '15px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0, 0.5).setDepth(302)
    elemente.push(schuhLabel)

    erstelleFarbKreise(farbX, startY + abstand * 6, [
      { farbe: 0x424242 }, { farbe: 0x212121 },
      { farbe: 0xFFFFFF }, { farbe: 0xE53935 },
      { farbe: 0x1565C0 }, { farbe: 0x4CAF50 }
    ], auswahl.schuhFarbe, (f) => { auswahl.schuhFarbe = f })

    // === ✅ FERTIG-BUTTON ===
    const fertigBtn = this.add.text(breite * 0.55, hoehe * 0.88, '✅ So sehe ich gut aus!', {
      fontSize: '20px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: '#4CAF50', padding: { x: 20, y: 10 },
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(302)
    fertigBtn.setInteractive({ useHandCursor: true })
    elemente.push(fertigBtn)

    // ✨ Button pulsiert leicht
    this.tweens.add({
      targets: fertigBtn,
      scale: 1.05,
      duration: 600,
      yoyo: true,
      repeat: -1
    })

    fertigBtn.on('pointerdown', () => {
      // 💾 Neue Werte in figurDaten übernehmen!
      this.figurDaten.hautfarbe = auswahl.hautfarbe
      this.figurDaten.haarfarbe = auswahl.haarfarbe
      this.figurDaten.haarStil = auswahl.haarStil
      this.figurDaten.kleidungFarbe = auswahl.kleidungFarbe
      this.figurDaten.kleidungTyp = auswahl.kleidungTyp
      this.figurDaten.hosenFarbe = auswahl.hosenFarbe
      this.figurDaten.schuhFarbe = auswahl.schuhFarbe

      // 💾 Speichern!
      spielSpeichern('HausSzene', this.figurDaten, null)

      // 🧹 Alle Spiegel-Elemente wegräumen
      elemente.forEach(el => el.destroy())

      // 🧑 Spieler-Figur im Raum neu malen!
      const alteX = this.spieler.x
      const alteY = this.spieler.y
      this.spieler.destroy()
      this.spieler = this.erstelleSpieler(alteX, alteY)

      this.zeigeNachricht('✨ Wow, du siehst toll aus! 🌟')

      // 🔊 Fröhlicher Sound!
      spieleTon(523, 0.15, 0.1, 'sine')
      setTimeout(() => spieleTon(659, 0.15, 0.1, 'sine'), 100)
      setTimeout(() => spieleTon(784, 0.2, 0.1, 'sine'), 200)
    })

    // === ❌ ABBRECHEN-BUTTON ===
    const abbrechenBtn = this.add.text(breite * 0.22, hoehe * 0.88, '❌ Doch nicht', {
      fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: '#616161', padding: { x: 14, y: 8 },
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(302)
    abbrechenBtn.setInteractive({ useHandCursor: true })
    elemente.push(abbrechenBtn)

    abbrechenBtn.on('pointerdown', () => {
      // 🧹 Einfach alles wegräumen, nichts speichern!
      elemente.forEach(el => el.destroy())
      soundKlick()
    })
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

    // 📺 Alle Blitz-Folgen mit Landschaften, Figuren und Dialogen!
    const folgen = [
      {
        titel: 'Folge 1: Der große Regen',
        szenen: [
          { erzaehler: 'Es war einmal ein kleiner Igel namens Blitz...', figuren: ['🦔'], landschaft: 'wiese', dauer: 4000 },
          { dialog: 'Oh nein! Es fängt an zu regnen!', sprecher: '🦔', figuren: ['🦔'], landschaft: 'regen', dauer: 4000 },
          { erzaehler: 'Blitz lief so schnell er konnte durch den Regen!', figuren: ['🦔'], landschaft: 'regen', dauer: 4000 },
          { dialog: 'Guck mal! Ein riesiger Pilz! Darunter bleibe ich trocken!', sprecher: '🦔', figuren: ['🦔', '🍄'], landschaft: 'regen', dauer: 5000 },
          { dialog: 'Hallo! Darf ich auch unter den Pilz? Ich bin ganz nass!', sprecher: '🐌', figuren: ['🦔', '🐌'], landschaft: 'regen', dauer: 5000 },
          { dialog: 'Na klar! Zusammen ist es viel gemütlicher!', sprecher: '🦔', figuren: ['🦔', '🐌'], landschaft: 'regen', dauer: 4000 },
          { erzaehler: 'Und dann hörte der Regen auf... Ein wunderschöner Regenbogen erschien am Himmel! 🌈', figuren: ['🦔', '🐌'], landschaft: 'wiese', dauer: 5000 },
          { dialog: 'Was für ein toller Tag! Ich hab eine neue Freundin!', sprecher: '🦔', figuren: ['🦔', '🐌'], landschaft: 'wiese', dauer: 4000 },
        ]
      },
      {
        titel: 'Folge 2: Der Schatz im Wald',
        szenen: [
          { erzaehler: 'Blitz spazierte gemütlich durch den dunklen Wald...', figuren: ['🦔'], landschaft: 'wald', dauer: 4000 },
          { dialog: 'Was ist das? Eine alte Karte! Da steht ein X drauf!', sprecher: '🦔', figuren: ['🦔'], landschaft: 'wald', dauer: 5000 },
          { erzaehler: 'Blitz folgte der Karte immer tiefer in den Wald...', figuren: ['🦔'], landschaft: 'wald', dauer: 4000 },
          { dialog: 'Das X zeigt auf diesen großen Baum! Da ist ein Loch!', sprecher: '🦔', figuren: ['🦔', '🌳'], landschaft: 'wald', dauer: 5000 },
          { erzaehler: 'Blitz schaute vorsichtig in das Loch... und da glitzerte etwas!', figuren: ['🦔'], landschaft: 'hoehle', dauer: 4000 },
          { dialog: 'WOW! Ein wunderschöner leuchtender Stein! Der ist ja magisch!', sprecher: '🦔', figuren: ['🦔', '💎'], landschaft: 'hoehle', dauer: 5000 },
          { erzaehler: 'Blitz nahm den Stein mit nach Hause. In der Nacht leuchtete er ganz sanft...', figuren: ['🦔'], landschaft: 'nacht', dauer: 5000 },
          { dialog: 'Mit dir schlafe ich nie mehr im Dunkeln! Gute Nacht, kleiner Stein!', sprecher: '🦔', figuren: ['🦔', '💎'], landschaft: 'nacht', dauer: 5000 },
        ]
      },
      {
        titel: 'Folge 3: Die Pizza-Party',
        szenen: [
          { dialog: 'Ich habe eine TOLLE Idee! Ich mache eine Pizza-Party!', sprecher: '🦔', figuren: ['🦔'], landschaft: 'wiese', dauer: 4000 },
          { erzaehler: 'Blitz sammelte Tomaten und Käse aus seinem Garten!', figuren: ['🦔', '🍅'], landschaft: 'wiese', dauer: 4000 },
          { dialog: 'So! Jetzt ab in den Ofen! Das wird die BESTE Pizza!', sprecher: '🦔', figuren: ['🦔', '🍕'], landschaft: 'wiese', dauer: 4000 },
          { dialog: 'Mmmh! Was riecht denn hier so lecker?!', sprecher: '🐿️', figuren: ['🦔', '🐿️'], landschaft: 'wiese', dauer: 4000 },
          { dialog: 'Ich rieche das bis zu mir! Darf ich auch ein Stück?', sprecher: '🐰', figuren: ['🦔', '🐿️', '🐰'], landschaft: 'wiese', dauer: 5000 },
          { dialog: 'Na klar! Pizza schmeckt mit Freunden am allerbesten!', sprecher: '🦔', figuren: ['🦔', '🐿️', '🐰'], landschaft: 'party', dauer: 4000 },
          { erzaehler: 'Alle aßen zusammen Pizza und hatten den besten Abend ever! 🍕🎉', figuren: ['🦔', '🐿️', '🐰'], landschaft: 'party', dauer: 5000 },
          { dialog: 'Morgen machen wir das wieder! Pizza-Party JEDEN Tag!', sprecher: '🦔', figuren: ['🦔', '🐿️', '🐰'], landschaft: 'party', dauer: 4000 },
        ]
      },
      {
        titel: 'Folge 4: Blitz lernt fliegen',
        szenen: [
          { erzaehler: 'Ein wunderschöner Schmetterling flog an Blitz vorbei...', figuren: ['🦔', '🦋'], landschaft: 'wiese', dauer: 4000 },
          { dialog: 'Das sieht so toll aus! Ich will auch fliegen können!', sprecher: '🦔', figuren: ['🦔', '🦋'], landschaft: 'wiese', dauer: 4000 },
          { erzaehler: 'Blitz kletterte auf einen hohen Hügel und sprang!', figuren: ['🦔'], landschaft: 'berg', dauer: 4000 },
          { dialog: 'AAAAAH! Okay, das war keine gute Idee!', sprecher: '🦔', figuren: ['🦔'], landschaft: 'berg', dauer: 4000 },
          { dialog: 'Du brauchst Flügel, kleiner Igel! So wie ich!', sprecher: '🐦', figuren: ['🦔', '🐦'], landschaft: 'wiese', dauer: 4000 },
          { dialog: 'Ich hab eine Idee! Ich bastle mir Flügel aus Blättern!', sprecher: '🦔', figuren: ['🦔', '🍃'], landschaft: 'wald', dauer: 5000 },
          { erzaehler: 'Blitz sprang noch einmal... und GLEITETE durch die Luft! WOHOOO!', figuren: ['🦔', '🐦', '🦋'], landschaft: 'berg', dauer: 5000 },
          { dialog: 'Ich bin GEFLOGEN! Naja... fast! Aber es war TOLL!', sprecher: '🦔', figuren: ['🦔', '🐦', '🦋'], landschaft: 'wiese', dauer: 5000 },
        ]
      },
      {
        titel: 'Folge 5: Die Sternschnuppe',
        szenen: [
          { erzaehler: 'Es war eine klare Nacht. Blitz konnte nicht schlafen...', figuren: ['🦔'], landschaft: 'nacht', dauer: 4000 },
          { dialog: 'WOW! So viele Sterne! Die sind wunderschön!', sprecher: '🦔', figuren: ['🦔'], landschaft: 'nacht', dauer: 4000 },
          { dialog: 'Guck mal, der eine Stern blinkt ganz hell! Blinkt der nur für mich?', sprecher: '🦔', figuren: ['🦔', '⭐'], landschaft: 'nacht', dauer: 5000 },
          { erzaehler: 'Plötzlich! Eine Sternschnuppe flog über den Himmel! 💫', figuren: ['🦔'], landschaft: 'nacht', dauer: 4000 },
          { dialog: 'EINE STERNSCHNUPPE! Schnell, ich muss mir was wünschen!', sprecher: '🦔', figuren: ['🦔'], landschaft: 'nacht', dauer: 4000 },
          { dialog: 'Ich wünsche mir... dass alle meine Freunde immer glücklich sind!', sprecher: '🦔', figuren: ['🦔', '⭐'], landschaft: 'nacht', dauer: 5000 },
          { erzaehler: 'Die Sterne leuchteten noch heller! Als ob sie sich bedanken wollten...', figuren: ['🦔'], landschaft: 'nacht', dauer: 5000 },
          { dialog: 'Gute Nacht, liebe Sterne! Morgen wird ein toller Tag!', sprecher: '🦔', figuren: ['🦔'], landschaft: 'nacht', dauer: 4000 },
        ]
      },
      {
        titel: 'Folge 6: Der mutige Igel',
        szenen: [
          { dialog: 'HILFE! HILFE! Jemand hat meine Nüsse geklaut!', sprecher: '🐿️', figuren: ['🐿️'], landschaft: 'wald', dauer: 4000 },
          { dialog: 'Keine Sorge! Ich helfe dir! Blitz ist da!', sprecher: '🦔', figuren: ['🦔', '🐿️'], landschaft: 'wald', dauer: 4000 },
          { erzaehler: 'Blitz folgte den Spuren im Gras... sie führten zu einer dunklen Höhle!', figuren: ['🦔'], landschaft: 'wald', dauer: 5000 },
          { dialog: 'Die Höhle ist ganz dunkel... aber ich bin mutig!', sprecher: '🦔', figuren: ['🦔'], landschaft: 'hoehle', dauer: 4000 },
          { erzaehler: 'In der Höhle saß ein kleiner Vogel. Er sah traurig aus...', figuren: ['🦔', '🐦'], landschaft: 'hoehle', dauer: 4000 },
          { dialog: 'Es tut mir leid! Ich hatte so großen Hunger...', sprecher: '🐦', figuren: ['🦔', '🐦'], landschaft: 'hoehle', dauer: 4000 },
          { dialog: 'Hier, nimm die Hälfte! Aber die anderen gehören dem Eichhörnchen!', sprecher: '🦔', figuren: ['🦔', '🐦'], landschaft: 'hoehle', dauer: 5000 },
          { erzaehler: 'Alle teilten fair! Und der kleine Vogel hatte jetzt zwei neue Freunde! 💕', figuren: ['🦔', '🐿️', '🐦'], landschaft: 'wiese', dauer: 5000 },
        ]
      },
      {
        titel: 'Folge 7: Blitz im Schnee',
        szenen: [
          { erzaehler: 'Eines Morgens wachte Blitz auf... und alles war weiß!', figuren: ['🦔'], landschaft: 'schnee', dauer: 4000 },
          { dialog: 'SCHNEE! Es hat geschneit! Wie COOL!', sprecher: '🦔', figuren: ['🦔'], landschaft: 'schnee', dauer: 4000 },
          { dialog: 'Lass uns einen Schneemann bauen! Ich mach die Nase!', sprecher: '🐰', figuren: ['🦔', '🐰', '⛄'], landschaft: 'schnee', dauer: 5000 },
          { erzaehler: 'Sie bauten den größten Schneemann der Welt! Mit Karottennase und Schal!', figuren: ['🦔', '🐰', '⛄'], landschaft: 'schnee', dauer: 5000 },
          { dialog: 'SCHNEEBALLSCHLACHT! Fang den!', sprecher: '🐿️', figuren: ['🦔', '🐰', '🐿️'], landschaft: 'schnee', dauer: 4000 },
          { dialog: 'Hey! PLATSCH! Haha, das war ein guter Treffer!', sprecher: '🦔', figuren: ['🦔', '🐰', '🐿️'], landschaft: 'schnee', dauer: 4000 },
          { erzaehler: 'Alle spielten den ganzen Tag im Schnee und hatten riesigen Spaß!', figuren: ['🦔', '🐰', '🐿️'], landschaft: 'schnee', dauer: 4000 },
          { dialog: 'Und jetzt einen heißen Kakao mit Marshmallows! Das war der beste Schneetag!', sprecher: '🦔', figuren: ['🦔', '🐰', '🐿️'], landschaft: 'schnee', dauer: 5000 },
        ]
      },
      {
        titel: 'Folge 8: Das Geburtstags-Fest',
        szenen: [
          { erzaehler: 'Heute war ein besonderer Tag... Blitz hatte Geburtstag!', figuren: ['🦔'], landschaft: 'wiese', dauer: 4000 },
          { dialog: 'Hmmm... wo sind denn alle? Es ist so still heute...', sprecher: '🦔', figuren: ['🦔'], landschaft: 'wiese', dauer: 4000 },
          { dialog: 'Hat mich jeder vergessen? Ich bin ganz alleine...', sprecher: '🦔', figuren: ['🦔'], landschaft: 'wald', dauer: 4000 },
          { erzaehler: 'Traurig ging Blitz nach Hause zurück...', figuren: ['🦔'], landschaft: 'wald', dauer: 4000 },
          { erzaehler: 'Er öffnete die Tür und dann...', figuren: ['🦔'], landschaft: 'wiese', dauer: 3000 },
          { dialog: 'ÜBERRASCHUNG!!! ALLES GUTE ZUM GEBURTSTAG!', sprecher: '🐰', figuren: ['🦔', '🐰', '🐿️', '🐦', '🐌'], landschaft: 'party', dauer: 5000 },
          { dialog: 'Ihr habt mich nicht vergessen! Ihr seid die BESTEN Freunde der Welt!', sprecher: '🦔', figuren: ['🦔', '🐰', '🐿️', '🐦', '🐌'], landschaft: 'party', dauer: 5000 },
          { erzaehler: 'Sie feierten die ganze Nacht! Es war die beste Geburtstagsparty ever! 🎉🎂', figuren: ['🦔', '🐰', '🐿️', '🐦', '🐌'], landschaft: 'party', dauer: 5000 },
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

  // === 🎨 LANDSCHAFT MALEN – Zeichnet hübsche Hintergründe! ===
  maleLandschaft(grafik, typ, bx, by, bw, bh) {
    // bx, by = oben links vom Bildschirm-Bereich
    // bw, bh = Breite und Höhe vom Bildschirm-Bereich

    if (typ === 'wiese') {
      // ☀️ Blauer Himmel
      grafik.fillStyle(0x87CEEB, 1)
      grafik.fillRect(bx, by, bw, bh * 0.6)
      // 🌿 Grünes Gras
      grafik.fillStyle(0x4CAF50, 1)
      grafik.fillRect(bx, by + bh * 0.6, bw, bh * 0.4)
      // ☀️ Sonne
      grafik.fillStyle(0xFFEB3B, 1)
      grafik.fillCircle(bx + bw * 0.85, by + bh * 0.15, 25)
      // 🌸 Blumen
      const blumenFarben = [0xFF4081, 0xFFEB3B, 0xE040FB, 0xFF6D00]
      for (let i = 0; i < 8; i++) {
        const fx = bx + bw * 0.1 + (i / 8) * bw * 0.8
        const fy = by + bh * 0.7 + Math.sin(i * 2) * 15
        grafik.fillStyle(blumenFarben[i % blumenFarben.length], 1)
        grafik.fillCircle(fx, fy, 5)
        grafik.fillStyle(0x388E3C, 1)
        grafik.fillRect(fx - 1, fy, 2, 12)
      }
      // ⛰️ Sanfte Hügel
      grafik.fillStyle(0x66BB6A, 1)
      grafik.fillEllipse(bx + bw * 0.25, by + bh * 0.62, bw * 0.4, bh * 0.12)
      grafik.fillEllipse(bx + bw * 0.7, by + bh * 0.65, bw * 0.35, bh * 0.1)
    }

    else if (typ === 'wald') {
      // 🌲 Dunkler Waldhimmel
      grafik.fillStyle(0x2E7D32, 1)
      grafik.fillRect(bx, by, bw, bh * 0.55)
      // 🟤 Waldboden
      grafik.fillStyle(0x5D4037, 1)
      grafik.fillRect(bx, by + bh * 0.55, bw, bh * 0.45)
      // 🌲 Bäume im Hintergrund
      for (let i = 0; i < 6; i++) {
        const tx = bx + bw * 0.1 + (i / 6) * bw * 0.85
        const th = bh * 0.3 + Math.sin(i) * bh * 0.08
        // Stamm
        grafik.fillStyle(0x795548, 1)
        grafik.fillRect(tx - 4, by + bh * 0.55 - th * 0.3, 8, th * 0.3)
        // Krone (Dreieck als Kreis-Annäherung)
        grafik.fillStyle(0x1B5E20, 1)
        grafik.fillCircle(tx, by + bh * 0.55 - th * 0.5, 18)
        grafik.fillCircle(tx, by + bh * 0.55 - th * 0.7, 14)
      }
      // 🍄 Pilze am Boden
      grafik.fillStyle(0xF44336, 1)
      grafik.fillCircle(bx + bw * 0.2, by + bh * 0.72, 7)
      grafik.fillStyle(0xFFFFFF, 1)
      grafik.fillCircle(bx + bw * 0.2 - 2, by + bh * 0.71, 2)
      grafik.fillCircle(bx + bw * 0.2 + 3, by + bh * 0.72, 1.5)
    }

    else if (typ === 'regen') {
      // 🌧️ Grauer Himmel
      grafik.fillStyle(0x546E7A, 1)
      grafik.fillRect(bx, by, bw, bh * 0.6)
      // 🌿 Nasses Gras
      grafik.fillStyle(0x2E7D32, 1)
      grafik.fillRect(bx, by + bh * 0.6, bw, bh * 0.4)
      // ☁️ Wolken
      grafik.fillStyle(0x78909C, 1)
      grafik.fillCircle(bx + bw * 0.3, by + bh * 0.15, 30)
      grafik.fillCircle(bx + bw * 0.4, by + bh * 0.12, 25)
      grafik.fillCircle(bx + bw * 0.7, by + bh * 0.18, 28)
      grafik.fillCircle(bx + bw * 0.6, by + bh * 0.14, 22)
      // 🌧️ Regentropfen
      grafik.fillStyle(0x90CAF9, 0.7)
      for (let i = 0; i < 20; i++) {
        const rx = bx + Math.random() * bw
        const ry = by + bh * 0.2 + Math.random() * bh * 0.4
        grafik.fillRect(rx, ry, 2, 8)
      }
      // 🌧️ Pfützen
      grafik.fillStyle(0x64B5F6, 0.5)
      grafik.fillEllipse(bx + bw * 0.3, by + bh * 0.75, 40, 8)
      grafik.fillEllipse(bx + bw * 0.7, by + bh * 0.8, 30, 6)
    }

    else if (typ === 'nacht') {
      // 🌙 Dunkler Nachthimmel
      grafik.fillStyle(0x0D1B2A, 1)
      grafik.fillRect(bx, by, bw, bh * 0.65)
      // 🌿 Dunkles Gras
      grafik.fillStyle(0x1B5E20, 1)
      grafik.fillRect(bx, by + bh * 0.65, bw, bh * 0.35)
      // 🌙 Mond
      grafik.fillStyle(0xFFF9C4, 1)
      grafik.fillCircle(bx + bw * 0.8, by + bh * 0.15, 20)
      grafik.fillStyle(0x0D1B2A, 1)
      grafik.fillCircle(bx + bw * 0.8 + 7, by + bh * 0.15 - 5, 17)
      // ⭐ Sterne
      grafik.fillStyle(0xFFFFFF, 1)
      for (let i = 0; i < 25; i++) {
        const sx = bx + Math.random() * bw
        const sy = by + Math.random() * bh * 0.5
        const groesse = 1 + Math.random() * 2
        grafik.fillCircle(sx, sy, groesse)
      }
    }

    else if (typ === 'schnee') {
      // ❄️ Hellblauer Himmel
      grafik.fillStyle(0xBBDEFB, 1)
      grafik.fillRect(bx, by, bw, bh * 0.55)
      // ⬜ Schnee-Boden
      grafik.fillStyle(0xFFFFFF, 1)
      grafik.fillRect(bx, by + bh * 0.55, bw, bh * 0.45)
      // ❄️ Schneeflocken in der Luft
      grafik.fillStyle(0xFFFFFF, 0.8)
      for (let i = 0; i < 30; i++) {
        const sx = bx + Math.random() * bw
        const sy = by + Math.random() * bh * 0.6
        grafik.fillCircle(sx, sy, 1.5 + Math.random() * 2)
      }
      // 🌲 Verschneite Bäume
      for (let i = 0; i < 3; i++) {
        const tx = bx + bw * (0.15 + i * 0.35)
        grafik.fillStyle(0x795548, 1)
        grafik.fillRect(tx - 3, by + bh * 0.45, 6, bh * 0.12)
        grafik.fillStyle(0x2E7D32, 1)
        grafik.fillCircle(tx, by + bh * 0.38, 16)
        // Schnee auf Bäumen
        grafik.fillStyle(0xFFFFFF, 0.9)
        grafik.fillCircle(tx, by + bh * 0.33, 10)
      }
      // Schneehügel
      grafik.fillStyle(0xE3F2FD, 1)
      grafik.fillEllipse(bx + bw * 0.5, by + bh * 0.58, bw * 0.6, bh * 0.1)
    }

    else if (typ === 'berg') {
      // 🏔️ Blauer Himmel
      grafik.fillStyle(0x64B5F6, 1)
      grafik.fillRect(bx, by, bw, bh * 0.7)
      // 🟤 Boden
      grafik.fillStyle(0x8D6E63, 1)
      grafik.fillRect(bx, by + bh * 0.7, bw, bh * 0.3)
      // 🏔️ Berge
      grafik.fillStyle(0x78909C, 1)
      // Berg links
      grafik.fillTriangle(
        bx + bw * 0.0, by + bh * 0.7,
        bx + bw * 0.25, by + bh * 0.2,
        bx + bw * 0.5, by + bh * 0.7
      )
      // Berg rechts (größer)
      grafik.fillStyle(0x607D8B, 1)
      grafik.fillTriangle(
        bx + bw * 0.3, by + bh * 0.7,
        bx + bw * 0.65, by + bh * 0.1,
        bx + bw * 1.0, by + bh * 0.7
      )
      // ❄️ Schneekappen
      grafik.fillStyle(0xFFFFFF, 1)
      grafik.fillTriangle(
        bx + bw * 0.2, by + bh * 0.28,
        bx + bw * 0.25, by + bh * 0.2,
        bx + bw * 0.3, by + bh * 0.28
      )
      grafik.fillTriangle(
        bx + bw * 0.58, by + bh * 0.2,
        bx + bw * 0.65, by + bh * 0.1,
        bx + bw * 0.72, by + bh * 0.2
      )
    }

    else if (typ === 'hoehle') {
      // 🕳️ Dunkle Höhle
      grafik.fillStyle(0x263238, 1)
      grafik.fillRect(bx, by, bw, bh)
      // 🪨 Höhlenwände (heller)
      grafik.fillStyle(0x37474F, 1)
      // Decke
      for (let i = 0; i < 8; i++) {
        const cx = bx + (i / 8) * bw
        const ch = bh * 0.05 + Math.sin(i * 1.5) * bh * 0.08
        grafik.fillRect(cx, by, bw / 8 + 2, ch)
      }
      // Boden
      grafik.fillStyle(0x455A64, 1)
      grafik.fillRect(bx, by + bh * 0.78, bw, bh * 0.22)
      // 🪨 Stalaktiten von der Decke
      grafik.fillStyle(0x546E7A, 1)
      for (let i = 0; i < 5; i++) {
        const sx = bx + bw * 0.1 + (i / 5) * bw * 0.8
        const sl = 10 + Math.sin(i * 3) * 8
        grafik.fillTriangle(sx - 4, by, sx + 4, by, sx, by + sl)
      }
      // ✨ Leuchtende Kristalle
      grafik.fillStyle(0x80DEEA, 0.7)
      grafik.fillCircle(bx + bw * 0.2, by + bh * 0.3, 4)
      grafik.fillCircle(bx + bw * 0.8, by + bh * 0.25, 3)
      grafik.fillStyle(0xCE93D8, 0.7)
      grafik.fillCircle(bx + bw * 0.6, by + bh * 0.15, 3)
    }

    else if (typ === 'party') {
      // 🎉 Party-Hintergrund
      grafik.fillStyle(0xE91E63, 1)
      grafik.fillRect(bx, by, bw, bh * 0.6)
      // 🟫 Party-Boden
      grafik.fillStyle(0x8D6E63, 1)
      grafik.fillRect(bx, by + bh * 0.6, bw, bh * 0.4)
      // 🎈 Luftballons
      const ballonFarben = [0xF44336, 0x2196F3, 0xFFEB3B, 0x4CAF50, 0xE040FB, 0xFF9800]
      for (let i = 0; i < 6; i++) {
        const bxp = bx + bw * 0.1 + (i / 6) * bw * 0.8
        const byp = by + bh * 0.15 + Math.sin(i * 2) * bh * 0.08
        // Schnur
        grafik.lineStyle(1, 0xBDBDBD, 0.5)
        grafik.lineBetween(bxp, byp + 12, bxp, by + bh * 0.5)
        // Ballon
        grafik.fillStyle(ballonFarben[i], 1)
        grafik.fillCircle(bxp, byp, 12)
        // Glanz
        grafik.fillStyle(0xFFFFFF, 0.3)
        grafik.fillCircle(bxp - 3, byp - 3, 4)
      }
      // 🎊 Konfetti
      const konfettiFarben = [0xFFEB3B, 0xF44336, 0x2196F3, 0x4CAF50, 0xE040FB]
      for (let i = 0; i < 15; i++) {
        grafik.fillStyle(konfettiFarben[i % konfettiFarben.length], 0.8)
        const kx = bx + Math.random() * bw
        const ky = by + Math.random() * bh * 0.6
        grafik.fillRect(kx, ky, 3 + Math.random() * 4, 2 + Math.random() * 3)
      }
      // 🎂 Girlande oben
      grafik.lineStyle(3, 0xFFEB3B, 0.8)
      for (let i = 0; i < 10; i++) {
        const gx1 = bx + (i / 10) * bw
        const gx2 = bx + ((i + 1) / 10) * bw
        const gy = by + bh * 0.05 + 8
        grafik.lineBetween(gx1, gy - 5, (gx1 + gx2) / 2, gy + 5)
        grafik.lineBetween((gx1 + gx2) / 2, gy + 5, gx2, gy - 5)
      }
    }
  }

  // === 💬 SPRECHBLASE ZEICHNEN ===
  zeichneSprechblase(grafik, x, y, breiteB, hoeheB, zeigerX) {
    // 💬 Weißer Hintergrund
    grafik.fillStyle(0xFFFFFF, 0.95)
    grafik.fillRoundedRect(x, y, breiteB, hoeheB, 12)
    // 🖊️ Schwarzer Rand
    grafik.lineStyle(2, 0x000000, 1)
    grafik.strokeRoundedRect(x, y, breiteB, hoeheB, 12)
    // 🔻 Zeiger nach unten (zur Figur)
    grafik.fillStyle(0xFFFFFF, 0.95)
    grafik.fillTriangle(
      zeigerX - 8, y + hoeheB,
      zeigerX + 8, y + hoeheB,
      zeigerX, y + hoeheB + 14
    )
    // Rand für Zeiger
    grafik.lineStyle(2, 0x000000, 1)
    grafik.lineBetween(zeigerX - 8, y + hoeheB, zeigerX, y + hoeheB + 14)
    grafik.lineBetween(zeigerX + 8, y + hoeheB, zeigerX, y + hoeheB + 14)
    // Kleines weißes Rechteck um den Übergang zu verstecken
    grafik.fillStyle(0xFFFFFF, 0.95)
    grafik.fillRect(zeigerX - 9, y + hoeheB - 2, 18, 4)
  }

  // === 🔊 TEXT VORLESEN – Benutzt die Sprach-Ausgabe vom Browser! ===
  textVorlesen(text) {
    // 🔇 Vorherige Sprache stoppen
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    // 🗣️ Neuen Text vorlesen!
    if (window.speechSynthesis) {
      const rede = new SpeechSynthesisUtterance(text)
      rede.lang = 'de-DE'       // 🇩🇪 Deutsch!
      rede.rate = 0.85           // 🐌 Etwas langsamer für Kinder
      rede.pitch = 1.2           // 🎵 Etwas höher – klingt freundlicher!
      window.speechSynthesis.speak(rede)
    }
  }

  // === 📺 BLITZ-FOLGE ABSPIELEN – Mit Landschaft, Sprechblasen und Stimme! ===
  blitzFolgeAbspielen(folge) {
    soundKlick()

    const breite = this.scale.width
    const hoehe = this.scale.height

    // 📺 Bildschirm (schwarzer Rahmen)
    const bildschirm = this.add.rectangle(breite / 2, hoehe / 2, breite * 0.85, hoehe * 0.75, 0x000000)
    bildschirm.setStrokeStyle(4, 0x66BB6A).setDepth(300)

    // 🎬 Bildschirm-Bereich berechnen
    const bx = breite * 0.075 + 2   // links
    const by = hoehe * 0.125 + 2     // oben
    const bw = breite * 0.85 - 4    // breite
    const bh = hoehe * 0.75 - 4     // höhe

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

    // 📺 Titel vorlesen!
    this.textVorlesen(folge.titel)

    // 📺 Nach 3 Sekunden: Erste Szene starten!
    this.time.delayedCall(3000, () => {
      introText.destroy()

      let szeneIndex = 0

      // 🎨 Grafik-Objekt für die Landschaft!
      const landschaftGrafik = this.add.graphics().setDepth(301)
      elemente.push(landschaftGrafik)

      // 🎨 Grafik-Objekt für Sprechblasen!
      const blasenGrafik = this.add.graphics().setDepth(303)
      elemente.push(blasenGrafik)

      // 📺 Figuren-Texte (Emojis am Boden)
      let figurenTexte = []

      // 📺 Sprechblasen-Text
      let blasenText = null

      // 📺 Fortschrittsbalken
      const balkenHg = this.add.rectangle(breite / 2, by + bh - 8, bw * 0.8, 6, 0x333333, 0.5)
      balkenHg.setDepth(305)
      elemente.push(balkenHg)
      const balken = this.add.rectangle(breite / 2 - (bw * 0.4), by + bh - 8, 0, 6, 0x66BB6A)
      balken.setOrigin(0, 0.5).setDepth(306)
      elemente.push(balken)

      // 🎬 Szene anzeigen!
      const zeigeSzene = (idx) => {
        const szene = folge.szenen[idx]

        // 🎨 Landschaft malen!
        landschaftGrafik.clear()
        this.maleLandschaft(landschaftGrafik, szene.landschaft, bx, by, bw, bh)

        // 🗑️ Alte Figuren wegräumen
        figurenTexte.forEach(f => f.destroy())
        figurenTexte = []

        // 🗑️ Alte Sprechblase wegräumen
        blasenGrafik.clear()
        if (blasenText) {
          blasenText.destroy()
          blasenText = null
        }

        // 🦔 Figuren am Boden platzieren!
        const bodenY = by + bh * 0.68
        const figurenAnzahl = szene.figuren.length
        const figurenBreite = bw * 0.6
        const figurenStart = bx + bw * 0.2

        szene.figuren.forEach((figur, i) => {
          const fx = figurenStart + (figurenAnzahl === 1 ? figurenBreite / 2 : (i / (figurenAnzahl - 1)) * figurenBreite)
          const figurText = this.add.text(fx, bodenY, figur, {
            fontSize: '42px'
          }).setOrigin(0.5).setDepth(303)
          // 🎬 Figur hüpft rein!
          figurText.setScale(0)
          this.tweens.add({
            targets: figurText,
            scale: 1,
            duration: 400,
            ease: 'Back.easeOut',
            delay: i * 100
          })
          figurenTexte.push(figurText)
          elemente.push(figurText)
        })

        // 💬 Text anzeigen – als Sprechblase oder Erzähler!
        const textInhalt = szene.dialog || szene.erzaehler

        if (szene.dialog && szene.sprecher) {
          // 💬 SPRECHBLASE über dem Sprecher!
          const sprecherIndex = szene.figuren.indexOf(szene.sprecher)
          const sprecherX = figurenStart + (figurenAnzahl === 1 ? figurenBreite / 2 : (Math.max(0, sprecherIndex) / Math.max(1, figurenAnzahl - 1)) * figurenBreite)

          // 📏 Sprechblase berechnen
          const maxBlasenBreite = bw * 0.7
          const blasenBreite = Math.min(maxBlasenBreite, Math.max(120, szene.dialog.length * 7))
          const blasenHoehe = 50 + Math.floor(szene.dialog.length / 30) * 16
          const blasenX = Math.max(bx + 10, Math.min(bx + bw - blasenBreite - 10, sprecherX - blasenBreite / 2))
          const blasenY = bodenY - 70 - blasenHoehe

          // 💬 Sprechblase zeichnen!
          this.zeichneSprechblase(blasenGrafik, blasenX, blasenY, blasenBreite, blasenHoehe, sprecherX)

          // 📝 Text in der Sprechblase!
          blasenText = this.add.text(blasenX + blasenBreite / 2, blasenY + blasenHoehe / 2, szene.dialog, {
            fontSize: '11px', fontFamily: 'Arial', color: '#000000',
            align: 'center', wordWrap: { width: blasenBreite - 20 },
            lineSpacing: 3
          }).setOrigin(0.5).setDepth(304)
          elemente.push(blasenText)

          // 🎬 Text einblenden!
          blasenText.setAlpha(0)
          this.tweens.add({ targets: blasenText, alpha: 1, duration: 400, delay: 300 })

          // 🔊 Vorlesen!
          this.textVorlesen(szene.dialog)

        } else if (szene.erzaehler) {
          // 📖 ERZÄHLER-TEXT unten im Bild (kein Sprechblase)
          blasenText = this.add.text(bx + bw / 2, by + bh * 0.88, szene.erzaehler, {
            fontSize: '12px', fontFamily: 'Arial', color: '#ffffff',
            stroke: '#000000', strokeThickness: 3,
            align: 'center', wordWrap: { width: bw * 0.8 },
            lineSpacing: 4
          }).setOrigin(0.5).setDepth(304)
          elemente.push(blasenText)

          // 🎬 Text einblenden!
          blasenText.setAlpha(0)
          this.tweens.add({ targets: blasenText, alpha: 1, duration: 500, delay: 200 })

          // 🔊 Vorlesen!
          this.textVorlesen(szene.erzaehler)
        }

        // 📊 Fortschrittsbalken
        const fortschritt = (idx / Math.max(1, folge.szenen.length - 1)) * bw * 0.8
        this.tweens.add({ targets: balken, displayWidth: fortschritt, duration: 300 })

        // 🎵 Szenen-Sound
        const toene = [330 + idx * 30, 392 + idx * 20]
        toene.forEach((note, j) => {
          setTimeout(() => spieleTon(note, 0.08, 0.04, 'sine'), j * 100)
        })
      }

      // 🎬 Erste Szene zeigen!
      zeigeSzene(0)

      // 📺 Nächste Szene Funktion
      const naechsteSzene = () => {
        szeneIndex++
        if (szeneIndex >= folge.szenen.length) {
          // 🎬 ENDE!
          landschaftGrafik.clear()
          // Dunkler Hintergrund
          landschaftGrafik.fillStyle(0x1a237e, 1)
          landschaftGrafik.fillRect(bx, by, bw, bh)

          // 🗑️ Figuren und Blasen weg
          figurenTexte.forEach(f => f.destroy())
          figurenTexte = []
          blasenGrafik.clear()
          if (blasenText) { blasenText.destroy(); blasenText = null }

          // ⭐ Großer Stern!
          const endeStern = this.add.text(breite / 2, hoehe * 0.4, '⭐', {
            fontSize: '52px'
          }).setOrigin(0.5).setDepth(303)
          elemente.push(endeStern)
          this.tweens.add({
            targets: endeStern,
            angle: 360, scale: 1.3,
            duration: 1500, ease: 'Sine.easeInOut'
          })

          // 📝 Ende-Text
          const endeText = this.add.text(breite / 2, hoehe * 0.6, '📺 Ende! 🦔⭐\n\nHat dir die Folge gefallen?', {
            fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
            stroke: '#000000', strokeThickness: 3, align: 'center'
          }).setOrigin(0.5).setDepth(303)
          elemente.push(endeText)

          // Fortschritt voll
          balken.setDisplaySize(bw * 0.8, 6)

          // 🔊 Ende vorlesen
          this.textVorlesen('Ende! Hat dir die Folge gefallen?')

          // 🎵 Ende-Jingle
          const endeJingle = [784, 659, 784, 1047]
          endeJingle.forEach((note, i) => {
            setTimeout(() => spieleTon(note, 0.12, 0.06, 'sine'), i * 200)
          })

          // 📺 Buttons: Nochmal oder Zurück
          const nochmal = this.add.text(breite * 0.35, hoehe * 0.78, '🔄 Nochmal!', {
            fontSize: '12px', fontFamily: 'Arial', color: '#4CAF50',
            backgroundColor: '#2E7D32', padding: { x: 8, y: 4 }
          }).setOrigin(0.5).setDepth(305)
          nochmal.setInteractive({ useHandCursor: true })
          nochmal.on('pointerdown', () => {
            // 🔇 Stimme stoppen
            if (window.speechSynthesis) window.speechSynthesis.cancel()
            elemente.forEach(el => el.destroy())
            nochmal.destroy()
            zurueck.destroy()
            this.blitzFolgeAbspielen(folge)
          })

          const zurueck = this.add.text(breite * 0.65, hoehe * 0.78, '📺 Andere Folge', {
            fontSize: '12px', fontFamily: 'Arial', color: '#FF5252',
            stroke: '#000000', strokeThickness: 2
          }).setOrigin(0.5).setDepth(305)
          zurueck.setInteractive({ useHandCursor: true })
          zurueck.on('pointerdown', () => {
            // 🔇 Stimme stoppen
            if (window.speechSynthesis) window.speechSynthesis.cancel()
            elemente.forEach(el => el.destroy())
            nochmal.destroy()
            zurueck.destroy()
            this.blitzGucken()
          })

          return
        }

        // 🎬 Nächste Szene zeigen!
        zeigeSzene(szeneIndex)

        // ⏰ Timer für nächste Szene
        this.blitzTimer = this.time.delayedCall(folge.szenen[szeneIndex].dauer, naechsteSzene)
      }

      // ⏰ Timer für erste Szene starten!
      this.blitzTimer = this.time.delayedCall(folge.szenen[0].dauer, naechsteSzene)

      // ⏸️ Antippen = Pause/Weiter
      bildschirm.setInteractive()
      let pausiert = false
      const pauseText = this.add.text(breite / 2, by + 15, '', {
        fontSize: '11px', fontFamily: 'Arial', color: '#FFD700',
        stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(307)
      elemente.push(pauseText)

      bildschirm.on('pointerdown', () => {
        if (szeneIndex >= folge.szenen.length) return
        if (pausiert) {
          // ▶️ Weiter!
          pausiert = false
          pauseText.setText('')
          naechsteSzene()
        } else {
          // ⏸️ Pause! Stimme auch stoppen!
          pausiert = true
          pauseText.setText('⏸️ Pause – Tippe zum Weitergucken!')
          if (window.speechSynthesis) window.speechSynthesis.cancel()
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
          hausDaten.tagesZeitSeit = Date.now() // ⏰ Zeitstempel merken!
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
