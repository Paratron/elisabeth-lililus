# Online-Stadt

Die Stadt-App ist das WLAN-Zeichen im Spiel-Tablet. Die aktuelle Oberflaeche nutzt
den gemeinsamen Raum `MINIMINIS3`, ohne sichtbaren Freundescode. Spieler am selben
konfigurierten Online-Server treffen sich auf dem Stadtplatz und in Laden, Cafe oder Spielhaus.
Gebaeude antippen zum Betreten; "Zum Stadtplatz" bringt dich wieder hinaus.
Haus und Einrichtung bleiben im Browser gespeichert. Es gibt keine Anmeldung,
keine Gebuehren und keine Tonuebertragung. Textchat und Handel erreichen nur
denselben Raum, sind aber bei einem oeffentlich erreichbaren Server nicht privat.
Diese Backend-Erweiterung veraendert die Oberflaeche nicht.

## Lokal ausprobieren

- `npm run dev`: WebSocket am selben Vite-Server unter `/minimini-online`.
- Der laufende Vite-Server startet nach Aenderungen an den importierten Server-Modulen neu.
- Handy und Computer im gleichen WLAN: Vite ueber die lokale IP des Computers
  oeffnen. `localhost` auf dem Handy bezeichnet das Handy, nicht den Computer.
- `npm run online-server`: eigenstaendiger Server, Standard-Port `8787`.
- `GET /health` liefert `{"ok":true}`. Andere HTTP-Pfade liefern 404.
- `PORT` legt den Port fest; `npm run test:online` prueft echte Verbindungen.

## Anschluss fuer den Spiel-Code

`server/online.js` exportiert `registriereOnline(httpServer, optionen = {})`.
Die Funktion registriert WebSocket-Upgrades und liefert `aufraeumen()` zurueck.
Vor `httpServer.close()` aufrufen; beim HTTP-Server-Ereignis `close` wird ebenfalls
aufgeraeumt. In Vite ist der Anschluss bereits eingerichtet, nicht in `vite preview`.
`optionen.wirtschaftDatei` setzt einen anderen Dateipfad; `null` schaltet die
Dateispeicherung aus (fuer Tests). Standard ist `.minimini-data/wirtschaft.json`,
relativ zum Arbeitsverzeichnis des Node-Prozesses.
`optionen.besucheDatei` setzt unabhaengig davon die soziale Datei;
`null` deaktiviert deren Speicherung. Standard: `.minimini-data/besuche.json`.
Tests setzen beide Optionen auf `null`, ausser bei gezielten Persistenztests.

Der Client liest `VITE_ONLINE_URL`, zum Beispiel
`wss://online.example/minimini-online`. Diese Vite-Variable wird beim Build eingebaut.
Ohne extra Server kann der Client die aktuelle Seitenadresse mit `ws:` bzw. `wss:`
und dem Pfad `/minimini-online` verwenden. Der Client steht in `src/stadt.js`.

Alle Nachrichten sind JSON-Text. Beitritt:

```json
{"typ":"beitreten","raum":"MINIMINIS3","figur":{"name":"Mini","haut":"#ffdbac","haare":"#6b3a2a","frisur":"Kurz","oberteil":"#ed637b","hose":"#386cba","schuhe":"#f5c84c","kleidung":"T-Shirt","geschlecht":"Keine Auswahl","alter":8}}
```

Antwort an den neuen Spieler, einschliesslich seiner eigenen Figur:

```json
{"typ":"willkommen","id":"<Socket-UUID>","spieler":[{"id":"<Socket-UUID>","figur":{"name":"Mini","haut":"#ffdbac","haare":"#6b3a2a","frisur":"Kurz","oberteil":"#ed637b","hose":"#386cba","schuhe":"#f5c84c","kleidung":"T-Shirt","geschlecht":"Keine Auswahl","alter":8},"x":640,"y":520,"ort":"Stadt","haus":{"id":"<oeffentliche Haus-UUID>","offen":false,"briefkastenFarbe":"#de6573","briefkastenGefunden":false,"laden":false}}],"wirtschaft":{"muenzen":20,"inventar":{"teddy":2,"blume":3,"kuchen":3,"ball":2,"muschel":0,"perle":0,"kristall":0},"post":[],"briefe":[],"laden":false},"besuche":{"hausId":"<oeffentliche Haus-UUID>","freunde":[]}}
```

