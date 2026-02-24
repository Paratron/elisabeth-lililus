import Phaser from 'phaser'
import { rucksack, hausDaten, spielSpeichern } from '../state.js'
import { soundMine, soundSteinKlopfen, soundEinsammeln, soundGraben, soundBefreit } from '../sounds.js'
import { maleFigur } from '../figur.js'

// =============================================================
// === ⛏️ MINEN-SZENE ===
// =============================================================
class MinenSzene extends Phaser.Scene {
  constructor() {
    super('MinenSzene')
  }

  preload() {}

  create(figurDaten) {
    this.figurDaten = figurDaten
    this.rucksack = rucksack // 🎒 Gleicher Rucksack wie überall!

    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🌑 Dunkler Hintergrund (unter der Erde!)
    this.cameras.main.setBackgroundColor('#2D2D2D')

    // Steinwände malen
    const wand = this.add.graphics()
    // Boden
    wand.fillStyle(0x4E342E)
    wand.fillRect(0, hoehe - 40, breite, 40)
    // Wände links und rechts
    wand.fillStyle(0x5D4037)
    wand.fillRect(0, 0, 30, hoehe)
    wand.fillRect(breite - 30, 0, 30, hoehe)
    // Decke
    wand.fillStyle(0x3E2723)
    wand.fillRect(0, 0, breite, 40)

    // 🪨 Steine in den Wänden (Dekoration)
    for (let i = 0; i < 12; i++) {
      const sx = Phaser.Math.Between(40, breite - 40)
      const sy = Phaser.Math.Between(45, hoehe - 50)
      this.add.circle(sx, sy, Phaser.Math.Between(3, 8), 0x616161).setAlpha(0.4)
    }

    // 💡 Fackeln
    this.add.text(50, 80, '🔥', { fontSize: '24px' })
    this.add.text(breite - 70, 80, '🔥', { fontSize: '24px' })
    this.add.text(breite / 2, 55, '🔥', { fontSize: '24px' })

    // ⚙️ Eisenerz-Brocken an den Wänden
    this.eisenBrocken = []
    this.erstelleEisenBrocken(120, 120)
    this.erstelleEisenBrocken(300, 180)
    this.erstelleEisenBrocken(500, 140)
    this.erstelleEisenBrocken(650, 200)
    this.erstelleEisenBrocken(200, 280)
    this.erstelleEisenBrocken(450, 300)
    this.erstelleEisenBrocken(600, 330)

    // 🧑 Spieler
    this.spieler = this.erstelleSpieler(breite / 2, hoehe - 100)

    // 🎒 Rucksack-Anzeige
    this.rucksackAnzeige = this.add.text(16, 16, this.getRucksackText(), {
      fontSize: '18px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 4, lineSpacing: 4
    })
    this.rucksackAnzeige.setDepth(100)

    // 🆘 Eingeschlossene Person (nur wenn Haus gebaut, aber noch nicht gerettet!)
    this.verschuettung = null
    if (!hausDaten.personGerettet && hausDaten.hausGebaut) {
      this.erstelleVerschuettung(breite - 80, hoehe / 2)
    }

    // 🚪 Ausgang (oben in der Mitte)
    const ausgang = this.add.text(breite / 2, 15, '🔼 Raus', {
      fontSize: '16px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#000000', strokeThickness: 3,
      backgroundColor: '#00000066', padding: { x: 10, y: 4 }
    }).setOrigin(0.5, 0)
    ausgang.setDepth(100)
    ausgang.setInteractive({ useHandCursor: true })
    ausgang.on('pointerdown', () => {
      // Zurück zur Wiese! (Rucksack bleibt automatisch erhalten)
      spielSpeichern('BlumenwiesenSpiel', this.figurDaten, null)
      this.scene.start('BlumenwiesenSpiel', this.figurDaten)
    })

    // Herabgefallene Items
    this.bodenItems = this.add.group()

    // 🎯 Ziel
    this.zielX = null
    this.zielY = null
    this.zielAktion = null

    // Werkzeug = Schaufel wenn jemand gerettet werden muss, sonst Hacke
    this.werkzeug = (hausDaten.hausGebaut && !hausDaten.personGerettet) ? 'schaufel' : 'hacke'

    // Werkzeug-Anzeige
    if (hausDaten.hausGebaut && !hausDaten.personGerettet) {
      this.add.text(breite / 2, hoehe - 15, '🪒 Schaufel aktiv – Grabe die Person frei!', {
        fontSize: '14px', fontFamily: 'Arial', color: '#FF1744',
        stroke: '#000000', strokeThickness: 3
      }).setOrigin(0.5).setDepth(100)
    } else {
      this.add.text(breite / 2, hoehe - 15, '⛏️ Hacke aktiv – Tippe auf Eisenerz!', {
        fontSize: '14px', fontFamily: 'Arial', color: '#FFD700',
        stroke: '#000000', strokeThickness: 3
      }).setOrigin(0.5).setDepth(100)
    }

    // 👆 Touch
    this.input.on('pointerdown', (pointer) => {
      // Prüfe Eisenerz
      let getippt = false

      // Prüfe ob auf herabgefallenes Item getippt
      this.bodenItems.getChildren().forEach((item) => {
        if (item.active) {
          const abstand = Phaser.Math.Distance.Between(pointer.x, pointer.y, item.x, item.y)
          if (abstand < 30) {
            this.laufeZu(item.x, item.y, () => this.materialEinsammeln(item))
            getippt = true
          }
        }
      })
      if (getippt) return

      // 🆘 Verschüttung antippen?
      if (this.verschuettung && !getippt) {
        const abstandV = Phaser.Math.Distance.Between(
          pointer.x, pointer.y, this.verschuettung.x, this.verschuettung.y
        )
        if (abstandV < 50) {
          this.laufeZu(this.verschuettung.x - 30, this.verschuettung.y, () => this.grabeVerschuettung())
          getippt = true
        }
      }

      for (const brocken of this.eisenBrocken) {
        if (brocken.eisenRest <= 0) continue
        const abstand = Phaser.Math.Distance.Between(pointer.x, pointer.y, brocken.x, brocken.y)
        if (abstand < 35) {
          this.laufeZu(brocken.x, brocken.y + 30, () => this.eisenSchlagen(brocken))
          getippt = true
          break
        }
      }

      if (!getippt) {
        // Einfach laufen (im Bereich der Mine)
        const zielY = Math.max(50, Math.min(pointer.y, this.scale.height - 50))
        const zielX = Math.max(40, Math.min(pointer.x, this.scale.width - 40))
        this.laufeZu(zielX, zielY, null)
      }
    })

    // Tastatur
    this.cursors = this.input.keyboard.createCursorKeys()

    // Info
    soundMine()
    this.zeigeNachricht('⛏️ Willkommen in der Mine!')
  }

