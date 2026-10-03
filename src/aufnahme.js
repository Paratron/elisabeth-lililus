import { createElement, Mic, Square } from 'lucide'
import { stoppeStimme } from './stimme.js'

export function baueAufnahme(welt, sprachmeldung) {
  const knopf = document.createElement('button')
  knopf.className = 'welt-knopf mikrofonknopf'
  welt.append(knopf)
  let rekorder
  let mikrofon
  let aufnahmeUrl
  let ton
  let zeitlimit
  let geschlossen = false
  let wartet = false
  let verarbeitet = false

  function zeigeKnopf(laeuft) {
    const name = laeuft ? 'Aufnahme stoppen' : 'Eigene Stimme aufnehmen'
    knopf.title = name
    knopf.setAttribute('aria-label', name)
    knopf.setAttribute('aria-pressed', String(laeuft))
    knopf.replaceChildren(createElement(laeuft ? Square : Mic, { width: 28, height: 28, 'aria-hidden': 'true' }))
  }
  function mikrofonAus() {
    clearTimeout(zeitlimit)
    mikrofon?.getTracks().forEach(spur => spur.stop())
    mikrofon = undefined
  }
  function stoppen() {
    if (rekorder?.state === 'recording') {
      verarbeitet = true
      rekorder.stop()
    }
    mikrofonAus()
    zeigeKnopf(false)
  }
  zeigeKnopf(false)

  knopf.addEventListener('click', async () => {
    if (wartet) return
    if (rekorder?.state === 'recording') {
      stoppen()
      return
    }
    if (!window.isSecureContext) {
      sprachmeldung.textContent = 'Das Mikrofon braucht eine sichere HTTPS-Adresse. Am Computer geht auch localhost.'
      return
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      sprachmeldung.textContent = 'Dieser Browser unterstützt keine Mikrofon-Aufnahme.'
      return
    }
    wartet = true
    knopf.disabled = true
    stoppeStimme()
    ton?.pause()
    sprachmeldung.textContent = 'Bitte erlaube das Mikrofon im Browser.'
    try {
      const eingang = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (geschlossen) {
        eingang.getTracks().forEach(spur => spur.stop())
        return
      }
      mikrofon = eingang
      rekorder = new MediaRecorder(mikrofon)
      const teile = []
      let fehlgeschlagen = false
      rekorder.ondataavailable = ereignis => {
        if (ereignis.data.size > 0) teile.push(ereignis.data)
      }
      rekorder.onerror = () => {
        fehlgeschlagen = true
        stoppen()
        sprachmeldung.textContent = 'Die Aufnahme hat nicht geklappt. Probier es noch einmal.'
      }
      rekorder.onstop = () => {
        verarbeitet = false
        mikrofonAus()
        zeigeKnopf(false)
        if (geschlossen || fehlgeschlagen) return
        const datei = new Blob(teile, { type: rekorder.mimeType || teile[0]?.type || 'audio/webm' })
        if (datei.size === 0) {
          sprachmeldung.textContent = 'Die Aufnahme war leer. Probier es noch einmal.'
          return
        }
        if (aufnahmeUrl) URL.revokeObjectURL(aufnahmeUrl)
        aufnahmeUrl = URL.createObjectURL(datei)
        ton = new Audio(aufnahmeUrl)
        sprachmeldung.textContent = 'Aufgenommen! Deine Stimme bleibt beim Wechsel in die Landschaft dabei. Beim Neuladen wird sie gelöscht.'
      }
      rekorder.start()
      zeigeKnopf(true)
      sprachmeldung.textContent = 'Aufnahme läuft. Tippe zum Stoppen. Nach 15 Sekunden stoppt sie von selbst.'
      zeitlimit = setTimeout(stoppen, 15000)
    } catch (fehler) {
      mikrofonAus()
      sprachmeldung.textContent = fehler.name === 'NotAllowedError'
        ? 'Das Mikrofon wurde nicht erlaubt. Du kannst es in den Browser-Einstellungen freigeben.'
        : fehler.name === 'NotFoundError'
          ? 'Kein Mikrofon gefunden. Du kannst weiterhin die deutsche Spielstimme benutzen.'
          : 'Das Mikrofon konnte nicht starten. Prüfe, ob es von einem anderen Programm benutzt wird.'
    } finally {
      wartet = false
      knopf.disabled = false
    }
  })

  return {
    istBeschaeftigt() {
      return wartet || verarbeitet || rekorder?.state === 'recording'
    },
    spieleAufnahme(meldung = sprachmeldung) {
      if (wartet || verarbeitet || rekorder?.state === 'recording') {
        meldung.textContent = 'Stoppe zuerst die Aufnahme.'
        return true
      }
      if (!ton) return false
      stoppeStimme()
      ton.currentTime = 0
      ton.play().catch(() => {
        if (!geschlossen) meldung.textContent = 'Die Aufnahme konnte nicht abgespielt werden.'
      })
      return true
    },
    pausiere() {
      ton?.pause()
    },
    beenden() {
      geschlossen = true
      stoppen()
      ton?.pause()
      if (aufnahmeUrl) URL.revokeObjectURL(aufnahmeUrl)
    },
  }
}