Danach bekommen alle im Raum `{"typ":"spieler","spieler":[...]}` mit denselben
vollstaendigen Spieler-Eintraegen: nach Beitritt, Bewegung und Abschied.
Bewegung: `{"typ":"bewegung","x":800,"y":500}`.
Gebaeudewechsel: `{"typ":"ort","ort":"Laden","x":640,"y":620}`.
Erlaubte Orte: `Stadt`, `Laden`, `Caf\u00e9`, `Spielhaus`.
Der Client zeigt nur Mitspieler am gleichen Ort. Ortswechsel werden gemeinsam
mit Bewegungslisten uebertragen.
Koordinaten werden auf `x=45..1235`, `y=300..730` begrenzt.
Bewegungen werden je Client hoechstens alle 100 ms angenommen; schnellere werden
verworfen. Bewegungslisten werden raumweit hoechstens alle 100 ms gesendet.
Beitritt und Abschied werden sofort gemeldet.

## Hausbesuche Und Freundschaften

Alte Willkommen-Felder bleiben erhalten. Neu sind `willkommen.besuche` und
`spieler[].haus` in Willkommen und allen Spielerlisten. `haus.id` ist eine
zufaellige oeffentliche UUID v4, nicht die geheime Konto-Kennung und nicht die
Socket-ID. Dasselbe Konto behaelt seine Haus-ID auch nach Server-Neustart.
Ohne Konto-Kennung bekommt jede Verbindung ein eigenes temporaeres Haus.
Kein Server-Paket enthaelt Konto-Kennungen. Die sozialen Daten werden getrennt
gespeichert; das bestehende Wirtschaftsschema und dessen Datei bleiben unveraendert.

Das eigene Haus betreten oder seine Eigenschaften aendern:

```json
{"typ":"zuhause","offen":true,"farben":{"wand":"#f4db68","dach":"#de6573","tuer":"#47725f","fenster":"#86d7e6"},"briefkastenFarbe":"#de6573","briefkastenGefunden":true}
```

Alle Felder sind Pflicht, weitere Felder sind verboten. Farben sind genau
`#` plus sechs Hex-Zeichen; die drei Zustandsfelder `offen`,
`briefkastenGefunden` und beim separaten `laden` dessen `offen` sind Boolean.
Die vier Farbschluessel sind exakt `wand`, `dach`, `tuer`, `fenster`.
Anschluss-Hinweis: `src/landschaft.js` hat derzeit nur `wand` und `dach` in
`hausfarben`. Tuer und Fenster sind dort fest `#47725f` und `#86d7e6` gezeichnet.
Das Frontend muss diese beiden Felder ergaenzen; der Server akzeptiert keine
unvollstaendige Farbmap. Diese Backend-Aenderung bearbeitet keine `src`-Dateien.

`zuhause` setzt nur das eigene Haus und den eigenen Ort auf
`Haus:<eigene oeffentliche Haus-ID>`, mit `x=640`, `y=620`.
Die Spielerliste veroeffentlicht die geprueften Eigenschaften als
`haus: {id, offen, farben?, briefkastenFarbe, briefkastenGefunden, laden}`.
Anfangs ist `offen=false`, `briefkastenGefunden=false`,
`briefkastenFarbe="#de6573"`; `farben` fehlt bis zur ersten Zuhause-Nachricht.
`haus.laden` kommt immer aus dem aktuellen Wirtschaftskonto.
Hausfarben, Briefkasten-Eigenschaften und Besuchsoeffnung sind sitzungsbezogen,
nicht Teil der sozialen Datei. Ein neuer Socket startet in `Stadt` mit
geschlossenem Haus, auch wenn das Wirtschaftskonto einen offenen Laden hat.

```json
{"typ":"besuchen","spielerId":"<Gastgeber-Socket-UUID>"}
```

Der Gastgeber muss aktuell verbunden, im selben Raum, in seinem eigenen
`Haus:<haus.id>` und fuer Besuche offen sein. Selbstbesuche und Besuche ueber
weitere Sockets desselben Kontos sind gesperrt. Eine Freundschaft ist keine
Voraussetzung fuer einen Besuch. Erfolg setzt den Gast auf denselben Haus-Ort
mit `x=640`, `y=620` und verteilt sofort die Spielerliste.
Antworten sind `{"typ":"besuch-status","text":"Deutscher Text"}`.
Der eigene aktuelle Ort wird nur aus dem eigenen Eintrag in der Spielerliste
gelesen; es gibt keinen weiteren Orts-Nachrichtentyp.

