import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createIcons, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Check, Shuffle, UserRound, Shirt, Smile, MessageCircle, Volume2, VolumeX, X, Send, Coins, DoorOpen, Armchair, Backpack, NotebookPen, Monitor, Sofa, Paintbrush, RotateCw, Trash2, Plus } from 'lucide';
import './style.css';

const standard = { frisur: 'Bob', haut: '#dca17c', haare: '#542e23', oberteil: 'Pullover', farbe: '#e65a81', hose: 'Lang', hosenfarbe: '#487d9a', schuhe: 'Sneaker', schuhfarbe: '#f5bd45', hut: 'Keiner', brille: 'Keine', geschlecht: 'Mädchen', stimme: 'Hell', name: '', geburtstag: '', alter: '' };
const auswahl = { ...standard };
// Dein Entwurf bleibt auf diesem Gerät, wie in einer kleinen Schublade.
try {
  const gespeichert = JSON.parse(localStorage.getItem('lililus-figur') || 'null');
  if (gespeichert) for (const schluessel of Object.keys(standard)) {
    if (typeof gespeichert[schluessel] === 'string') auswahl[schluessel] = gespeichert[schluessel];
  }
} catch { /* Auch ohne Speicher kannst du spielen. */ }

// Bereits gespeicherte Geburtstage behalten Tag und Monat, aber nicht das Jahr.
if (/^\d{4}-\d{2}-\d{2}$/.test(auswahl.geburtstag)) {
  const datum = new Date(`${auswahl.geburtstag}T12:00:00Z`);
  auswahl.geburtstag = Number.isNaN(datum.getTime()) ? '' : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }).format(datum);
}

document.querySelector('#game').innerHTML = `
  <header><a class="marke" href="/">Lililus<span>3D</span></a><span class="schritt">DEINE FIGUR · 01</span></header>
  <main>
    <section class="buehne" aria-label="Dein 3D-Charakter">
      <div class="titel"><span class="augenbraue">GANZ DU. ODER GANZ ANDERS.</span><h1>Hallo, <span id="figurname">Lili!</span></h1></div>
      <div id="leinwand"></div>
      <div class="drehknopf"><button id="links" class="symbol" aria-label="Figur nach links drehen" title="Nach links drehen"><i data-lucide="arrow-left"></i></button><span>360°</span><button id="rechts" class="symbol" aria-label="Figur nach rechts drehen" title="Nach rechts drehen"><i data-lucide="arrow-right"></i></button></div>
      <div class="buehnenfuss"><span class="etikett">DEIN LILILU</span><button id="zufall" class="zufall"><i data-lucide="shuffle"></i> Überrasch mich</button></div>
      <div id="welt-ui" hidden>
        <div class="welttop"><div><span class="augenbraue">ZUHAUSE BEI DEN</span><h1>Lililus</h1><span class="geldstand"><i data-lucide="coins"></i><output id="guthaben" aria-label="Dein Geld">0</output></span></div><div class="weltwerkzeuge"><button id="ton" class="symbol" aria-label="Ton ausschalten" aria-pressed="true" title="Ton ausschalten"><i data-lucide="volume-2"></i></button><button id="umziehen" class="symbol" aria-label="Figur umziehen" title="Figur umziehen"><i data-lucide="shirt"></i></button></div></div>
        <p id="geldmeldung" role="status" hidden></p>
        <div id="schulwerkzeuge" hidden><button id="sitzen" class="primaer"><i data-lucide="armchair"></i><span>Hinsetzen</span></button><button id="ranzenladen" class="primaer"><i data-lucide="backpack"></i><span>Ranzen</span></button><button id="aufgaben" class="primaer"><i data-lucide="notebook-pen"></i><span>Aufgaben</span></button></div>
        <div id="hauswerkzeuge" hidden><button id="moebelladen" class="primaer"><i data-lucide="sofa"></i><span>Möbel</span></button><button id="zimmerfarben" class="primaer"><i data-lucide="paintbrush"></i><span>Farben</span></button><button id="computer" class="primaer"><i data-lucide="monitor"></i><span>Computer</span></button></div>
        <section id="schulpanel" hidden aria-labelledby="schultitel"><div class="schulkopf"><h2 id="schultitel"></h2><button id="schulschliessen" class="symbol" aria-label="Schulfenster schließen" title="Schließen"><i data-lucide="x"></i></button></div><div id="schulinhalt"></div></section>
        <div id="sprechblase" hidden role="status"><div class="sprechkopf"><strong id="sprechername"></strong><button id="nochmal" class="symbol" aria-label="Noch einmal anhören" title="Noch einmal anhören"><i data-lucide="volume-2"></i></button><button id="sprechende" class="symbol" aria-label="Gespräch schließen" title="Gespräch schließen"><i data-lucide="x"></i></button></div><p id="sprechtext"></p><p id="tonmeldung" data-tonmeldung></p></div>
        <form id="eigener-satz" hidden><label for="satz">Dein Satz</label><div><input id="satz" maxlength="120" placeholder="Hallo, ich bin Lili!" autocomplete="off"><button class="primaer" type="submit"><i data-lucide="send"></i> Sagen</button></div><button id="satzschliessen" type="button" class="symbol" aria-label="Sprechfeld schließen" title="Sprechfeld schließen"><i data-lucide="x"></i></button></form>
        <div class="weltunten"><div class="steuerkreuz" aria-label="Laufen"><button data-richtung="oben" class="symbol" aria-label="Nach vorne laufen"><i data-lucide="arrow-up"></i></button><button data-richtung="links" class="symbol" aria-label="Nach links laufen"><i data-lucide="arrow-left"></i></button><button data-richtung="unten" class="symbol" aria-label="Nach hinten laufen"><i data-lucide="arrow-down"></i></button><button data-richtung="rechts" class="symbol" aria-label="Nach rechts laufen"><i data-lucide="arrow-right"></i></button></div><div class="sprechaktionen"><button id="betreten" class="primaer" hidden><i data-lucide="door-open"></i><span>Betreten</span></button><button id="selberreden" class="primaer"><i data-lucide="message-circle"></i> Selbst reden</button><button id="reden" class="primaer" disabled><i data-lucide="message-circle"></i><span>Reden</span></button></div></div>
      </div>
    </section>
    <aside>
      <div class="panelkopf"><span class="augenbraue">FIGUREN-WERKSTATT</span><h2>Wer bist du heute?</h2></div>
      <nav aria-label="Charakter bearbeiten"><button data-tab="look" class="aktiv"><i data-lucide="smile"></i> Aussehen</button><button data-tab="kleidung"><i data-lucide="shirt"></i> Kleidung</button><button data-tab="profil"><i data-lucide="user-round"></i> Name & Co.</button></nav>
      <div id="einstellungen"></div>
      <div class="abschluss"><p id="meldung" role="status"></p><button id="fertig" class="primaer"><i data-lucide="check"></i> Das bin ich!</button></div>
    </aside>
  </main>
  `;

const symbole = () => createIcons({ icons: { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Check, Shuffle, UserRound, Shirt, Smile, MessageCircle, Volume2, VolumeX, X, Send, Coins, DoorOpen, Armchair, Backpack, NotebookPen, Monitor, Sofa, Paintbrush, RotateCw, Trash2, Plus } });
let aktuellerTab = 'look';
const frisuren = ['Kurz', 'Bob', 'Lang', 'Locken', 'Zöpfe'];
const hautfarben = ['#f5d5b8', '#dca17c', '#bd805d', '#925c40', '#623c2d', '#3d2821'];
const haarfarben = ['#241e1c', '#542e23', '#b26835', '#f2cf77', '#eee7da', '#db719b'];
const kleiderfarben = ['#e65a81', '#39a99c', '#487d9a', '#f5bd45', '#eee9df', '#3a3c44'];
const monate = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const monatstage = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function zeigeName() {
  document.querySelector('#figurname').textContent = `${auswahl.name.trim() || 'Lili'}!`;
  document.querySelector('h1').classList.toggle('langername', auswahl.name.trim().length > 12);
}

// 👧 Kinder sind kleiner. Ohne Altersangabe bleibt die bisherige Größe erhalten.
function figurengroesse(alter) {
  if (alter === '' || !Number.isFinite(Number(alter)) || Number(alter) < 0) return 1;
  if (Number(alter) < 4) return 0.55;
  if (Number(alter) < 13) return 0.72;
  if (Number(alter) < 18) return 0.87;
  return 1;
}

function geburtstagGueltig(wert) {
  if (wert === '') return true;
  const teile = /^(\d{2})\/(\d{2})$/.exec(wert);
  if (!teile) return false;
  const tag = Number(teile[1]);
  const monat = Number(teile[2]);
  return monat >= 1 && monat <= 12 && tag >= 1 && tag <= monatstage[monat - 1];
}

function optionen(titel, schluessel, werte) {
  return `<fieldset><legend>${titel}</legend><div class="optionen">${werte.map(wert => `<button data-feld="${schluessel}" data-wert="${wert}" aria-pressed="${auswahl[schluessel] === wert}" class="wahl ${auswahl[schluessel] === wert ? 'gewaehlt' : ''}">${wert}</button>`).join('')}</div></fieldset>`;
}
function farben(titel, schluessel, werte) {
  return `<fieldset><legend>${titel}</legend><div class="farben">${werte.map((wert, index) => `<button class="farbknopf ${auswahl[schluessel] === wert ? 'gewaehlt' : ''}" style="--farbe:${wert}" data-feld="${schluessel}" data-wert="${wert}" aria-label="${titel}, Farbe ${index + 1}" aria-pressed="${auswahl[schluessel] === wert}">${auswahl[schluessel] === wert ? '<i data-lucide="check"></i>' : ''}</button>`).join('')}</div></fieldset>`;
}
function zeigeEinstellungen() {
  const bereich = document.querySelector('#einstellungen');
  if (aktuellerTab === 'look') bereich.innerHTML = optionen('Frisur', 'frisur', frisuren) + farben('Haarfarbe', 'haare', haarfarben) + farben('Hautfarbe', 'haut', hautfarben) + optionen('Hut', 'hut', ['Keiner', 'Kappe', 'Sonnenhut']) + optionen('Brille', 'brille', ['Keine', 'Rund', 'Sonnenbrille']);
  if (aktuellerTab === 'kleidung') bereich.innerHTML = optionen('Oberteil', 'oberteil', ['T-Shirt', 'Pullover', 'Jacke']) + farben('Oberteilfarbe', 'farbe', kleiderfarben) + optionen('Hose', 'hose', ['Lang', 'Shorts']) + farben('Hosenfarbe', 'hosenfarbe', kleiderfarben) + optionen('Schuhe', 'schuhe', ['Sneaker', 'Stiefel']) + farben('Schuhfarbe', 'schuhfarbe', kleiderfarben);
  if (aktuellerTab === 'profil') {
    bereich.innerHTML = `<div class="profil">${optionen('Geschlecht', 'geschlecht', ['Mädchen', 'Junge', 'Divers'])}${optionen('Stimme', 'stimme', ['Hell', 'Tief'])}<button id="stimmprobe" class="zufall" type="button"><i data-lucide="volume-2"></i> Stimme anhören</button><p data-tonmeldung role="status" class="klein"></p><label for="name">Name</label><input id="name" maxlength="24" placeholder="Lili" autocomplete="off"><fieldset class="geburtstaggruppe"><legend>Geburtstag</legend><div class="geburtstagfelder"><div><label for="geburtstag-tag">Tag</label><select id="geburtstag-tag"></select></div><div><label for="geburtstag-monat">Monat</label><select id="geburtstag-monat"><option value="">Monat</option>${monate.map((monat, index) => `<option value="${String(index + 1).padStart(2, '0')}">${monat}</option>`).join('')}</select></div></div></fieldset><label for="alter">Alter</label><input id="alter" type="number" min="0" max="120" step="1" placeholder="8"><p class="datenschutz">Fantasie-Namen und Fantasie-Geburtstage sind willkommen. Alle Felder sind freiwillig.</p></div>`;
    const tagfeld = document.querySelector('#geburtstag-tag');
    const monatfeld = document.querySelector('#geburtstag-monat');
    const [tag = '', monat = ''] = auswahl.geburtstag.split('/');
    monatfeld.value = monat;
    function zeigeTage(gewaehlterTag) {
      const anzahl = monatstage[Number(monatfeld.value) - 1] || 31;
      tagfeld.innerHTML = '<option value="">Tag</option>' + Array.from({ length: anzahl }, (_, index) => `<option value="${String(index + 1).padStart(2, '0')}">${index + 1}</option>`).join('');
      tagfeld.value = Number(gewaehlterTag) <= anzahl ? gewaehlterTag : '';
    }
    zeigeTage(tag);
    function speichereGeburtstag() {
      auswahl.geburtstag = tagfeld.value || monatfeld.value ? `${tagfeld.value}/${monatfeld.value}` : '';
      tagfeld.setCustomValidity('');
      monatfeld.setCustomValidity('');
      document.querySelector('#meldung').textContent = '';
    }
    tagfeld.addEventListener('change', speichereGeburtstag);
    monatfeld.addEventListener('change', () => {
      // Im April gibt es zum Beispiel nur 30 Tage zur Auswahl.
      zeigeTage(tagfeld.value);
      speichereGeburtstag();
    });
    for (const schluessel of ['name', 'alter']) {
      const feld = document.getElementById(schluessel);
      feld.value = auswahl[schluessel];
      feld.addEventListener('input', () => {
        auswahl[schluessel] = feld.value;
        feld.setCustomValidity('');
        if (schluessel === 'alter') figur.scale.setScalar(figurengroesse(auswahl.alter));
        zeigeName();
        document.querySelector('#meldung').textContent = '';
      });
    }
  }
  symbole();
}

