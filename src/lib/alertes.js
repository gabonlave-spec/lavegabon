// Alertes niveau 1 : cloche, pastille, liste, son et vibration, selon le profil connecté.
import { collection, doc, limit, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { esc, toast } from './ui.js';
import { filtrerPourLaveur } from './db.js';
import { pushPossible, activerPush, desactiverPush } from './push.js';

const ts = (d) => d.updatedAt?.toMillis?.() ?? d.createdAt?.toMillis?.() ?? 0;
const qte = (c) => [c.quantite, c.unite].filter(Boolean).join(' ');

const MSG_CLIENT = {
  acceptee: ['Commande acceptée', (c) => `${c.laveurNom || 'Un laveur'} prend en charge votre commande.`],
  en_cours: ['Lavage en cours', () => 'Votre laveur a commencé.'],
  terminee: ['Commande terminée', () => 'Votre commande est terminée.']
};

// Sources d'alertes par profil : égalités seulement, 50 résultats maximum.
function sources(uid, role, statut) {
  const cmd = collection(db, 'commandes');
  const usr = collection(db, 'users');
  if (role === 'client') {
    return [{
      q: () => query(cmd, where('clientId', '==', uid), limit(50)),
      map: (id, d) => {
        const m = MSG_CLIENT[d.statut];
        if (!m) return null;
        return { id: `cmd-${id}-${d.statut}`, title: m[0], body: `${d.serviceLabel || ''} · ${m[1](d)}`, link: '/commandes', at: ts(d) };
      }
    }];
  }
  if (role === 'laveur' && statut === 'actif') {
    return [{
      q: () => query(cmd, where('statut', '==', 'en_attente'), limit(50)),
      map: (id, d) => ({
        id: `dem-${id}`, title: d.urgent ? 'Nouvelle demande (urgent)' : 'Nouvelle demande',
        body: [d.serviceLabel, qte(d)].filter(Boolean).join(' · '), link: '/demandes', at: ts(d),
        ok: () => filtrerPourLaveur([d], profilLaveur).length > 0
      })
    }];
  }
  if (role === 'admin') {
    return [
      {
        q: () => query(usr, where('demandeLaveur', '==', true), limit(50)),
        map: (id, d) => ({ id: `dl-${id}`, title: 'Demande pour devenir laveur', body: d.nom || '', link: '/admin/demandes', at: ts(d) })
      },
      {
        q: () => query(usr, where('statut', '==', 'en_attente'), limit(50)),
        map: (id, d) => ({ id: `nl-${id}`, title: 'Nouveau laveur à valider', body: d.nom || '', link: '/admin/demandes', at: ts(d) })
      }
    ];
  }
  return [];
}

let cle = '';
let uidCourant = '';
let offs = [];
let par = new Map();
let premiers = new Set();
let nbSources = 0;
let connus = null;
let items = [];
let lus = [];
let audio = null;
let debloque = false;
let profilLaveur = {};
let prefs = { son: true, vib: true, toast: true, types: {} };
let roleCourant = '';
let vueReglages = false;
let pushOk = false;
const cleP = () => 'lav_notif_prefs_' + uidCourant;
function chargerPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem(cleP()) || '{}');
    return { son: p.son !== false, vib: p.vib !== false, toast: p.toast !== false, types: p.types && typeof p.types === 'object' ? p.types : {} };
  } catch { return { son: true, vib: true, toast: true, types: {} }; }
}
function sauverPrefs() { try { localStorage.setItem(cleP(), JSON.stringify(prefs)); } catch { /* ignore */ } }
const typeActif = (a) => prefs.types[String(a.id).split('-')[0]] !== false;

const cleLus = () => 'lav_alertes_lues_' + uidCourant;
function chargerLus() { try { return JSON.parse(localStorage.getItem(cleLus()) || '[]'); } catch { return []; } }
function sauverLus() { try { localStorage.setItem(cleLus(), JSON.stringify(lus.slice(-300))); } catch { /* ignore */ } }
const nonLus = () => items.filter((a) => !lus.includes(a.id));

