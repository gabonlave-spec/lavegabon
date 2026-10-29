import '../styles/tuiles.css';

const I = {
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  login: '<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M14 4h6v16h-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 13h18"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7M12 17v.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>'
};
const svg = (n) => `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
const lien = (txt, ic, href, cl = '') => `<a class="big-tile ${cl}" href="${href}"><span class="bt-ic">${svg(ic)}</span>${txt}</a>`;
const defil = (txt, ic, id, cl = '') => `<button type="button" class="big-tile ${cl}" data-scroll="${id}"><span class="bt-ic">${svg(ic)}</span>${txt}</button>`;

export function tuilesAccueil(role) {
  let t;
  if (role === 'client') t = [lien('Nouvelle demande', 'plus', '#/commander', 'main wide'), lien('Mes commandes', 'list', '#/commandes'), defil('Trouver un laveur', 'search', 'annuaire'), lien('Mon profil', 'user', '#/profil'), defil('Comment ça marche', 'help', 'comment')];
  else if (role === 'laveur') t = [lien('Voir les demandes', 'list', '#/demandes', 'main wide'), lien('Mes missions', 'briefcase', '#/missions'), lien('Mon profil', 'user', '#/profil'), lien('Guide du laveur', 'book', '#/guide'), lien('Contact', 'info', '#/a-propos')];
  else if (role === 'admin') t = [lien('Espace admin', 'shield', '#/admin', 'main wide'), lien('Mon profil', 'user', '#/profil'), defil('Nos laveurs', 'search', 'annuaire')];
  else t = [lien('Créer un compte', 'plus', '#/inscription', 'main wide'), lien('Se connecter', 'login', '#/connexion'), defil('Trouver un laveur', 'search', 'annuaire'), defil('Comment ça marche', 'help', 'comment'), lien('Contact', 'info', '#/a-propos')];
  return `<nav class="big-tiles" aria-label="Menu principal">${t.join('')}</nav>`;
}

export function brancherTuiles(el) {
  el.querySelectorAll('[data-scroll]').forEach((b) => b.addEventListener('click', () => {
    const c = el.querySelector('#' + b.dataset.scroll);
    if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
}
