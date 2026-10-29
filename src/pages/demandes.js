import { ecouterDemandesOuvertes, changerStatut, lireLaveur, filtrerPourLaveur } from '../lib/db.js';
import { esc, fcfa, fmtDate, toast, messageErreur } from '../lib/ui.js';
import { lienCarte } from '../lib/geo.js';

export default async function demandes(el, { state }) {
  const p = state.profile;
  if (p.statut !== 'actif') {
    el.innerHTML = `<section class="card"><h1>Demandes</h1>
      <p>Ton compte est <b>${p.statut === 'suspendu' ? 'suspendu' : 'en attente de validation'}</b>. Complète ton profil : notre équipe te valide rapidement.</p>
      <a class="btn primary" href="#/profil">Compléter mon profil</a></section>`;
    return;
  }
  const profilLaveur = (await lireLaveur(state.user.uid)) || {};

  el.innerHTML = '<section class="card"><h1>Demandes près de toi</h1><div id="liste"><p class="muted">Chargement…</p></div></section>';
  const liste = el.querySelector('#liste');

  const unsub = ecouterDemandesOuvertes((items) => {
    const vues = filtrerPourLaveur(items, profilLaveur);
    if (!vues.length) { liste.innerHTML = '<p class="muted">Aucune demande dans tes quartiers pour le moment.</p>'; return; }
    liste.innerHTML = vues.map((c) => `
      <article class="item">
        <header><h3>${esc(c.serviceLabel)}</h3><b>${fcfa(c.total)}</b></header>
        <p>${c.quantite} ${esc(c.unite)}${c.urgent ? ' · <span class="badge wait">Urgent</span>' : ''}</p>
        <p class="muted">${fmtDate(c.date, c.heure)} · ${esc(c.quartier)}</p>
        <p>${esc(c.adresse)}</p>
        ${c.position ? `<p><a target="_blank" rel="noopener" href="${lienCarte(Number(c.position.lat), Number(c.position.lng))}">Voir sur la carte</a></p>` : ''}
        ${c.details ? `<p class="muted">${esc(c.details)}</p>` : ''}
        <button class="btn primary small" data-accepter="${esc(c.id)}">Accepter</button>
      </article>`).join('');
  }, (e) => { liste.innerHTML = `<p class="error">${messageErreur(e)}</p>`; });

  liste.addEventListener('click', async (e) => {
    const id = e.target.dataset?.accepter;
    if (!id) return;
    e.target.disabled = true;
    try {
      await changerStatut(id, { statut: 'acceptee', laveurId: state.user.uid, laveurNom: p.nom });
      toast('Demande acceptée. Retrouve-la dans Missions.', 'ok');
    } catch (err) { toast(messageErreur(err), 'error'); e.target.disabled = false; }
  });
  return unsub;
}
