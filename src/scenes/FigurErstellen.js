import Phaser from 'phaser'
import { spielLaden, spielstandWiederherstellen, hausDaten } from '../state.js'
import { soundSpielStart } from '../sounds.js'
import { maleFigur } from '../figur.js'

// =============================================================
// 🎨 FIGUR ERSTELLEN – Hier baust du deinen eigenen Charakter!
// =============================================================
class FigurErstellen extends Phaser.Scene {
  constructor() {
    super('FigurErstellen')
  }

  create() {
    // 📥 Prüfe ob ein Spielstand vorhanden ist!
    const stand = spielLaden()
    if (stand && stand.figurDaten && stand.szene) {
      // ✅ Spielstand gefunden! Direkt weitermachen!
      spielstandWiederherstellen(stand)
      // 📍 Spielerposition in figurDaten mitspeichern
      const daten = { ...stand.figurDaten }
      if (stand.spielerPos) {
        daten._spielerPos = stand.spielerPos
      }
      // 🛡️ Falls die gespeicherte Szene nicht mehr existiert → zur Wiese!
      const gueltigeSzenen = ['BlumenwiesenSpiel', 'MinenSzene', 'HausSzene', 'MiloHausSzene', 'StadtSzene']
      const zielSzene = gueltigeSzenen.includes(stand.szene) ? stand.szene : 'BlumenwiesenSpiel'
      console.log('💾 Spielstand geladen! Szene:', zielSzene)
      this.scene.start(zielSzene, daten)
      return
    }

    const breite = this.scale.width
    const hoehe = this.scale.height

    // 🌸 Hübscher Hintergrund (wie bei Animal Crossing!)
    this.cameras.main.setBackgroundColor('#B2DFDB')

    // Muster im Hintergrund (kleine Blümchen)
    for (let i = 0; i < 20; i++) {
      const bx = Phaser.Math.Between(20, breite - 20)
      const by = Phaser.Math.Between(20, hoehe - 20)
      this.add.circle(bx, by, 4, 0x80CBC4).setAlpha(0.4)
    }

    // === 🏷️ TITEL ===
    // 🌍 Sprache merken (Standard: Deutsch)
    this.sprache = hausDaten.sprache || 'de'

    this.titelText = this.add.text(breite / 2, 30, this.getText('titel'), {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#2E7D32',
      stroke: '#ffffff',
      strokeThickness: 4
    }).setOrigin(0.5)

    // === 🌍 SPRACHE WÄHLEN (Flaggen!) ===
    const flaggenY = 30
    const flaggenStartX = 60

    // 🇩🇪 Deutsch
    this.flaggeDE = this.add.text(flaggenStartX, flaggenY, '🇩🇪', {
      fontSize: '28px',
      backgroundColor: this.sprache === 'de' ? '#4CAF50' : '#78909C',
      padding: { x: 6, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    this.flaggeDE.on('pointerdown', () => {
      this.sprache = 'de'
      hausDaten.sprache = 'de'
      this.flaggeDE.setBackgroundColor('#4CAF50')
      this.flaggeEN.setBackgroundColor('#78909C')
      this.titelText.setText(this.getText('titel'))
    })

    // 🇬🇧 English
    this.flaggeEN = this.add.text(flaggenStartX + 60, flaggenY, '🇬🇧', {
      fontSize: '28px',
      backgroundColor: this.sprache === 'en' ? '#4CAF50' : '#78909C',
      padding: { x: 6, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    this.flaggeEN.on('pointerdown', () => {
      this.sprache = 'en'
      hausDaten.sprache = 'en'
      this.flaggeEN.setBackgroundColor('#4CAF50')
      this.flaggeDE.setBackgroundColor('#78909C')
      this.titelText.setText(this.getText('titel'))
    })

    // === 📋 AUSGEWÄHLTE OPTIONEN ===
    this.auswahl = {
      hautfarbe: 0xFFCC80,   // Standard: hell
      haarfarbe: 0x5D4037,   // Standard: braun
      haarStil: 0,           // 0 = kurz, 1 = lang, 2 = zöpfe
      kleidungFarbe: 0x2196F3, // Standard: blau
      kleidungTyp: 0,         // 0 = T-Shirt, 1 = Kleid, 2 = Hoodie
      hosenFarbe: 0x37474F,   // Standard: dunkelgrau
      schuhFarbe: 0x424242    // Standard: dunkelgrau
    }

    // === 🧑 VORSCHAU der Figur (links auf dem Bildschirm) ===
    this.vorschauX = breite * 0.22
    this.vorschauY = hoehe * 0.40
    this.aktualisiereVorschau()

    // === 🏷️ NAMENSSCHILD unter der Figur ===
    this.add.text(this.vorschauX, this.vorschauY + 70, '✏️ Dein Name:', {
      fontSize: '14px', fontFamily: 'Arial', color: '#2E7D32',
      stroke: '#ffffff', strokeThickness: 2
    }).setOrigin(0.5)

    // Unsichtbares HTML-Input-Feld für den Namen
    this.spielerName = ''
    const namenSchild = this.add.text(this.vorschauX, this.vorschauY + 92, '_ _ _ _', {
      fontSize: '18px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: '#5D4037', padding: { x: 16, y: 8 },
      stroke: '#000000', strokeThickness: 1
    }).setOrigin(0.5)
    namenSchild.setInteractive({ useHandCursor: true })
    this.namenSchild = namenSchild

    // 🖱️ Wenn man drauftippt, öffnet sich ein Eingabefeld!
    namenSchild.on('pointerdown', () => {
      // HTML-Input erstellen (das geht am besten über den Browser!)
      const eingabe = document.createElement('input')
      eingabe.type = 'text'
      eingabe.maxLength = 12
      eingabe.placeholder = 'Dein Name...'
      eingabe.value = this.spielerName
      eingabe.style.position = 'fixed'
      eingabe.style.left = '50%'
      eingabe.style.top = '50%'
      eingabe.style.transform = 'translate(-50%, -50%)'
      eingabe.style.fontSize = '24px'
      eingabe.style.padding = '12px 20px'
      eingabe.style.border = '3px solid #4CAF50'
      eingabe.style.borderRadius = '12px'
      eingabe.style.textAlign = 'center'
      eingabe.style.fontFamily = 'Arial'
      eingabe.style.zIndex = '9999'
      eingabe.style.outline = 'none'
      eingabe.style.backgroundColor = '#FFF9C4'
      document.body.appendChild(eingabe)
      eingabe.focus()

      // Wenn Enter gedrückt oder Fokus verloren → Name übernehmen
      const fertig = () => {
        this.spielerName = eingabe.value.trim() || ''
        if (this.spielerName) {
          this.namenSchild.setText(this.spielerName)
        } else {
          this.namenSchild.setText('_ _ _ _')
        }
        eingabe.remove()
      }
      eingabe.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') fertig()
      })
      eingabe.addEventListener('blur', fertig)
    })

    // === AUSWAHL-BEREICH (rechte Seite) ===
    const rechtsX = breite * 0.45  // Wo die Labels anfangen
    const farbStartX = breite * 0.58 // Wo die Farb-Buttons anfangen
    const startY = hoehe * 0.15
    const zeilenAbstand = 52

    // --- 🎨 HAUTFARBE ---
    this.add.text(rechtsX, startY, '🧑 Haut:', {
      fontSize: '18px', fontFamily: 'Arial', color: '#333333'
    }).setOrigin(0, 0.5)

    const hautfarben = [
      { farbe: 0xFDECDA, name: 'hell' },
      { farbe: 0xFFCC80, name: 'mittel' },
      { farbe: 0xD4A574, name: 'dunkel' },
      { farbe: 0x8D5524, name: 'braun' }
    ]
    this.erstelleFarbButtons(farbStartX, startY, hautfarben, (farbe) => {
      this.auswahl.hautfarbe = farbe
      this.aktualisiereVorschau()
    }, this.auswahl.hautfarbe)

    // --- 💇 HAARFARBE ---
    this.add.text(rechtsX, startY + zeilenAbstand, '💇 Haare:', {
      fontSize: '18px', fontFamily: 'Arial', color: '#333333'
    }).setOrigin(0, 0.5)

    const haarfarben = [
      { farbe: 0xFDD835, name: 'blond' },
      { farbe: 0x5D4037, name: 'braun' },
      { farbe: 0x212121, name: 'schwarz' },
      { farbe: 0xE53935, name: 'rot' },
      { farbe: 0xE91E63, name: 'pink' }
    ]
    this.erstelleFarbButtons(farbStartX, startY + zeilenAbstand, haarfarben, (farbe) => {
      this.auswahl.haarfarbe = farbe
      this.aktualisiereVorschau()
    }, this.auswahl.haarfarbe)

    // --- ✂️ FRISUR ---
    this.add.text(rechtsX, startY + zeilenAbstand * 2, '✂️ Frisur:', {
      fontSize: '18px', fontFamily: 'Arial', color: '#333333'
    }).setOrigin(0, 0.5)

    const frisuren = ['Kurz', 'Lang', 'Zöpfe']
    this.frisurButtons = []
    frisuren.forEach((name, index) => {
      const btn = this.add.text(farbStartX + index * 80, startY + zeilenAbstand * 2, name, {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: index === this.auswahl.haarStil ? '#4CAF50' : '#78909C',
        padding: { x: 10, y: 6 }
      }).setOrigin(0, 0.5)
      btn.setInteractive({ useHandCursor: true })
      btn.on('pointerdown', () => {
        this.auswahl.haarStil = index
        this.aktualisiereVorschau()
        // Alle Frisur-Buttons zurücksetzen
        this.frisurButtons.forEach((b, i) => {
          b.setBackgroundColor(i === index ? '#4CAF50' : '#78909C')
        })
      })
      this.frisurButtons.push(btn)
    })

    // --- 👕 KLEIDUNG FARBE ---
    this.add.text(rechtsX, startY + zeilenAbstand * 3, '👕 Kleidung:', {
      fontSize: '18px', fontFamily: 'Arial', color: '#333333'
    }).setOrigin(0, 0.5)

    const kleidungFarben = [
      { farbe: 0x2196F3, name: 'blau' },
      { farbe: 0xE53935, name: 'rot' },
      { farbe: 0x4CAF50, name: 'grün' },
      { farbe: 0xFFEB3B, name: 'gelb' },
      { farbe: 0x9C27B0, name: 'lila' },
      { farbe: 0xE91E63, name: 'pink' }
    ]
    this.erstelleFarbButtons(farbStartX, startY + zeilenAbstand * 3, kleidungFarben, (farbe) => {
      this.auswahl.kleidungFarbe = farbe
      this.aktualisiereVorschau()
    }, this.auswahl.kleidungFarbe)

    // --- 👗 KLEIDUNG TYP ---
    this.add.text(rechtsX, startY + zeilenAbstand * 4, '👗 Typ:', {
      fontSize: '18px', fontFamily: 'Arial', color: '#333333'
    }).setOrigin(0, 0.5)

    const kleidungTypen = ['T-Shirt', 'Kleid', 'Hoodie']
    this.kleidungButtons = []
    kleidungTypen.forEach((name, index) => {
      const btn = this.add.text(farbStartX + index * 90, startY + zeilenAbstand * 4, name, {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: index === this.auswahl.kleidungTyp ? '#4CAF50' : '#78909C',
        padding: { x: 12, y: 6 }
      }).setOrigin(0, 0.5)
      btn.setInteractive({ useHandCursor: true })
      btn.on('pointerdown', () => {
        this.auswahl.kleidungTyp = index
        this.aktualisiereVorschau()
        this.kleidungButtons.forEach((b, i) => {
          b.setBackgroundColor(i === index ? '#4CAF50' : '#78909C')
        })
      })
      this.kleidungButtons.push(btn)
    })

    // --- 👖 HOSEN-FARBE ---
    this.add.text(rechtsX, startY + zeilenAbstand * 5, '👖 Hose:', {
      fontSize: '18px', fontFamily: 'Arial', color: '#333333'
    }).setOrigin(0, 0.5)

    const hosenFarben = [
      { farbe: 0x37474F, name: 'dunkelgrau' },
      { farbe: 0x1565C0, name: 'jeans' },
      { farbe: 0x4E342E, name: 'braun' },
      { farbe: 0x212121, name: 'schwarz' },
      { farbe: 0xE91E63, name: 'pink' },
      { farbe: 0x7B1FA2, name: 'lila' }
    ]
    this.erstelleFarbButtons(farbStartX, startY + zeilenAbstand * 5, hosenFarben, (farbe) => {
      this.auswahl.hosenFarbe = farbe
      this.aktualisiereVorschau()
    }, this.auswahl.hosenFarbe)

    // --- 👟 SCHUH-FARBE ---
    this.add.text(rechtsX, startY + zeilenAbstand * 6, '👟 Schuhe:', {
      fontSize: '18px', fontFamily: 'Arial', color: '#333333'
    }).setOrigin(0, 0.5)

    const schuhFarben = [
      { farbe: 0x424242, name: 'grau' },
      { farbe: 0x212121, name: 'schwarz' },
      { farbe: 0xFFFFFF, name: 'weiß' },
      { farbe: 0xE53935, name: 'rot' },
      { farbe: 0x1565C0, name: 'blau' },
      { farbe: 0x4CAF50, name: 'grün' }
    ]
    this.erstelleFarbButtons(farbStartX, startY + zeilenAbstand * 6, schuhFarben, (farbe) => {
      this.auswahl.schuhFarbe = farbe
      this.aktualisiereVorschau()
    }, this.auswahl.schuhFarbe)

    // === 🚀 LOS GEHT'S BUTTON ===
    const losButton = this.add.text(breite / 2, hoehe - 35, '🌼 Los geht\'s! 🌼', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#4CAF50',
      padding: { x: 30, y: 12 }
    }).setOrigin(0.5)
    losButton.setInteractive({ useHandCursor: true })

    // Button-Pulsieren
    this.tweens.add({
      targets: losButton,
      scale: 1.05,
      duration: 600,
      yoyo: true,
      repeat: -1
    })

    losButton.on('pointerdown', () => {
      // 🏷️ Name mit übergeben!
      this.auswahl.name = this.spielerName || ''
      // 🌍 Sprache speichern!
      hausDaten.sprache = this.sprache
      // 🔊 Spiel-Start Melodie!
      soundSpielStart()
      // 🎮 Spiel starten mit der gewählten Figur!
      this.scene.start('BlumenwiesenSpiel', this.auswahl)
    })
  }

  // 🎨 Farb-Auswahl-Buttons erstellen
  erstelleFarbButtons(startX, y, farben, callback, aktiveFarbe) {
    const kreise = [] // 📋 Alle Kreise merken!

    farben.forEach((eintrag, index) => {
      const x = startX + index * 45

      // Farbiger Kreis
      const kreis = this.add.circle(x, y, 16, eintrag.farbe)
      // ✅ Aktive Farbe bekommt eine dicke goldene Umrandung!
      if (eintrag.farbe === aktiveFarbe) {
        kreis.setStrokeStyle(4, 0xFFD700)
        kreis.setScale(1.15)
      } else {
        kreis.setStrokeStyle(2, 0x333333)
      }
      kreis.setInteractive({ useHandCursor: true })

      // Beim Antippen → Farbe auswählen!
      kreis.on('pointerdown', () => {
        // 🔄 Alle Kreise zurücksetzen, nur der neue wird aktiv!
        kreise.forEach(k => {
          k.setStrokeStyle(2, 0x333333)
          k.setScale(1)
        })
        kreis.setStrokeStyle(4, 0xFFD700)
        kreis.setScale(1.15)
        callback(eintrag.farbe)
      })

      // Hover-Effekt (für Computer)
      kreis.on('pointerover', () => { if (kreis.scaleX < 1.15) kreis.setScale(1.2) })
      kreis.on('pointerout', () => { if (kreis.strokeColor !== 0xFFD700) kreis.setScale(1) })

      kreise.push(kreis)
    })
  }

  // 🧑 Vorschau der Figur aktualisieren
  aktualisiereVorschau() {
    // Alte Vorschau löschen
    if (this.vorschauContainer) {
      this.vorschauContainer.destroy()
    }

    const x = this.vorschauX
    const y = this.vorschauY
    this.vorschauContainer = this.add.container(x, y)

    // ✨ Gleiche Funktion wie im Spiel – nur größer (s=2)!
    maleFigur(this, this.vorschauContainer, this.auswahl, 2)
  }

  // 🌍 Texte in der gewählten Sprache!
  getText(schluessel) {
    const texte = {
      titel: { de: '🎨 Erstelle deinen Charakter!', en: '🎨 Create your Character!' },
    }
    const eintrag = texte[schluessel]
    if (!eintrag) return schluessel
    return eintrag[this.sprache] || eintrag['de']
  }
}

export default FigurErstellen