Zurueck geht es mit normalem `ort` nach `Stadt` oder mit `zuhause`.
Die bestehende `ort`-Whitelist bleibt unveraendert: direkt gesendete
`Haus:...`-Orte sind verboten und schliessen die Verbindung mit 1008.
Im Haus begrenzt `bewegung` die Position auf `x=45..1235`, `y=120..730`;
ausserhalb bleibt `y=300..730`. Schliesst oder verlaesst der Gastgeber sein Haus
oder trennt sich seine Verbindung, landen seine Gaeste in `Stadt` bei
`x=640`, `y=520`, erhalten `besuch-status` und eine aktualisierte Spielerliste.

Freundschaftsanfragen:

```json
{"typ":"freund-anfrage","spielerId":"<Empfaenger-Socket-UUID>"}
```

Nur der Empfaenger erhaelt diese Anfrage, mit Identitaet vom Server:

```json
{"typ":"freund-anfrage","id":"<Anfrage-UUID>","spielerId":"<Sender-Socket-UUID>","name":"Mini"}
```

Nur dieser Empfaenger-Socket darf antworten:

```json
{"typ":"freund-antwort","id":"<Anfrage-UUID>","annehmen":true}
```

`false` lehnt ab. Erst `true` speichert beide Seiten zusammen. Beide muessen
weiter verbunden und im selben Raum sein. Pro Senderkonto wartet hoechstens
eine Anfrage; neue Anfragen sind hoechstens alle 1000 ms moeglich. Anfragen
laufen nach genau zwei Minuten ab oder enden bei Abschied eines Beteiligten.
Eigene Konten und andere Raeume sind gesperrt. Fremde, doppelte oder abgelaufene
Antworten aendern nichts. Statusmeldungen verwenden `besuch-status`.

Nach Zustimmung erhalten alle eigenen aktiven Kontoverbindungen, auch in
anderen Raeumen, die aktualisierten sozialen Daten:

```json
{"typ":"besuche","daten":{"hausId":"<eigene Haus-UUID>","freunde":[{"hausId":"<Freundes-Haus-UUID>","name":"Mini"}]}}
```

Das ist exakt das Schema von `willkommen.besuche`. Namen stammen aus den
geprueften Figuren bei Zustimmung, bei leerem Namen steht `MiNiMiNi`.
Es gibt kein personalisiertes `spieler[].freund`; das Frontend vergleicht
`freunde[].hausId` mit `spieler[].haus.id`. Freundschaften zwischen dauerhaften
Konten bleiben nach Neustart erhalten. Freundschaften mit Gaesten gelten nur
waehrend deren Verbindung, werden nicht auf Platte geschrieben und beim
Gast-Abschied auch aus den anderen Freundeslisten entfernt.
Die Datei speichert nur Haus-ID und gegenseitige Freundeslisten pro Konto.
Speicherfehler uebernehmen keine Teilfreundschaft; beschaedigte Dateien werden
nicht stillschweigend ersetzt. Offene Anfragen werden nicht gespeichert.

## Standkauf Bei Anderen Spielern

Beim Zuhause-Betreten oder erfolgreichen Besuch erhaelt der betreffende Socket:

```json
{"typ":"stand","daten":{"verkaeufer":"<Gastgeber-Socket-UUID>","name":"Mini","inventar":{"teddy":2,"blume":3,"kuchen":3,"ball":2,"muschel":0,"perle":0,"kristall":0},"offen":true}}
```

`inventar` enthaelt nur die sieben Artikelzahlen, keine Muenzen, Post, Briefe
oder Konto-Kennung. `offen` entspricht `wirtschaft.laden`, nicht der separaten
Hausbesuchsoeffnung. Nach Wirtschaftsnachrichten werden aktuelle Standdaten
an Gastgeber und dessen Besucher am selben Haus-Ort verteilt. `laden`-Aenderungen
aktualisieren auch die oeffentlichen Spielerlisten, einschliesslich weiterer
Verbindungen desselben Kontos in anderen Raeumen.

```json
{"typ":"standkauf","verkaeufer":"<Gastgeber-Socket-UUID>","artikel":"teddy"}
```

