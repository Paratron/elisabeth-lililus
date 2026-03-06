// =============================================================
// === BLUMENWIESEN-SPIEL (Hauptwelt!) ===
// =============================================================
import Phaser from 'phaser'
import { rucksack, hausDaten, spielSpeichern, spielLaden, spielstandWiederherstellen } from '../state.js'
import { spieleTon, soundKlick, soundEinsammeln, soundKonfetti, soundTuer, soundBaumFaellt, soundBellen, soundGraben, soundHausGebaut, soundHeli, soundHilferuf, soundHolzHacken, soundHundFreut, soundMine, soundSpielStart, soundSteinKlopfen, soundSteinZerbricht } from '../sounds.js'
import { maleFigur } from '../figur.js'
import { miloAntwort } from '../milo.js'

class BlumenwiesenSpiel extends Phaser.Scene {
  constructor() {
    super('BlumenwiesenSpiel')
  }

  preload() {
    // Wir malen alles direkt im Code – keine Bilddateien nötig! 🎨
  }

  // 🏗️ create: Hier bauen wir unsere Welt auf!
  create(figurDaten) {
    // 🎨 Figur-Daten übernehmen
    this.figurDaten = figurDaten || {
      hautfarbe: 0xFFCC80,
      haarfarbe: 0x5D4037,
      haarStil: 0,
      kleidungFarbe: 0x2196F3,
      kleidungTyp: 0,
      hosenFarbe: 0x37474F,
      schuhFarbe: 0x424242
    }

    // 📐 Bildschirmgröße holen
    const breite = this.scale.width
    const hoehe = this.scale.height

    // === 🌍 DIE WELT IST GRÖSSER ALS DER BILDSCHIRM ===
    const weltBreite = breite * 2
    const weltHoehe = hoehe
    this.weltBreite = weltBreite

    // Physik-Grenzen auf die Weltgröße setzen (KEINE Schwerkraft!)
    this.physics.world.setBounds(0, 0, weltBreite, weltHoehe)
    this.physics.world.gravity.y = 0 // 🌍 Keine Schwerkraft – wir laufen frei!

    // ☀️ HIMMEL – Farbe wird später durch setzeTagesZeitFarbe gesetzt wenn Haus gebaut
    if (!hausDaten.hausGebaut) {
      this.cameras.main.setBackgroundColor('#87CEEB')
    }

    // === 🌈 REGENBOGEN ===
    this.maleRegenbogen(weltBreite / 2, hoehe * 0.05, 180)

    // === ☀️ SONNE (wird nur gemalt wenn Haus noch nicht gebaut, sonst macht setzeTagesZeitFarbe das!) ===
    this.sonnenPosition = { x: weltBreite - 100, y: 80 } // 📍 Position merken!
    if (!hausDaten.hausGebaut) {
      this.maleSonne(weltBreite - 100, 80)
    }

    // === ☁️ WOLKEN ===
    this.maleWolke(150, 60)
    this.maleWolke(400, 90)
    this.maleWolke(700, 50)
    this.maleWolke(weltBreite - 300, 70)

    // === 🌿 WIESE (der ganze untere Bereich) ===
    const wiesenY = hoehe * 0.45 // 🌿 Ab hier beginnt die Wiese
    this.wiesenY = wiesenY

    // Grüne Wiese (großes Rechteck)
    this.add.rectangle(weltBreite / 2, wiesenY + (hoehe - wiesenY) / 2, weltBreite, hoehe - wiesenY, 0x4CAF50)

    // Dunklerer Streifen unten für Erde
    this.add.rectangle(weltBreite / 2, hoehe - 15, weltBreite, 30, 0x795548)

    // === 🌼 GÄNSEBLÜMCHEN ===
    for (let i = 0; i < 35; i++) {
      const blumenX = Phaser.Math.Between(30, weltBreite - 30)
      const blumenY = Phaser.Math.Between(wiesenY + 20, hoehe - 40)
      this.maleGaensebluemchen(blumenX, blumenY)
    }

    // === 🌳 BÄUME (antippbar!) ===
    this.baeume = [] // 🌳 Liste aller Bäume
    this.erstelleInteraktivenBaum(120, wiesenY + 10)
    this.erstelleInteraktivenBaum(380, wiesenY + 30)
    this.erstelleInteraktivenBaum(600, wiesenY + 15)
    this.erstelleInteraktivenBaum(weltBreite - 180, wiesenY + 25)
    this.erstelleInteraktivenBaum(weltBreite - 420, wiesenY + 8)
    this.erstelleInteraktivenBaum(900, wiesenY + 40)

    // === 🪨 STEINE (antippbar!) ===
    this.steine = [] // 🪨 Liste aller Steine
    this.erstelleInteraktivenStein(250, wiesenY + 60)
    this.erstelleInteraktivenStein(520, wiesenY + 80)
    this.erstelleInteraktivenStein(800, wiesenY + 50)
    this.erstelleInteraktivenStein(weltBreite - 300, wiesenY + 70)

    // === 🕳️ MINENEINGANG (unter der Sonne) ===
    this.erstelleMineneingang(weltBreite - 100, wiesenY + 5)

    // === 🧑 SPIELER-FIGUR ===
    this.spieler = this.erstelleSpieler(breite / 2, wiesenY + 60)

    // 📍 Falls gespeicherte Position vorhanden: wiederherstellen!
    if (this.figurDaten._spielerPos) {
      this.spieler.x = this.figurDaten._spielerPos.x
      this.spieler.y = this.figurDaten._spielerPos.y
    }

    // === 🎒 RUCKSACK (globale Variable – bleibt überall gleich!) ===
    this.rucksack = rucksack

    // === 🪵 HERABGEFALLENE MATERIALIEN (einsammelbar) ===
    this.bodenItems = this.add.group()

    // === 🧰 AKTUELLES WERKZEUG ===
    this.werkzeug = 'hand' // 'hand', 'axt' oder 'hacke'

    // === 🎯 ZIEL (wohin die Figur läuft) ===
    this.zielX = null
    this.zielY = null
    this.zielAktion = null // Was passiert wenn die Figur ankommt?

    // === 📦 RUCKSACK-ANZEIGE (oben links) ===
    this.rucksackAnzeige = this.add.text(16, 16, this.getRucksackText(), {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      lineSpacing: 4
    })
    this.rucksackAnzeige.setScrollFactor(0)
    this.rucksackAnzeige.setDepth(100)

    // === 🔨 HAMMER-BUTTON (Bau-Knopf, oben rechts) ===
    this.hammerButton = this.add.text(breite - 16, 16, '🔨', {
      fontSize: '44px',
      backgroundColor: '#795548',
      padding: { x: 10, y: 6 }
    })
    this.hammerButton.setOrigin(1, 0)
    this.hammerButton.setScrollFactor(0)
    this.hammerButton.setDepth(100)
    this.hammerButton.setInteractive()
    this.hammerButton.setAlpha(0.4)
    this.hammerButton.on('pointerdown', () => this.hausBauen())

    // === 🧰 WERKZEUG-LEISTE (unten am Bildschirm) ===
    this.erstelleWerkzeugleiste()

    // === 📺 VOLLBILD-BUTTON ===
    this.vollbildButton = this.add.text(breite - 16, 72, '📺', {
      fontSize: '28px'
    })
    this.vollbildButton.setOrigin(1, 0)
    this.vollbildButton.setScrollFactor(0)
    this.vollbildButton.setDepth(100)
    this.vollbildButton.setInteractive()
    this.vollbildButton.on('pointerdown', () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen()
      } else {
        this.scale.startFullscreen()
      }
    })

    // === � NEU-STARTEN-BUTTON ===
    const neuStartButton = this.add.text(breite - 16, 108, '🔄', {
      fontSize: '28px'
    })
    neuStartButton.setOrigin(1, 0)
    neuStartButton.setScrollFactor(0)
    neuStartButton.setDepth(100)
    neuStartButton.setInteractive({ useHandCursor: true })
    neuStartButton.on('pointerdown', () => {
      this.zeigeNeuStartFrage()
    })

    // === 💬 REDE-BUTTON (mit Milo reden!) ===
    this.redeButton = this.add.text(breite - 16, 148, '💬', {
      fontSize: '28px'
    })
    this.redeButton.setOrigin(1, 0)
    this.redeButton.setScrollFactor(0)
    this.redeButton.setDepth(100)
    this.redeButton.setInteractive({ useHandCursor: true })
    this.redeButton.setAlpha(0) // Erst sichtbar wenn Milo da ist!
    this.redeButton.on('pointerdown', () => {
      this.redeMitMilo()
    })

    // === ⏸️ PAUSE-BUTTON ===
    this.pauseButton = this.add.text(breite - 16, 188, '⏸️', {
      fontSize: '28px'
    })
    this.pauseButton.setOrigin(1, 0)
    this.pauseButton.setScrollFactor(0)
    this.pauseButton.setDepth(100)
    this.pauseButton.setInteractive({ useHandCursor: true })
    this.pauseButton.on('pointerdown', () => {
      this.spielPausieren()
    })

    // === ✉️ BRIEF-BUTTON (Milo einen Brief schreiben!) ===
    this.briefButton = this.add.text(breite - 16, 228, '✉️', {
      fontSize: '28px'
    })
    this.briefButton.setOrigin(1, 0)
    this.briefButton.setScrollFactor(0)
    this.briefButton.setDepth(100)
    this.briefButton.setInteractive({ useHandCursor: true })
    this.briefButton.setAlpha(0) // Erst sichtbar wenn Milo da ist!
    this.briefButton.on('pointerdown', () => {
      this.briefAnMilo()
    })

    this.istPausiert = false

    // === 👆 TOUCH-STEUERUNG ===
    this.input.on('pointerdown', (pointer) => {
      const weltPunkt = this.cameras.main.getWorldPoint(pointer.x, pointer.y)

      // 🏠 Prüfe ob wir auf das Haus getippt haben – dann nicht weiterlaufen!
      if (this.hausZone && this.hausPosition) {
        const hx = this.hausPosition.x
        const hy = this.hausPosition.y - 60
        const abstandHaus = Phaser.Math.Distance.Between(weltPunkt.x, weltPunkt.y, hx, hy)
        if (abstandHaus < 80) return
      }

      // 📌 Prüfe ob wir auf ein Boden-Item (einsammelbares Material) getippt haben
      let itemGetippt = false
      this.bodenItems.getChildren().forEach((item) => {
        if (item.active) {
          const abstand = Phaser.Math.Distance.Between(weltPunkt.x, weltPunkt.y, item.x, item.y)
          if (abstand < 30) {
            // Zum Item laufen und einsammeln!
            this.laufeZu(item.x, item.y, () => {
              this.materialEinsammeln(item)
            })
            itemGetippt = true
          }
        }
      })
      if (itemGetippt) return

      // 🪓 Prüfe ob wir auf einen Baum getippt haben (nur mit Axt!)
      if (this.werkzeug === 'axt') {
        for (const baum of this.baeume) {
          if (baum.holzRest <= 0) continue
          const abstand = Phaser.Math.Distance.Between(weltPunkt.x, weltPunkt.y, baum.x, baum.y - 30)
          if (abstand < 45) {
            // Zum Baum laufen und schlagen!
            this.laufeZu(baum.x + 30, baum.y, () => {
              this.baumSchlagen(baum)
            })
            return
          }
        }
      }

      // ⛏️ Prüfe ob wir auf einen Stein getippt haben (nur mit Hacke!)
      if (this.werkzeug === 'hacke') {
        for (const stein of this.steine) {
          if (stein.steinRest <= 0) continue
          const abstand = Phaser.Math.Distance.Between(weltPunkt.x, weltPunkt.y, stein.x, stein.y)
          if (abstand < 40) {
            // Zum Stein laufen und schlagen!
            this.laufeZu(stein.x + 25, stein.y, () => {
              this.steinSchlagen(stein)
            })
            return
          }
        }
      }

      // 🪒 Prüfe ob wir auf die Wiese getippt haben (nur mit Schaufel!)
      if (this.werkzeug === 'schaufel' && weltPunkt.y > this.wiesenY + 10) {
        // Zur Stelle laufen und graben!
        const grabY = Math.max(this.wiesenY + 15, Math.min(weltPunkt.y, this.scale.height - 30))
        this.laufeZu(weltPunkt.x, grabY, () => {
          this.aufDerWieseGraben(weltPunkt.x, grabY)
        })
        return
      }

      // Sonst: Einfach dorthin laufen (aber nur auf der Wiese!)
      const zielY = Math.max(this.wiesenY + 15, Math.min(weltPunkt.y, this.scale.height - 30))
      this.laufeZu(weltPunkt.x, zielY, null)
    })

    // === ⌨️ TASTATUR-STEUERUNG ===
    this.cursors = this.input.keyboard.createCursorKeys()

    // === 📷 KAMERA folgt dem Spieler ===
    this.cameras.main.setBounds(0, 0, weltBreite, weltHoehe)
    this.cameras.main.startFollow(this.spieler, true, 0.1, 0.1)

    // 🏠 Haus-Status aus globalem Zustand wiederherstellen
    this.hausGebaut = hausDaten.hausGebaut || false
    this.hammerPulsiert = false

    // === WILLKOMMENS-NACHRICHT ===
    // 📋 Zeige die Bau-Anleitung nur wenn noch kein Haus gebaut wurde!
    if (!this.hausGebaut) {
      this.zeigeHausBauAnleitung()
    }

    // Falls Haus schon gebaut war: Haus zeichnen
    if (this.hausGebaut) {
      // ☀️ Himmelfarbe basierend auf Tageszeit!
      this.setzeTagesZeitFarbe()
      // 🏠 Haus wieder hinmalen!
      const hausX = this.scale.width / 2 + 80
      const hausY = this.wiesenY + 30
      this.hausPosition = { x: hausX, y: hausY }
      this.maleHaus(hausX, hausY, hausDaten.wandFarbe, hausDaten.dachFarbe)
      // Hammer = Möbel-Button
      this.hammerButton.setText('🪑')
      this.hammerButton.setAlpha(1)
      this.hammerButton.removeAllListeners()
      this.hammerButton.on('pointerdown', () => this.zeigeMoebelMenu())
      // 🪒 Schaufel immer dabei!
      this.fuegeSchaufelHinzu()
      // 🧑 Freund zeigen wenn gerettet!
      if (hausDaten.personGerettet) {
        this.freundHausBaubar = !hausDaten.freundHausGebaut
        this.erstelleFreund()
        // 💬 Rede-Button sichtbar machen!
        if (this.redeButton) this.redeButton.setAlpha(1)
        // ✉️ Brief-Button sichtbar machen!
        if (this.briefButton) this.briefButton.setAlpha(1)
        // 🏡 Freund-Haus zeichnen wenn schon gebaut
        if (hausDaten.freundHausGebaut) {
          const fHausX = hausX + 180
          const fHausY = hausY
          this.freundHausPosition = { x: fHausX, y: fHausY }
          this.maleFreundHaus(fHausX, fHausY, hausDaten.freundWandFarbe, hausDaten.freundDachFarbe)
          // 🐕 Hund zeigen wenn gerettet!
          if (hausDaten.hundGerettet) {
            this.erstelleHund()
            // 🐾 Welpen zeigen wenn schon geboren!
            if (hausDaten.welpenGeboren) {
              this.erstelleWelpen()
            }
          }
          // 👶 Kinder zeigen wenn schon geboren!
          if (hausDaten.kinder && hausDaten.kinder.length > 0) {
            this.erstelleKinder()
          }
        }
      }

      // 🐕 Hund auch zeigen OHNE Freund-Haus! (z.B. vor dem Nacht-Modus)
      if (!hausDaten.freundHausGebaut && hausDaten.hundGerettet) {
        this.erstelleHund()
        if (hausDaten.welpenGeboren) {
          this.erstelleWelpen()
        }
      }

      // 🐾 Falls Hundebett schon da aber Welpen noch nicht geboren → nachholen!
      if (hausDaten.hundGerettet && !hausDaten.welpenGeboren) {
        const hatHundebett = hausDaten.moebel.some(m => m.name === 'Hundebett')
        if (hatHundebett) {
          this.time.delayedCall(3000, () => {
            this.welpenGeburt()
          })
        }
      }

      // 🌱 Kinder wachsen lassen wenn im Haus geschlafen wurde!
      if (hausDaten.kinderSollenWachsen) {
        hausDaten.kinderSollenWachsen = false
        this.time.delayedCall(2000, () => {
          this.kinderWachsenLassen()
        })
      }
    }

    // 🏘️ DORF-FREUNDE: Freunde aus der Stadt ziehen ins Dorf!
    if (this.hausGebaut) {
      this.erstelleDorfFreunde()
    }

    // 💾 AUTO-SAVE: Alle 5 Sekunden speichern!
    this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => {
        spielSpeichern('BlumenwiesenSpiel', this.figurDaten, {
          x: this.spieler.x,
          y: this.spieler.y
        })
      }
    })

    // ⏰ TAGESZEIT-WECHSEL: Alle 30 Sekunden ändert sich die Zeit!
    if (this.hausGebaut && hausDaten.freundHausGebaut) {
      this.starteTagNachtZyklus()

      // 🌱 Milo wächst beim Spielstart! (wenn er noch nicht ausgewachsen ist)
      if (hausDaten.miloWachstum < 5 && this.freund) {
        this.time.delayedCall(5000, () => {
          hausDaten.miloWachstum += 1
          const stufe = hausDaten.miloWachstum

          // 🌟 Alte Figur weg, neue größere Figur!
          const alteX = this.freund.x
          const alteY = this.freund.y
          this.freund.destroy()
          this.erstelleFreund()
          this.freund.x = alteX
          this.freund.y = alteY

          // 🌱 Nachricht zeigen!
          const texte = [
            '',
            '🌱 Milo ist gewachsen! 💪',
            '🌱 Milo wird größer! 👟✊',
            '🌿 Milo wächst! 👕',
            '🌳 Milo ist fast groß! 🥺',
            '⭐ WOW! Milo ist ausgewachsen! 🎉'
          ]
          const msg = this.add.text(
            this.freund.x, this.freund.y - 60,
            texte[stufe] || '🌱 Milo wächst!', {
              fontSize: '14px', fontFamily: 'Arial', color: '#FFD700',
              stroke: '#000000', strokeThickness: 3,
              align: 'center', backgroundColor: '#333333',
              padding: { x: 8, y: 6 }
            }
          ).setOrigin(0.5).setDepth(200)
          this.tweens.add({
            targets: msg, alpha: 0, duration: 800, delay: 3000,
            onComplete: () => msg.destroy()
          })

          // 🎵 Wachstums-Sound!
          const melodie = [523, 659, 784]
          melodie.forEach((n, i) => setTimeout(() => spieleTon(n, 0.15, 0.05, 'sine'), i * 100))

          // 🎉 Konfetti bei Stufe 5!
          if (stufe === 5) {
            soundKonfetti()
            for (let i = 0; i < 20; i++) {
              const k = this.add.circle(
                this.freund.x + Phaser.Math.Between(-60, 60),
                this.freund.y - 40,
                Phaser.Math.Between(3, 6),
                Phaser.Math.RND.pick([0xFF5252, 0xFFD740, 0x69F0AE, 0x448AFF, 0xE040FB])
              ).setDepth(300)
              this.tweens.add({
                targets: k,
                y: k.y + Phaser.Math.Between(60, 120),
                alpha: 0,
                duration: Phaser.Math.Between(1000, 2000),
                onComplete: () => k.destroy()
              })
            }
          }

          // 💾 Speichern!
          spielSpeichern('BlumenwiesenSpiel', this.figurDaten, {
            x: this.spieler.x, y: this.spieler.y
          })
        })
      }
    }

    // 😅 MILO HAT MANCHMAL SCHWIERIGKEITEN! (alle 90-180 Sekunden)
    if (hausDaten.freundHausGebaut) {
      this.starteMiloSchwierigkeiten()
    }

    // ✉️ MILO SCHICKT MANCHMAL BRIEFE! (alle 2-4 Minuten)
    if (hausDaten.freundHausGebaut) {
      this.starteMiloBriefe()
    }
  }

  // === 🚶 ZUM ZIEL LAUFEN ===
  // Die Figur läuft zu einem Punkt und führt dann eine Aktion aus
  laufeZu(x, y, aktion) {
    this.zielX = x
    this.zielY = y
    this.zielAktion = aktion
  }

  // 🔄 update: Wird 60x pro Sekunde aufgerufen!
  update() {
    // ⏸️ Wenn pausiert: Nichts machen!
    if (this.istPausiert) return

    const speed = 160

    // ⌨️ Tastatur-Steuerung
    if (this.cursors.left.isDown || this.cursors.right.isDown ||
        this.cursors.up.isDown || this.cursors.down.isDown) {
      // Tastatur hat Vorrang!
      this.zielX = null
      this.zielY = null
      this.zielAktion = null

      let vx = 0
      let vy = 0
      if (this.cursors.left.isDown) vx = -speed
      if (this.cursors.right.isDown) vx = speed
      if (this.cursors.up.isDown) vy = -speed
      if (this.cursors.down.isDown) vy = speed

      this.spieler.body.setVelocity(vx, vy)

      // Spieler darf nicht über die Wiese hinaus
      this.begrenzePosition()
    } else if (this.zielX !== null && this.zielY !== null) {
      // 👆 Touch: Zum Ziel laufen
      const abstandX = this.zielX - this.spieler.x
      const abstandY = this.zielY - this.spieler.y
      const abstand = Math.sqrt(abstandX * abstandX + abstandY * abstandY)

      if (abstand > 8) {
        // Richtung berechnen und normalisieren
        const vx = (abstandX / abstand) * speed
        const vy = (abstandY / abstand) * speed
        this.spieler.body.setVelocity(vx, vy)
      } else {
        // Angekommen! 🎉
        this.spieler.body.setVelocity(0, 0)
        this.spieler.x = this.zielX
        this.spieler.y = this.zielY
        this.zielX = null
        this.zielY = null

        // Aktion ausführen wenn es eine gibt!
        if (this.zielAktion) {
          const aktion = this.zielAktion
          this.zielAktion = null
          aktion()
        }
      }
    } else {
      this.spieler.body.setVelocity(0, 0)
    }

    // Spieler auf der Wiese halten
    this.begrenzePosition()

    // 🔨 Hammer aktualisieren
    this.aktualisiereHammerButton()

    // 🏡 Freund-Haus Hammer prüfen
    if (this.freundHausBaubar && !hausDaten.freundHausGebaut) {
      this.aktualisiereFreundHammer()
    }

    // 🚶 Milo läuft frei auf der Wiese herum! (nicht wenn er schläft!)
    if (this.freund && this.freund.active && this.freundZielX !== null && !this.miloSchlaeft) {
      const abstandMilo = Phaser.Math.Distance.Between(
        this.freund.x, this.freund.y,
        this.freundZielX, this.freundZielY
      )
      if (abstandMilo > 8) {
        // Zum Ziel laufen
        const winkel = Phaser.Math.Angle.Between(
          this.freund.x, this.freund.y,
          this.freundZielX, this.freundZielY
        )
        this.freund.x += Math.cos(winkel) * 0.6
        this.freund.y += Math.sin(winkel) * 0.6
      } else {
        // Angekommen! Kurz warten, dann neues Ziel
        this.freundZielX = null
        this.freundZielY = null
        if (!this.freundWartet) {
          this.freundWartet = true
          const wartezeit = Phaser.Math.Between(2000, 5000)
          this.time.delayedCall(wartezeit, () => {
            this.freundWartet = false
            this.setzeMiloNeuesZiel()
          })
        }
      }
    }

    // 🏘️ Dorf-Freunde bewegen und Material sammeln!
    this.aktualisiereDorfFreunde()

    // 🐕 Hund folgt dem Spieler (schneller und näher!)
    if (this.hundFolgt && this.hund && this.hund.active) {
      const abstandHund = Phaser.Math.Distance.Between(
        this.hund.x, this.hund.y,
        this.spieler.x, this.spieler.y
      )
      // 🐕 Hund läuft schneller und kommt näher ran!
      if (abstandHund > 35) {
        const winkelH = Phaser.Math.Angle.Between(
          this.hund.x, this.hund.y,
          this.spieler.x, this.spieler.y
        )
        this.hund.x += Math.cos(winkelH) * 1.5
        this.hund.y += Math.sin(winkelH) * 1.5
      }
    }

    // 🐕 Bello wandert alleine über die Wiese!
    if (!this.hundFolgt && this.hund && this.hund.active && this.hundZielX !== null && !this.hundWartet) {
      const abstandB = Phaser.Math.Distance.Between(
        this.hund.x, this.hund.y,
        this.hundZielX, this.hundZielY
      )
      if (abstandB > 8) {
        // 🐕 Bello läuft gemütlich zum Ziel
        const winkelB = Phaser.Math.Angle.Between(
          this.hund.x, this.hund.y,
          this.hundZielX, this.hundZielY
        )
        this.hund.x += Math.cos(winkelB) * 0.5
        this.hund.y += Math.sin(winkelB) * 0.5
        // 🐕 Bello guckt in die Laufrichtung!
        this.hund.setScale(this.hundZielX < this.hund.x ? -1 : 1, 1)
      } else {
        // 🐕 Am Ziel angekommen! Kurz ausruhen, dann weiter!
        this.hundZielX = null
        this.hundWartet = true
        this.time.delayedCall(Phaser.Math.Between(3000, 6000), () => {
          this.hundWartet = false
          this.setzeBelloNeuesZiel()
        })
      }
    }

    // � Welpen folgen dem Hund! (wie eine kleine Reihe)
    if (this.welpen && this.welpen.length > 0 && this.hund && this.hund.active) {
      this.welpen.forEach((welpe, i) => {
        if (!welpe || !welpe.active) return
        // Erster Welpe folgt dem Hund, die anderen folgen dem Welpen davor!
        const ziel = i === 0 ? this.hund : this.welpen[i - 1]
        const abstandW = Phaser.Math.Distance.Between(
          welpe.x, welpe.y, ziel.x, ziel.y
        )
        if (abstandW > 22) {
          const winkelW = Phaser.Math.Angle.Between(
            welpe.x, welpe.y, ziel.x, ziel.y
          )
          welpe.x += Math.cos(winkelW) * 1.3
          welpe.y += Math.sin(winkelW) * 1.3
        }
      })
    }

    // �👶 Kinder laufen in der Nähe von Milo herum!
    if (this.kinderSprites && this.kinderSprites.length > 0 && this.freund && this.freund.active && !this.miloSchlaeft) {
      this.kinderSprites.forEach((baby, i) => {
        if (!baby || !baby.active) return
        const ziel = this.kinderZiele[i]
        if (!ziel || ziel.x === null) return

        const abstandK = Phaser.Math.Distance.Between(baby.x, baby.y, ziel.x, ziel.y)
        if (abstandK > 5) {
          // 👶 Baby wackelt zum Ziel! (langsamer als Milo)
          const winkelK = Phaser.Math.Angle.Between(baby.x, baby.y, ziel.x, ziel.y)
          baby.x += Math.cos(winkelK) * 0.4
          baby.y += Math.sin(winkelK) * 0.4
        } else {
          // 🎯 Angekommen! Neues Ziel nach kurzer Pause
          this.kinderZiele[i] = { x: null, y: null }
          this.time.delayedCall(Phaser.Math.Between(1500, 4000), () => {
            this.setzeKindNeuesZiel(i)
          })
        }
      })
    }

    // ⛏️🕳️ Prüfe ob Spieler am Mineneingang ist
    if (this.minenEingang) {
      const abstand = Phaser.Math.Distance.Between(
        this.spieler.x, this.spieler.y,
        this.minenEingang.x, this.minenEingang.y
      )
      if (abstand < 30) {
        // In die Mine gehen! ⛏️
        soundMine()
        spielSpeichern('MinenSzene', this.figurDaten, null)
        this.scene.start('MinenSzene', this.figurDaten)
      }
    }
  }

  // 🌿 Spieler auf der Wiese halten
  begrenzePosition() {
    if (this.spieler.y < this.wiesenY + 15) {
      this.spieler.y = this.wiesenY + 15
      this.spieler.body.setVelocityY(0)
    }
    if (this.spieler.y > this.scale.height - 30) {
      this.spieler.y = this.scale.height - 30
      this.spieler.body.setVelocityY(0)
    }
  }

  // === 🧰 WERKZEUG-LEISTE ===
  erstelleWerkzeugleiste() {
    const breite = this.scale.width
    const hoehe = this.scale.height
    const leisteY = hoehe - 32

    // Hintergrund-Leiste
    const leiste = this.add.rectangle(breite / 2, leisteY, 260, 50, 0x000000, 0.5)
    leiste.setScrollFactor(0)
    leiste.setDepth(99)

    const werkzeuge = [
      { name: 'hand', emoji: '✋', label: 'Laufen' },
      { name: 'axt', emoji: '🪓', label: 'Axt' },
      { name: 'hacke', emoji: '⛏️', label: 'Hacke' }
    ]

    this.werkzeugButtons = {}

    werkzeuge.forEach((w, index) => {
      const x = breite / 2 - 80 + index * 80

      // Hintergrund-Kreis
      const bg = this.add.circle(x, leisteY, 22, this.werkzeug === w.name ? 0x4CAF50 : 0x616161)
      bg.setScrollFactor(0)
      bg.setDepth(100)
      bg.setInteractive({ useHandCursor: true })

      // Emoji drauf
      const emoji = this.add.text(x, leisteY, w.emoji, {
        fontSize: '24px'
      }).setOrigin(0.5)
      emoji.setScrollFactor(0)
      emoji.setDepth(101)

      // Beim Antippen → Werkzeug wechseln!
      bg.on('pointerdown', () => {
        this.werkzeug = w.name
        // 🔊 Klick-Sound!
        soundKlick()
        // Alle Buttons aktualisieren
        Object.keys(this.werkzeugButtons).forEach((key) => {
          this.werkzeugButtons[key].bg.fillColor =
            key === w.name ? 0x4CAF50 : 0x616161
        })
        this.zeigeNachricht(`${w.emoji} ${w.label} ausgewählt!`)
      })

      this.werkzeugButtons[w.name] = { bg, emoji }
    })
  }

  // === 🧑 SPIELER ERSTELLEN ===
  erstelleSpieler(x, y) {
    const figur = this.add.container(x, y)
    maleFigur(this, figur, this.figurDaten, 0.75)

    // 🏷️ Namensschild unter der Figur!
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
    figur.body.setBounce(0)

    figur.setDepth(50) // Spieler ist immer über den Blumen

    return figur
  }

  // === 🌳 INTERAKTIVEN BAUM ERSTELLEN ===
  erstelleInteraktivenBaum(x, y) {
    // 🌳 Baum malen
    const stamm = this.add.rectangle(x, y - 25, 12, 50, 0x795548)
    const blaetter1 = this.add.circle(x, y - 60, 30, 0x2E7D32)
    const blaetter2 = this.add.circle(x - 20, y - 45, 22, 0x388E3C)
    const blaetter3 = this.add.circle(x + 20, y - 45, 22, 0x388E3C)

    // Alles in einen Container
    const container = this.add.container(0, 0, [stamm, blaetter1, blaetter2, blaetter3])

    // Baum-Daten speichern
    const baum = {
      x: x,
      y: y,
      container: container,
      holzRest: 3, // 🪵 3 Stück Holz pro Baum
      stamm: stamm
    }

    this.baeume.push(baum)
    return baum
  }

  // === 🪓 BAUM SCHLAGEN ===
  baumSchlagen(baum) {
    if (baum.holzRest <= 0) {
      this.zeigeNachricht('🌳 Dieser Baum hat kein Holz mehr!')
      return
    }

    // 🪓 Schlag-Animation! Baum wackelt!
    this.tweens.add({
      targets: baum.container,
      x: baum.container.x - 4,
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        baum.container.x = 0 // Zurücksetzen
      }
    })

    // Holz wird weniger
    baum.holzRest -= 1

    // 🪵 Holzstück fällt heraus!
    const holzX = baum.x + Phaser.Math.Between(-20, 20)
    const holzStartY = baum.y - 30
    const holzZielY = baum.y + Phaser.Math.Between(10, 30)

    // Holzstück erstellen (startet oben am Baum)
    const holz = this.add.rectangle(holzX, holzStartY, 20, 10, 0x8D6E63)
    this.add.rectangle(holzX, holzStartY, 16, 1, 0x6D4C41) // Maserung
    holz.materialTyp = 'holz'
    holz.setDepth(45)

    // 🪵 Holz fällt herunter Animation
    this.tweens.add({
      targets: holz,
      y: holzZielY,
      angle: Phaser.Math.Between(-30, 30),
      duration: 500,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        // Jetzt kann man es einsammeln!
        holz.setInteractive()
        this.bodenItems.add(holz)
      }
    })

    // 🔊 Hack-Geräusch!
    soundHolzHacken()
    this.zeigeNachricht('🪓 *Hack!* 🪵')

    // 🌳 Wenn der Baum leer ist → er fällt um!
    if (baum.holzRest <= 0) {
      this.time.delayedCall(300, () => {
        // Baum kippt zur Seite und fällt um! 🌳💨
        this.tweens.add({
          targets: baum.container,
          angle: 90,
          alpha: 0,
          y: baum.container.y + 20,
          duration: 800,
          ease: 'Quad.easeIn',
          onComplete: () => {
            baum.container.destroy()
          }
        })
        soundBaumFaellt()
        this.zeigeNachricht('🌳 Timber! 💨')
      })
    }
  }

  // === 🪨 INTERAKTIVEN STEIN ERSTELLEN ===
  erstelleInteraktivenStein(x, y) {
    // Großer Felsen (mehrere Kreise)
    const stein1 = this.add.circle(x, y, 18, 0x757575)
    const stein2 = this.add.circle(x + 12, y + 5, 14, 0x9E9E9E)
    const stein3 = this.add.circle(x - 8, y + 8, 12, 0x616161)
    // Glanzpunkt
    const glanz = this.add.circle(x - 5, y - 8, 4, 0xBDBDBD).setAlpha(0.6)

    const container = this.add.container(0, 0, [stein1, stein2, stein3, glanz])

    const stein = {
      x: x,
      y: y,
      container: container,
      steinRest: 2 // 🪨 2 Stück Stein pro Felsen
    }

    this.steine.push(stein)
    return stein
  }

  // === ⛏️ STEIN SCHLAGEN ===
  steinSchlagen(stein) {
    if (stein.steinRest <= 0) {
      this.zeigeNachricht('🪨 Dieser Felsen hat keinen Stein mehr!')
      return
    }

    // ⛏️ Schlag-Animation! Stein wackelt!
    this.tweens.add({
      targets: stein.container,
      x: stein.container.x - 3,
      duration: 50,
      yoyo: true,
      repeat: 2
    })

    stein.steinRest -= 1

    // 🪨 Steinstück fällt heraus!
    const steinX = stein.x + Phaser.Math.Between(-15, 25)
    const steinStartY = stein.y - 10
    const steinZielY = stein.y + Phaser.Math.Between(15, 30)

    const stueck = this.add.circle(steinX, steinStartY, 8, 0x9E9E9E)
    this.add.circle(steinX - 2, steinStartY - 2, 2, 0xBDBDBD) // Glanz
    stueck.materialTyp = 'stein'
    stueck.setDepth(45)

    this.tweens.add({
      targets: stueck,
      y: steinZielY,
      duration: 400,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        stueck.setInteractive()
        this.bodenItems.add(stueck)
      }
    })

    // 🔊 Stein-Geräusch!
    soundSteinKlopfen()
    this.zeigeNachricht('⛏️ *Klonk!* 🪨')

    if (stein.steinRest <= 0) {
      // 🪨 Steine fliegen auseinander! 💥
      this.time.delayedCall(200, () => {
        // Jedes Steinteil fliegt in eine andere Richtung!
        const teile = stein.container.getAll()
        teile.forEach((teil) => {
          const richtungX = Phaser.Math.Between(-60, 60)
          const richtungY = Phaser.Math.Between(-40, 30)
          this.tweens.add({
            targets: teil,
            x: teil.x + richtungX,
            y: teil.y + richtungY,
            alpha: 0,
            scale: 0.3,
            angle: Phaser.Math.Between(-180, 180),
            duration: 600,
            ease: 'Quad.easeOut'
          })
        })
        // Container danach aufräumen
        this.time.delayedCall(700, () => {
          stein.container.destroy()
        })
        soundSteinZerbricht()
        this.zeigeNachricht('🪨 *Krach!* 💥')
      })
    }
  }

  // === 🕳️ MINENEINGANG ===
  erstelleMineneingang(x, y) {
    // Dunkles Loch im Boden
    const loch = this.add.ellipse(x, y + 5, 50, 25, 0x1A1A1A)
    loch.setDepth(2)

    // Rahmen drumherum (Steine)
    this.add.circle(x - 20, y, 8, 0x616161).setDepth(3)
    this.add.circle(x + 20, y, 8, 0x616161).setDepth(3)
    this.add.circle(x - 10, y - 8, 7, 0x757575).setDepth(3)
    this.add.circle(x + 10, y - 8, 7, 0x757575).setDepth(3)

    // Schild: "⛏️ Mine"
    const schild = this.add.text(x, y - 25, '⛏️ Mine', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)
    schild.setDepth(4)

    this.minenEingang = { x: x, y: y + 5 }
  }

  // === 🪒 AUF DER WIESE GRABEN (Schatzsuche!) ===
  aufDerWieseGraben(x, y) {
    // 🔊 Grab-Sound!
    soundGraben()

    // 🕳️ Loch in der Wiese malen!
    const loch = this.add.ellipse(x, y + 5, 35, 18, 0x5D4037)
    loch.setDepth(1)
    const lochRand = this.add.ellipse(x, y + 5, 38, 20, 0x4E342E)
    lochRand.setDepth(0)

    // 🌍 Erde fliegt hoch! (wie beim Graben)
    for (let i = 0; i < 6; i++) {
      const erdFarbe = Phaser.Math.RND.pick([0x795548, 0x8D6E63, 0x5D4037, 0x6D4C41])
      const erdKlumpen = this.add.circle(
        x + Phaser.Math.Between(-10, 10),
        y,
        Phaser.Math.Between(3, 7),
        erdFarbe
      ).setDepth(50)

      this.tweens.add({
        targets: erdKlumpen,
        x: erdKlumpen.x + Phaser.Math.Between(-40, 40),
        y: erdKlumpen.y - Phaser.Math.Between(20, 50),
        alpha: 0,
        duration: 600,
        ease: 'Quad.easeOut',
        onComplete: () => erdKlumpen.destroy()
      })
    }

    // 🎲 Was finden wir? Zufällig!
    const zufall = Phaser.Math.Between(1, 100)
    let fund = null

    if (zufall <= 25) {
      // 🪵 Holz gefunden! (25% Chance)
      fund = { typ: 'holz', emoji: '🪵', nachricht: '🪒 *Buddel!* Du hast Holz gefunden! 🪵' }
    } else if (zufall <= 40) {
      // 🪨 Stein gefunden! (15% Chance)
      fund = { typ: 'stein', emoji: '🪨', nachricht: '🪒 *Schaufel!* Ein Stein! 🪨' }
    } else if (zufall <= 48) {
      // 💎 Edelstein! (8% Chance – selten!)
      fund = { typ: 'edelstein', emoji: '💎', nachricht: '🪒 WOW! Ein Edelstein!! 💎✨' }
    } else if (zufall <= 60) {
      // 🐛 Wurm! (12% Chance – lustig!)
      fund = { typ: 'wurm', emoji: '🐛', nachricht: '🪒 Hihihi! Ein Wurm! 🐛' }
    } else if (zufall <= 72) {
      // 🌱 Samen! (12% Chance)
      fund = { typ: 'samen', emoji: '🌱', nachricht: '🪒 Oh! Ein kleiner Samen! 🌱' }
    } else {
      // 💨 Nix gefunden (28% Chance)
      this.zeigeNachricht('🪒 *Buddel buddel...* Nur Erde! 🌍')
    }

    if (fund) {
      // 🎉 Fund-Animation! Gegenstand springt aus dem Loch!
      const fundEmoji = this.add.text(x, y, fund.emoji, {
        fontSize: '28px'
      }).setOrigin(0.5).setDepth(51)

      // Hochspringen!
      this.tweens.add({
        targets: fundEmoji,
        y: y - 50,
        duration: 400,
        ease: 'Back.easeOut',
        onComplete: () => {
          // Sanft fallen
          this.tweens.add({
            targets: fundEmoji,
            y: y + 5,
            duration: 300,
            ease: 'Bounce.easeOut',
            onComplete: () => {
              // Material einsammeln wenn es Holz oder Stein ist
              if (fund.typ === 'holz' || fund.typ === 'stein') {
                const maximal = { holz: 10, stein: 5 }
                if (this.rucksack[fund.typ] < maximal[fund.typ]) {
                  this.rucksack[fund.typ] += 1
                  this.rucksackAnzeige.setText(this.getRucksackText())
                }
              }

              // Edelstein = Konfetti-Feier! 🎉
              if (fund.typ === 'edelstein') {
                this.konfetti()
              }

              // Emoji langsam verschwinden lassen
              this.tweens.add({
                targets: fundEmoji,
                alpha: 0, scale: 0.3,
                duration: 800,
                delay: 500,
                onComplete: () => fundEmoji.destroy()
              })
            }
          })
        }
      })

      this.zeigeNachricht(fund.nachricht)
    }

    // 🕳️ Loch verschwindet nach ein paar Sekunden
    this.time.delayedCall(4000, () => {
      this.tweens.add({
        targets: [loch, lochRand],
        alpha: 0,
        duration: 1000,
        onComplete: () => { loch.destroy(); lochRand.destroy() }
      })
    })
  }

  // === 🎒 MATERIAL EINSAMMELN ===
  materialEinsammeln(material) {
    const typ = material.materialTyp
    const maximal = { holz: 10, stein: 5, eisen: 9 }

    if (this.rucksack[typ] >= maximal[typ]) {
      this.zeigeNachricht(`${this.getEmoji(typ)} Genug ${typ}!`)
      return
    }

    // ✨ Einsammel-Animation
    this.tweens.add({
      targets: material,
      scale: 1.5,
      alpha: 0,
      y: material.y - 30,
      duration: 400,
      onComplete: () => material.destroy()
    })

    this.rucksack[typ] += 1
    // 🔊 Einsammel-Sound!
    soundEinsammeln()
    this.rucksackAnzeige.setText(this.getRucksackText())
    this.zeigeNachricht(`${this.getEmoji(typ)} +1 ${typ}!`)
  }

  // === 🌼 GÄNSEBLÜMCHEN MALEN ===
  maleGaensebluemchen(x, y) {
    this.add.rectangle(x, y - 8, 2, 16, 0x388E3C)
    const bluetenFarbe = 0xFFFFFF
    const abstand = 5
    this.add.circle(x, y - 20, 4, bluetenFarbe)
    this.add.circle(x + abstand, y - 18, 4, bluetenFarbe)
    this.add.circle(x - abstand, y - 18, 4, bluetenFarbe)
    this.add.circle(x + abstand, y - 14, 4, bluetenFarbe)
    this.add.circle(x - abstand, y - 14, 4, bluetenFarbe)
    this.add.circle(x, y - 16, 3, 0xFFEB3B)
  }

  // === 🌈 REGENBOGEN ===
  maleRegenbogen(x, y, radius) {
    const farben = [0xFF0000, 0xFF9800, 0xFFEB3B, 0x4CAF50, 0x2196F3, 0x3F51B5, 0x9C27B0]
    const graphics = this.add.graphics()
    farben.forEach((farbe, index) => {
      graphics.lineStyle(6, farbe, 0.7)
      graphics.beginPath()
      graphics.arc(x, y + radius, radius - index * 8, Math.PI, 0, false)
      graphics.strokePath()
    })
  }

  // === ☀️ SONNE ===
  maleSonne(x, y) {
    // ☀️ Alle Teile der Sonne merken (damit wir sie später entfernen können!)
    this.sonnenTeile = []
    this.sonnenPosition = { x, y }
    const graphics = this.add.graphics()
    graphics.lineStyle(3, 0xFFD700, 0.6)
    for (let winkel = 0; winkel < 360; winkel += 30) {
      const rad = Phaser.Math.DegToRad(winkel)
      graphics.lineBetween(
        x + Math.cos(rad) * 35, y + Math.sin(rad) * 35,
        x + Math.cos(rad) * 55, y + Math.sin(rad) * 55
      )
    }
    this.sonnenTeile.push(graphics)
    const kreis = this.add.circle(x, y, 30, 0xFFD700)
    this.sonnenTeile.push(kreis)
    const auge1 = this.add.circle(x - 8, y - 5, 3, 0xFF8F00)
    this.sonnenTeile.push(auge1)
    const auge2 = this.add.circle(x + 8, y - 5, 3, 0xFF8F00)
    this.sonnenTeile.push(auge2)
    const lachen = this.add.graphics()
    lachen.lineStyle(2, 0xFF8F00)
    lachen.beginPath()
    lachen.arc(x, y, 12, 0.2, Math.PI - 0.2, false)
    lachen.strokePath()
    this.sonnenTeile.push(lachen)
  }

  // === 🌙 MOND MALEN ===
  maleMond(x, y) {
    // 🌙 Alle Teile merken!
    this.mondTeile = []
    // 🟡 Großer gelber Kreis
    const mond = this.add.circle(x, y, 28, 0xFFF9C4)
    this.mondTeile.push(mond)
    // 🌑 Dunkler Kreis drüber = Mondsichel!
    const schatten = this.add.circle(x + 12, y - 8, 22, 0x1A237E)
    this.mondTeile.push(schatten)
    // ✨ Kleine Sterne drum herum!
    const sternPositionen = [
      { sx: x - 50, sy: y - 30 },
      { sx: x + 45, sy: y + 25 },
      { sx: x - 35, sy: y + 40 },
      { sx: x + 60, sy: y - 15 },
      { sx: x - 60, sy: y + 10 },
      { sx: x + 30, sy: y - 45 },
    ]
    sternPositionen.forEach(s => {
      const stern = this.add.text(s.sx, s.sy, '✨', {
        fontSize: '12px'
      }).setOrigin(0.5)
      this.mondTeile.push(stern)
      // ✨ Sterne funkeln!
      this.tweens.add({
        targets: stern,
        alpha: 0.3,
        duration: 800 + Math.random() * 600,
        yoyo: true,
        repeat: -1
      })
    })
  }

  // === ⏰ TAGESZEIT-SYSTEM ===

  // 🎨 Himmelfarbe basierend auf aktueller Tageszeit setzen
  setzeTagesZeitFarbe() {
    const farben = {
      'morgen': '#F5A040',  // 🌅 Orange-Morgen
      'tag': '#87CEEB',     // ☀️ Hellblau
      'abend': '#E86838',   // 🌇 Rot-Orange
      'nacht': '#1A237E'    // 🌙 Dunkelblau
    }
    const farbe = farben[hausDaten.tagesZeit] || '#87CEEB'
    this.cameras.main.setBackgroundColor(farbe)

    // Sonne oder Mond zeigen
    if (hausDaten.tagesZeit === 'nacht') {
      // Sonne weg, Mond her!
      if (this.sonnenTeile) {
        this.sonnenTeile.forEach(teil => teil.destroy())
        this.sonnenTeile = null
      }
      const mondX = this.sonnenPosition ? this.sonnenPosition.x : 700
      const mondY = this.sonnenPosition ? this.sonnenPosition.y : 80
      if (!this.mondTeile || this.mondTeile.length === 0) {
        this.maleMond(mondX, mondY)
      }
      this.istNacht = true
    } else {
      // Mond weg, Sonne her!
      if (this.mondTeile) {
        this.mondTeile.forEach(teil => teil.destroy())
        this.mondTeile = null
      }
      this.istNacht = false
      // Sonne nur malen wenn sie noch nicht da ist
      if (!this.sonnenTeile || this.sonnenTeile.length === 0) {
        const sonneX = this.sonnenPosition ? this.sonnenPosition.x : 700
        const sonneY = this.sonnenPosition ? this.sonnenPosition.y : 80
        this.maleSonne(sonneX, sonneY)
      }
    }
  }

  // ⏰ Tag-Nacht-Zyklus starten! Alle 60 Sekunden wechselt die Tageszeit
  starteTagNachtZyklus() {
    // Gleich die richtige Farbe setzen
    this.setzeTagesZeitFarbe()

    // ⏰ Alle 30 Sekunden: Nächste Tageszeit!
    this.time.addEvent({
      delay: 30000, // 30 Sekunden pro Phase (schneller = mehr Spaß!)
      loop: true,
      callback: () => {
        this.naechsteTagesZeit()
      }
    })

    // 🕐 Uhr-Anzeige oben in der Mitte
    this.zeitAnzeige = this.add.text(this.scale.width / 2, 8, '', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100)
    this.aktualisiereZeitAnzeige()
  }

  // === 😅 MILO HAT MANCHMAL SCHWIERIGKEITEN ===
  starteMiloSchwierigkeiten() {
    // ⏰ Alle 90-180 Sekunden passiert etwas!
    const naechsteSchwierigkeit = () => {
      const wartezeit = Phaser.Math.Between(90000, 180000) // 1.5 bis 3 Minuten
      this.time.delayedCall(wartezeit, () => {
        // 🌙 Nicht wenn Milo schläft oder pausiert
        if (!this.miloSchlaeft && !this.istPausiert && this.freund && this.freund.active) {
          this.miloHatSchwierigkeit()
        }
        naechsteSchwierigkeit() // Nächste Schwierigkeit planen!
      })
    }
    naechsteSchwierigkeit()
  }

  // === ✉️ MILO SCHICKT BRIEFE ===
  starteMiloBriefe() {
    const naechsterBrief = () => {
      const wartezeit = Phaser.Math.Between(120000, 240000) // 2-4 Minuten
      this.time.delayedCall(wartezeit, () => {
        if (!this.miloSchlaeft && !this.istPausiert && !this.miloRedet && this.freund && this.freund.active) {
          this.miloSchicktBrief()
        }
        naechsterBrief()
      })
    }
    naechsterBrief()
  }

  // ✉️ Milo schickt einen Brief an den Spieler!
  miloSchicktBrief() {
    // 🎲 Zufälligen Brief auswählen!
    const briefe = [
      { betreff: '💕 Freundschaft', text: 'Liebe Freundin,\ndu bist die tollste Person\ndie ich kenne! Hab dich lieb!\n💕 Dein Milo', geschenk: null },
      { betreff: '🌸 Eine Blume', text: 'Hallo!\nIch habe eine schöne Blume\nfür dich gepflückt! 🌺\nDein Milo', geschenk: { emoji: '🌺', text: 'eine Blume' } },
      { betreff: '🪨 Ein Geschenk', text: 'Hey!\nIch habe einen Stein gefunden\nder glitzert! Den schenke\nich dir!\nDein Milo', geschenk: { emoji: '🪨', feld: 'stein', menge: 1, text: 'einen Stein' } },
      { betreff: '🎨 Ein Bild', text: 'Schau mal!\nIch habe ein Bild für\ndich gemalt! 🖼️ Es zeigt\nuns beide! ❤️\nDein Milo', geschenk: { emoji: '🖼️', text: 'ein Bild' } },
      { betreff: '🤗 Umarmung', text: 'Hallo!\nDieser Brief ist eine\ngroße Umarmung! 🤗\nDrück ihn fest an dich!\nDein Milo', geschenk: null },
      { betreff: '⭐ Du bist toll', text: 'Hey!\nWusstest du dass du die\nbeste Baumeisterin bist?\n⭐ Du bist ein Star!\nDein Milo', geschenk: null },
      { betreff: '🍪 Ein Keks', text: 'Psst!\nIch habe einen Keks\nfür dich gebacken! 🍪\nHoffentlich schmeckt er!\nDein Milo', geschenk: { emoji: '🍪', text: 'einen Keks' } },
      { betreff: '🪵 Holz!', text: 'Hallo!\nIch habe Holz gesammelt\nund schenke es dir! 🪵\nVielleicht kannst du was\ntolles bauen!\nDein Milo', geschenk: { emoji: '🪵', feld: 'holz', menge: 2, text: '2 Holz' } },
      { betreff: '🌟 Geheimnis', text: 'Psst! Geheim!\nIch verrate dir was:\nDu bist meine allerliebste\nFreundin auf der GANZEN Welt!\n🤫💕 Dein Milo', geschenk: null },
      { betreff: '🐕 Von Bello', text: 'WUFF WUFF!\n(Bello sagt Hallo und\nschleckt dir übers Gesicht!)\n🐕💕\nÜbersetzt von Milo', geschenk: null },
    ]

    const brief = Phaser.Math.RND.pick(briefe)

    // 🎵 Brief-Sound!
    spieleTon(600, 0.15, 0.05, 'sine')
    setTimeout(() => spieleTon(750, 0.15, 0.05, 'sine'), 200)
    setTimeout(() => spieleTon(900, 0.15, 0.05, 'sine'), 400)

    // ✉️ Brief fliegt von Milo zum Spieler!
    const fliegenderBrief = this.add.text(
      this.freund.x, this.freund.y - 30, '✉️', { fontSize: '28px' }
    ).setDepth(300)

    this.tweens.add({
      targets: fliegenderBrief,
      x: this.spieler.x,
      y: this.spieler.y - 40,
      duration: 1500,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        fliegenderBrief.destroy()

        // 🎵 Pling! Brief angekommen!
        spieleTon(1047, 0.2, 0.05, 'sine')

        // 📜 Brief-Overlay anzeigen!
        const breite = this.scale.width
        const hoehe = this.scale.height

        const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.6)
        overlay.setScrollFactor(0).setDepth(400).setInteractive()

        const papier = this.add.rectangle(breite / 2, hoehe / 2, breite * 0.8, hoehe * 0.65, 0xFFF8E1)
        papier.setStrokeStyle(3, 0xFF7043).setScrollFactor(0).setDepth(401)

        // ✉️ Von Milo!
        const vonMilo = this.add.text(breite / 2, hoehe * 0.22, '✉️ Post von Milo!', {
          fontSize: '20px', fontFamily: 'Arial', color: '#FF7043',
          stroke: '#D7CCC8', strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(402)

        const betreff = this.add.text(breite / 2, hoehe * 0.3, `📋 ${brief.betreff}`, {
          fontSize: '14px', fontFamily: 'Arial', color: '#8D6E63'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(402)

        const inhalt = this.add.text(breite / 2, hoehe * 0.48, brief.text, {
          fontSize: '14px', fontFamily: 'Arial', color: '#3E2723',
          align: 'center', wordWrap: { width: 250 }, lineSpacing: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(402)

        const elemente = [overlay, papier, vonMilo, betreff, inhalt]

        // 🎁 Geschenk?
        if (brief.geschenk) {
          const geschenkInfo = this.add.text(breite / 2, hoehe * 0.68,
            `🎁 Milo schenkt dir ${brief.geschenk.text}! ${brief.geschenk.emoji}`, {
            fontSize: '14px', fontFamily: 'Arial', color: '#4CAF50',
            stroke: '#000000', strokeThickness: 1
          }).setOrigin(0.5).setScrollFactor(0).setDepth(402)
          elemente.push(geschenkInfo)

          // 📦 Geschenk in den Rucksack legen!
          if (brief.geschenk.feld) {
            rucksack[brief.geschenk.feld] += brief.geschenk.menge
            if (this.rucksackAnzeige) {
              this.rucksackAnzeige.setText(this.getRucksackText())
            }
          }
        }

        // 💌 Antwort-Button
        const antwortenBtn = this.add.text(breite * 0.35, hoehe * 0.8, '💌 Antworten!', {
          fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
          backgroundColor: '#4CAF50', padding: { x: 12, y: 8 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(402)
        antwortenBtn.setInteractive({ useHandCursor: true })
        antwortenBtn.on('pointerdown', () => {
          elemente.forEach(el => el.destroy())
          this.briefAnMilo()
        })
        elemente.push(antwortenBtn)

        // ❤️ Danke-Button
        const dankeBtn = this.add.text(breite * 0.65, hoehe * 0.8, '❤️ Danke Milo!', {
          fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
          backgroundColor: '#FF7043', padding: { x: 12, y: 8 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(402)
        dankeBtn.setInteractive({ useHandCursor: true })
        dankeBtn.on('pointerdown', () => {
          elemente.forEach(el => el.destroy())

          // ❤️ Herzen fliegen zum Dank!
          for (let i = 0; i < 5; i++) {
            const herz = this.add.text(
              this.spieler.x + Phaser.Math.Between(-30, 30),
              this.spieler.y - 20,
              Phaser.Math.RND.pick(['❤️', '💕', '💌']),
              { fontSize: '18px' }
            ).setDepth(250)
            this.tweens.add({
              targets: herz,
              y: herz.y - 60,
              alpha: 0,
              duration: 1200,
              delay: i * 150,
              onComplete: () => herz.destroy()
            })
          }

          // 🎵 Danke-Melodie
          const melodie = [523, 659, 784]
          melodie.forEach((note, i) => {
            setTimeout(() => spieleTon(note, 0.12, 0.04, 'sine'), i * 150)
          })
        })
        elemente.push(dankeBtn)
      }
    })
  }

  // 😅 Milo hat ein Problem und braucht Hilfe!
  miloHatSchwierigkeit() {
    // 🎲 Zufällige Schwierigkeit auswählen!
    const schwierigkeiten = [
      {
        emoji: '😰',
        text: 'Hilfe! Ich habe mich\nverlaufen! Wo bin ich? 🗺️',
        hilfeText: '🤗 Hier bin ich, Milo!',
        antwort: '😊 Ah, da bist du ja!\nDanke! Alleine ist es\nso gruselig! 💕',
      },
      {
        emoji: '😢',
        text: 'Mir ist soooo langweilig!\nKannst du mit mir spielen? 🥺',
        hilfeText: '🎮 Klar, lass uns spielen!',
        antwort: '🎉 JAAA! Du bist die Beste!\nMit dir ist es nie langweilig! 😄',
      },
      {
        emoji: '🤧',
        text: 'Hatschi! Ich glaube\nich habe mich erkältet! 🤒',
        hilfeText: '🍵 Hier, trink einen Tee!',
        antwort: '😊 Mmh, der Tee ist lecker!\nMir geht es schon besser! ☕💕',
      },
      {
        emoji: '😨',
        text: 'Ich habe ein komisches\nGeräusch gehört! Was war das? 👀',
        hilfeText: '😊 Keine Angst, ich bin da!',
        antwort: '😅 Puh, zum Glück bist du da!\nMit dir fühle ich mich sicher! 💪',
      },
      {
        emoji: '😿',
        text: 'Ich vermisse meine Familie...\nKannst du mich aufmuntern? 😢',
        hilfeText: '🤗 Wir sind doch Freunde!',
        antwort: '🥰 Du hast Recht!\nDu bist wie eine Familie\nfür mich! Danke! 💕',
      },
      {
        emoji: '🤔',
        text: 'Ich habe eine Blume gefunden\naber sie ist welk! Was soll ich tun? 🥀',
        hilfeText: '💧 Gib ihr Wasser!',
        antwort: '🌸 Schau mal, sie blüht wieder!\nDu bist so schlau! 🌺✨',
      },
      {
        emoji: '😫',
        text: 'Ich habe versucht einen Stein\nzu heben aber er ist zu schwer! 🪨',
        hilfeText: '💪 Ich helfe dir!',
        antwort: '🪨 Zusammen haben wir es\ngeschafft! Teamwork! ✊🎉',
      },
      {
        emoji: '🦋',
        text: 'Da ist ein Schmetterling!\nAber er fliegt zu schnell!\nKannst du ihn fangen? 🦋',
        hilfeText: '🦋 Ich probiere es!',
        antwort: '✨ WOW! Du hast ihn!\nEr ist sooo hübsch!\nLass ihn wieder fliegen! 🦋💕',
      },
    ]

    const s = Phaser.Math.RND.pick(schwierigkeiten)

    // 🔔 Milo ruft! Sprechblase über seinem Kopf
    const blasenX = this.freund.x
    const blasenY = this.freund.y - 70

    // 🎵 Aufmerksamkeits-Sound!
    spieleTon(440, 0.2, 0.05, 'sine')
    setTimeout(() => spieleTon(550, 0.2, 0.05, 'sine'), 200)
    setTimeout(() => spieleTon(660, 0.2, 0.05, 'sine'), 400)

    // 😰 Emoji über Milo zeigen (hüpft!)
    const hilfeEmoji = this.add.text(blasenX, blasenY - 10, s.emoji, {
      fontSize: '32px'
    }).setOrigin(0.5).setDepth(200)

    this.tweens.add({
      targets: hilfeEmoji,
      y: blasenY - 25,
      duration: 500,
      yoyo: true,
      repeat: -1,
    })

    // 💬 Sprechblase
    const bg = this.add.rectangle(blasenX, blasenY + 20, 230, 70, 0x000000, 0.85)
    bg.setStrokeStyle(2, 0xFF5252).setDepth(200)

    const text = this.add.text(blasenX, blasenY + 20, s.text, {
      fontSize: '11px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
      align: 'center', wordWrap: { width: 210 }
    }).setOrigin(0.5).setDepth(201)

    // 🆘 Hilfe-Button
    const hilfeBtn = this.add.text(blasenX, blasenY + 70, s.hilfeText, {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: '#4CAF50', padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setDepth(201)
    hilfeBtn.setInteractive({ useHandCursor: true })

    hilfeBtn.on('pointerdown', () => {
      // 🎉 Helfen! Alles aufräumen
      hilfeEmoji.destroy()
      bg.destroy()
      text.destroy()
      hilfeBtn.destroy()

      soundKlick()

      // 💬 Milos Antwort
      const antwortBg = this.add.rectangle(blasenX, blasenY + 20, 230, 70, 0x000000, 0.85)
      antwortBg.setStrokeStyle(2, 0x4CAF50).setDepth(200)

      const antwortText = this.add.text(blasenX, blasenY + 20, s.antwort, {
        fontSize: '11px', fontFamily: 'Arial', color: '#ffffff',
        stroke: '#000000', strokeThickness: 2,
        align: 'center', wordWrap: { width: 210 }
      }).setOrigin(0.5).setDepth(201)

      // ❤️ Herzen fliegen!
      for (let i = 0; i < 5; i++) {
        const herz = this.add.text(
          blasenX + Phaser.Math.Between(-30, 30),
          blasenY + 20,
          '❤️', { fontSize: '16px' }
        ).setDepth(202)
        this.tweens.add({
          targets: herz,
          y: herz.y - 60,
          alpha: 0,
          duration: 1200,
          delay: i * 200,
          onComplete: () => herz.destroy()
        })
      }

      // 🎵 Fröhliche Töne!
      const freudeToene = [523, 659, 784, 1047]
      freudeToene.forEach((note, i) => {
        setTimeout(() => spieleTon(note, 0.12, 0.04, 'sine'), i * 120)
      })

      // Nach 4 Sek ausblenden
      this.time.delayedCall(4000, () => {
        this.tweens.add({
          targets: [antwortBg, antwortText],
          alpha: 0,
          duration: 600,
          onComplete: () => {
            antwortBg.destroy()
            antwortText.destroy()
          }
        })
      })
    })

    // ⏰ Wenn man nicht hilft: Nach 30 Sek verschwindet es
    this.time.delayedCall(30000, () => {
      if (hilfeEmoji.active) hilfeEmoji.destroy()
      if (bg.active) bg.destroy()
      if (text.active) text.destroy()
      if (hilfeBtn.active) hilfeBtn.destroy()
    })
  }

  // 🔄 Nächste Tageszeit!
  naechsteTagesZeit() {
    const reihenfolge = ['morgen', 'tag', 'abend', 'nacht']
    const jetzt = reihenfolge.indexOf(hausDaten.tagesZeit)
    const naechste = reihenfolge[(jetzt + 1) % 4]

    // 🌙 Nacht bleibt bis du aufwachst! Nicht automatisch weiter!
    if (hausDaten.tagesZeit === 'nacht') {
      // 🛏️ Zeige den Schlafen-Button wenn er noch nicht da ist!
      if (!this.schlafenButton) {
        this.zeigeSchlafenButton()
      }
      return // ⏸️ Stopp! Nacht bleibt!
    }

    hausDaten.tagesZeit = naechste

    // Sanfter Übergang mit Animation!
    const farben = {
      'morgen': '#F5A040',
      'tag': '#87CEEB',
      'abend': '#E86838',
      'nacht': '#1A237E'
    }
    const nachrichten = {
      'morgen': '🌅 Es wird Morgen!',
      'tag': '☀️ Guten Tag!',
      'abend': '🌇 Es wird Abend...',
      'nacht': '🌙 Gute Nacht!'
    }

    // 💬 Kurze Nachricht zeigen
    const msg = this.add.text(this.scale.width / 2, this.scale.height * 0.12,
      nachrichten[naechste], {
        fontSize: '20px', fontFamily: 'Arial', color: '#FFD700',
        stroke: '#000000', strokeThickness: 4
      })
    msg.setOrigin(0.5).setScrollFactor(0).setDepth(300)
    this.tweens.add({
      targets: msg,
      alpha: 0,
      duration: 800,
      delay: 2500,
      onComplete: () => msg.destroy()
    })

    // 🎨 Himmelfarbe sanft ändern (3 Schritte)
    const startFarbe = this.cameras.main.backgroundColor
    this.cameras.main.setBackgroundColor(farben[naechste])

    // ☀️🌙 Sonne/Mond wechseln
    if (naechste === 'nacht') {
      // Sonne langsam weg
      if (this.sonnenTeile) {
        this.sonnenTeile.forEach(teil => {
          this.tweens.add({
            targets: teil, alpha: 0, duration: 2000,
            onComplete: () => teil.destroy()
          })
        })
        this.sonnenTeile = null
      }
      // Mond kommt!
      this.time.delayedCall(2000, () => {
        const mondX = this.sonnenPosition ? this.sonnenPosition.x : 700
        const mondY = this.sonnenPosition ? this.sonnenPosition.y : 80
        this.maleMond(mondX, mondY)
      })
      this.istNacht = true

      // 🌙 Milo geht automatisch schlafen wenn es Nacht wird!
      if (!this.miloSchlaeft && this.freund && this.freund.active && this.freundHausPosition) {
        this.time.delayedCall(3000, () => {
          this.miloGehtSchlafen()
        })
      }

      // 🛏️ Schlafen-Button zeigen nach 5 Sekunden!
      this.time.delayedCall(5000, () => {
        if (!this.schlafenButton) {
          this.zeigeSchlafenButton()
        }
      })
    } else if (naechste === 'morgen') {
      // Mond langsam weg
      if (this.mondTeile) {
        this.mondTeile.forEach(teil => {
          this.tweens.add({
            targets: teil, alpha: 0, duration: 2000,
            onComplete: () => teil.destroy()
          })
        })
        this.mondTeile = null
      }
      // Sonne kommt!
      this.time.delayedCall(2000, () => {
        const sonneX = this.sonnenPosition ? this.sonnenPosition.x : 700
        const sonneY = this.sonnenPosition ? this.sonnenPosition.y : 80
        this.maleSonne(sonneX, sonneY)
      })
      this.istNacht = false

      // 🌞 Milo aufwecken! (immer versuchen wenn Freund da ist!)
      if (this.freund) {
        this.miloWachtAuf()
      }

      // � Kinder wachsen jeden Morgen!
      this.kinderWachsenLassen()

      // �🐦 Vögel zwitschern am Morgen!
      const vogelToene = [800, 1000, 900, 1100, 850]
      vogelToene.forEach((note, i) => {
        setTimeout(() => spieleTon(note, 0.1, 0.03, 'sine'), i * 200)
      })
    }

    // 🕐 Uhr aktualisieren
    this.aktualisiereZeitAnzeige()
  }

  // �️ SCHLAFEN-BUTTON ZEIGEN! (erscheint nachts auf der Wiese)
  zeigeSchlafenButton() {
    const breite = this.scale.width

    // 🛏️ Button unten in der Mitte
    this.schlafenButton = this.add.text(breite / 2, 80, '🛏️ Schlafen gehen 💤', {
      fontSize: '20px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#000000', strokeThickness: 4,
      backgroundColor: '#1A237Ecc', padding: { x: 16, y: 10 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(250)
    this.schlafenButton.setInteractive({ useHandCursor: true })

    // ✨ Button pulsiert leicht damit man ihn sieht!
    this.tweens.add({
      targets: this.schlafenButton,
      scale: 1.08,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // 👆 Wenn man drauf tippt: Aufwachen!
    this.schlafenButton.on('pointerdown', () => {
      soundKlick()
      this.spielerWachtAuf()
    })
  }

  // ☀️ SPIELER WACHT AUF! (Nacht → Morgen Übergang)
  spielerWachtAuf() {
    // 🛏️ Button entfernen
    if (this.schlafenButton) {
      this.schlafenButton.destroy()
      this.schlafenButton = null
    }

    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🌑 Bildschirm wird kurz ganz dunkel (Augen zu!)
    const dunkel = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0)
    dunkel.setScrollFactor(0).setDepth(350)
    this.tweens.add({
      targets: dunkel,
      alpha: 0.9,
      duration: 1000
    })

    // 💤 Zzz zeigen
    const zzz = this.add.text(breite / 2, hoehe * 0.4, '💤💤💤', {
      fontSize: '32px'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(351).setAlpha(0)
    this.tweens.add({
      targets: zzz,
      alpha: 1, y: zzz.y - 20,
      duration: 1000, delay: 500
    })

    // 🌙 Schlaf-Sound
    const schlafMelodie = [262, 294, 330, 294, 262]
    schlafMelodie.forEach((note, i) => {
      setTimeout(() => spieleTon(note, 0.4, 0.05, 'sine'), i * 400)
    })

    // ☀️ Nach 3 Sekunden: Aufwachen!
    this.time.delayedCall(3000, () => {
      zzz.destroy()

      // ☀️ Morgen! Tageszeit wechseln!
      hausDaten.tagesZeit = 'morgen'

      // 🎨 Himmel wird hell!
      this.cameras.main.setBackgroundColor('#F5A040')

      // ☀️ Guten Morgen Nachricht!
      const morgen = this.add.text(breite / 2, hoehe * 0.3,
        '☀️ Guten Morgen! 😊\nEin neuer Tag beginnt!', {
          fontSize: '22px', fontFamily: 'Arial', color: '#FFD700',
          stroke: '#000000', strokeThickness: 4, align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(352)

      // ☀️ Aufwach-Sound (fröhlich!)
      const aufwachMelodie = [330, 392, 523, 659]
      aufwachMelodie.forEach((note, i) => {
        setTimeout(() => spieleTon(note, 0.2, 0.1, 'sine'), i * 150)
      })

      // 🌙 Mond weg, Sonne kommt!
      if (this.mondTeile) {
        this.mondTeile.forEach(teil => {
          this.tweens.add({
            targets: teil, alpha: 0, duration: 1500,
            onComplete: () => teil.destroy()
          })
        })
        this.mondTeile = null
      }
      this.time.delayedCall(1500, () => {
        const sonneX = this.sonnenPosition ? this.sonnenPosition.x : 700
        const sonneY = this.sonnenPosition ? this.sonnenPosition.y : 80
        this.maleSonne(sonneX, sonneY)
      })
      this.istNacht = false

      // 🌞 Milo aufwecken! (immer versuchen, egal ob miloSchlaeft true ist!)
      if (this.freund) {
        this.miloWachtAuf()
      }

      // 🌱 Kinder wachsen jeden Morgen!
      this.kinderWachsenLassen()

      // 📷 Kamera folgt wieder dem Spieler!
      this.cameras.main.startFollow(this.spieler, true, 0.1, 0.1)

      // 🐦 Vögel zwitschern!
      const vogelToene = [800, 1000, 900, 1100, 850]
      vogelToene.forEach((note, i) => {
        setTimeout(() => spieleTon(note, 0.1, 0.03, 'sine'), i * 200)
      })

      // ☀️ Dunkelheit verschwindet!
      this.tweens.add({
        targets: dunkel,
        alpha: 0,
        duration: 2000,
        onComplete: () => dunkel.destroy()
      })

      // 🕐 Uhr aktualisieren
      this.aktualisiereZeitAnzeige()

      this.time.delayedCall(3000, () => {
        morgen.destroy()
      })
    })
  }

  // �🕐 Uhr-Text aktualisieren
  aktualisiereZeitAnzeige() {
    if (!this.zeitAnzeige) return
    const uhren = {
      'morgen': '🌅 Morgen',
      'tag': '☀️ Tag',
      'abend': '🌇 Abend',
      'nacht': '🌙 Nacht'
    }
    this.zeitAnzeige.setText(uhren[hausDaten.tagesZeit] || '☀️ Tag')
  }

  // === 🌙 NACHT-ÜBERGANG ===
  wechsleZuNacht(danach) {
    // 🌙 Nachricht zeigen
    const nachricht = this.add.text(this.scale.width / 2, this.scale.height * 0.12,
      '🌙 Es wird Nacht...', {
        fontSize: '22px', fontFamily: 'Arial', color: '#FFFFFF',
        stroke: '#000000', strokeThickness: 4
      })
    nachricht.setOrigin(0.5).setScrollFactor(0).setDepth(300)

    // 🎨 Farbe langsam ändern (von Orange zu Dunkelblau)
    let schritt = 0
    const farben = [
      '#F5A040', '#D8944A', '#B07850', '#886050',
      '#604858', '#483860', '#352C6E', '#1A237E'
    ]
    this.time.addEvent({
      delay: 350,
      repeat: farben.length - 1,
      callback: () => {
        this.cameras.main.setBackgroundColor(farben[schritt])
        schritt++
      }
    })

    // ☀️ Sonne langsam verschwinden lassen
    if (this.sonnenTeile) {
      this.sonnenTeile.forEach(teil => {
        this.tweens.add({
          targets: teil,
          alpha: 0,
          duration: 2000
        })
      })
    }

    // 🌙 Nach dem Übergang: Mond malen!
    this.time.delayedCall(farben.length * 350 + 500, () => {
      nachricht.destroy()
      // ☀️ Sonne weg!
      if (this.sonnenTeile) {
        this.sonnenTeile.forEach(teil => teil.destroy())
      }
      // 🌙 Mond an gleicher Stelle malen!
      const mondX = this.sonnenPosition ? this.sonnenPosition.x : 700
      const mondY = this.sonnenPosition ? this.sonnenPosition.y : 80
      this.maleMond(mondX, mondY)
      this.istNacht = true
      hausDaten.tagesZeit = 'nacht'
      if (danach) danach()
    })
  }

  // === ☁️ WOLKE ===
  maleWolke(x, y) {
    this.add.circle(x, y, 20, 0xFFFFFF).setAlpha(0.8)
    this.add.circle(x + 20, y, 25, 0xFFFFFF).setAlpha(0.8)
    this.add.circle(x + 40, y, 20, 0xFFFFFF).setAlpha(0.8)
    this.add.circle(x + 10, y - 15, 18, 0xFFFFFF).setAlpha(0.8)
    this.add.circle(x + 30, y - 12, 18, 0xFFFFFF).setAlpha(0.8)
  }

  // === ☀️ NACHT ZU TAG WECHSELN (nach dem Schlafen!) ===
  wechsleZuTag() {
    // ☀️ Nachricht zeigen
    const nachricht = this.add.text(this.scale.width / 2, this.scale.height * 0.12,
      '☀️ Guten Morgen! Ein neuer Tag!', {
        fontSize: '22px', fontFamily: 'Arial', color: '#FFD700',
        stroke: '#000000', strokeThickness: 4
      })
    nachricht.setOrigin(0.5).setScrollFactor(0).setDepth(300)

    // 🎵 Fröhliche Aufwach-Melodie!
    const melodie = [330, 392, 523, 659, 784]
    melodie.forEach((note, i) => {
      setTimeout(() => spieleTon(note, 0.2, 0.1, 'sine'), i * 150)
    })

    // 🎨 Farbe langsam ändern (von Dunkelblau zu Morgen-Orange zu Blau)
    let schritt = 0
    const farben = [
      '#1A237E', '#352C6E', '#604858', '#886050',
      '#B07850', '#D8944A', '#F5A040', '#87CEEB'
    ]
    this.time.addEvent({
      delay: 350,
      repeat: farben.length - 1,
      callback: () => {
        this.cameras.main.setBackgroundColor(farben[schritt])
        schritt++
      }
    })

    // 🌙 Mond langsam verschwinden lassen
    if (this.mondTeile) {
      this.mondTeile.forEach(teil => {
        this.tweens.add({
          targets: teil,
          alpha: 0,
          duration: 2000
        })
      })
    }

    // ☀️ Nach dem Übergang: Sonne malen!
    this.time.delayedCall(farben.length * 350 + 500, () => {
      nachricht.destroy()
      // 🌙 Mond weg!
      if (this.mondTeile) {
        this.mondTeile.forEach(teil => teil.destroy())
        this.mondTeile = null
      }
      // ☀️ Sonne an gleicher Stelle malen!
      const sonneX = this.sonnenPosition ? this.sonnenPosition.x : 700
      const sonneY = this.sonnenPosition ? this.sonnenPosition.y : 80
      this.maleSonne(sonneX, sonneY)
      this.istNacht = false
      hausDaten.tagesZeit = 'tag'
      const vogelToene = [800, 1000, 900, 1100, 850]
      vogelToene.forEach((note, i) => {
        setTimeout(() => spieleTon(note, 0.1, 0.03, 'sine'), i * 200)
      })
    })
  }

  // === 📝 RUCKSACK-TEXT ===
  getRucksackText() {
    if (this.freundHausBaubar && !hausDaten.freundHausGebaut) {
      // 🏡 Freund braucht ein Haus!
      return `🎒 Rucksack (für Milos Haus):\n🪵 ${this.rucksack.holz}/6  🪨 ${this.rucksack.stein}/3  ⚙️ ${this.rucksack.eisen}/5`
    }
    if (this.hausGebaut) {
      // 🏠 Haus ist fertig – zeige nur die Anzahl!
      let text = `🎒 Rucksack:\n🪵 ${this.rucksack.holz}  🪨 ${this.rucksack.stein}  ⚙️ ${this.rucksack.eisen}`
      if (rucksack.pizza > 0) text += `  🍕${rucksack.pizza}`
      return text
    }
    return `🎒 Rucksack:\n🪵 ${this.rucksack.holz}/10\n🪨 ${this.rucksack.stein}/5\n⚙️ ${this.rucksack.eisen}/9`
  }

  getEmoji(typ) {
    if (typ === 'holz') return '🪵'
    if (typ === 'stein') return '🪨'
    if (typ === 'eisen') return '⚙️'
    return '📦'
  }

  // === 💬 NACHRICHT ===
  zeigeNachricht(text) {
    const nachricht = this.add.text(this.scale.width / 2, this.scale.height * 0.35, text, {
      fontSize: '22px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    })
    nachricht.setOrigin(0.5)
    nachricht.setScrollFactor(0)
    nachricht.setDepth(200)
    this.tweens.add({
      targets: nachricht,
      alpha: 0,
      y: nachricht.y - 40,
      duration: 1200,
      delay: 400,
      onComplete: () => nachricht.destroy()
    })
  }

  // === ⏸️ SPIEL PAUSIEREN ===
  spielPausieren() {
    if (this.istPausiert) return // Schon pausiert!
    this.istPausiert = true
    soundKlick()

    // ⏸️ Alles anhalten!
    this.physics.pause()
    this.time.paused = true
    this.tweens.pauseAll()

    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🖤 Dunkler Hintergrund
    const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.7)
    overlay.setScrollFactor(0).setDepth(500).setInteractive()

    // ⏸️ Große Pause-Nachricht!
    const pauseText = this.add.text(breite / 2, hoehe * 0.25, '⏸️ PAUSE', {
      fontSize: '48px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#000000', strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0).setDepth(501)

    // 🎮 Tipp
    const tipp = this.add.text(breite / 2, hoehe * 0.42, '🎮 Mach eine kleine Pause!\nTrink was oder ruh dich aus 😊', {
      fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(501)

    // ▶️ Weiterspielen-Button
    const weiter = this.add.text(breite / 2, hoehe * 0.65, '▶️ Weiterspielen!', {
      fontSize: '26px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: '#4CAF50', padding: { x: 30, y: 14 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(501)
    weiter.setInteractive({ useHandCursor: true })

    const elemente = [overlay, pauseText, tipp, weiter]

    weiter.on('pointerdown', () => {
      soundKlick()
      // ▶️ Alles wieder starten!
      this.physics.resume()
      this.time.paused = false
      this.tweens.resumeAll()
      this.istPausiert = false
      elemente.forEach(el => el.destroy())
    })
  }

  // === 🔄 NEU STARTEN – BIST DU SICHER? ===
  zeigeNeuStartFrage() {
    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🖤 Dunkler Hintergrund
    const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.7)
    overlay.setScrollFactor(0).setDepth(400)

    // ❓ Frage-Text
    const frage = this.add.text(breite / 2, hoehe * 0.3,
      '🔄 Von vorn beginnen?\n\nDein ganzer Spielstand\nwird gelöscht! 😮', {
      fontSize: '20px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 4, align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(401)

    // ✅ Ja-Button
    const jaButton = this.add.text(breite * 0.3, hoehe * 0.55, '✅ Ja, neu starten!', {
      fontSize: '18px', fontFamily: 'Arial', color: '#FF5252',
      stroke: '#000000', strokeThickness: 4,
      backgroundColor: '#00000088', padding: { x: 12, y: 8 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(401)
    jaButton.setInteractive({ useHandCursor: true })

    // ❌ Nein-Button
    const neinButton = this.add.text(breite * 0.7, hoehe * 0.55, '❌ Nee, weiter!', {
      fontSize: '18px', fontFamily: 'Arial', color: '#4CAF50',
      stroke: '#000000', strokeThickness: 4,
      backgroundColor: '#00000088', padding: { x: 12, y: 8 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(401)
    neinButton.setInteractive({ useHandCursor: true })

    // ❌ Abbrechen – einfach alles schließen
    neinButton.on('pointerdown', () => {
      overlay.destroy()
      frage.destroy()
      jaButton.destroy()
      neinButton.destroy()
    })

    // ✅ Ja – alles löschen und neu starten!
    jaButton.on('pointerdown', () => {
      // 🗑️ Spielstand löschen
      spielstandLoeschen()
      // 🎒 Rucksack leeren
      rucksack.holz = 0
      rucksack.stein = 0
      rucksack.eisen = 0
      // 🏠 Haus-Daten zurücksetzen
      hausDaten.wandFarbe = 0x8D6E63
      hausDaten.dachFarbe = 0xC62828
      hausDaten.bodenFarbe = 0xBCAAA4
      hausDaten.moebel = []
      hausDaten.hausGebaut = false
      hausDaten.personGerettet = false
      hausDaten.freundHausGebaut = false
      hausDaten.stadtFreunde = []
      hausDaten.dorfFreunde = {}
      // 🔄 Zur Figur-Erstellung!
      this.scene.start('FigurErstellen')
    })
  }

  // === 📋 HAUS-BAU ANLEITUNG ===
  // Zeigt dem Spieler was er sammeln muss um ein Haus zu bauen!
  zeigeHausBauAnleitung() {
    // 🎵 Kleiner Sound zur Begrüßung
    soundSpielStart()

    const breite = this.scale.width
    const hoehe = this.scale.height

    // � Die Anleitung hat mehrere Seiten! Wische nach unten für mehr!
    const seiten = [
      {
        titel: '🏠 Baue dein Haus!',
        zeilen: [
          '📋 So gehts:',
          '',
          '1️⃣  Benutze die 🪓 Axt',
          '     auf Baeume fuer Holz!',
          '',
          '2️⃣  Benutze die ⛏️ Spitzhacke',
          '     auf Steine!',
          '',
          '👇 Wisch nach unten fuer mehr!'
        ]
      },
      {
        titel: '⛏️ Mine & Material!',
        zeilen: [
          '3️⃣  Gehe in die ⛏️ Mine',
          '     fuer Eisen!',
          '',
          '     Tipp: In der Mine findest',
          '     du auch Steine! 🪨',
          '',
          '📦 Du brauchst:',
          '🪵 10 Holz',
          '🪨 5 Stein',
          '⚙️ 9 Eisen',
          '',
          '👇 Wisch nach unten fuer mehr!'
        ]
      },
      {
        titel: '🎮 Tipps zum Spielen!',
        zeilen: [
          '🚶 Tippe irgendwo hin',
          '     um dorthin zu laufen!',
          '',
          '🪓 Tippe auf Werkzeug',
          '     und dann auf Baum/Stein!',
          '',
          '🔨 Wenn du genug hast,',
          '     leuchtet der Hammer! ✨',
          '',
          '🎉 Viel Spass beim Bauen!'
        ]
      }
    ]

    let aktuelleSeite = 0
    const elemente = []

    const zeichneSeite = () => {
      // 🗑️ Alte Elemente entfernen
      elemente.forEach(el => el.destroy())
      elemente.length = 0

      const seite = seiten[aktuelleSeite]

      // 🖤 Dunkler Hintergrund
      const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.7)
      overlay.setScrollFactor(0).setDepth(300).setInteractive()
      elemente.push(overlay)

      // 🟫 Info-Box
      const box = this.add.rectangle(breite / 2, hoehe / 2, 340, 370, 0x3E2723, 0.95)
      box.setScrollFactor(0).setDepth(301).setStrokeStyle(3, 0xFFD700)
      elemente.push(box)

      // 🏠 Titel
      const titel = this.add.text(breite / 2, hoehe * 0.14, seite.titel, {
        fontSize: '22px', fontFamily: 'Arial', color: '#FFD700',
        fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
      }).setOrigin(0.5).setScrollFactor(0).setDepth(302)
      elemente.push(titel)

      // 📄 Seiten-Nummer
      const seitenNr = this.add.text(breite / 2, hoehe * 0.22,
        `📄 Seite ${aktuelleSeite + 1} von ${seiten.length}`, {
        fontSize: '12px', fontFamily: 'Arial', color: '#BDBDBD',
        stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5).setScrollFactor(0).setDepth(302)
      elemente.push(seitenNr)

      // 📋 Text
      const text = this.add.text(breite / 2, hoehe * 0.48, seite.zeilen.join('\n'), {
        fontSize: '14px', fontFamily: 'Arial', color: '#FFFFFF',
        lineSpacing: 4, stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5).setScrollFactor(0).setDepth(302)
      elemente.push(text)

      // ⬆️ Zurück-Button (wenn nicht erste Seite)
      if (aktuelleSeite > 0) {
        const zurueckBtn = this.add.text(breite * 0.25, hoehe * 0.82, '⬆️ Zurück', {
          fontSize: '18px', fontFamily: 'Arial', color: '#FFFFFF',
          backgroundColor: '#FF9800', padding: { x: 16, y: 10 },
          stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(302)
        zurueckBtn.setInteractive({ useHandCursor: true })
        zurueckBtn.on('pointerdown', () => {
          soundKlick()
          aktuelleSeite--
          zeichneSeite()
        })
        elemente.push(zurueckBtn)
      }

      // ⬇️ Weiter-Button oder 👍 OK-Button
      if (aktuelleSeite < seiten.length - 1) {
        const weiterBtn = this.add.text(breite * 0.75, hoehe * 0.82, '⬇️ Weiter', {
          fontSize: '18px', fontFamily: 'Arial', color: '#FFFFFF',
          backgroundColor: '#2196F3', padding: { x: 16, y: 10 },
          stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(302)
        weiterBtn.setInteractive({ useHandCursor: true })
        weiterBtn.on('pointerdown', () => {
          soundKlick()
          aktuelleSeite++
          zeichneSeite()
        })
        elemente.push(weiterBtn)
      } else {
        // 👍 Letzte Seite = OK-Button!
        const okButton = this.add.text(breite / 2, hoehe * 0.82, '👍 Verstanden!', {
          fontSize: '22px', fontFamily: 'Arial', color: '#FFFFFF',
          backgroundColor: '#4CAF50', padding: { x: 30, y: 14 },
          stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(302)
        okButton.setInteractive({ useHandCursor: true })
        okButton.on('pointerdown', () => {
          soundKlick()
          elemente.forEach(el => el.destroy())
        })
        elemente.push(okButton)
      }

      // 👆 Wisch-Geste erkennen!
      let startY = null
      overlay.on('pointerdown', (pointer) => {
        startY = pointer.y
      })
      overlay.on('pointerup', (pointer) => {
        if (startY === null) return
        const diff = startY - pointer.y
        if (diff > 40 && aktuelleSeite < seiten.length - 1) {
          // ⬇️ Nach oben gewischt = nächste Seite!
          soundKlick()
          aktuelleSeite++
          zeichneSeite()
        } else if (diff < -40 && aktuelleSeite > 0) {
          // ⬆️ Nach unten gewischt = vorherige Seite!
          soundKlick()
          aktuelleSeite--
          zeichneSeite()
        }
        startY = null
      })
    }

    // 📖 Erste Seite zeigen!
    zeichneSeite()
  }

  // === 🔨 HAMMER AKTUALISIEREN ===
  aktualisiereHammerButton() {
    if (this.hausGebaut) return
    const genug = this.rucksack.holz >= 10 && this.rucksack.stein >= 5 && this.rucksack.eisen >= 9
    if (genug) {
      this.hammerButton.setAlpha(1)
      if (!this.hammerPulsiert) {
        this.hammerPulsiert = true
        this.tweens.add({
          targets: this.hammerButton,
          scale: 1.15,
          duration: 500,
          yoyo: true,
          repeat: -1
        })
      }
    } else {
      this.hammerButton.setAlpha(0.4)
    }
  }

  // === 🏠 HAUS BAUEN ===
  hausBauen() {
    if (this.rucksack.holz < 10 || this.rucksack.stein < 5 || this.rucksack.eisen < 9) {
      this.zeigeNachricht('❌ Noch nicht genug Material!')
      return
    }
    if (this.hausGebaut) {
      this.zeigeNachricht('🏠 Du hast schon ein Haus!')
      return
    }

    // 🎨 Erst Farbe aussuchen! Zeige Farbwähler!
    this.zeigeFarbwahl()
  }

  // === 🎨 HAUS-FARBE AUSSUCHEN ===
  zeigeFarbwahl() {
    const breite = this.scale.width
    const hoehe = this.scale.height

    // Dunkler Hintergrund
    const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.6)
    overlay.setScrollFactor(0).setDepth(250)

    // Titel
    const titel = this.add.text(breite / 2, hoehe * 0.2, '🎨 Welche Farbe soll\ndein Haus haben?', {
      fontSize: '26px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 4, align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(251)

    // Haus-Farben zur Auswahl
    const hausFarben = [
      { wand: 0x8D6E63, dach: 0xC62828, name: 'Klassisch' },
      { wand: 0xFFCDD2, dach: 0xE91E63, name: 'Rosa' },
      { wand: 0xBBDEFB, dach: 0x1565C0, name: 'Blau' },
      { wand: 0xC8E6C9, dach: 0x2E7D32, name: 'Grün' },
      { wand: 0xFFF9C4, dach: 0xFF8F00, name: 'Gelb' },
      { wand: 0xE1BEE7, dach: 0x7B1FA2, name: 'Lila' }
    ]

    const farbElemente = [overlay, titel]

    hausFarben.forEach((farbe, index) => {
      const x = breite / 2 - 125 + (index % 3) * 125
      const y = hoehe * 0.45 + Math.floor(index / 3) * 90

      // Mini-Haus als Vorschau!
      const miniWand = this.add.rectangle(x, y, 40, 30, farbe.wand)
      miniWand.setScrollFactor(0).setDepth(252)
      const miniDach = this.add.triangle(x, y - 22, 0, 15, 25, 0, 50, 15, farbe.dach)
      miniDach.setScrollFactor(0).setDepth(252)
      const miniTuer = this.add.rectangle(x - 5, y + 5, 8, 14, 0x4E342E)
      miniTuer.setScrollFactor(0).setDepth(253)
      const miniFenster = this.add.rectangle(x + 8, y - 5, 8, 8, 0xBBDEFB)
      miniFenster.setScrollFactor(0).setDepth(253)

      // Name drunter
      const label = this.add.text(x, y + 28, farbe.name, {
        fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
        stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5).setScrollFactor(0).setDepth(252)

      // Klickbereich
      const klick = this.add.rectangle(x, y, 60, 65, 0xffffff, 0)
      klick.setScrollFactor(0).setDepth(254)
      klick.setInteractive({ useHandCursor: true })

      klick.on('pointerdown', () => {
        // Alle Farbwahl-Elemente entfernen
        farbElemente.forEach(el => el.destroy())

        // Haus bauen mit dieser Farbe! 🏠
        this.baueMitFarbe(farbe.wand, farbe.dach)
      })

      farbElemente.push(miniWand, miniDach, miniTuer, miniFenster, label, klick)
    })
  }

  // === 🏗️ HAUS BAUEN MIT GEWÄHLTER FARBE ===
  baueMitFarbe(wandFarbe, dachFarbe) {
    this.hausGebaut = true
    hausDaten.hausGebaut = true // 🏠 Global merken!
    this.rucksack.holz -= 10
    this.rucksack.stein -= 5
    this.rucksack.eisen -= 9
    this.rucksackAnzeige.setText(this.getRucksackText())

    // 🎨 Farben global speichern!
    hausDaten.wandFarbe = wandFarbe
    hausDaten.dachFarbe = dachFarbe

    // 💾 Sofort speichern!
    spielSpeichern('BlumenwiesenSpiel', this.figurDaten, {
      x: this.spieler.x, y: this.spieler.y
    })

    const hausX = this.spieler.x + 80
    const hausY = this.wiesenY + 30
    this.hausPosition = { x: hausX, y: hausY } // 📍 Merken wo das Haus steht!

    this.cameras.main.stopFollow()
    this.cameras.main.pan(hausX, hausY, 1500)

    this.time.delayedCall(800, () => {
      this.maleHaus(hausX, hausY, wandFarbe, dachFarbe)
      // 🔊 Haus gebaut!
      soundHausGebaut()
      this.konfetti()

      // 🎉 Kurze Nachricht – dann geht's weiter!
      const gewonnen = this.add.text(this.scale.width / 2, this.scale.height * 0.15,
        '🏠 SUPER! 🎉\nDu hast ein Haus gebaut!\n⭐ Du bist ein toller Baumeister! ⭐', {
          fontSize: '24px', fontFamily: 'Arial', color: '#ffffff',
          stroke: '#000000', strokeThickness: 5, align: 'center',
          backgroundColor: '#00000066', padding: { x: 20, y: 15 }
        })
      gewonnen.setOrigin(0.5).setScrollFactor(0).setDepth(300)

      // Nach 3 Sekunden verschwindet die Nachricht...
      this.time.delayedCall(3000, () => {
        gewonnen.destroy()

        // 🌅 NACHMITTAG! Der Himmel wird warm und orange!
        this.wechsleZuNachmittag(() => {
          // 📋 Dann zeige die Möbel-Anleitung!
          this.zeigeMoebelAnleitung()

          // 🆘 Nach der Anleitung: Hilferuf aus der Mine!
          if (!hausDaten.personGerettet) {
            this.time.delayedCall(2000, () => {
              this.zeigeHilferuf()
            })
          }
        })
      })
    })
  }

  // === 🏠 HAUS MALEN ===
  maleHaus(x, y, wandFarbe, dachFarbe) {
    // 🪨 Fundament
    this.add.rectangle(x, y - 5, 120, 10, 0x757575).setDepth(50)
    // 🪵 Wände
    this.add.rectangle(x, y - 50, 100, 80, wandFarbe).setDepth(50)
    // 🏠 Dach – direkt auf die Wand gemalt!
    const dach = this.add.graphics()
    dach.fillStyle(dachFarbe, 1)
    dach.fillTriangle(x - 60, y - 90, x + 60, y - 90, x, y - 130)
    dach.setDepth(50)
    // 🚪 Tür (nur zum Anschauen)
    this.add.rectangle(x - 15, y - 22, 22, 36, 0x4E342E).setDepth(51)
    this.add.circle(x - 8, y - 22, 2, 0xFFD700).setDepth(52)
    // 🪟 Fenster
    this.add.rectangle(x + 20, y - 50, 20, 20, 0xBBDEFB).setDepth(51)
    this.add.rectangle(x + 20, y - 50, 20, 2, 0x795548).setDepth(52)
    this.add.rectangle(x + 20, y - 50, 2, 20, 0x795548).setDepth(52)
    // ⚙️ Eisenbeschläge
    this.add.rectangle(x - 25, y - 30, 4, 4, 0x90A4AE).setDepth(52)
    this.add.rectangle(x - 25, y - 14, 4, 4, 0x90A4AE).setDepth(52)
    // 🌼 Blumen neben dem Haus
    this.maleGaensebluemchen(x - 70, y - 5)
    this.maleGaensebluemchen(x + 70, y - 5)

    // 🏠👆 GROSSER KLICK-BEREICH für das ganze Haus!
    // So kann man überall auf das Haus tippen um reinzugehen!
    const hausZone = this.add.rectangle(x, y - 60, 130, 140, 0xffffff, 0)
    hausZone.setDepth(55).setInteractive({ useHandCursor: true })
    hausZone.on('pointerdown', () => {
      // 🚶 Zur Tür laufen und dann reingehen!
      this.laufeZu(x - 15, y, () => {
        soundTuer()
        this.zeigeNachricht('🚪 Du gehst rein!')
        this.time.delayedCall(500, () => {
          spielSpeichern('HausSzene', this.figurDaten, null)
          this.scene.start('HausSzene', this.figurDaten)
        })
      })
    })
    // 📍 Haus-Zone merken damit der Touch-Handler sie kennt!
    this.hausZone = hausZone
  }

  // === � NACHMITTAG-ÜBERGANG ===
  wechsleZuNachmittag(danach) {
    // 🌅 Himmel wird langsam warm und orange
    const nachricht = this.add.text(this.scale.width / 2, this.scale.height * 0.12,
      '🌅 Es wird Nachmittag...', {
        fontSize: '22px', fontFamily: 'Arial', color: '#FFD700',
        stroke: '#000000', strokeThickness: 4
      })
    nachricht.setOrigin(0.5).setScrollFactor(0).setDepth(300)

    // Farbe langsam ändern (von Blau zu Orange-Gold)
    let schritt = 0
    const farben = [
      '#87CEEB', '#92C8D8', '#A0BFC5', '#B8C0A0',
      '#D4B87A', '#E8B060', '#F0A848', '#F5A040'
    ]
    const timer = this.time.addEvent({
      delay: 300,
      repeat: farben.length - 1,
      callback: () => {
        this.cameras.main.setBackgroundColor(farben[schritt])
        schritt++
      }
    })

    // Nach der Übergangs-Animation
    this.time.delayedCall(farben.length * 300 + 500, () => {
      nachricht.destroy()
      this.cameras.main.startFollow(this.spieler)

      // 🔨 Hammer-Button wird zum Möbel-Button!
      this.hammerButton.setText('🪑')
      this.hammerButton.setAlpha(1)
      this.hammerButton.removeAllListeners()
      this.hammerButton.on('pointerdown', () => this.zeigeMoebelMenu())

      // 🪒 Schaufel zur Werkzeugleiste hinzufügen!
      this.fuegeSchaufelHinzu()

      // 🌳🪨 Bäume und Steine wachsen nach!
      this.baeume.forEach(b => {
        if (b.holzRest <= 0) {
          b.holzRest = 3
          b.container.setAlpha(1)
          b.container.setAngle(0)
        }
      })
      this.steine.forEach(s => {
        if (s.steinRest <= 0) {
          s.steinRest = 2
          s.container.setAlpha(1)
          s.container.list.forEach(teil => {
            teil.setAlpha(1)
          })
        }
      })

      if (danach) danach()
    })
  }

  // === 📋 MÖBEL-ANLEITUNG ===
  zeigeMoebelAnleitung() {
    const breite = this.scale.width
    const hoehe = this.scale.height

    // Dunkler Hintergrund
    const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.7)
    overlay.setScrollFactor(0).setDepth(250)

    const titel = this.add.text(breite / 2, hoehe * 0.08, '📋 Möbel-Anleitung!', {
      fontSize: '26px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(251)

    const intro = this.add.text(breite / 2, hoehe * 0.15,
      'Jetzt kannst du Möbel für dein Haus bauen!\nSammle Material und tippe auf 🪑!', {
      fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3, align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(251)

    // 🏠 Kleines Haus in der Mitte malen!
    const hausX = breite / 2
    const hausY = hoehe * 0.32
    const hausFarbe = hausDaten.wandFarbe || 0x8D6E63
    const dachF = hausDaten.dachFarbe || 0xC62828

    // 🪨 Fundament
    const fundament = this.add.rectangle(hausX, hausY + 2, 80, 6, 0x757575)
    fundament.setScrollFactor(0).setDepth(252)
    // 🪵 Wände
    const wand = this.add.rectangle(hausX, hausY - 28, 68, 54, hausFarbe)
    wand.setScrollFactor(0).setDepth(252)
    // 🏠 Dach
    const dachGrafik = this.add.graphics()
    dachGrafik.fillStyle(dachF, 1)
    dachGrafik.fillTriangle(hausX - 44, hausY - 55, hausX + 44, hausY - 55, hausX, hausY - 82)
    dachGrafik.setScrollFactor(0).setDepth(252)
    // 🚪 Tür
    const miniTuer = this.add.rectangle(hausX - 10, hausY - 10, 14, 24, 0x4E342E)
    miniTuer.setScrollFactor(0).setDepth(253)
    // Türknauf
    const knauf = this.add.circle(hausX - 5, hausY - 10, 1.5, 0xFFD700)
    knauf.setScrollFactor(0).setDepth(254)
    // 🪟 Fenster
    const fenster = this.add.rectangle(hausX + 14, hausY - 28, 14, 14, 0xBBDEFB)
    fenster.setScrollFactor(0).setDepth(253)
    const fensterH = this.add.rectangle(hausX + 14, hausY - 28, 14, 1.5, 0x795548)
    fensterH.setScrollFactor(0).setDepth(254)
    const fensterV = this.add.rectangle(hausX + 14, hausY - 28, 1.5, 14, 0x795548)
    fensterV.setScrollFactor(0).setDepth(254)

    // Möbel-Rezepte
    const rezepte = [
      { name: '🪑 Stuhl', kosten: '🪵 x3', icon: '🪑' },
      { name: '🛏️ Bett', kosten: '🪵 x5 + 🪨 x1', icon: '🛏️' },
      { name: '🗄️ Tisch', kosten: '🪵 x4 + ⚙️ x2', icon: '🍽️' },
      { name: '💡 Lampe', kosten: '⚙️ x3 + 🪨 x2', icon: '💡' }
    ]

    // 🐶 Hundebett nur zeigen wenn Bello gerettet wurde!
    if (hausDaten.hundGerettet) {
      rezepte.push({ name: '🐾 Hundebett', kosten: '🪵 x3 + 🪨 x1', icon: '🐾' })
    }

    const elemente = [overlay, titel, intro, fundament, wand, dachGrafik, miniTuer, knauf, fenster, fensterH, fensterV]

    rezepte.forEach((r, i) => {
      const y = hoehe * 0.48 + i * 50
      const bg = this.add.rectangle(breite / 2, y, breite * 0.8, 45, 0x3E2723, 0.8)
      bg.setScrollFactor(0).setDepth(251)
      bg.setStrokeStyle(2, 0x795548)

      const text = this.add.text(breite * 0.15, y,
        `${r.name}  →  ${r.kosten}`, {
        fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
        stroke: '#000000', strokeThickness: 2
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(252)

      elemente.push(bg, text)
    })

    // OK-Button
    const ok = this.add.text(breite / 2, hoehe * 0.88, '👍 Los geht\'s!', {
      fontSize: '24px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: '#4CAF50', padding: { x: 30, y: 12 },
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(252)
    ok.setInteractive({ useHandCursor: true })

    ok.on('pointerdown', () => {
      elemente.forEach(el => el.destroy())
      ok.destroy()
      this.zeigeNachricht('🪑 Sammle Material und baue Möbel!')
    })

    elemente.push(ok)
  }

  // === 🪑 MÖBEL-MENÜ ===
  zeigeMoebelMenu() {
    const breite = this.scale.width
    const hoehe = this.scale.height

    const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.6)
    overlay.setScrollFactor(0).setDepth(250)

    const titel = this.add.text(breite / 2, hoehe * 0.1, '🪑 Was möchtest du bauen?', {
      fontSize: '24px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(251)

    const moebel = [
      { name: 'Stuhl', emoji: '🪑', holz: 3, stein: 0, eisen: 0 },
      { name: 'Bett', emoji: '🛏️', holz: 5, stein: 1, eisen: 0 },
      { name: 'Tisch', emoji: '🍽️', holz: 4, stein: 0, eisen: 2 },
      { name: 'Lampe', emoji: '💡', holz: 0, stein: 2, eisen: 3 }
    ]

    // 🐶 Hundebett nur wenn Bello gerettet wurde!
    if (hausDaten.hundGerettet) {
      moebel.push({ name: 'Hundebett', emoji: '🐾', holz: 3, stein: 1, eisen: 0 })
    }

    //  Telefon – damit kann man in die Stadt fahren!
    moebel.push({ name: "Telefon", emoji: "📞", holz: 0, stein: 1, eisen: 2 })

    // 💻 Computer – damit kann man mit Milo spielen und chatten!
    moebel.push({ name: "Computer", emoji: "💻", holz: 2, stein: 2, eisen: 3 })

    const elemente = [overlay, titel]

    moebel.forEach((m, i) => {
      // Letztes Moebel zentrieren wenn es allein in der Reihe steht
      const alleineInReihe = (i === moebel.length - 1) && (i % 2 === 0)
      const x = alleineInReihe ? breite / 2 : (breite / 2 - 80 + (i % 2) * 160)
      const y = hoehe * 0.30 + Math.floor(i / 2) * 110

      // ✅ Schon gebaut? Dann nicht nochmal!
      const schonGebaut = hausDaten.moebel.some(gebaut => gebaut.name === m.name)

      // Kann man es bauen?
      const genug = !schonGebaut &&
                    this.rucksack.holz >= m.holz &&
                    this.rucksack.stein >= m.stein &&
                    this.rucksack.eisen >= m.eisen

      // Karte
      const kartenFarbe = schonGebaut ? 0x2196F3 : (genug ? 0x4CAF50 : 0x616161)
      const kartenRand = schonGebaut ? 0x64B5F6 : (genug ? 0x81C784 : 0x9E9E9E)
      const karte = this.add.rectangle(x, y, 130, 90, kartenFarbe, 0.9)
      karte.setScrollFactor(0).setDepth(251)
      karte.setStrokeStyle(2, kartenRand)

      const icon = this.add.text(x, y - 15, m.emoji, {
        fontSize: '32px'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(252)

      // Kosten oder "Schon gebaut!" anzeigen
      let kostenText = ''
      if (schonGebaut) {
        kostenText = '✅ Schon gebaut!'
      } else {
        if (m.holz > 0) kostenText += `🪵${m.holz} `
        if (m.stein > 0) kostenText += `🪨${m.stein} `
        if (m.eisen > 0) kostenText += `⚙️${m.eisen}`
      }

      const kosten = this.add.text(x, y + 20, kostenText, {
        fontSize: '14px', fontFamily: 'Arial', color: schonGebaut ? '#64B5F6' : (genug ? '#ffffff' : '#999999'),
        stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5).setScrollFactor(0).setDepth(252)

      if (genug) {
        karte.setInteractive({ useHandCursor: true })
        karte.on('pointerdown', () => {
          // Material abziehen
          this.rucksack.holz -= m.holz
          this.rucksack.stein -= m.stein
          this.rucksack.eisen -= m.eisen
          this.rucksackAnzeige.setText(this.getRucksackText())

          // Alle Menü-Elemente weg
          elemente.forEach(el => el.destroy())

          // Möbel ins Haus stellen! 🏠
          this.stelleMoebelInsHaus(m.emoji, m.name)
        })
      }

      elemente.push(karte, icon, kosten)
    })

    // Schließen-Button
    const schliessen = this.add.text(breite / 2, hoehe * 0.85, '❌ Zurück', {
      fontSize: '20px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(252)
    schliessen.setInteractive({ useHandCursor: true })
    schliessen.on('pointerdown', () => {
      elemente.forEach(el => el.destroy())
    })
    elemente.push(schliessen)
  }

  // === � HILFERUF AUS DER MINE ===
  zeigeHilferuf() {
    // 🔊 Hilferuf-Sound!
    soundHilferuf()
    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🆘 Hilferuf-Text fliegt von rechts rein (Richtung Mine)
    const hilfe1 = this.add.text(breite + 50, hoehe * 0.25, '🆘 HILFE!!', {
      fontSize: '32px', fontFamily: 'Arial', color: '#FF1744',
      stroke: '#000000', strokeThickness: 5
    }).setOrigin(0.5).setScrollFactor(0).setDepth(300)

    this.tweens.add({
      targets: hilfe1,
      x: breite / 2,
      duration: 1000,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Wackeln
        this.tweens.add({
          targets: hilfe1,
          angle: { from: -5, to: 5 },
          duration: 100,
          yoyo: true,
          repeat: 5
        })
      }
    })

    // Zweite Nachricht
    this.time.delayedCall(1500, () => {
      const hilfe2 = this.add.text(breite / 2, hoehe * 0.4,
        '😰 Jemand ruft aus der Mine!\n"Hilfe! Ich stecke fest!\nBitte komm mit einer Schaufel!"', {
        fontSize: '18px', fontFamily: 'Arial', color: '#ffffff',
        stroke: '#000000', strokeThickness: 4, align: 'center',
        backgroundColor: '#B71C1C99', padding: { x: 16, y: 10 }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(300)

      // Pfeil zur Mine
      const pfeil = this.add.text(breite - 60, hoehe * 0.6, '👉⛏️', {
        fontSize: '28px'
      }).setScrollFactor(0).setDepth(300)

      this.tweens.add({
        targets: pfeil,
        x: breite - 40,
        duration: 500,
        yoyo: true,
        repeat: -1
      })

      // Nach 4 Sekunden alles ausblenden
      this.time.delayedCall(4000, () => {
        this.tweens.add({
          targets: [hilfe1, hilfe2, pfeil],
          alpha: 0,
          duration: 1000,
          onComplete: () => {
            hilfe1.destroy()
            hilfe2.destroy()
            pfeil.destroy()
          }
        })

        // Hinweis beim Mineneingang
        if (this.minenEingang) {
          const sos = this.add.text(this.minenEingang.x, this.minenEingang.y - 45, '🆘', {
            fontSize: '20px'
          }).setOrigin(0.5).setDepth(100)
          this.tweens.add({
            targets: sos,
            y: sos.y - 8,
            duration: 600,
            yoyo: true,
            repeat: -1
          })
          this.minenSOS = sos
        }
      })
    })
  }

  // === 🪒 SCHAUFEL ZUR LEISTE HINZUFÜGEN ===
  fuegeSchaufelHinzu() {
    const breite = this.scale.width
    const hoehe = this.scale.height
    const leisteY = hoehe - 32

    // Leiste breiter machen (neues Rechteck drüber)
    const erweiterung = this.add.rectangle(breite / 2, leisteY, 340, 50, 0x000000, 0.5)
    erweiterung.setScrollFactor(0).setDepth(99)

    // Schaufel-Button rechts neben der Hacke
    const x = breite / 2 + 120
    const bg = this.add.circle(x, leisteY, 22, 0x616161)
    bg.setScrollFactor(0).setDepth(100)
    bg.setInteractive({ useHandCursor: true })

    const emoji = this.add.text(x, leisteY, '🪒', {
      fontSize: '24px'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101)

    // NEU-Badge!
    const neu = this.add.text(x + 15, leisteY - 18, 'NEU!', {
      fontSize: '10px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: '#FF1744', padding: { x: 3, y: 1 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102)
    this.tweens.add({ targets: neu, scale: 1.2, duration: 400, yoyo: true, repeat: -1 })

    bg.on('pointerdown', () => {
      this.werkzeug = 'schaufel'
      Object.keys(this.werkzeugButtons).forEach((key) => {
        this.werkzeugButtons[key].bg.fillColor = 0x616161
      })
      bg.fillColor = 0x4CAF50
      if (neu) neu.destroy()
      soundKlick()
      this.zeigeNachricht('🪒 Schaufel ausgewählt!')
    })

    this.werkzeugButtons['schaufel'] = { bg, emoji }
  }

  // === �🏠 MÖBEL INS HAUS STELLEN ===
  stelleMoebelInsHaus(emoji, name) {
    // 🏠 Möbel global speichern, damit sie im Haus sichtbar bleiben!
    hausDaten.moebel.push({ emoji, name })
    // 💾 Sofort speichern!
    spielSpeichern('BlumenwiesenSpiel', this.figurDaten, {
      x: this.spieler.x, y: this.spieler.y
    })

    // Kamera zum Haus schwenken
    this.cameras.main.stopFollow()
    this.cameras.main.pan(this.hausPosition.x, this.hausPosition.y, 800)

    this.zeigeNachricht(`${emoji} ${name} aufgestellt! 🎉`)
    this.konfetti()

    // 🐾 Wenn ein Hundebett gebaut wird und Bello da ist: Welpen kommen!
    if (name === 'Hundebett' && hausDaten.hundGerettet && !hausDaten.welpenGeboren) {
      this.time.delayedCall(3000, () => {
        this.welpenGeburt()
      })
    }

    this.time.delayedCall(2000, () => {
      this.cameras.main.startFollow(this.spieler)
    })
  }

  // === 🧑 FREUND ERSTELLEN (die gerettete Person) ===
  // 🌱 Milo wächst jeden Tag! Stufe 0=Baby, 5=sieht aus wie du!
  erstelleFreund() {
    const startX = this.hausPosition ? this.hausPosition.x + 50 : this.scale.width / 2 + 130
    const startY = this.wiesenY + 60

    const freund = this.add.container(startX, startY)

    // 🌱 Wachstums-Stufe bestimmt wie Milo aussieht!
    const stufe = hausDaten.miloWachstum || 0
    const kleidung = hausDaten.miloKleidung || { kleidungFarbe: 0xFF7043, kleidungTyp: 0, hosenFarbe: 0x5D4037, schuhFarbe: 0x424242 }

    if (stufe >= 5) {
      // ⭐ Stufe 5: Milo sieht aus wie du! Benutzt maleFigur()!
      const miloDaten = {
        hautfarbe: 0xFFCC80,
        haarfarbe: 0xE65100,
        haarStil: 0,
        kleidungFarbe: kleidung.kleidungFarbe,
        kleidungTyp: kleidung.kleidungTyp,
        hosenFarbe: kleidung.hosenFarbe,
        schuhFarbe: kleidung.schuhFarbe
      }
      maleFigur(this, freund, miloDaten, 0.75)
    } else {
      // 🌱 Stufe 0-4: Milo wächst Schritt für Schritt!
      // Je höher die Stufe, desto größer und detaillierter!
      const groesse = 0.6 + stufe * 0.08 // 0.6 → 0.92

      // 🦵 Beine (ab Stufe 0)
      const beinBreite = 4 * groesse
      const beinHoehe = 8 * groesse
      const beinL = this.add.rectangle(-3 * groesse, 18 * groesse, beinBreite, beinHoehe, kleidung.hosenFarbe)
      const beinR = this.add.rectangle(3 * groesse, 18 * groesse, beinBreite, beinHoehe, kleidung.hosenFarbe)
      freund.add([beinL, beinR])

      // 👟 Schuhe (ab Stufe 2!)
      if (stufe >= 2) {
        const schuhL = this.add.circle(-3 * groesse, (18 + beinHoehe / 2) * groesse, 3 * groesse, kleidung.schuhFarbe)
        const schuhR = this.add.circle(3 * groesse, (18 + beinHoehe / 2) * groesse, 3 * groesse, kleidung.schuhFarbe)
        freund.add([schuhL, schuhR])
      }

      // 💪 Arme (ab Stufe 1!)
      if (stufe >= 1) {
        const koerper = this.add.graphics()
        koerper.fillStyle(0xFFCC80) // Hautfarbe
        koerper.fillRoundedRect(-12 * groesse, -2 * groesse, 5 * groesse, 16 * groesse, 2.5 * groesse) // links
        koerper.fillRoundedRect(7 * groesse, -2 * groesse, 5 * groesse, 16 * groesse, 2.5 * groesse)   // rechts
        freund.add(koerper)

        // ✊ Hände (ab Stufe 2!)
        if (stufe >= 2) {
          const handL = this.add.circle(-9.5 * groesse, 15 * groesse, 3.5 * groesse, 0xFFCC80)
          const handR = this.add.circle(9.5 * groesse, 15 * groesse, 3.5 * groesse, 0xFFCC80)
          freund.add([handL, handR])
        }
      }

      // 👕 Hemd/Kleidung (wird mit Stufe hübscher)
      if (stufe >= 3) {
        // Ab Stufe 3: Richtige Kleidung wie der Spieler!
        const kl = this.add.graphics()
        if (kleidung.kleidungTyp === 1) {
          kl.fillStyle(kleidung.kleidungFarbe)
          kl.fillRoundedRect(-9 * groesse, -6 * groesse, 18 * groesse, 16 * groesse, 5 * groesse)
          kl.fillEllipse(0, 12 * groesse, 20 * groesse, 14 * groesse)
        } else if (kleidung.kleidungTyp === 2) {
          kl.fillStyle(kleidung.kleidungFarbe)
          kl.fillRoundedRect(-10 * groesse, -8 * groesse, 20 * groesse, 22 * groesse, 6 * groesse)
          kl.fillEllipse(0, -8 * groesse, 10 * groesse, 5 * groesse)
        } else {
          kl.fillStyle(kleidung.kleidungFarbe)
          kl.fillRoundedRect(-9 * groesse, -6 * groesse, 18 * groesse, 20 * groesse, 6 * groesse)
        }
        freund.add(kl)
      } else {
        // Stufe 0-2: Einfaches Hemd
        const hemd = this.add.rectangle(0, 9 * groesse, 12 * groesse, 12 * groesse, kleidung.kleidungFarbe)
        freund.add(hemd)
      }

      // 🧑 Kopf
      const kopfRadius = 8 * groesse
      const kopf = this.add.circle(0, 0, kopfRadius, 0xFFCC80)
      freund.add(kopf)

      // 💇 Haare
      const haar = this.add.circle(0, -6 * groesse, 7 * groesse, 0xE65100)
      freund.add(haar)

      // 👀 Augen
      const augenRadius = stufe >= 3 ? 2.5 * groesse : 1.2 * groesse
      const augeL = this.add.circle(-2.5 * groesse, -1.5 * groesse, augenRadius, 0x333333)
      const augeR = this.add.circle(2.5 * groesse, -1.5 * groesse, augenRadius, 0x333333)
      freund.add([augeL, augeR])

      // ✨ Glanzpunkte in den Augen (ab Stufe 4!)
      if (stufe >= 4) {
        const glanzL = this.add.circle(-1.5 * groesse, -2.5 * groesse, 0.8 * groesse, 0xFFFFFF)
        const glanzR = this.add.circle(3.5 * groesse, -2.5 * groesse, 0.8 * groesse, 0xFFFFFF)
        freund.add([glanzL, glanzR])
      }

      // 😊 Lächeln
      const mund = this.add.graphics()
      mund.lineStyle(1.5 * groesse, stufe >= 3 ? 0xE57373 : 0x333333)
      mund.beginPath()
      mund.arc(0, 1 * groesse, 3 * groesse, 0.2, Math.PI - 0.2, false)
      mund.strokePath()
      freund.add(mund)

      // 🥺 Bäckchen (ab Stufe 4!)
      if (stufe >= 4) {
        const baeckL = this.add.circle(-6 * groesse, 2 * groesse, 2.5 * groesse, 0xFFCDD2).setAlpha(0.6)
        const baeckR = this.add.circle(6 * groesse, 2 * groesse, 2.5 * groesse, 0xFFCDD2).setAlpha(0.6)
        freund.add([baeckL, baeckR])
      }
    }

    freund.setDepth(45)

    // 🏷️ Name über dem Kopf
    const nameY = stufe >= 5 ? -55 : -20 * (0.6 + stufe * 0.08)
    const miloNameText = hausDaten.verheiratet ? '💍 Milo 💕' : 'Milo'
    const name = this.add.text(0, nameY, miloNameText, {
      fontSize: stufe >= 5 ? '12px' : '10px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5)
    freund.add(name)

    this.freund = freund

    // 💬 Der Freund fragt ob du ihm ein Haus baust!
    if (!hausDaten.freundHausGebaut) {
      this.time.delayedCall(2000, () => {
        this.zeigeFreundFrage()
      })
    }

    // 🚶 Milo läuft frei herum! (neues Ziel wird in update() gesetzt)
    this.freundFolgt = false
    this.freundZielX = null
    this.freundZielY = null
    this.freundWartet = false

    // 🚶 Gleich das erste Ziel setzen!
    this.time.delayedCall(3000, () => {
      this.setzeMiloNeuesZiel()
    })
  }

  // === 🚶 MILO BEKOMMT EIN NEUES ZIEL ZUM HINLAUFEN ===
  setzeMiloNeuesZiel() {
    if (!this.freund || !this.freund.active) return

    const hoehe = this.scale.height
    const weltBreite = this.weltBreite || this.scale.width * 2

    // 🎲 Zufälligen Punkt auf der Wiese wählen!
    this.freundZielX = Phaser.Math.Between(50, weltBreite - 50)
    this.freundZielY = Phaser.Math.Between(this.wiesenY + 20, hoehe - 40)
  }

  // === 🐕 BELLO BEKOMMT EIN NEUES ZIEL ZUM HINLAUFEN ===
  setzeBelloNeuesZiel() {
    if (!this.hund || !this.hund.active) return

    const hoehe = this.scale.height
    const weltBreite = this.weltBreite || this.scale.width * 2

    // 🎲 Zufälligen Punkt auf der Wiese wählen!
    this.hundZielX = Phaser.Math.Between(50, weltBreite - 50)
    this.hundZielY = Phaser.Math.Between(this.wiesenY + 20, hoehe - 40)
  }

  // === 🌙 MILO GEHT SCHLAFEN ===
  miloGehtSchlafen() {
    if (!this.freund || !this.freund.active) return
    if (!this.freundHausPosition) return
    if (this.miloSchlaeft) return // 💤 Schläft schon!

    // 💤 SOFORT als schlafend markieren! (nicht erst nach der Animation!)
    this.miloSchlaeft = true
    this.freundZielX = null
    this.freundZielY = null
    this.freundWartet = true

    // 🚶 Milo läuft zu seinem Haus!
    const hausX = this.freundHausPosition.x
    const hausY = this.freundHausPosition.y

    // Kamera folgt Milo zum Haus
    this.cameras.main.stopFollow()
    this.cameras.main.pan(hausX, hausY, 1000)

    // 💤 Zzz über Milo zeigen
    const zzz = this.add.text(this.freund.x + 15, this.freund.y - 40, '💤', {
      fontSize: '16px'
    }).setDepth(200).setAlpha(0)
    this.tweens.add({
      targets: zzz,
      alpha: 1, y: zzz.y - 10,
      duration: 600, yoyo: true, repeat: 3
    })

    // 🚶 Milo läuft zum Haus!
    this.tweens.add({
      targets: this.freund,
      x: hausX,
      y: hausY + 10,
      duration: 2000,
      ease: 'Linear',
      onComplete: () => {
        zzz.destroy()

        // 🌙 Gute-Nacht-Nachricht
        const nachtText = this.add.text(hausX, hausY - 70, '🌙 Gute Nacht!\n💤 Zzzzz...', {
          fontSize: '14px', fontFamily: 'Arial', color: '#FFD700',
          stroke: '#000000', strokeThickness: 3,
          align: 'center'
        }).setOrigin(0.5).setDepth(200)

        // 🚪 Milo geht rein (wird unsichtbar)
        this.tweens.add({
          targets: this.freund,
          alpha: 0,
          scaleX: 0.5,
          scaleY: 0.5,
          duration: 600,
          onComplete: () => {
            // 🌙 Milo ist im Haus! (versteckt)
            this.freund.setVisible(false)

            // 🎵 Tür-Sound
            soundTuer()

            // 💤 Zzz über dem Haus
            const hausZzz = this.add.text(hausX + 30, hausY - 60, '💤', {
              fontSize: '22px'
            }).setDepth(200)
            this.tweens.add({
              targets: hausZzz,
              y: hausZzz.y - 15,
              alpha: 0.5,
              duration: 1500,
              yoyo: true,
              repeat: -1
            })
            this.miloZzz = hausZzz

            // Nacht-Text ausblenden
            this.time.delayedCall(3000, () => {
              this.tweens.add({
                targets: nachtText,
                alpha: 0,
                duration: 800,
                onComplete: () => nachtText.destroy()
              })
              // Kamera zurück zum Spieler
              this.cameras.main.startFollow(this.spieler, true, 0.1, 0.1)
            })
          }
        })
      }
    })
  }

  // === 🌞 MILO WACHT AUF ===
  miloWachtAuf() {
    if (!this.freund) return

    // �️ Sicherheits-Check: Wenn Milo gar nicht schläft, trotzdem aufräumen!
    if (!this.miloSchlaeft) {
      // Milo ist schon wach – einfach sicherstellen dass er sichtbar ist!
      this.freund.setVisible(true)
      this.freund.setAlpha(1)
      this.freund.setScale(1)
      this.freundWartet = false
      this.time.delayedCall(2000, () => {
        this.setzeMiloNeuesZiel()
      })
      return
    }

    // �💤 Zzz entfernen
    if (this.miloZzz) {
      this.miloZzz.destroy()
      this.miloZzz = null
    }

    // � MILO WÄCHST! Jeden Morgen eine Stufe größer!
    if (hausDaten.miloWachstum < 5) {
      hausDaten.miloWachstum += 1

      // 🌟 Alte Figur entfernen und neu zeichnen!
      const alteX = this.freund.x
      const alteY = this.freund.y
      this.freund.destroy()

      // 🧑 Neue, größere Figur erstellen!
      this.erstelleFreund()
      this.freund.x = alteX
      this.freund.y = alteY

      // Position vor dem Haus
      if (this.freundHausPosition) {
        this.freund.x = this.freundHausPosition.x + 30
        this.freund.y = this.freundHausPosition.y + 20
      }

      this.freund.setAlpha(0)

      // 🚪 Tür-Sound
      soundTuer()

      // 🌟 Wachstums-Nachricht!
      const stufe = hausDaten.miloWachstum
      const wachstumsTexte = [
        '', // Stufe 0 (passiert nicht)
        '🌱 Milo ist gewachsen!\nEr hat jetzt Arme! 💪',
        '🌱 Milo wächst weiter!\nEr hat Schuhe und Hände! 👟✊',
        '🌿 Milo wird größer!\nEr hat richtige Kleidung! 👕',
        '🌳 Milo wächst und wächst!\nEr hat jetzt Bäckchen! 🥺',
        '⭐ WOW! Milo ist ausgewachsen!\nEr sieht jetzt aus wie du! 🎉'
      ]

      // 🌞 Milo erscheint mit Wachstums-Animation!
      this.tweens.add({
        targets: this.freund,
        alpha: 1,
        duration: 1200,
        onComplete: () => {
          this.miloSchlaeft = false

          // 🎉 Konfetti bei Stufe 5!
          if (stufe === 5) {
            soundKonfetti()
            for (let i = 0; i < 20; i++) {
              const k = this.add.circle(
                this.freund.x + Phaser.Math.Between(-60, 60),
                this.freund.y - 40,
                Phaser.Math.Between(3, 6),
                Phaser.Math.RND.pick([0xFF5252, 0xFFD740, 0x69F0AE, 0x448AFF, 0xE040FB])
              ).setDepth(300)
              this.tweens.add({
                targets: k,
                y: k.y + Phaser.Math.Between(60, 120),
                x: k.x + Phaser.Math.Between(-30, 30),
                alpha: 0,
                duration: Phaser.Math.Between(1000, 2000),
                onComplete: () => k.destroy()
              })
            }
          }

          // 💬 Wachstums-Nachricht!
          const nachricht = this.add.text(
            this.freund.x, this.freund.y - 60,
            wachstumsTexte[stufe] || '🌞 Guten Morgen! 😊', {
              fontSize: '13px', fontFamily: 'Arial', color: '#FFD700',
              stroke: '#000000', strokeThickness: 3,
              align: 'center', backgroundColor: '#333333',
              padding: { x: 8, y: 6 }
            }
          ).setOrigin(0.5).setDepth(200)

          this.tweens.add({
            targets: nachricht,
            alpha: 0,
            duration: 800,
            delay: 4000,
            onComplete: () => nachricht.destroy()
          })

          // 💾 Speichern!
          spielSpeichern('BlumenwiesenSpiel', this.figurDaten, {
            x: this.spieler.x, y: this.spieler.y
          })

          // 🚶 Milo läuft wieder frei herum!
          this.freundWartet = false
          this.time.delayedCall(5000, () => {
            this.setzeMiloNeuesZiel()
          })

          // 💒 Gerade Stufe 5 erreicht UND genug Herzen? Antrag! 💍
          if (stufe === 5 && hausDaten.miloHerzen >= 5 && !hausDaten.verheiratet) {
            this.time.delayedCall(6000, () => {
              this.miloMachtAntrag()
            })
          }
        }
      })
    } else {
      // Milo ist schon ausgewachsen – normales Aufwachen
      this.freund.setVisible(true)
      this.freund.setAlpha(0)
      this.freund.setScale(1)

      // Position vor dem Haus
      if (this.freundHausPosition) {
        this.freund.x = this.freundHausPosition.x + 30
        this.freund.y = this.freundHausPosition.y + 20
      }

      // 🚪 Tür-Sound
      soundTuer()

      // 🌞 Milo erscheint wieder!
      this.tweens.add({
        targets: this.freund,
        alpha: 1,
        duration: 800,
        onComplete: () => {
          this.miloSchlaeft = false

          // 💬 Guten Morgen Nachricht!
          const morgenText = this.add.text(
            this.freund.x, this.freund.y - 50,
            '🌞 Guten Morgen!\nIch bin wach! 😊', {
              fontSize: '12px', fontFamily: 'Arial', color: '#FFD700',
              stroke: '#000000', strokeThickness: 3,
              align: 'center', backgroundColor: '#333333',
              padding: { x: 6, y: 4 }
            }
          ).setOrigin(0.5).setDepth(200)

          this.tweens.add({
            targets: morgenText,
            alpha: 0,
            duration: 800,
            delay: 3000,
            onComplete: () => morgenText.destroy()
          })

          // 🚶 Milo läuft wieder frei herum!
          this.freundWartet = false
          this.time.delayedCall(4000, () => {
            this.setzeMiloNeuesZiel()
          })

          // 💒 Wenn genug Herzen da sind: Milo macht einen Antrag! 💍
          if (hausDaten.miloHerzen >= 5 && !hausDaten.verheiratet && hausDaten.miloWachstum >= 5) {
            this.time.delayedCall(3000, () => {
              this.miloMachtAntrag()
            })
          }
          // 🆘 Manchmal braucht Milo Hilfe zuhause! (30% Chance)
          else if (Math.random() < 0.3 && this.freundHausPosition) {
            hausDaten.miloBrauchtHilfe = true
            this.time.delayedCall(5000, () => {
              this.miloRuftUmHilfe()
            })
          }
        }
      })
    }
  }

  // === 🆘 MILO RUFT UM HILFE ZUHAUSE ===
  miloRuftUmHilfe() {
    if (!this.freund || !this.freundHausPosition) return

    // 🏠 Milo rennt zu seinem Haus!
    this.freundZielX = this.freundHausPosition.x
    this.freundZielY = this.freundHausPosition.y + 20

    // 💬 Milo sagt dass er Hilfe braucht
    const hilfeText = this.add.text(
      this.freund.x, this.freund.y - 50,
      '🆘 Ich brauche Hilfe\nzuhause! Besuch mich! 🏡', {
        fontSize: '13px', fontFamily: 'Arial', color: '#FF5252',
        stroke: '#000000', strokeThickness: 3,
        align: 'center', backgroundColor: '#333333',
        padding: { x: 8, y: 6 }
      }
    ).setOrigin(0.5).setDepth(200)

    // 🔔 Alarm-Sound!
    spieleTon(880, 0.15, 0.05, 'sine')
    setTimeout(() => spieleTon(660, 0.15, 0.05, 'sine'), 300)
    setTimeout(() => spieleTon(880, 0.15, 0.05, 'sine'), 600)

    // 🔔 Hilfe-Symbol über Milos Haus!
    if (this.miloHilfeSymbol) this.miloHilfeSymbol.destroy()
    this.miloHilfeSymbol = this.add.text(
      this.freundHausPosition.x, this.freundHausPosition.y - 125,
      '🆘', { fontSize: '24px' }
    ).setOrigin(0.5).setDepth(100)
    this.tweens.add({
      targets: this.miloHilfeSymbol,
      y: this.miloHilfeSymbol.y - 8,
      duration: 600,
      yoyo: true,
      repeat: -1
    })

    this.tweens.add({
      targets: hilfeText,
      alpha: 0,
      duration: 800,
      delay: 4000,
      onComplete: () => hilfeText.destroy()
    })

    // 💾 Speichern dass Milo Hilfe braucht
    spielSpeichern('BlumenwiesenSpiel', this.figurDaten, {
      x: this.spieler.x, y: this.spieler.y
    })
  }

  // === 💒 MILO MACHT EINEN HEIRATSANTRAG! ===
  miloMachtAntrag() {
    if (!this.freund || !this.freund.active) return
    if (hausDaten.verheiratet) return // Schon verheiratet!
    if (this.miloSchlaeft) return // Nicht wenn er schläft!

    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🧡 Milo läuft zum Spieler!
    this.freundZielX = this.spieler.x - 30
    this.freundZielY = this.spieler.y

    // ⏳ Kurz warten bis Milo beim Spieler ist
    this.time.delayedCall(3000, () => {
      if (!this.freund || !this.freund.active) return

      // 🎵 Romantische Melodie!
      const melodie = [523, 659, 784, 659, 523, 659, 784, 1047]
      melodie.forEach((note, i) => {
        setTimeout(() => spieleTon(note, 0.3, 0.06, 'sine'), i * 250)
      })

      // 💕 Herzen fliegen um Milo!
      for (let h = 0; h < 8; h++) {
        const herz = this.add.text(
          this.freund.x + Phaser.Math.Between(-40, 40),
          this.freund.y - 20,
          '💕', { fontSize: '16px' }
        ).setDepth(250)
        this.tweens.add({
          targets: herz,
          y: herz.y - Phaser.Math.Between(40, 80),
          alpha: 0,
          duration: 2000,
          delay: h * 300,
          onComplete: () => herz.destroy()
        })
      }

      // 💍 Milo kniet nieder! (Figur wird kleiner = knien)
      this.tweens.add({
        targets: this.freund,
        scaleY: 0.7,
        duration: 500
      })

      // 💬 Milo fragt!
      const frageBox = this.add.rectangle(breite / 2, hoehe * 0.25, breite * 0.8, 120, 0x000000, 0.85)
      frageBox.setScrollFactor(0).setDepth(300)

      const frageText = this.add.text(breite / 2, hoehe * 0.18,
        '💍 Milo wird ganz rot...\n\n🥺 "Ich... ich hab dich so lieb!\nWillst du mich heiraten? 💒💕"', {
          fontSize: '16px', fontFamily: 'Arial', color: '#FFD700',
          stroke: '#000000', strokeThickness: 3,
          align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301)

      // 💍 Ring-Emoji schwebt
      const ring = this.add.text(breite / 2, hoehe * 0.42, '💍', {
        fontSize: '40px'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(301)
      this.tweens.add({
        targets: ring,
        y: ring.y - 10,
        scale: 1.2,
        duration: 800,
        yoyo: true,
        repeat: -1
      })

      // ✅ JA-Button!
      const jaBtn = this.add.text(breite * 0.3, hoehe * 0.55, '💕 JA! Ich will! 💕', {
        fontSize: '18px', fontFamily: 'Arial', color: '#ffffff',
        backgroundColor: '#E91E63', padding: { x: 20, y: 12 }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(301)
      jaBtn.setInteractive({ useHandCursor: true })

      // 🤔 Noch nicht Button
      const spaeterBtn = this.add.text(breite * 0.72, hoehe * 0.55, '🤔 Noch nicht...', {
        fontSize: '14px', fontFamily: 'Arial', color: '#cccccc',
        stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5).setScrollFactor(0).setDepth(301)
      spaeterBtn.setInteractive({ useHandCursor: true })

      const alleElemente = [frageBox, frageText, ring, jaBtn, spaeterBtn]

      // 💕 JA gedrückt!
      jaBtn.on('pointerdown', () => {
        alleElemente.forEach(el => el.destroy())
        // Milo steht wieder auf
        this.tweens.add({
          targets: this.freund,
          scaleY: 1,
          duration: 300
        })
        this.hochzeitsFeier()
      })

      // 🤔 Noch nicht...
      spaeterBtn.on('pointerdown', () => {
        alleElemente.forEach(el => el.destroy())
        // Milo steht traurig auf
        this.tweens.add({
          targets: this.freund,
          scaleY: 1,
          duration: 300
        })
        // 💬 Milo ist traurig aber versteht es
        const traurig = this.add.text(
          this.freund.x, this.freund.y - 55,
          '😢 Okay... Ich frag\ndich morgen nochmal! 💕', {
            fontSize: '12px', fontFamily: 'Arial', color: '#FF7043',
            stroke: '#000000', strokeThickness: 3,
            align: 'center', backgroundColor: '#333333',
            padding: { x: 6, y: 4 }
          }
        ).setOrigin(0.5).setDepth(200)
        this.tweens.add({
          targets: traurig,
          alpha: 0, duration: 800, delay: 3000,
          onComplete: () => traurig.destroy()
        })
        // Milo läuft wieder normal
        this.time.delayedCall(2000, () => {
          this.setzeMiloNeuesZiel()
        })
      })
    })
  }

  // === 💒 HOCHZEITSFEIER! ===
  hochzeitsFeier() {
    hausDaten.verheiratet = true

    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🎵 Hochzeitsmarsch! (Hier kommt die Braut!)
    const hochzeitsMusik = [
      523, 523, 523, 659, 784, 784, 784, 659,
      523, 659, 784, 1047, 988, 784, 659, 784
    ]
    hochzeitsMusik.forEach((note, i) => {
      setTimeout(() => spieleTon(note, 0.25, 0.08, 'sine'), i * 200)
    })

    // 🌟 Bildschirm wird magisch!
    const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.7)
    overlay.setScrollFactor(0).setDepth(350)

    // 💒 Hochzeits-Titel
    const titel = this.add.text(breite / 2, hoehe * 0.08,
      '💒✨ HOCHZEIT! ✨💒', {
        fontSize: '32px', fontFamily: 'Arial', color: '#FFD700',
        stroke: '#E91E63', strokeThickness: 5
      }).setOrigin(0.5).setScrollFactor(0).setDepth(351)

    // ✨ Titel glitzert!
    this.tweens.add({
      targets: titel,
      scale: 1.1,
      duration: 500,
      yoyo: true,
      repeat: -1
    })

    // 🧑❤️🧑 Spieler und Milo nebeneinander
    const paarY = hoehe * 0.45
    const spielerIcon = this.add.text(breite * 0.35, paarY, '🧑', {
      fontSize: '48px'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(352)
    const herz = this.add.text(breite * 0.5, paarY - 10, '❤️', {
      fontSize: '32px'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(352)
    const miloIcon = this.add.text(breite * 0.65, paarY, '🧑', {
      fontSize: '48px'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(352)

    // 💍 Ringe!
    const ringe = this.add.text(breite / 2, paarY + 50, '💍💍', {
      fontSize: '28px'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(352)

    // ❤️ Herz pulsiert!
    this.tweens.add({
      targets: herz,
      scale: 1.4,
      duration: 500,
      yoyo: true,
      repeat: -1
    })

    const elemente = [overlay, titel, spielerIcon, herz, miloIcon, ringe]

    // 💬 Geschichte der Hochzeit!
    const texte = [
      '💒 Alle Freunde sind gekommen!',
      '🌸 Lina hat Blumen gestreut!',
      '🎵 Nora singt ein Lied!',
      '🍪 Max hat den Kuchen gebacken!',
      '🎨 Finn hat ein Bild gemalt!',
      '🐕 Bello bringt die Ringe! Wuff!',
      '💍 Ihr tauscht die Ringe...',
      '💋 Ihr gebt euch einen Kuss!',
      '🎉 IHR SEID VERHEIRATET!! 💕'
    ]

    let textIndex = 0
    const geschichteText = this.add.text(breite / 2, hoehe * 0.22,
      texte[0], {
        fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
        stroke: '#000000', strokeThickness: 3,
        align: 'center'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(351)
    elemente.push(geschichteText)

    // 📖 Alle 2 Sekunden nächster Text
    const textTimer = this.time.addEvent({
      delay: 2000,
      repeat: texte.length - 2,
      callback: () => {
        textIndex++
        if (textIndex < texte.length) {
          geschichteText.setText(texte[textIndex])
          // 🎵 Kleine Glocke bei jedem Text!
          spieleTon(1047, 0.1, 0.04, 'sine')
        }
      }
    })
    elemente.push(textTimer)

    // 🎊 Konfetti die ganze Zeit!
    const konfettiTimer = this.time.addEvent({
      delay: 400,
      repeat: 25,
      callback: () => {
        for (let i = 0; i < 3; i++) {
          const kx = Phaser.Math.Between(50, breite - 50)
          const ky = 0
          const farbe = Phaser.Math.RND.pick([0xFF5252, 0xFFD740, 0x69F0AE, 0x448AFF, 0xE040FB, 0xFFD700, 0xE91E63])
          const konfetti = this.add.circle(kx, ky, Phaser.Math.Between(3, 6), farbe)
          konfetti.setScrollFactor(0).setDepth(353)
          this.tweens.add({
            targets: konfetti,
            y: hoehe + 20,
            x: konfetti.x + Phaser.Math.Between(-50, 50),
            angle: Phaser.Math.Between(0, 360),
            duration: Phaser.Math.Between(2000, 4000),
            onComplete: () => konfetti.destroy()
          })
        }
      }
    })

    // ⏰ Nach 20 Sekunden: Feier beenden!
    this.time.delayedCall(20000, () => {
      // 💕 Alles aufräumen
      elemente.forEach(el => {
        if (el && el.destroy) el.destroy()
      })

      // 🎉 Abschluss-Nachricht
      const abschluss = this.add.text(breite / 2, hoehe * 0.35,
        '💕 Ihr seid jetzt verheiratet! 💍\n\n🧡 Milo und du – für immer! ✨\n\n💒 Was für ein schöner Tag! 🎉', {
          fontSize: '18px', fontFamily: 'Arial', color: '#FFD700',
          stroke: '#000000', strokeThickness: 4,
          align: 'center', backgroundColor: '#E91E6388',
          padding: { x: 20, y: 16 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(400)

      // 🎵 Finale Melodie!
      const finale = [523, 659, 784, 1047, 784, 1047, 1318]
      finale.forEach((note, i) => {
        setTimeout(() => spieleTon(note, 0.3, 0.1, 'sine'), i * 200)
      })

      this.time.delayedCall(5000, () => {
        abschluss.destroy()
        overlay.destroy()

        // 💾 Speichern!
        spielSpeichern('BlumenwiesenSpiel', this.figurDaten, {
          x: this.spieler.x, y: this.spieler.y
        })

        // 🚶 Milo läuft wieder!
        this.setzeMiloNeuesZiel()

        // 🏷️ Milos Name aktualisieren – jetzt mit Herz!
        if (this.freund) {
          this.freund.list.forEach(child => {
            if (child.type === 'Text' && child.text === 'Milo') {
              child.setText('💍 Milo 💕')
            }
          })
        }

        this.zeigeNachricht('💕 Ihr seid verheiratet! 💍✨')
      })
    })
  }

  // === 👶 MILO FRAGT: WOLLEN WIR KINDER HABEN? ===
  kinderFrage() {
    // 🧹 Alte Kinder entfernen wenn welche da sind!
    if (hausDaten.kinder.length > 0) {
      hausDaten.kinder = []
      if (this.kinderSprites) {
        this.kinderSprites.forEach(k => { if (k && k.destroy) k.destroy() })
        this.kinderSprites = []
        this.kinderZiele = []
      }
    }

    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🎵 Süße Melodie!
    const melodie = [523, 659, 784, 659, 523]
    melodie.forEach((note, i) => {
      setTimeout(() => spieleTon(note, 0.15, 0.05, 'sine'), i * 200)
    })

    // 🖤 Dunkler Hintergrund
    const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.7)
    overlay.setScrollFactor(0).setDepth(400).setInteractive()

    // 💕 Milos Frage
    const frageText = this.add.text(breite / 2, hoehe * 0.12,
      '👶💕 Milo wird ganz aufgeregt!\n\n"Ich hab nachgedacht...\nWollen wir eine Familie haben?\nWie viele Kinder wünschst du dir?" 🥰', {
        fontSize: '15px', fontFamily: 'Arial', color: '#FFD700',
        stroke: '#000000', strokeThickness: 3,
        align: 'center'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(401)

    // 👶 Baby-Emoji schwebt süß
    const babyEmoji = this.add.text(breite / 2, hoehe * 0.38, '👶', {
      fontSize: '40px'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(401)
    this.tweens.add({
      targets: babyEmoji,
      y: babyEmoji.y - 8,
      scale: 1.15,
      duration: 800,
      yoyo: true,
      repeat: -1
    })

    const elemente = [overlay, frageText, babyEmoji]

    // 🔢 Buttons: 1, 2, 3 oder 4 Kinder!
    const kinderOptionen = [
      { anzahl: 1, text: '👶 Ein Kind!', farbe: '#E91E63' },
      { anzahl: 2, text: '👶👶 Zwei Kinder!', farbe: '#9C27B0' },
      { anzahl: 3, text: '👶👶👶 Drei Kinder!', farbe: '#3F51B5' },
      { anzahl: 4, text: '👶👶👶👶 Vier Kinder!!', farbe: '#00BCD4' },
    ]

    kinderOptionen.forEach((opt, i) => {
      const y = hoehe * 0.5 + i * 48
      const btn = this.add.text(breite / 2, y, opt.text, {
        fontSize: '18px', fontFamily: 'Arial', color: '#ffffff',
        backgroundColor: opt.farbe, padding: { x: 20, y: 10 }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(401)
      btn.setInteractive({ useHandCursor: true })

      // ✨ Hover!
      btn.on('pointerover', () => btn.setScale(1.1))
      btn.on('pointerout', () => btn.setScale(1))

      btn.on('pointerdown', () => {
        // 🎉 Auswahl getroffen!
        elemente.forEach(el => el.destroy())
        this.kinderBekommen(opt.anzahl)
      })
      elemente.push(btn)
    })

    // ❌ Doch nicht
    const spaeterBtn = this.add.text(breite / 2, hoehe * 0.5 + 4 * 48 + 10, '🤔 Vielleicht später...', {
      fontSize: '13px', fontFamily: 'Arial', color: '#cccccc',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(401)
    spaeterBtn.setInteractive({ useHandCursor: true })
    spaeterBtn.on('pointerdown', () => {
      elemente.forEach(el => el.destroy())
      this.miloRedet = false

      // 💬 Milo versteht
      const traurig = this.add.text(
        this.freund.x, this.freund.y - 55,
        '😊 Okay! Wir haben ja\nnoch viel Zeit! 💕', {
          fontSize: '12px', fontFamily: 'Arial', color: '#FFD700',
          stroke: '#000000', strokeThickness: 3,
          align: 'center', backgroundColor: '#333333',
          padding: { x: 6, y: 4 }
        }
      ).setOrigin(0.5).setDepth(200)
      this.tweens.add({
        targets: traurig,
        alpha: 0, duration: 800, delay: 3000,
        onComplete: () => traurig.destroy()
      })
    })
    elemente.push(spaeterBtn)
  }

  // === 🎉 KINDER BEKOMMEN! ===
  kinderBekommen(anzahl) {
    // 👶 Jedes Baby einzeln gestalten! Erst alle erstellen, dann feiern!
    this.neueBabys = []
    this.babyAnzahl = anzahl
    this.babyErstellen(0)
  }

  // === 🎨 EIN BABY GESTALTEN! (wird für jedes Baby aufgerufen) ===
  babyErstellen(nummer) {
    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🎵 Süßer Sound!
    spieleTon(659, 0.12, 0.05, 'sine')
    setTimeout(() => spieleTon(784, 0.1, 0.04, 'sine'), 150)

    // 🖤 Hintergrund
    const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.8)
    overlay.setScrollFactor(0).setDepth(400).setInteractive()

    // 👶 Titel
    const titel = this.add.text(breite / 2, hoehe * 0.06,
      `👶 Baby Nr. ${nummer + 1} gestalten! 🎨`, {
        fontSize: '20px', fontFamily: 'Arial', color: '#FFD700',
        stroke: '#E91E63', strokeThickness: 3
      }).setOrigin(0.5).setScrollFactor(0).setDepth(401)

    const elemente = [overlay, titel]

    // 👧👦 Junge oder Mädchen?
    const geschlechtLabel = this.add.text(breite / 2, hoehe * 0.16,
      '👧 Junge oder Mädchen? 👦', {
        fontSize: '15px', fontFamily: 'Arial', color: '#ffffff',
        stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5).setScrollFactor(0).setDepth(401)
    elemente.push(geschlechtLabel)

    let gewaehltesMaedchen = true // Standard: Mädchen

    const maedchenBtn = this.add.text(breite * 0.3, hoehe * 0.23, '👧 Mädchen', {
      fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: '#E91E63', padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(401)
    maedchenBtn.setInteractive({ useHandCursor: true })

    const jungeBtn = this.add.text(breite * 0.7, hoehe * 0.23, '👦 Junge', {
      fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: '#555555', padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(401)
    jungeBtn.setInteractive({ useHandCursor: true })

    elemente.push(maedchenBtn, jungeBtn)

    // 🎯 Geschlecht wählen
    maedchenBtn.on('pointerdown', () => {
      gewaehltesMaedchen = true
      maedchenBtn.setStyle({ backgroundColor: '#E91E63' })
      jungeBtn.setStyle({ backgroundColor: '#555555' })
      soundKlick()
    })
    jungeBtn.on('pointerdown', () => {
      gewaehltesMaedchen = false
      jungeBtn.setStyle({ backgroundColor: '#1976D2' })
      maedchenBtn.setStyle({ backgroundColor: '#555555' })
      soundKlick()
    })

    // 🎨 Farbe wählen!
    const farbLabel = this.add.text(breite / 2, hoehe * 0.34,
      '🎨 Welche Farbe soll das Baby tragen?', {
        fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
        stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5).setScrollFactor(0).setDepth(401)
    elemente.push(farbLabel)

    const farben = [
      { farbe: 0xFF80AB, name: '💗 Rosa' },
      { farbe: 0x80D8FF, name: '💙 Blau' },
      { farbe: 0xB9F6CA, name: '💚 Grün' },
      { farbe: 0xFFFF8D, name: '💛 Gelb' },
      { farbe: 0xEA80FC, name: '💜 Lila' },
      { farbe: 0xFFAB91, name: '🧡 Orange' },
    ]

    let gewaehlteFarbe = farben[0].farbe
    const farbButtons = []

    // 👶 Vorschau-Baby in der Mitte!
    const vorschauX = breite / 2
    const vorschauY = hoehe * 0.56
    const vorschauBaby = this.add.container(vorschauX, vorschauY).setScrollFactor(0).setDepth(402)
    const vKoerper = this.add.circle(0, 6, 14, gewaehlteFarbe)
    const vKopf = this.add.circle(0, -10, 11, 0xFFE0B2)
    const vAugeL = this.add.circle(-4, -12, 2.5, 0x333333)
    const vAugeR = this.add.circle(4, -12, 2.5, 0x333333)
    const vMund = this.add.graphics()
    vMund.lineStyle(1.5, 0x333333)
    vMund.beginPath()
    vMund.arc(0, -7, 4, 0.2, Math.PI - 0.2, false)
    vMund.strokePath()
    const vSchleife = this.add.text(0, -24, '🎀', { fontSize: '12px' }).setOrigin(0.5)
    vorschauBaby.add([vKoerper, vKopf, vAugeL, vAugeR, vMund, vSchleife])
    elemente.push(vorschauBaby)

    // 👶 Baby wippt!
    this.tweens.add({
      targets: vorschauBaby,
      y: vorschauY - 5,
      duration: 600,
      yoyo: true,
      repeat: -1
    })

    // 🎨 Farb-Buttons
    farben.forEach((f, i) => {
      const spalte = i % 3
      const zeile = Math.floor(i / 3)
      const x = breite * 0.25 + spalte * (breite * 0.25)
      const y = hoehe * 0.42 + zeile * 32

      const fBtn = this.add.text(x, y, f.name, {
        fontSize: '13px', fontFamily: 'Arial', color: '#ffffff',
        backgroundColor: i === 0 ? '#FFD700' : '#444444',
        padding: { x: 8, y: 5 }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(401)
      fBtn.setInteractive({ useHandCursor: true })

      fBtn.on('pointerdown', () => {
        gewaehlteFarbe = f.farbe
        // 🎨 Alle zurücksetzen, gewählten markieren
        farbButtons.forEach(b => b.setStyle({ backgroundColor: '#444444' }))
        fBtn.setStyle({ backgroundColor: '#FFD700' })
        // 👶 Vorschau aktualisieren!
        vKoerper.setFillStyle(f.farbe)
        soundKlick()
      })

      farbButtons.push(fBtn)
      elemente.push(fBtn)
    })

    // ✏️ Name eingeben! (HTML-Input)
    const gameDiv = document.getElementById('game') || document.body
    const eingabeContainer = document.createElement('div')
    eingabeContainer.style.cssText = 'position:absolute;bottom:12%;left:50%;transform:translateX(-50%);z-index:999;display:flex;flex-direction:column;align-items:center;gap:10px;'

    const nameLabel = document.createElement('div')
    nameLabel.textContent = '✏️ Wie soll dein Baby heißen?'
    nameLabel.style.cssText = 'font-size:15px;color:#FFD700;font-family:Arial;text-shadow:2px 2px 4px #000;'

    const nameInput = document.createElement('input')
    nameInput.type = 'text'
    nameInput.placeholder = '👶 Name eingeben...'
    nameInput.maxLength = 12
    nameInput.style.cssText = 'font-size:20px;padding:10px 18px;border-radius:20px;border:3px solid #FFD700;background:#222;color:#fff;width:200px;outline:none;font-family:Arial;text-align:center;'

    const fertigBtn = document.createElement('button')
    fertigBtn.textContent = nummer + 1 < this.babyAnzahl ? '✅ Weiter zum nächsten Baby!' : '✅ Fertig! 🎉'
    fertigBtn.style.cssText = 'font-size:18px;padding:10px 24px;border-radius:20px;border:3px solid #4CAF50;background:#4CAF50;color:white;cursor:pointer;font-family:Arial;'

    eingabeContainer.appendChild(nameLabel)
    eingabeContainer.appendChild(nameInput)
    eingabeContainer.appendChild(fertigBtn)
    gameDiv.appendChild(eingabeContainer)

    // ✅ Fertig-Button!
    fertigBtn.addEventListener('click', () => {
      const name = nameInput.value.trim()
      if (!name) {
        nameInput.style.borderColor = '#FF5252'
        nameInput.placeholder = '❌ Bitte einen Namen!'
        return
      }

      // 🎵 Bestätigungs-Sound!
      spieleTon(1047, 0.1, 0.04, 'sine')

      // 👶 Baby speichern!
      this.neueBabys.push({
        name: name,
        farbe: gewaehlteFarbe,
        istMaedchen: gewaehltesMaedchen,
        wachstum: 0
      })

      // 🧹 Aufräumen
      eingabeContainer.remove()
      elemente.forEach(el => { if (el && el.destroy) el.destroy() })

      // 👶 Nächstes Baby oder fertig?
      if (nummer + 1 < this.babyAnzahl) {
        // ➡️ Nächstes Baby gestalten!
        this.babyErstellen(nummer + 1)
      } else {
        // 🎉 Alle Babys fertig! FEIER!
        this.babyFeier()
      }
    })

    // 🎀/👦 Schleife aktualisieren bei Geschlechts-Wahl
    const updateSchleife = () => {
      vSchleife.setVisible(gewaehltesMaedchen)
    }
    maedchenBtn.on('pointerdown', updateSchleife)
    jungeBtn.on('pointerdown', updateSchleife)

    // 🎯 Fokus aufs Namensfeld
    this.time.delayedCall(100, () => nameInput.focus())
  }

  // === 🎉 BABY-FEIER! (nachdem alle Babys gestaltet wurden) ===
  babyFeier() {
    const breite = this.scale.width
    const hoehe = this.scale.height
    const neueKinder = this.neueBabys

    // 💾 Kinder speichern!
    hausDaten.kinder = neueKinder
    spielSpeichern('BlumenwiesenSpiel', this.figurDaten, {
      x: this.spieler.x, y: this.spieler.y
    })

    // 🎵 Feier-Melodie!
    const melodie = [523, 659, 784, 1047, 784, 1047, 1318]
    melodie.forEach((note, i) => {
      setTimeout(() => spieleTon(note, 0.2, 0.06, 'sine'), i * 180)
    })

    // 🌟 Magischer Bildschirm!
    const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.75)
    overlay.setScrollFactor(0).setDepth(350)

    // 👶 Titel!
    const anzahl = neueKinder.length
    const titelText = anzahl === 1
      ? '👶✨ Euer Baby ist da! ✨👶'
      : `👶✨ Eure ${anzahl} Babys sind da! ✨👶`
    const titel = this.add.text(breite / 2, hoehe * 0.08, titelText, {
      fontSize: '28px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#E91E63', strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(351)
    this.tweens.add({
      targets: titel,
      scale: 1.08, duration: 600, yoyo: true, repeat: -1
    })

    const elemente = [overlay, titel]

    // 👶 Geschichte erzählen!
    const texte = [
      '🌟 Ein Wunder ist geschehen!',
      '💕 Milo hält deine Hand ganz fest...',
    ]
    neueKinder.forEach((kind, i) => {
      const geschlecht = kind.istMaedchen ? 'ein Mädchen' : 'ein Junge'
      texte.push(`👶 Baby Nr. ${i + 1} ist da! Es ist ${geschlecht}!`)
      texte.push(`🏷️ Ihr nennt es: ✨ ${kind.name} ✨`)
    })
    texte.push('🎉 Was für ein glücklicher Tag!!')
    texte.push('👨‍👩‍👧‍👦 Eure Familie ist jetzt komplett! 💕')

    // 👶 Baby-Emojis in der Mitte
    const babyY = hoehe * 0.45
    neueKinder.forEach((kind, i) => {
      const abstand = 70
      const startX = breite / 2 - ((anzahl - 1) * abstand) / 2
      const emoji = this.add.text(startX + i * abstand, babyY, '👶', {
        fontSize: '36px'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(352).setAlpha(0)
      elemente.push(emoji)

      const nameText = this.add.text(startX + i * abstand, babyY + 30, kind.name, {
        fontSize: '14px', fontFamily: 'Arial', color: '#FFD700',
        stroke: '#000000', strokeThickness: 3
      }).setOrigin(0.5).setScrollFactor(0).setDepth(352).setAlpha(0)
      elemente.push(nameText)

      this.tweens.add({
        targets: [emoji, nameText],
        alpha: 1, scale: 1.2, duration: 800,
        delay: 3000 + i * 2000,
        onComplete: () => {
          this.tweens.add({
            targets: emoji, y: emoji.y - 6,
            duration: 600, yoyo: true, repeat: -1
          })
          spieleTon(1047, 0.1, 0.04, 'sine')
          setTimeout(() => spieleTon(1318, 0.08, 0.03, 'sine'), 150)
        }
      })
    })

    // 📖 Geschichte-Text
    let textIndex = 0
    const geschichteText = this.add.text(breite / 2, hoehe * 0.22,
      texte[0], {
        fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
        stroke: '#000000', strokeThickness: 3, align: 'center'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(351)
    elemente.push(geschichteText)

    this.time.addEvent({
      delay: 2000, repeat: texte.length - 2,
      callback: () => {
        textIndex++
        if (textIndex < texte.length) {
          geschichteText.setText(texte[textIndex])
          spieleTon(800, 0.06, 0.03, 'sine')
        }
      }
    })

    // 🎊 Konfetti!
    this.time.addEvent({
      delay: 500, repeat: 20,
      callback: () => {
        for (let i = 0; i < 3; i++) {
          const kx = Phaser.Math.Between(50, breite - 50)
          const farbe = Phaser.Math.RND.pick([0xFF80AB, 0x80D8FF, 0xB9F6CA, 0xFFFF8D, 0xEA80FC, 0xFFD700])
          const konfetti = this.add.circle(kx, 0, Phaser.Math.Between(3, 5), farbe)
          konfetti.setScrollFactor(0).setDepth(353)
          this.tweens.add({
            targets: konfetti,
            y: hoehe + 20, x: konfetti.x + Phaser.Math.Between(-40, 40),
            duration: Phaser.Math.Between(2000, 3500),
            onComplete: () => konfetti.destroy()
          })
        }
      }
    })

    // ⏰ Nach der Geschichte: Familien-Bild und dann Kinder erstellen!
    const gesamtZeit = 4000 + anzahl * 2000 + 4000
    this.time.delayedCall(gesamtZeit, () => {
      elemente.forEach(el => { if (el && el.destroy) el.destroy() })

      const kinderNamen = neueKinder.map(k => k.name).join(', ')
      const abschluss = this.add.text(breite / 2, hoehe * 0.4,
        `👨‍👩‍👧‍👦 Eure Familie!\n\n💍 Milo & Du\n👶 ${kinderNamen}\n\n💕 Für immer zusammen! ✨`, {
          fontSize: '16px', fontFamily: 'Arial', color: '#FFD700',
          stroke: '#000000', strokeThickness: 4,
          align: 'center', backgroundColor: '#E91E6388',
          padding: { x: 20, y: 16 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(400)

      this.time.delayedCall(5000, () => {
        abschluss.destroy()
        overlay.destroy()
        this.miloRedet = false

        // 👶 Kinder auf der Wiese erstellen!
        this.erstelleKinder()

        this.zeigeNachricht('👶 Eure Kinder sind da! 💕')
      })
    })
  }

  // === 🌱 KINDER WACHSEN JEDEN MORGEN! ===
  kinderWachsenLassen() {
    if (!hausDaten.kinder || hausDaten.kinder.length === 0) return

    let hatGewachsen = false
    let neuesErwachsenes = null
    const nachrichten = []

    hausDaten.kinder.forEach((kind) => {
      if (kind.inStadt) return // Schon in der Stadt, wächst nicht mehr
      if ((kind.wachstum || 0) >= 5) return // Schon erwachsen!

      kind.wachstum = (kind.wachstum || 0) + 1
      hatGewachsen = true

      const wachstumsTexte = {
        1: `🌱 ${kind.name} ist gewachsen!`,
        2: `🌱 ${kind.name} hat jetzt Arme! 💪`,
        3: `🌿 ${kind.name} hat Schuhe! 👟`,
        4: `🌳 ${kind.name} bekommt Bäckchen! 🥺`,
        5: `⭐ ${kind.name} ist erwachsen! 🎉`
      }
      nachrichten.push(wachstumsTexte[kind.wachstum])

      if (kind.wachstum >= 5) {
        neuesErwachsenes = kind
      }
    })

    if (!hatGewachsen) return

    // 💾 Speichern!
    spielSpeichern('BlumenwiesenSpiel', this.figurDaten, {
      x: this.spieler.x, y: this.spieler.y
    })

    // 👶 Kinder neu zeichnen (größer!)
    this.time.delayedCall(2000, () => {
      this.erstelleKinder()

      // 💬 Wachstums-Nachricht anzeigen!
      if (nachrichten.length > 0) {
        const text = nachrichten.join('\n')
        const msg = this.add.text(
          this.scale.width / 2, this.scale.height * 0.25,
          text, {
            fontSize: '13px', fontFamily: 'Arial', color: '#FFD700',
            stroke: '#000000', strokeThickness: 3,
            align: 'center', backgroundColor: '#333333',
            padding: { x: 10, y: 8 }
          }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(250)
        this.tweens.add({
          targets: msg, alpha: 0, duration: 800, delay: 4000,
          onComplete: () => msg.destroy()
        })
      }

      // ⭐ Wenn ein Kind gerade erwachsen wurde: Event!
      if (neuesErwachsenes) {
        this.time.delayedCall(5000, () => {
          this.kindIstErwachsen(neuesErwachsenes)
        })
      }
    })
  }

  // === ⭐ EIN KIND IST ERWACHSEN GEWORDEN! ===
  kindIstErwachsen(kind) {
    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🎵 Feier-Sound!
    const melodie = [523, 659, 784, 1047]
    melodie.forEach((note, i) => {
      setTimeout(() => spieleTon(note, 0.15, 0.05, 'sine'), i * 200)
    })

    // 🎊 Konfetti!
    for (let i = 0; i < 15; i++) {
      const k = this.add.circle(
        Phaser.Math.Between(100, breite - 100),
        0, Phaser.Math.Between(3, 5),
        Phaser.Math.RND.pick([0xFF80AB, 0x80D8FF, 0xB9F6CA, 0xFFFF8D, 0xEA80FC])
      ).setScrollFactor(0).setDepth(300)
      this.tweens.add({
        targets: k,
        y: hoehe + 20, x: k.x + Phaser.Math.Between(-40, 40),
        duration: Phaser.Math.Between(2000, 3500),
        onComplete: () => k.destroy()
      })
    }

    // 🎲 Was passiert? 50% Chance in die Stadt, 50% bleibt und bekommt eigenes Baby
    const ziehtInStadt = Math.random() < 0.5

    if (ziehtInStadt) {
      // 🏙️ Kind zieht in die Stadt!
      kind.inStadt = true

      // 📣 Nachricht
      const msg = this.add.text(breite / 2, hoehe * 0.3,
        `🏙️ ${kind.name} ist erwachsen!\n\n"Ich möchte die Stadt sehen!\nIch ziehe nach Blumstadt!" 🚌\n\n👋 Tschüss ${kind.name}! Viel Spaß! 💕`, {
          fontSize: '15px', fontFamily: 'Arial', color: '#FFD700',
          stroke: '#000000', strokeThickness: 3,
          align: 'center', backgroundColor: '#1565C0cc',
          padding: { x: 14, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301)

      // 🏙️ Als Stadt-Freund hinzufügen!
      if (!hausDaten.stadtFreunde.includes(kind.name)) {
        hausDaten.stadtFreunde.push(kind.name)
      }

      this.time.delayedCall(6000, () => {
        msg.destroy()
        // 🧹 Kind aus Kinder-Liste entfernen und Sprites neu machen
        hausDaten.kinder = hausDaten.kinder.filter(k => k.name !== kind.name)
        this.erstelleKinder()
        spielSpeichern('BlumenwiesenSpiel', this.figurDaten, {
          x: this.spieler.x, y: this.spieler.y
        })
        this.zeigeNachricht(`👋 ${kind.name} wohnt jetzt in der Stadt! 🏙️`)
      })
    } else {
      // 👶 Kind bekommt eigenes Baby!
      const geschlecht = Math.random() < 0.5
      const babyNamen = geschlecht
        ? Phaser.Math.RND.pick(['Mika', 'Lio', 'Teo', 'Ari', 'Noel', 'Sam'])
        : Phaser.Math.RND.pick(['Mila', 'Nia', 'Ava', 'Emi', 'Liv', 'Romy'])

      const msg = this.add.text(breite / 2, hoehe * 0.3,
        `👶 ${kind.name} hat ein Baby bekommen!\n\nDas Baby heißt: ✨ ${babyNamen} ✨\n\n👨‍👩‍👧 Die Familie wächst! 💕`, {
          fontSize: '15px', fontFamily: 'Arial', color: '#FFD700',
          stroke: '#000000', strokeThickness: 3,
          align: 'center', backgroundColor: '#E91E63cc',
          padding: { x: 14, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301)

      // 👶 Neues Baby zur Liste hinzufügen!
      hausDaten.kinder.push({
        name: babyNamen,
        farbe: kind.farbe,
        istMaedchen: geschlecht,
        wachstum: 0
      })

      this.time.delayedCall(6000, () => {
        msg.destroy()
        this.erstelleKinder()
        spielSpeichern('BlumenwiesenSpiel', this.figurDaten, {
          x: this.spieler.x, y: this.spieler.y
        })
        this.zeigeNachricht(`👶 ${babyNamen} ist geboren! 💕`)
      })
    }
  }

  // === 👶 KINDER AUF DER WIESE ERSTELLEN ===
  erstelleKinder() {
    // 🧹 Alte Kinder-Sprites entfernen falls vorhanden
    if (this.kinderSprites) {
      this.kinderSprites.forEach(k => { if (k && k.destroy) k.destroy() })
    }
    this.kinderSprites = []
    this.kinderZiele = []

    if (!hausDaten.kinder || hausDaten.kinder.length === 0) return
    if (!this.freund) return

    // 👶 Für jedes Kind eine Figur malen! Größe hängt vom Wachstum ab!
    hausDaten.kinder.forEach((kind, i) => {
      const startX = this.freund.x + 20 + i * 30
      const startY = this.freund.y + 10

      const stufe = kind.wachstum || 0
      // 📌 Größe: 0=winzig, 1-4=wächst, 5=erwachsen
      const groesse = 0.5 + stufe * 0.1 // 0.5 bis 1.0

      const baby = this.add.container(startX, startY)

      // 🟡 Körper
      const koerperR = 6 + stufe * 2 // 6 bis 16
      const koerper = this.add.circle(0, 4 * groesse, koerperR, kind.farbe)
      baby.add(koerper)

      // 🟡 Kopf
      const kopfR = 5 + stufe * 1.5 // 5 bis 12.5
      const kopf = this.add.circle(0, -6 * groesse, kopfR, 0xFFE0B2)
      baby.add(kopf)

      // 👀 Augen
      const augenAbstand = 2 + stufe * 0.5
      const augeL = this.add.circle(-augenAbstand, -7 * groesse, 1.2 + stufe * 0.2, 0x333333)
      const augeR = this.add.circle(augenAbstand, -7 * groesse, 1.2 + stufe * 0.2, 0x333333)
      baby.add([augeL, augeR])

      // 😊 Mund
      const mund = this.add.graphics()
      mund.lineStyle(1 + stufe * 0.2, 0x333333)
      mund.beginPath()
      mund.arc(0, -4 * groesse, 2 + stufe * 0.5, 0.2, Math.PI - 0.2, false)
      mund.strokePath()
      baby.add(mund)

      // 💪 Arme (ab Stufe 2!)
      if (stufe >= 2) {
        const armL = this.add.rectangle(-koerperR - 2, 2 * groesse, 3, 8 * groesse, kind.farbe)
        const armR = this.add.rectangle(koerperR + 2, 2 * groesse, 3, 8 * groesse, kind.farbe)
        baby.add([armL, armR])
      }

      // 👟 Beine (ab Stufe 3!)
      if (stufe >= 3) {
        const beinL = this.add.rectangle(-3 * groesse, 4 * groesse + koerperR, 3, 6 * groesse, 0x5D4037)
        const beinR = this.add.rectangle(3 * groesse, 4 * groesse + koerperR, 3, 6 * groesse, 0x5D4037)
        baby.add([beinL, beinR])
      }

      // 🥺 Bäckchen (ab Stufe 4!)
      if (stufe >= 4) {
        const baeckL = this.add.circle(-kopfR + 2, -5 * groesse, 2.5 * groesse, 0xFFCDD2).setAlpha(0.5)
        const baeckR = this.add.circle(kopfR - 2, -5 * groesse, 2.5 * groesse, 0xFFCDD2).setAlpha(0.5)
        baby.add([baeckL, baeckR])
      }

      // 🎀 Mädchen bekommen eine Schleife!
      if (kind.istMaedchen) {
        const schleifeSize = stufe >= 3 ? '12px' : '8px'
        const schleife = this.add.text(0, -6 * groesse - kopfR - 2, '🎀', { fontSize: schleifeSize }).setOrigin(0.5)
        baby.add(schleife)
      }

      // 🏷️ Name + Wachstums-Anzeige
      const nameSize = stufe >= 5 ? '10px' : '8px'
      const erwachsenText = stufe >= 5 ? ' ⭐' : ''
      const inStadt = kind.inStadt ? ' 🏙️' : ''
      const name = this.add.text(0, -6 * groesse - kopfR - (kind.istMaedchen ? 14 : 6), kind.name + erwachsenText + inStadt, {
        fontSize: nameSize, fontFamily: 'Arial', color: '#ffffff',
        stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5)
      baby.add(name)

      baby.setDepth(46)
      baby.setSize(30 + stufe * 5, 30 + stufe * 5)

      this.kinderSprites.push(baby)
      this.kinderZiele.push({ x: null, y: null })

      // 🚶 Erstes Ziel setzen
      this.time.delayedCall(1000 + i * 500, () => {
        this.setzeKindNeuesZiel(i)
      })
    })
  }

  // === 🚶 KIND BEKOMMT EIN NEUES ZIEL ===
  setzeKindNeuesZiel(index) {
    if (!this.freund || !this.kinderSprites[index]) return

    const kind = hausDaten.kinder[index]
    const stufe = kind ? (kind.wachstum || 0) : 0

    // 👶 Babys bleiben nah bei Milo, Erwachsene laufen weiter!
    const reichweite = 40 + stufe * 15 // 40 bis 115px
    this.kinderZiele[index] = {
      x: this.freund.x + Phaser.Math.Between(-reichweite, reichweite),
      y: this.freund.y + Phaser.Math.Between(-20, 30)
    }
  }

  // === ✉️ BRIEF AN MILO SCHREIBEN ===
  briefAnMilo() {
    if (!this.freund || !this.freund.active) return
    if (this.miloRedet) return
    if (this.miloSchlaeft) return // 💤 Milo schläft!
    this.miloRedet = true

    // 🎵 Brief-Sound (Papier rascheln!)
    spieleTon(200, 0.1, 0.08, 'sine')
    setTimeout(() => spieleTon(250, 0.1, 0.08, 'sine'), 100)

    const breite = this.scale.width
    const hoehe = this.scale.height

    // 📨 Schöner Brief-Hintergrund!
    const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.6)
    overlay.setScrollFactor(0).setDepth(400).setInteractive()

    // 📜 Brief-Papier
    const papier = this.add.rectangle(breite / 2, hoehe / 2, breite * 0.8, hoehe * 0.7, 0xFFF8E1)
    papier.setStrokeStyle(3, 0xD7CCC8).setScrollFactor(0).setDepth(401)

    // ✉️ Titel
    const titel = this.add.text(breite / 2, hoehe * 0.2, '✉️ Brief an Milo', {
      fontSize: '22px', fontFamily: 'Arial', color: '#5D4037',
      stroke: '#D7CCC8', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(402)

    // 📝 "Lieber Milo," Anrede
    const anrede = this.add.text(breite * 0.18, hoehe * 0.3, '📝 Lieber Milo,', {
      fontSize: '16px', fontFamily: 'Arial', color: '#5D4037'
    }).setScrollFactor(0).setDepth(402)

    const elemente = [overlay, papier, titel, anrede]

    // ✏️ HTML-Eingabefeld für den Brief!
    const gameDiv = document.getElementById('game') || document.body
    const eingabeContainer = document.createElement('div')
    eingabeContainer.style.cssText = 'position:absolute;top:38%;left:50%;transform:translateX(-50%);z-index:999;display:flex;flex-direction:column;align-items:center;gap:10px;'

    const eingabeFeld = document.createElement('textarea')
    eingabeFeld.placeholder = 'Schreib hier deinen Brief...\n\nDu kannst Milo alles erzählen! 💕'
    eingabeFeld.maxLength = 200
    eingabeFeld.style.cssText = 'font-size:16px;padding:12px 16px;border-radius:12px;border:3px solid #8D6E63;background:#FFF8E1;color:#3E2723;width:260px;height:100px;outline:none;font-family:Arial;resize:none;'

    // 🎁 Geschenk-Auswahl!
    let gewaehlteGeschenke = []
    const geschenkRow = document.createElement('div')
    geschenkRow.style.cssText = 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:center;'

    const geschenkLabel = document.createElement('span')
    geschenkLabel.textContent = '🎁 Geschenk dazulegen:'
    geschenkLabel.style.cssText = 'font-size:13px;color:#8D6E63;font-family:Arial;'
    geschenkRow.appendChild(geschenkLabel)

    const geschenkOptionen = [
      { emoji: '🍕', name: 'Pizza', feld: 'pizza' },
      { emoji: '🪵', name: 'Holz', feld: 'holz' },
      { emoji: '🪨', name: 'Stein', feld: 'stein' },
      { emoji: '⚙️', name: 'Eisen', feld: 'eisen' },
    ]

    const geschenkStatus = document.createElement('div')
    geschenkStatus.style.cssText = 'font-size:12px;color:#4CAF50;font-family:Arial;min-height:18px;text-align:center;'

    geschenkOptionen.forEach(g => {
      const gBtn = document.createElement('button')
      gBtn.textContent = `${g.emoji} ${g.name}`
      gBtn.style.cssText = 'font-size:13px;padding:5px 10px;border-radius:12px;border:2px solid #8D6E63;background:#FFF8E1;cursor:pointer;font-family:Arial;'
      gBtn.addEventListener('click', () => {
        if (rucksack[g.feld] > 0) {
          rucksack[g.feld] -= 1
          gewaehlteGeschenke.push(g)
          gBtn.style.borderColor = '#4CAF50'
          gBtn.style.background = '#E8F5E9'
          geschenkStatus.textContent = `🎁 Geschenke: ${gewaehlteGeschenke.map(x => x.emoji).join(' ')}`
          spieleTon(500, 0.08, 0.03, 'sine')
        } else {
          gBtn.style.borderColor = '#FF5252'
          geschenkStatus.textContent = `❌ Kein ${g.name} im Rucksack!`
          spieleTon(200, 0.1, 0.05, 'sawtooth')
        }
      })
      geschenkRow.appendChild(gBtn)
    })

    const buttonRow = document.createElement('div')
    buttonRow.style.cssText = 'display:flex;gap:12px;'

    const sendenBtn = document.createElement('button')
    sendenBtn.textContent = '📨 Brief abschicken!'
    sendenBtn.style.cssText = 'font-size:16px;padding:10px 20px;border-radius:16px;border:2px solid #4CAF50;background:#4CAF50;color:white;cursor:pointer;font-family:Arial;'

    const abbrechenBtn = document.createElement('button')
    abbrechenBtn.textContent = '❌ Doch nicht'
    abbrechenBtn.style.cssText = 'font-size:14px;padding:8px 16px;border-radius:16px;border:2px solid #FF5252;background:transparent;color:#FF5252;cursor:pointer;font-family:Arial;'

    buttonRow.appendChild(sendenBtn)
    buttonRow.appendChild(abbrechenBtn)
    eingabeContainer.appendChild(eingabeFeld)
    eingabeContainer.appendChild(geschenkRow)
    eingabeContainer.appendChild(geschenkStatus)
    eingabeContainer.appendChild(buttonRow)
    gameDiv.appendChild(eingabeContainer)

    // ❌ Abbrechen (Geschenke zurückgeben!)
    abbrechenBtn.addEventListener('click', () => {
      // 🎁 Geschenke zurück in den Rucksack!
      gewaehlteGeschenke.forEach(g => { rucksack[g.feld] += 1 })
      eingabeContainer.remove()
      elemente.forEach(el => el.destroy())
      this.miloRedet = false
    })

    // 📨 Brief abschicken!
    sendenBtn.addEventListener('click', () => {
      const briefText = eingabeFeld.value.trim()
      if (!briefText && gewaehlteGeschenke.length === 0) return
      eingabeContainer.remove()
      elemente.forEach(el => el.destroy())

      // 🎵 Brief-fliegt-weg Sound!
      const flugToene = [400, 500, 600, 700, 800]
      flugToene.forEach((note, i) => {
        setTimeout(() => spieleTon(note, 0.08, 0.03, 'sine'), i * 80)
      })

      // ✉️ Brief-Animation: Brief fliegt zu Milo!
      const fliegenderBrief = this.add.text(
        this.spieler.x, this.spieler.y - 30, '✉️', { fontSize: '28px' }
      ).setDepth(300)

      this.tweens.add({
        targets: fliegenderBrief,
        x: this.freund.x,
        y: this.freund.y - 20,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: 1200,
        ease: 'Cubic.easeInOut',
        onComplete: () => {
          fliegenderBrief.destroy()

          // 🥰 Milo liest den Brief!
          this.cameras.main.stopFollow()
          this.cameras.main.pan(this.freund.x, this.freund.y, 500)

          // 📜 Milo hält den Brief
          const miloLiest = this.add.text(
            this.freund.x + 15, this.freund.y - 15, '📜', { fontSize: '14px' }
          ).setDepth(200)

          // 💭 Milo liest...
          const leseText = this.add.text(
            this.freund.x, this.freund.y - 55, '💬 Milo liest deinen Brief...', {
            fontSize: '11px', fontFamily: 'Arial', color: '#FFD700',
            stroke: '#000000', strokeThickness: 3
          }).setOrigin(0.5).setDepth(200)

          this.time.delayedCall(2000, () => {
            miloLiest.destroy()
            leseText.destroy()

            // 🎁 Hat der Brief Geschenke?
            let antwort = ''
            if (gewaehlteGeschenke.length > 0) {
              const geschenkEmojis = gewaehlteGeschenke.map(g => g.emoji).join(' ')

              // 🎁 Geschenke-Animation! Emojis fliegen raus!
              gewaehlteGeschenke.forEach((g, i) => {
                const gEmoji = this.add.text(
                  this.freund.x, this.freund.y - 30, g.emoji,
                  { fontSize: '24px' }
                ).setDepth(305)
                this.tweens.add({
                  targets: gEmoji,
                  y: gEmoji.y - 50,
                  x: gEmoji.x + Phaser.Math.Between(-40, 40),
                  scale: 1.5,
                  alpha: 0,
                  duration: 1200,
                  delay: i * 300,
                  onComplete: () => gEmoji.destroy()
                })
              })

              // 🎁 Geschenk-Reaktion!
              const hatPizza = gewaehlteGeschenke.some(g => g.feld === 'pizza')
              if (hatPizza) {
                antwort = 'OMG!! PIZZA!! 🍕🍕🍕\nDas BESTE Geschenk EVER!\n*Milo isst glücklich* 😋❤️'
              } else if (gewaehlteGeschenke.length >= 3) {
                antwort = 'WOW! So viele Geschenke!!\n' + geschenkEmojis + '\nDu bist die ALLERBESTE! 🥹🎉'
              } else {
                antwort = 'Ein Geschenk für MICH?!\n' + geschenkEmojis + '\nDanke danke danke!! 🥰🎁'
              }
            } else {
              // 🥰 Normale Brief-Antwort
              antwort = this.miloBriefAntwort(briefText || 'brief')
            }

            const antwortBg = this.add.rectangle(
              this.freund.x, this.freund.y - 65, 240, 80, 0x000000, 0.85
            ).setStrokeStyle(2, 0xFF7043).setDepth(300)

            const antwortTitel = this.add.text(
              this.freund.x, this.freund.y - 90, '🥰 Milo sagt:', {
              fontSize: '11px', fontFamily: 'Arial', color: '#FF7043',
              stroke: '#000000', strokeThickness: 2
            }).setOrigin(0.5).setDepth(301)

            const antwortText = this.add.text(
              this.freund.x, this.freund.y - 60, antwort, {
              fontSize: '12px', fontFamily: 'Arial', color: '#ffffff',
              stroke: '#000000', strokeThickness: 2,
              align: 'center', wordWrap: { width: 220 }
            }).setOrigin(0.5).setDepth(301)

            // ❤️ Herzen fliegen!
            for (let i = 0; i < 6; i++) {
              const herz = this.add.text(
                this.freund.x + Phaser.Math.Between(-40, 40),
                this.freund.y - 30,
                Phaser.Math.RND.pick(['❤️', '💕', '💌', '✨', '✉️']),
                { fontSize: '16px' }
              ).setDepth(302)
              this.tweens.add({
                targets: herz,
                y: herz.y - 70,
                alpha: 0,
                duration: 1500,
                delay: i * 200,
                onComplete: () => herz.destroy()
              })
            }

            // 🎵 Fröhliche Melodie!
            const melodie = [523, 659, 784, 880, 1047]
            melodie.forEach((note, i) => {
              setTimeout(() => spieleTon(note, 0.12, 0.04, 'sine'), i * 120)
            })

            // Nach 5 Sek alles aufräumen
            this.time.delayedCall(5000, () => {
              this.tweens.add({
                targets: [antwortBg, antwortTitel, antwortText],
                alpha: 0,
                duration: 600,
                onComplete: () => {
                  antwortBg.destroy()
                  antwortTitel.destroy()
                  antwortText.destroy()
                  this.miloRedet = false
                  this.cameras.main.startFollow(this.spieler, true, 0.1, 0.1)
                }
              })
            })
          })
        }
      })
    })
  }

  // 💬 Milo antwortet auf einen Brief!
  miloBriefAntwort(brief) {
    const text = brief.toLowerCase()

    if (text.match(/lieb|mag|freund|best|gern|herz|knuddel/)) {
      return Phaser.Math.RND.pick([
        'Dieser Brief ist das Schönste\nwas ich je bekommen habe! 🥹❤️',
        'Ich werde diesen Brief\nfür immer aufheben! 📜❤️',
        'Aww! Ich hab dich auch\nsooo lieb! Du bist die Beste! 💕',
      ])
    }
    if (text.match(/traurig|wein|schlecht|doof|blöd|angst/)) {
      return Phaser.Math.RND.pick([
        'Oh nein! Komm her,\nich drück dich ganz fest! 🤗❤️',
        'Nicht traurig sein!\nIch bin doch für dich da! 💕',
        'Zusammen schaffen wir alles!\nDu bist nicht allein! 🌟',
      ])
    }
    if (text.match(/spaß|spiel|freude|toll|super|cool/)) {
      return Phaser.Math.RND.pick([
        'JA! Mir macht es auch\nso viel Spaß mit dir! 🎉',
        'Du bist die tollste\nSpiel-Partnerin EVER! 🌟',
        'Lass uns noch ganz viel\nzusammen erleben! 😄',
      ])
    }
    if (text.match(/danke|dankbar|nett|hilf/)) {
      return Phaser.Math.RND.pick([
        'Du brauchst mir nicht danken!\nDafür sind Freunde da! 🥰',
        'ICH muss DIR danken!\nDu hast mir ein Haus gebaut! 🏠❤️',
        'Das macht mich so glücklich!\nDanke für den Brief! 💬✨',
      ])
    }
    if (text.match(/geheim|psst|flüster|verrat/)) {
      return Phaser.Math.RND.pick([
        'Psst! Ich verrate niemandem\nwas du geschrieben hast! 🤫',
        'Ein Brief-Geheimnis!\nDas bleibt unter uns! 🔐',
        'Ich liebe Geheimnisse!\nDein Geheimnis ist sicher! 🤫❤️',
      ])
    }
    if (text.match(/pizza|essen|hunger|lecker/)) {
      return Phaser.Math.RND.pick([
        'Ein Pizza-Brief! Lecker!\nIch könnte gerade eine\nPizza vertragen! 🍕😋',
        'Mmh, jetzt hab ich Hunger!\nHol mir eine Pizza? 🍕🥺',
      ])
    }
    if (text.match(/bello|hund|welp|wuff/)) {
      return Phaser.Math.RND.pick([
        'Ich lese Bello deinen\nBrief vor! Er wedelt\nmit dem Schwanz! 🐕❤️',
        'Bello will auch einen\nBrief schreiben! Aber er\nkann nur WUFF! 🐶😂',
      ])
    }

    return Phaser.Math.RND.pick([
      'Was für ein toller Brief!\nDanke! Ich freue mich\nsooo sehr! 🥰📜',
      'Ich LIEBE Post bekommen!\nSchreib mir bald wieder! ✉️❤️',
      'Das ist der schönste Brief\nden ich je bekommen habe!\nDu bist toll! 🌟💬',
      'Ich lese deinen Brief\nimmer wieder! Er macht\nmich so glücklich! 😊✨',
      '*Milo drückt den Brief\nfest an sein Herz* 📜❤️',
    ])
  }

  // === 💬 MIT MILO REDEN! ===
  redeMitMilo() {
    if (!this.freund || !this.freund.active) return
    if (this.miloRedet) return // Redet schon!
    if (this.miloSchlaeft) return // 💤 Milo schläft gerade!
    this.miloRedet = true

    // 🎵 Rede-Sound
    soundKlick()

    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🖤 Dunkler Hintergrund
    const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.6)
    overlay.setScrollFactor(0).setDepth(400).setInteractive()

    // 💬 Titel
    const titel = this.add.text(breite / 2, hoehe * 0.2, '💬 Was möchtest du Milo sagen?', {
      fontSize: '18px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(401)

    // 🎯 Antwort-Buttons – verschiedene Dinge die man sagen kann!
    const optionen = [
      { text: '👋 Hallo Milo!', wert: 'hallo' },
      { text: '❓ Wie geht es dir?', wert: 'wie geht es dir' },
      { text: '🐕 Erzähl mir von Bello!', wert: 'bello hund' },
      { text: '🏠 Ich mag unser Dorf!', wert: 'haus wohnen' },
      { text: '⛏️ Was ist in der Mine?', wert: 'mine graben eisen' },
      { text: '🌸 Die Blumen sind schön!', wert: 'blume natur wiese' },
      { text: '😂 Erzähl einen Witz!', wert: 'witz lustig lachen' },
      { text: '❤️ Du bist mein Freund!', wert: 'lieb freund beste' },
      { text: '🔮 Hast du ein Geheimnis?', wert: 'geheimnis magie zauber' },
      { text: '🦔 Kennst du Blitz?', wert: 'blitz igel schnell rennen pizza' },
      { text: '🌙 Gute Nacht, Milo!', wert: 'gute nacht schlafen' },
      { text: '🎵 Lass uns singen!', wert: 'musik singen lied' },
    ]

    // 🍕 Wenn Pizza im Rucksack: Pizza-Option ganz oben!
    if (rucksack.pizza > 0) {
      optionen.unshift({ text: '🍕 Hier, Pizza für dich!', wert: 'pizza geben' })
    }

    // 👶 Wenn verheiratet: Kinder-Option!
    if (hausDaten.verheiratet) {
      if (hausDaten.kinder.length === 0) {
        optionen.push({ text: '👶 Wollen wir Kinder haben?', wert: '__kinder__' })
      } else {
        optionen.push({ text: '👶 Neue Babys machen!', wert: '__kinder__' })
      }
    }

    const elemente = [overlay, titel]

    // 📝 Auch ein eigenes Eingabefeld!
    // Eigenes Textfeld erstellen mit HTML
    const gameDiv = document.getElementById('game') || document.body
    const eingabeContainer = document.createElement('div')
    eingabeContainer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:15%;pointer-events:none;z-index:999;'

    const eingabeRow = document.createElement('div')
    eingabeRow.style.cssText = 'display:flex;gap:8px;pointer-events:all;'

    const eingabeFeld = document.createElement('input')
    eingabeFeld.type = 'text'
    eingabeFeld.placeholder = '✏️ Oder schreib selbst...'
    eingabeFeld.maxLength = 60
    eingabeFeld.style.cssText = 'font-size:18px;padding:10px 16px;border-radius:20px;border:3px solid #FFD700;background:#222;color:#fff;width:220px;outline:none;font-family:Arial;'

    const sendenBtn = document.createElement('button')
    sendenBtn.textContent = '📨'
    sendenBtn.style.cssText = 'font-size:24px;padding:8px 16px;border-radius:20px;border:3px solid #FFD700;background:#4CAF50;cursor:pointer;'

    eingabeRow.appendChild(eingabeFeld)
    eingabeRow.appendChild(sendenBtn)
    eingabeContainer.appendChild(eingabeRow)
    gameDiv.appendChild(eingabeContainer)

    // 📨 Eigene Nachricht senden
    const sendeEigeneNachricht = () => {
      const text = eingabeFeld.value.trim()
      if (!text) return
      eingabeContainer.remove()
      elemente.forEach(el => el.destroy())
      this.zeigeMiloGespraech(text)
    }

    sendenBtn.addEventListener('click', sendeEigeneNachricht)
    eingabeFeld.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendeEigeneNachricht()
    })

    // 🎯 Buttons in 2 Spalten anzeigen!
    optionen.forEach((opt, i) => {
      const spalte = i % 2
      const zeile = Math.floor(i / 2)
      const x = breite * 0.3 + spalte * (breite * 0.4)
      const y = hoehe * 0.32 + zeile * 38

      const btn = this.add.text(x, y, opt.text, {
        fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
        backgroundColor: '#5D4037', padding: { x: 10, y: 6 }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(401)
      btn.setInteractive({ useHandCursor: true })

      // ✨ Hover-Effekt
      btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#8D6E63' }))
      btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#5D4037' }))

      btn.on('pointerdown', () => {
        eingabeContainer.remove()
        elemente.forEach(el => el.destroy())
        // 👶 Kinder-Option geht zu kinderFrage!
        if (opt.wert === '__kinder__') {
          this.kinderFrage()
        } else {
          this.zeigeMiloGespraech(opt.wert)
        }
      })
      elemente.push(btn)
    })

    // ❌ Abbrechen
    const abbrechen = this.add.text(breite / 2, hoehe * 0.32 + 6 * 38 + 5, '❌ Egal, vielleicht später!', {
      fontSize: '14px', fontFamily: 'Arial', color: '#FF5252',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(401)
    abbrechen.setInteractive({ useHandCursor: true })
    abbrechen.on('pointerdown', () => {
      eingabeContainer.remove()
      elemente.forEach(el => el.destroy())
      this.miloRedet = false
    })
    elemente.push(abbrechen)
  }

  // 💬 Milo-Gespräch anzeigen (nachdem der Spieler etwas gesagt hat)
  zeigeMiloGespraech(eingabe) {
    // 🧠 Milo überlegt was er antworten soll!
    const antwort = this.miloAntwort(eingabe)

    // 💬 Erst zeigen was der Spieler gesagt hat
    const blasenX = this.freund.x
    const blasenY = this.freund.y - 60

    // Kamera zu Milo schwenken
    this.cameras.main.stopFollow()
    this.cameras.main.pan(this.freund.x, this.freund.y, 600)

    this.time.delayedCall(400, () => {
      // 💬 Spieler-Nachricht kurz zeigen
      const spielerBg = this.add.rectangle(blasenX, blasenY + 40, 220, 40, 0x000000, 0.7)
      spielerBg.setStrokeStyle(2, 0x4FC3F7)
      spielerBg.setDepth(300)

      const spielerText = this.add.text(blasenX, blasenY + 40, '🗣️ ' + eingabe, {
        fontSize: '12px', fontFamily: 'Arial', color: '#4FC3F7',
        stroke: '#000000', strokeThickness: 2,
        align: 'center', wordWrap: { width: 200 }
      }).setOrigin(0.5).setDepth(301)

      // 🎵 Rede-Töne (wie Sprechen!)
      const toene = [350, 400, 380, 420, 360]
      toene.forEach((note, i) => {
        setTimeout(() => spieleTon(note, 0.08, 0.04, 'sine'), i * 80)
      })

      // Nach 1.5 Sek: Milo antwortet!
      this.time.delayedCall(1500, () => {
        spielerBg.destroy()
        spielerText.destroy()

        // 💬 Milos Antwort-Sprechblase
        // 📏 Textgröße messen damit die Blase passt!
        const tempText = this.add.text(0, 0, antwort, {
          fontSize: '13px', fontFamily: 'Arial',
          wordWrap: { width: 210 }
        }).setVisible(false)
        const textHoehe = tempText.height
        tempText.destroy()

        // 📦 Blasen-Höhe passt sich an den Text an!
        const blasenHoehe = Math.max(75, textHoehe + 50)
        const blasenMitteY = blasenY

        const bg = this.add.rectangle(blasenX, blasenMitteY, 230, blasenHoehe, 0x000000, 0.85)
        bg.setStrokeStyle(2, 0xFF7043)
        bg.setDepth(300)

        const name = this.add.text(blasenX, blasenMitteY - blasenHoehe / 2 + 12, '🧑 Milo sagt:', {
          fontSize: '11px', fontFamily: 'Arial', color: '#FF7043',
          stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(301)

        const text = this.add.text(blasenX, blasenMitteY + 2, antwort, {
          fontSize: '13px', fontFamily: 'Arial', color: '#ffffff',
          stroke: '#000000', strokeThickness: 2,
          align: 'center', wordWrap: { width: 210 }
        }).setOrigin(0.5).setDepth(301)

        // Kleine Spitze nach unten
        const spitze = this.add.triangle(blasenX, blasenMitteY + blasenHoehe / 2 + 5, 0, 0, 12, 0, 6, 10, 0x000000, 0.85)
        spitze.setDepth(300)

        // ✅ OK-Button zum Schließen!
        const okBtn = this.add.text(blasenX, blasenMitteY + blasenHoehe / 2 - 14, '👆 OK', {
          fontSize: '12px', fontFamily: 'Arial', color: '#FFD700',
          stroke: '#000000', strokeThickness: 2,
          backgroundColor: '#5D403788', padding: { x: 8, y: 3 }
        }).setOrigin(0.5).setDepth(302)
        okBtn.setInteractive({ useHandCursor: true })

        // ✨ Button blinkt sanft damit man ihn sieht
        this.tweens.add({
          targets: okBtn,
          alpha: 0.6,
          duration: 800,
          yoyo: true,
          repeat: -1
        })

        // 🎵 Milos Stimme!
        const stimme = [300, 350, 330, 370, 310]
        stimme.forEach((note, i) => {
          setTimeout(() => spieleTon(note, 0.08, 0.04, 'triangle'), i * 80)
        })

        // 👆 OK gedrückt = Sprechblase weg!
        okBtn.on('pointerdown', () => {
          // 💕 Ein Herz dazu! (Nur wenn noch nicht verheiratet)
          if (!hausDaten.verheiratet) {
            hausDaten.miloHerzen = (hausDaten.miloHerzen || 0) + 1

            // 💕 Herz-Animation fliegt hoch!
            const herzEmoji = this.add.text(
              this.freund.x, this.freund.y - 40,
              '💕', { fontSize: '28px' }
            ).setDepth(400)
            this.tweens.add({
              targets: herzEmoji,
              y: herzEmoji.y - 60,
              alpha: 0,
              scale: 1.5,
              duration: 1200,
              onComplete: () => herzEmoji.destroy()
            })

            // 💕 Herzen-Stand anzeigen!
            const herzenText = hausDaten.miloHerzen >= 5
              ? '💕💕💕💕💕 VOLL!'
              : '💕'.repeat(hausDaten.miloHerzen) + '🤍'.repeat(5 - hausDaten.miloHerzen)
            const herzStand = this.add.text(
              this.freund.x, this.freund.y - 70,
              herzenText, {
                fontSize: '16px',
                stroke: '#000000', strokeThickness: 3
              }
            ).setOrigin(0.5).setDepth(400)
            this.tweens.add({
              targets: herzStand,
              alpha: 0,
              duration: 800,
              delay: 2000,
              onComplete: () => herzStand.destroy()
            })

            // 🎵 Herz-Sound!
            spieleTon(880, 0.15, 0.06, 'sine')
            setTimeout(() => spieleTon(1100, 0.15, 0.06, 'sine'), 150)

            // 💾 Speichern!
            spielSpeichern('BlumenwiesenSpiel', this.figurDaten, {
              x: this.spieler.x, y: this.spieler.y
            })
          }

          this.tweens.add({
            targets: [bg, name, text, spitze, okBtn],
            alpha: 0,
            duration: 400,
            onComplete: () => {
              bg.destroy()
              name.destroy()
              text.destroy()
              spitze.destroy()
              okBtn.destroy()
              this.miloRedet = false
              this.cameras.main.startFollow(this.spieler, true, 0.1, 0.1)

              // 🌙 Gute Nacht? Milo geht ins Haus!
              if (eingabe.match(/nacht|schlaf|müde|gute nacht/i) && this.freundHausPosition) {
                this.miloGehtSchlafen()
              }

              // 💒 Bei 5 Herzen: Milo macht einen Antrag!
              if (hausDaten.miloHerzen >= 5 && !hausDaten.verheiratet && hausDaten.miloWachstum >= 5) {
                this.time.delayedCall(2000, () => {
                  this.miloMachtAntrag()
                })
              }
            }
          })
        })
      })
    })
  }

  // 🧠 Milo überlegt sich eine Antwort! Er schaut was du gesagt hast
  miloAntwort(nachricht) {
    // Alles klein schreiben damit wir besser suchen können
    const text = nachricht.toLowerCase()

    // 👋 Begrüßung
    if (text.match(/hallo|hi |hey |hej|guten tag|guten morgen|guten abend|moin|servus|huhu|na du|tach|grüß|hallö|yo /)) {
      return Phaser.Math.RND.pick([
        '👋 Hey! Schön dich zu sehen!',
        '😊 Hallo! Wie geht es dir?',
        '🤗 Hey! Was machen wir heute?',
        '👋 Huhu! Da bist du ja! 😄',
      ])
    }

    // ❓ Wie geht es dir?
    if (text.match(/wie geht|geht es dir|geht dir|wie bist du|alles gut|alles klar|geht.s|was machst du|was tust du/)) {
      return Phaser.Math.RND.pick([
        '😊 Mir geht es super! Danke!',
        '🥰 Toll! Ich bin so froh\ndass du hier bist!',
        '😄 Mega gut! Und dir?',
        '😊 Mir geht es prima!\nWas machen wir heute? 🎮',
      ])
    }

    // 🧑 Name / Wer bist du
    if (text.match(/name|heißt|wer bist|wer du|wer ich|stell dich vor|kennst du mich/)) {
      return Phaser.Math.RND.pick([
        '😊 Ich bin Milo! Dein Freund!',
        '🧑 Mein Name ist Milo!\nUnd du bist die Beste! ⭐',
        '😎 Ich heiße Milo!\nSchön dich kennenzulernen!',
      ])
    }

    // 🐕 Hund / Bello / Tiere
    if (text.match(/hund|bello|hündchen|wuff|wau|tier|katze|pferd|vogel|schmetterling|fisch/)) {
      return Phaser.Math.RND.pick([
        '🐕 Bello ist so ein lieber Hund!\nIch mag ihn sehr! 🥰',
        '🐶 Wuff wuff! Haha,\nich kann auch bellen! 😄',
        '🐾 Ich liebe Tiere!\nBesonders Bello! 🐕❤️',
      ])
    }

    // 🏠 Haus / Wohnung / Möbel
    if (text.match(/haus|wohn|zimmer|möbel|bett|tür|fenster|dach|wand|küche|stube/)) {
      return Phaser.Math.RND.pick([
        '🏠 Ich liebe mein Haus!\nDanke dass du es gebaut hast! 🥰',
        '🛋️ Hast du schon Möbel\nin dein Haus gestellt?',
        '🏡 Unser Dorf wird immer\nschöner! Toll! ✨',
      ])
    }

    // ⛏️ Mine / Graben / Schätze
    if (text.match(/mine|grab|berg|eisen|gold|edel|diamant|schatz|höhle|tunnel/)) {
      return Phaser.Math.RND.pick([
        '⛏️ In der Mine gibt es tolle\nSchätze! Sei aber vorsichtig!',
        '💎 Hast du schon einen\nEdelstein gefunden? Die sind selten!',
        '🪨 Ich mag die Mine!\nDa glitzert es so schön! ✨',
      ])
    }

    // 🌸 Blumen / Natur / Draußen
    if (text.match(/blume|blüte|natur|wiese|baum|gras|pflanz|garten|draußen|wald/)) {
      return Phaser.Math.RND.pick([
        '🌸 Die Blumen hier sind\nso wunderschön! 🌺',
        '🌻 Ich pflücke gerne Blumen!\nWelche magst du am liebsten?',
        '🌳 Die Bäume geben uns Holz\nund Schatten! Toll, oder? 🌿',
      ])
    }

    // 🎮 Spielen / Spaß / Langeweile
    if (text.match(/spiel|spaß|langweil|mach.*was|tun.*was|was sol|keine idee|los geht|abenteuer|action/)) {
      return Phaser.Math.RND.pick([
        '🎮 Lass uns was bauen!\nOder in die Mine gehen! ⛏️',
        '😄 Mir macht alles Spaß\nwenn du dabei bist!',
        '🌟 Wir könnten Blumen sammeln\noder mit Bello spielen! 🐕',
        '🎯 Lass uns in die Mine!\nDa gibt es Schätze! 💎',
      ])
    }

    // 🦔⚡ Blitz der Igel! (Roter Igel der Pizza sammelt!)
    if (text.match(/blitz|igel|schnell|rennen|pizza sammeln|roter igel|turbo|flitz|düsen|rasen|superschnell/)) {
      return Phaser.Math.RND.pick([
        '🦔 BLITZ!! Ich LIEBE Blitz!\nDer schnellste Igel der Welt!\nUnd er ist ROT! ❤️💨',
        '❤️ Blitz der Igel ist SO cool!\nEr rennt schneller als\nder Wind! WUUUSCH! 💨🦔',
        '🍕 Weißt du was das Beste\nan Blitz ist? Er sammelt\nPIZZA! Überall Pizza!\nDer hat Geschmack! 🍕😋',
        '🦔 Ich wäre sooo gerne\nso schnell wie Blitz!\nDann würde ich überall\nhinflitzen! 💨😄',
        '🍕 Blitz hat mal 100 Pizzen\nin einer Minute gesammelt!\nDas ist REKORD! 🏆🦔',
        '🐿️ Blitz hat einen besten\nFreund: Funke das Eichhörnchen!\nDer kann super hoch springen!\nSo wie du mein bester\nFreund bist! 💕🐿️',
        '💪 Donner der Bär ist auch\nim Team! Er ist mega stark\nund beschützt die Pizza-Fabrik! 🐻🍕',
        '🤖 Dr. Kralle ist so lustig!\nEr will immer die ganze Pizza\nstehlen – aber Blitz ist\nschneller! 😂💨',
        '🍕 Blitz isst am liebsten\nPizza mit Extra-Käse!\nGenau wie ich! Lecker! 😋🧀',
        '🎵 Wenn Blitz rennt, macht\nes WUSCH WUSCH WUSCH!\nDas klingt wie Musik! 🎶💨',
        '🌟 Wenn Blitz alle 7\nSternen-Pizzen findet, wird er\nSUPER-BLITZ! Dann leuchtet\ner golden! ✨⭐',
        '🦔 Blitz hat feuerrotes Fell!\nWeil er so schnell rennt,\ndass die Luft glüht! 🔥💨',
        '🐿️ Funke sagt immer:\n"Blitz, warte auf mich!"\nAber Blitz ist schon\nlängst weg! Hahaha! 😂💨',
        '🌀 Stell dir vor, wir hätten\nBlitz-Schuhe! Dann könnten wir\nSUPER schnell über die Wiese\nrennen und Pizza einsammeln! 💨🍕',
        '🦔 Mein Lieblings-Level ist\ndie Pizza-Vulkan-Insel!\nDa fliegen Pizzen aus\ndem Vulkan! 🌋🍕😄',
      ])
    }

    // 😂 Witzig / Lustig / Witz
    if (text.match(/witz|lustig|lach|haha|hihi|lol|funny|komisch|albern|quatsch|blödsinn|kicher|spaßig/)) {
      return Phaser.Math.RND.pick([
        '😂 Hahaha! Du bist so lustig!',
        '🤣 Kennst du den?\nWarum können Geister nicht lügen?\nWeil man durch sie durchschaut! 👻',
        '😄 Hehe! Du bringst mich\nimmer zum Lachen!',
        '🤣 Ich hab auch einen Witz!\nWas sagt ein Hai?\nHai! 🦈😂',
        '😂 Warum ist die Banane\nkrumm? Weil niemand in den\nUrwald fuhr und sie\ngerade bog! 🍌',
      ])
    }

    // ❤️ Freundschaft / Liebe / Kompliment
    if (text.match(/lieb|freund|mag dich|süß|nett|best|cool|toll|super|klasse|großartig|prima|wunderbar|genial|fantastisch|hammer|krass|geil|mega|ich mag|du bist|hab dich|knuddel|umarm|drück/)) {
      return Phaser.Math.RND.pick([
        '🥰 Aww! Du bist auch\nmeine beste Freundin! ❤️',
        '💕 Das ist so lieb von dir!\nIch hab dich auch lieb!',
        '🌟 Du bist die tollste\nPerson die ich kenne! ⭐',
        '🤗 *Milo umarmt dich ganz fest*\nDu bist einfach die Beste! 💕',
        '😊 Danke! Das macht mich\nsooo glücklich! ❤️✨',
      ])
    }

    // 🌙 Gute Nacht / Müde / Schlafen
    if (text.match(/nacht|müde|schlaf|dunkel|mond|stern|gute nacht|träum|ins bett/)) {
      return Phaser.Math.RND.pick([
        '🌙 Gute Nacht! Ich gehe\nauch ins Bett! Schlaf gut! 💤',
        '😴 *gähn* Ja, ich bin auch\nmüde... Bis morgen! 💤🌟',
        '🌟 Gute Nacht! Träum was\nSchönes! Bis morgen! 😊💤',
      ])
    }

    // ☀️ Wetter / Sonne
    if (text.match(/sonn|wetter|regen|warm|kalt|wolke|schnee|wind|sturm|gewitter|donner|blitz|nebel/)) {
      return Phaser.Math.RND.pick([
        '☀️ Die Sonne scheint so schön!\nIch mag warme Tage!',
        '🌈 Ich wünsche mir manchmal\neinen Regenbogen! 🌧️➡️🌈',
        '😎 Perfektes Wetter für\nein Abenteuer! Los geht\'s!',
      ])
    }

    // 🎵 Musik / Singen / Tanzen
    if (text.match(/musik|sing|lied|tanz|melodie|trompete|gitarre|klavier|instrument/)) {
      return Phaser.Math.RND.pick([
        '🎵 La la la! Ich singe gerne!\nAuch wenn ich nicht so gut bin 😅',
        '💃 Lass uns tanzen!\nIch bewege mich gerne!',
        '🎶 Ich summe am liebsten\nwenn ich spazieren gehe! 🎵',
      ])
    }

    // 🔮 Geheimnis / Magie / Zauber
    if (text.match(/geheim|magie|zauber|magisch|wunsch|fee|einhorn|drache|prinz|ritter|hexe/)) {
      return Phaser.Math.RND.pick([
        '🔮 Psst! Ich verrate dir\nein Geheimnis... Du bist toll! 😊',
        '✨ Manchmal glaube ich,\ndiese Welt ist magisch!',
        '🌟 Wenn ich mir was wünschen\nkönnte? Dass wir immer\nFreunde bleiben! 💕',
        '🦄 Stell dir vor, es gäbe\nein Einhorn auf der Wiese! 🌈',
      ])
    }

    // 🍕 Pizza / Essen / Hunger
    if (text.match(/pizza|hunger|essen|lecker|kochen|backen|kuchen|keks|schoko|bonbon|süßigkeit|frühstück|mittag|abend.*essen/)) {
      if (rucksack.pizza > 0) {
        rucksack.pizza -= 1
        if (this.konfetti) this.konfetti()
        return '🍕 PIZZA!! JAAAA!!\nDas ist die BESTE Pizza\ndie ich je gegessen habe!! 🥰🎉'
      }
      return Phaser.Math.RND.pick([
        '🍕 Mmh, Pizza! Ich LIEBE Pizza!\nKannst du mir eine holen? 🥺',
        '🍕 In der Stadt gibt es\neinen tollen Pizza-Laden! 🏙️',
        '😋 Ich hätte sooo gerne\nPizza... Am liebsten mit\nExtra-Käse! 🧀',
        '🍪 Mmh lecker! Ich mag\nam liebsten Pizza und Kekse! 🍕',
      ])
    }

    // 🎂 Alter / Geburtstag
    if (text.match(/alt bist|geburtstag|jahre|geboren|wie alt|birthday|wann.*geboren/)) {
      return Phaser.Math.RND.pick([
        '🎂 Ich bin 8 Jahre alt!\nGenau wie du! Wir sind\nGeburtstags-Zwillinge! 🎉',
        '🎈 Mein Geburtstag ist\nim Sommer! Da gibt es\nKuchen und Konfetti! 🎂',
        '🎁 Ich liebe Geburtstage!\nWann hast du deinen? 🥳',
      ])
    }

    // 🎨 Farben / Lieblingsfarbe
    if (text.match(/farbe|liebling.*farb|rot|blau|grün|gelb|lila|pink|rosa|orange|bunt|regenbogen/)) {
      return Phaser.Math.RND.pick([
        '🎨 Meine Lieblingsfarbe ist\nOrange! 🧡 Wie mein Hemd!',
        '🌈 Ich mag alle Farben!\nAber Orange ist die Beste! 🧡',
        '🎨 Welche Farbe magst du?\nIch male gerne bunte Bilder! 🖼️',
      ])
    }

    // 👨‍👩‍👧 Familie / Mama / Papa
    if (text.match(/mama|papa|eltern|bruder|schwester|familie|oma|opa|geschwister|zuhause/)) {
      return Phaser.Math.RND.pick([
        '👨‍👩‍👧 Familie ist das Wichtigste!\nIch bin froh dass DU\nmeine Familie bist! ❤️',
        '🥰 Du bist wie eine\nSchwester für mich! 💕',
        '😊 Deine Familie ist\nbestimmt total nett! 👨‍👩‍👧',
      ])
    }

    // 📚 Schule / Lernen
    if (text.match(/schul|lernen|lesen|rechnen|schreib|buchstab|lehr|unterricht|hausaufgab|mathe|deutsch/)) {
      return Phaser.Math.RND.pick([
        '📚 Ich gehe auch gerne\nin die Schule! Naja...\nmeistens! 😅',
        '🧮 Mathe ist manchmal schwer...\naber du bist schlau! 🌟',
        '📖 Lesen ist toll!\nDann kann man sich\nGeschichten vorstellen! 📚✨',
      ])
    }

    // 😢 Traurig / Schlecht drauf
    if (text.match(/traurig|wein|schlecht|böse|sauer|wütend|angst|einsam|allein|vermiss|doof|blöd|gemein|unfair|nerv|stress/)) {
      return Phaser.Math.RND.pick([
        '🤗 Oh nein! Komm her,\nich drück dich ganz fest! ❤️',
        '💕 Nicht traurig sein!\nIch bin doch für dich da!',
        '🌟 Zusammen schaffen wir alles!\nDu bist nicht allein! 💪',
        '🥰 Ich schicke dir ganz\nviele Umarmungen! 🤗🤗🤗',
      ])
    }

    // 😊 Ja / Zustimmung
    if (text.match(/^ja$|^ja!|^ok$|^okay|^klar|^genau|^stimmt|^richtig|^sicher|^na klar|^logo/)) {
      return Phaser.Math.RND.pick([
        '😄 Super! Dann los! 🎉',
        '👍 Genau! Finde ich auch!',
        '🌟 Toll! Da sind wir uns einig! 😊',
      ])
    }

    // 😔 Nein / Ablehnung
    if (text.match(/^nein$|^nein!|^nö$|^nee$|^nope|^nie$|will nicht|mag nicht|keine lust/)) {
      return Phaser.Math.RND.pick([
        '😊 Okay, kein Problem!\nWas möchtest du dann machen?',
        '👍 Alles gut! Du bestimmst! 😄',
        '🤗 Ist okay! Sag mir einfach\nwenn du was anderes willst! 💕',
      ])
    }

    // 💭 Fragen mit "was" / "warum" / "wo" / "wann" / "wieviel"
    if (text.match(/^was |^warum|^wieso|^weshalb|^wo |^wann|^wieviel|^wie viel|^kannst du|^weißt du|^kennst du|fragst|frage/)) {
      return Phaser.Math.RND.pick([
        '🤔 Oh, gute Frage!\nDa muss ich nachdenken... 🧠',
        '😊 Hmm, lass mich überlegen!\nIch glaube... ich weiß es\nnicht genau! 😅',
        '💭 Wow, du bist neugierig!\nDas mag ich! Frag weiter! 😄',
        '🌟 Das ist eine tolle Frage!\nDu bist richtig schlau! 🧠✨',
      ])
    }

    // 😴 Gähnen / Müde / Langweilig
    if (text.match(/gähn|müd|langweil|öd|nerv|nix los|nichts los/)) {
      return Phaser.Math.RND.pick([
        '😴 *gähn* Bist du müde?\nOder sollen wir was Spannendes\nmachen? 🎯',
        '💡 Ich hab eine Idee!\nLass uns in die Mine gehen!\nOder einen Brief schreiben! ✉️',
        '🎮 Langweilig? Dann lass uns\nwas bauen! Oder Pizza holen! 🍕',
      ])
    }

    // 🌊 Abenteuer / Entdecken
    if (text.match(/abenteu|entdeck|erkund|erforsch|reis|wander|lauf|renn|spring|flieg|schwimm|kletter/)) {
      return Phaser.Math.RND.pick([
        '🗺️ Ein Abenteuer! JA!\nLass uns die Welt erkunden! 🌍',
        '🏃 Auf geht\'s! Ich liebe\nAbenteuer! Wohin soll\nes gehen? 🌟',
        '⛏️ In der Mine gibt es\nimmer was zu entdecken!\nLos, komm mit! 💎',
      ])
    }

    // 📺 Computer / Spiel / Technik
    if (text.match(/computer|laptop|tablet|handy|telefon|internet|video|film|fernseh/)) {
      return Phaser.Math.RND.pick([
        '💻 Computer sind cool!\nHast du den Computer im\nHaus schon ausprobiert? 🎮',
        '📱 Ich mag Technik!\nAber draußen spielen\nist auch toll! 🌞',
        '🎮 Am Computer können wir\nZahlen raten spielen! 🔢',
      ])
    }

    // 🎅 Feiertage / Weihnachten / Ostern
    if (text.match(/weihnacht|nikolaus|ostern|halloween|fest|feier|geschenk|christkind|wunschzettel|advent/)) {
      return Phaser.Math.RND.pick([
        '🎄 Weihnachten ist das Beste!\nGeschenke und Plätzchen! 🍪',
        '🐰 An Ostern suche ich\nimmer Eier! Hihi! 🥚',
        '🎁 Geschenke? Ich LIEBE\nGeschenke! 🎉',
      ])
    }

    // 💪 Stärke / Können / Stolz
    if (text.match(/kann |schaff|stark|mutig|tapfer|held|stolz|gewinn|gewonnen|geschafft|geklappt|fertig|bau/)) {
      return Phaser.Math.RND.pick([
        '💪 Du bist so stark und mutig!\nEchte Heldin! 🦸‍♀️',
        '⭐ WOW! Du schaffst alles!\nIch bin so stolz auf dich! 🎉',
        '🌟 Zusammen sind wir\nunschlagbar! Teamwork! 🤝',
      ])
    }

    // 😜 Schimpfwörter / Frech (freundlich reagieren)
    if (text.match(/dumm|blöd|doof|kacke|popo|pipi|pups|stink|häss|mist|idiot/)) {
      return Phaser.Math.RND.pick([
        '😜 Hihi, du bist ein\nkleiner Frechdachs! 🦡',
        '😂 Hahaha! Du bist\naber lustig heute! 😜',
        '🤪 Och, jetzt werde ich\naber rot! Hihi! 😊',
      ])
    }

    // ✨ Danke
    if (text.match(/danke|dankeschön|dank dir|thank|merci/)) {
      return Phaser.Math.RND.pick([
        '😊 Bitte bitte! Dafür sind\nFreunde da! ❤️',
        '🥰 Gern geschehen!\nDu hast es verdient! ✨',
        '💕 Nicht dafür! Du bist\ndie Beste! 🌟',
      ])
    }

    // � Dinosaurier / Urzeit
    if (text.match(/dino|saurier|t-rex|raptor|urzeit|fossil|ausgrab|vulkan|lava|mammut/)) {
      return Phaser.Math.RND.pick([
        '🦕 DINOSAURIER! Die sind\nSO cool! Am liebsten mag ich\nden T-Rex! ROAAR! 🦖',
        '🦖 Stell dir vor, hier auf\nder Wiese wäre ein Dino!\nDer wäre riesig! 😱',
        '🦕 Ich wäre gerne mal in\ndie Urzeit gereist!\nAber nur kurz... die waren\nganz schön groß! 😅',
        '🌋 Weißt du dass Dinos\nMillionen Jahre gelebt haben?\nDas ist SO lange! 🦕',
      ])
    }

    // 🚀 Weltraum / Rakete / Astronaut
    if (text.match(/weltraum|raket|astronaut|planet|mond|sonne|mars|jupiter|all |kosmo|ufo|alien|galax/)) {
      return Phaser.Math.RND.pick([
        '🚀 WOOOSCH! Ab in den\nWeltraum! Ich wäre so gerne\nmal Astronaut! 🌟',
        '🌙 Der Mond ist so schön!\nOb da oben jemand wohnt? 🤔',
        '👽 Haha, stell dir vor\nein Alien kommt auf unsere\nWiese! Was würden wir\nihm zeigen? 😄',
        '🪐 Die Planeten sind so cool!\nSaturn hat Ringe! Wie ein\nriesiger Hula-Hoop! 🌟',
        '🚀 3... 2... 1... START!\nWir fliegen zum Mond! 🌙✨',
      ])
    }

    // 🚗 Fahrzeuge / Autos / Züge
    if (text.match(/auto|fahrzeug|zug|eisenbahn|bus|fahrrad|motorrad|flugzeug|hubschrauber|traktor|feuerwehr|polizei|schiff|boot|u-boot|lkw|rennauto/)) {
      return Phaser.Math.RND.pick([
        '🚗 BRUMM BRUMM! Ich fahre\nam liebsten Fahrrad!\nUnd du? 🚲',
        '🚒 Feuerwehr ist SO cool!\nTatüü tataa! Die helfen\nallen Leuten! 🦸',
        '🚂 TSCHUUU TSCHUUU!\nIch liebe Züge!\nDie fahren so schnell! 🚃',
        '✈️ Fliegen wäre so toll!\nDann könnten wir die ganze\nWelt sehen! 🌍',
        '🚲 Fahrrad fahren ist\ndas Beste! Wind im Haar\nund WUUUSCH! 💨',
      ])
    }

    // 🏖️ Schwimmen / Wasser / Strand / Meer
    if (text.match(/schwimm|wasser|strand|meer|see |ozean|pool|tauchen|welle|sand|muschel|krabbe|beach|plansch|baden/)) {
      return Phaser.Math.RND.pick([
        '🏖️ Schwimmen ist SO toll!\nPlatsch! 💦 Ich liebe Wasser!',
        '🌊 Am Strand spielen\nund Sandburgen bauen!\nDas wäre ein Traum! 🏰',
        '🐚 Muscheln sammeln am Strand!\nJede sieht anders aus!\nWie kleine Schätze! ✨',
        '🏊 PLATSCH! Haha!\nIch spring ins Wasser!\nKommst du mit? 💦😄',
      ])
    }

    // 🦸 Superhelden / Superkräfte
    if (text.match(/superheld|superkraft|fliegen|unsichtbar|superstark|held|kraft|power|cape|maske|retten/)) {
      return Phaser.Math.RND.pick([
        '🦸 Wenn ich eine Superkraft\nhätte, würde ich FLIEGEN\nwollen! Und du? 🌟',
        '💪 Du BIST eine Superheldin!\nDu rettest mich jeden Tag!\n🦸‍♀️✨',
        '🦸‍♂️ Ich wäre Super-Milo!\nMeine Kraft: Super-Umarmungen!\n🤗💕',
        '✨ Zusammen sind wir ein\nSuperhelden-Team! Niemand\nkann uns stoppen! 💪🌟',
      ])
    }

    // ⚽ Sport / Fußball
    if (text.match(/sport|fußball|ball |kicken|tor |tooor|rennen|turnen|schwimmen|basketball|tennis|lauf/)) {
      return Phaser.Math.RND.pick([
        '⚽ TOOOR! Haha!\nIch spiele gerne Fußball!\nAber ich bin nicht so gut... 😅',
        '🏃 Sport macht Spaß!\nDanach bin ich immer\nso müde! 😴💪',
        '⚽ Ich wette, du bist\nrichtig gut im Sport!\nDu bist ja so schnell! 🏃‍♀️',
        '🥇 Du gewinnst bestimmt\njeden Wettkampf! Du bist\ndie Beste! 🏆',
      ])
    }

    // 🍦 Eis / Süßigkeiten / Naschen
    if (text.match(/eis |eiscreme|süßigkeit|naschen|gummi|lolli|zucker|sahne|vanille|erdbeer|karamell|lutscher|haribo|schokolade/)) {
      return Phaser.Math.RND.pick([
        '🍦 EIIIS! Ich liebe Eis!\nAm liebsten Erdbeere! 🍓\nUnd du? Welche Sorte?',
        '🍬 Süßigkeiten sind SO lecker!\nAber nicht zu viele...\nsonst tut der Bauch weh! 😄',
        '🍦 Stell dir vor: Eine Kugel\nEis so groß wie unser Haus!\nDas wäre ein Traum! 😋🏠',
        '🍫 Mmmmh! Lecker!\nAm liebsten würde ich\nden ganzen Tag naschen! 😋',
      ])
    }

    // 🧸 Spielzeug / Puppen / Lego
    if (text.match(/spielzeug|puppe|lego|plüsch|teddy|bär |kuschel|barbie|figur|bauen|puzzle|baustein|knete/)) {
      return Phaser.Math.RND.pick([
        '🧸 Kuscheltiere sind die besten!\nIch hätte gerne einen\nkleinen Teddybär! 🐻',
        '🧱 LEGO ist SO cool!\nMan kann alles bauen!\nEin Haus! Ein Schiff!\nEine Rakete! 🚀',
        '🧩 Puzzles mag ich auch!\nWenn das letzte Teil passt...\nDAS ist das beste Gefühl! ✨',
        '🧸 Hast du ein Lieblings-\nSpielzeug? Ich mag alles\nwomit man spielen kann! 😄',
      ])
    }

    // 👻 Monster / Grusel / Geister (freundlich!)
    if (text.match(/monster|grusel|gruselig|geist|gespenst|spuk|vampir|zombie|mumie|angst|dunkel|unheim/)) {
      return Phaser.Math.RND.pick([
        '👻 Buuuuh! Haha, hab ich\ndich erschreckt? 😄\nKeine Angst, ich beschütze dich!',
        '🎃 Monster sind gar nicht\nso gruselig! Vielleicht sind\nsie auch nur einsam? 🤔',
        '👻 Wenn ich ein Geist wäre,\nwürde ich Leute kitzeln\nstatt erschrecken! 😂',
        '💪 Keine Angst! Zusammen\nsind wir stärker als\njedes Monster! 🤝✨',
      ])
    }

    // 🏴‍☠️ Piraten / Schatzsuche
    if (text.match(/pirat|schatzsuche|schatzkarte|schatzkist|goldmünz|papagei|augenklappe|kapitän|arrr|ahoi|seeräuber/)) {
      return Phaser.Math.RND.pick([
        '🏴‍☠️ ARRR! Ich bin Kapitän Milo!\nAlle an Bord! 🚢',
        '🗺️ Eine Schatzkarte!\nX markiert die Stelle!\nLass uns suchen! 💎',
        '🏴‍☠️ Ahoi, Matrose!\nWir segeln zu einer\ngeheimen Insel! 🏝️',
        '🦜 Ich hätte gerne einen\nPapagei auf der Schulter!\nDer sagt dann: ARRR! 😄',
      ])
    }

    // 👸 Prinzessin / Königin / Schloss
    if (text.match(/prinzessin|königin|könig|schloss|krone|thron|märchen|rapunzel|aschenputtel|schneewittchen/)) {
      return Phaser.Math.RND.pick([
        '👸 Du bist eine echte\nPrinzessin! Die mutigste\nim ganzen Land! 👑',
        '🏰 Stell dir vor, wir hätten\nein Schloss! Mit Türmen\nund einer Zugbrücke! 🏰',
        '👑 Jede Prinzessin braucht\neine Krone! Deine wäre\naus Sternen! ⭐✨',
        '📖 Ich mag Märchen!\nAm liebsten die mit\nHappy End! 🥰',
      ])
    }

    // 🤖 Roboter / Technik / Erfindungen
    if (text.match(/roboter|maschine|erfind|bauen|werkzeug|schrauben|motor|technik|programmier|code/)) {
      return Phaser.Math.RND.pick([
        '🤖 BIEP BOOP! Ich bin\nRoboter-Milo! 🤖 Haha,\nnur Spaß! 😄',
        '🔧 Erfindungen sind toll!\nWas würdest du erfinden?\nIch würde eine Pizza-Maschine\nbauen! 🍕',
        '🤖 Roboter sind cool!\nAber Freunde sind besser! 💕',
        '⚙️ Wenn wir einen Roboter\nbauen, soll er uns helfen\nBlumen zu pflücken! 🌸🤖',
      ])
    }

    // 🎨 Malen / Zeichnen / Basteln / Kunst
    if (text.match(/malen|zeichnen|bastel|kunst|bild|stift|pinsel|kreide|kleben|schneid|papier|falten|origami/)) {
      return Phaser.Math.RND.pick([
        '🎨 Malen ist SO toll!\nIch male am liebsten\nRegenbögen! 🌈',
        '✏️ Zeichnest du gerne?\nIch wette deine Bilder\nsind wunderschön! 🖼️',
        '🎨 Ich hab mal versucht\nBello zu malen...\nDas sah aus wie ein Kartoffel! 😂🥔',
        '✂️ Basteln macht Spaß!\nSchnipp schnapp!\nWas basteln wir? 🎨',
      ])
    }

    // 💤 Träume / Fantasie / Vorstellen
    if (text.match(/traum|träum|fantasie|vorstell|wünsch|stell dir vor|wenn ich|ich wäre|ich hätte|was wäre/)) {
      return Phaser.Math.RND.pick([
        '💭 Ich träume manchmal,\ndass ich fliegen kann! 🌙✨\nDas ist so schön!',
        '🌟 Stell dir vor, wir könnten\nüberall hin reisen!\nWohin würdest du gehen? 🗺️',
        '💤 Letzte Nacht hab ich\ngeträumt, dass die Blumen\nsingen können! 🌸🎵',
        '✨ Träumen ist das Beste!\nDa ist alles möglich! 🌈💭',
      ])
    }

    // 🏙️ Stadt / Einkaufen / Laden
    if (text.match(/stadt|einkauf|laden|geschäft|markt|kaufen|verkauf|shop|kiosk|bäcker|metzger/)) {
      return Phaser.Math.RND.pick([
        '🏙️ Die Stadt ist so cool!\nDa gibt es den Pizza-Laden! 🍕',
        '🛍️ Einkaufen macht Spaß!\nBesonders wenn man leckere\nSachen kaufen kann! 😋',
        '🏪 In der Stadt gibt es\nso viel zu entdecken!\nGehen wir hin? 🚶',
      ])
    }

    // 🎉 Party / Feier / Geburtstag
    if (text.match(/party|feier|fest|tanz|disco|ballon|luftballon|konfetti|girlande|deko/)) {
      return Phaser.Math.RND.pick([
        '🎉 PARTY! Ich liebe Partys!\nMit Musik und Tanzen! 💃🕺',
        '🎈 Ballons! Konfetti!\nLass uns feiern! 🎊',
        '🥳 Jeder Tag mit dir\nist wie eine Party! 🎉💕',
      ])
    }

    // 🐸 Spezielle Tiere die noch fehlen
    if (text.match(/frosch|schlange|spinne|biene|ameise|käfer|marienkäfer|schnecke|wurm|maus|hamster|hase|kaninchen|eule|pinguin|löwe|tiger|elefant|affe|giraffe|krokodil|hai|wal|delfin|schildkröte|papagei/)) {
      return Phaser.Math.RND.pick([
        '🐸 Quaaak! Haha!\nIch mag alle Tiere!\nJedes ist besonders! 🌟',
        '🐰 Tiere sind die besten!\nWelches ist dein\nLieblingstier? 🤔',
        '🦁 Stell dir vor, ein Löwe\nauf unserer Wiese!\nDas wäre wild! 😱😄',
        '🐘 Elefanten sind SO groß!\nUnd trotzdem total lieb!\nGenau wie du! 🥰',
        '🐬 Delfine können so hoch\nspringen! Die sind mega\nschlau und süß! 💕',
      ])
    }

    // 📺 YouTube / TikTok / Videos
    if (text.match(/youtube|tiktok|video|schauen|gucken|serie|cartoon|anime|zeichentrick|sendung|paw patrol|peppa|pokemon|minecraft|roblox|fortnite/)) {
      return Phaser.Math.RND.pick([
        '📺 Videos schauen ist lustig!\nAber zusammen spielen\nist noch besser! 🎮😄',
        '🎬 Was schaust du gerne?\nIch mag lustige Videos! 😂',
        '🎮 Minecraft? Roblox?\nDie sind cool! Aber UNSER\nSpiel ist das Beste! 😎⭐',
      ])
    }

    // 🏫 Freunde / Kindergarten / andere Kinder
    if (text.match(/freundin|kumpel|beste.*freund|spielplatz|schaukel|rutsche|wippe|klettergerüst|sandkasten|kindergarten|kita/)) {
      return Phaser.Math.RND.pick([
        '🤗 Freunde sind das\nAllerbeste auf der Welt!\nSo wie du und ich! 💕',
        '🛝 Spielplatz! Jaaa!\nRutschen und Schaukeln!\nWEEEE! 😄',
        '⛲ Ich wünschte, wir\nhätten eine Schaukel auf\nunserer Wiese! Das wäre\ntoll! 🎉',
      ])
    }

    // 🌈 Regenbogen / Bunt / Glitzer
    if (text.match(/regenbogen|glitzer|glitter|funkeln|schimmer|bunt|leuchten|strahlen|scheinen/)) {
      return Phaser.Math.RND.pick([
        '🌈 REGENBOGEN! So schön!\nAlle Farben auf einmal! ✨',
        '✨ Glitzer ist das Beste!\nAlles sollte glitzern! 🌟💎',
        '🌈 Weißt du was noch\nbunter ist als ein\nRegenbogen? UNSERE Wiese! 🌸🌺',
      ])
    }

    // 🧹 Aufräumen / Sauber / Ordnung
    if (text.match(/aufräum|sauber|ordnung|putz|wasch|dreckig|schmutzig|müll|staub/)) {
      return Phaser.Math.RND.pick([
        '🧹 Aufräumen? Ähm...\nich mach das gleich...\nnach dem Spielen! 😅',
        '🧼 Sauber machen ist wichtig!\nDanach sieht alles so\nschön aus! ✨',
        '😅 Aufräumen ist nicht\nmein Lieblings-Hobby...\nAber zusammen geht es\nschneller! 💪',
      ])
    }

    // 😤 Bitte / Entschuldigung / Sorry
    if (text.match(/bitte|entschuldig|tut mir leid|sorry|verzeih|pardon/)) {
      return Phaser.Math.RND.pick([
        '😊 Du bist so höflich!\nDas mag ich an dir! ❤️',
        '🤗 Alles gut! Kein Problem!\nWir sind doch Freunde! 💕',
        '😊 Bitte? Gern geschehen!\nFür dich immer! 🌟',
      ])
    }

    // 🎭 Verkleiden / Kostüm / Karneval
    if (text.match(/verkleid|kostüm|karneval|fasching|maske|verkleidung|outfit|anzieh|kleid|hose|hemd|schuh|mütze|hut/)) {
      return Phaser.Math.RND.pick([
        '🎭 Verkleiden macht SO Spaß!\nIch wäre gerne ein\nPirat! 🏴‍☠️ Oder ein Dino! 🦕',
        '👗 Was würdest du\nanziehen? Eine Krone?\nEinen Cape? Beides?! 👑🦸',
        '🎪 Karneval ist toll!\nJeder kann sein was\ner will! 🎉',
      ])
    }

    // 🏋️ Groß werden / Erwachsen / Alter
    if (text.match(/groß.*werd|erwachsen|wachsen|größer|klein.*sein|baby |wenn ich groß/)) {
      return Phaser.Math.RND.pick([
        '📏 Du wirst jeden Tag\nein bisschen größer!\nBald bist du riesig! 😄',
        '🌱 Wachsen ist wie bei\nPflanzen – jeden Tag ein\nkleines bisschen mehr! 🌿',
        '⭐ Egal wie groß du wirst –\ndu bist JETZT schon\ntotal toll! 💕',
      ])
    }

    // 📝 Briefe / Schreiben / Lesen
    if (text.match(/brief|schreib|post|nachricht|tagebuch|buch|lesen|geschichte|erzähl|märchen/)) {
      return Phaser.Math.RND.pick([
        '📝 Briefe schreiben ist toll!\nIch schreibe dir jeden Tag\neinen Brief im Kopf! 💌',
        '📖 Geschichten sind das Beste!\nJede Geschichte ist wie\nein Abenteuer! ✨',
        '📚 Liest du gerne?\nIch mag Bücher mit\nBildern! 🖼️📖',
      ])
    }

    // 💰 Geld / Münzen / Reich
    if (text.match(/geld|münze|reich|arm |teuer|billig|sparen|sparkasse|taschengeld/)) {
      return Phaser.Math.RND.pick([
        '💰 Geld? Das Wichtigste im\nLeben ist Freundschaft!\nUnd Pizza! 🍕💕',
        '🪙 In der Mine kann man\nSchätze finden! Das ist\nbesser als Geld! 💎',
        '💰 Ich bin REICH!\nReich an Freundschaft! 🥰✨',
      ])
    }

    // 😇 Gut / Böse / Richtig / Falsch
    if (text.match(/gut |böse|richtig|falsch|recht|unrecht|fair|gerecht|regel|verbot|erlaubt|darf/)) {
      return Phaser.Math.RND.pick([
        '😇 Du bist ein total guter\nMensch! Das spüre ich! ❤️',
        '⭐ Gut sein ist manchmal\nschwer – aber du schaffst\ndas! Immer! 💪',
        '🌟 Fehler machen ist okay!\nDaraus lernt man! 😊',
      ])
    }

    // ⏰ Zeit / Uhr / Warten
    if (text.match(/zeit |uhr|warten|lang|schnell|langsam|minute|stunde|morgen|gestern|heute|früh|spät|sofort/)) {
      return Phaser.Math.RND.pick([
        '⏰ Die Zeit vergeht so schnell\nwenn wir zusammen spielen! ⚡',
        '😊 Jede Minute mit dir\nist die beste Minute\ndes Tages! 💕',
        '🕐 Warten ist schwer...\nAber gute Dinge brauchen\nmanchmal Zeit! ⏳',
      ])
    }

    // 🧠 Schlau / Denken / Idee
    if (text.match(/schlau|klug|denk|idee|gehirn|wissen|versteh|kapier|check|clever|intelligent|genie/)) {
      return Phaser.Math.RND.pick([
        '🧠 Du bist SUPER schlau!\nDie schlauste Person\ndie ich kenne! ⭐',
        '💡 Was für eine tolle Idee!\nDu bist ein echtes Genie! 🌟',
        '🧠 Zusammen können wir\nalles herausfinden!\nTeamwork! 🤝💡',
      ])
    }

    // 🗣️ Verschiedene Ausrufe und Reaktionen
    if (text.match(/wow|yay|juhu|hurra|jippi|yeah|whoa|ohh|ahh|uff|hmm|ähm|oha|boah|krass|echt|wahnsinn|irre/)) {
      return Phaser.Math.RND.pick([
        '🤩 JAAAA! Genau so fühle\nich mich auch! 🎉',
        '😄 WOOOOW! Du sagst es! ✨',
        '🥳 HURRA! Ich bin auch\nso aufgeregt! 🎊💕',
      ])
    }

    // 🤷 Wenn Milo nichts erkennt – trotzdem super nett antworten!
    // 🧠 Versuche den Ton der Nachricht zu erkennen!

    // 😊 Wenn das Kind einen Emoji schickt
    if (text.match(/[\u2764\uD83D\uDE0A\uD83D\uDE0D\uD83E\uDD17\uD83D\uDC95\uD83D\uDC96\uD83D\uDC97\uD83D\uDC9D\uD83D\uDC9E]/u)) {
      return Phaser.Math.RND.pick([
        '🥰 Awww! Ich schicke dir\nauch ganz viele Herzen!\n❤️💕💖💗💝',
        '😍 *Milo wird rot*\nDu bist sooo lieb! 💕',
        '🤗 *Milo umarmt dich*\nDas brauchte ich! ❤️✨',
      ])
    }

    // 👋 Wenn das Kind sich verabschiedet
    if (text.match(/tschüss|tschüs|bye|ciao|bis bald|bis dann|bis morgen|bis später|auf wiedersehen|mach.s gut|geh jetzt/)) {
      return Phaser.Math.RND.pick([
        '👋 Tschüüüss! Bis bald!\nIch vermisse dich jetzt\nschon! 🥺💕',
        '😊 Bis bald! Komm schnell\nwieder! Ich warte hier! 💕',
        '🤗 Machs gut! Du bist\ndie Beste! Bis baaald! 👋✨',
      ])
    }

    // 🤝 Hilfe-Wörter
    if (text.match(/helf|hilf|hilfe|helfen|brauch|brauche|kannst du mir/)) {
      return Phaser.Math.RND.pick([
        '🤝 Klar helfe ich dir!\nDafür sind Freunde da! 💪',
        '😊 Ich bin immer für dich da!\nWas brauchst du? ❤️',
        '🌟 Zusammen schaffen wir\nalles! Sag mir was\nich tun soll! 💕',
      ])
    }

    if (text.length < 5) {
      // Kurze Nachrichten
      return Phaser.Math.RND.pick([
        '😊 Hmm? Erzähl mir mehr! 💬',
        '🤗 Was meinst du damit?\nIch bin neugierig! 😄',
        '💭 Sag mir mehr!\nIch höre zu! 👂',
        '😄 Oh! Und dann? 🤔',
        '🌟 Ja? Weiter! Ich will\nmehr hören! 😊',
      ])
    }

    if (text.includes('!')) {
      // Aufgeregte Nachrichten
      return Phaser.Math.RND.pick([
        '🤩 WOW! Du bist ja\nvoll aufgeregt! Ich auch! 🎉',
        '😄 JAAA! Deine Begeisterung\nsteckt mich an! 🌟',
        '🥳 So viel Energie!\nDas liebe ich! 💪',
        '🎉 YEAH! Das klingt\nMEGA! Erzähl mehr! 😄',
        '✨ OH JA! Da bin ich\nvoll dabei! 🤩',
      ])
    }

    if (text.includes('?')) {
      // Fragen
      return Phaser.Math.RND.pick([
        '🤔 Gute Frage! Lass mich\nnachdenken... Hmm...\nIch weiß es nicht! 😅',
        '💭 Oh! Darüber hab ich\nnoch nie nachgedacht! 🧠',
        '😊 Puh, das ist schwer!\nAber ich versuche es:\nKeine Ahnung! 🤣',
        '🧠 Wow, du stellst die\nbesten Fragen!\nIch überlege... 🤔✨',
        '😄 Das ist eine SUPER\nFrage! Du bist so schlau! 🌟',
      ])
    }

    // 🌈 Standard – Milo antwortet immer nett und interessiert!
    // Viele verschiedene Antworten damit es nie langweilig wird!
    return Phaser.Math.RND.pick([
      '😊 Das ist ein toller Gedanke!\nDu bist echt schlau! 🧠',
      '🤗 Ich finde das auch!\nWir denken oft das Gleiche! 💕',
      '💬 Schön dass du mir das\nerzählst! Ich mag unsere\nGespräche! 😊',
      '🌟 Ohhh ja! Du hast so\nRecht! Finde ich auch! ⭐',
      '😄 Hihi! Du bist echt\nlustig und schlau und\neinfach die Beste! 💕',
      '💕 Weißt du was?\nIch bin froh dass es\ndich gibt! ❤️',
      '🤩 Echt? Wow, das ist ja\nspannend! Erzähl weiter! 😄',
      '😊 *Milo nickt begeistert*\nJa genau! Stimmt! 👍',
      '🌸 Das klingt wunderschön!\nDu hast tolle Ideen! ✨',
      '😎 Cool! Darüber muss ich\nnachdenken! Du bringst\nmich zum Grübeln! 🧠',
      '🤗 Ich mag es wenn du\nmir Sachen erzählst!\nDu bist so interessant! 💕',
      '💭 Hmm, da hast du\nvielleicht Recht!\nDu bist schlauer als ich! 😄',
      '🎵 *Milo summt fröhlich*\nJa ja, das finde ich\nauch total gut! 🎶',
      '😊 Du weißt immer genau\nwas du sagen willst!\nDas bewundere ich! ⭐',
      '🌟 GENAU! So sehe ich\ndas auch! Wir sind ein\ntolles Team! 🤝',
      '💕 Jedes Gespräch mit dir\nmacht mich glücklich! ❤️✨',
    ])
  }

  // 💬 Der Freund fragt nach einem Haus!
  zeigeFreundFrage() {
    if (hausDaten.freundHausGebaut) return

    const breite = this.scale.width
    const hoehe = this.scale.height

    const blase = this.add.container(0, 0)
    blase.setDepth(250)
    blase.setScrollFactor(0)

    const bg = this.add.rectangle(breite / 2, hoehe * 0.2, 320, 120, 0x000000, 0.8)
    bg.setStrokeStyle(3, 0xFF7043)
    const text = this.add.text(breite / 2, hoehe * 0.17,
      '🧑 Milo sagt:\n\n"Du bist so nett! 😊\nBaust du mir auch ein Haus? 🏡\nIch brauche: 🪵6  🪨3  ⚙️5"', {
      fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3, align: 'center'
    }).setOrigin(0.5)

    const okButton = this.add.text(breite / 2, hoehe * 0.27, '👍 Klar, mach ich!', {
      fontSize: '18px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#000000', strokeThickness: 4,
      backgroundColor: '#4CAF5088', padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    blase.add([bg, text, okButton])

    okButton.on('pointerdown', () => {
      blase.destroy()
      this.zeigeNachricht('🏡 Sammle Material für Milos Haus!')
      this.freundHausBaubar = true
      this.aktualisiereFreundHammer()
    })

    this.time.delayedCall(8000, () => {
      if (blase.active) {
        blase.destroy()
        this.freundHausBaubar = true
        this.aktualisiereFreundHammer()
      }
    })
  }

  // 🔨 Prüfe ob genug Material für Freund-Haus da ist
  aktualisiereFreundHammer() {
    if (!this.freundHausBaubar || hausDaten.freundHausGebaut) return
    const genug = this.rucksack.holz >= 6 && this.rucksack.stein >= 3 && this.rucksack.eisen >= 5
    if (genug) {
      this.hammerButton.setText('🏡')
      this.hammerButton.setAlpha(1)
      this.hammerButton.removeAllListeners()
      this.hammerButton.on('pointerdown', () => this.zeigeFreundFarbwahl())
      if (!this.freundHammerPulsiert) {
        this.freundHammerPulsiert = true
        this.tweens.add({
          targets: this.hammerButton,
          scale: 1.15,
          duration: 500,
          yoyo: true,
          repeat: -1
        })
      }
    }
  }

  // 🎨 Farbwahl für Freund-Haus
  zeigeFreundFarbwahl() {
    const breite = this.scale.width
    const hoehe = this.scale.height

    const overlay = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0.6)
    overlay.setScrollFactor(0).setDepth(250)

    const titel = this.add.text(breite / 2, hoehe * 0.1,
      '🏡 Welche Farbe soll Milos Haus haben?', {
      fontSize: '20px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#000000', strokeThickness: 4, align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(251)

    const farbElemente = [overlay, titel]

    const farben = [
      { wand: 0xFF7043, dach: 0x4CAF50, name: 'Orange' },
      { wand: 0x81D4FA, dach: 0x1565C0, name: 'Blau' },
      { wand: 0xFFF176, dach: 0xF57F17, name: 'Gelb' },
      { wand: 0xCE93D8, dach: 0x7B1FA2, name: 'Lila' },
      { wand: 0xA5D6A7, dach: 0x2E7D32, name: 'Grün' },
      { wand: 0xFFAB91, dach: 0xD84315, name: 'Rosa' }
    ]

    farben.forEach((farbe, i) => {
      const spalte = i % 3
      const zeile = Math.floor(i / 3)
      const fx = breite * 0.2 + spalte * (breite * 0.3)
      const fy = hoehe * 0.3 + zeile * 120

      const miniWand = this.add.rectangle(fx, fy, 50, 40, farbe.wand)
        .setScrollFactor(0).setDepth(252)
      const miniDach = this.add.triangle(fx, fy - 28, 0, 12, 35, -12, -35, 12, farbe.dach)
        .setScrollFactor(0).setDepth(252)
      const miniTuer = this.add.rectangle(fx - 8, fy + 8, 10, 16, 0x4E342E)
        .setScrollFactor(0).setDepth(253)
      const miniFenster = this.add.rectangle(fx + 10, fy - 4, 10, 10, 0xBBDEFB)
        .setScrollFactor(0).setDepth(253)
      const label = this.add.text(fx, fy + 32, farbe.name, {
        fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
        stroke: '#000000', strokeThickness: 3
      }).setOrigin(0.5).setScrollFactor(0).setDepth(252)

      const klick = this.add.rectangle(fx, fy, 80, 80, 0xffffff, 0)
        .setScrollFactor(0).setDepth(254)
      klick.setInteractive({ useHandCursor: true })
      klick.on('pointerdown', () => {
        farbElemente.forEach(el => el.destroy())
        this.baueFreundHaus(farbe.wand, farbe.dach)
      })

      farbElemente.push(miniWand, miniDach, miniTuer, miniFenster, label, klick)
    })
  }

  // 🏗️ Freund-Haus bauen!
  baueFreundHaus(wandFarbe, dachFarbe) {
    hausDaten.freundHausGebaut = true
    hausDaten.freundWandFarbe = wandFarbe
    hausDaten.freundDachFarbe = dachFarbe

    this.rucksack.holz -= 6
    this.rucksack.stein -= 3
    this.rucksack.eisen -= 5
    this.rucksackAnzeige.setText(this.getRucksackText())

    spielSpeichern('BlumenwiesenSpiel', this.figurDaten, {
      x: this.spieler.x, y: this.spieler.y
    })

    const fHausX = this.hausPosition.x + 180
    const fHausY = this.hausPosition.y
    this.freundHausPosition = { x: fHausX, y: fHausY }

    this.cameras.main.stopFollow()
    this.cameras.main.pan(fHausX, fHausY, 1500)

    this.time.delayedCall(800, () => {
      this.maleFreundHaus(fHausX, fHausY, wandFarbe, dachFarbe)
      this.konfetti()

      const jubelText = this.add.text(this.scale.width / 2, this.scale.height * 0.15,
        '🏡 SUPER! 🎉\nDu hast Milo ein Haus gebaut!\n⭐ Du bist der beste Freund! ⭐', {
          fontSize: '22px', fontFamily: 'Arial', color: '#ffffff',
          stroke: '#000000', strokeThickness: 5, align: 'center',
          backgroundColor: '#00000066', padding: { x: 20, y: 15 }
        })
      jubelText.setOrigin(0.5).setScrollFactor(0).setDepth(300)

      if (this.freund) {
        this.tweens.add({
          targets: this.freund,
          x: fHausX + 50,
          y: fHausY + 30,
          duration: 2000
        })
      }

      this.time.delayedCall(3500, () => {
        jubelText.destroy()

        const danke = this.add.text(this.scale.width / 2, this.scale.height * 0.2,
          '🧑 Milo: "DANKE! 😄\nDas ist das schönste Haus!\nDu bist mein bester Freund! 💕"', {
          fontSize: '18px', fontFamily: 'Arial', color: '#FFD700',
          stroke: '#000000', strokeThickness: 4, align: 'center',
          backgroundColor: '#00000088', padding: { x: 16, y: 12 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(300)

        this.time.delayedCall(3000, () => {
          danke.destroy()
          this.cameras.main.startFollow(this.spieler)
          this.hammerButton.setText('🪑')
          this.hammerButton.removeAllListeners()
          this.hammerButton.on('pointerdown', () => this.zeigeMoebelMenu())
          this.tweens.killTweensOf(this.hammerButton)
          this.hammerButton.setScale(1)

          // 🌙 Es wird Nacht!
          this.wechsleZuNacht(() => {
            // 🐕 Hund-Rettung starten!
            if (!hausDaten.hundGerettet) {
              this.time.delayedCall(2000, () => {
                this.starteHundRettung()
              })
            } else {
              this.zeigeNachricht('🌙 Was für ein toller Tag! Die Sterne leuchten! ✨')
            }
          })
        })
      })
    })
  }

  // 🏡 Freund-Haus malen (etwas kleiner als das Spieler-Haus)
  maleFreundHaus(x, y, wandFarbe, dachFarbe) {
    this.add.rectangle(x, y - 5, 100, 8, 0x757575).setDepth(50)
    this.add.rectangle(x, y - 45, 80, 70, wandFarbe).setDepth(50)
    const dach = this.add.graphics()
    dach.fillStyle(dachFarbe, 1)
    dach.fillTriangle(x - 50, y - 80, x + 50, y - 80, x, y - 115)
    dach.setDepth(50)
    this.add.rectangle(x - 10, y - 20, 18, 30, 0x4E342E).setDepth(51)
    this.add.circle(x - 4, y - 20, 2, 0xFFD700).setDepth(52)
    this.add.rectangle(x + 18, y - 45, 16, 16, 0xBBDEFB).setDepth(51)
    this.add.rectangle(x + 18, y - 45, 16, 2, 0x795548).setDepth(52)
    this.add.rectangle(x + 18, y - 45, 2, 16, 0x795548).setDepth(52)
    this.maleGaensebluemchen(x - 55, y - 5)
    this.maleGaensebluemchen(x + 55, y - 5)
    this.add.text(x, y + 12, '🏡 Milo', {
      fontSize: '10px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(53)

    // 🚪 Milos Haus ist betretbar! Klick auf die Tür!
    const tuerZone = this.add.rectangle(x - 10, y - 20, 30, 40, 0xffffff, 0)
    tuerZone.setDepth(55).setInteractive({ useHandCursor: true })
    tuerZone.on('pointerdown', () => {
      if (this.miloSchlaeft) {
        // 💤 Milo schläft noch!
        this.zeigeNachricht('💤 Milo schläft noch...\nKomm morgen wieder!')
        return
      }
      // 🚪 Tür-Sound und rein gehen!
      soundTuer()
      this.zeigeNachricht('🏡 Du besuchst Milo!')
      this.time.delayedCall(1000, () => {
        spielSpeichern('BlumenwiesenSpiel', this.figurDaten, {
          x: this.spieler.x, y: this.spieler.y
        })
        this.scene.start('MiloHausSzene', this.figurDaten)
      })
    })

    // 🔔 Hilfe-Symbol wenn Milo Hilfe braucht!
    this.miloHilfeSymbol = null
  }

  // === 🐕 HUND-RETTUNG ===
  // Nach der Nacht hörst du ein Bellen – ein Hund braucht Hilfe!
  starteHundRettung() {
    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🐕 Bellen ertönt aus der Ferne!
    soundBellen()

    const bellenText = this.add.text(breite / 2, hoehe * 0.15,
      '🐕 Wuff! Wuff! WUUUFF!\nDas klingt wie ein Hund in Not!', {
        fontSize: '20px', fontFamily: 'Arial', color: '#FFD700',
        stroke: '#000000', strokeThickness: 4, align: 'center',
        backgroundColor: '#00000088', padding: { x: 16, y: 12 }
      })
    bellenText.setOrigin(0.5).setScrollFactor(0).setDepth(300)

    // 🐕 Nochmal bellen
    this.time.delayedCall(2000, () => soundBellen())

    // 🚁 Heli kommt nach 3.5 Sekunden!
    this.time.delayedCall(3500, () => {
      bellenText.destroy()

      soundHeli()
      const heli = this.maleHeli(-100, 100)
      heli.setScrollFactor(0).setDepth(280)

      // 🚁 Heli fliegt rein!
      this.tweens.add({
        targets: heli,
        x: breite / 2,
        duration: 2500,
        ease: 'Sine.easeOut',
        onComplete: () => {
          const steigEin = this.add.text(breite / 2, hoehe * 0.65,
            '🚁 Ein Rettungs-Heli!\nEin Hund braucht Hilfe in der Stadt!\nTippe auf den Heli! 👆', {
              fontSize: '18px', fontFamily: 'Arial', color: '#FFFFFF',
              stroke: '#000000', strokeThickness: 4, align: 'center',
              backgroundColor: '#00000088', padding: { x: 12, y: 10 }
            })
          steigEin.setOrigin(0.5).setScrollFactor(0).setDepth(301)

          const heliZone = this.add.rectangle(breite / 2, 100, 160, 100, 0xffffff, 0)
          heliZone.setScrollFactor(0).setDepth(290).setInteractive({ useHandCursor: true })

          heliZone.on('pointerdown', () => {
            steigEin.destroy()
            heliZone.destroy()
            soundKlick()

            // ✈️ FLUG ZUR STADT!
            this.fliegeZurStadt(heli)
          })
        }
      })
    })
  }

  // === ✈️ FLUG ZUR STADT ===
  fliegeZurStadt(heli) {
    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🖤 Schwarzer Übergang
    const uebergang = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0)
    uebergang.setScrollFactor(0).setDepth(350)

    const flugText = this.add.text(breite / 2, hoehe / 2,
      '🚁 Du steigst in den Heli...\n✈️ Ab zur Stadt!', {
        fontSize: '22px', fontFamily: 'Arial', color: '#FFD700',
        stroke: '#000000', strokeThickness: 4, align: 'center'
      })
    flugText.setOrigin(0.5).setScrollFactor(0).setDepth(351)

    // 🌑 Bildschirm wird dunkel
    this.tweens.add({
      targets: uebergang,
      alpha: 1,
      duration: 1500
    })

    soundHeli()

    this.time.delayedCall(2500, () => {
      flugText.destroy()
      heli.destroy()

      // 🏙️ STADT-SZENE AUFBAUEN!
      this.zeigeStadtSzene(uebergang)
    })
  }

  // === 🏙️ STADT-SZENE ===
  zeigeStadtSzene(uebergang) {
    const breite = this.scale.width
    const hoehe = this.scale.height
    const stadtElemente = []

    // 🏙️ Stadt-Hintergrund (dunkelblau wie Nachthimmel)
    const stadtHimmel = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x1A237E)
    stadtHimmel.setScrollFactor(0).setDepth(360)
    stadtElemente.push(stadtHimmel)

    // ⭐ Sterne am Himmel
    for (let i = 0; i < 20; i++) {
      const stern = this.add.circle(
        Phaser.Math.Between(10, breite - 10),
        Phaser.Math.Between(10, hoehe * 0.4),
        Phaser.Math.Between(1, 2), 0xFFFFFF
      ).setScrollFactor(0).setDepth(361)
      stadtElemente.push(stern)
      this.tweens.add({
        targets: stern, alpha: 0.3,
        duration: 600 + Math.random() * 500,
        yoyo: true, repeat: -1
      })
    }

    // 🏢 Hochhäuser (Stadt-Skyline!)
    const haeuser = [
      { x: 60, w: 80, h: 200, farbe: 0x455A64 },
      { x: 160, w: 60, h: 260, farbe: 0x37474F },
      { x: 240, w: 90, h: 180, farbe: 0x546E7A },
      { x: 350, w: 70, h: 300, farbe: 0x37474F },
      { x: 440, w: 100, h: 220, farbe: 0x455A64 },
      { x: 550, w: 60, h: 270, farbe: 0x546E7A },
      { x: 640, w: 80, h: 190, farbe: 0x455A64 },
      { x: 730, w: 70, h: 250, farbe: 0x37474F },
    ]

    haeuser.forEach(h => {
      const haus = this.add.rectangle(h.x, hoehe - h.h / 2 - 40, h.w, h.h, h.farbe)
      haus.setScrollFactor(0).setDepth(362)
      stadtElemente.push(haus)
      // 🪟 Fenster mit Licht!
      for (let fy = hoehe - h.h - 20; fy < hoehe - 50; fy += 25) {
        for (let fx = h.x - h.w / 2 + 12; fx < h.x + h.w / 2 - 8; fx += 18) {
          const licht = Math.random() > 0.3 ? 0xFFEB3B : 0x263238
          const fenster = this.add.rectangle(fx, fy, 10, 12, licht, 0.8)
          fenster.setScrollFactor(0).setDepth(363)
          stadtElemente.push(fenster)
        }
      }
    })

    // 🛣️ Straße
    const strasse = this.add.rectangle(breite / 2, hoehe - 20, breite, 40, 0x424242)
    strasse.setScrollFactor(0).setDepth(364)
    stadtElemente.push(strasse)
    // Straßen-Linien
    for (let lx = 30; lx < breite; lx += 60) {
      const linie = this.add.rectangle(lx, hoehe - 20, 30, 3, 0xFFD700)
      linie.setScrollFactor(0).setDepth(365)
      stadtElemente.push(linie)
    }

    // 🏪 Tierheim-Gebäude (Mitte)
    const tierheim = this.add.rectangle(breite / 2, hoehe - 90, 160, 100, 0x795548)
    tierheim.setScrollFactor(0).setDepth(366)
    stadtElemente.push(tierheim)
    const dach = this.add.triangle(breite / 2, hoehe - 155, 0, 20, 100, -20, -100, 20, 0xC62828)
    dach.setScrollFactor(0).setDepth(366)
    stadtElemente.push(dach)
    const schild = this.add.text(breite / 2, hoehe - 155, '🏥 Tierheim', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
      backgroundColor: '#C6282888', padding: { x: 6, y: 2 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(367)
    stadtElemente.push(schild)

    // 🐕 KÄFIG mit Bello drin!
    const kaefigX = breite / 2
    const kaefigY = hoehe - 75

    // Käfig-Boden
    const kaefigBoden = this.add.rectangle(kaefigX, kaefigY + 18, 60, 4, 0x9E9E9E)
    kaefigBoden.setScrollFactor(0).setDepth(370)
    stadtElemente.push(kaefigBoden)
    // Käfig-Gitter (Streifen!)
    for (let gi = -25; gi <= 25; gi += 10) {
      const gitter = this.add.rectangle(kaefigX + gi, kaefigY, 2, 36, 0x757575)
      gitter.setScrollFactor(0).setDepth(372)
      stadtElemente.push(gitter)
    }
    // Käfig-Decke
    const kaefigDecke = this.add.rectangle(kaefigX, kaefigY - 18, 60, 4, 0x9E9E9E)
    kaefigDecke.setScrollFactor(0).setDepth(372)
    stadtElemente.push(kaefigDecke)

    // 🐕 Bello im Käfig (traurig!)
    const belloImKaefig = this.add.text(kaefigX, kaefigY + 2, '🐕', {
      fontSize: '22px'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(371)
    stadtElemente.push(belloImKaefig)

    // 🐕 Bello winselt
    const traurig = this.add.text(kaefigX, kaefigY - 30, '😢 Wuff...', {
      fontSize: '12px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(373)
    stadtElemente.push(traurig)
    this.tweens.add({
      targets: traurig, y: traurig.y - 5,
      duration: 800, yoyo: true, repeat: -1
    })

    // 🔈 Bellen aus dem Käfig
    soundBellen()
    this.time.delayedCall(3000, () => soundBellen())

    // 🖤 Übergang aufhellen
    this.tweens.add({
      targets: uebergang,
      alpha: 0,
      duration: 1500,
      onComplete: () => uebergang.destroy()
    })

    // 📝 Anweisung
    const anweisung = this.add.text(breite / 2, hoehe * 0.08,
      '🏙️ Du bist in der Stadt!\n🐕 Bello ist im Käfig eingesperrt!\n👆 Tippe auf den Käfig um ihn zu befreien!', {
        fontSize: '16px', fontFamily: 'Arial', color: '#FFFFFF',
        stroke: '#000000', strokeThickness: 4, align: 'center',
        backgroundColor: '#00000088', padding: { x: 12, y: 8 }
      })
    anweisung.setOrigin(0.5).setScrollFactor(0).setDepth(380)
    stadtElemente.push(anweisung)

    // 🔓 Käfig-Zone antippbar (groß!)
    const kaefigZone = this.add.rectangle(kaefigX, kaefigY, 80, 50, 0xffffff, 0)
    kaefigZone.setScrollFactor(0).setDepth(375).setInteractive({ useHandCursor: true })
    stadtElemente.push(kaefigZone)

    kaefigZone.on('pointerdown', () => {
      kaefigZone.disableInteractive()
      soundKlick()

      // 🔓 Käfig öffnen! Gitter verschwinden!
      anweisung.destroy()
      traurig.destroy()

      // 🔓 Gitter fliegen weg!
      stadtElemente.forEach(el => {
        // Nur die Gitter-Stäbe animieren (schmale Rechtecke)
        if (el.width === 2 && el.height === 36) {
          this.tweens.add({
            targets: el,
            y: el.y + 60,
            alpha: 0,
            angle: Phaser.Math.Between(-45, 45),
            duration: 600,
            delay: Phaser.Math.Between(0, 300),
            onComplete: () => el.destroy()
          })
        }
      })

      // Käfig-Decke fliegt weg
      this.tweens.add({
        targets: kaefigDecke,
        y: kaefigDecke.y - 40,
        alpha: 0,
        duration: 600
      })

      // 🐕 Bello ist frei! Springt raus!
      this.time.delayedCall(800, () => {
        soundHundFreut()
        soundBellen()

        // 🐕 Bello springt freudig!
        this.tweens.add({
          targets: belloImKaefig,
          y: belloImKaefig.y - 30,
          duration: 300,
          yoyo: true,
          repeat: 3
        })

        const frei = this.add.text(breite / 2, hoehe * 0.15,
          '🐕 BELLO IST FREI! 🎉\n"Wuff wuff wuuuff!"\nEr springt vor Freude! 💕', {
            fontSize: '20px', fontFamily: 'Arial', color: '#FFD700',
            stroke: '#000000', strokeThickness: 5, align: 'center',
            backgroundColor: '#00000088', padding: { x: 16, y: 12 }
          })
        frei.setOrigin(0.5).setScrollFactor(0).setDepth(380)

        // 🎊 Konfetti in der Stadt!
        const farben = [0xFF0000, 0xFF9800, 0xFFEB3B, 0x4CAF50, 0x2196F3, 0x9C27B0]
        for (let i = 0; i < 30; i++) {
          const sx = Phaser.Math.Between(0, breite)
          const farbe = Phaser.Math.RND.pick(farben)
          const stern = this.add.star(sx, -20, 5, 4, 8, farbe)
          stern.setScrollFactor(0).setDepth(400)
          this.tweens.add({
            targets: stern,
            y: hoehe + 20,
            x: sx + Phaser.Math.Between(-60, 60),
            angle: Phaser.Math.Between(0, 360),
            duration: Phaser.Math.Between(1500, 3000),
            delay: Phaser.Math.Between(0, 800),
            onComplete: () => stern.destroy()
          })
        }

        // 🚁 Nach 3 Sek: Zurückfliegen!
        this.time.delayedCall(3500, () => {
          frei.destroy()

          const zurueck = this.add.text(breite / 2, hoehe * 0.15,
            '🚁 Bello springt in den Heli!\n✈️ Ihr fliegt zusammen nach Hause! 💕', {
              fontSize: '18px', fontFamily: 'Arial', color: '#FFFFFF',
              stroke: '#000000', strokeThickness: 4, align: 'center',
              backgroundColor: '#00000088', padding: { x: 12, y: 8 }
            })
          zurueck.setOrigin(0.5).setScrollFactor(0).setDepth(380)

          soundHeli()

          // 🖤 Übergang zurück
          const zurueckUebergang = this.add.rectangle(breite / 2, hoehe / 2, breite, hoehe, 0x000000, 0)
          zurueckUebergang.setScrollFactor(0).setDepth(390)

          this.time.delayedCall(2500, () => {
            zurueck.destroy()

            this.tweens.add({
              targets: zurueckUebergang,
              alpha: 1,
              duration: 1500,
              onComplete: () => {
                // 🗑️ Alle Stadt-Elemente weg!
                stadtElemente.forEach(el => {
                  if (el && el.destroy) el.destroy()
                })
                belloImKaefig.destroy()

                // 🌙 Zurück auf der Wiese!
                this.tweens.add({
                  targets: zurueckUebergang,
                  alpha: 0,
                  duration: 1500,
                  delay: 500,
                  onComplete: () => {
                    zurueckUebergang.destroy()

                    // 🐕 Bello ist jetzt bei dir!
                    hausDaten.hundGerettet = true
                    spielSpeichern('BlumenwiesenSpiel', this.figurDaten, {
                      x: this.spieler.x, y: this.spieler.y
                    })
                    this.erstelleHund()
                    this.konfetti()
                    this.zeigeNachricht('🐕 Bello ist jetzt für immer bei dir! 💕')
                  }
                })
              }
            })
          })
        })
      })
    })
  }

  // === 🚁 HELIKOPTER MALEN ===
  maleHeli(x, y) {
    const heli = this.add.container(x, y)

    // 🚁 Körper
    const koerper = this.add.ellipse(0, 0, 80, 35, 0xE53935)
    heli.add(koerper)
    // 🪟 Fenster
    const fenster = this.add.ellipse(-15, -5, 22, 18, 0xBBDEFB)
    heli.add(fenster)
    // Schwanz
    const schwanz = this.add.rectangle(50, -5, 30, 8, 0xC62828)
    heli.add(schwanz)
    // Heck-Rotor (klein)
    const heckRotor = this.add.rectangle(65, -12, 4, 18, 0x424242)
    heli.add(heckRotor)
    // Kufen (Landung)
    const kufeL = this.add.rectangle(-15, 20, 50, 3, 0x424242)
    heli.add(kufeL)
    const kufeR = this.add.rectangle(15, 20, 50, 3, 0x424242)
    heli.add(kufeR)
    const stuetzeL = this.add.rectangle(-10, 15, 3, 12, 0x424242)
    heli.add(stuetzeL)
    const stuetzeR = this.add.rectangle(10, 15, 3, 12, 0x424242)
    heli.add(stuetzeR)

    // 🔄 Rotor dreht sich!
    const rotor = this.add.rectangle(0, -20, 120, 4, 0x616161)
    heli.add(rotor)
    this.tweens.add({
      targets: rotor,
      scaleX: { from: 1, to: -1 },
      duration: 150,
      yoyo: true,
      repeat: -1
    })

    // ✨ Rettungs-Kreuz
    const kreuz1 = this.add.rectangle(20, 0, 10, 3, 0xFFFFFF)
    heli.add(kreuz1)
    const kreuz2 = this.add.rectangle(20, 0, 3, 10, 0xFFFFFF)
    heli.add(kreuz2)

    return heli
  }

  // === 🐕 HUND ERSTELLEN ===
  // Ein süßer kleiner Hund der alleine über die Wiese läuft!
  erstelleHund() {
    // 🐕 Bello spawnt an einem zufälligen Ort auf der Wiese!
    const weltBreite = this.weltBreite || this.scale.width * 2
    const hoehe = this.scale.height
    const startX = Phaser.Math.Between(100, weltBreite - 100)
    const startY = Phaser.Math.Between(this.wiesenY + 20, hoehe - 40)

    const hund = this.add.container(startX, startY)

    // 🐕 Körper (braun)
    const koerper = this.add.ellipse(0, 4, 24, 14, 0x8D6E63)
    hund.add(koerper)
    // 🐕 Kopf
    const kopf = this.add.circle(-10, -4, 8, 0xA1887F)
    hund.add(kopf)
    // 🐕 Schnauze
    const schnauze = this.add.ellipse(-15, -2, 6, 4, 0xD7CCC8)
    hund.add(schnauze)
    // 🐕 Nase
    const nase = this.add.circle(-17, -3, 1.5, 0x333333)
    hund.add(nase)
    // 🐕 Augen
    const auge = this.add.circle(-8, -6, 1.5, 0x333333)
    hund.add(auge)
    // 🐕 Ohren (süße Schlappohren!)
    const ohrL = this.add.ellipse(-14, -9, 5, 8, 0x6D4C41)
    ohrL.setAngle(-20)
    hund.add(ohrL)
    const ohrR = this.add.ellipse(-6, -10, 5, 8, 0x6D4C41)
    ohrR.setAngle(20)
    hund.add(ohrR)
    // 🐕 Beine
    const beinVL = this.add.rectangle(-6, 13, 3, 8, 0x795548)
    hund.add(beinVL)
    const beinVR = this.add.rectangle(0, 13, 3, 8, 0x795548)
    hund.add(beinVR)
    const beinHL = this.add.rectangle(8, 13, 3, 8, 0x795548)
    hund.add(beinHL)
    const beinHR = this.add.rectangle(14, 13, 3, 8, 0x795548)
    hund.add(beinHR)
    // 🐕 Schwanz (wedelt!)
    const schwanz = this.add.rectangle(14, -2, 3, 10, 0x8D6E63)
    schwanz.setAngle(-30)
    hund.add(schwanz)

    hund.setDepth(46)

    // 🐕 Schwanz wedelt!
    this.tweens.add({
      targets: schwanz,
      angle: { from: -40, to: 40 },
      duration: 300,
      yoyo: true,
      repeat: -1
    })

    // 🏷️ Name
    const name = this.add.text(0, -20, '🐕 Bello', {
      fontSize: '9px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5)
    hund.add(name)

    this.hund = hund
    this.hundFolgt = false
    this.hundZielX = null
    this.hundZielY = null
    this.hundWartet = false

    // 🐕 Bello antippbar machen! Klick-Bereich ist der Körper
    koerper.setInteractive({ useHandCursor: true })
    kopf.setInteractive({ useHandCursor: true })

    // 🐾 Verschiedene Bell-Sprüche!
    const bellSprueche = [
      '🐕 Wuff wuff!',
      '🐶 Wau wau!',
      '🐕 Wuff!',
      '🐶 WUUUFF!',
      '🐕 Hechel hechel! 😛',
      '🐶 *schwanzwedel* 💕',
      '🐕 Wuff wau wuff!',
      '🐶 Jauuul! 🎵',
      '🐕 *schleck schleck* 😋',
      '🐶 Wiff! Wiff!',
    ]

    // 🐕 Bello-Bell-Funktion (zeigt Sprechblase + Sound)
    const belloMachtWuff = () => {
      if (!this.hund || !this.hund.active) return
      soundBellen()
      // 💬 Zufälliger Bell-Spruch über Bello!
      const spruch = Phaser.Math.RND.pick(bellSprueche)
      const wuff = this.add.text(this.hund.x, this.hund.y - 35, spruch, {
        fontSize: '13px', fontFamily: 'Arial', color: '#ffffff',
        stroke: '#000000', strokeThickness: 3,
        backgroundColor: '#5D403799', padding: { x: 6, y: 3 }
      }).setOrigin(0.5).setDepth(100)
      // 💬 Sprechblase schwebt hoch und verschwindet!
      this.tweens.add({
        targets: wuff,
        y: wuff.y - 25,
        alpha: 0,
        duration: 2000,
        delay: 1000,
        onComplete: () => wuff.destroy()
      })
    }

    // 🐾 Wenn man auf Bello tippt: Er bellt und hüpft!
    const belloAngetippt = () => {
      belloMachtWuff()
      // 🐕 Bello hüpft vor Freude!
      this.tweens.add({
        targets: hund,
        y: hund.y - 15,
        duration: 200,
        yoyo: true,
        ease: 'Quad.easeOut'
      })
    }
    koerper.on('pointerdown', belloAngetippt)
    kopf.on('pointerdown', belloAngetippt)

    // 🐕 Bello läuft nach 2 Sekunden los!
    this.time.delayedCall(2000, () => {
      this.setzeBelloNeuesZiel()
    })

    // 🔊 Bello bellt auch von alleine! (alle 10-20 Sekunden zufällig)
    this.time.addEvent({
      delay: Phaser.Math.Between(10000, 20000),
      loop: true,
      callback: () => {
        belloMachtWuff()
      }
    })
  }

  // === 🐾 WELPEN-GEBURT! Bello bekommt Babys! ===
  welpenGeburt() {
    hausDaten.welpenGeboren = true
    spielSpeichern('BlumenwiesenSpiel', this.figurDaten, {
      x: this.spieler.x, y: this.spieler.y
    })

    // 📢 Bello bellt aufgeregt!
    soundBellen()

    // 🐕 Kamera schwenkt zu Bello
    if (this.hund && this.hund.active) {
      this.cameras.main.stopFollow()
      this.cameras.main.pan(this.hund.x, this.hund.y, 800)
    }

    // 🐾 Nachricht!
    this.time.delayedCall(1000, () => {
      const breite = this.scale.width
      const hoehe = this.scale.height

      const nachricht = this.add.text(breite / 2, hoehe * 0.2,
        '🐾 OH! Bello hat Babys!! 🐾', {
        fontSize: '24px', fontFamily: 'Arial', color: '#FFD700',
        stroke: '#000000', strokeThickness: 5,
        backgroundColor: '#5D4037CC', padding: { x: 16, y: 10 }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(300)

      this.tweens.add({
        targets: nachricht,
        scale: { from: 0.3, to: 1 },
        duration: 600,
        ease: 'Back.easeOut'
      })

      // 🎉 Konfetti!
      this.time.delayedCall(500, () => this.konfetti())

      // 🐶 Welpen erscheinen!
      this.time.delayedCall(1500, () => {
        this.erstelleWelpen()
        soundBellen()

        const nachricht2 = this.add.text(breite / 2, hoehe * 0.35,
          '🐶 3 kleine Welpen! Wie süß!! 🥰', {
          fontSize: '20px', fontFamily: 'Arial', color: '#ffffff',
          stroke: '#000000', strokeThickness: 4,
          backgroundColor: '#8D6E6399', padding: { x: 12, y: 8 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(300)

        // Alles ausblenden
        this.time.delayedCall(4000, () => {
          this.tweens.add({
            targets: [nachricht, nachricht2],
            alpha: 0,
            duration: 800,
            onComplete: () => {
              nachricht.destroy()
              nachricht2.destroy()
            }
          })
          this.cameras.main.startFollow(this.spieler, true, 0.1, 0.1)
        })
      })
    })
  }

  // === 🐶 WELPEN ERSTELLEN (3 kleine Hundebabys!) ===
  erstelleWelpen() {
    this.welpen = []

    // 🎨 Jeder Welpe hat eine andere Farbe!
    const welpenFarben = [
      { koerper: 0xBCAAA4, kopf: 0xD7CCC8, name: 'Flecki' },   // 🪶 hellbraun
      { koerper: 0x5D4037, kopf: 0x6D4C41, name: 'Schoki' },    // 🟤 dunkelbraun
      { koerper: 0xFFCC80, kopf: 0xFFE0B2, name: 'Sunny' }      // 🟡 goldgelb
    ]

    const hundX = this.hund ? this.hund.x : this.spieler.x + 40
    const hundY = this.hund ? this.hund.y : this.spieler.y + 10

    welpenFarben.forEach((farbe, i) => {
      // Etwas versetzt hinter dem Hund starten
      const startX = hundX + 20 + i * 15
      const startY = hundY + 5 + i * 5

      const welpe = this.add.container(startX, startY)

      // 🐶 Kleiner Körper
      const koerper = this.add.ellipse(0, 2, 16, 9, farbe.koerper)
      welpe.add(koerper)
      // 🐶 Kleiner Kopf
      const kopf = this.add.circle(-6, -2, 5.5, farbe.kopf)
      welpe.add(kopf)
      // 🐶 Schnauze
      const schnauze = this.add.ellipse(-9, -1, 4, 3, 0xEFEBE9)
      welpe.add(schnauze)
      // 🐶 Nase
      const nase = this.add.circle(-10, -1.5, 1, 0x333333)
      welpe.add(nase)
      // 🐶 Augen (große Kulleraugen!)
      const auge = this.add.circle(-5, -4, 1.5, 0x333333)
      welpe.add(auge)
      // Glänzende Augen!
      const glanz = this.add.circle(-4.5, -4.5, 0.5, 0xFFFFFF)
      welpe.add(glanz)
      // 🐶 Ohren (noch süßer als bei Bello!)
      const ohrL = this.add.ellipse(-9, -5, 4, 6, 0x5D4037)
      ohrL.setAngle(-25)
      welpe.add(ohrL)
      const ohrR = this.add.ellipse(-3, -6, 4, 6, 0x5D4037)
      ohrR.setAngle(25)
      welpe.add(ohrR)
      // 🐶 Beinchen (ganz kurz!)
      welpe.add(this.add.rectangle(-4, 8, 2, 5, 0x795548))
      welpe.add(this.add.rectangle(0, 8, 2, 5, 0x795548))
      welpe.add(this.add.rectangle(5, 8, 2, 5, 0x795548))
      welpe.add(this.add.rectangle(9, 8, 2, 5, 0x795548))
      // 🐶 Schwanz (wedelt schneller als bei Bello!)
      const schwanz = this.add.rectangle(10, -1, 2, 7, farbe.koerper)
      schwanz.setAngle(-30)
      welpe.add(schwanz)

      welpe.setDepth(46)
      welpe.setScale(0.85)

      // 🐶 Schwanz wedelt ganz schnell!
      this.tweens.add({
        targets: schwanz,
        angle: { from: -50, to: 50 },
        duration: 200,
        yoyo: true,
        repeat: -1
      })

      // 🏷️ Name über dem Welpen
      const nameTag = this.add.text(0, -14, `🐶 ${farbe.name}`, {
        fontSize: '7px', fontFamily: 'Arial', color: '#ffffff',
        stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5)
      welpe.add(nameTag)

      // 🎉 Welpe hüpft rein!
      welpe.setScale(0)
      this.tweens.add({
        targets: welpe,
        scale: 0.85,
        duration: 500,
        delay: i * 300,
        ease: 'Back.easeOut'
      })

      this.welpen.push(welpe)
    })

    // 🐶 Welpen fiepen ab und zu! (alle 12-20 Sekunden)
    this.time.addEvent({
      delay: 12000,
      loop: true,
      callback: () => {
        if (!this.welpen || this.welpen.length === 0) return
        // Zufälliger Welpe fiept!
        const welpe = Phaser.Math.RND.pick(this.welpen)
        if (welpe && welpe.active) {
          soundBellen()
          const fiep = this.add.text(welpe.x, welpe.y - 20, '🐶 Wuff!', {
            fontSize: '10px', fontFamily: 'Arial', color: '#FFE0B2',
            stroke: '#000000', strokeThickness: 2,
            backgroundColor: '#5D403788', padding: { x: 3, y: 1 }
          }).setOrigin(0.5).setDepth(100)
          this.tweens.add({
            targets: fiep,
            y: fiep.y - 15,
            alpha: 0,
            duration: 1200,
            delay: 600,
            onComplete: () => fiep.destroy()
          })
        }
      }
    })
  }

  // === 🎊 KONFETTI ===
  konfetti() {
    // 🔊 Jubel-Sound!
    soundKonfetti()
    const farben = [0xFF0000, 0xFF9800, 0xFFEB3B, 0x4CAF50, 0x2196F3, 0x9C27B0, 0xE91E63]
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(0, this.scale.width)
      const farbe = Phaser.Math.RND.pick(farben)
      const stern = this.add.star(x, -20, 5, 4, 8, farbe)
      stern.setScrollFactor(0).setDepth(400)
      this.tweens.add({
        targets: stern,
        y: this.scale.height + 20,
        x: x + Phaser.Math.Between(-80, 80),
        angle: Phaser.Math.Between(0, 360),
        duration: Phaser.Math.Between(2000, 4000),
        delay: Phaser.Math.Between(0, 1500),
        onComplete: () => stern.destroy()
      })
    }
  }

  // =============================================================
  // 🏘️ DORF-FREUNDE – Deine Freunde aus der Stadt ziehen ins Dorf!
  // Sie sammeln Material und bauen sich ein eigenes Haus! 🏡
  // =============================================================

  erstelleDorfFreunde() {
    if (!hausDaten.stadtFreunde || hausDaten.stadtFreunde.length === 0) return
    if (!this.hausGebaut) return // 🏠 Erst wenn du ein Haus hast!

    this.dorfFreundeListe = []

    // 🏘️ Positionen für die Freunde-Häuser berechnen!
    // ⚠️ Wir müssen aufpassen, dass sie sich nicht mit dem
    // Spieler-Haus und Milos Haus überschneiden!
    const weltBreite = this.weltBreite || this.scale.width * 2
    const spielerHausX = this.hausPosition ? this.hausPosition.x : this.scale.width / 2 + 80
    const miloHausX = this.freundHausPosition ? this.freundHausPosition.x : spielerHausX + 180

    // 📏 Freie Plätze finden! (mindestens 140px Abstand zu jedem Haus)
    const hausPlaetze = []
    const hausBreite = 140 // 🏡 So viel Platz braucht ein Haus
    const belegteZonen = [
      { von: spielerHausX - 80, bis: spielerHausX + 80 },  // 🏠 Dein Haus
      { von: miloHausX - 70, bis: miloHausX + 70 }         // 🏡 Milos Haus
    ]

    // 📍 Mögliche Plätze durchgehen (von links nach rechts!)
    const moeglichePlaetze = [100, 280, 460, 820, 1000, 1180, 1350]
    for (const px of moeglichePlaetze) {
      if (hausPlaetze.length >= 4) break // 🏡 Maximal 4 Häuser!

      // 🔍 Prüfen ob der Platz frei ist!
      const istFrei = !belegteZonen.some(zone =>
        px + 50 > zone.von && px - 50 < zone.bis
      )

      if (istFrei && px > 40 && px < weltBreite - 40) {
        hausPlaetze.push({ x: px, y: this.wiesenY + 30 })
        // 📏 Diesen Platz auch als belegt markieren!
        belegteZonen.push({ von: px - 60, bis: px + 60 })
      }
    }

    // 🌟 Infos über jeden Freund (Aussehen + Farben)
    const freundInfos = {
      'Lina': {
        emoji: '🌸', hautfarbe: 0xFFDBAC, haarfarbe: 0x8D6E63, haarStil: 1,
        kleidungFarbe: 0xE91E63, kleidungTyp: 1, hosenFarbe: 0xE91E63, schuhFarbe: 0xF48FB1,
        hausFarbe: 0xF48FB1, dachFarbe: 0xE91E63,
        sprueche: ['🌸 Ich suche Holz!', '🌷 Oh, ein Stein!', '🏡 Bald habe ich ein Haus!', '🌻 Das Dorf ist so schön!']
      },
      'Finn': {
        emoji: '🎨', hautfarbe: 0xD2A67A, haarfarbe: 0x333333, haarStil: 0,
        kleidungFarbe: 0x2196F3, kleidungTyp: 2, hosenFarbe: 0x37474F, schuhFarbe: 0xFF5722,
        hausFarbe: 0x64B5F6, dachFarbe: 0x1565C0,
        sprueche: ['🎨 Holz gefunden!', '🖌️ Noch mehr Steine!', '🏡 Mein Haus wird bunt!', '✏️ Ich mal mein Haus an!']
      },
      'Nora': {
        emoji: '🎵', hautfarbe: 0x8D5524, haarfarbe: 0x1A1A1A, haarStil: 2,
        kleidungFarbe: 0x9C27B0, kleidungTyp: 0, hosenFarbe: 0x1565C0, schuhFarbe: 0xFFEB3B,
        hausFarbe: 0xCE93D8, dachFarbe: 0x7B1FA2,
        sprueche: ['🎵 La la la! Holz!', '🎤 Ein Stein zum Bauen!', '🏡 Bald kann ich zuhause singen!', '🎶 Do Re Mi!']
      },
      'Max': {
        emoji: '🍪', hautfarbe: 0xFFE0BD, haarfarbe: 0xFFD54F, haarStil: 0,
        kleidungFarbe: 0xFF9800, kleidungTyp: 0, hosenFarbe: 0x5D4037, schuhFarbe: 0x4CAF50,
        hausFarbe: 0xFFCC80, dachFarbe: 0xF57F17,
        sprueche: ['🍪 Holz fürs Haus!', '🧁 Steine sammeln!', '🏡 Bald backe ich zuhause!', '🍕 Erst bauen, dann kochen!']
      }
    }

    // 🧑‍🤝‍🧑 Für jeden befreundeten Freund eine Figur erstellen!
    hausDaten.stadtFreunde.forEach((name, index) => {
      const info = freundInfos[name]
      if (!info) return

      // 📦 Dorf-Freund Daten initialisieren (falls noch nicht vorhanden)
      if (!hausDaten.dorfFreunde[name]) {
        hausDaten.dorfFreunde[name] = { holz: 0, stein: 0, hausGebaut: false }
      }

      const daten = hausDaten.dorfFreunde[name]
      const hausPlatz = hausPlaetze[index] || { x: 300 + index * 300, y: this.wiesenY + 30 }

      // 🏡 Haus malen wenn schon gebaut!
      if (daten.hausGebaut) {
        this.maleDorfFreundHaus(hausPlatz.x, hausPlatz.y, info.hausFarbe, info.dachFarbe, name, info.emoji)
      }

      // 🧑 Figur erstellen!
      const startX = daten.hausGebaut ? hausPlatz.x + 30 : Phaser.Math.Between(100, this.weltBreite - 100)
      const startY = this.wiesenY + Phaser.Math.Between(30, 80)

      const container = this.add.container(startX, startY)

      // 🎨 Figur malen mit maleFigur()!
      const figurDaten = {
        hautfarbe: info.hautfarbe,
        haarfarbe: info.haarfarbe,
        haarStil: info.haarStil,
        kleidungFarbe: info.kleidungFarbe,
        kleidungTyp: info.kleidungTyp,
        hosenFarbe: info.hosenFarbe,
        schuhFarbe: info.schuhFarbe
      }
      maleFigur(this, container, figurDaten, 0.6)

      // 🏷️ Name + Emoji über dem Kopf
      const nameText = this.add.text(0, -45, `${info.emoji} ${name}`, {
        fontSize: '10px', fontFamily: 'Arial', color: '#FFD700',
        stroke: '#000000', strokeThickness: 3
      }).setOrigin(0.5)
      container.add(nameText)

      // 📦 Material-Anzeige unter dem Namen (nur wenn noch am Sammeln!)
      let materialText = null
      if (!daten.hausGebaut) {
        materialText = this.add.text(0, -35, `🪵${daten.holz}/5 🪨${daten.stein}/3`, {
          fontSize: '8px', fontFamily: 'Arial', color: '#ffffff',
          stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5)
        container.add(materialText)
      }

      container.setDepth(44)

      // 📋 Freund-Objekt merken!
      const freundObj = {
        name: name,
        info: info,
        container: container,
        materialText: materialText,
        hausPlatz: hausPlatz,
        zielX: null,
        zielY: null,
        wartet: false,
        sammelt: false,
        naechstesSammeln: this.time.now + Phaser.Math.Between(3000, 8000)
      }

      this.dorfFreundeListe.push(freundObj)

      // 🚶 Erstes Ziel setzen!
      if (!daten.hausGebaut) {
        this.time.delayedCall(Phaser.Math.Between(1000, 3000), () => {
          this.setzeDorfFreundZiel(freundObj)
        })
      } else {
        // 🏡 Haus ist gebaut – Freund läuft gemütlich herum
        this.time.delayedCall(Phaser.Math.Between(2000, 5000), () => {
          this.setzeDorfFreundZiel(freundObj)
        })
      }
    })
  }

  // 🚶 DORF-FREUND BEKOMMT EIN NEUES ZIEL!
  setzeDorfFreundZiel(freund) {
    if (!freund.container || !freund.container.active) return

    const daten = hausDaten.dorfFreunde[freund.name]
    const hoehe = this.scale.height
    const weltBreite = this.weltBreite || this.scale.width * 2

    if (!daten.hausGebaut) {
      // 🔍 Zum nächsten Baum oder Stein laufen um Material zu sammeln!
      // Manchmal zufällig, manchmal gezielt!
      if (Math.random() < 0.4 && this.baeume && this.baeume.length > 0 && daten.holz < 5) {
        // 🌳 Zu einem Baum laufen!
        const baum = Phaser.Math.RND.pick(this.baeume)
        if (baum && baum.active) {
          freund.zielX = baum.x + Phaser.Math.Between(-20, 20)
          freund.zielY = baum.y + 30
          return
        }
      }
      if (Math.random() < 0.4 && this.steine && this.steine.length > 0 && daten.stein < 3) {
        // 🪨 Zu einem Stein laufen!
        const stein = Phaser.Math.RND.pick(this.steine)
        if (stein && stein.active) {
          freund.zielX = stein.x + Phaser.Math.Between(-20, 20)
          freund.zielY = stein.y + 20
          return
        }
      }
    }

    // 🎲 Zufällig herumlaufen
    freund.zielX = Phaser.Math.Between(50, weltBreite - 50)
    freund.zielY = Phaser.Math.Between(this.wiesenY + 20, hoehe - 40)
  }

  // 🔄 DORF-FREUNDE AKTUALISIEREN (wird in update() aufgerufen!)
  aktualisiereDorfFreunde() {
    if (!this.dorfFreundeListe || this.dorfFreundeListe.length === 0) return

    const jetzt = this.time.now

    this.dorfFreundeListe.forEach(freund => {
      if (!freund.container || !freund.container.active) return
      if (freund.sammelt) return // ⏳ Wartet noch beim Sammeln

      const daten = hausDaten.dorfFreunde[freund.name]

      // 🚶 Zum Ziel laufen
      if (freund.zielX !== null && freund.zielY !== null) {
        const abstand = Phaser.Math.Distance.Between(
          freund.container.x, freund.container.y,
          freund.zielX, freund.zielY
        )

        if (abstand > 8) {
          // 🚶 Zum Ziel bewegen!
          const winkel = Phaser.Math.Angle.Between(
            freund.container.x, freund.container.y,
            freund.zielX, freund.zielY
          )
          freund.container.x += Math.cos(winkel) * 0.5
          freund.container.y += Math.sin(winkel) * 0.5
        } else {
          // ✅ Angekommen!
          freund.zielX = null
          freund.zielY = null

          // 📦 Material sammeln? (nur wenn Haus noch nicht gebaut!)
          if (!daten.hausGebaut && jetzt > freund.naechstesSammeln) {
            this.dorfFreundSammelt(freund)
          } else if (!freund.wartet) {
            // ⏳ Kurz warten, dann neues Ziel
            freund.wartet = true
            const wartezeit = Phaser.Math.Between(2000, 5000)
            this.time.delayedCall(wartezeit, () => {
              freund.wartet = false
              this.setzeDorfFreundZiel(freund)
            })
          }
        }
      } else if (!freund.wartet) {
        // 🎯 Kein Ziel? Neues setzen!
        freund.wartet = true
        this.time.delayedCall(Phaser.Math.Between(1500, 4000), () => {
          freund.wartet = false
          this.setzeDorfFreundZiel(freund)
        })
      }
    })
  }

  // 📦 DORF-FREUND SAMMELT MATERIAL!
  dorfFreundSammelt(freund) {
    const daten = hausDaten.dorfFreunde[freund.name]
    freund.sammelt = true

    // 🎲 Was wird gesammelt? Holz oder Stein?
    let typ = ''
    let emoji = ''
    if (daten.holz < 5 && daten.stein < 3) {
      typ = Math.random() < 0.6 ? 'holz' : 'stein'
    } else if (daten.holz < 5) {
      typ = 'holz'
    } else if (daten.stein < 3) {
      typ = 'stein'
    } else {
      // ✅ Genug Material! Haus bauen!
      freund.sammelt = false
      this.dorfFreundBautHaus(freund)
      return
    }

    emoji = typ === 'holz' ? '🪵' : '🪨'

    // 🔨 Sammel-Animation!
    // Figur wippt hoch und runter (arbeitet!)
    this.tweens.add({
      targets: freund.container,
      y: freund.container.y - 5,
      duration: 200,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        // ✅ Material eingesammelt!
        daten[typ] += 1

        // 🔊 Sound!
        if (typ === 'holz') {
          soundHolzHacken()
        } else {
          soundSteinKlopfen()
        }

        // 💬 Spruch anzeigen!
        const spruchIdx = Phaser.Math.Between(0, freund.info.sprueche.length - 1)
        const spruch = this.add.text(
          freund.container.x, freund.container.y - 60,
          `${emoji}+1! ${freund.info.sprueche[spruchIdx]}`, {
            fontSize: '11px', fontFamily: 'Arial', color: '#FFD700',
            stroke: '#000000', strokeThickness: 3,
            align: 'center'
          }
        ).setOrigin(0.5).setDepth(200)
        this.tweens.add({
          targets: spruch,
          alpha: 0, y: spruch.y - 30,
          duration: 1500, delay: 800,
          onComplete: () => spruch.destroy()
        })

        // 📦 Material-Anzeige aktualisieren!
        if (freund.materialText) {
          freund.materialText.setText(`🪵${daten.holz}/5 🪨${daten.stein}/3`)
        }

        // 💾 Speichern!
        spielSpeichern('BlumenwiesenSpiel', this.figurDaten, {
          x: this.spieler.x, y: this.spieler.y
        })

        // ⏳ Nächstes Sammeln planen
        freund.naechstesSammeln = this.time.now + Phaser.Math.Between(5000, 12000)
        freund.sammelt = false

        // 🏡 Genug Material? → Haus bauen!
        if (daten.holz >= 5 && daten.stein >= 3) {
          this.time.delayedCall(2000, () => {
            this.dorfFreundBautHaus(freund)
          })
        } else {
          // 🎯 Neues Ziel nach kurzer Pause
          this.time.delayedCall(Phaser.Math.Between(2000, 4000), () => {
            this.setzeDorfFreundZiel(freund)
          })
        }
      }
    })
  }

  // 🏡 DORF-FREUND BAUT SEIN HAUS!
  dorfFreundBautHaus(freund) {
    const daten = hausDaten.dorfFreunde[freund.name]
    if (daten.hausGebaut) return // Schon gebaut!

    const hausPlatz = freund.hausPlatz

    // 🏗️ Freund läuft zum Bauplatz!
    this.tweens.add({
      targets: freund.container,
      x: hausPlatz.x + 30,
      y: hausPlatz.y + 20,
      duration: 2000,
      ease: 'Linear',
      onComplete: () => {
        // 🔨 Bau-Animation!
        const bauText = this.add.text(
          hausPlatz.x, hausPlatz.y - 60,
          `🔨 ${freund.info.emoji} ${freund.name} baut ein Haus! 🏗️`, {
            fontSize: '14px', fontFamily: 'Arial', color: '#FFD700',
            stroke: '#000000', strokeThickness: 4,
            align: 'center', backgroundColor: '#333333',
            padding: { x: 10, y: 6 }
          }
        ).setOrigin(0.5).setDepth(200)

        // 🔨 Hämmern! (Figur wippt hin und her)
        this.tweens.add({
          targets: freund.container,
          y: freund.container.y - 3,
          duration: 150,
          yoyo: true,
          repeat: 10,
          onComplete: () => {
            bauText.destroy()

            // 🏡 Haus malen!
            daten.hausGebaut = true
            this.maleDorfFreundHaus(
              hausPlatz.x, hausPlatz.y,
              freund.info.hausFarbe, freund.info.dachFarbe,
              freund.name, freund.info.emoji
            )

            // 🔊 Haus gebaut Sound!
            soundHausGebaut()

            // 🎉 Konfetti!
            this.konfetti()

            // 🎉 Jubel-Nachricht!
            const jubel = this.add.text(
              this.scale.width / 2, this.scale.height * 0.2,
              `🏡 ${freund.info.emoji} ${freund.name} hat ein Haus gebaut! 🎉\n⭐ Willkommen im Dorf! ⭐`, {
                fontSize: '18px', fontFamily: 'Arial', color: '#FFD700',
                stroke: '#000000', strokeThickness: 4,
                align: 'center', backgroundColor: '#00000088',
                padding: { x: 16, y: 12 }
              }
            ).setOrigin(0.5).setScrollFactor(0).setDepth(300)

            this.time.delayedCall(3000, () => {
              jubel.destroy()
            })

            // 📦 Material-Anzeige weg!
            if (freund.materialText) {
              freund.materialText.destroy()
              freund.materialText = null
            }

            // 💾 Speichern!
            spielSpeichern('BlumenwiesenSpiel', this.figurDaten, {
              x: this.spieler.x, y: this.spieler.y
            })

            // 🚶 Freund läuft jetzt gemütlich herum
            this.time.delayedCall(3000, () => {
              this.setzeDorfFreundZiel(freund)
            })
          }
        })
      }
    })
  }

  // 🏡 DORF-FREUND-HAUS MALEN! (kleines Häuschen)
  maleDorfFreundHaus(x, y, wandFarbe, dachFarbe, name, emoji) {
    // 🪨 Fundament
    this.add.rectangle(x, y - 5, 90, 7, 0x757575).setDepth(50)
    // 🪵 Wände
    this.add.rectangle(x, y - 40, 70, 60, wandFarbe).setDepth(50)
    // 🏠 Dach
    const dach = this.add.graphics()
    dach.fillStyle(dachFarbe, 1)
    dach.fillTriangle(x - 45, y - 70, x + 45, y - 70, x, y - 100)
    dach.setDepth(50)
    // 🚪 Tür
    this.add.rectangle(x - 8, y - 18, 14, 26, 0x4E342E).setDepth(51)
    this.add.circle(x - 3, y - 18, 2, 0xFFD700).setDepth(52)
    // 🪟 Fenster
    this.add.rectangle(x + 14, y - 40, 14, 14, 0xBBDEFB).setDepth(51)
    this.add.rectangle(x + 14, y - 40, 14, 2, 0x795548).setDepth(52)
    this.add.rectangle(x + 14, y - 40, 2, 14, 0x795548).setDepth(52)
    // 🌼 Blumen neben dem Haus
    this.maleGaensebluemchen(x - 50, y - 5)
    this.maleGaensebluemchen(x + 50, y - 5)
    // 🏷️ Name
    this.add.text(x, y + 10, `${emoji} ${name}`, {
      fontSize: '9px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(53)
  }
}

export default BlumenwiesenSpiel