// Die Kamera ist dein Auge. Sie schaut auf unsere Figur.
const leinwand = document.querySelector('#leinwand');
const welt = new THREE.Scene();
const kamera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
kamera.position.set(0.5, 3.1, 8.6);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
leinwand.appendChild(renderer.domElement);
renderer.domElement.setAttribute('aria-label', 'Drehbare 3D-Figur');
const steuerung = new OrbitControls(kamera, renderer.domElement);
steuerung.target.set(0, 1.65, 0);
steuerung.enablePan = false;
steuerung.enableZoom = false;
steuerung.enableDamping = true;
steuerung.minPolarAngle = Math.PI / 3;
steuerung.maxPolarAngle = Math.PI / 2;
welt.add(new THREE.HemisphereLight(0xffffff, 0x809c8c, 2.5));
const sonne = new THREE.DirectionalLight(0xffffff, 3);
sonne.position.set(-3, 7, 5);
sonne.castShadow = true;
sonne.shadow.mapSize.set(1024, 1024);
welt.add(sonne);
const figur = new THREE.Group();
welt.add(figur);
const podest = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.45, 0.16, 64), new THREE.MeshStandardMaterial({ color: '#f6f3ed', roughness: 0.85 }));
podest.position.y = -0.08;
podest.receiveShadow = true;
welt.add(podest);
const boden = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.12 }));
boden.rotation.x = -Math.PI / 2;
boden.position.y = -0.17;
boden.receiveShadow = true;
welt.add(boden);

function teil(form, farbe, position, groesse, gruppe = figur) {
  const koerper = new THREE.Mesh(form, new THREE.MeshStandardMaterial({ color: farbe, roughness: 0.7 }));
  koerper.position.set(...position);
  if (groesse) koerper.scale.set(...groesse);
  koerper.castShadow = true;
  koerper.receiveShadow = true;
  gruppe.add(koerper);
  return koerper;
}
function baueFigur(merkmale = auswahl, ziel = figur) {
  const auswahl = merkmale;
  if (ziel === figur) ziel.scale.setScalar(figurengroesse(auswahl.alter));
  const baueTeil = (form, farbe, position, groesse) => teil(form, farbe, position, groesse, ziel);
  const kugel = (farbe, position, groesse) => baueTeil(new THREE.SphereGeometry(1, 24, 16), farbe, position, groesse);
  const kapsel = (farbe, position, radius, laenge) => baueTeil(new THREE.CapsuleGeometry(radius, laenge, 6, 16), farbe, position);
  // Alte Bausteine wegräumen, bevor wir die neue Kleidung anziehen.
  ziel.traverse(baustein => {
    if (!baustein.isMesh) return;
    baustein.geometry.dispose();
    baustein.material.dispose();
  });
  ziel.clear();
  ziel.userData.bewegung = { arme: [], beine: [], knie: [], augen: [], schritt: 0 };
  // 🎮 Ein Drehpunkt hält zusammen, was sich gemeinsam bewegen soll.
  function baueGelenk(name, position, bausteine) {
    const gelenk = new THREE.Group();
    gelenk.name = name;
    gelenk.position.set(...position);
    ziel.add(gelenk);
    for (const baustein of bausteine) {
      baustein.position.sub(gelenk.position);
      gelenk.add(baustein);
    }
    return gelenk;
  }
  const kurzeHose = auswahl.hose === 'Shorts';
  for (const seite of [-1, 1]) {
    const beinAnfang = ziel.children.length;
    kapsel(auswahl.haut, [seite * 0.22, 0.86, 0], 0.16, 0.27);
    kapsel(auswahl.hosenfarbe, [seite * 0.22, kurzeHose ? 0.99 : 0.93, 0], 0.19, kurzeHose ? 0.26 : 0.33);
    const knieAnfang = ziel.children.length;
    kapsel(auswahl.haut, [seite * 0.22, 0.35, 0], 0.15, 0.3);
    if (!kurzeHose) kapsel(auswahl.hosenfarbe, [seite * 0.22, 0.41, 0], 0.18, 0.31);
    kugel(auswahl.schuhfarbe, [seite * 0.22, 0.18, 0.11], [0.22, 0.17, 0.36]);
    baueTeil(new THREE.CylinderGeometry(0.21, 0.21, 0.07, 24), '#faf5e9', [seite * 0.22, 0.08, 0.11], [1, 1, 1.65]);
    if (auswahl.schuhe === 'Stiefel') kapsel(auswahl.schuhfarbe, [seite * 0.22, 0.35, 0], 0.205, 0.2);
    ziel.userData.bewegung.knie.push(baueGelenk(`Knie ${seite}`, [seite * 0.22, 0.61, 0], ziel.children.slice(knieAnfang)));
    ziel.userData.bewegung.beine.push(baueGelenk(`Bein ${seite}`, [seite * 0.22, 1.08, 0], ziel.children.slice(beinAnfang)));
    const armAnfang = ziel.children.length;
    const arm = kapsel(auswahl.haut, [seite * 0.62, 1.53, 0], 0.145, 0.62);
    arm.rotation.z = seite * 0.15;
    const aermel = kapsel(auswahl.farbe, [seite * 0.58, auswahl.oberteil === 'T-Shirt' ? 1.8 : 1.61, 0], 0.18, auswahl.oberteil === 'T-Shirt' ? 0.2 : 0.59);
    aermel.rotation.z = seite * 0.15;
    kugel(auswahl.haut, [seite * 0.68, 1.11, 0], [0.16, 0.18, 0.16]);
    ziel.userData.bewegung.arme.push(baueGelenk(`Arm ${seite}`, [seite * 0.55, 1.98, 0], ziel.children.slice(armAnfang)));
  }
  kugel(auswahl.hosenfarbe, [0, 1.1, 0], [0.44, 0.29, 0.29]);
  kugel(auswahl.farbe, [0, 1.64, 0], [0.51, 0.61, 0.33]);
  if (auswahl.oberteil === 'Jacke') {
    baueTeil(new THREE.BoxGeometry(0.055, 0.86, 0.045), '#faf5e9', [0, 1.63, 0.327]);
    for (const seite of [-1, 1]) baueTeil(new THREE.BoxGeometry(0.16, 0.13, 0.05), auswahl.hosenfarbe, [seite * 0.27, 1.42, 0.3]);
  } else {
    kugel('#faf5e9', [0, 1.72, 0.322], [0.13, 0.13, 0.022]);
    kugel('#f5bd45', [0, 1.72, 0.345], [0.067, 0.067, 0.015]);
  }
  kapsel(auswahl.haut, [0, 2.2, 0], 0.18, 0.14);
  kugel(auswahl.haut, [0, 2.72, 0], [0.61, 0.66, 0.51]);
  for (const seite of [-1, 1]) {
    const augeAnfang = ziel.children.length;
    kugel('#fff9f0', [seite * 0.215, 2.76, 0.464], [0.12, 0.15, 0.045]);
    kugel('#302b2b', [seite * 0.215, 2.75, 0.508], [0.061, 0.083, 0.021]);
    kugel('#ffffff', [seite * 0.215 - 0.017, 2.78, 0.527], [0.021, 0.025, 0.008]);
    ziel.userData.bewegung.augen.push(baueGelenk(`Auge ${seite}`, [seite * 0.215, 2.76, 0.464], ziel.children.slice(augeAnfang)));
    kugel('#e5998d', [seite * 0.36, 2.54, 0.413], [0.105, 0.051, 0.012]);
  }
  kugel(auswahl.haut, [0, 2.62, 0.51], [0.082, 0.08, 0.085]);
  const laecheln = baueTeil(new THREE.TorusGeometry(0.115, 0.018, 8, 20, Math.PI), '#834d42', [0, 2.51, 0.467]);
  laecheln.rotation.z = Math.PI;
  ziel.userData.bewegung.mund = laecheln;
  // Eine einzige Haarfläche: oben rund, hinten lang, vorne bleibt das Gesicht frei.
  if (auswahl.frisur === 'Lang') {
    const haarform = new THREE.SphereGeometry(1, 64, 48, 0, Math.PI * 2, 0, Math.PI / 2);
    const haarpunkte = haarform.attributes.position;
    for (let index = 0; index < haarpunkte.count; index++) {
      const winkel = Math.atan2(haarpunkte.getZ(index), haarpunkte.getX(index));
      const laenge = Math.acos(THREE.MathUtils.clamp(haarpunkte.getY(index), 0, 1)) / (Math.PI / 2);
      const vorne = THREE.MathUtils.smoothstep(Math.sin(winkel), 0.08, 0.65);
      let breite;
      let hoehe;
      if (laenge <= 0.42) {
        const rundung = laenge / 0.42 * 1.16;
        breite = Math.sin(rundung);
        hoehe = 2.76 + Math.cos(rundung) * 0.67;
      } else {
        const fall = (laenge - 0.42) / 0.58;
        breite = Math.sin(1.16) + (1 - Math.sin(1.16)) * Math.sin(fall * Math.PI / 2) - 0.04 * fall * fall;
        const unterkante = THREE.MathUtils.lerp(1.35 + Math.abs(Math.cos(winkel)) * 0.1, 2.98, vorne);
        hoehe = THREE.MathUtils.lerp(2.76 + Math.cos(1.16) * 0.67, unterkante, fall);
      }
      haarpunkte.setXYZ(index, Math.cos(winkel) * breite * 0.67, hoehe, Math.sin(winkel) * breite * 0.59 - 0.035);
    }
    haarform.computeVertexNormals();
    const haar = baueTeil(haarform, auswahl.haare, [0, 0, 0]);
    haar.material.side = THREE.DoubleSide;
  } else baueTeil(new THREE.SphereGeometry(1, 32, 20, 0, Math.PI * 2, 0, 1.3), auswahl.haare, [0, 2.76, -0.035], [0.645, 0.67, 0.555]);
  for (const seite of [-1, 1]) {
    if (auswahl.frisur === 'Bob') kugel(auswahl.haare, [seite * 0.53, 2.65, -0.08], [0.19, 0.52, 0.4]);
    if (auswahl.frisur === 'Zöpfe') {
      for (let index = 0; index < 4; index++) kugel(auswahl.haare, [seite * (0.64 + index * 0.03), 2.9 - index * 0.18, -0.13], [0.19 - index * 0.018, 0.17, 0.18]);
      kugel(auswahl.farbe, [seite * 0.72, 2.35, -0.13], [0.14, 0.06, 0.14]);
    }
  }
  if (auswahl.frisur === 'Locken') {
    for (let index = 0; index < 15; index++) {
      const winkel = index / 15 * Math.PI * 2;
      kugel(auswahl.haare, [Math.cos(winkel) * 0.5, 3.1 + Math.sin(winkel) * 0.19, Math.sin(winkel) * 0.38], [0.25, 0.25, 0.24]);
    }
  } else if (auswahl.frisur !== 'Lang') for (let index = 0; index < 5; index++) kugel(auswahl.haare, [-0.4 + index * 0.19, 3.12 - index * 0.025, 0.39], [0.16, 0.18, 0.16]);
  if (auswahl.hut !== 'Keiner') {
    const sonnenhut = auswahl.hut === 'Sonnenhut';
    baueTeil(new THREE.CylinderGeometry(sonnenhut ? 0.87 : 0.65, sonnenhut ? 0.87 : 0.65, 0.06, 48), sonnenhut ? '#f5d486' : auswahl.farbe, [0, 3.31, sonnenhut ? 0 : 0.19], [1, 1, sonnenhut ? 1 : 1.1]);
    baueTeil(new THREE.CylinderGeometry(0.36, 0.58, 0.32, 32), sonnenhut ? '#f5d486' : auswahl.farbe, [0, 3.47, -0.02]);
    if (sonnenhut) baueTeil(new THREE.CylinderGeometry(0.55, 0.58, 0.09, 32), auswahl.farbe, [0, 3.35, -0.02]);
  }
  if (auswahl.brille !== 'Keine') {
    for (const seite of [-1, 1]) {
      baueTeil(new THREE.TorusGeometry(0.164, 0.025, 8, 32), '#384044', [seite * 0.22, 2.75, 0.555]);
      if (auswahl.brille === 'Sonnenbrille') baueTeil(new THREE.CircleGeometry(0.145, 32), '#354f54', [seite * 0.22, 2.75, 0.555]);
      baueTeil(new THREE.BoxGeometry(0.04, 0.04, 0.42), '#384044', [seite * 0.4, 2.78, 0.36]);
    }
    baueTeil(new THREE.BoxGeometry(0.13, 0.03, 0.03), '#384044', [0, 2.77, 0.56]);
  }
  if (ziel === figur && ziel.userData.ranzenfarbe) zeigeRanzen();
}

document.querySelectorAll('[data-tab]').forEach(knopf => knopf.addEventListener('click', () => {
  aktuellerTab = knopf.dataset.tab;
  document.querySelectorAll('[data-tab]').forEach(tab => tab.classList.toggle('aktiv', tab === knopf));
  zeigeEinstellungen();
}));
document.querySelector('#einstellungen').addEventListener('click', ereignis => {
  if (ereignis.target.closest('#stimmprobe')) {
    sprich('Hallo! Ich bin dein Lililu.', auswahl.stimme);
    return;
  }
  const knopf = ereignis.target.closest('[data-feld]');
  if (!knopf) return;
  stoppeSprache();
  auswahl[knopf.dataset.feld] = knopf.dataset.wert;
  if (knopf.dataset.feld === 'geschlecht' && auswahl.geschlecht !== 'Divers') auswahl.stimme = auswahl.geschlecht === 'Mädchen' ? 'Hell' : 'Tief';
  document.querySelector('#meldung').textContent = '';
  baueFigur();
  zeigeEinstellungen();
});
document.querySelector('#links').addEventListener('click', () => { figur.rotation.y -= Math.PI / 4; });
document.querySelector('#rechts').addEventListener('click', () => { figur.rotation.y += Math.PI / 4; });
document.querySelector('#zufall').addEventListener('click', () => {
  const zufaellig = liste => liste[Math.floor(Math.random() * liste.length)];
  Object.assign(auswahl, { frisur: zufaellig(frisuren), haare: zufaellig(haarfarben), farbe: zufaellig(kleiderfarben), hosenfarbe: zufaellig(kleiderfarben), schuhfarbe: zufaellig(kleiderfarben), oberteil: zufaellig(['T-Shirt', 'Pullover', 'Jacke']), hose: zufaellig(['Lang', 'Shorts']), schuhe: zufaellig(['Sneaker', 'Stiefel']), hut: zufaellig(['Keiner', 'Kappe', 'Sonnenhut']), brille: zufaellig(['Keine', 'Rund', 'Sonnenbrille']) });
  document.querySelector('#meldung').textContent = '';
  baueFigur();
  zeigeEinstellungen();
});
document.querySelector('#fertig').addEventListener('click', () => {
  if (!geburtstagGueltig(auswahl.geburtstag)) {
    document.querySelector('[data-tab="profil"]').click();
    const feld = document.querySelector(document.querySelector('#geburtstag-tag').value ? '#geburtstag-monat' : '#geburtstag-tag');
    feld.setCustomValidity('Wähle einen Tag und einen Monat. Du kannst auch beides leer lassen.');
    feld.reportValidity();
    return;
  }
  if (auswahl.alter !== '' && (!Number.isInteger(Number(auswahl.alter)) || Number(auswahl.alter) < 0 || Number(auswahl.alter) > 120)) {
    document.querySelector('[data-tab="profil"]').click();
    document.querySelector('#alter').reportValidity();
    return;
  }
  if (aktuellerTab === 'profil' && !document.querySelector('#alter').reportValidity()) return;
  try { localStorage.setItem('lililus-figur', JSON.stringify(auswahl)); }
  catch { document.querySelector('#meldung').textContent = 'Speichern klappt gerade nicht. Du kannst trotzdem spielen.'; }
  betreteWelt();
});
new ResizeObserver(() => {
  const { width, height } = leinwand.getBoundingClientRect();
  if (!width || !height) return;
  kamera.aspect = width / height;
  kamera.updateProjectionMatrix();
  renderer.setSize(width, height);
}).observe(leinwand);

