import './lib/pwa.js';
import './lib/splash.js';
import { brancherCloche } from './lib/alertes.js';
import './styles/main.css';
import './styles/admin.css';
import './styles/photos.css';
import './styles/menu.css';
import { APP, LIENS } from './config/constants.js';
import { urlOk, miniature, MAX_GALERIE } from './lib/photos.js';
import photos from './pages/photos.js';
import guide from './pages/guide.js';
import mdp from './pages/mdp.js';
import { configOk } from './config/firebase.js';
import { state, initAuth, onState, logout } from './lib/auth.js';
import { esc, nomHtml, toast } from './lib/ui.js';
import { ico } from './lib/icons.js';
import { chargerTarifs } from './lib/dbadmin.js';

import home from './pages/home.js';
import connexion from './pages/connexion.js';
import inscription from './pages/inscription.js';
import commander from './pages/commander.js';
import commandes from './pages/commandes.js';
import demandes from './pages/demandes.js';
import missions from './pages/missions.js';
import profil from './pages/profil.js';
import admin from './pages/admin.js';
import apropos from './pages/apropos.js';
import {
  pageCommandes, pageDemandes, pageLaveurs, pageClients, pageTarifs, pageAvis, pageFinances
} from './pages/adminpages.js';

const ROUTES = {
  '/':               { page: home },
  '/connexion':      { page: connexion },
  '/inscription':    { page: inscription },
  '/commander':      { page: commander, roles: ['client'] },
  '/commandes':      { page: commandes, roles: ['client'] },
  '/demandes':       { page: demandes,  roles: ['laveur'] },
  '/missions':       { page: missions,  roles: ['laveur'] },
  '/profil':         { page: profil,    roles: ['client', 'laveur', 'admin'] },
  '/photos':         { page: photos,    roles: ['client', 'laveur', 'admin'] },
  '/guide':          { page: guide },
  '/mdp':            { page: mdp },
  '/admin':          { page: admin,         roles: ['admin'] },
  '/admin/commandes':{ page: pageCommandes, roles: ['admin'] },
  '/admin/demandes': { page: pageDemandes,  roles: ['admin'] },
  '/admin/laveurs':  { page: pageLaveurs,   roles: ['admin'] },
  '/admin/clients':  { page: pageClients,   roles: ['admin'] },
  '/admin/tarifs':   { page: pageTarifs,    roles: ['admin'] },
  '/admin/avis':     { page: pageAvis,      roles: ['admin'] },
  '/admin/finances': { page: pageFinances,  roles: ['admin'] },
  '/a-propos':       { page: apropos }
};

// [chemin, libelle, icone, bouton central sureleve]
const NAV = {
  visiteur: [['/', 'Accueil', 'home'], ['/connexion', 'Connexion', 'login'], ['/inscription', 'Inscription', 'userPlus'], ['/a-propos', 'Contact', 'info']],
  client:   [['/', 'Accueil', 'home'], ['/commandes', 'Commandes', 'list'], ['/commander', 'Commander', 'plus', true], ['/profil', 'Profil', 'user'], ['/a-propos', 'Contact', 'info']],
  laveur:   [['/', 'Accueil', 'home'], ['/missions', 'Missions', 'briefcase'], ['/demandes', 'Demandes', 'inbox', true], ['/profil', 'Profil', 'user'], ['/a-propos', 'Contact', 'info']],
  admin:    [['/', 'Accueil', 'home'], ['/profil', 'Profil', 'user'], ['/admin', 'Admin', 'shield'], ['/a-propos', 'Contact', 'info']]
};

