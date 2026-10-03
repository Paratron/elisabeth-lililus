export function sprecheFigur(figur, text, beiFehler = () => {}) {
  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    beiFehler('Dieser Browser kann leider keine Stimme abspielen.')
    return false
  }
  const stimmen = window.speechSynthesis.getVoices().filter(stimme => /^de(?:-|_|$)/i.test(stimme.lang))
  if (stimmen.length === 0) {
    window.speechSynthesis.cancel()
    beiFehler('Dieser Browser stellt keine deutsche Vorlesestimme bereit. Ohne sie kann dein MiNiMiNi noch nicht auf Deutsch sprechen.')
    return false
  }
  const weiblich = /anna|katja|hedda|helena|petra|marlene|vicki|female|weiblich/i
  const maennlich = /stefan|conrad|hans|markus|male|männlich/i
  const passendeStimmen = stimmen.filter(stimme => figur.geschlecht === 'Weiblich'
    ? weiblich.test(stimme.name)
    : figur.geschlecht === 'Männlich' && maennlich.test(stimme.name) && !weiblich.test(stimme.name))
  const auswahl = passendeStimmen.length ? passendeStimmen : stimmen
  const satz = new SpeechSynthesisUtterance(text)
  satz.lang = 'de-DE'
  satz.voice = auswahl.find(stimme => stimme.localService) || auswahl[0] || null
  const kinderZuschlag = figur.alter <= 12 ? 0.5 : figur.alter <= 17 ? 0.25 : 0
  satz.pitch = (figur.geschlecht === 'Weiblich' ? 1.45 : 1.15) + kinderZuschlag
  satz.rate = 0.9
  satz.volume = 0.8
  satz.onerror = ereignis => {
    if (!['canceled', 'interrupted'].includes(ereignis.error)) {
      beiFehler('Die Stimme klappt gerade nicht. Prüfe den Ton auf deinem Gerät.')
    }
  }
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(satz)
  return true
}

export function stoppeStimme() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}