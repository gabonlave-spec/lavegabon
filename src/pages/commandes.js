import { ecouterCommandesClient, changerStatut } from '../lib/db.js';
import { STATUTS } from '../config/constants.js';
import { esc, fcfa, fmtDate, badge, toast, messageErreur } from '../lib/ui.js';

export default function commandes(el, { state }) {
  el.innerHTML = '<section class="card"><h1>Mes commandes</h1><div id="liste"><p class="muted">Chargement…</p></div></section>';
  const liste = el.querySelector('#liste');

  const unsub = ecouterCommandesClient(state.user.uid, (items) => {
    if (!items.length) {
      liste.innerHTML = '<p class="muted">Aucune commande pour le moment.</p><a class="btn primary" href="#/commander">Faire ma première demande</a>';
      return;
    }
    liste.innerHTML = items.map((c) => `
      <article class="item">
        <header><h3>${esc(c.serviceLabel)}</h3>${badge(c.statut, STATUTS)}</header>
        <p>${c.quantite} ${esc(c.unite)} · <b>${fcfa(c.total)}</b></p>
        <p class="muted">${fmtDate(c.date, c.heure)} · ${esc(c.quartier)}</p>
        ${c.laveurNom ? `<p>Laveur : <b>${esc(c.laveurNom)}</b></p>` : '<p class="muted">En attente d\'un laveur</p>'}
        ${c.statut === 'en_attente' ? `<button class="btn ghost small" data-annuler="${c.id}">Annuler</button>` : ''}
      </article>`).join('');
  }, (e) => { liste.innerHTML = `<p class="error">${messageErreur(e)}</p>`; });

  liste.addEventListener('click', async (e) => {
    const id = e.target.dataset?.annuler;
    if (!id || !confirm('Annuler cette demande ?')) return;
    try { await changerStatut(id, { statut: 'annulee' }); toast('Demande annulée.', 'ok'); }
    catch (err) { toast(messageErreur(err), 'error'); }
  });
  return unsub;
}
