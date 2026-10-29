import { ecouterMissions, changerStatut, lireContact } from '../lib/db.js';
import { STATUTS } from '../config/constants.js';
import { esc, fcfa, fmtDate, badge, toast, messageErreur } from '../lib/ui.js';
import { lienCarte } from '../lib/geo.js';

export default function missions(el, { state }) {
  el.innerHTML = '<section class="card"><h1>Mes missions</h1><div id="gains"></div><div id="liste"><p class="muted">Chargement…</p></div></section>';
  const liste = el.querySelector('#liste');

  const unsub = ecouterMissions(state.user.uid, (items) => {
    const gagne = items.filter((c) => c.statut === 'terminee').reduce((s, c) => s + (c.total || 0), 0);
    el.querySelector('#gains').innerHTML = `<p class="gain">Gains cumulés : <b>${fcfa(gagne)}</b></p>`;
    if (!items.length) { liste.innerHTML = '<p class="muted">Aucune mission pour le moment.</p>'; return; }
    liste.innerHTML = items.map((c) => `
      <article class="item">
        <header><h3>${esc(c.serviceLabel)}</h3>${badge(c.statut, STATUTS)}</header>
        <p>${c.quantite} ${esc(c.unite)} · <b>${fcfa(c.total)}</b></p>
        <p class="muted">${fmtDate(c.date, c.heure)} · ${esc(c.quartier)}</p>
        <p>${esc(c.clientNom)} — ${esc(c.adresse)}</p>
        ${c.position ? `<p><a target="_blank" rel="noopener" href="${lienCarte(c.position.lat, c.position.lng)}">Voir sur la carte</a></p>` : ''}
        <p class="tel" id="tel-${c.id}"></p>
        <div class="actions">
          <button class="btn ghost small" data-contact="${c.id}">Voir le contact</button>
          ${c.statut === 'acceptee' ? `<button class="btn primary small" data-etat="en_cours" data-id="${c.id}">Démarrer</button>` : ''}
          ${c.statut === 'en_cours' ? `<button class="btn primary small" data-etat="terminee" data-id="${c.id}">Terminer</button>` : ''}
        </div>
      </article>`).join('');
  }, (e) => { liste.innerHTML = `<p class="error">${messageErreur(e)}</p>`; });

  liste.addEventListener('click', async (e) => {
    const t = e.target;
    try {
      if (t.dataset.contact) {
        const c = await lireContact(t.dataset.contact);
        el.querySelector(`#tel-${t.dataset.contact}`).innerHTML = c
          ? `<a href="tel:${esc(c.clientTel)}">${esc(c.clientTel)}</a>` : 'Contact indisponible';
      } else if (t.dataset.etat) {
        t.disabled = true;
        await changerStatut(t.dataset.id, { statut: t.dataset.etat });
        toast(t.dataset.etat === 'terminee' ? 'Mission terminée.' : 'Mission démarrée.', 'ok');
      }
    } catch (err) { toast(messageErreur(err), 'error'); if (t.dataset.etat) t.disabled = false; }
  });
  return unsub;
}