function initSon() {
  if (audio) return;
  audio = new Audio(import.meta.env.BASE_URL + 'sounds/notif.wav');
  audio.preload = 'auto';
  const debloquer = () => { debloque = true; window.removeEventListener('pointerdown', debloquer); };
  window.addEventListener('pointerdown', debloquer);
}
function sonner() {
  if (prefs.son && debloque && audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
  if (prefs.vib && 'vibrate' in navigator) navigator.vibrate([200, 100, 200]);
}
function badgeIcone(n) {
  try {
    if (n > 0) Promise.resolve(navigator.setAppBadge?.(n)).catch(() => {});
    else Promise.resolve(navigator.clearAppBadge?.()).catch(() => {});
  } catch { /* ignore */ }
}

function panneau() {
  let el = document.getElementById('alertes-panel');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'alertes-panel';
  el.className = 'alertes-panel';
  el.hidden = true;
  document.body.appendChild(el);
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-id]');
    if (b) {
      if (!lus.includes(b.dataset.id)) { lus.push(b.dataset.id); sauverLus(); }
      el.hidden = true;
      majUI();
      location.hash = '#' + b.dataset.link;
      return;
    }
    if (e.target.closest('#alertes-reg')) { vueReglages = true; dessiner(); return; }
    if (e.target.closest('#alertes-retour')) { vueReglages = false; dessiner(); return; }
    if (e.target.closest('#alertes-tout')) {
      lus = [...new Set([...lus, ...items.map((a) => a.id)])];
      sauverLus();
      majUI();
    }
  });
  document.addEventListener('click', (e) => {
    if (!el.hidden && !e.target.closest('#alertes-panel') && !e.target.closest('#hbell') && e.target.isConnected) el.hidden = true;
  });
  window.addEventListener('hashchange', () => { el.hidden = true; });
  el.addEventListener('change', async (e) => {
    const i = e.target;
    if (!i.id || !i.id.startsWith('sw-')) return;
    if (i.id === 'sw-son') {
      prefs.son = i.checked;
      if (i.checked && debloque && audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
    } else if (i.id === 'sw-vib') {
      prefs.vib = i.checked;
      if (i.checked && 'vibrate' in navigator) navigator.vibrate(120);
    } else if (i.id === 'sw-toast') {
      prefs.toast = i.checked;
    } else if (i.id.startsWith('sw-t-')) {
      prefs.types[i.id.slice(5)] = i.checked;
    } else if (i.id === 'sw-push') {
      const msg = el.querySelector('#sw-msg');
      i.disabled = true;
      try {
        if (i.checked) {
          localStorage.removeItem('lav_push_off_' + uidCourant);
          const r = await activerPush(uidCourant);
          if (r !== 'on') {
            i.checked = false;
            if (msg) msg.textContent = r === 'denied' ? 'Notifications bloquées : autorise-les pour ce site dans les réglages du navigateur.' : 'Activation impossible, réessaie.';
          } else if (msg) msg.textContent = '';
        } else {
          localStorage.setItem('lav_push_off_' + uidCourant, '1');
          await desactiverPush();
          if (msg) msg.textContent = 'Alertes téléphone désactivées.';
        }
      } catch { /* ignore */ }
      i.disabled = false;
      return;
    }
    sauverPrefs();
    if (i.id.startsWith('sw-t-')) { recalculer(); majUI(); }
  });
  return el;
}

const TYPES = {
  client: [['cmd', 'Avancement de mes commandes', 'Acceptée, en cours, terminée']],
  laveur: [['dem', 'Nouvelles demandes', 'Dans mes quartiers et mes services']],
  admin: [['dl', 'Demandes pour devenir laveur', ''], ['nl', 'Nouveaux laveurs à valider', '']]
};
const interrupteur = (id, titre, aide, on) =>
  `<label class="sw"><span class="sw-t"><b>${esc(titre)}</b>${aide ? `<small>${esc(aide)}</small>` : ''}</span><input type="checkbox" role="switch" id="${id}"${on ? ' checked' : ''}></label>`;
