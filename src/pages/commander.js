import { SERVICES, QUARTIERS, serviceParId, SUPPLEMENT_URGENT } from '../config/constants.js';
import { creerCommande } from '../lib/db.js';
import { prixUnitaire, calculerPrix } from '../lib/price.js';
import { positionActuelle, lienCarte } from '../lib/geo.js';
import { fcfa, toast, messageErreur } from '../lib/ui.js';

export default function commander(el, { state, aller }) {
  const p = state.profile;
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const optsService = SERVICES.map((s) => `<option value="${s.id}">${s.label}</option>`).join('');
  const optsQuartier = QUARTIERS.map((q) => `<option ${q === p.quartier ? 'selected' : ''}>${q}</option>`).join('');
  let position = null;

  el.innerHTML = `
    <section class="card">
      <h1>Nouvelle demande</h1>
      <form id="f" class="form">
        <label>Service<select name="service" required>${optsService}</select></label>
        <div class="row">
          <label>Quantité<input name="quantite" type="number" min="0.5" step="0.5" value="1" required></label>
          <label>Unité<select name="unite"></select></label>
        </div>
        <div class="row">
          <label>Date<input name="date" type="date" min="${aujourdhui}" value="${aujourdhui}" required></label>
          <label>Heure<input name="heure" type="time" value="09:00" required></label>
        </div>
        <label>Quartier<select name="quartier" required>${optsQuartier}</select></label>
        <label>Adresse ou repère<textarea name="adresse" rows="2" placeholder="Rue, immeuble, point de repère…" required></textarea></label>
        <div class="geo">
          <button class="btn ghost" type="button" id="pos">Utiliser ma position</button>
          <span id="posinfo" class="muted">Position non partagée</span>
        </div>
        <label>Détails (facultatif)<textarea name="details" rows="2" placeholder="Draps, couleurs, linge délicat…"></textarea></label>
        <label class="check"><input type="checkbox" name="urgent"> Urgent (+ ${fcfa(SUPPLEMENT_URGENT)})</label>

        <div class="recap" aria-live="polite">
          <div><span>Prix unitaire</span><b id="pu"></b></div>
          <div><span>Sous-total</span><b id="st"></b></div>
          <div id="suppl" hidden><span>Supplément urgence</span><b id="su"></b></div>
          <div class="total"><span>Total</span><b id="tt"></b></div>
        </div>
        <button class="btn primary" type="submit">Envoyer la demande</button>
      </form>
    </section>`;

  const f = el.querySelector('#f');
  const maj = () => {
    const s = serviceParId(f.service.value);
    if (!s.unites.includes(f.unite.value)) {
      f.unite.innerHTML = s.unites.map((u) => `<option>${u}</option>`).join('');
    }
    const pu = prixUnitaire(s.id, f.unite.value);
    const r = calculerPrix({ quantite: f.quantite.value, prixUnit: pu, urgent: f.urgent.checked });
    el.querySelector('#pu').textContent = `${fcfa(pu)} / ${f.unite.value}`;
    el.querySelector('#st').textContent = fcfa(r.sousTotal);
    el.querySelector('#suppl').hidden = !f.urgent.checked;
    el.querySelector('#su').textContent = fcfa(r.supplement);
    el.querySelector('#tt').textContent = fcfa(r.total);
    return { s, pu, r };
  };
  f.unite.innerHTML = serviceParId(f.service.value).unites.map((u) => `<option>${u}</option>`).join('');
  f.addEventListener('input', maj);
  f.addEventListener('change', maj);
  maj();

  el.querySelector('#pos').addEventListener('click', async () => {
    const info = el.querySelector('#posinfo');
    info.textContent = 'Recherche de la position…';
    try {
      position = await positionActuelle();
      info.innerHTML = `Position enregistrée (±${position.precision} m) · <a target="_blank" rel="noopener" href="${lienCarte(position.lat, position.lng)}">voir</a>`;
    } catch { info.textContent = "Impossible d'obtenir la position. Précise l'adresse à la place."; }
  });

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { s, pu, r } = maj();
    const b = f.querySelector('button[type=submit]'); b.disabled = true; b.textContent = 'Envoi…';
    try {
      await creerCommande({
        clientId: state.user.uid, clientNom: p.nom,
        service: s.id, serviceLabel: s.label,
        quantite: Number(f.quantite.value), unite: f.unite.value,
        prixUnitaire: pu, sousTotal: r.sousTotal, supplement: r.supplement, total: r.total,
        urgent: f.urgent.checked,
        date: f.date.value, heure: f.heure.value,
        quartier: f.quartier.value, adresse: f.adresse.value.trim(),
        position, details: f.details.value.trim()
      }, { clientId: state.user.uid, clientNom: p.nom, clientTel: p.telephone });
      toast('Demande envoyée. Un laveur va l\'accepter.', 'ok');
      aller('/commandes');
    } catch (err) { toast(messageErreur(err), 'error'); b.disabled = false; b.textContent = 'Envoyer la demande'; }
  });
}