Beide Spieler muessen online, im selben Raum und am exakt selben Ort
`Haus:<oeffentliche Haus-ID des Verkaeufers>` sein. Der Verkaeufer muss sein
eigenes Haus bewohnen, einen offenen Laden und mindestens ein Stueck haben.
Selbstkauf ist auch ueber andere Sockets desselben Kontos ausgeschlossen.
Alle sieben Artikel sind erlaubt; Preis immer 8 Spielmuenzen.
Der Kaeufer braucht mindestens 8 Muenzen und Platz im Inventar, der Verkaeufer
Platz fuer 8 Muenzen. Erfolgreicher Kauf uebertraegt atomar genau ein Stueck,
zieht beim Kaeufer 8 ab und gibt dem Verkaeufer 8. Beide Konten werden vor
`wirtschaft`-Updates zusammen gespeichert. Grenz- oder Speicherfehler aendern
keines der Konten. Antworten verwenden das bestehende `handel-status`.
Es gibt fuer `standkauf` keinen Cooldown und keinen erfundenen Kaeufer.
Der bestehende separate NPC-Befehl `verkaufen` bleibt aus Kompatibilitaet
unveraendert; er ist kein Standkauf.

Alle neuen Nachrichten pruefen Feldanzahl, Feldtypen, UUIDs und Farben strikt.
Falsche Nachrichtenschemas schliessen mit 1008; nicht erlaubte Besuche,
Freundschaften oder Kauefe geben nur Status ohne Zustandsaenderung.

## Raum-Textchat

Erst nach dem Beitritt darf der Client genau diese Felder senden:

```json
{"typ":"chat","text":"Hallo"}
```

Der Server sendet an alle Spieler im selben Raum, auch an den Absender:

```json
{"typ":"chat","nachricht":{"id":"<neue UUID>","spielerId":"<Server-Spieler-ID>","name":"Mini","text":"Hallo","zeit":1790899200000}}
```

`id` ist eine neue UUID pro Nachricht. `spielerId` und `name` stammen vom
Server-Spieler und seiner beim Beitritt geprueften Figur. Bei leerem Figurennamen
steht dort `MiNiMiNi`. `zeit` ist die Serverzeit aus `Date.now()` in Millisekunden.
Der Client darf keine eigenen IDs, Namen, Zeiten oder weiteren Felder mitschicken.

Der Raum bleibt derselbe, auch wenn Freunde in Stadt, Laden, Cafe oder Spielhaus
sind. Andere Raeume erhalten nichts. Der Server speichert keinen Chat-Verlauf:
Nachrichten werden nur unmittelbar verteilt, spaeter Beitretende erhalten keine
alten Nachrichten. Es gibt keine dauerhafte Speicherung oder Chat-Protokolle im
Server-Code fuer den Chat; Chat-Nachrichten sind fuer die kurze, laufende Sitzung gedacht.

Leerzeichen am Anfang und Ende werden entfernt. Danach muss der Text mindestens
ein Zeichen und hoechstens 160 JavaScript-Laengeneinheiten (`text.length`, wie
bei Browser-`maxlength="160"`) enthalten. Ein Emoji kann zwei Einheiten brauchen.
Alle Unicode-Steuerzeichen (`Cc`, auch Zeilenumbruch, Tabulator und DEL) sind
verboten, auch vor dem Entfernen der Leerzeichen.
Pro Spieler wird hoechstens alle 1000 ms eine gueltige Nachricht angenommen.
Schnellere gueltige Nachrichten werden ohne Trennung ignoriert und verlaengern
die Wartezeit nicht. Ungueltige Nachrichten schliessen weiterhin mit Code 1008.

Chat-Inhalt ist reiner Text. Auch `<script>` darf als Text ankommen. Der Client
muss ihn mit `textContent`, niemals mit `innerHTML`, anzeigen. Diese Server-Aenderung
ergaenzt keine Client-Anzeige. Keine echten Namen oder privaten Daten schreiben.

## Konto Und Spielmuenzen

Der Beitritt darf genau ein optionales Feld `konto` enthalten. Es ist eine geheime
Browser-Kennung: genau 32 kleine Hex-Zeichen, `/^[a-f0-9]{32}$/`. Es gibt keinen
separaten Nachrichtentyp `hello`. Ohne `konto` erhalten alte Clients pro Verbindung
ein eigenes, nicht dauerhaft gespeichertes Gastkonto.