function pushActif() {
  try {
    return 'Notification' in window && Notification.permission === 'granted'
      && !!localStorage.getItem('push_token') && localStorage.getItem('lav_push_off_' + uidCourant) !== '1';
  } catch { return false; }
}
function reglages() {
  const types = (TYPES[roleCourant] || []).map(([k, titre, aide]) => interrupteur('sw-t-' + k, titre, aide, prefs.types[k] !== false)).join('');
  return `<div class="alertes-tete"><b>Paramètres</b><button type="button" id="alertes-retour">← Retour</button></div>
    <h4 class="sw-h">Comment être prévenu</h4>
    <div class="sw-groupe">
      ${interrupteur('sw-son', 'Son', 'Un bip à chaque nouvelle alerte', prefs.son)}
      ${interrupteur('sw-vib', 'Vibration', '', prefs.vib)}
      ${interrupteur('sw-toast', "Message à l'écran", "Un bandeau quand l'appli est ouverte", prefs.toast)}
    </div>
    ${types ? `<h4 class="sw-h">Alertes à recevoir</h4><div class="sw-groupe">${types}</div>` : ''}
    ${pushOk ? `<h4 class="sw-h">Téléphone</h4><div class="sw-groupe">${interrupteur('sw-push', 'Alertes téléphone', "Même quand l'appli est fermée", pushActif())}</div><p class="muted" id="sw-msg"></p>` : ''}`;
}

function dessiner() {
  const el = panneau();
  if (vueReglages) { el.innerHTML = reglages(); return; }
  const n = nonLus().length;
  el.innerHTML =
    `<div class="alertes-tete"><b>Notifications</b>${n ? '<button type="button" id="alertes-tout">Tout marquer comme lu</button>' : ''}<button type="button" id="alertes-reg">⚙ Paramètres</button></div>` +
    (items.length
      ? items.map((a) => `<button type="button" class="alerte${lus.includes(a.id) ? '' : ' nonlu'}" data-id="${esc(a.id)}" data-link="${esc(a.link)}"><b>${esc(a.title)}</b><span>${esc(a.body)}</span></button>`).join('')
      : '<p class="alertes-vide">Rien de nouveau.</p>');
}

function majUI() {
  const n = nonLus().length;
  const dot = document.getElementById('hdot');
  if (dot) {
    dot.classList.add('num');
    dot.textContent = n > 99 ? '99+' : String(n);
    dot.hidden = n === 0;
  }
  badgeIcone(n);
  dessiner();
}

function arreter() {
  offs.forEach((o) => o());
  offs = []; par = new Map(); premiers = new Set(); connus = null; items = []; lus = []; profilLaveur = {};
}

function recalculer() {
  const tous = [...par.values()].flat().filter((a) => !a.ok || a.ok()).sort((a, b) => b.at - a.at);
  items = tous.filter(typeActif);
  if (premiers.size < nbSources) return;
  if (connus === null) { connus = new Set(tous.map((a) => a.id)); return; }
  for (const a of tous) {
    if (!connus.has(a.id)) {
      connus.add(a.id);
      if (typeActif(a) && !lus.includes(a.id)) {
        sonner();
        if (prefs.toast) toast(a.title, 'info');
      }
    }
  }
}

function synchroniser(state) {
  const u = state.user;
  const p = state.profile;
  const k = u && p ? [u.uid, p.role, p.statut].join('|') : '';
  if (k === cle) return;
  arreter();
  cle = k;
  if (!k) { majUI(); return; }
  initSon();
  uidCourant = u.uid;
  lus = chargerLus();
  prefs = chargerPrefs();
  roleCourant = p.role;
  pushPossible().then((v) => { pushOk = v; }).catch(() => {});
  const src = sources(u.uid, p.role, p.statut);
  const laveur = p.role === 'laveur' && p.statut === 'actif';
  nbSources = src.length + (laveur ? 1 : 0);
  if (laveur) {
    // Quartiers et services du laveur : mêmes règles que la page « Demandes près de toi ».
    offs.push(onSnapshot(doc(db, 'laveurs', u.uid), (snap) => {
      profilLaveur = snap.exists() ? snap.data() : {};
      premiers.add('profil');
      recalculer();
      majUI();
    }, () => { premiers.add('profil'); recalculer(); majUI(); }));
  }
  src.forEach((s, i) => {
    offs.push(onSnapshot(s.q(), (snap) => {
      par.set(i, snap.docs.map((d) => s.map(d.id, d.data())).filter(Boolean));
      premiers.add(i);
      recalculer();
      majUI();
    }, () => { /* droits ou réseau : on ignore */ }));
  });
  majUI();
}

// À appeler après chaque rendu de l'en-tête.
export function brancherCloche(state) {
  synchroniser(state);
  const b = document.getElementById('hbell');
  if (b) {
    b.addEventListener('click', () => {
      if (!cle) { toast('Connecte-toi pour voir tes notifications.', 'info'); return; }
      const el = panneau();
      vueReglages = false;
      dessiner();
      el.hidden = !el.hidden;
    });
  }
  majUI();
}
