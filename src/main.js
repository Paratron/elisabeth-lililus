// =============================================================
// ��� MiNiMiNiS – Das Spiel! ���
// =============================================================
// Hier werden alle Teile zusammengebaut und das Spiel gestartet!

import Phaser from 'phaser'

// ��� Alle Szenen importieren
import FigurErstellen from './scenes/FigurErstellen.js'
import BlumenwiesenSpiel from './scenes/BlumenwiesenSpiel.js'
import MinenSzene from './scenes/MinenSzene.js'
import HausSzene from './scenes/HausSzene.js'
import MiloHausSzene from './scenes/MiloHausSzene.js'
import StadtSzene from './scenes/StadtSzene.js'

// === ⚙️ SPIEL-EINSTELLUNGEN ===
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 500,
  parent: 'game',
  backgroundColor: '#87CEEB',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      // debug: true
    }
  },
  scene: [FigurErstellen, BlumenwiesenSpiel, MinenSzene, HausSzene, MiloHausSzene, StadtSzene]
}

// ��� Spiel starten!
const spiel = new Phaser.Game(config)
