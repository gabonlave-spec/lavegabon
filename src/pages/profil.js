import { SERVICES, QUARTIERS } from '../config/constants.js';
import { lireLaveur, sauverLaveur } from '../lib/db.js';
import { esc, toast, messageErreur } from '../lib/ui.js';
import { rafraichirProfil } from '../lib/auth.js';
import { blocDevenirLaveur, brancherDevenirLaveur } from '../lib/devenir.js';
import { brancherAlertes } from '../lib/push.js';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const LIBELLE_STATUT = { actif: 'Actif', en_attente: 'En attente de validation', suspendu: 'Suspendu' };

export default async function profil(el, { state, logout, aller }) {
  const p = state.profile;
  if (p.demandeLaveur || p.statut === 'en_attente') rafraichirProfil().catch(() => {});
  let blocLaveur = '';
  let lav = {};
  const crayon = (c) => `<button type="button" class="edit" data-champ="${c}" aria-label="Modifier">✏️</button>`;

  if (p.role === 'laveur') {
    lav = (await lireLaveur(state.user.uid)) || {};
    const services = SERVICES.map((s) => {
      const coche = (lav.services || []).includes(s.id);
      const prix = s.unites.map((u) => `
        <label class="mini">${u}
          <input type="number" min="0" step="50" name="prix_${s.id}_${u}" value="${esc(lav.tarifs?.[s.id]?.[u] ?? s.prixRef[u])}">
        </label>`).join('');
      return `<div class="svc"><label class="check"><input type="checkbox" name="svc" value="${s.id}" ${coche ? 'checked' : ''}> ${s.label}</label><div class="row">${prix}</div></div>`;
    }).join('');
    const quartiers = QUARTIERS.filter((q) => q !== 'Autre').map((q) =>
      `<label class="chip"><input type="checkbox" name="qrt" value="${q}" ${(lav.quartiers || []).includes(q) ? 'checked' : ''}><span>${q}</span></label>`).join('');
    blocLaveur = `
      <section class="card">
        <h2>Mon activité de laveur</h2>
        <form id="lf" class="form">
          <h3>Services et tarifs (FCFA)</h3>${services}
          <h3>Quartiers couverts</h3><div class="chips">${quartiers}</div>
          <label>Disponibilités<input name="dispo" value="${esc(lav.disponibilites || '')}" placeholder="Ex. lundi au samedi, 8h à 18h"></label>
          <label>Présentation<textarea name="bio" rows="3" placeholder="Expérience, matériel, machine à laver…">${esc(lav.bio || '')}</textarea></label>
          <button class="btn primary" type="submit">Enregistrer mon activité</button>
        </form>
      </section>`;
  }

  el.innerHTML = `
    <section class="card">
      <h1>Mon profil</h1>
      <dl class="info">
        <dt>Nom</dt><dd><span class="v">${esc(p.nom)}</span>${crayon('nom')}</dd>
        <dt>Téléphone</dt><dd><span class="v">${esc(p.telephone)}</span>${crayon('telephone')}</dd>
        <dt>E-mail</dt><dd>${esc(p.email)}</dd>
        <dt>Quartier</dt><dd><span class="v">${esc(p.quartier || '')}</span>${crayon('quartier')}</dd>
        <dt>Compte</dt><dd>${{ client: 'Particulier', laveur: 'Laveur', admin: 'Administrateur' }[p.role] || p.role}</dd>
        <dt>Statut</dt><dd><span class="pres-in"></span>Connecté · ${LIBELLE_STATUT[p.statut] || 'Actif'}</dd>
      </dl>
      <div class="actions">
        <a class="btn ghost" href="#/a-propos">Contact du studio</a>
        <button class="btn ghost" id="out">Se déconnecter</button>
      </div>
    </section><section class="card" id="alertes" hidden></section>${blocDevenirLaveur(p)}${blocLaveur}`;
  brancherDevenirLaveur(el, state);
  brancherAlertes(el.querySelector('#alertes'), state.user.uid);

  el.querySelector('#out').addEventListener('click', async () => { await logout(); aller('/'); });

  const dl = el.querySelector('dl.info');
  dl.addEventListener('click', (e) => {
    const b = e.target.closest('.edit');
    const ann = e.target.closest('.ann');
    if (ann) { const dd = ann.closest('dd'); dd.innerHTML = dd.dataset.old; return; }
    if (!b) return;
    const champ = b.dataset.champ, dd = b.closest('dd'), val = p[champ] || '';
    dd.dataset.old = dd.innerHTML;
    const saisie = champ === 'quartier'
      ? `<select name="v">${(val && !QUARTIERS.includes(val) ? [val] : []).concat(QUARTIERS).map((q) => `<option ${q === val ? 'selected' : ''}>${esc(q)}</option>`).join('')}</select>`
      : `<input name="v" type="${champ === 'telephone' ? 'tel' : 'text'}" maxlength="${champ === 'nom' ? 60 : 20}" value="${esc(val)}" required>`;
    dd.innerHTML = `<form class="ed" data-champ="${champ}">${saisie}<button class="btn primary small" type="submit">OK</button><button class="btn ghost small ann" type="button">Annuler</button></form>`;
    dd.querySelector('[name=v]').focus();
  });
  dl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target, champ = f.dataset.champ, dd = f.closest('dd');
    const v = f.elements.v.value.trim();
    if (champ === 'nom' && v.length < 2) return toast('Nom trop court.', 'error');
    if (champ === 'telephone' && !/^\+?[0-9 ]{8,16}$/.test(v)) return toast('Numéro invalide.', 'error');
    if (champ === 'quartier' && !v) return toast('Choisissez un quartier.', 'error');
    try {
      await updateDoc(doc(db, 'users', state.user.uid), { [champ]: v, updatedAt: serverTimestamp() });
      if (p.role === 'laveur' && champ !== 'telephone') {
        await setDoc(doc(db, 'laveurs', state.user.uid), { [champ === 'nom' ? 'nom' : 'quartierPrincipal']: v }, { merge: true }).catch(() => {});
      }
      p[champ] = v;
      dd.innerHTML = `<span class="v">${esc(v)}</span>${crayon(champ)}`;
      toast('Profil mis à jour.', 'ok');
    } catch (err) { toast(messageErreur(err), 'error'); }
  });

  const lf = el.querySelector('#lf');
  if (lf) lf.addEventListener('submit', async (e) => {
    e.preventDefault();
    const services = [...lf.querySelectorAll('input[name=svc]:checked')].map((i) => i.value);
    const quartiers = [...lf.querySelectorAll('input[name=qrt]:checked')].map((i) => i.value);
    const tarifs = {};
    SERVICES.forEach((s) => s.unites.forEach((u) => {
      const v = Number(lf.elements[`prix_${s.id}_${u}`].value);
      if (v > 0) { tarifs[s.id] = tarifs[s.id] || {}; tarifs[s.id][u] = v; }
    }));
    try {
      await sauverLaveur(state.user.uid, {
        nom: p.nom, sexe: p.sexe || null, age: p.age || null, quartierPrincipal: p.quartier || null,
        services, quartiers, tarifs, disponibilites: lf.dispo.value.trim(), bio: lf.bio.value.trim()
      });
      toast('Activité enregistrée.', 'ok');
    } catch (err) { toast(messageErreur(err), 'error'); }
  });
}
