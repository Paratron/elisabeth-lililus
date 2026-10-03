import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { SERIEN_FOLGEN, serienZeit, serienText, starteSerie } from './serie.js'

test('Die gewuenschte Folge dauert zwei Minuten und hat sechs Szenen', () => {
  assert.equal(typeof starteSerie, 'function')
  assert.equal(SERIEN_FOLGEN.length, 1)
  assert.equal(SERIEN_FOLGEN[0].titel, 'Anna und der Zauberdiamant')
  for (const folge of SERIEN_FOLGEN) {
    assert.equal(folge.dauer, 120)
    assert.equal(folge.texte.length, 6)
    assert.equal(new Set(folge.texte).size, 6)
    assert.ok(folge.texte.every((text) => text.length > 10))
  }
})

test('Jede Szene beginnt nach zwanzig Sekunden', () => {
  for (const folge of [0]) {
    for (let szene = 0; szene < 6; szene++) {
      assert.deepEqual(serienZeit(folge, szene * 20), { zeit: szene * 20, szene, anteil: 0 })
      assert.equal(serienZeit(folge, szene * 20 + 19.99).szene, szene)
    }
  }
})

test('Anfang und Ende bleiben innerhalb der Geschichte', () => {
  assert.deepEqual(serienZeit(0, -10), { zeit: 0, szene: 0, anteil: 0 })
  assert.deepEqual(serienZeit(0, 999), { zeit: 120, szene: 5, anteil: 1 })
  assert.deepEqual(serienZeit(0, NaN), { zeit: 0, szene: 0, anteil: 0 })
  assert.equal(serienZeit(0, Infinity).zeit, 120)
  assert.equal(serienZeit(0, 70).anteil, 0.5)
})

test('Jede Szene hat vier verschiedene kurze Erzaehlabschnitte', () => {
  for (const folge of [0]) {
    for (let szene = 0; szene < 6; szene++) {
      const texte = [0, 5, 10, 15].map((sekunden) => serienText(folge, szene * 20 + sekunden))
      assert.equal(new Set(texte).size, 4)
      assert.ok(texte.every((text) => text.length > 10 && !/Mila|Anner/.test(text)))
      for (let abschnitt = 0; abschnitt < 4; abschnitt++) {
        assert.equal(serienText(folge, szene * 20 + abschnitt * 5 + 4.99), texte[abschnitt])
      }
    }
    assert.equal(serienText(folge, 120), serienText(folge, 119))
  }
})

test('Die Geschichte folgt genau Teeparty, Diamant, Schrumpfen, Schuhen, Bad und Wachstum', () => {
  assert.match(serienText(0, 0), /Anna.*Teeparty.*Teddy/)
  assert.match(serienText(0, 20), /Teekanne.*Diamant/)
  assert.match(serienText(0, 30), /berührt.*kleiner/)
  assert.match(serienText(0, 35), /Ameise/)
  assert.match(serienText(0, 45), /Schuhe/)
  assert.match(serienText(0, 50), /niemand auf sie tritt/)
  assert.match(serienText(0, 60), /Badezimmer/)
  assert.match(serienText(0, 70), /Waschbecken.*Badewanne/)
  assert.match(serienText(0, 75), /zweiter.*goldener Diamant/)
  assert.match(serienText(0, 85), /berührt.*goldenen Diamanten/)
  assert.match(serienText(0, 90), /wächst/)
  assert.match(serienText(0, 95), /normal groß/)
  assert.match(serienText(0, 110), /Teddy.*Teetisch/)
  assert.match(serienText(0, 120), /^Ende/)
  const geschichte = Array.from({ length: 24 }, (_, nummer) => serienText(0, nummer * 5)).join(' ')
  assert.doesNotMatch(geschichte, /Tilda|Muschel|Sternenkarte|verletzt|zerquetscht/)
})

test('Das Modul benutzt Phaser Canvas statt einer 3D-Abhaengigkeit und bleibt in Node importierbar', () => {
  const quelle = readFileSync(new URL('./serie.js', import.meta.url), 'utf8')
  assert.match(quelle, /import\('phaser'\)/)
  assert.match(quelle, /type: Phaser\.CANVAS/)
  assert.match(quelle, /mode: Phaser\.Scale\.FIT/)
  assert.doesNotMatch(quelle, /THREE|from ['"]three['"]|WebGLRenderer|speechSynthesis|localStorage|sessionStorage/)
  assert.match(quelle, /Ton ausschalten/)
  assert.match(quelle, /Ton einschalten/)
})