baueFigur();
zeigeEinstellungen();
zeigeName();
let imDorf = false;
let dorfGebaut = false;
let tonAn = true;
let naechsterNachbar = null;
let sprechenderNachbar = null;
let aktuellerSatz = '';
let letzteZeit = 0;
let sprachLaden = null;
let sprachAuftraege = Promise.resolve();
const stimmSitzungen = new Map();
let tonkontext = null;
let tonquelle = null;
let sprechnummer = 0;
const spieltoene = new Set();
let musikquelle = null;
let musikpufferLaden = null;
let musiknummer = 0;
const dorf = new THREE.Group();
dorf.name = 'Stadt';
dorf.visible = false;
welt.add(dorf);
const hindernisse = [];
const nachbarn = [];
const raumbewohner = [];
const bildungshaeuser = [];
const innenraum = new THREE.Group();
innenraum.name = 'Besuchsraum';
innenraum.visible = false;
welt.add(innenraum);
let besuchsort = null;
let naechsteBildung = null;
let sitzt = false;
const eigenerPlatz = new THREE.Vector3(2.5, 0, -0.1);
const ranzenfarben = ['#e65a81', '#487d9a', '#39a99c'];
const ranzenpreis = 1;
const schulaufgaben = [
  { frage: 'Wie viel ist 3 + 4?', antworten: ['6', '7', '8'], loesung: '7' },
  { frage: 'Wie viel ist 10 - 3?', antworten: ['6', '8', '7'], loesung: '7' },
  { frage: 'Welches Wort beginnt mit B?', antworten: ['Sonne', 'Ball', 'Katze'], loesung: 'Ball' },
  { frage: 'Wie viel ist 5 + 6?', antworten: ['11', '10', '12'], loesung: '11' },
  { frage: 'Welches Wort passt zum Lesen?', antworten: ['Schuh', 'Apfel', 'Buch'], loesung: 'Buch' },
  { frage: 'Wie viel ist 12 - 4?', antworten: ['9', '8', '7'], loesung: '8' }
];
let ranzenfarbe = ranzenfarben[0];
let schulmodus = '';
let aufgabennummer = 0;
let antwortGeprueft = false;
const geld = { muenzen: 0, besuchtAm: {}, ranzen: '', erledigt: [] };
try {
  const gespeichert = JSON.parse(localStorage.getItem('lililus-geld') || 'null');
  if (gespeichert && Number.isSafeInteger(gespeichert.muenzen) && gespeichert.muenzen >= 0) {
    geld.muenzen = gespeichert.muenzen;
    if (ranzenfarben.includes(gespeichert.ranzen)) geld.ranzen = gespeichert.ranzen;
    if (Array.isArray(gespeichert.erledigt)) geld.erledigt = [...new Set(gespeichert.erledigt.filter(nummer => Number.isInteger(nummer) && nummer >= 0 && nummer < schulaufgaben.length))];
    for (const ort of ['Schule', 'Kindergarten']) {
      if (typeof gespeichert.besuchtAm?.[ort] === 'string') geld.besuchtAm[ort] = gespeichert.besuchtAm[ort];
    }
  }
} catch { /* Du kannst auch ohne gespeichertes Geld spielen. */ }
zeigeGeld();
zeigeRanzen();
const moebeltypen = ['Computer', 'Sofa', 'Bett', 'Tisch', 'Stuhl', 'Teller', 'Schrank', 'Teppich', 'Pflanze', 'Lampe'];
const moebelgroessen = { Computer: [1.7, 1], Sofa: [2.45, 1], Bett: [1.7, 2.2], Tisch: [1.7, 1], Stuhl: [0.7, 0.7], Teller: [0.6, 0.6], Schrank: [1.4, 0.65], Teppich: [2.4, 1.7], Pflanze: [0.8, 0.8], Lampe: [0.7, 0.7] };
const zimmerpalette = ['#b7d0eb', '#39a99c', '#e65a81', '#f5bd45', '#eee9df', '#487d9a'];
const zuhause = { haus: '', wand: '#b7d0eb', boden: '#eee9df', moebel: [{ id: 1, typ: 'Computer', x: -3, z: -3, drehung: 0, farbe: '#487d9a' }] };
let hauswahl = null;
let moebelnummer = 1;
let moebelschub = null;
const moebelstrahl = new THREE.Raycaster();
const moebelzeiger = new THREE.Vector2();
const schiebeboden = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const schiebepunkt = new THREE.Vector3();
try {
  const gespeichert = JSON.parse(localStorage.getItem('lililus-zuhause') || 'null');
  if (gespeichert && /^Wohnhaus \d{1,2}$/.test(gespeichert.haus)) {
    zuhause.haus = gespeichert.haus;
    for (const feld of ['wand', 'boden']) if (zimmerpalette.includes(gespeichert[feld])) zuhause[feld] = gespeichert[feld];
    if (Array.isArray(gespeichert.moebel)) {
      const kennungen = new Set();
      zuhause.moebel = gespeichert.moebel.filter(moebel => {
        if (!moebel || !Number.isSafeInteger(moebel.id) || moebel.id < 1 || kennungen.has(moebel.id) || !moebeltypen.includes(moebel.typ) || !Number.isFinite(moebel.x) || !Number.isFinite(moebel.z) || Math.abs(moebel.x) > 4 || Math.abs(moebel.z) > 4 || !Number.isInteger(moebel.drehung) || moebel.drehung < 0 || moebel.drehung > 3 || !zimmerpalette.includes(moebel.farbe)) return false;
        kennungen.add(moebel.id);
        return true;
      }).slice(0, 32).map(moebel => ({ id: moebel.id, typ: moebel.typ, x: moebel.x, z: moebel.z, drehung: moebel.drehung, farbe: moebel.farbe }));
    }
  }
} catch { /* Dein Haus lässt sich auch ohne Speicher einrichten. */ }
const wassertropfen = [];
const wasserwellen = [];
let wasserstrahl = null;
let wasserkuppe = null;
const tasten = new Set();
const touchrichtungen = new Map();
const vorwaerts = new THREE.Vector3();
const seitwaerts = new THREE.Vector3();
const bewegung = new THREE.Vector3();
const kameraposition = new THREE.Vector3();
const pruefpunkt = new THREE.Vector3();

function baueDorf() {
  const wegeflaechen = [];
  const rasen = teil(new THREE.BoxGeometry(56, 0.3, 56), '#82bd7a', [0, -0.2, 0], null, dorf);
  rasen.castShadow = false;
  // 🏙️ Gehwege und Straßen verbinden die Stadtviertel.
  for (const platzX of [-13.5, 0, 13.5]) {
    const gehweg = teil(new THREE.BoxGeometry(6.6, 0.05, 54), '#e5ddc7', [platzX, -0.025, 0], null, dorf);
    wegeflaechen.push(new THREE.Box3().setFromObject(gehweg).expandByScalar(0.18));
    teil(new THREE.BoxGeometry(3.8, 0.03, 54), '#929b9d', [platzX, 0.012, 0], null, dorf);
  }
  for (const platzZ of [-13.5, 0, 13.5, 23]) {
    const gehweg = teil(new THREE.BoxGeometry(54, 0.05, 6.6), '#e5ddc7', [0, -0.02, platzZ], null, dorf);
    wegeflaechen.push(new THREE.Box3().setFromObject(gehweg).expandByScalar(0.18));
    teil(new THREE.BoxGeometry(54, 0.03, 3.8), '#929b9d', [0, 0.02, platzZ], null, dorf);
  }
  teil(new THREE.CylinderGeometry(4.5, 4.5, 0.08, 48), '#f6eee0', [0, 0.065, 0], null, dorf);
  const brunnen = new THREE.Group();
  brunnen.name = 'Stadtbrunnen';
  dorf.add(brunnen);
  teil(new THREE.CylinderGeometry(1.2, 1.35, 0.45, 32), '#c3cfcc', [0, 0.29, 0], null, brunnen);
  teil(new THREE.CylinderGeometry(1.08, 1.08, 0.06, 32), '#53c6da', [0, 0.53, 0], null, brunnen);
  wasserstrahl = teil(new THREE.CylinderGeometry(0.1, 0.18, 1.2, 12), '#7ddcec', [0, 1.12, 0], null, brunnen);
  wasserstrahl.name = 'Wasserstrahl';
  wasserkuppe = teil(new THREE.SphereGeometry(0.22, 16, 12), '#7ddcec', [0, 1.75, 0], null, brunnen);
  // 💧 Die Tropfen springen nach oben und fallen wieder ins Becken.
  for (let index = 0; index < 24; index++) {
    const tropfen = teil(new THREE.SphereGeometry(0.055, 8, 6), '#c2f2ff', [0, 1.75, 0], [1, 1.5, 1], brunnen);
    tropfen.castShadow = false;
    tropfen.receiveShadow = false;
    wassertropfen.push(tropfen);
  }
  for (let index = 0; index < 3; index++) {
    const welle = teil(new THREE.TorusGeometry(1, 0.018, 6, 32), '#c2f2ff', [0, 0.57, 0], null, brunnen);
    welle.rotation.x = -Math.PI / 2;
    welle.castShadow = false;
    welle.receiveShadow = false;
    welle.material.transparent = true;
    wasserwellen.push(welle);
  }
  hindernisse.push(new THREE.Box3(new THREE.Vector3(-1.55, -1, -1.55), new THREE.Vector3(1.55, 3, 1.55)));
  const hausfarben = ['#efadbc', '#ffe1a0', '#a9d9d0', '#b7d0eb', '#e7c8e4', '#f4c291'];
  const strassenplaetze = [-18, -9, 9, 18];
  const reihen = [-18, -7, 7, 18];
  const geschaefte = { 2: 'Rathaus', 4: 'Bäckerei', 6: 'Café', 7: 'Bücherei', 8: 'Kindergarten', 9: 'Schule', 10: 'Eisdiele' };
  for (let index = 0; index < 16; index++) {
    if (index === 3) continue;
    const haus = new THREE.Group();
    const geschaeft = geschaefte[index];
    haus.name = geschaeft || `Wohnhaus ${index + 1}`;
    haus.userData.gebaeude = true;
    haus.position.set(strassenplaetze[index % 4], 0, reihen[Math.floor(index / 4)]);
    dorf.add(haus);
    teil(new THREE.BoxGeometry(4.2, geschaeft ? 4.2 : 3.1, 3.8), hausfarben[index % hausfarben.length], [0, geschaeft ? 2.1 : 1.55, 0], null, haus);
    if (geschaeft) {
      teil(new THREE.BoxGeometry(4.7, 0.25, 4.3), '#547d7b', [0, 4.3, 0], null, haus);
      teil(new THREE.BoxGeometry(4.5, 0.15, 0.85), index % 2 ? '#f1bc54' : '#da6f85', [0, 2.45, 2.1], null, haus);
      for (const seite of [-1, 1]) teil(new THREE.BoxGeometry(0.9, 0.7, 0.12), '#75b9cd', [seite * 1.25, 3.35, 1.98], null, haus);
    } else {
      const dach = teil(new THREE.CylinderGeometry(0, 3.4, 1.8, 4), index % 2 ? '#547d7b' : '#c9746c', [0, 3.95, 0], [1, 1, 0.95], haus);
      dach.rotation.y = Math.PI / 4;
    }
    teil(new THREE.BoxGeometry(0.85, 1.65, 0.12), '#617c79', [0, 0.83, 1.94], null, haus);
    teil(new THREE.SphereGeometry(0.055, 8, 8), '#f6d76e', [0.28, 0.85, 2.03], null, haus);
    for (const seite of [-1, 1]) {
      teil(new THREE.BoxGeometry(1, 1.05, 0.12), '#fff9ef', [seite * 1.25, 1.88, 1.96], null, haus);
      teil(new THREE.BoxGeometry(0.78, 0.83, 0.13), '#75b9cd', [seite * 1.25, 1.88, 2.03], null, haus);
      teil(new THREE.BoxGeometry(0.06, 0.85, 0.05), '#fff9ef', [seite * 1.25, 1.88, 2.12], null, haus);
      teil(new THREE.BoxGeometry(0.8, 0.06, 0.05), '#fff9ef', [seite * 1.25, 1.88, 2.12], null, haus);
    }
    teil(new THREE.BoxGeometry(1.4, 0.14, 0.65), '#fff2de', [0, 0.07, 2.18], null, haus);
    teil(new THREE.BoxGeometry(1.2, 0.03, 2.1), '#e5ddc7', [0, -0.01, 3.4], null, haus);
    haus.updateMatrixWorld(true);
    // 🚶 Nur Wände und Stufen versperren den Weg, nicht das Dach oder der Gehweg.
    hindernisse.push(new THREE.Box3(new THREE.Vector3(haus.position.x - 2.5, -1, haus.position.z - 2.3), new THREE.Vector3(haus.position.x + 2.5, 5, haus.position.z + 2.8)));
    if (!geschaeft || geschaeft === 'Schule' || geschaeft === 'Kindergarten') {
      bildungshaeuser.push({ name: haus.name, istWohnhaus: !geschaeft, eingang: new THREE.Vector3(haus.position.x, 0, haus.position.z + 5) });
    }
    if (geschaeft) {
      // 🎨 Das Schild ist ein kleines selbst gemaltes Bild für unser Gebäude.
      const schildbild = document.createElement('canvas');
      schildbild.width = 512;
      schildbild.height = 128;
      const pinsel = schildbild.getContext('2d');
      pinsel.fillStyle = '#fff9ef';
      pinsel.fillRect(0, 0, 512, 128);
      pinsel.fillStyle = '#354740';
      pinsel.font = 'bold 52px sans-serif';
      pinsel.textAlign = 'center';
      pinsel.textBaseline = 'middle';
      pinsel.fillText(geschaeft, 256, 64, 470);
      const schildfarbe = new THREE.CanvasTexture(schildbild);
      schildfarbe.colorSpace = THREE.SRGBColorSpace;
      const schild = new THREE.Sprite(new THREE.SpriteMaterial({ map: schildfarbe }));
      schild.position.set(0, 5.2, 0);
      schild.scale.set(3.8, 0.95, 1);
      haus.add(schild);
    }
  }
  const park = teil(new THREE.BoxGeometry(7, 0.06, 7), '#64af6c', [18, 0.02, -18], null, dorf);
  park.name = 'Stadtpark';
  for (const [platzX, platzZ] of [[16, -20], [20, -20], [20, -16], [-24, -18], [-24, 7], [24, 7], [-5, 20], [5, -20]]) {
    teil(new THREE.CylinderGeometry(0.22, 0.3, 1.9, 10), '#997454', [platzX, 0.9, platzZ], null, dorf);
    teil(new THREE.SphereGeometry(1, 16, 12), '#409e6a', [platzX, 2.8, platzZ], [1.3, 1.5, 1.3], dorf);
    hindernisse.push(new THREE.Box3(new THREE.Vector3(platzX - 0.55, -1, platzZ - 0.55), new THREE.Vector3(platzX + 0.55, 4, platzZ + 0.55)));
  }
  for (const [platzX, platzZ] of [[-3.7, 0], [3.7, 0], [18, -17]]) {
    teil(new THREE.BoxGeometry(1.8, 0.15, 0.65), '#b58159', [platzX, 0.55, platzZ], null, dorf);
    teil(new THREE.BoxGeometry(1.8, 0.65, 0.12), '#b58159', [platzX, 0.94, platzZ - 0.3], null, dorf);
    for (const seite of [-1, 1]) teil(new THREE.BoxGeometry(0.12, 0.5, 0.5), '#526a65', [platzX + seite * 0.65, 0.25, platzZ], null, dorf);
    hindernisse.push(new THREE.Box3(new THREE.Vector3(platzX - 1.1, -1, platzZ - 0.6), new THREE.Vector3(platzX + 1.1, 2, platzZ + 0.6)));
  }
  for (const platzX of [-3.1, 3.1]) for (const platzZ of [-20, -10, 10, 20]) {
    teil(new THREE.CylinderGeometry(0.06, 0.09, 2.7, 8), '#53696d', [platzX, 1.35, platzZ], null, dorf);
    const lampe = teil(new THREE.SphereGeometry(0.22, 12, 8), '#ffe8a0', [platzX, 2.8, platzZ], null, dorf);
    lampe.material.emissive.setHex(0x8a6422);
  }
  for (let index = 0; index < 32; index++) {
    const winkel = index * 2.4;
    const platzX = Math.sin(winkel) * (5 + index % 10);
    const platzZ = Math.cos(winkel) * (5 + index % 10);
    const blumenplatz = new THREE.Vector3(platzX, 0.08, platzZ);
    if (Math.hypot(platzX, platzZ) < 4.68 || wegeflaechen.some(flaeche => flaeche.containsPoint(blumenplatz)) || hindernisse.some(hindernis => hindernis.containsPoint(blumenplatz))) continue;
    teil(new THREE.CylinderGeometry(0.035, 0.035, 0.25, 6), '#3c9256', [platzX, 0.08, platzZ], null, dorf);
    const bluete = teil(new THREE.SphereGeometry(0.12, 8, 6), index % 2 ? '#fff0a7' : '#ef7eaa', [platzX, 0.25, platzZ], null, dorf);
    bluete.name = 'Blume';
  }
  const freunde = [
    { name: 'Mila', alter: 8, stimme: 'Hell', farbe: '#f1c45a', aussehen: { geschlecht: 'Mädchen', frisur: 'Zöpfe', haare: '#542e23', oberteil: 'T-Shirt', hose: 'Shorts' }, position: [-2.4, 0, 3], saetze: ['Hallo! Ich bin Mila und acht Jahre alt. Schön, dass du da bist!', 'Ich mag unsere Stadt. Welches Haus gefällt dir?', 'Heute ist ein guter Tag für einen Spaziergang!'] },
    { name: 'Ben', alter: 28, stimme: 'Tief', farbe: '#4fa4ce', aussehen: { geschlecht: 'Junge', frisur: 'Kurz', haare: '#b26835', haut: '#bd805d', oberteil: 'Jacke', schuhe: 'Stiefel' }, position: [2.6, 0, -3], saetze: ['Hallo! Ich heiße Ben. Willkommen bei den Lililus!', 'Hast du die bunten Blumen schon gesehen?', 'Meine Lieblingsfarbe ist Blau. Und deine?'] },
    { name: 'Nora', alter: 34, stimme: 'Hell', farbe: '#9b77b3', aussehen: { geschlecht: 'Mädchen', frisur: 'Bob', haare: '#241e1c', haut: '#925c40', brille: 'Rund' }, position: [-2.5, 0, -9], saetze: ['Hallo! Ich bin Nora. Wollen wir Freunde sein?', 'Ich habe heute Geburtstag. Wir feiern am Stadtplatz!', 'Du hast dir tolle Kleidung ausgesucht!'] },
    { name: 'Leo', alter: 10, stimme: 'Tief', farbe: '#39a99c', aussehen: { geschlecht: 'Junge', frisur: 'Locken', haare: '#542e23', haut: '#623c2d', oberteil: 'T-Shirt', hose: 'Shorts', schuhfarbe: '#eee9df' }, position: [2.5, 0, 9], saetze: ['Hallo! Ich bin Leo und zehn Jahre alt. Schön, dich kennenzulernen!', 'Ich gehe heute in der Stadt spazieren.', 'Wollen wir zusammen die Häuser anschauen?'] }
  ];
  for (const freund of freunde) {
    const nachbar = new THREE.Group();
    nachbar.name = freund.name;
    nachbar.userData.alter = freund.alter;
    baueFigur({ ...standard, ...freund.aussehen, farbe: freund.farbe }, nachbar);
    nachbar.scale.setScalar(0.65 * figurengroesse(freund.alter));
    nachbar.position.set(...freund.position);
    nachbar.rotation.y = 0.3;
    dorf.add(nachbar);
    nachbarn.push({ ...freund, figur: nachbar, satznummer: 0 });
  }
}