// Menu lateral de l'admin : [chemin, libelle, icone]
const ADMIN_MENU = [
  ['/admin', 'Tableau de bord', 'shield'],
  ['/admin/commandes', 'Commandes', 'list'],
  ['/admin/demandes', 'Demandes laveurs', 'inbox'],
  ['/admin/laveurs', 'Laveurs', 'briefcase'],
  ['/admin/clients', 'Particuliers', 'user'],
  ['/admin/tarifs', 'Tarifs', 'list'],
  ['/admin/avis', 'Notes et avis', 'info'],
  ['/admin/finances', 'Finances', 'briefcase'],
  ['/photos', 'Mes photos', 'user'],
  ['/guide', 'Guide du laveur', 'info'],
  ['/mdp', 'Mon mot de passe', 'user']
];

// Menu lateral par profil : [chemin, libelle, icone]
const MENU = {
  visiteur: [['/', 'Accueil', 'home'], ['/connexion', 'Se connecter', 'login'], ['/inscription', 'Créer un compte', 'userPlus'], ['/guide', 'Guide du laveur', 'info'], ['/a-propos', 'Contact', 'info']],
  client: [['/', 'Accueil', 'home'], ['/commander', 'Nouvelle demande', 'plus'], ['/commandes', 'Mes commandes', 'list'], ['/profil', 'Mon profil', 'user'], ['/photos', 'Mes photos', 'user'], ['/mdp', 'Mon mot de passe', 'user'], ['/a-propos', 'Contact', 'info']],
  laveur: [['/', 'Accueil', 'home'], ['/demandes', 'Demandes', 'inbox'], ['/missions', 'Mes missions', 'briefcase'], ['/profil', 'Mon profil', 'user'], ['/photos', 'Mes photos', 'user'], ['/guide', 'Guide du laveur', 'info'], ['/mdp', 'Mon mot de passe', 'user'], ['/a-propos', 'Contact', 'info']],
  admin: ADMIN_MENU
};

const BURGER = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';

const LOUPE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/></svg>';
const CLOCHE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>';

const app = document.getElementById('app');
let cleanup = null;
let renderId = 0;

