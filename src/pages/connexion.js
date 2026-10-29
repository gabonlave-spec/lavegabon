import { login } from '../lib/auth.js';
import { toast, messageErreur, champMdp, brancherMdp } from '../lib/ui.js';

export default function connexion(el, { state, aller }) {
  if (state.user) return aller('/');
  el.innerHTML = `
    <section class="card narrow">
      <h1>Connexion</h1>
      <form id="f" class="form">
        <label>Adresse e-mail<input name="email" type="email" autocomplete="email" required></label>
        ${champMdp()}
        <button class="btn primary" type="submit">Se connecter</button>
      </form>
      <p class="muted">Pas encore de compte ? <a href="#/inscription">Créer un compte</a></p>
    </section>`;
  brancherMdp(el);
  el.querySelector('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const b = e.target.querySelector('button[type=submit]'); b.disabled = true; b.textContent = 'Connexion…';
    const d = new FormData(e.target);
    try { await login(d.get('email').trim(), d.get('mdp')); aller('/'); }
    catch (err) { toast(messageErreur(err), 'error'); b.disabled = false; b.textContent = 'Se connecter'; }
  });
}