function zeigeGeld() {
  const anzeige = document.querySelector('#guthaben');
  anzeige.textContent = new Intl.NumberFormat('de-DE', { notation: 'compact', maximumFractionDigits: 1 }).format(geld.muenzen);
  anzeige.setAttribute('aria-label', `${geld.muenzen} Münzen`);
}

function speichereGeld() {
  try { localStorage.setItem('lililus-geld', JSON.stringify(geld)); return true; }
  catch { return false; }
}

// 🎒 Der gekaufte Ranzen bleibt beim Umziehen und beim nächsten Spiel dabei.
function zeigeRanzen() {
  figur.userData.ranzenfarbe = geld.ranzen;
  const alterRanzen = figur.getObjectByName('Schulranzen');
  if (alterRanzen) {
    alterRanzen.traverse(baustein => { if (baustein.isMesh) { baustein.geometry.dispose(); baustein.material.dispose(); } });
    figur.remove(alterRanzen);
  }
  if (!geld.ranzen) return;
  const ranzen = new THREE.Group();
  ranzen.name = 'Schulranzen';
  figur.add(ranzen);
  teil(new THREE.BoxGeometry(0.66, 0.7, 0.35), geld.ranzen, [0, 1.64, -0.48], null, ranzen);
  teil(new THREE.BoxGeometry(0.6, 0.26, 0.04), geld.ranzen, [0, 1.85, -0.68], null, ranzen);
  teil(new THREE.BoxGeometry(0.32, 0.22, 0.05), '#f5bd45', [0, 1.47, -0.69], null, ranzen);
  teil(new THREE.TorusGeometry(0.13, 0.03, 6, 16, Math.PI), '#384044', [0, 2, -0.48], null, ranzen);
  for (const seite of [-1, 1]) teil(new THREE.BoxGeometry(0.055, 0.6, 0.05), geld.ranzen, [seite * 0.25, 1.69, 0.35], null, ranzen);
}

function schliesseSchulpanel() {
  beendeMoebelschieben(true);
  document.querySelector('#schulpanel').hidden = true;
  schulmodus = '';
  stoppeSprache();
}

function oeffneSchulpanel(titel) {
  beendeGespraech();
  document.querySelector('#eigener-satz').hidden = true;
  document.querySelector('#geldmeldung').hidden = true;
  document.querySelector('#schultitel').textContent = titel;
  document.querySelector('#schulpanel').hidden = false;
  tasten.clear();
  touchrichtungen.clear();
}

function zeigeRanzenladen() {
  schulmodus = 'laden';
  oeffneSchulpanel(besuchsort?.istWohnhaus ? 'Ranzen-Werkstatt' : 'Ranzenladen');
  const besitztRanzen = Boolean(geld.ranzen);
  document.querySelector('#schulinhalt').innerHTML = `<div class="ranzenbild" style="color:${ranzenfarbe}"><i data-lucide="backpack"></i></div><p class="ranzenpreis">${besitztRanzen ? 'Dein Schulranzen' : `Schulranzen · ${ranzenpreis} Münze`}</p><div class="farben">${ranzenfarben.map((farbe, index) => `<button class="farbknopf ${farbe === ranzenfarbe ? 'gewaehlt' : ''}" style="--farbe:${farbe}" data-ranzen="${farbe}" aria-label="Ranzenfarbe ${['Rosa', 'Blau', 'Mint'][index]}" aria-pressed="${farbe === ranzenfarbe}">${farbe === ranzenfarbe ? '<i data-lucide="check"></i>' : ''}</button>`).join('')}</div><button id="ranzenkaufen" class="primaer" ${!besitztRanzen && geld.muenzen < ranzenpreis ? 'disabled' : ''}>${besitztRanzen ? 'Farbe ändern' : `Kaufen (${ranzenpreis} Münze)`}</button><p id="schulrueckmeldung" role="status">${!besitztRanzen && geld.muenzen < ranzenpreis ? 'Du brauchst noch ' + (ranzenpreis - geld.muenzen) + ' Münze.' : ''}</p>`;
  symbole();
}

function zeigeAufgabe() {
  schulmodus = 'aufgaben';
  antwortGeprueft = false;
  oeffneSchulpanel('Aufgaben von Frau Sommer');
  aufgabennummer = schulaufgaben.findIndex((aufgabe, nummer) => !geld.erledigt.includes(nummer));
  if (aufgabennummer === -1) {
    document.querySelector('#schulinhalt').innerHTML = '<p class="aufgabenfrage">Alle sechs Aufgaben geschafft!</p><p>Frau Sommer freut sich über deine Arbeit.</p>';
    return;
  }
  const aufgabe = schulaufgaben[aufgabennummer];
  document.querySelector('#schulinhalt').innerHTML = `<p class="aufgabenfortschritt">${geld.erledigt.length} von ${schulaufgaben.length} geschafft</p><p class="aufgabenfrage">${aufgabe.frage}</p><div class="antworten">${aufgabe.antworten.map(antwort => `<button class="wahl" data-antwort="${antwort}">${antwort}</button>`).join('')}</div><p id="schulrueckmeldung" role="status"></p><button id="naechsteaufgabe" class="primaer" hidden>Nächste Aufgabe</button>`;
}

document.querySelector('#schulschliessen').addEventListener('click', schliesseSchulpanel);
document.querySelector('#ranzenladen').addEventListener('click', () => {
  if (besuchsort?.name !== 'Schule') return;
  ranzenfarbe = geld.ranzen || ranzenfarben[0];
  zeigeRanzenladen();
});
document.querySelector('#aufgaben').addEventListener('click', () => {
  if (besuchsort?.name === 'Schule' && sitzt) zeigeAufgabe();
});
document.querySelector('#schulinhalt').addEventListener('click', ereignis => {
  if (besuchsort?.name !== 'Schule' && !besuchsort?.istWohnhaus) return;
  const farbknopf = ereignis.target.closest('[data-ranzen]');
  if (schulmodus === 'laden' && farbknopf && ranzenfarben.includes(farbknopf.dataset.ranzen)) {
    ranzenfarbe = farbknopf.dataset.ranzen;
    zeigeRanzenladen();
  } else if (schulmodus === 'laden' && ereignis.target.closest('#ranzenkaufen')) {
    if (!geld.ranzen && geld.muenzen < ranzenpreis) return;
    if (!geld.ranzen) geld.muenzen -= ranzenpreis;
    geld.ranzen = ranzenfarbe;
    const gespeichert = speichereGeld();
    zeigeGeld();
    zeigeRanzen();
    zeigeRanzenladen();
    document.querySelector('#schulrueckmeldung').textContent = gespeichert ? 'Dein Ranzen ist angezogen und gespeichert.' : 'Dein Ranzen ist angezogen. Speichern klappt gerade nicht.';
    spieleKlang('start');
  } else if (schulmodus === 'aufgaben' && sitzt) {
    const antwortknopf = ereignis.target.closest('[data-antwort]');
    const aufgabe = schulaufgaben[aufgabennummer];
    if (antwortknopf && aufgabe && !antwortGeprueft && aufgabe.antworten.includes(antwortknopf.dataset.antwort)) {
      const meldung = document.querySelector('#schulrueckmeldung');
      if (antwortknopf.dataset.antwort !== aufgabe.loesung) {
        meldung.textContent = 'Noch nicht ganz. Probier es noch einmal.';
        return;
      }
      antwortGeprueft = true;
      if (!geld.erledigt.includes(aufgabennummer)) geld.erledigt.push(aufgabennummer);
      meldung.textContent = speichereGeld() ? 'Richtig! Gut gerechnet oder gelesen.' : 'Richtig! Speichern klappt gerade nicht.';
      document.querySelectorAll('[data-antwort]').forEach(knopf => { knopf.disabled = true; });
      document.querySelector('#naechsteaufgabe').hidden = false;
      spieleKlang('start');
    } else if (antwortGeprueft && ereignis.target.closest('#naechsteaufgabe')) zeigeAufgabe();
  }
});