Vorgesehener Browser-Anschluss (noch nicht durch diese Backend-Aenderung eingebaut):

```js
let konto = localStorage.getItem('minimini-konto')
if (!/^[a-f0-9]{32}$/.test(konto ?? '')) {
  konto = Array.from(crypto.getRandomValues(new Uint8Array(16)),
    byte => byte.toString(16).padStart(2, '0')).join('')
  localStorage.setItem('minimini-konto', konto)
}
socket.send(JSON.stringify({ typ: 'beitreten', raum: 'MINIMINIS3', figur, konto }))
```

Die Kennung niemals anzeigen, in Spielerlisten setzen, protokollieren oder teilen.
Sie ist kein Login, aber ihr Besitz erlaubt Zugriff auf das Konto. Alle aktiven
Verbindungen mit derselben Kennung teilen dasselbe Konto, auch ueber Raeume hinweg.
Sie erhalten jede Aenderung als:

```json
{"typ":"wirtschaft","daten":{"muenzen":20,"inventar":{"teddy":2,"blume":3,"kuchen":3,"ball":2,"muschel":0,"perle":0,"kristall":0},"post":[],"laden":false}}
```

`willkommen.wirtschaft` hat exakt dieselben Kontofelder. Hoechstens 1000000
Spielmuenzen und 1000 Stueck pro Artikel. Die vier kaufbaren Artikel-IDs sind `teddy`, `blume`,
`kuchen`, `ball`; die UI kann sie als `\u{1F9F8}`, `\u{1F337}`, `\u{1F370}` und
`\u{26BD}` darstellen. Dazu kommen `muschel`, `perle`, `kristall`, alle anfangs 0.
Diese Tauchartikel sind nicht kaufbar, aber verschenkbar und tauschbar.
Es gibt keine echten Zahlungen.

Gueltige Client-Nachrichten, jeweils ohne weitere Felder:

```json
{"typ":"laden","offen":true}
{"typ":"kaufen","artikel":"teddy"}
{"typ":"verkaufen","artikel":"kuchen"}
```

`offen` muss ein Boolean sein; `false` schliesst den eigenen Kiosk. Kaufen kostet
bei den vier kaufbaren Artikeln 5 Spielmuenzen pro Stueck. Kaufversuche fuer
Tauchartikel geben nur `handel-status`: `Diese Sache findest du nur unter Wasser.`
Verkaufen ist fuer alle sieben Artikel erlaubt, verbraucht genau ein Stueck und gibt
8 Spielmuenzen, nur bei offenem Kiosk. Der Kaeufer ist ausdruecklich ein simulierter
NPC-Spielkunde, kein anderer Spieler. Ein erfolgreicher Verkauf ist hoechstens
alle 1000 ms pro Konto moeglich, auch bei mehreren Sockets oder Wiederverbindung.
Der Cooldown ist nur im laufenden Server gespeichert, nicht ueber Server-Neustarts.

Der Server antwortet mit `{"typ":"handel-status","text":"Deutscher Text"}`.
Unbekannte Artikel, fehlende Sachen, volle Konten oder fehlende Spielmuenzen
geben Status ohne Kontoaenderung. Falsche Feldtypen, fehlende/extra Felder und
ungueltige IDs schliessen mit 1008, auch waehrend eines Cooldowns.

## Tauchen Am See

Nach dem Beitritt startet der Client mit genau diesen Feldern:

```json
{"typ":"tauchen"}
```

Nur die startende Verbindung erhaelt genau diese Antwort:

```json
{"typ":"tauchstart","funde":[{"id":"<Fund-UUID>","artikel":"muschel"},{"id":"<Fund-UUID>","artikel":"perle"},{"id":"<Fund-UUID>","artikel":"kristall"}]}
```

Das ist ein Beispiel, keine garantierte Ausbeute. Es gibt immer genau drei neue
UUID-v4-IDs. Der Server waehlt mit `crypto.randomInt`: Fund 1 ist immer eine
Muschel; Fund 2 ist zu 30 Prozent eine Perle, sonst eine Muschel; Fund 3 ist zu
10 Prozent ein Kristall, zu 20 Prozent eine Perle, sonst eine Muschel.
Der Start gibt noch keine Inventar-Belohnung.

