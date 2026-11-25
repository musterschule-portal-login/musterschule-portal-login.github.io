/*
 * Schul-Portal – KOPIE für den Phishing-Workshop
 *
 * Diese Seite sieht aus wie das echte Portal, ist aber ein Lehrbeispiel:
 * - Sie liest KEINE Eingaben aus (kein .value, kein FormData).
 * - Sie speichert nichts (kein localStorage, keine Cookies).
 * - Sie sendet nichts (kein fetch/XHR; zusätzlich verbietet die Content-Security-Policy
 *   im <head> jede Netzwerkverbindung und jedes Absenden eines Formulars).
 * - Sie legt keinen Passkey an (kein navigator.credentials.create).
 * Beim Absenden oder Klick auf einen Passkey-Knopf erscheint nur die Auflösung.
 */
(() => {
  'use strict';

  const dialog = document.getElementById('phish-dialog');
  const reveal = () => { if (dialog && !dialog.open) dialog.showModal(); };

  document.getElementById('phish-close')?.addEventListener('click', () => dialog.close());

  // Formulare: nur Auflösung zeigen, Eingaben bleiben unangetastet
  document.querySelectorAll('form').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      reveal();
    });
  });

  // Passkey erstellen: absichtlich KEIN WebAuthn-Aufruf
  document.getElementById('passkey-create')?.addEventListener('click', reveal);

  // Passkey-Anmeldung: nur LESENDE Abfrage. Hier gibt es keinen Passkey für diese Adresse,
  // denn Passkeys sind an die echte Domain gebunden.
  const canWebAuthn = !!(window.PublicKeyCredential && navigator.credentials);
  const ask = (conditional, signal) => {
    const options = {
      publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), rpId: location.hostname, userVerification: 'preferred', timeout: 60000 },
      signal,
    };
    if (conditional) options.mediation = 'conditional';
    return navigator.credentials.get(options);
  };

  let ctl = null;
  document.getElementById('passkey-login')?.addEventListener('click', async () => {
    if (ctl) ctl.abort();
    ctl = new AbortController();
    try {
      if (canWebAuthn) await ask(false, ctl.signal);
    } catch (err) {
      if (err && err.name === 'AbortError') return;
    }
    reveal();
  });

  // Autofill-Vorschläge im Benutzernamen-Feld: auf dieser Adresse erscheinen keine.
  if (canWebAuthn && PublicKeyCredential.isConditionalMediationAvailable) {
    PublicKeyCredential.isConditionalMediationAvailable()
      .then((ok) => {
        if (!ok) return;
        ctl = new AbortController();
        return ask(true, ctl.signal).catch(() => {});
      })
      .catch(() => {});
  }
})();