// 🪙 Jeder Ort schenkt dir einmal am echten Kalendertag zehn Spielmünzen.
function belohneBesuch(ort) {
  const heute = new Date().toLocaleDateString('de-DE');
  const meldung = document.querySelector('#geldmeldung');
  meldung.hidden = false;
  if (geld.besuchtAm[ort] === heute) {
    meldung.textContent = `${ort}: Deine Münzen für heute hast du schon bekommen.`;
    return;
  }
  geld.muenzen = Math.min(Number.MAX_SAFE_INTEGER, geld.muenzen + 10);
  geld.besuchtAm[ort] = heute;
  zeigeGeld();
  meldung.textContent = `${ort} besucht: +10 Münzen!`;
  if (!speichereGeld()) meldung.textContent += ' Speichern klappt gerade nicht.';
  spieleKlang('start');
}

function speichereZuhause() {
  try { localStorage.setItem('lililus-zuhause', JSON.stringify(zuhause)); return true; }
  catch { return false; }
}

function baueEinrichtung() {
  const alt = innenraum.getObjectByName('Einrichtung');
  if (alt) {
    alt.traverse(baustein => { baustein.geometry?.dispose(); baustein.material?.dispose(); });
    innenraum.remove(alt);
  }
  const einrichtung = new THREE.Group();
  einrichtung.name = 'Einrichtung';
  innenraum.add(einrichtung);
  innenraum.userData.hindernisse = [];
  for (const moebel of zuhause.moebel) {
    const gruppe = new THREE.Group();
    gruppe.name = `${moebel.typ} ${moebel.id}`;
    gruppe.userData.moebelId = moebel.id;
    einrichtung.add(gruppe);
    const kasten = (breite, hoehe, tiefe, farbe, position) => teil(new THREE.BoxGeometry(breite, hoehe, tiefe), farbe, position, null, gruppe);
    if (moebel.typ === 'Computer' || moebel.typ === 'Tisch') {
      kasten(1.7, 0.12, 1, '#eee9df', [0, 0.95, 0]);
      for (const seite of [-1, 1]) for (const vorne of [-1, 1]) kasten(0.1, 0.9, 0.1, '#526a65', [seite * 0.7, 0.45, vorne * 0.4]);
      if (moebel.typ === 'Computer') {
        kasten(0.12, 0.35, 0.15, '#384044', [0, 1.16, -0.25]);
        kasten(0.95, 0.6, 0.13, '#384044', [0, 1.48, -0.25]);
        kasten(0.8, 0.45, 0.02, moebel.farbe, [0, 1.48, -0.174]);
        kasten(0.85, 0.03, 0.28, '#b7d0eb', [0, 1.03, 0.15]);
      }
    } else if (moebel.typ === 'Stuhl') {
      kasten(0.7, 0.1, 0.7, moebel.farbe, [0, 0.5, 0]);
      kasten(0.7, 0.65, 0.12, moebel.farbe, [0, 0.83, -0.29]);
      for (const seite of [-1, 1]) for (const vorne of [-1, 1]) kasten(0.09, 0.45, 0.09, '#b58159', [seite * 0.26, 0.225, vorne * 0.26]);
    } else if (moebel.typ === 'Teller') {
      teil(new THREE.CylinderGeometry(0.28, 0.26, 0.035, 32), '#fff9ef', [0, 0.025, 0], null, gruppe);
      const rand = teil(new THREE.TorusGeometry(0.255, 0.025, 8, 32), moebel.farbe, [0, 0.047, 0], null, gruppe);
      rand.rotation.x = Math.PI / 2;
    } else if (moebel.typ === 'Sofa') {
      kasten(2.2, 0.45, 0.9, moebel.farbe, [0, 0.4, 0]);
      kasten(2.2, 0.8, 0.2, moebel.farbe, [0, 0.7, -0.4]);
      for (const seite of [-1, 1]) kasten(0.22, 0.65, 1, moebel.farbe, [seite * 1.1, 0.6, 0]);
    } else if (moebel.typ === 'Bett') {
      kasten(1.7, 0.45, 2.2, '#b58159', [0, 0.25, 0]);
      kasten(1.65, 0.13, 1.6, moebel.farbe, [0, 0.52, 0.25]);
      kasten(1.7, 0.9, 0.12, '#b58159', [0, 0.5, -1.05]);
      for (const seite of [-1, 1]) kasten(0.65, 0.15, 0.4, '#fff9ef', [seite * 0.4, 0.54, -0.7]);
    } else if (moebel.typ === 'Schrank') {
      kasten(1.4, 1.8, 0.65, moebel.farbe, [0, 0.9, 0]);
      for (const seite of [-1, 1]) kasten(0.055, 0.2, 0.06, '#f5bd45', [seite * 0.12, 0.95, 0.355]);
    } else if (moebel.typ === 'Teppich') {
      kasten(2.4, 0.025, 1.7, moebel.farbe, [0, 0.015, 0]);
    } else if (moebel.typ === 'Pflanze') {
      teil(new THREE.CylinderGeometry(0.25, 0.18, 0.35, 16), moebel.farbe, [0, 0.18, 0], null, gruppe);
      teil(new THREE.SphereGeometry(1, 16, 12), '#409e6a', [0, 0.75, 0], [0.4, 0.55, 0.4], gruppe);
    } else if (moebel.typ === 'Lampe') {
      teil(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 16), '#526a65', [0, 0.03, 0], null, gruppe);
      teil(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 8), '#526a65', [0, 0.6, 0], null, gruppe);
      teil(new THREE.CylinderGeometry(0.2, 0.35, 0.35, 16), moebel.farbe, [0, 1.3, 0], null, gruppe);
    }
    const aufTisch = moebel.typ === 'Teller' && zuhause.moebel.some(ding => ding.typ === 'Tisch' && tellerAufTisch(moebel, ding));
    gruppe.position.set(moebel.x, aufTisch ? 1.01 : 0, moebel.z);
    gruppe.rotation.y = moebel.drehung * Math.PI / 2;
    gruppe.updateMatrixWorld(true);
    if (!['Teppich', 'Teller'].includes(moebel.typ)) {
      const grenze = new THREE.Box3().setFromObject(gruppe).expandByScalar(0.2);
      grenze.min.y = -1;
      grenze.max.y = 4;
      innenraum.userData.hindernisse.push(grenze);
    }
  }
}

function betreteRaum(ort) {
  schliesseSchulpanel();
  steheAuf();
  beendeGespraech();
  document.querySelector('#eigener-satz').hidden = true;
  besuchsort = ort;
  baueBesuchsraum(ort.name);
  dorf.visible = false;
  figur.position.set(0, 0, 3);
  document.querySelector('.schritt').textContent = ort.istWohnhaus ? 'DEIN ZUHAUSE' : ort.name.toLocaleUpperCase('de-DE');
  renderer.domElement.setAttribute('aria-label', `3D-Innenraum: ${ort.istWohnhaus ? 'Dein Zuhause' : ort.name}`);
  if (!ort.istWohnhaus) belohneBesuch(ort.name);
  else document.querySelector('#geldmeldung').hidden = true;
  tasten.clear();
  touchrichtungen.clear();
  kamera.position.set(5, 8, 12);
  kamera.lookAt(0, 0.9, 3);
}

function computerErreichbar() {
  return besuchsort?.istWohnhaus && zuhause.moebel.some(moebel => moebel.typ === 'Computer' && Math.hypot(figur.position.x - moebel.x, figur.position.z - moebel.z) < 2.4);
}

document.querySelector('#computer').addEventListener('click', () => {
  if (!computerErreichbar()) return;
  ranzenfarbe = geld.ranzen || ranzenfarben[0];
  zeigeRanzenladen();
});
document.querySelector('#schulinhalt').addEventListener('click', ereignis => {
  if (schulmodus !== 'hauswahl' || !ereignis.target.closest('#hauswaehlen') || !hauswahl || besuchsort || Math.hypot(figur.position.x - hauswahl.eingang.x, figur.position.z - hauswahl.eingang.z) > 2) return;
  zuhause.haus = hauswahl.name;
  const gespeichert = speichereZuhause();
  betreteRaum(hauswahl);
  if (!gespeichert) {
    document.querySelector('#geldmeldung').hidden = false;
    document.querySelector('#geldmeldung').textContent = 'Speichern klappt gerade nicht.';
  }
});

// 🍽️ Der ganze Teller passt auf die Tischplatte, auch nach dem Drehen.
function tellerAufTisch(teller, tisch) {
  const [breite, tiefe] = moebelgroessen.Tisch;
  const halbX = (tisch.drehung % 2 ? tiefe : breite) / 2;
  const halbZ = (tisch.drehung % 2 ? breite : tiefe) / 2;
  return Math.abs(teller.x - tisch.x) + 0.3 <= halbX && Math.abs(teller.z - tisch.z) + 0.3 <= halbZ;
}

function moebelPasst(moebel) {
  const [breite, tiefe] = moebelgroessen[moebel.typ];
  const halbX = (moebel.drehung % 2 ? tiefe : breite) / 2;
  const halbZ = (moebel.drehung % 2 ? breite : tiefe) / 2;
  if (Math.abs(moebel.x) + halbX > 4.3 || Math.abs(moebel.z) + halbZ > 4.3) return false;
  if (moebel.typ === 'Teppich') return true;
  if (moebel.typ === 'Teller') return !zuhause.moebel.some(anderes => anderes.id !== moebel.id && anderes.typ === 'Teller' && Math.hypot(moebel.x - anderes.x, moebel.z - anderes.z) < 0.6);
  // 🚪 Der Eingang und dein Lililu brauchen freien Platz.
  if (Math.abs(moebel.x) < halbX + 0.8 && moebel.z + halbZ > 2.3) return false;
  if (Math.abs(figur.position.x - moebel.x) < halbX + 0.3 && Math.abs(figur.position.z - moebel.z) < halbZ + 0.3) return false;
  return !zuhause.moebel.some(anderes => {
    if (anderes.id === moebel.id || ['Teppich', 'Teller'].includes(anderes.typ)) return false;
    const [andereBreite, andereTiefe] = moebelgroessen[anderes.typ];
    const andereHalbX = (anderes.drehung % 2 ? andereTiefe : andereBreite) / 2;
    const andereHalbZ = (anderes.drehung % 2 ? andereBreite : andereTiefe) / 2;
    return Math.abs(moebel.x - anderes.x) < halbX + andereHalbX + 0.2 && Math.abs(moebel.z - anderes.z) < halbZ + andereHalbZ + 0.2;
  });
}

// 🖐️ Der Finger zeigt auf den Boden. Das Möbel folgt ohne zu springen.
function zeigeSchiebepunkt(ereignis) {
  const rechteck = renderer.domElement.getBoundingClientRect();
  moebelzeiger.set((ereignis.clientX - rechteck.left) / rechteck.width * 2 - 1, -(ereignis.clientY - rechteck.top) / rechteck.height * 2 + 1);
  moebelstrahl.setFromCamera(moebelzeiger, kamera);
  return moebelstrahl.ray.intersectPlane(schiebeboden, schiebepunkt);
}

function beendeMoebelschieben(abbrechen = false) {
  if (!moebelschub) return;
  const { moebel, gruppe, startX, startZ, zeiger, rahmen } = moebelschub;
  moebelschub = null;
  if (abbrechen) { moebel.x = startX; moebel.z = startZ; }
  gruppe.position.set(moebel.x, 0, moebel.z);
  innenraum.remove(rahmen);
  rahmen.geometry.dispose();
  rahmen.material.dispose();
  renderer.domElement.classList.remove('moebelschieben');
  if (renderer.domElement.hasPointerCapture(zeiger)) renderer.domElement.releasePointerCapture(zeiger);
  tasten.clear();
  touchrichtungen.clear();
  baueEinrichtung();
  if (!abbrechen && !speichereZuhause()) {
    document.querySelector('#geldmeldung').textContent = 'Speichern klappt gerade nicht.';
    document.querySelector('#geldmeldung').hidden = false;
  }
}

renderer.domElement.addEventListener('pointerdown', ereignis => {
  if (!imDorf || !besuchsort?.istWohnhaus || moebelschub || !ereignis.isPrimary || ereignis.button !== 0 || !document.querySelector('#schulpanel').hidden || !zeigeSchiebepunkt(ereignis)) return;
  const einrichtung = innenraum.getObjectByName('Einrichtung');
  if (!einrichtung) return;
  const treffer = moebelstrahl.intersectObjects(einrichtung.children, true)[0];
  if (!treffer) return;
  let gruppe = treffer.object;
  while (gruppe.parent !== einrichtung) gruppe = gruppe.parent;
  const moebel = zuhause.moebel.find(ding => ding.id === gruppe.userData.moebelId);
  if (!moebel) return;
  const rahmen = new THREE.BoxHelper(gruppe, '#39a99c');
  innenraum.add(rahmen);
  moebelschub = { moebel, gruppe, rahmen, zeiger: ereignis.pointerId, startX: moebel.x, startZ: moebel.z, versatzX: moebel.x - schiebepunkt.x, versatzZ: moebel.z - schiebepunkt.z };
  moebelnummer = moebel.id;
  tasten.clear();
  touchrichtungen.clear();
  renderer.domElement.setPointerCapture(ereignis.pointerId);
  renderer.domElement.classList.add('moebelschieben');
  ereignis.preventDefault();
});
renderer.domElement.addEventListener('pointermove', ereignis => {
  if (!moebelschub || moebelschub.zeiger !== ereignis.pointerId || !zeigeSchiebepunkt(ereignis)) return;
  const { moebel, gruppe, rahmen, versatzX, versatzZ } = moebelschub;
  const platzX = Math.round((schiebepunkt.x + versatzX) * 10) / 10;
  const platzZ = Math.round((schiebepunkt.z + versatzZ) * 10) / 10;
  const passt = moebelPasst({ ...moebel, x: platzX, z: platzZ });
  rahmen.material.color.set(passt ? '#39a99c' : '#e65a81');
  if (!passt) return;
  moebel.x = platzX;
  moebel.z = platzZ;
  const aufTisch = moebel.typ === 'Teller' && zuhause.moebel.some(ding => ding.typ === 'Tisch' && tellerAufTisch(moebel, ding));
  gruppe.position.set(platzX, aufTisch ? 1.01 : 0, platzZ);
  gruppe.updateMatrixWorld(true);
  rahmen.update();
  ereignis.preventDefault();
});
renderer.domElement.addEventListener('pointerup', ereignis => { if (moebelschub?.zeiger === ereignis.pointerId) beendeMoebelschieben(); });
for (const ereignisname of ['pointercancel', 'lostpointercapture']) renderer.domElement.addEventListener(ereignisname, ereignis => { if (moebelschub?.zeiger === ereignis.pointerId) beendeMoebelschieben(true); });
window.addEventListener('blur', () => beendeMoebelschieben(true));
window.addEventListener('keydown', ereignis => { if (ereignis.code === 'Escape') beendeMoebelschieben(true); });