  laufeZu(x, y, aktion) {
    this.zielX = x
    this.zielY = y
    this.zielAktion = aktion
  }

  update() {
    const speed = 140

    if (this.cursors.left.isDown || this.cursors.right.isDown ||
        this.cursors.up.isDown || this.cursors.down.isDown) {
      this.zielX = null
      this.zielY = null
      this.zielAktion = null
      let vx = 0, vy = 0
      if (this.cursors.left.isDown) vx = -speed
      if (this.cursors.right.isDown) vx = speed
      if (this.cursors.up.isDown) vy = -speed
      if (this.cursors.down.isDown) vy = speed
      this.spieler.body.setVelocity(vx, vy)
    } else if (this.zielX !== null && this.zielY !== null) {
      const dx = this.zielX - this.spieler.x
      const dy = this.zielY - this.spieler.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 8) {
        this.spieler.body.setVelocity((dx / dist) * speed, (dy / dist) * speed)
      } else {
        this.spieler.body.setVelocity(0, 0)
        this.zielX = null
        this.zielY = null
        if (this.zielAktion) {
          const aktion = this.zielAktion
          this.zielAktion = null
          aktion()
        }
      }
    } else {
      this.spieler.body.setVelocity(0, 0)
    }
  }

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
    figur.setDepth(50)
    return figur
  }

  // === 🆘 VERSCHÜTTUNG ERSTELLEN ===
  erstelleVerschuettung(x, y) {
    const g = this.add.graphics()

    // 🪨 Haufen aus Steinen (die Person ist dahinter!)
    g.fillStyle(0x5D4037)
    g.fillCircle(x, y, 25)
    g.fillCircle(x - 18, y + 10, 18)
    g.fillCircle(x + 15, y + 8, 20)
    g.fillCircle(x - 8, y - 15, 15)
    g.fillCircle(x + 10, y - 12, 16)
    g.fillStyle(0x4E342E)
    g.fillCircle(x + 5, y + 15, 12)
    g.fillCircle(x - 12, y, 10)
    g.setDepth(10)

    // 🆘 Hilfe-Schild
    const hilfe = this.add.text(x, y - 40, '🆘 Hilfe!', {
      fontSize: '16px', fontFamily: 'Arial', color: '#FF1744',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(20)

    // Wackelnde Hand die rausschaut!
    const hand = this.add.text(x - 25, y - 5, '🤚', {
      fontSize: '18px'
    }).setOrigin(0.5).setDepth(11)
    this.tweens.add({
      targets: hand,
      angle: { from: -15, to: 15 },
      duration: 300,
      yoyo: true,
      repeat: -1
    })

    // Hilfe-Text pulst
    this.tweens.add({
      targets: hilfe,
      scale: 1.15,
      duration: 500,
      yoyo: true,
      repeat: -1
    })

    this.verschuettung = {
      x: x,
      y: y,
      graphics: g,
      hilfe: hilfe,
      hand: hand,
      grabVersuche: 0 // 3x graben um zu befreien!
    }
  }

  // === 🪒 VERSCHÜTTUNG FREIGRABEN ===
  grabeVerschuettung() {
    if (!this.verschuettung) return

    // Prüfe ob Schaufel aktiv
    if (this.werkzeug !== 'schaufel') {
      this.zeigeNachricht('🪒 Du brauchst die Schaufel!')
      return
    }

    this.verschuettung.grabVersuche++

    // Wackel-Animation
    this.tweens.add({
      targets: this.verschuettung.graphics,
      x: this.verschuettung.graphics.x - 3,
      duration: 50,
      yoyo: true,
      repeat: 3
    })

    // Steine fliegen weg!
    for (let i = 0; i < 3; i++) {
      const stein = this.add.circle(
        this.verschuettung.x + Phaser.Math.Between(-15, 15),
        this.verschuettung.y,
        Phaser.Math.Between(4, 8),
        0x795548
      ).setDepth(15)
      this.tweens.add({
        targets: stein,
        x: stein.x + Phaser.Math.Between(-60, 60),
        y: stein.y + Phaser.Math.Between(-40, 30),
        alpha: 0,
        duration: 600,
        onComplete: () => stein.destroy()
      })
    }

    if (this.verschuettung.grabVersuche < 3) {
      const rest = 3 - this.verschuettung.grabVersuche
      soundGraben()
      this.zeigeNachricht(`🪒 *Schaufel!* Noch ${rest}x graben!`)
      // Steinhaufen wird kleiner
      const skala = 1 - (this.verschuettung.grabVersuche * 0.25)
      this.tweens.add({
        targets: this.verschuettung.graphics,
        scaleX: skala,
        scaleY: skala,
        duration: 300
      })
    } else {
      // 🎉 PERSON BEFREIT!
      this.personBefreit()
    }
  }

  // === 🎉 PERSON BEFREIT! ===
  personBefreit() {
    // 🔊 Juhu-Sound!
    soundBefreit()
    hausDaten.personGerettet = true
    // 💾 Sofort speichern!
    spielSpeichern('MinenSzene', this.figurDaten, null)

    // Verschüttung wegräumen
    this.verschuettung.graphics.destroy()
    this.verschuettung.hilfe.destroy()
    this.verschuettung.hand.destroy()

    const breite = this.scale.width
    const hoehe = this.scale.height
    const px = this.verschuettung.x
    const py = this.verschuettung.y

    // 🧑 Gerettete Person erscheint!
    const person = this.add.container(px, py)
    // Einfache Figur (anders als der Spieler)
    const koerper = this.add.circle(0, 0, 10, 0xFFCC80)
    const haar = this.add.circle(0, -8, 8, 0xE65100)
    const augeL = this.add.circle(-3, -2, 1.5, 0x333333)
    const augeR = this.add.circle(3, -2, 1.5, 0x333333)
    const hemd = this.add.rectangle(0, 12, 16, 14, 0xFF7043)
    const beinL = this.add.rectangle(-4, 24, 5, 10, 0x5D4037)
    const beinR = this.add.rectangle(4, 24, 5, 10, 0x5D4037)
    person.add([beinL, beinR, hemd, koerper, haar, augeL, augeR])
    person.setDepth(50)

    // Juhu-Animation!
    this.tweens.add({
      targets: person,
      y: py - 15,
      duration: 300,
      yoyo: true,
      repeat: 2
    })

    // 💬 Danke-Nachricht
    const danke = this.add.text(breite / 2, hoehe * 0.15,
      '🎉 JUHU! Du hast mich gerettet!\n\n😊 Vielen Dank!\nDu bist mein Held! ⭐\n\n🎁 Hier, nimm das als Dankeschön!', {
      fontSize: '18px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 4, align: 'center',
      backgroundColor: '#00000088', padding: { x: 16, y: 12 }
    }).setOrigin(0.5).setDepth(200)

    // 🎁 Belohnung: Diamant!
    this.time.delayedCall(3000, () => {
      danke.destroy()

      const belohnung = this.add.text(breite / 2, hoehe * 0.3,
        '🎁 Du bekommst: 💎 einen Diamanten!\n\nDer ist wunderschön! ✨', {
        fontSize: '20px', fontFamily: 'Arial', color: '#FFD700',
        stroke: '#000000', strokeThickness: 4, align: 'center',
        backgroundColor: '#00000088', padding: { x: 16, y: 12 }
      }).setOrigin(0.5).setDepth(200)

      // Diamant-Animation
      const diamant = this.add.text(breite / 2, hoehe * 0.55, '💎', {
        fontSize: '48px'
      }).setOrigin(0.5).setDepth(200)
      this.tweens.add({
        targets: diamant,
        angle: 360,
        scale: 1.3,
        duration: 1000,
        yoyo: true,
        repeat: -1
      })

      // Person geht zum Ausgang
      this.tweens.add({
        targets: person,
        x: breite / 2,
        y: 30,
        alpha: 0,
        duration: 3000,
        delay: 2000
      })

      this.time.delayedCall(4000, () => {
        belohnung.destroy()
        diamant.destroy()
        this.zeigeNachricht('💎 Diamant erhalten! ✨')
      })
    })

    this.verschuettung = null
  }

  // ⚙️ Eisenerz erstellen
  erstelleEisenBrocken(x, y) {
    const g = this.add.graphics()
    // Stein-Hintergrund
    g.fillStyle(0x5D4037)
    g.fillCircle(x, y, 18)
    // Eisenerz (silbrig glänzende Flecken)
    g.fillStyle(0xB0BEC5)
    g.fillCircle(x - 5, y - 3, 5)
    g.fillCircle(x + 6, y + 2, 4)
    g.fillCircle(x - 2, y + 7, 3)
    // Glanz
    g.fillStyle(0xCFD8DC)
    g.fillCircle(x - 5, y - 6, 2)

    const brocken = {
      x: x,
      y: y,
      graphics: g,
      eisenRest: 3 // ⚙️ 3 Stück Eisen pro Brocken
    }

    this.eisenBrocken.push(brocken)
    return brocken
  }

  // ⛏️ Eisen schlagen
  eisenSchlagen(brocken) {
    if (brocken.eisenRest <= 0) {
      this.zeigeNachricht('⚙️ Kein Eisen mehr hier!')
      return
    }

    // Wackel-Animation
    this.tweens.add({
      targets: brocken.graphics,
      x: brocken.graphics.x - 3,
      duration: 50,
      yoyo: true,
      repeat: 2
    })

    brocken.eisenRest -= 1

    // Eisen fällt heraus
    const eisenX = brocken.x + Phaser.Math.Between(-10, 20)
    const eisenZielY = brocken.y + Phaser.Math.Between(25, 40)

    const eisen = this.add.rectangle(eisenX, brocken.y, 14, 14, 0xB0BEC5)
    eisen.setAngle(45) // Rauten-Form
    eisen.materialTyp = 'eisen'
    eisen.setDepth(45)

    this.tweens.add({
      targets: eisen,
      y: eisenZielY,
      duration: 400,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        eisen.setInteractive()
        this.bodenItems.add(eisen)
      }
    })

    // 🔊 Stein-Klonk in der Mine!
    soundSteinKlopfen()
    this.zeigeNachricht('⛏️ *Klirr!* ⚙️')

    if (brocken.eisenRest <= 0) {
      brocken.graphics.setAlpha(0.3)
    }
  }

  materialEinsammeln(material) {
    const typ = material.materialTyp
    const maximal = { holz: 10, stein: 5, eisen: 9 }
    if (this.rucksack[typ] >= maximal[typ]) {
      this.zeigeNachricht(`⚙️ Genug ${typ}!`)
      return
    }
    this.tweens.add({
      targets: material,
      scale: 1.5, alpha: 0, y: material.y - 30,
      duration: 400,
      onComplete: () => material.destroy()
    })
    this.rucksack[typ] += 1
    // 🔊 Einsammel-Sound!
    soundEinsammeln()
    this.rucksackAnzeige.setText(this.getRucksackText())
    this.zeigeNachricht(`⚙️ +1 ${typ}!`)
  }

  getRucksackText() {
    return `🎒 Rucksack:\n🪵 ${this.rucksack.holz}/10\n🪨 ${this.rucksack.stein}/5\n⚙️ ${this.rucksack.eisen}/9`
  }

  zeigeNachricht(text) {
    const nachricht = this.add.text(this.scale.width / 2, this.scale.height * 0.35, text, {
      fontSize: '22px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 4
    })
    nachricht.setOrigin(0.5).setDepth(200)
    this.tweens.add({
      targets: nachricht,
      alpha: 0, y: nachricht.y - 40,
      duration: 1200, delay: 400,
      onComplete: () => nachricht.destroy()
    })
  }
}

export default MinenSzene