Pro Konto darf nur ein Tauchgang laufen, auch bei mehreren Verbindungen und in
verschiedenen Raeumen. Er laeuft 60 Sekunden ab Server-Startzeit. Weitere Starts
waehrenddessen geben nur `handel-status` und ersetzen die Funde nicht. Nach allen
drei erfolgreichen Abholungen oder Ablauf darf ein neuer Tauchgang starten.
Es gibt hoechstens einen gespeicherten Tauchgang pro aktivem Konto.

Nur die startende Verbindung darf eine ihrer Fund-IDs abholen:

```json
{"typ":"tauchfund","id":"<Fund-UUID>"}
```

Der Client darf keinen Artikel, keine Menge und keine Zeit mitschicken. Fruehestens
1500 ms nach Start und mindestens 500 ms nach der letzten erfolgreichen Abholung
darf der Server genau ein Stueck gutschreiben. Zeiten stammen nur von `Date.now()`
auf dem Server, nicht vom Client. Zu fruehe, fremde, doppelte oder abgelaufene
Abholungen geben `handel-status` ohne Belohnung. Zu fruehe Versuche verbrauchen
keine ID und verlaengern den Abstand nicht. Eine andere Verbindung desselben
Kontos darf die IDs ebenfalls nicht nutzen.

Erst nach erfolgreicher Speicherung verteilt der Server `wirtschaft` an alle
aktiven Verbindungen dieses Kontos, auch in anderen Raeumen. Danach erhaelt nur
die abholende Verbindung genau diese Bestaetigung:

```json
{"typ":"tauchfund","id":"<Fund-UUID>","artikel":"muschel"}
```

Eine erfolgreiche Fund-ID ist verbraucht. Bei Speicherfehler oder vollem Inventar
bleiben ID und Fundabstand unveraendert; ein weiterer Versuch ist innerhalb des
Tauchgangs moeglich. Tauchfunde kosten keine Muenzen und schreiben keine Post.
Geschenke und Tausch mit diesen Artikeln nutzen unveraendert das Handelsprotokoll.

Beim Abschied der startenden Verbindung wird ihr Tauchgang entfernt. Der Abschied
einer anderen Verbindung desselben Kontos entfernt ihn nicht. Server-Abschluss
entfernt alle Tauchgaenge. Offene Fund-IDs und Zeiten sind nur fuer die laufende
Sitzung gueltig und werden nicht auf Platte gespeichert; nach Wiederverbindung
oder Server-Neustart koennen alte IDs nicht erneut abgeholt werden.

Der spaetere Spiel-Code soll Tauchen am See erst nach fertig gebautem Haus
freischalten und die Taucherbrille lokal darstellen. Der Server kennt weder
Hausbau noch Brille oder Seeposition und prueft diese Voraussetzungen nicht.
Das ist kein serverseitiger Schutz gegen Umgehen dieser UI-Regeln.
Diese Erweiterung aendert keine `src`-Dateien. Verbindliche Quelle fuer Belohnungen
ist immer `willkommen.wirtschaft` bzw. `wirtschaft.daten`, niemals ein lokal
erhoehtes Inventar. Offene Fund-IDs duerfen fuer den laufenden Tauchgang gemerkt
werden, nicht als dauerhafte Belohnung oder als nach Neustart gueltige Ansprueche.

## Geschenke Und Tausch

```json
{"typ":"geschenk","empfaenger":"<Socket-UUID>","artikel":"teddy"}
{"typ":"tausch","empfaenger":"<Socket-UUID>","gib":"teddy","nimm":"blume"}
```

`empfaenger` ist die `id` aus der Spielerliste, niemals die Konto-Kennung. Beide
Spieler muessen verbunden und im selben Raum sein. Selbsttransfer ist auch ueber
zwei verschiedene Socket-IDs desselben Kontos ausgeschlossen. Angebote uebergeben
noch nichts und reservieren keine Sachen. Pro Konto hoechstens ein ausgehendes und
ein eingehendes Angebot; insgesamt nie mehr Angebote als verbundene Sockets.

Nur der angesprochene Socket erhaelt:

```json
{"typ":"angebot","daten":{"id":"<Angebots-UUID>","art":"geschenk","von":"<Sender-Socket-UUID>","name":"Mini","artikel":"teddy"}}
{"typ":"angebot","daten":{"id":"<Angebots-UUID>","art":"tausch","von":"<Sender-Socket-UUID>","name":"Mini","gib":"teddy","nimm":"blume"}}
```

