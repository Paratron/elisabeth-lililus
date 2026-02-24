import Phaser from 'phaser'
import { hausDaten, spielSpeichern } from '../state.js'
import { spieleTon, soundTuer } from '../sounds.js'
import { maleFigur } from '../figur.js'

class MiloHausSzene extends Phaser.Scene {
  constructor() {
    super('MiloHausSzene')
  }

  create(figurDaten) {
    this.figurDaten = figurDaten

    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🏡 Milos Haus hat warme orange Wände!
    this.cameras.main.setBackgroundColor('#FFF3E0')

    // 🪵 Boden (gemütlicher Holzboden)
    const boden = this.add.graphics()
    boden.fillStyle(0xBCAAA4)
    boden.fillRect(0, hoehe - 80, breite, 80)
    boden.lineStyle(1, 0x00000022)
    for (let i = 0; i < breite; i += 55) {
      boden.lineBetween(i, hoehe - 80, i, hoehe)
    }
    for (let j = hoehe - 80; j < hoehe; j += 20) {
      boden.lineBetween(0, j, breite, j)
    }

    // 🧱 Wände (orange wie Milos Haus!)
    const waende = this.add.graphics()
    waende.fillStyle(hausDaten.freundWandFarbe)
    waende.fillRect(0, 0, 30, hoehe)
    waende.fillRect(breite - 30, 0, 30, hoehe)
    waende.fillStyle(hausDaten.freundDachFarbe)
    waende.fillRect(0, 0, breite, 35)

    // 🪟 Fenster links (mit Blümchen-Vorhang!)
    this.add.rectangle(80, hoehe * 0.35, 70, 60, 0xBBDEFB).setDepth(1)
    this.add.rectangle(80, hoehe * 0.35, 70, 2, 0x795548).setDepth(2)
    this.add.rectangle(80, hoehe * 0.35, 2, 60, 0x795548).setDepth(2)
    this.add.rectangle(80, hoehe * 0.35, 76, 66, 0x000000, 0).setStrokeStyle(3, 0x795548).setDepth(2)
    this.add.text(55, hoehe * 0.25, '🌸', { fontSize: '12px' }).setDepth(3)
    this.add.text(97, hoehe * 0.25, '🌸', { fontSize: '12px' }).setDepth(3)

    // 🪟 Fenster rechts
    this.add.rectangle(breite - 80, hoehe * 0.35, 70, 60, 0xBBDEFB).setDepth(1)
    this.add.rectangle(breite - 80, hoehe * 0.35, 70, 2, 0x795548).setDepth(2)
    this.add.rectangle(breite - 80, hoehe * 0.35, 2, 60, 0x795548).setDepth(2)
    this.add.rectangle(breite - 80, hoehe * 0.35, 76, 66, 0x000000, 0).setStrokeStyle(3, 0x795548).setDepth(2)

    // 🛋️ Milos Möbel (fest eingerichtet – gemütlich!)
    // 🛏️ Bett links
    this.add.text(breite * 0.2, hoehe - 110, '🛏️', { fontSize: '42px' }).setOrigin(0.5).setDepth(10)

    // 🪑 Tisch mit Stühlen in der Mitte
    const tisch = this.add.graphics()
    tisch.fillStyle(0x5D4037)
    tisch.fillRect(breite * 0.45, hoehe - 125, 4, 22) // Bein links
    tisch.fillRect(breite * 0.55, hoehe - 125, 4, 22) // Bein rechts
    tisch.setDepth(8)
    this.add.rectangle(breite * 0.5, hoehe - 127, 80, 8, 0x795548).setDepth(9) // Platte
    this.add.text(breite * 0.47, hoehe - 145, '🍽️', { fontSize: '20px' }).setOrigin(0.5).setDepth(10) // Teller

    // 🪑 Stühle
    this.add.text(breite * 0.38, hoehe - 108, '🪑', { fontSize: '24px' }).setOrigin(0.5).setDepth(7)
    this.add.text(breite * 0.62, hoehe - 108, '🪑', { fontSize: '24px' }).setOrigin(0.5).setDepth(7)

    // 💡 Lampe
    this.add.text(breite * 0.78, hoehe * 0.45, '💡', { fontSize: '32px' }).setOrigin(0.5).setDepth(10)

    // 🖼️ Bilder an der Wand
    this.add.rectangle(breite * 0.35, hoehe * 0.3, 50, 35, 0xFFE0B2).setStrokeStyle(2, 0x795548).setDepth(3)
    this.add.text(breite * 0.35, hoehe * 0.3, '🌻', { fontSize: '20px' }).setOrigin(0.5).setDepth(4)

    this.add.rectangle(breite * 0.65, hoehe * 0.3, 50, 35, 0xFFE0B2).setStrokeStyle(2, 0x795548).setDepth(3)
    this.add.text(breite * 0.65, hoehe * 0.3, '❤️', { fontSize: '20px' }).setOrigin(0.5).setDepth(4)

    // 🚪 Tür (unten mittig) – zum Rausgehen!
    this.add.rectangle(breite / 2, hoehe - 40, 50, 80, 0x4E342E).setDepth(5)
    this.add.circle(breite / 2 + 15, hoehe - 40, 3, 0xFFD700).setDepth(6)
    this.add.rectangle(breite / 2, hoehe - 5, 60, 10, 0x8D6E63).setDepth(5)

    // 🔙 Zurück-Button
    const raus = this.add.text(breite / 2, hoehe - 85, '🔼 Raus', {
      fontSize: '16px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#000000', strokeThickness: 3,
      backgroundColor: '#00000066', padding: { x: 10, y: 4 }
    }).setOrigin(0.5).setDepth(100)
    raus.setInteractive({ useHandCursor: true })
    raus.on('pointerdown', () => {
      soundTuer()
      spielSpeichern('BlumenwiesenSpiel', this.figurDaten, null)
      this.scene.start('BlumenwiesenSpiel', this.figurDaten)
    })

    // 🧑 Spieler
    this.spieler = this.erstelleSpieler(breite * 0.3, hoehe - 130)

    // 🧑 Milo ist zuhause!
    this.miloContainer = this.add.container(breite * 0.7, hoehe - 115)
    const stufe = hausDaten.miloWachstum || 0
    const kleidung = hausDaten.miloKleidung || { kleidungFarbe: 0xFF7043, kleidungTyp: 0, hosenFarbe: 0x5D4037, schuhFarbe: 0x424242 }

    if (stufe >= 5) {
      // ⭐ Milo sieht aus wie der Spieler!
      const miloDaten = {
        hautfarbe: 0xFFCC80, haarfarbe: 0xE65100, haarStil: 0,
        kleidungFarbe: kleidung.kleidungFarbe, kleidungTyp: kleidung.kleidungTyp,
        hosenFarbe: kleidung.hosenFarbe, schuhFarbe: kleidung.schuhFarbe
      }
      maleFigur(this, this.miloContainer, miloDaten, 0.65)
    } else {
      // 🌱 Kleiner Milo
      const g = 0.6 + stufe * 0.08
      const beinL = this.add.rectangle(-3 * g, 18 * g, 4 * g, 8 * g, kleidung.hosenFarbe)
      const beinR = this.add.rectangle(3 * g, 18 * g, 4 * g, 8 * g, kleidung.hosenFarbe)
      const hemd = this.add.rectangle(0, 9 * g, 12 * g, 12 * g, kleidung.kleidungFarbe)
      const kopf = this.add.circle(0, 0, 8 * g, 0xFFCC80)
      const haar = this.add.circle(0, -6 * g, 7 * g, 0xE65100)
      const augeL = this.add.circle(-2.5 * g, -1.5 * g, 1.2 * g, 0x333333)
      const augeR = this.add.circle(2.5 * g, -1.5 * g, 1.2 * g, 0x333333)
      const mund = this.add.graphics()
      mund.lineStyle(1.5 * g, 0x333333)
      mund.beginPath()
      mund.arc(0, 1 * g, 3 * g, 0.2, Math.PI - 0.2, false)
      mund.strokePath()
      this.miloContainer.add([beinL, beinR, hemd, kopf, haar, augeL, augeR, mund])
    }

    // 🏷️ Milo-Name
    const miloNameText = hausDaten.verheiratet ? '💍 Milo 💕' : 'Milo'
    const miloName = this.add.text(0, stufe >= 5 ? -48 : -18, miloNameText, {
      fontSize: '10px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5)
    this.miloContainer.add(miloName)
    this.miloContainer.setDepth(45)

    // 💬 Milo begrüßt dich!
    soundTuer()
    this.miloSagt('Hey! Schön dass\ndu mich besuchst! 🥰')

    // 🆘 Wenn Milo Hilfe braucht (Flag gesetzt von Wiese)
    if (hausDaten.miloBrauchtHilfe) {
      this.time.delayedCall(2000, () => {
        this.miloHilfeImHaus()
      })
    }

    // 👆 Touch zum Laufen
    this.zielX = null
    this.zielY = null
    this.input.on('pointerdown', (pointer) => {
      if (pointer.y < 50) return
      this.zielX = Phaser.Math.Clamp(pointer.x, 50, breite - 50)
      this.zielY = Phaser.Math.Clamp(pointer.y, hoehe - 160, hoehe - 25)
    })

    // ⌨️ Tastatur
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys('W,A,S,D')

    // 💬 Rede-Button (mit Milo reden in seinem Haus)
    const redeBtn = this.add.text(breite - 16, hoehe * 0.6, '💬', {
      fontSize: '32px', backgroundColor: '#FF704388', padding: { x: 6, y: 4 }
    }).setOrigin(1, 0.5).setDepth(100)
    redeBtn.setInteractive({ useHandCursor: true })
    redeBtn.on('pointerdown', () => {
      this.redeMitMiloZuhause()
    })
  }

  update() {
    const speed = 160
    let vx = 0
    let vy = 0

    // ⌨️ Tastatur
    if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -speed
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx = speed
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -speed
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy = speed

    if (vx !== 0 || vy !== 0) {
      this.spieler.body.setVelocity(vx, vy)
      this.zielX = null
      this.zielY = null
      return
    }

    // 👆 Touch
    if (this.zielX !== null && this.zielY !== null) {
      const dx = this.zielX - this.spieler.x
      const dy = this.zielY - this.spieler.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 5) {
        this.spieler.body.setVelocity((dx / dist) * speed, (dy / dist) * speed)
      } else {
        this.spieler.body.setVelocity(0, 0)
        this.zielX = null
        this.zielY = null
      }
    } else {
      this.spieler.body.setVelocity(0, 0)
    }
  }

  // 🆘 Milo braucht Hilfe zuhause!
  miloHilfeImHaus() {
    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🎲 Zufällige Hilfe-Situation im Haus!
    const situationen = [
      {
        emoji: '🧹', text: 'Kannst du mir beim\nAufräumen helfen? 🥺',
        hilfe: '🧹 Klar, ich helfe dir!', antwort: 'Danke! Zusammen geht\nes viel schneller! ✨',
        aktion: '🧹✨🧹✨🧹'
      },
      {
        emoji: '🍳', text: 'Ich wollte kochen aber\nich weiß nicht wie! 😅',
        hilfe: '👨‍🍳 Ich zeige es dir!', antwort: 'Mmh, das schmeckt\nsuper lecker! 😋',
        aktion: '🍳🥘🍽️'
      },
      {
        emoji: '🕷️', text: 'HILFE! Da ist eine\nSPINNE!! 😱😱',
        hilfe: '😊 Keine Angst, ich fange sie!', antwort: 'Puh, du bist so\nmutig! Danke! 💪',
        aktion: '🕷️➡️🌿'
      },
      {
        emoji: '📦', text: 'Ich kann die Kiste\nnicht alleine tragen! 😫',
        hilfe: '💪 Zusammen schaffen wir das!', antwort: 'WOW wir sind ein\nsuper Team! 🎉',
        aktion: '📦💪✨'
      },
      {
        emoji: '🎨', text: 'Ich möchte mein Zimmer\nneu streichen! Hilfst du? 🎨',
        hilfe: '🎨 JA! Lass uns malen!', antwort: 'So bunt und schön!\nDanke für die Hilfe! 🌈',
        aktion: '🎨🖌️🌈'
      },
      {
        emoji: '💡', text: 'Meine Lampe ist\nkaputt gegangen! 😢',
        hilfe: '🔧 Ich repariere sie!', antwort: 'Sie leuchtet wieder!\nDu bist ein Profi! 💡✨',
        aktion: '🔧💡✨'
      }
    ]

    const situation = Phaser.Math.RND.pick(situationen)

    // 😰 Milo zeigt sein Problem
    this.miloSagt(situation.text)

    const hilfeBtn = this.add.text(breite / 2, hoehe * 0.3, situation.hilfe, {
      fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: '#4CAF50', padding: { x: 16, y: 10 },
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(200)
    hilfeBtn.setInteractive({ useHandCursor: true })

    // 🆘 Hilfe-Emoji über Milo hüpft!
    const hilfeEmoji = this.add.text(this.miloContainer.x, this.miloContainer.y - 50,
      situation.emoji, { fontSize: '28px' }).setOrigin(0.5).setDepth(200)
    this.tweens.add({
      targets: hilfeEmoji,
      y: hilfeEmoji.y - 10,
      duration: 600,
      yoyo: true,
      repeat: -1
    })

    hilfeBtn.on('pointerdown', () => {
      hilfeBtn.destroy()
      hilfeEmoji.destroy()
      hausDaten.miloBrauchtHilfe = false

      // 🎵 Hilfe-Sound!
      spieleTon(523, 0.15, 0.05, 'sine')
      setTimeout(() => spieleTon(659, 0.15, 0.05, 'sine'), 150)
      setTimeout(() => spieleTon(784, 0.15, 0.05, 'sine'), 300)

      // 🎬 Animations-Emojis!
      const aktionText = this.add.text(breite / 2, hoehe * 0.45, situation.aktion, {
        fontSize: '32px'
      }).setOrigin(0.5).setDepth(200)
      this.tweens.add({
        targets: aktionText,
        scale: 1.3,
        duration: 500,
        yoyo: true,
        repeat: 2,
        onComplete: () => {
          aktionText.destroy()
          this.miloSagt(situation.antwort)

          // ❤️ Herzen fliegen!
          for (let h = 0; h < 5; h++) {
            const herz = this.add.text(
              this.miloContainer.x + Phaser.Math.Between(-30, 30),
              this.miloContainer.y,
              '❤️', { fontSize: '18px' }
            ).setDepth(200)
            this.tweens.add({
              targets: herz,
              y: herz.y - 80,
              alpha: 0,
              duration: 1500,
              delay: h * 200,
              onComplete: () => herz.destroy()
            })
          }

          // 💾 Hilfe erledigt! Speichern!
          spielSpeichern('BlumenwiesenSpiel', this.figurDaten, null)
        }
      })
    })
  }

  // 💬 Milo sagt etwas (Sprechblase)
  miloSagt(text) {
    // Alte Blase entfernen
    if (this.miloBlase) this.miloBlase.destroy()

    this.miloBlase = this.add.text(
      this.miloContainer.x, this.miloContainer.y - 55,
      text, {
        fontSize: '12px', fontFamily: 'Arial', color: '#FF7043',
        backgroundColor: '#FFF3E0', padding: { x: 8, y: 6 },
        stroke: '#000000', strokeThickness: 1,
        align: 'center', wordWrap: { width: 180 }
      }
    ).setOrigin(0.5).setDepth(200)

    // Blase nach 5 Sekunden ausblenden
    this.tweens.add({
      targets: this.miloBlase,
      alpha: 0,
      duration: 800,
      delay: 5000,
      onComplete: () => {
        if (this.miloBlase) this.miloBlase.destroy()
        this.miloBlase = null
      }
    })
  }

  // 💬 Mit Milo reden in seinem Haus!
  redeMitMiloZuhause() {
    const texte = [
      'Dein Haus ist richtig\ngemütlich! 🏡',
      'Wollen wir was\nzusammen spielen? 🎮',
      'Du bist mein bester\nFreund Milo! ❤️',
      'Was machst du so\nden ganzen Tag? 🤔',
      'Sollen wir Pizza\nbestellen? 🍕'
    ]
    const antworten = [
      'Danke! Ich hab alles\nselber eingerichtet! 😊',
      'JAAA! Lass uns am\nComputer spielen! 🎮',
      'Und du bist meine\nbeste Freundin! 💕',
      'Ich denke an dich\nund male Bilder! 🎨',
      'Oh ja! Pizza Mario\nist der Beste! 🍕😋'
    ]

    const idx = Phaser.Math.Between(0, texte.length - 1)

    // 💬 Dein Text als Sprechblase über dem Spieler
    const duSagst = this.add.text(
      this.spieler.x, this.spieler.y - 55,
      texte[idx], {
        fontSize: '11px', fontFamily: 'Arial', color: '#4FC3F7',
        backgroundColor: '#E3F2FD', padding: { x: 6, y: 4 },
        stroke: '#000000', strokeThickness: 1,
        align: 'center'
      }
    ).setOrigin(0.5).setDepth(200)

    this.tweens.add({
      targets: duSagst,
      alpha: 0,
      duration: 600,
      delay: 3000,
      onComplete: () => duSagst.destroy()
    })

    // 🧑 Milo antwortet nach 1.5 Sekunden
    this.time.delayedCall(1500, () => {
      this.miloSagt(antworten[idx])
      // 🎵 Milos Stimme
      spieleTon(300, 0.06, 0.03, 'triangle')
      setTimeout(() => spieleTon(350, 0.06, 0.03, 'triangle'), 80)
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

  zeigeNachricht(text) {
    const nachricht = this.add.text(this.scale.width / 2, this.scale.height * 0.15, text, {
      fontSize: '18px', fontFamily: 'Arial', color: '#FF7043',
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

export default MiloHausSzene
