import { demanderLaveur } from './db.js';
import { rafraichirProfil } from './auth.js';
import { toast, messageErreur } from './ui.js';

// Bloc "Devenir laveur" pour un client deja connecte.
export function blocDevenirLaveur(p) {
  if (!p || p.role !== 'client') return '';
  if (p.demandeLaveur) {
    return `<section class="card">
      <h2>Devenir laveur</h2>
      <p><span class="badge wait">Demande envoyée</span></p>
      <p class="muted">Notre équipe valide ta demande rapidement. Dès validation, ton compte passera en laveur : tu verras les demandes de ton quartier.</p>
    </section>`;
  }
  return `<section class="card">
    <h2>Vous voulez laver pour les autres ?</h2>
    <p>Choisissez vos services, vos tarifs et vos quartiers, et gagnez de l'argent près de chez vous.</p>
    <button class="btn ghost" id="devenir" type="button">Devenir laveur</button>
  </section>`;
}

export function brancherDevenirLaveur(el, state) {
  const b = el.querySelector('#devenir');
  if (!b) return;
  b.addEventListener('click', async () => {
    if (!confirm('Envoyer ma demande pour devenir laveur ?')) return;
    b.disabled = true;
    try {
      await demanderLaveur(state.user.uid);
      toast('Demande envoyée. Notre équipe la valide rapidement.', 'ok');
      await rafraichirProfil();
    } catch (e) { toast(messageErreur(e), 'error'); b.disabled = false; }
  });
}