function zimmerfarben(titel, feld, wert) {
  return `<fieldset><legend>${titel}</legend><div class="farben">${zimmerpalette.map((farbe, index) => `<button class="farbknopf ${farbe === wert ? 'gewaehlt' : ''}" style="--farbe:${farbe}" data-zimmerfeld="${feld}" data-zimmerfarbe="${farbe}" aria-label="${titel}, Farbe ${index + 1}" aria-pressed="${farbe === wert}">${farbe === wert ? '<i data-lucide="check"></i>' : ''}</button>`).join('')}</div></fieldset>`;
}

function zeigeMoebel() {
  schulmodus = 'moebel';
  oeffneSchulpanel('Deine Möbel');
  const moebel = zuhause.moebel.find(ding => ding.id === moebelnummer) || zuhause.moebel[0];
  moebelnummer = moebel?.id || 0;
  document.querySelector('#schulinhalt').innerHTML = `<div class="moebelfelder"><label for="moebeltyp">Neues Möbelstück</label><div class="moebelneu"><select id="moebeltyp">${moebeltypen.map(typ => `<option>${typ}</option>`).join('')}</select><button id="moebelhinzu" class="symbol" aria-label="Möbel hinstellen" title="Hinstellen" ${zuhause.moebel.length >= 32 ? 'disabled' : ''}><i data-lucide="plus"></i></button></div>${moebel ? `<label for="moebelwahl">Möbelstück</label><select id="moebelwahl">${zuhause.moebel.map(ding => `<option value="${ding.id}" ${ding.id === moebelnummer ? 'selected' : ''}>${ding.typ} ${ding.id}</option>`).join('')}</select><label for="moebelx">Links / rechts</label><input id="moebelx" type="range" min="-4" max="4" step="0.5" value="${moebel.x}"><label for="moebelz">Vorne / hinten</label><input id="moebelz" type="range" min="-4" max="4" step="0.5" value="${moebel.z}">${zimmerfarben('Möbelfarbe', 'moebel', moebel.farbe)}<div class="moebelaktionen"><button id="moebeldrehen" class="symbol" aria-label="Möbel drehen" title="Drehen"><i data-lucide="rotate-cw"></i></button><button id="moebelentfernen" class="symbol" aria-label="Möbel entfernen" title="Entfernen"><i data-lucide="trash-2"></i></button></div>` : ''}<p id="schulrueckmeldung" role="status"></p></div>`;
  symbole();
}

function zeigeZimmerfarben() {
  schulmodus = 'zimmerfarben';
  oeffneSchulpanel('Dein Zimmer');
  document.querySelector('#schulinhalt').innerHTML = zimmerfarben('Wandfarbe', 'wand', zuhause.wand) + zimmerfarben('Bodenfarbe', 'boden', zuhause.boden) + '<p id="schulrueckmeldung" role="status"></p>';
  symbole();
}

function speichereEinrichtung() {
  baueEinrichtung();
  document.querySelector('#schulrueckmeldung').textContent = speichereZuhause() ? 'Gespeichert.' : 'Speichern klappt gerade nicht.';
}

document.querySelector('#moebelladen').addEventListener('click', () => { if (besuchsort?.istWohnhaus) zeigeMoebel(); });
document.querySelector('#zimmerfarben').addEventListener('click', () => { if (besuchsort?.istWohnhaus) zeigeZimmerfarben(); });
document.querySelector('#schulinhalt').addEventListener('change', ereignis => {
  if (!besuchsort?.istWohnhaus || schulmodus !== 'moebel' || ereignis.target.id !== 'moebelwahl') return;
  moebelnummer = Number(ereignis.target.value);
  zeigeMoebel();
});
document.querySelector('#schulinhalt').addEventListener('input', ereignis => {
  if (!besuchsort?.istWohnhaus || schulmodus !== 'moebel' || !['moebelx', 'moebelz'].includes(ereignis.target.id)) return;
  const moebel = zuhause.moebel.find(ding => ding.id === moebelnummer);
  if (!moebel) return;
  const feld = ereignis.target.id === 'moebelx' ? 'x' : 'z';
  const wert = Number(ereignis.target.value);
  if (!moebelPasst({ ...moebel, [feld]: wert })) {
    ereignis.target.value = moebel[feld];
    document.querySelector('#schulrueckmeldung').textContent = 'Hier ist kein Platz.';
    return;
  }
  moebel[feld] = wert;
  speichereEinrichtung();
});
document.querySelector('#schulinhalt').addEventListener('click', ereignis => {
  if (!besuchsort?.istWohnhaus || !['moebel', 'zimmerfarben'].includes(schulmodus)) return;
  const knopf = ereignis.target.closest('button');
  if (!knopf) return;
  const moebel = zuhause.moebel.find(ding => ding.id === moebelnummer);
  if (knopf.id === 'moebelhinzu' && zuhause.moebel.length < 32) {
    const typ = document.querySelector('#moebeltyp').value;
    if (!moebeltypen.includes(typ)) return;
    let kennung = 1;
    while (zuhause.moebel.some(ding => ding.id === kennung)) kennung++;
    const neu = { id: kennung, typ, x: 0, z: 0, drehung: 0, farbe: '#e65a81' };
    let platzGefunden = false;
    if (typ === 'Teller') {
      for (const tisch of zuhause.moebel.filter(ding => ding.typ === 'Tisch')) {
        neu.x = tisch.x;
        neu.z = tisch.z;
        if (moebelPasst(neu)) { platzGefunden = true; break; }
      }
    }
    for (let platzZ = -3.5; platzZ <= 3.5 && !platzGefunden; platzZ += 0.5) for (let platzX = -3.5; platzX <= 3.5 && !platzGefunden; platzX += 0.5) {
      neu.x = platzX;
      neu.z = platzZ;
      platzGefunden = moebelPasst(neu);
    }
    if (!platzGefunden) { document.querySelector('#schulrueckmeldung').textContent = 'Dein Zimmer ist voll.'; return; }
    zuhause.moebel.push(neu);
    moebelnummer = kennung;
    zeigeMoebel();
  } else if (knopf.id === 'moebelentfernen' && moebel) {
    zuhause.moebel.splice(zuhause.moebel.indexOf(moebel), 1);
    zeigeMoebel();
  } else if (knopf.id === 'moebeldrehen' && moebel) {
    const drehung = (moebel.drehung + 1) % 4;
    if (!moebelPasst({ ...moebel, drehung })) { document.querySelector('#schulrueckmeldung').textContent = 'Hier ist kein Platz zum Drehen.'; return; }
    moebel.drehung = drehung;
  } else if (zimmerpalette.includes(knopf.dataset.zimmerfarbe)) {
    const feld = knopf.dataset.zimmerfeld;
    if (feld === 'moebel' && moebel && schulmodus === 'moebel') { moebel.farbe = knopf.dataset.zimmerfarbe; zeigeMoebel(); }
    else if (['wand', 'boden'].includes(feld) && schulmodus === 'zimmerfarben') {
      zuhause[feld] = knopf.dataset.zimmerfarbe;
      innenraum.traverse(baustein => { if (baustein.name === (feld === 'wand' ? 'Zimmerwand' : 'Zimmerboden')) baustein.material.color.set(zuhause[feld]); });
      zeigeZimmerfarben();
    } else return;
  } else return;
  speichereEinrichtung();
});

function baueBesuchsraum(ort) {
  raumbewohner.length = 0;
  innenraum.traverse(baustein => {
    if (!baustein.isMesh) return;
    baustein.geometry.dispose();
    baustein.material.dispose();
  });
  innenraum.clear();
  innenraum.userData.hindernisse = [];
  const schule = ort === 'Schule';
  const daheim = ort.startsWith('Wohnhaus ');
  const fussboden = teil(new THREE.BoxGeometry(10, 0.15, 10), daheim ? zuhause.boden : schule ? '#deb989' : '#a9d9d0', [0, -0.08, 0], null, innenraum);
  fussboden.name = 'Zimmerboden';
  const rueckwand = teil(new THREE.BoxGeometry(10, 3.6, 0.2), daheim ? zuhause.wand : '#fff0d0', [0, 1.8, -5], null, innenraum);
  rueckwand.name = 'Zimmerwand';
  for (const seite of [-1, 1]) {
    const wand = teil(new THREE.BoxGeometry(0.2, 1, 10), daheim ? zuhause.wand : '#e9dfca', [seite * 5, 0.5, 0], null, innenraum);
    wand.name = 'Zimmerwand';
  }
  if (schule) {
    teil(new THREE.BoxGeometry(4, 1.5, 0.1), '#35785d', [0, 2.2, -4.85], null, innenraum);
    for (const seite of [-1, 1]) for (const reihe of [-3, -1]) {
      teil(new THREE.BoxGeometry(1.6, 0.12, 0.9), '#e9c693', [seite * 2.5, 0.9, reihe], null, innenraum);
      for (const fuss of [-1, 1]) teil(new THREE.BoxGeometry(0.12, 0.9, 0.7), '#6e9096', [seite * 2.5 + fuss * 0.6, 0.45, reihe], null, innenraum);
      const eigenerStuhl = seite === 1 && reihe === -1;
      const stuhl = teil(new THREE.BoxGeometry(0.7, 0.5, 0.7), eigenerStuhl ? '#f5bd45' : '#6e9096', [seite * 2.5, 0.25, reihe + 0.9], null, innenraum);
      if (eigenerStuhl) stuhl.name = 'Dein Sitzplatz';
    }
    const klasse = [
      { name: 'Frau Sommer', alter: 36, stimme: 'Hell', farbe: '#39a99c', aussehen: { frisur: 'Bob', haare: '#542e23', oberteil: 'Jacke', brille: 'Rund' }, position: [0, 0, -3.9], saetze: ['Guten Morgen! Ich bin Frau Sommer, deine Lehrerin.', 'Heute lesen und rechnen wir zusammen.', 'Schön, dass du in unserer Klasse bist!'] },
      { name: 'Lina', alter: 8, stimme: 'Hell', farbe: '#e65a81', aussehen: { frisur: 'Zöpfe', haare: '#f2cf77' }, position: [-1.25, 0, 0.4], saetze: ['Hallo! Ich bin Lina und acht Jahre alt.', 'Willst du in der Pause mit mir spielen?', 'Ich male gern bunte Bilder.'] },
      { name: 'Sara', alter: 7, stimme: 'Hell', farbe: '#f5bd45', aussehen: { frisur: 'Lang', haut: '#925c40', haare: '#241e1c' }, position: [1.25, 0, 0.4], saetze: ['Hallo! Ich heiße Sara und bin sieben.', 'Ich freue mich auf die große Pause!', 'Wollen wir zusammen ein Bild malen?'] },
      { name: 'Benni', alter: 8, stimme: 'Tief', farbe: '#487d9a', aussehen: { geschlecht: 'Junge', frisur: 'Kurz', haare: '#b26835' }, position: [-1.25, 0, -2], saetze: ['Hallo! Ich bin Benni und acht Jahre alt.', 'Rechnen macht mir Spaß.', 'Schön, dich kennenzulernen!'] },
      { name: 'Elias', alter: 9, stimme: 'Tief', farbe: '#39a99c', aussehen: { geschlecht: 'Junge', frisur: 'Locken', haut: '#bd805d', haare: '#542e23' }, position: [1.25, 0, -2], saetze: ['Hallo! Ich bin Elias und neun Jahre alt.', 'Ich lese gerne Geschichten.', 'Nach der Schule gehe ich in den Park.'] }
    ];
    // 👩‍🏫 Die Schulfiguren benutzen denselben Figuren-Baukasten wie du.
    for (const person of klasse) {
      const schulfigur = new THREE.Group();
      schulfigur.name = person.name;
      schulfigur.userData.alter = person.alter;
      baueFigur({ ...standard, ...person.aussehen, farbe: person.farbe }, schulfigur);
      schulfigur.scale.setScalar(0.65 * figurengroesse(person.alter));
      schulfigur.position.set(...person.position);
      innenraum.add(schulfigur);
      raumbewohner.push({ ...person, figur: schulfigur, satznummer: 0 });
    }
  } else if (ort === 'Kindergarten') {
    teil(new THREE.CylinderGeometry(2.8, 2.8, 0.04, 32), '#f5c56c', [0, 0.02, -1.5], null, innenraum);
    for (let index = 0; index < 9; index++) {
      const klotz = teil(new THREE.BoxGeometry(0.5, 0.5, 0.5), ['#e65a81', '#487d9a', '#f5bd45'][index % 3], [-3.3 + index % 3 * 0.6, 0.25 + Math.floor(index / 3) * 0.5, -3.5], null, innenraum);
      klotz.rotation.y = index * 0.2;
    }
    teil(new THREE.SphereGeometry(0.4, 16, 12), '#e65a81', [2.5, 0.4, -2], null, innenraum);
    teil(new THREE.BoxGeometry(2, 1, 0.5), '#b58159', [2.8, 0.5, -4.4], null, innenraum);
  } else if (daheim) baueEinrichtung();
  innenraum.visible = true;
}

function steheAuf() {
  if (!sitzt) return;
  schliesseSchulpanel();
  sitzt = false;
  figur.userData.sitzt = false;
  figur.position.set(2.5, 0, 0.8);
  tasten.clear();
  touchrichtungen.clear();
}

document.querySelector('#sitzen').addEventListener('click', () => {
  if (besuchsort?.name !== 'Schule') return;
  if (sitzt) { steheAuf(); return; }
  if (Math.hypot(figur.position.x - eigenerPlatz.x, figur.position.z - eigenerPlatz.z) > 1.5) return;
  beendeGespraech();
  document.querySelector('#eigener-satz').hidden = true;
  document.querySelector('#geldmeldung').hidden = true;
  sitzt = true;
  figur.userData.sitzt = true;
  figur.position.copy(eigenerPlatz);
  figur.position.y = 0.5 - 1.08 * figur.scale.y;
  figur.rotation.y = Math.PI;
  tasten.clear();
  touchrichtungen.clear();
});

