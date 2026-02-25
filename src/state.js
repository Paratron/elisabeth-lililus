// =============================================================
// 💾 SPIELSTAND – Alles was gespeichert werden muss! 📦
// =============================================================

// 🎒 Der Rucksack – gehört dem Spieler, egal wo er ist!
export const rucksack = { holz: 0, stein: 0, eisen: 0, pizza: 0 }

// 🏠 Haus-Daten – bleiben erhalten wenn man rein- und rausgeht!
export const hausDaten = {
  wandFarbe: 0x8D6E63,
  dachFarbe: 0xC62828,
  bodenFarbe: 0xBCAAA4,
  moebel: [], // Liste der gebauten Möbel: [{emoji, name, x, y}]
  hausGebaut: false, // 🏠 Wurde das Haus schon gebaut?
  personGerettet: false, // 🆘 Wurde die Person in der Mine schon gerettet?
  freundHausGebaut: false, // 🏡 Wurde das Haus für den Freund gebaut?
  freundWandFarbe: 0xFF7043, // 🎨 Wandfarbe vom Freund-Haus
  freundDachFarbe: 0x4CAF50, // 🎨 Dachfarbe vom Freund-Haus
  hundGerettet: false, // 🐕 Wurde der Hund schon gerettet?
  tagesZeit: 'tag', // ☀️ Aktuelle Tageszeit: 'morgen', 'tag', 'abend', 'nacht'
  miloWachstum: 0, // 🌱 Milo wächst jeden Tag! (0=Baby, 1-4=wächst, 5=groß wie du!)
  miloKleidung: { // 👗 Milos Kleidung – kann man im Laden kaufen!
    kleidungFarbe: 0xFF7043, // 🎨 Standard: Orange (sein Hemd)
    kleidungTyp: 0,          // 0 = T-Shirt, 1 = Kleid, 2 = Hoodie
    hosenFarbe: 0x5D4037,    // 🩳 Standard: Braun
    schuhFarbe: 0x424242     // 👟 Standard: Dunkelgrau
  },
  miloBrauchtHilfe: false, // 🆘 Braucht Milo gerade Hilfe zuhause?
  stadtFreunde: [], // 🧑‍🤝‍🧑 Liste der Freunde in der Stadt! z.B. ['Lina', 'Finn']
  dorfFreunde: {}, // 🏘️ Freunde die ins Dorf gezogen sind! z.B. { Lina: { holz: 0, stein: 0, hausGebaut: false } }
  verheiratet: false, // 💒 Bist du mit Milo verheiratet?
  miloHerzen: 0, // 💕 Herzen die du durch Gespräche mit Milo gesammelt hast! Bei 5 fragt er dich!
  kinder: [], // 👶 Eure Kinder! z.B. [{name: 'Luna', farbe: 0xFF80AB}]
  sprache: 'de' // 🌍 Sprache: 'de' = Deutsch, 'en' = English
}

// =============================================================
// 💾 SPIELSTAND SPEICHERN & LADEN (localStorage)
// So geht nichts verloren wenn die Seite neu lädt! ✨
// =============================================================
const SAVE_KEY = 'blumenwiese-spielstand'

// 💾 Alles speichern!
export function spielSpeichern(szene, figurDaten, spielerPos) {
  try {
    const stand = {
      rucksack: { ...rucksack },
      hausDaten: {
        wandFarbe: hausDaten.wandFarbe,
        dachFarbe: hausDaten.dachFarbe,
        bodenFarbe: hausDaten.bodenFarbe,
        moebel: hausDaten.moebel,
        hausGebaut: hausDaten.hausGebaut,
        personGerettet: hausDaten.personGerettet,
        freundHausGebaut: hausDaten.freundHausGebaut,
        freundWandFarbe: hausDaten.freundWandFarbe,
        freundDachFarbe: hausDaten.freundDachFarbe,
        hundGerettet: hausDaten.hundGerettet,
        tagesZeit: hausDaten.tagesZeit,
        miloWachstum: hausDaten.miloWachstum,
        miloKleidung: hausDaten.miloKleidung,
        miloBrauchtHilfe: hausDaten.miloBrauchtHilfe,
        stadtFreunde: hausDaten.stadtFreunde,
        dorfFreunde: hausDaten.dorfFreunde,
        verheiratet: hausDaten.verheiratet,
        miloHerzen: hausDaten.miloHerzen,
        kinder: hausDaten.kinder,
        sprache: hausDaten.sprache
      },
      szene: szene,
      figurDaten: figurDaten || null,
      spielerPos: spielerPos || null,
      zeitstempel: Date.now()
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(stand))
  } catch (e) {
    // Kein Fehler zeigen – einfach weiterspielen
  }
}

// 📥 Alles laden!
export function spielLaden() {
  try {
    const json = localStorage.getItem(SAVE_KEY)
    if (!json) return null
    return JSON.parse(json)
  } catch (e) {
    return null
  }
}

// 📥 Gespeicherten Zustand in die globalen Variablen übernehmen
export function spielstandWiederherstellen(stand) {
  if (stand.rucksack) {
    rucksack.holz = stand.rucksack.holz || 0
    rucksack.stein = stand.rucksack.stein || 0
    rucksack.eisen = stand.rucksack.eisen || 0
    rucksack.pizza = stand.rucksack.pizza || 0
  }
  if (stand.hausDaten) {
    hausDaten.wandFarbe = stand.hausDaten.wandFarbe ?? 0x8D6E63
    hausDaten.dachFarbe = stand.hausDaten.dachFarbe ?? 0xC62828
    hausDaten.bodenFarbe = stand.hausDaten.bodenFarbe ?? 0xBCAAA4
    hausDaten.moebel = stand.hausDaten.moebel || []
    // 🐾 Hundebett entfernt – rausfiltern!
    hausDaten.moebel = hausDaten.moebel.filter(m => m.name !== 'Hundebett')
    hausDaten.hausGebaut = stand.hausDaten.hausGebaut || false
    hausDaten.personGerettet = stand.hausDaten.personGerettet || false
    hausDaten.freundHausGebaut = stand.hausDaten.freundHausGebaut || false
    hausDaten.freundWandFarbe = stand.hausDaten.freundWandFarbe ?? 0xFF7043
    hausDaten.freundDachFarbe = stand.hausDaten.freundDachFarbe ?? 0x4CAF50
    hausDaten.hundGerettet = stand.hausDaten.hundGerettet || false
    hausDaten.tagesZeit = stand.hausDaten.tagesZeit || 'tag'
    hausDaten.miloWachstum = stand.hausDaten.miloWachstum || 0
    hausDaten.miloKleidung = stand.hausDaten.miloKleidung || {
      kleidungFarbe: 0xFF7043,
      kleidungTyp: 0,
      hosenFarbe: 0x5D4037,
      schuhFarbe: 0x424242
    }
    hausDaten.miloBrauchtHilfe = stand.hausDaten.miloBrauchtHilfe || false
    hausDaten.stadtFreunde = stand.hausDaten.stadtFreunde || []
    hausDaten.dorfFreunde = stand.hausDaten.dorfFreunde || {}
    hausDaten.verheiratet = stand.hausDaten.verheiratet || false
    hausDaten.miloHerzen = stand.hausDaten.miloHerzen || 0
    hausDaten.kinder = stand.hausDaten.kinder || []
    hausDaten.sprache = stand.hausDaten.sprache || 'de'
  }
}

// 🗑️ Spielstand löschen (falls man neu starten will)
export function spielstandLoeschen() {
  localStorage.removeItem(SAVE_KEY)
}
