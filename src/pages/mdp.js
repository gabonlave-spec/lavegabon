import { auth } from '../config/firebase.js';
import {
  sendPasswordResetEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider
} from 'firebase/auth';
import { esc, toast, champMdp, brancherMdp } from '../lib/ui.js';

function messageMdp(e) {
  const code = (e && e.code) || '';
  const map = {
    'auth/invalid-credential': 'Mot de passe actuel incorrect.',
    'auth/wrong-password': 'Mot de passe actuel incorrect.',
    'auth/weak-password': 'Nouveau mot de passe trop court (6 caractères minimum).',
    'auth/too-many-requests': 'Trop d\'essais. Patiente quelques minutes puis réessaie.',
    'auth/requires-recent-login': 'Reconnecte-toi, puis réessaie.',
    'auth/invalid-email': 'Adresse e-mail invalide.',
    'auth/network-request-failed': 'Pas de connexion. Vérifie ton réseau et réessaie.'
  };
  return map[code] || 'Une erreur est survenue. Réessaie.';
}

export default async function mdp(el, { state }) {
  const connecte = !!state.user;
  const email = connecte ? (state.user.email || '') : '';

  el.innerHTML = `
    ${connecte ? `
    <section class="card">
      <h1>Changer mon mot de passe</h1>
      <form id="fch">
        ${champMdp({ label: 'Mot de passe actuel', name: 'ancien', autocomplete: 'current-password' })}
        ${champMdp({ label: 'Nouveau mot de passe (6 caractères minimum)', name: 'nouveau', autocomplete: 'new-password' })}
        ${champMdp({ label: 'Confirmer le nouveau mot de passe', name: 'confirm', autocomplete: 'new-password' })}
        <p class="error" id="ech" role="alert"></p>
        <button class="btn primary" type="submit">Enregistrer</button>
      </form>
    </section>` : ''}
    <section class="card">
      <h${connecte ? 2 : 1}>Mot de passe oublié ?</h${connecte ? 2 : 1}>
      <p class="muted">Entre ton adresse e-mail : nous t'envoyons un lien pour choisir un nouveau mot de passe. Pense à regarder dans les courriers indésirables.</p>
      <form id="fre">
        <label>Adresse e-mail
          <input name="email" type="email" autocomplete="email" required value="${esc(email)}"></label>
        <p class="error" id="ere" role="alert"></p>
        <button class="btn ${connecte ? 'ghost' : 'primary'}" type="submit">Envoyer le lien</button>
      </form>
      ${connecte ? '' : '<p class="oubli"><a href="#/connexion">Retour à la connexion</a></p>'}
    </section>`;

  brancherMdp(el);

  const fch = el.querySelector('#fch');
  if (fch) {
    fch.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = el.querySelector('#ech'); err.textContent = '';
      const u = auth.currentUser;
      if (!u || !u.email) { err.textContent = 'Reconnecte-toi, puis réessaie.'; return; }
      if (fch.nouveau.value !== fch.confirm.value) { err.textContent = 'Les deux nouveaux mots de passe sont différents.'; return; }
      if (fch.nouveau.value === fch.ancien.value) { err.textContent = 'Le nouveau mot de passe doit être différent de l\'ancien.'; return; }
      const b = fch.querySelector('button[type=submit]'); b.disabled = true;
      try {
        await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, fch.ancien.value));
        await updatePassword(u, fch.nouveau.value);
        fch.reset();
        toast('Mot de passe modifié.', 'ok');
      } catch (ex) { err.textContent = messageMdp(ex); }
      b.disabled = false;
    });
  }

  const fre = el.querySelector('#fre');
  fre.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = el.querySelector('#ere'); err.textContent = '';
    const b = fre.querySelector('button[type=submit]'); b.disabled = true;
    try {
      auth.languageCode = 'fr';
      await sendPasswordResetEmail(auth, fre.email.value.trim());
      toast('Si cette adresse existe, un e-mail vient d\'être envoyé.', 'ok');
    } catch (ex) { err.textContent = messageMdp(ex); }
    b.disabled = false;
  });
}
