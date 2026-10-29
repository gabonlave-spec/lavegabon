import { inscrire } from '../lib/auth.js';
import { QUARTIERS } from '../config/constants.js';
import { toast, messageErreur, champMdp, brancherMdp } from '../lib/ui.js';

export default function inscription(el, { state, aller }) {
  if (state.user) return aller('/');
  const opts = QUARTIERS.map((q) => `<option>${q}</option>`).join('');
  el.innerHTML = `
    <section class="card narrow">
      <h1>Créer un compte</h1>
      <form id="f" class="form">
        <fieldset class="choix">
          <legend>Je suis</legend>
          <label><input type="radio" name="role" value="client" checked> Client<small>Je veux faire laver</small></label>
          <label><input type="radio" name="role" value="laveur"> Laveur<small>Je veux laver pour les autres</small></label>
        </fieldset>
        <label>Nom complet<input name="nom" required autocomplete="name"></label>
        <label>Téléphone<input name="telephone" type="tel" placeholder="+241 …" required autocomplete="tel"></label>
        <label>Quartier<select name="quartier" required><option value="">Choisir…</option>${opts}</select></label>
        <div id="extra" hidden>
          <label>Sexe<select name="sexe"><option value="">Choisir…</option><option>Femme</option><option>Homme</option></select></label>
          <label>Âge<input name="age" type="number" min="18" max="80" placeholder="18 ans minimum"></label>
        </div>
        <label>Adresse e-mail<input name="email" type="email" required autocomplete="email"></label>
        ${champMdp({ autocomplete: 'new-password' })}
        <button class="btn primary" type="submit">Créer mon compte</button>
      </form>
      <p class="muted">Déjà inscrit ? <a href="#/connexion">Se connecter</a></p>
    </section>`;

  brancherMdp(el);
  const form = el.querySelector('#f');
  const extra = el.querySelector('#extra');
  form.addEventListener('change', () => {
    const laveur = form.role.value === 'laveur';
    extra.hidden = !laveur;
    form.sexe.required = laveur; form.age.required = laveur;
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const b = form.querySelector('button[type=submit]'); b.disabled = true; b.textContent = 'Création…';
    try {
      await inscrire({ ...d, email: d.email.trim(), nom: d.nom.trim() });
      toast(d.role === 'laveur' ? 'Compte créé. Il sera validé par notre équipe.' : 'Compte créé. Bienvenue !', 'ok');
      aller(d.role === 'laveur' ? '/profil' : '/commander');
    } catch (err) { toast(messageErreur(err), 'error'); b.disabled = false; b.textContent = 'Créer mon compte'; }
  });
}
