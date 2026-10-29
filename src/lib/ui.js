import { APP } from '../config/constants.js';
import { ico } from './icons.js';

export const esc = (v = '') =>
  String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Nom de l'application en lettres stylees : L A V
export const nomHtml = () => `<span class="lav" aria-label="${APP.nom}"><i>L</i><i>A</i><i>V</i></span>`;

// Champ mot de passe avec oeil afficher / masquer.
export const champMdp = ({ label = 'Mot de passe', name = 'mdp', autocomplete = 'current-password' } = {}) =>
  `<label>${label}<span class="pwd"><input name="${name}" type="password" autocomplete="${autocomplete}" minlength="6" required>` +
  `<button class="eye" type="button" aria-label="Afficher le mot de passe" aria-pressed="false">${ico('eye', 22)}</button></span></label>`;

export function brancherMdp(racine) {
  racine.querySelectorAll('.pwd').forEach((w) => {
    const input = w.querySelector('input');
    const b = w.querySelector('.eye');
    b.addEventListener('click', () => {
      const montre = input.type === 'password';
      input.type = montre ? 'text' : 'password';
      b.setAttribute('aria-pressed', String(montre));
      b.setAttribute('aria-label', montre ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
      b.innerHTML = ico(montre ? 'eyeOff' : 'eye', 22);
    });
  });
}

export const fcfa = (n) => `${Number(n || 0).toLocaleString('fr-FR')} ${APP.devise}`;

export function fmtDate(iso, heure) {
  if (!iso) return '';
  const [a, m, j] = iso.split('-');
  return `${j}/${m}/${a}${heure ? ' à ' + heure : ''}`;
}

export function toast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  t.setAttribute('role', 'status');
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3200);
}

export function messageErreur(e) {
  const code = (e && e.code) || '';
  const map = {
    'auth/invalid-credential': 'E-mail ou mot de passe incorrect.',
    'auth/invalid-email': 'Adresse e-mail invalide.',
    'auth/email-already-in-use': 'Cette adresse e-mail est déjà utilisée.',
    'auth/weak-password': 'Mot de passe trop court (6 caractères minimum).',
    'auth/network-request-failed': 'Pas de connexion. Vérifie ton réseau et réessaie.',
    'permission-denied': "Action refusée. Vérifie que ton compte est actif.",
    'unavailable': 'Service indisponible. Réessaie dans un instant.'
  };
  return map[code] || map[code.replace('firestore/', '')] || 'Une erreur est survenue. Réessaie.';
}

export function badge(statut, labels) {
  const s = labels[statut] || { label: statut, classe: 'wait' };
  return `<span class="badge ${s.classe}">${esc(s.label)}</span>`;
}