document.querySelector('#betreten').addEventListener('click', () => {
  if (!imDorf) return;
  schliesseSchulpanel();
  steheAuf();
  if (besuchsort) {
    beendeGespraech();
    document.querySelector('#eigener-satz').hidden = true;
    const eingang = besuchsort.eingang;
    besuchsort = null;
    innenraum.visible = false;
    dorf.visible = true;
    figur.position.copy(eingang);
    document.querySelector('.schritt').textContent = 'DEINE STADT';
    document.querySelector('#geldmeldung').hidden = true;
    renderer.domElement.setAttribute('aria-label', '3D-Stadt mit Stadtplatz, Geschäften und Lililus');
  } else {
    if (!naechsteBildung || Math.hypot(figur.position.x - naechsteBildung.eingang.x, figur.position.z - naechsteBildung.eingang.z) > 2) return;
    if (naechsteBildung.istWohnhaus && zuhause.haus !== naechsteBildung.name) {
      hauswahl = naechsteBildung;
      schulmodus = 'hauswahl';
      oeffneSchulpanel('Dein Haus');
      document.querySelector('#schulinhalt').innerHTML = `<p class="aufgabenfrage">${hauswahl.name}</p><button id="hauswaehlen" class="primaer">Hier wohnen</button>`;
      return;
    }
    betreteRaum(naechsteBildung);
  }
  tasten.clear();
  touchrichtungen.clear();
  kamera.position.set(figur.position.x + 5, 8, figur.position.z + 9);
  kamera.lookAt(figur.position.x, 0.9, figur.position.z);
});

function betreteWelt() {
  schliesseSchulpanel();
  steheAuf();
  if (!dorfGebaut) { baueDorf(); dorfGebaut = true; }
  imDorf = true;
  besuchsort = null;
  innenraum.visible = false;
  document.querySelector('#geldmeldung').hidden = true;
  document.body.classList.add('spielmodus');
  document.querySelector('#welt-ui').hidden = false;
  document.querySelector('.schritt').textContent = 'DEINE STADT';
  renderer.domElement.setAttribute('aria-label', '3D-Stadt mit Stadtplatz, Geschäften und Lililus');
  dorf.visible = true;
  podest.visible = false;
  boden.visible = false;
  steuerung.enabled = false;
  welt.background = new THREE.Color('#b9e3ee');
  welt.fog = new THREE.Fog('#b9e3ee', 35, 75);
  kamera.fov = 48;
  kamera.far = 120;
  kamera.updateProjectionMatrix();
  figur.scale.setScalar(0.65 * figurengroesse(auswahl.alter));
  figur.position.set(0, 0, 5);
  figur.rotation.y = Math.PI;
  kamera.position.set(5, 8, 14);
  kamera.lookAt(0, 0.9, 5);
  tasten.clear();
  touchrichtungen.clear();
  stoppeSprache();
  document.querySelector('#satz').placeholder = `Hallo, ich bin ${auswahl.name.trim() || 'Lili'}!`;
  window.scrollTo(0, 0);
  symbole();
  spieleKlang('start');
  starteMusik();
}

function beendeGespraech() {
  stoppeSprache();
  sprechenderNachbar = null;
  document.querySelector('#sprechblase').hidden = true;
}
document.querySelector('#umziehen').addEventListener('click', () => {
  schliesseSchulpanel();
  steheAuf();
  beendeGespraech();
  stoppeSpieltoene();
  document.querySelector('#eigener-satz').hidden = true;
  imDorf = false;
  besuchsort = null;
  innenraum.visible = false;
  document.querySelector('#geldmeldung').hidden = true;
  dorf.visible = false;
  document.body.classList.remove('spielmodus');
  document.querySelector('#welt-ui').hidden = true;
  document.querySelector('.schritt').textContent = 'DEINE FIGUR · 01';
  renderer.domElement.setAttribute('aria-label', 'Drehbare 3D-Figur');
  podest.visible = true;
  boden.visible = true;
  welt.background = null;
  welt.fog = null;
  figur.scale.setScalar(figurengroesse(auswahl.alter));
  figur.position.set(0, 0, 0);
  figur.rotation.y = 0;
  kamera.fov = 32;
  kamera.updateProjectionMatrix();
  kamera.position.set(0.5, 3.1, 8.6);
  steuerung.target.set(0, 1.65, 0);
  steuerung.enabled = true;
  tasten.clear();
  touchrichtungen.clear();
});

// 🔊 Kleine Klänge entstehen direkt im Spiel, ohne Dateien herunterzuladen.
async function spieleKlang(art) {
  if (!tonAn || !imDorf) return;
  const AudioBaukasten = window.AudioContext || window.webkitAudioContext;
  if (!AudioBaukasten) return;
  try {
    if (!tonkontext) tonkontext = new AudioBaukasten();
    if (tonkontext.state !== 'running') await tonkontext.resume();
    if (!tonAn || !imDorf || !document.hasFocus()) return;
    const noten = art === 'start' ? [523.25, 659.25, 783.99] : [140];
    for (const [index, frequenz] of noten.entries()) {
      const klang = tonkontext.createOscillator();
      const lautstaerke = tonkontext.createGain();
      const anfang = tonkontext.currentTime + index * 0.14;
      const dauer = art === 'start' ? 0.2 : 0.08;
      klang.type = art === 'start' ? 'sine' : 'triangle';
      klang.frequency.setValueAtTime(frequenz, anfang);
      if (art === 'schritt') klang.frequency.exponentialRampToValueAtTime(75, anfang + dauer);
      lautstaerke.gain.setValueAtTime(0, anfang);
      lautstaerke.gain.linearRampToValueAtTime(art === 'start' ? 0.045 : 0.035, anfang + 0.008);
      lautstaerke.gain.exponentialRampToValueAtTime(0.0001, anfang + dauer);
      klang.connect(lautstaerke);
      lautstaerke.connect(tonkontext.destination);
      spieltoene.add(klang);
      klang.onended = () => {
        spieltoene.delete(klang);
        klang.disconnect();
        lautstaerke.disconnect();
      };
      klang.start(anfang);
      klang.stop(anfang + dauer);
    }
  } catch {
    zeigeTonmeldung('Der Spielton startet gerade nicht. Tippe noch einmal auf den Lautsprecher.');
  }
}

// 🎵 Eine eigene kleine Melodie mit leisen Begleitakkorden.
async function baueMusikpuffer() {
  const MusikBaukasten = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const musik = new MusikBaukasten(1, tonkontext.sampleRate * 16, tonkontext.sampleRate);
  const melodie = [72, 76, 79, 76, 74, 77, 81, 77, 76, 79, 84, 79, 74, 71, 67, 71, 72, 79, 76, 72, 69, 72, 76, 72, 77, 76, 72, 69, 71, 74, 79, 67];
  const akkorde = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]];
  function note(tonhoehe, anfang, dauer, staerke, klangfarbe) {
    const klang = musik.createOscillator();
    const lautstaerke = musik.createGain();
    klang.type = klangfarbe;
    klang.frequency.value = 440 * 2 ** ((tonhoehe - 69) / 12);
    lautstaerke.gain.setValueAtTime(0, anfang);
    lautstaerke.gain.linearRampToValueAtTime(staerke, anfang + 0.04);
    lautstaerke.gain.linearRampToValueAtTime(0, anfang + dauer);
    klang.connect(lautstaerke);
    lautstaerke.connect(musik.destination);
    klang.start(anfang);
    klang.stop(anfang + dauer);
  }
  melodie.forEach((tonhoehe, index) => note(tonhoehe, index * 0.5, 0.46, 0.16, 'sine'));
  for (let takt = 0; takt < 8; takt++) {
    const akkord = akkorde[takt % akkorde.length];
    for (const tonhoehe of akkord) note(tonhoehe, takt * 2, 1.94, 0.025, 'triangle');
    note(akkord[0] - 12, takt * 2, 1.94, 0.05, 'sine');
  }
  return musik.startRendering();
}

async function starteMusik() {
  if (!tonAn || !imDorf || musikquelle || !document.hasFocus()) return;
  const auftrag = ++musiknummer;
  try {
    const AudioBaukasten = window.AudioContext || window.webkitAudioContext;
    if (!AudioBaukasten) return;
    if (!tonkontext) tonkontext = new AudioBaukasten();
    await tonkontext.resume();
    if (!musikpufferLaden) {
      musikpufferLaden = baueMusikpuffer().catch(fehler => { musikpufferLaden = null; throw fehler; });
    }
    const musikpuffer = await musikpufferLaden;
    if (auftrag !== musiknummer || !tonAn || !imDorf || !document.hasFocus()) return;
    const quelle = tonkontext.createBufferSource();
    const lautstaerke = tonkontext.createGain();
    quelle.buffer = musikpuffer;
    quelle.loop = true;
    lautstaerke.gain.value = 0.14;
    quelle.connect(lautstaerke);
    lautstaerke.connect(tonkontext.destination);
    musikquelle = quelle;
    quelle.onended = () => {
      if (musikquelle === quelle) musikquelle = null;
      quelle.disconnect();
      lautstaerke.disconnect();
    };
    quelle.start();
  } catch {
    if (auftrag === musiknummer) zeigeTonmeldung('Die Musik startet gerade nicht. Tippe noch einmal auf den Lautsprecher.');
  }
}

function stoppeSpieltoene() {
  musiknummer++;
  if (musikquelle) { musikquelle.stop(); musikquelle = null; }
  for (const klang of spieltoene) klang.stop();
  spieltoene.clear();
}

function stoppeSprache() {
  sprechnummer++;
  window.speechSynthesis?.cancel();
  if (tonquelle) { tonquelle.stop(); tonquelle = null; }
}

function zeigeTonmeldung(text) {
  document.querySelectorAll('[data-tonmeldung]').forEach(feld => { feld.textContent = text; });
}

async function sprichMitSpielstimme(satz, auftrag, stimmwahl) {
  try {
    const AudioBaukasten = window.AudioContext || window.webkitAudioContext;
    if (!AudioBaukasten) throw new Error('Kein Ton verfügbar');
    if (!tonkontext) tonkontext = new AudioBaukasten();
    await tonkontext.resume();
    if (auftrag !== sprechnummer || !tonAn) return;
    zeigeTonmeldung('Deutsche Stimme wird geladen ...');
    if (!sprachLaden) {
      sprachLaden = import('@mintplex-labs/piper-tts-web').catch(fehler => { sprachLaden = null; throw fehler; });
    }
    const sprachbaukasten = await sprachLaden;
    if (auftrag !== sprechnummer || !tonAn) return;
    // Die Stimmen werden einmal geladen. Der Satz wird auf deinem Gerät vertont.
    const voiceId = stimmwahl === 'Hell' ? 'de_DE-ramona-low' : 'de_DE-thorsten-medium';
    const fortschrittAnzeigen = fortschritt => {
      if (auftrag !== sprechnummer || !tonAn) return;
      const prozent = fortschritt.total ? Math.round(fortschritt.loaded / fortschritt.total * 100) : 0;
      zeigeTonmeldung(`Deutsche Stimme wird geladen${prozent ? `: ${prozent} %` : ' ...'}`);
    };
    // Jede Stimme behält ihren eigenen Baukasten. Sätze werden nacheinander vertont.
    sprachAuftraege = sprachAuftraege.catch(() => {}).then(async () => {
      if (auftrag !== sprechnummer || !tonAn) return null;
      if (!stimmSitzungen.has(voiceId)) {
        sprachbaukasten.TtsSession._instance = null;
        const sitzung = sprachbaukasten.TtsSession.create({ voiceId, progress: fortschrittAnzeigen }).catch(fehler => { stimmSitzungen.delete(voiceId); throw fehler; });
        stimmSitzungen.set(voiceId, sitzung);
      }
      const sitzung = await stimmSitzungen.get(voiceId);
      if (auftrag !== sprechnummer || !tonAn) return null;
      return sitzung.predict(satz);
    });
    const daten = await sprachAuftraege;
    if (!daten || auftrag !== sprechnummer || !tonAn) return;
    const tonpuffer = await tonkontext.decodeAudioData(await daten.arrayBuffer());
    if (auftrag !== sprechnummer || !tonAn) return;
    const quelle = tonkontext.createBufferSource();
    quelle.buffer = tonpuffer;
    quelle.connect(tonkontext.destination);
    tonquelle = quelle;
    quelle.onended = () => { if (tonquelle === quelle) tonquelle = null; quelle.disconnect(); };
    zeigeTonmeldung('');
    quelle.start();
  } catch {
    if (auftrag === sprechnummer) zeigeTonmeldung('Der Ton klappt gerade nicht. Du kannst den Satz lesen.');
  }
}

