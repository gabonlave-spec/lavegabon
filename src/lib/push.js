import { getApp } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const VAPID = 'BNAyjrCJyuEA9OZplAPW06g5BMql_cnsUwKjlJOXaM0eZN102DeMwdcEvNOGdFBVW2xUR5sNkJQ0dYjmx3hGhE4';
const RELAIS = 'https://gentle-shape-eb32lavegabon-relais.gabonlave.workers.dev';
const CLE = 'push_token';

const attendre = (p, ms) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('delai')), ms))]);

export async function pushPossible() {
  try {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window && (await isSupported());
  } catch (e) { return false; }
}

async function jetonActuel() {
  const reg = await attendre(navigator.serviceWorker.ready, 5000);
  return (await getToken(getMessaging(getApp()), { vapidKey: VAPID, serviceWorkerRegistration: reg })) || '';
}

async function garder(uid, jeton) {
  await setDoc(doc(db, 'pushTokens', jeton), { uid, createdAt: serverTimestamp() });
  try { localStorage.setItem(CLE, jeton); } catch (e) { /* ignore */ }
}

export async function activerPush(uid) {
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return 'denied';
    const jeton = await jetonActuel();
    if (!jeton) return 'error';
    await garder(uid, jeton);
    return 'on';
  } catch (e) { console.error('push', e); return 'error'; }
}

export async function synchroPush(uid) {
  try {
    if (Notification.permission !== 'granted') return;
    if (localStorage.getItem('lav_push_off_' + uid) === '1') return;
    const jeton = await jetonActuel();
    if (jeton) await garder(uid, jeton);
  } catch (e) { /* ignore */ }
}

export async function desactiverPush() {
  try {
    const jeton = localStorage.getItem(CLE);
    if (jeton) {
      await attendre(deleteDoc(doc(db, 'pushTokens', jeton)), 2000);
      localStorage.removeItem(CLE);
    }
  } catch (e) { /* ignore */ }
}

export function pingRelais(chemin, id) {
  try {
    fetch(RELAIS + chemin, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
      keepalive: true
    }).catch(() => { /* ignore */ });
  } catch (e) { /* ignore */ }
}

export async function brancherAlertes(zone, uid) {
  if (!zone) return;
  const note = (t) => { zone.hidden = false; zone.innerHTML = '<h2>Alertes</h2><p class="muted">' + t + '</p>'; };
  if (!(await pushPossible())) return note("Alertes téléphone indisponibles ici (iPhone : ajoute d'abord l'app à l'écran d'accueil).");
  if (Notification.permission === 'granted') { await synchroPush(uid); return note('Alertes téléphone activées.'); }
  if (Notification.permission === 'denied') return note("Alertes bloquées : autorise les notifications du site dans les réglages du navigateur.");
  zone.hidden = false;
  zone.innerHTML = '<h2>Alertes</h2><button class="btn primary" type="button" id="push-on">Activer les alertes téléphone</button><p class="muted" id="push-msg"></p>';
  zone.querySelector('#push-on').addEventListener('click', async () => {
    const r = await activerPush(uid);
    if (r === 'on') note('Alertes téléphone activées.');
    else if (r === 'denied') note("Alertes bloquées : autorise les notifications du site dans les réglages du navigateur.");
    else zone.querySelector('#push-msg').textContent = 'Activation impossible, réessaie.';
  });
}
