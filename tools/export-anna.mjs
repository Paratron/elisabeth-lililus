import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

const probe = process.argv.includes('--probe')
const ordner = join(tmpdir(), 'minimini-anna-export')
const ziel = resolve('public/assets/anna-zauberdiamant.mp4')
const bilderProSekunde = 12
await mkdir(ordner, { recursive: true })
await mkdir(resolve('public/assets'), { recursive: true })
const browser = await chromium.launch({ headless: true })
let encoder
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce', deviceScaleFactor: 1 })
  const seite = await context.newPage()
  const fehler = []
  seite.on('pageerror', (fehlertext) => fehler.push(fehlertext.message))
  await seite.route('**/__anna-export', (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0"></body></html>' }))
  await seite.goto('http://localhost:5176/__anna-export')
  await seite.evaluate(async () => {
    const { starteSerie } = await import('/src/serie.js')
    starteSerie()
    document.querySelector('.minimini-serie input').step = 'any'
    const stil = document.createElement('style')
    stil.textContent = '.minimini-serie .serie-controls,.minimini-serie header select,.minimini-serie header button{display:none!important}.minimini-serie header{justify-content:center;padding:12px}.minimini-serie h1{text-align:center}.minimini-serie footer{padding:10px}.minimini-serie .serie-caption{margin:0;max-width:none;min-height:48px}'
    document.head.append(stil)
    document.querySelector('.minimini-serie h1').textContent = 'Anna und der Zauberdiamant'
  })
  await seite.waitForSelector('.minimini-serie canvas')
  const bild = seite.locator('.minimini-serie')
  async function aufnehmen(zeit) {
    await seite.evaluate(async (sekunden) => {
      const regler = document.querySelector('.minimini-serie input')
      regler.value = sekunden
      regler.dispatchEvent(new Event('input', { bubbles: true }))
      await new Promise((fertig) => requestAnimationFrame(() => requestAnimationFrame(fertig)))
    }, zeit)
    return seite.screenshot({ type: 'png', animations: 'allow', clip: { x: 0, y: 0, width: 1280, height: 800 } })
  }
  if (probe) {
    const pruefung = []
    for (const zeit of [0, 32, 45, 45.25, 70, 95, 119]) {
      const daten = await aufnehmen(zeit)
      const datei = join(ordner, `anna-${zeit}.png`)
      await writeFile(datei, daten)
      pruefung.push({ zeit, datei, hash: createHash('sha256').update(daten).digest('hex'), szene: await bild.getAttribute('data-szene') })
    }
    if (pruefung[2].hash === pruefung[3].hash) throw new Error('Die Fluchtbilder bewegen sich nicht.')
    if (fehler.length) throw new Error(fehler.join('\n'))
    console.log(JSON.stringify(pruefung, null, 2))
  } else {
    const samples = await seite.evaluate(async () => {
      const audio = new OfflineAudioContext(1, 120 * 48000, 48000)
      function klang(zeit, frequenz, ende, dauer = 0.3, art = 'sine', laut = 0.035) {
        const ton = audio.createOscillator(), pegel = audio.createGain()
        ton.type = art
        ton.frequency.setValueAtTime(frequenz, zeit)
        ton.frequency.exponentialRampToValueAtTime(ende, zeit + dauer)
        pegel.gain.setValueAtTime(0.001, zeit)
        pegel.gain.linearRampToValueAtTime(laut, zeit + 0.025)
        pegel.gain.exponentialRampToValueAtTime(0.001, zeit + dauer)
        ton.connect(pegel); pegel.connect(audio.destination)
        ton.start(zeit); ton.stop(zeit + dauer)
      }
      for (let zeit = 0; zeit < 10; zeit += 2) klang(zeit, 1200, 850, 0.12, 'triangle', 0.018)
      klang(30, 240, 1200, 2)
      for (let zeit = 40; zeit < 88; zeit++) klang(zeit, 100, 65, 0.12, 'sine', 0.025)
      klang(90, 1100, 220, 2)
      klang(118, 660, 990, 1.2)
      const daten = (await audio.startRendering()).getChannelData(0)
      const bytes = new Uint8Array(daten.length * 2)
      const ansicht = new DataView(bytes.buffer)
      for (let index = 0; index < daten.length; index++) ansicht.setInt16(index * 2, Math.round(Math.max(-1, Math.min(1, daten[index])) * 32767), true)
      let binaer = ''
      for (let index = 0; index < bytes.length; index += 16384) binaer += String.fromCharCode(...bytes.subarray(index, index + 16384))
      return btoa(binaer)
    })
    const pcm = Buffer.from(samples, 'base64')
    const kopf = Buffer.alloc(44)
    kopf.write('RIFF'); kopf.writeUInt32LE(36 + pcm.length, 4); kopf.write('WAVEfmt ', 8)
    kopf.writeUInt32LE(16, 16); kopf.writeUInt16LE(1, 20); kopf.writeUInt16LE(1, 22)
    kopf.writeUInt32LE(48000, 24); kopf.writeUInt32LE(96000, 28)
    kopf.writeUInt16LE(2, 32); kopf.writeUInt16LE(16, 34); kopf.write('data', 36); kopf.writeUInt32LE(pcm.length, 40)
    const tondatei = join(ordner, 'anna.wav')
    await writeFile(tondatei, Buffer.concat([kopf, pcm]))
    const zwischenfilm = join(ordner, 'anna-video.mp4')
    encoder = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(bilderProSekunde), '-vcodec', 'png', '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-pix_fmt', 'yuv420p', zwischenfilm], { stdio: ['pipe', 'ignore', 'inherit'] })
    const fertig = once(encoder, 'close')
    let schreibfehler
    encoder.stdin.on('error', (fehlertext) => { schreibfehler = fehlertext })
    for (let frame = 0; frame < 120 * bilderProSekunde; frame++) {
      if (schreibfehler || encoder.exitCode !== null) throw schreibfehler || new Error('Videoencoder wurde beendet.')
      const daten = await aufnehmen(frame / bilderProSekunde)
      if (!encoder.stdin.write(daten)) await once(encoder.stdin, 'drain')
      if (frame % (10 * bilderProSekunde) === 0) console.log(`Aufgenommen: ${frame / bilderProSekunde}/120 Sekunden`)
    }
    encoder.stdin.end()
    if ((await fertig)[0] !== 0) throw new Error('Videoencoder fehlgeschlagen.')
    if (fehler.length) throw new Error(fehler.join('\n'))
    const muxer = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', zwischenfilm, '-i', tondatei, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-t', '120', '-movflags', '+faststart', ziel], { stdio: 'inherit' })
    if ((await once(muxer, 'close'))[0] !== 0) throw new Error('Ton konnte nicht hinzugefuegt werden.')
    await seite.route('**/__anna-film.mp4', async (route) => route.fulfill({ contentType: 'video/mp4', body: await readFile(ziel) }))
    const wiedergabe = await seite.evaluate(async () => {
      const video = document.createElement('video')
      video.src = '/__anna-film.mp4'
      document.body.append(video)
      await new Promise((fertig, fehler) => { video.onloadedmetadata = fertig; video.onerror = () => fehler(new Error('MP4 nicht lesbar')) })
      video.muted = true
      await video.play()
      await new Promise((fertig) => video.requestVideoFrameCallback(fertig))
      video.pause()
      return { dauer: video.duration, breite: video.videoWidth, hoehe: video.videoHeight, bereit: video.readyState }
    })
    if (wiedergabe.dauer !== 120 || wiedergabe.breite !== 1280 || wiedergabe.hoehe !== 800) throw new Error('Unerwartetes MP4-Format')
    console.log(JSON.stringify({ ziel, wiedergabe }, null, 2))
  }
} finally {
  if (encoder && encoder.exitCode === null) encoder.kill()
  await browser.close()
}