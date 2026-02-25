// =============================================================
// 🧠 MILO ANTWORTET – Milos schlaues Antwort-System!
// Wird auf der Wiese UND im Computer-Chat benutzt! 💬
// =============================================================
import Phaser from 'phaser'
import { rucksack, hausDaten } from './state.js'

// 🗣️ Milo antwortet auf Nachrichten!
// konfettiFn = optionale Funktion für Konfetti (nur auf der Wiese!)
export function miloAntwort(nachricht, konfettiFn) {
  const sprache = hausDaten.sprache || 'de'

  // 🇬🇧 Englisch?
  if (sprache === 'en') {
    return miloAntwortEnglisch(nachricht, konfettiFn)
  }

  // 🇩🇪 Deutsch (Standard!)
  return miloAntwortDeutsch(nachricht, konfettiFn)
}

// =============================================================
// 🇩🇪 DEUTSCHE ANTWORTEN
// =============================================================
function miloAntwortDeutsch(nachricht, konfettiFn) {
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

  // 🦔⚡ Blitz der Igel!
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
      if (konfettiFn) konfettiFn()
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

  // 🦕 Dinosaurier / Urzeit
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
    return Phaser.Math.RND.pick([
      '😊 Hmm? Erzähl mir mehr! 💬',
      '🤗 Was meinst du damit?\nIch bin neugierig! 😄',
      '💭 Sag mir mehr!\nIch höre zu! 👂',
      '😄 Oh! Und dann? 🤔',
      '🌟 Ja? Weiter! Ich will\nmehr hören! 😊',
    ])
  }

  if (text.includes('!')) {
    return Phaser.Math.RND.pick([
      '🤩 WOW! Du bist ja\nvoll aufgeregt! Ich auch! 🎉',
      '😄 JAAA! Deine Begeisterung\nsteckt mich an! 🌟',
      '🥳 So viel Energie!\nDas liebe ich! 💪',
      '🎉 YEAH! Das klingt\nMEGA! Erzähl mehr! 😄',
      '✨ OH JA! Da bin ich\nvoll dabei! 🤩',
    ])
  }

  if (text.includes('?')) {
    return Phaser.Math.RND.pick([
      '🤔 Gute Frage! Lass mich\nnachdenken... Hmm...\nIch weiß es nicht! 😅',
      '💭 Oh! Darüber hab ich\nnoch nie nachgedacht! 🧠',
      '😊 Puh, das ist schwer!\nAber ich versuche es:\nKeine Ahnung! 🤣',
      '🧠 Wow, du stellst die\nbesten Fragen!\nIch überlege... 🤔✨',
      '😄 Das ist eine SUPER\nFrage! Du bist so schlau! 🌟',
    ])
  }

  // 🌈 Standard-Antworten
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