Der Sender erhaelt einen wartenden `handel-status`. Nur der angesprochene Socket,
nicht einmal ein anderer Socket desselben Empfaengerkontos, darf antworten:

```json
{"typ":"angebot","id":"<Angebots-UUID>","annehmen":true}
```

`false` lehnt ab. Vor Annahme prueft der Server erneut beide Verbindungen, Raum,
Inventar und Mengenlimits. Alle Aenderungen werden zusammen gespeichert und erst
danach uebernommen. Bei Fehlern wird nichts uebergeben. Beendete/doppelte Antworten
werden ignoriert. Nach Annahme (auch erfolgloser), Ablehnung, Abschied einer Seite,
Server-Abschluss oder Ablauf nach 2 Minuten bekommt der Empfaenger
`{"typ":"angebot-ende","id":"<Angebots-UUID>"}`; erreichbare Beteiligte erhalten Status.

Abgeschlossene Geschenke schreiben beim Empfaenger einen historischen Posteintrag:

```json
{"id":"<neue UUID>","von":"Mini","artikel":"teddy","art":"geschenk","zeit":1790899200000}
```

Beim Tausch erhalten beide einen Eintrag mit `art:"tausch"` und ihrem empfangenen
Artikel (`gib` beim Empfaenger, `nimm` beim Sender). `zeit` kommt vom Server aus
`Date.now()`. Es bleiben die letzten 30 Eintraege. Post ist nur Geschichte:
Sachen sind bereits im Inventar, nicht erneut abholbar. Weitergeben oder Verkaufen
loescht diese Eintraege nicht. Briefkastenfarbe und Darstellung bleiben UI-Aufgabe;
das hier vereinbarte Backend-Protokoll enthaelt kein Farbfeld.

## Dauerhafte Speicherung

`server/wirtschaft.js` exportiert `erstelleWirtschaft({ datei, spieler, sende })`.
`spieler()` liefert aktive Spieler; `sende(socket, nachricht)` verschickt JSON-Daten.
Der Helfer liefert `anmelden(person, kennung)`, `daten(person)`,
`nachricht(person, nachricht)`, `entferne(person)` und `aufraeumen()`.
`nachricht` liefert `null` fuer fremde Nachrichtentypen, `false` fuer fehlerhafte
Schemas und `true` fuer behandelte Wirtschaftsnachrichten, auch Geschaeftsfehler.

Dateiformat: `{"version":1,"konten":{...}}`, Schluessel sind geheime Konto-Kennungen.
Die Version bleibt 1. Beim Laden werden ausschliesslich fehlende Inventarfelder
`muschel`, `perle`, `kristall` mit 0 ergaenzt, bevor das exakte Kontoschema geprueft
wird. Bestehende Mengen, Muenzen, Ladenstatus und historische Post bleiben erhalten.
Vorhandene ungueltige Werte (auch `null`), fehlende alte Felder und zusaetzliche
Felder werden weiterhin abgelehnt, nicht repariert oder zurueckgesetzt. Die
ergaenzten Felder werden beim naechsten erfolgreichen Kontoschreiben mitgespeichert.
Strukturiertes JSON wird mit `mkdirSync`, temporaerer Datei und `renameSync`
gespeichert. Vor erfolgreichem Schreiben wird keine Kontoaenderung uebernommen.
Kaputte Dateien stoppen den Start mit einer allgemeinen Fehlermeldung, ohne ihre
Geheimnisse auszugeben oder sie durch leere Konten zu ersetzen.

`.minimini-data/` ist von Git ausgeschlossen. Updates duerfen diesen Ordner nicht
loeschen. Beim Hosting einen dauerhaften Datentraeger und private Backups nutzen,
auch bei einem Wechsel des Rechners oder Arbeitsverzeichnisses. Datei niemals
oeffentlich ausliefern. Browser-Speicher loeschen/verlorene Kennung bedeutet neues
Konto; es gibt keinen Login oder Wiederherstellungsdienst. Neue Browser-Kennungen
bekommen Startkonten, deshalb ist dies kein System mit wertvollen echten Guthaben.