const chemin = () => (location.hash.replace(/^#/, '') || '/').split('?')[0];
export const aller = (p) => { location.hash = '#' + p; };

async function deconnexion() {
  if (!confirm('Se déconnecter ?')) return;
  await logout();
  aller('/');
}

function coque() {
  document.body.classList.remove('menu-open');
  const role = state.user ? (state.profile?.role || 'client') : 'visiteur';
  const estAdmin = role === 'admin';
  const actif = chemin();
  const liens = (NAV[role] || NAV.visiteur).map(([p, t, i, centre]) => {
    const on = p === actif || (p === '/admin' && actif.startsWith('/admin'));
    return `<a href="#${p}" class="${on ? 'on' : ''}${centre ? ' cta' : ''}"${on ? ' aria-current="page"' : ''}>
       <span class="ico-wrap">${ico(i, centre ? 28 : 24)}</span><span class="lbl">${t}</span></a>`;
  }).join('');

  const initiale = state.profile ? esc((state.profile.nom || '?').trim().charAt(0).toUpperCase()) : '';
  const photoHeader = state.profile && urlOk(state.profile.photoUrl) ? miniature(state.profile.photoUrl, 96) : '';
  const actions = state.user
    ? `<button class="hbtn" id="hsearch" type="button" aria-label="Rechercher">${LOUPE}</button>
       <button class="hbtn" id="hbell" type="button" aria-label="Notifications">${CLOCHE}<span class="dot" id="hdot" hidden></span></button>
       <span class="avwrap"><a href="#/profil" class="hbtn avatar ${actif === '/profil' ? 'on' : ''}" aria-label="Mon profil">${photoHeader ? `<img src="${esc(photoHeader)}" alt="">` : (initiale || ico('user', 22))}</a><i class="pres" title="Connecté" aria-label="Connecté"></i></span>
       <button class="hbtn" id="hout" type="button" aria-label="Se déconnecter">${ico('logout', 22)}</button>`
    : `<button class="hbtn" id="hsearch" type="button" aria-label="Rechercher">${LOUPE}</button>
       <button class="hbtn" id="hbellv" type="button" aria-label="Notifications">${CLOCHE}</button>
       <a href="#/connexion" class="hbtn avatar ${actif === '/connexion' ? 'on' : ''}" aria-label="Se connecter">${ico('user', 22)}</a>`;

  const entrees = MENU[role] || MENU.visiteur;
  const burger = `<button class="hbtn burger" id="hmenu" type="button" aria-label="Ouvrir le menu" aria-expanded="false">${BURGER}</button>`;
  const tiroir = `<div class="scrim" id="scrim"></div>
       <aside class="drawer" id="drawer" aria-label="Menu">
         <div class="dhead">${estAdmin ? 'Administration' : 'Menu'}</div>
         <nav>${entrees.map(([p, t, i]) =>
           `<a href="#${p}" class="${p === actif ? 'on' : ''}">${ico(i, 26)}<span>${t}</span></a>`).join('')}</nav>
         <button class="dinstall" type="button" data-lav-install>📲 Installer l'application</button>
         ${state.user ? '<button class="dlogout" id="dout" type="button">Se déconnecter</button>' : ''}
       </aside>`;

  app.innerHTML = `
    <header class="top has-menu">
      <div class="hleft">${burger}<a href="#/" class="brand"><img src="./icons/logo.svg" alt="" width="36" height="36">${nomHtml()}</a></div>
      <div class="hactions">${actions}</div>
    </header>
    <div class="flag" aria-hidden="true"><i></i><i></i><i></i></div>
    ${configOk ? '' : '<div class="alert">Configuration Firebase manquante : renseigne src/config/firebase.js.</div>'}
    <main id="view" tabindex="-1"></main>
    <nav class="tabs" aria-label="Navigation principale">${liens}</nav>
    ${tiroir}`;

  const out = document.getElementById('hout');
  if (out) out.addEventListener('click', deconnexion);

  // Loupe : l'admin cherche dans les commandes ; les autres rôles auront leur recherche plus tard.
  const loupe = document.getElementById('hsearch');
  if (loupe) loupe.addEventListener('click', () => {
    if (estAdmin) {
      if (chemin() !== '/admin/commandes') aller('/admin/commandes');
      setTimeout(() => { const q = document.getElementById('q'); if (q) q.focus(); }, 400);
    } else toast('La recherche arrive bientôt.', 'info');
  });
  brancherCloche(state);
  const clocheV = document.getElementById('hbellv');
  if (clocheV) clocheV.addEventListener('click', () => { toast('Connecte-toi pour voir tes notifications.', 'info'); aller('/connexion'); });

  {
    const menu = document.getElementById('hmenu');
    const basculer = (ouvert) => {
      document.body.classList.toggle('menu-open', ouvert);
      menu.setAttribute('aria-expanded', String(ouvert));
    };
    menu.addEventListener('click', () => basculer(!document.body.classList.contains('menu-open')));
    document.getElementById('scrim').addEventListener('click', () => basculer(false));
    document.getElementById('drawer').querySelectorAll('nav a').forEach((a) =>
      a.addEventListener('click', () => basculer(false)));
    const dout = document.getElementById('dout');
    if (dout) dout.addEventListener('click', () => { basculer(false); deconnexion(); });
  }
  return document.getElementById('view');
}

async function rendre() {
  const id = ++renderId;
  if (cleanup) { try { cleanup(); } catch (e) { /* ignore */ } cleanup = null; }
  if (!state.ready) { app.innerHTML = '<div class="boot"><img src="./icons/logo.svg" alt="" width="84" height="84"><p>Chargement…</p></div>'; return; }

  const route = ROUTES[chemin()] || ROUTES['/'];
  if (route.roles) {
    if (!state.user) return aller('/connexion');
    if (!route.roles.includes(state.profile?.role)) return aller('/');
  }
  const view = coque();
  const retour = await route.page(view, { state, aller, logout });
  if (id !== renderId) { if (typeof retour === 'function') retour(); return; }
  if (typeof retour === 'function') cleanup = retour;

  // Carte « Mes photos » en haut du profil.
  if (chemin() === '/profil' && state.profile) {
    const p = state.profile;
    const n = Array.isArray(p.galerie) ? p.galerie.length : 0;
    const mini = urlOk(p.photoUrl)
      ? `<img class="mini" src="${esc(miniature(p.photoUrl, 120))}" alt="">`
      : `<span class="mini">${esc((p.nom || '?').trim().charAt(0).toUpperCase())}</span>`;
    view.insertAdjacentHTML('afterbegin', `
      <section class="card photocarte">${mini}
        <div class="txt"><b>Mes photos</b><span class="muted">Profil et galerie (${n}/${MAX_GALERIE})</span></div>
        <a class="btn primary small" href="#/photos">Gérer</a>
      </section>
      <section class="card photocarte">
        <span class="mini">?</span>
        <div class="txt"><b>Guide du laveur</b><span class="muted">Profil, photos, lien WhatsApp</span></div>
        <a class="btn ghost small" href="#/guide">Lire</a>
      </section>
      <section class="card photocarte">
        <span class="mini">•••</span>
        <div class="txt"><b>Sécurité</b><span class="muted">Changer mon mot de passe</span></div>
        <a class="btn ghost small" href="#/mdp">Changer</a>
      </section>`);
  }

  // Lien « Mot de passe oublié ? » sous le formulaire de connexion.
  if (chemin() === '/connexion' && !state.user) {
    const form = view.querySelector('form');
    const lien = '<p class="oubli"><a href="#/mdp">Mot de passe oublié ?</a></p>';
    if (form) form.insertAdjacentHTML('afterend', lien);
    else view.insertAdjacentHTML('beforeend', lien);
  }

  // Liens officiels sur la page À propos.
  if (chemin() === '/a-propos') {
    const liens = [
      LIENS.github && `<a class="btn ghost" href="${esc(LIENS.github)}" target="_blank" rel="noopener">Code officiel sur GitHub</a>`,
      LIENS.site && `<a class="btn ghost" href="${esc(LIENS.site)}" target="_blank" rel="noopener">Site officiel</a>`,
      `<a class="btn ghost" href="#/guide">Guide du laveur</a>`,
      `<a class="btn ghost" href="./guide-creer-son-site.pdf" download>Guide gratuit : créer son site (PDF)</a>`,
      `<a class="btn ghost" href="mailto:${esc(APP.email)}">${esc(APP.email)}</a>`,
      `<a class="btn ghost" href="tel:${esc(APP.telephoneLien)}">${esc(APP.telephone)}</a>`
    ].filter(Boolean).join('');
    view.insertAdjacentHTML('beforeend', `<section class="card liens"><h2>Liens officiels</h2>${liens}</section>`);
  }
  window.scrollTo(0, 0);
  if (chemin() === '/') centrerLaveurs();
}

// Accueil : amène le titre « Nos laveurs » au milieu de l'écran (s'arrête dès que l'utilisateur touche l'écran).
function centrerLaveurs() {
  let stop = false, essais = 0;
  const arret = () => { stop = true; };
  window.addEventListener('touchstart', arret, { once: true, passive: true });
  window.addEventListener('wheel', arret, { once: true, passive: true });
  const go = () => {
    if (stop) return;
    const t = document.querySelector('#annuaire .card-head h2');
    if (!t) return;
    t.scrollIntoView({ behavior: 'auto', block: 'center' });
    if (++essais < 4) setTimeout(go, 400);
  };
  setTimeout(go, 150);
}

window.addEventListener('hashchange', rendre);
onState(rendre);

// Les tarifs modifies par l'admin sont charges avant l'affichage (3 s maximum d'attente).
const tarifsPrets = Promise.race([chargerTarifs().catch(() => {}), new Promise((r) => setTimeout(r, 3000))]);
tarifsPrets.then(() => initAuth()).catch((e) => { console.error(e); state.ready = true; rendre(); });

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