// =============================================================
// 🇬🇧 ENGLISH ANSWERS – Milo speaks English too! 🌍
// =============================================================
function miloAntwortEnglisch(nachricht, konfettiFn) {
  const text = nachricht.toLowerCase()

  // 👋 Greeting
  if (text.match(/hello|hi |hey |good morning|good evening|howdy|sup|yo |what's up|whats up/)) {
    return Phaser.Math.RND.pick([
      '👋 Hey! Nice to see you!',
      '😊 Hello! How are you? 💕',
      '🤗 Hey! What shall we\ndo today? 🎮',
      '👋 Hiii! There you are! 😄',
    ])
  }

  // ❓ How are you?
  if (text.match(/how are|are you ok|you good|what.?s up|how do you|how.?s it going/)) {
    return Phaser.Math.RND.pick([
      '😊 I\'m doing great! Thanks!',
      '🥰 Awesome! I\'m so happy\nyou\'re here!',
      '😄 Super good! And you?',
    ])
  }

  // 🧑 Name / Who are you
  if (text.match(/name|who are you|who am i|introduce|know me/)) {
    return Phaser.Math.RND.pick([
      '😊 I\'m Milo! Your friend!',
      '🧑 My name is Milo!\nAnd you\'re the best! ⭐',
      '😎 I\'m Milo!\nNice to meet you!',
    ])
  }

  // 🐕 Dog / Bello / Animals
  if (text.match(/dog|bello|kitty|cat|horse|bird|butterfly|fish|animal|pet/)) {
    return Phaser.Math.RND.pick([
      '🐕 Bello is such a sweet dog!\nI love him so much! 🥰',
      '🐶 Woof woof! Haha,\nI can bark too! 😄',
      '🐾 I love animals!\nEspecially Bello! 🐕❤️',
    ])
  }

  // 🏠 House / Furniture
  if (text.match(/house|home|room|furniture|bed|door|window|roof|wall|kitchen/)) {
    return Phaser.Math.RND.pick([
      '🏠 I love my house!\nThanks for building it! 🥰',
      '🛋️ Have you put furniture\nin your house yet?',
      '🏡 Our village is getting\nmore beautiful! Awesome! ✨',
    ])
  }

  // ⛏️ Mine / Digging / Treasures
  if (text.match(/mine|dig|mountain|iron|gold|gem|diamond|treasure|cave|tunnel/)) {
    return Phaser.Math.RND.pick([
      '⛏️ The mine has amazing\ntreasures! But be careful!',
      '💎 Did you find a gemstone\nyet? They\'re super rare!',
      '🪨 I love the mine!\nIt sparkles so beautifully! ✨',
    ])
  }

  // 🌸 Flowers / Nature
  if (text.match(/flower|nature|meadow|tree|grass|plant|garden|outside|forest/)) {
    return Phaser.Math.RND.pick([
      '🌸 The flowers here are\nso beautiful! 🌺',
      '🌻 I love picking flowers!\nWhich ones do you like best?',
      '🌳 Trees give us wood\nand shade! Cool, right? 🌿',
    ])
  }

  // 🎮 Playing / Fun
  if (text.match(/play|fun|bored|do something|adventure|action|game/)) {
    return Phaser.Math.RND.pick([
      '🎮 Let\'s build something!\nOr go to the mine! ⛏️',
      '😄 Everything is fun\nwhen you\'re here!',
      '🌟 We could pick flowers\nor play with Bello! 🐕',
    ])
  }

  // 🦔 Blitz the Hedgehog!
  if (text.match(/blitz|hedgehog|fast|speed|pizza collect|red hedgehog|turbo/)) {
    return Phaser.Math.RND.pick([
      '🦔 BLITZ!! I LOVE Blitz!\nThe fastest hedgehog ever!\nAnd he\'s RED! ❤️💨',
      '🍕 You know what\'s great\nabout Blitz? He collects\nPIZZA everywhere! 🍕😋',
      '🦔 I wish I could be\nas fast as Blitz!\nZOOOOM! 💨😄',
    ])
  }

  // 😂 Funny / Jokes
  if (text.match(/joke|funny|laugh|haha|hihi|lol|silly|goofy/)) {
    return Phaser.Math.RND.pick([
      '😂 Hahaha! You\'re so funny!',
      '🤣 I have a joke!\nWhat does a shark say?\nSHARK you later! 🦈😂',
      '😄 Hehe! You always make\nme laugh!',
      '🤣 Why did the banana\ngo to the doctor?\nBecause it wasn\'t PEELING\nwell! 🍌😂',
    ])
  }

  // ❤️ Friendship / Love
  if (text.match(/love|friend|like you|sweet|nice|best|cool|great|awesome|amazing|fantastic|hug|cuddle/)) {
    return Phaser.Math.RND.pick([
      '🥰 Aww! You\'re my best\nfriend too! ❤️',
      '💕 That\'s so sweet!\nI love you too!',
      '🌟 You\'re the most amazing\nperson I know! ⭐',
      '🤗 *Milo hugs you tight*\nYou\'re simply the best! 💕',
    ])
  }

  // 🌙 Good night / Tired
  if (text.match(/night|tired|sleep|dark|moon|star|good night|dream|bed/)) {
    return Phaser.Math.RND.pick([
      '🌙 Good night! I\'m going\nto bed too! Sleep well! 💤',
      '😴 *yawn* Yeah, I\'m tired\ntoo... See you tomorrow! 💤🌟',
      '🌟 Good night! Sweet dreams!\nSee you tomorrow! 😊💤',
    ])
  }

  // 🍕 Pizza / Food / Hungry
  if (text.match(/pizza|hungry|food|yummy|cook|bake|cake|cookie|chocolate|candy|breakfast|lunch|dinner/)) {
    if (rucksack.pizza > 0) {
      rucksack.pizza -= 1
      if (konfettiFn) konfettiFn()
      return '🍕 PIZZA!! YESSS!!\nThis is the BEST pizza\nI\'ve EVER had!! 🥰🎉'
    }
    return Phaser.Math.RND.pick([
      '🍕 Mmh, pizza! I LOVE pizza!\nCan you get me one? 🥺',
      '🍕 There\'s an amazing\npizza shop in town! 🏙️',
      '😋 I would LOVE some pizza...\nWith extra cheese please! 🧀',
    ])
  }

  // 🎂 Age / Birthday
  if (text.match(/how old|birthday|years|born|age/)) {
    return Phaser.Math.RND.pick([
      '🎂 I\'m 8 years old!\nJust like you! Birthday\ntwins! 🎉',
      '🎈 My birthday is in summer!\nThere\'s cake and confetti! 🎂',
      '🎁 I love birthdays!\nWhen is yours? 🥳',
    ])
  }

  // 👨‍👩‍👧 Family
  if (text.match(/mom|dad|parent|brother|sister|family|grandma|grandpa/)) {
    return Phaser.Math.RND.pick([
      '👨‍👩‍👧 Family is everything!\nI\'m glad YOU are\nmy family! ❤️',
      '🥰 You\'re like a sister\nto me! 💕',
      '😊 Your family must be\nreally nice! 👨‍👩‍👧',
    ])
  }

  // 📚 School / Learning
  if (text.match(/school|learn|read|math|write|letter|teach|homework/)) {
    return Phaser.Math.RND.pick([
      '📚 I like going to school too!\nWell... most of the time! 😅',
      '🧮 Math can be hard...\nbut you\'re super smart! 🌟',
      '📖 Reading is awesome!\nYou can imagine stories! 📚✨',
    ])
  }

  // 😢 Sad / Bad mood
  if (text.match(/sad|cry|bad|angry|mad|scared|lonely|alone|miss|mean|unfair|annoying|stress/)) {
    return Phaser.Math.RND.pick([
      '🤗 Oh no! Come here,\nI\'ll give you a big hug! ❤️',
      '💕 Don\'t be sad!\nI\'m here for you!',
      '🌟 Together we can do\nanything! You\'re not alone! 💪',
    ])
  }

  // 😊 Yes
  if (text.match(/^yes$|^yes!|^ok$|^okay|^sure|^exactly|^right|^yep|^yup|^yeah/)) {
    return Phaser.Math.RND.pick([
      '😄 Awesome! Let\'s go! 🎉',
      '👍 Exactly! I think so too!',
      '🌟 Great! We agree! 😊',
    ])
  }

  // 😔 No
  if (text.match(/^no$|^no!|^nope|^never|don.?t want|don.?t like/)) {
    return Phaser.Math.RND.pick([
      '😊 Okay, no problem!\nWhat do you want to do?',
      '👍 That\'s fine! You decide! 😄',
      '🤗 It\'s okay! Just tell me\nwhen you want something else! 💕',
    ])
  }

  // 💭 Questions
  if (text.match(/^what |^why |^where |^when |^how much|^how many|^can you|^do you know/)) {
    return Phaser.Math.RND.pick([
      '🤔 Oh, good question!\nLet me think... 🧠',
      '😊 Hmm, let me think!\nI believe... I don\'t\nreally know! 😅',
      '💭 Wow, you\'re so curious!\nI love that! Keep asking! 😄',
    ])
  }

  // 🚀 Space
  if (text.match(/space|rocket|astronaut|planet|moon|sun|mars|jupiter|ufo|alien|galaxy/)) {
    return Phaser.Math.RND.pick([
      '🚀 WOOOOSH! Off to space!\nI\'d love to be an\nastronaut! 🌟',
      '🌙 The moon is so pretty!\nI wonder if anyone\nlives up there? 🤔',
      '🚀 3... 2... 1... LAUNCH!\nWe\'re flying to the moon! 🌙✨',
    ])
  }

  // 🚗 Vehicles
  if (text.match(/car|vehicle|train|bus|bike|plane|helicopter|fire truck|police|ship|boat/)) {
    return Phaser.Math.RND.pick([
      '🚗 VROOM VROOM! I love\nriding my bike! And you? 🚲',
      '🚒 Fire trucks are SO cool!\nThey help everyone! 🦸',
      '🚂 CHOO CHOO! I love trains!\nThey go so fast! 🚃',
    ])
  }

  // 🦸 Superheroes
  if (text.match(/superhero|superpower|fly|invisible|super strong|hero|power|cape|mask|save/)) {
    return Phaser.Math.RND.pick([
      '🦸 If I had a superpower,\nI\'d want to FLY!\nWhat about you? 🌟',
      '💪 YOU are a superhero!\nYou save me every day!\n🦸‍♀️✨',
      '✨ Together we\'re a\nsuperhero team! Nobody\ncan stop us! 💪🌟',
    ])
  }

  // 🍦 Ice cream / Sweets
  if (text.match(/ice cream|sweet|candy|gummy|sugar|chocolate|lollipop/)) {
    return Phaser.Math.RND.pick([
      '🍦 ICE CREAM! I love it!\nStrawberry is my favorite! 🍓',
      '🍬 Sweets are SO yummy!\nBut not too many or\nmy tummy will hurt! 😄',
      '🍫 Mmmmh! Yummy!\nI could eat sweets\nall day long! 😋',
    ])
  }

  // 👻 Monsters / Spooky
  if (text.match(/monster|spooky|scary|ghost|vampire|zombie|mummy|afraid|dark/)) {
    return Phaser.Math.RND.pick([
      '👻 BOOOO! Haha, did I\nscare you? 😄 Don\'t worry,\nI\'ll protect you!',
      '💪 Don\'t be scared!\nTogether we\'re stronger\nthan any monster! 🤝✨',
      '👻 If I were a ghost,\nI\'d tickle people instead\nof scaring them! 😂',
    ])
  }

  // 🏴‍☠️ Pirates
  if (text.match(/pirate|treasure hunt|treasure map|parrot|captain|arrr|ahoy/)) {
    return Phaser.Math.RND.pick([
      '🏴‍☠️ ARRR! I\'m Captain Milo!\nAll aboard! 🚢',
      '🗺️ A treasure map!\nX marks the spot!\nLet\'s search! 💎',
      '🦜 I\'d love to have a\nparrot on my shoulder!\nIt would say: ARRR! 😄',
    ])
  }

  // 👸 Princess / Castle
  if (text.match(/princess|queen|king|castle|crown|throne|fairy tale/)) {
    return Phaser.Math.RND.pick([
      '👸 You\'re a real princess!\nThe bravest in all\nthe land! 👑',
      '🏰 Imagine we had a castle!\nWith towers and a\ndrawbridge! 🏰',
      '👑 Every princess needs\na crown! Yours would be\nmade of stars! ⭐✨',
    ])
  }

  // 🤖 Robots
  if (text.match(/robot|machine|invent|build|tool|engine|tech|programm|code/)) {
    return Phaser.Math.RND.pick([
      '🤖 BEEP BOOP! I\'m Robot-Milo!\n🤖 Haha, just kidding! 😄',
      '🔧 Inventions are cool!\nWhat would you invent?\nI\'d build a pizza machine! 🍕',
      '🤖 Robots are cool!\nBut friends are better! 💕',
    ])
  }

  // 🎨 Art / Drawing
  if (text.match(/paint|draw|craft|art|picture|pencil|brush|paper|color/)) {
    return Phaser.Math.RND.pick([
      '🎨 Painting is SO cool!\nI love painting rainbows! 🌈',
      '✏️ Do you like drawing?\nI bet your pictures\nare beautiful! 🖼️',
      '🎨 I tried to draw Bello\nonce... It looked like\na potato! 😂🥔',
    ])
  }

  // 🦕 Dinosaurs
  if (text.match(/dino|t-rex|raptor|fossil|volcano|lava|mammoth/)) {
    return Phaser.Math.RND.pick([
      '🦕 DINOSAURS! They\'re SO cool!\nI love the T-Rex!\nROAAAR! 🦖',
      '🦖 Imagine a dinosaur on\nour meadow! It would\nbe HUGE! 😱',
      '🌋 Did you know dinosaurs\nlived for millions of years?\nThat\'s SO long! 🦕',
    ])
  }

  // ✨ Thank you
  if (text.match(/thank|thanks|thx|cheers/)) {
    return Phaser.Math.RND.pick([
      '😊 You\'re welcome!\nThat\'s what friends are for! ❤️',
      '🥰 My pleasure!\nYou deserve it! ✨',
      '💕 No problem at all!\nYou\'re the best! 🌟',
    ])
  }

  // 😜 Naughty words (respond friendly)
  if (text.match(/stupid|dumb|ugly|poo|pee|fart|stink|idiot|butt/)) {
    return Phaser.Math.RND.pick([
      '😜 Hihi, you little rascal! 🦡',
      '😂 Hahaha! You\'re being\nso silly today! 😜',
      '🤪 Oh my, now I\'m\nblushing! Hihi! 😊',
    ])
  }

  // 👋 Goodbye
  if (text.match(/bye|goodbye|see you|later|gotta go|leaving|ciao/)) {
    return Phaser.Math.RND.pick([
      '👋 Byeee! See you soon!\nI miss you already! 🥺💕',
      '😊 See you later! Come\nback soon! I\'ll wait! 💕',
      '🤗 Take care! You\'re\nthe best! Byeee! 👋✨',
    ])
  }

  // 🤝 Help words
  if (text.match(/help|need|can you|please help/)) {
    return Phaser.Math.RND.pick([
      '🤝 Of course I\'ll help!\nThat\'s what friends do! 💪',
      '😊 I\'m always here for you!\nWhat do you need? ❤️',
      '🌟 Together we can do\nanything! Tell me what\nto do! 💕',
    ])
  }

  // 🎉 Party
  if (text.match(/party|dance|disco|balloon|confetti/)) {
    return Phaser.Math.RND.pick([
      '🎉 PARTY! I love parties!\nWith music and dancing! 💃🕺',
      '🎈 Balloons! Confetti!\nLet\'s celebrate! 🎊',
      '🥳 Every day with you\nis like a party! 🎉💕',
    ])
  }

  // Short messages
  if (text.length < 5) {
    return Phaser.Math.RND.pick([
      '😊 Hmm? Tell me more! 💬',
      '🤗 What do you mean?\nI\'m curious! 😄',
      '💭 Say more! I\'m\nlistening! 👂',
      '😄 Oh! And then? 🤔',
    ])
  }

  // Excited messages (!)
  if (text.includes('!')) {
    return Phaser.Math.RND.pick([
      '🤩 WOW! You\'re so excited!\nMe too! 🎉',
      '😄 YESSS! Your excitement\nis catching! 🌟',
      '🥳 So much energy!\nI love it! 💪',
      '🎉 YEAH! That sounds\nAMAZING! Tell me more! 😄',
    ])
  }

  // Questions (?)
  if (text.includes('?')) {
    return Phaser.Math.RND.pick([
      '🤔 Good question! Let me\nthink... Hmm...\nI don\'t know! 😅',
      '💭 Oh! I\'ve never thought\nabout that before! 🧠',
      '😊 That\'s hard!\nBut I\'ll try:\nNo idea! 🤣',
    ])
  }

  // 🌈 Default answers
  return Phaser.Math.RND.pick([
    '😊 That\'s a great thought!\nYou\'re really smart! 🧠',
    '🤗 I think so too!\nWe think alike! 💕',
    '💬 Thanks for telling me!\nI love our chats! 😊',
    '🌟 Ohhh yes! You\'re so\nright! I agree! ⭐',
    '😄 Hihi! You\'re funny\nand smart and just\nthe best! 💕',
    '💕 You know what?\nI\'m glad you exist! ❤️',
    '🤩 Really? Wow, that\'s\nexciting! Tell me more! 😄',
    '😊 *Milo nods excitedly*\nYes yes! Exactly! 👍',
    '🌸 That sounds wonderful!\nYou have great ideas! ✨',
    '😎 Cool! I need to think\nabout that! You make me\nthink! 🧠',
    '🤗 I love when you tell\nme things! You\'re so\ninteresting! 💕',
    '🌟 EXACTLY! That\'s how\nI see it too! We\'re\na great team! 🤝',
    '💕 Every chat with you\nmakes me happy! ❤️✨',
  ])
}