Genau ein Serverprozess darf dieselbe Datei benutzen; kein Mehrprozess-Dateilock,
keine Datenbank und keine Garantie bei Stromausfall waehrend eines Schreibens.
Schreibvorgaenge sind synchron und fuer einen kleinen elternbetreuten Server gedacht.
Raeume, Chat, laufende Angebote, Tauchgaenge und Verkaufs-Cooldowns bleiben nur im Arbeitsspeicher.
Tests verwenden `wirtschaftDatei:null` oder eigene temporaere Ordner.

## Datenregeln

- Raum-ID: 4 bis 12 Zeichen, nur `A-Z` und `0-9`, maximal 12 Spieler je Raum.
- Maximal 100 Raeume und 1200 gleichzeitig verbundene Sockets, auch ohne Beitritt.
- Maximal 4096 Bytes je Nachricht. Kein Binaerformat und keine zusaetzlichen Felder.
- Namen: maximal 24 Zeichen, Buchstaben, Zahlen, Leerzeichen und `._-`; kein HTML.
- Farben: sechsstellige Hex-Farben wie `#ffdbac`.
- Frisur: `Kurz`, `Lang`, `Z\u00f6pfe` (JSON fuer Zoepfe), `Locken`, `Glatze`.
- Kleidung: `T-Shirt`, `Kleid`, `Hoodie`.
- Geschlecht: `Weiblich`, `M\u00e4nnlich` (JSON fuer Maennlich), `Keine Auswahl`.
- Alter: ganze Zahl von 0 bis 120, nur das erfundene Alter der Spielfigur.
- Raum-Chat: nur nach Beitritt, genau `typ` und `text`, maximal 160 nach
  JavaScript-Zaehlung, keine Steuerzeichen, mindestens eine Sekunde Abstand.
- Ungueltige Daten: Verbindung schliesst mit Code 1008; zu grosse Daten: 1009.
- Nach 10 Sekunden ohne Beitritt wird getrennt. Ping/Pong alle 30 Sekunden
  entfernt verschwundene Verbindungen. Leere Raeume werden geloescht.

## Mit Eltern ins Internet bringen

Vercel-Serverless kann diesen dauerhaften WebSocket-Server **nicht** betreiben.
Die Spielseite darf auf Vercel bleiben. Der Online-Server braucht einen dauerhaft
laufenden Node-Prozess auf einem elternverwalteten Rechner oder vorhandenen Host,
HTTPS/WSS und einen Proxy, der WebSocket-Upgrades weiterleitet.
Es wurde kein kostenpflichtiger Anbieter ausgewaehlt und keine Anmeldung angelegt.

Bei einer getrennten Spielseite muss am Server `ONLINE_ORIGINS` gesetzt werden,
zum Beispiel `https://deine-stadt.vercel.app`. Mehrere genaue Origins mit Komma
trennen; keine Pfade oder Wildcards. Ohne Freigabe ist im Browser nur derselbe
Host samt Port und passendem HTTP/HTTPS-Protokoll erlaubt. Hinter einem TLS-Proxy
die externe HTTPS-Origin ausdruecklich freigeben. Weitergereichte Host- oder
Protokoll-Header werden nicht automatisch vertraut.
Clients ohne Origin, etwa die Node-Tests, duerfen verbinden.

Die Raum-ID ist **kein Passwort**. Insbesondere ist `MINIMINIS3` allgemein bekannt:
Jeder mit Zugang zu diesem Server kann beitreten. Origins sind kein Login und
schuetzen nicht vor eigenen Nicht-Browser-Clients. Am sichersten ist ein von Eltern
verwalteter Server im eigenen WLAN mit Firewall, nicht ein oeffentlicher Kinderchat.
Eltern sollen Zugang und Hosting betreuen. Keine echten Namen, Geburtstage oder
Kontaktdaten verwenden. Es werden keine Mikrofon- oder Standortdaten erhoben.
Spielkonten und historische Post werden gespeichert, Figur und Chat ansonsten nur
im Arbeitsspeicher verteilt, Chat ohne Verlauf.
IP-Adressen sind fuer eine
Netzwerkverbindung technisch sichtbar. Hosting-Logs koennen IP-Adressen enthalten.

Es gibt noch keine dauerhafte gemeinsame Stadt-Speicherung oder gemeinsame Baudaten.
Ein Server-Neustart leert alle Raeume, aber nicht die gespeicherten Spielkonten.
Die Grenzen begrenzen Speicher und
Bewegungslisten, ersetzen aber keinen vorgeschalteten Schutz gegen Netzwerkmissbrauch.