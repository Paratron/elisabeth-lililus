import Phaser from 'phaser'
import { baueSchatz } from './schatz.js'

export function starteTauchen(zurueck = () => {}, figur, maleFigur, fund = {}) {
  let tauchSzene
  let taucher
  let auftauchen = false
  const welt = document.createElement('section')
  welt.className = 'tauchwelt'
  welt.setAttribute('aria-label', 'Tauchstation')
  welt.innerHTML = '<div class="tauch-bild"></div><h2>🤿 Tauchstation</h2><button class="tauch-raus">Auftauchen</button><section class="tauch-post" aria-label="Gefundener Briefkasten" hidden><h2>Briefkasten gefunden</h2><p></p><button>Schließen</button></section>'
  document.body.append(welt)
  const schatz = baueSchatz(welt, () => {}, true)
  const post = welt.querySelector('.tauch-post')
  const mitnehmen = document.createElement('button')
  mitnehmen.textContent = '📬 Mitnehmen'
  mitnehmen.hidden = true
  post.append(mitnehmen)
  post.querySelector('button').addEventListener('click', () => { post.hidden = true })
  const spiel = new Phaser.Game({
    type: Phaser.CANVAS, parent: welt.querySelector('.tauch-bild'), width: 1280, height: 800,
    backgroundColor: '#268eac', scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: { create() {
      tauchSzene = this
      this.game.canvas.setAttribute('role', 'img')
      this.game.canvas.setAttribute('aria-label', 'Animierte Unterwasserwelt')
      const boden = this.add.graphics()
      boden.fillStyle(0x56becb)
      boden.fillRect(0, 0, 1280, 100)
      boden.fillStyle(0xe8d296)
      boden.fillEllipse(640, 835, 1700, 330)
      const schrift = { fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif', fontSize: '64px' }
      for (let nummer = 0; nummer < 18; nummer++) {
        const blase = this.add.circle((nummer * 173 + 90) % 1280, 850 + nummer * 35, 5 + nummer % 4 * 3, 0xc3f3fa, 0.18)
        blase.setStrokeStyle(2, 0xc3f3fa, 0.65)
        this.tweens.add({ targets: blase, y: -30, x: blase.x + 25, duration: 5500 + nummer * 150, delay: nummer * 180, repeat: -1 })
      }
      for (const [emoji, hoehe, dauer] of [['🐟', 230, 12500], ['🐠', 420, 16000], ['🐟', 570, 18500]]) {
        const fisch = this.add.text(-100, hoehe, emoji, schrift).setOrigin(0.5)
        this.tweens.add({ targets: fisch, x: 1380, duration: dauer, repeat: -1 })
        this.tweens.add({ targets: fisch, y: hoehe + 24, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
      }
      for (const breite of [90, 210, 1100, 1200]) {
        const pflanze = this.add.text(breite, 735, '🌿', { ...schrift, fontSize: '96px' }).setOrigin(0.5, 1)
        this.tweens.add({ targets: pflanze, angle: 10, duration: 1800 + breite, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
      }
      const brille = this.add.text(0, -30, '🤿', { ...schrift, fontSize: '50px' }).setOrigin(0.5)
      const koerper = this.add.graphics()
      if (figur && maleFigur) maleFigur(koerper, figur)
      taucher = this.add.container(640, 330, [koerper, brille]).setScale(1.65)
      this.tweens.add({ targets: taucher, y: 355, angle: 5, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
      const briefkasten = this.add.text(1020, 600, '📬', { ...schrift, fontSize: '90px' }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      briefkasten.setVisible(!fund.briefkastenGefunden)
      briefkasten.on('pointerup', () => {
        if (auftauchen) return
        post.hidden = false
        post.querySelector('p').textContent = 'Du hast einen Briefkasten gefunden! Möchtest du ihn mit nach Hause nehmen?'
        mitnehmen.hidden = false
      })
      mitnehmen.addEventListener('click', () => {
        if (auftauchen || !briefkasten.visible) return
        fund.mitnehmen?.()
        briefkasten.setVisible(false).disableInteractive()
        mitnehmen.hidden = true
        post.querySelector('p').textContent = 'Du hast den Briefkasten eingepackt! Nach dem Auftauchen steht er bei deinem Haus.'
      })
      this.tweens.add({ targets: briefkasten, y: 588, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    } },
  })
  welt.querySelector('.tauch-raus').addEventListener('click', () => {
    if (auftauchen || !tauchSzene || !taucher) return
    auftauchen = true
    schatz.beenden()
    post.hidden = true
    const knopf = welt.querySelector('.tauch-raus')
    knopf.disabled = true
    knopf.textContent = 'Du tauchst auf …'
    tauchSzene.tweens.killTweensOf(taucher)
    for (let nummer = 0; nummer < 12; nummer++) {
      const blase = tauchSzene.add.circle(taucher.x + (nummer % 3 - 1) * 24, taucher.y + nummer * 14, 5 + nummer % 3 * 3, 0xe4fcff, 0.65)
      tauchSzene.tweens.add({ targets: blase, y: -40, alpha: 0, duration: 1100, delay: nummer * 65 })
    }
    tauchSzene.tweens.add({
      targets: taucher, y: -100, angle: -15, duration: 1800, ease: 'Sine.easeIn',
      onComplete: () => {
        tauchSzene.cameras.main.fadeOut(450, 193, 244, 247)
        tauchSzene.cameras.main.once('camerafadeoutcomplete', () => {
          spiel.destroy(true)
          welt.remove()
          zurueck()
        })
      },
    })
  })
}