function sprich(satz, stimmwahl = sprechenderNachbar?.stimme || auswahl.stimme) {
  zeigeTonmeldung('');
  stoppeSprache();
  if (!tonAn) return;
  const auftrag = sprechnummer;
  const stimmnamen = stimmwahl === 'Hell' ? /Katja|Hedda|Anna|Klara|Vicki|female/i : /Stefan|Conrad|Hans|Markus|Yannick|\bmale\b/i;
  const deutscheStimme = window.speechSynthesis?.getVoices().find(stimme => /^de(?:-|_)/i.test(stimme.lang) && stimmnamen.test(stimme.name));
  if (!deutscheStimme) {
    sprichMitSpielstimme(satz, auftrag, stimmwahl);
    return;
  }
  const stimme = new SpeechSynthesisUtterance(satz);
  stimme.lang = 'de-DE';
  stimme.rate = 0.95;
  stimme.pitch = 1;
  stimme.voice = deutscheStimme;
  stimme.onerror = ereignis => {
    if (auftrag === sprechnummer && ereignis.error !== 'canceled' && ereignis.error !== 'interrupted') sprichMitSpielstimme(satz, auftrag, stimmwahl);
  };
  window.speechSynthesis.speak(stimme);
}
document.querySelector('#reden').addEventListener('click', () => {
  if (!naechsterNachbar) return;
  schliesseSchulpanel();
  document.querySelector('#geldmeldung').hidden = true;
  document.querySelector('#eigener-satz').hidden = true;
  sprechenderNachbar = naechsterNachbar;
  aktuellerSatz = sprechenderNachbar.saetze[sprechenderNachbar.satznummer % sprechenderNachbar.saetze.length];
  sprechenderNachbar.satznummer++;
  document.querySelector('#sprechername').textContent = `${sprechenderNachbar.name} · ${sprechenderNachbar.alter} Jahre`;
  document.querySelector('#sprechtext').textContent = aktuellerSatz;
  document.querySelector('#sprechblase').hidden = false;
  sprich(aktuellerSatz);
});
document.querySelector('#nochmal').addEventListener('click', () => sprich(aktuellerSatz));
document.querySelector('#sprechende').addEventListener('click', beendeGespraech);
document.querySelector('#selberreden').addEventListener('click', () => {
  schliesseSchulpanel();
  beendeGespraech();
  document.querySelector('#geldmeldung').hidden = true;
  tasten.clear();
  touchrichtungen.clear();
  document.querySelector('#eigener-satz').hidden = false;
  document.querySelector('#satz').focus();
});
document.querySelector('#satzschliessen').addEventListener('click', () => { document.querySelector('#eigener-satz').hidden = true; });
document.querySelector('#eigener-satz').addEventListener('submit', ereignis => {
  ereignis.preventDefault();
  const satz = document.querySelector('#satz').value.trim() || document.querySelector('#satz').placeholder;
  aktuellerSatz = satz;
  sprechenderNachbar = null;
  document.querySelector('#sprechername').textContent = auswahl.name.trim() || 'Lili';
  document.querySelector('#sprechtext').textContent = satz;
  document.querySelector('#eigener-satz').hidden = true;
  document.querySelector('#sprechblase').hidden = false;
  document.activeElement?.blur();
  sprich(satz);
});
document.querySelector('#ton').addEventListener('click', () => {
  tonAn = !tonAn;
  if (!tonAn) { stoppeSprache(); stoppeSpieltoene(); zeigeTonmeldung(''); }
  else { spieleKlang('start'); starteMusik(); }
  const knopf = document.querySelector('#ton');
  knopf.setAttribute('aria-pressed', String(tonAn));
  knopf.setAttribute('aria-label', tonAn ? 'Ton ausschalten' : 'Ton einschalten');
  knopf.title = tonAn ? 'Ton ausschalten' : 'Ton einschalten';
  knopf.innerHTML = `<i data-lucide="${tonAn ? 'volume-2' : 'volume-x'}"></i>`;
  symbole();
});

const tastenrichtungen = { ArrowUp: 'oben', KeyW: 'oben', ArrowDown: 'unten', KeyS: 'unten', ArrowLeft: 'links', KeyA: 'links', ArrowRight: 'rechts', KeyD: 'rechts' };
window.addEventListener('keydown', ereignis => {
  if (!document.querySelector('#schulpanel').hidden) {
    if (ereignis.code === 'Escape') schliesseSchulpanel();
    return;
  }
  if (!imDorf || !tastenrichtungen[ereignis.code] || !document.querySelector('#eigener-satz').hidden) return;
  starteMusik();
  ereignis.preventDefault();
  tasten.add(ereignis.code);
});
window.addEventListener('keyup', ereignis => tasten.delete(ereignis.code));
window.addEventListener('blur', () => { tasten.clear(); touchrichtungen.clear(); stoppeSprache(); stoppeSpieltoene(); });
window.addEventListener('focus', starteMusik);
document.querySelectorAll('[data-richtung]').forEach(knopf => {
  knopf.addEventListener('pointerdown', ereignis => {
    starteMusik();
    ereignis.preventDefault();
    knopf.setPointerCapture(ereignis.pointerId);
    touchrichtungen.set(ereignis.pointerId, knopf.dataset.richtung);
    knopf.classList.add('gedrueckt');
  });
  for (const ereignisname of ['pointerup', 'pointercancel', 'lostpointercapture']) knopf.addEventListener(ereignisname, ereignis => {
    touchrichtungen.delete(ereignis.pointerId);
    knopf.classList.remove('gedrueckt');
  });
});

// 👋 Arme und Beine schwingen gegeneinander. Im Gespräch winkt ein Arm.
function bewegeFigur(ziel, zeit, schrittzeit, laeuft = false, redet = false) {
  const bewegungsteile = ziel.userData.bewegung;
  if (laeuft) bewegungsteile.schritt += schrittzeit * 10;
  const schwingen = laeuft ? Math.sin(bewegungsteile.schritt) : 0;
  const ruhigeBewegung = Math.sin(zeit * 1.8) * 0.09;
  ziel.rotation.z = laeuft ? schwingen * 0.025 : Math.sin(zeit * 1.5) * 0.018;
  const sanft = 1 - Math.exp(-schrittzeit * 14);
  for (const [index, bein] of bewegungsteile.beine.entries()) {
    const richtung = index === 0 ? 1 : -1;
    bein.rotation.x = THREE.MathUtils.lerp(bein.rotation.x, ziel.userData.sitzt ? -Math.PI / 2 : schwingen * richtung * 0.55, sanft);
    const knie = bewegungsteile.knie[index];
    knie.rotation.x = THREE.MathUtils.lerp(knie.rotation.x, ziel.userData.sitzt ? Math.PI / 2 : 0, sanft);
    const arm = bewegungsteile.arme[index];
    arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, laeuft ? -schwingen * richtung * 0.45 : ruhigeBewegung * richtung, sanft);
    const winken = !laeuft && index === 1 && (redet ? zeit % 4 < 1.8 : zeit % 9 < 1.4);
    arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, winken ? 2.3 + Math.sin(zeit * 10) * 0.22 : ruhigeBewegung * richtung * 0.4, sanft);
  }
  const augenhoehe = zeit % 4.6 < 0.14 ? 0.08 : 1;
  for (const auge of bewegungsteile.augen) auge.scale.y = augenhoehe;
  bewegungsteile.mund.scale.y = redet ? 1.15 + Math.sin(zeit * 12) * 0.2 : 1;
}

function bewegeWasser(zeit) {
  const strahlhoehe = 1.2 + Math.sin(zeit * 4) * 0.1;
  wasserstrahl.scale.y = strahlhoehe / 1.2;
  wasserstrahl.position.y = 0.52 + strahlhoehe / 2;
  wasserkuppe.position.y = 0.52 + strahlhoehe;
  wasserkuppe.scale.set(1 + Math.sin(zeit * 5) * 0.1, 1, 1 + Math.cos(zeit * 5) * 0.1);
  for (const [index, tropfen] of wassertropfen.entries()) {
    const fallzeit = (zeit * 0.85 + index / wassertropfen.length) % 1;
    const winkel = index * 2.4;
    const abstand = fallzeit * (0.55 + index % 4 * 0.12);
    tropfen.position.set(Math.cos(winkel) * abstand, 1.72 + fallzeit * 1.4 - fallzeit * fallzeit * 2.58, Math.sin(winkel) * abstand);
    tropfen.scale.y = 1.2 + fallzeit;
  }
  for (const [index, welle] of wasserwellen.entries()) {
    const ausbreitung = (zeit * 0.65 + index / wasserwellen.length) % 1;
    welle.scale.setScalar(0.15 + ausbreitung * 0.88);
    welle.material.opacity = (1 - ausbreitung) * 0.65;
  }
}

function laufeDurchDorf(schrittzeit, zeit) {
  const richtungen = new Set([...tasten].map(taste => tastenrichtungen[taste]).concat([...touchrichtungen.values()]));
  const waagerecht = Number(richtungen.has('rechts')) - Number(richtungen.has('links'));
  const senkrecht = Number(richtungen.has('oben')) - Number(richtungen.has('unten'));
  kamera.getWorldDirection(vorwaerts);
  vorwaerts.y = 0;
  vorwaerts.normalize();
  seitwaerts.crossVectors(vorwaerts, kamera.up).normalize();
  bewegung.copy(vorwaerts).multiplyScalar(senkrecht).addScaledVector(seitwaerts, waagerecht).normalize().multiplyScalar(schrittzeit * 4);
  if (sitzt || moebelschub || !document.querySelector('#schulpanel').hidden) bewegung.set(0, 0, 0);
  function frei(platzX, platzZ) {
    if (besuchsort?.istWohnhaus) {
      pruefpunkt.set(platzX, 1, platzZ);
      return Math.abs(platzX) < 4.4 && Math.abs(platzZ) < 4.4 && !innenraum.userData.hindernisse.some(hindernis => hindernis.containsPoint(pruefpunkt));
    }
    if (besuchsort) return Math.abs(platzX) < 4.4 && Math.abs(platzZ) < 4.4 && (besuchsort.name !== 'Schule' || Math.abs(platzX) < 1.3 || platzZ > 0.5);
    pruefpunkt.set(platzX, 1, platzZ);
    return Math.abs(platzX) < 26 && Math.abs(platzZ) < 26 && !hindernisse.some(hindernis => hindernis.containsPoint(pruefpunkt));
  }
  const startX = figur.position.x;
  const startZ = figur.position.z;
  if (frei(figur.position.x + bewegung.x, figur.position.z)) figur.position.x += bewegung.x;
  if (frei(figur.position.x, figur.position.z + bewegung.z)) figur.position.z += bewegung.z;
  if (bewegung.lengthSq() > 0) figur.rotation.y = Math.atan2(bewegung.x, bewegung.z);
  const laeuft = Math.hypot(figur.position.x - startX, figur.position.z - startZ) > 0.00001;
  figur.position.y = sitzt ? 0.5 - 1.08 * figur.scale.y : laeuft ? Math.abs(Math.sin(figur.userData.bewegung.schritt)) * 0.045 : 0;
  const inSchule = besuchsort?.name === 'Schule';
  document.querySelector('#schulwerkzeuge').hidden = !inSchule || !document.querySelector('#schulpanel').hidden;
  document.querySelector('#hauswerkzeuge').hidden = !besuchsort?.istWohnhaus || !document.querySelector('#schulpanel').hidden;
  document.querySelector('#computer').disabled = !computerErreichbar();
  renderer.domElement.classList.toggle('moebelziehbar', Boolean(besuchsort?.istWohnhaus && document.querySelector('#schulpanel').hidden));
  document.querySelector('#aufgaben').disabled = !sitzt;
  const sitzknopf = document.querySelector('#sitzen');
  sitzknopf.disabled = !sitzt && Math.hypot(figur.position.x - eigenerPlatz.x, figur.position.z - eigenerPlatz.z) > 1.5;
  sitzknopf.querySelector('span').textContent = sitzt ? 'Aufstehen' : 'Hinsetzen';
  const gespraechOffen = !document.querySelector('#sprechblase').hidden;
  const schrittVorher = Math.floor(figur.userData.bewegung.schritt / Math.PI);
  bewegeFigur(figur, zeit, schrittzeit, laeuft, gespraechOffen && !sprechenderNachbar);
  if (laeuft && Math.floor(figur.userData.bewegung.schritt / Math.PI) !== schrittVorher) spieleKlang('schritt');
  kameraposition.set(figur.position.x + 5, 8, figur.position.z + 9);
  if (!moebelschub) {
    kamera.position.lerp(kameraposition, 1 - Math.exp(-schrittzeit * 6));
    kamera.lookAt(figur.position.x, 0.9, figur.position.z);
  }
  let abstand = 4.5;
  naechsterNachbar = null;
  naechsteBildung = null;
  if (!besuchsort) for (const ort of bildungshaeuser) {
    if (Math.hypot(figur.position.x - ort.eingang.x, figur.position.z - ort.eingang.z) < 2) naechsteBildung = ort;
  }
  const eingangsknopf = document.querySelector('#betreten');
  eingangsknopf.hidden = !besuchsort && !naechsteBildung;
  eingangsknopf.querySelector('span').textContent = besuchsort ? 'Zur Stadt' : `${naechsteBildung?.name || ''} betreten`;
  const anwesende = besuchsort ? raumbewohner : nachbarn;
  for (const [index, nachbar] of anwesende.entries()) {
    const startX = nachbar.figur.position.x;
    const startZ = nachbar.figur.position.z;
    const abstandZumSpieler = Math.hypot(startX - figur.position.x, startZ - figur.position.z);
    const redet = gespraechOffen && nachbar === sprechenderNachbar;
    if (!besuchsort && !redet && abstandZumSpieler > 2.2) {
      const winkel = zeit * 0.55 + index * 1.7;
      const sanft = 1 - Math.exp(-schrittzeit * 3);
      nachbar.figur.position.x = THREE.MathUtils.lerp(startX, nachbar.position[0] + Math.sin(winkel) * 0.55, sanft);
      nachbar.figur.position.z = THREE.MathUtils.lerp(startZ, nachbar.position[2] + Math.cos(winkel) * 0.55, sanft);
      nachbar.figur.rotation.y = Math.atan2(nachbar.figur.position.x - startX, nachbar.figur.position.z - startZ);
    } else {
      nachbar.figur.rotation.y = Math.atan2(figur.position.x - startX, figur.position.z - startZ);
    }
    const geht = Math.hypot(nachbar.figur.position.x - startX, nachbar.figur.position.z - startZ) > 0.0001;
    const entfernung = Math.hypot(nachbar.figur.position.x - figur.position.x, nachbar.figur.position.z - figur.position.z);
    if (entfernung < abstand) { abstand = entfernung; naechsterNachbar = nachbar; }
    nachbar.figur.position.y = geht ? Math.abs(Math.sin(nachbar.figur.userData.bewegung.schritt)) * 0.035 : Math.sin(zeit * 2 + index) * 0.012;
    bewegeFigur(nachbar.figur, zeit + index * 0.7, schrittzeit, geht, redet);
  }
  const reden = document.querySelector('#reden');
  reden.disabled = !naechsterNachbar;
  reden.querySelector('span').textContent = naechsterNachbar ? `Mit ${naechsterNachbar.name} reden` : 'Reden';
  if (sprechenderNachbar && sprechenderNachbar.figur.position.distanceTo(figur.position) > 6) beendeGespraech();
}

renderer.setAnimationLoop(zeitpunkt => {
  const zeit = zeitpunkt / 1000;
  const schrittzeit = Math.min(Math.max(zeit - letzteZeit, 0), 0.05);
  letzteZeit = zeit;
  if (imDorf) { laufeDurchDorf(schrittzeit, zeit); if (!besuchsort) bewegeWasser(zeit); }
  else { figur.position.y = Math.sin(zeit * 2) * 0.012; bewegeFigur(figur, zeit, schrittzeit); steuerung.update(); }
  renderer.render(welt, kamera);
});