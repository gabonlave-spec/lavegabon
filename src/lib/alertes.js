// Alertes niveau 1 : cloche, pastille, liste, son et vibration, selon le profil connecté.
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { esc, toast } from './ui.js';

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
        body: [d.serviceLabel, qte(d)].filter(Boolean).join(' · '), link: '/demandes', at: ts(d)
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
  if (debloque && audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
  if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
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
    if (e.target.closest('#alertes-tout')) {
      lus = [...new Set([...lus, ...items.map((a) => a.id)])];
      sauverLus();
      majUI();
    }
  });
  document.addEventListener('click', (e) => {
    if (!el.hidden && !e.target.closest('#alertes-panel') && !e.target.closest('#hbell')) el.hidden = true;
  });
  window.addEventListener('hashchange', () => { el.hidden = true; });
  return el;
}

function dessiner() {
  const el = panneau();
  const n = nonLus().length;
  el.innerHTML =
    `<div class="alertes-tete"><b>Notifications</b>${n ? '<button type="button" id="alertes-tout">Tout marquer comme lu</button>' : ''}</div>` +
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
  offs = []; par = new Map(); premiers = new Set(); connus = null; items = []; lus = [];
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
  const src = sources(u.uid, p.role, p.statut);
  nbSources = src.length;
  src.forEach((s, i) => {
    offs.push(onSnapshot(s.q(), (snap) => {
      par.set(i, snap.docs.map((d) => s.map(d.id, d.data())).filter(Boolean));
      premiers.add(i);
      items = [...par.values()].flat().sort((a, b) => b.at - a.at);
      if (premiers.size >= nbSources) {
        if (connus === null) connus = new Set(items.map((a) => a.id));
        else {
          for (const a of items) {
            if (!connus.has(a.id)) {
              connus.add(a.id);
              if (!lus.includes(a.id)) { sonner(); toast(a.title, 'info'); }
            }
          }
        }
      }
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
      dessiner();
      el.hidden = !el.hidden;
    });
  }
  majUI();
}
