import {
  listerLaveurs, changerStatutUtilisateur, compterCommandes,
  listerDemandesLaveur, approuverLaveur, refuserLaveur, changerStatut
} from '../lib/db.js';
import {
  listerCommandes, listerClients, listerAvis, sauverTarifs, lireConfig, sauverConfig
} from '../lib/dbadmin.js';
import { APP, SERVICES, STATUTS, serviceParId } from '../config/constants.js';
import { esc, toast, messageErreur, fcfa, badge, fmtDate } from '../lib/ui.js';

const chargement = '<p class="muted">Chargement…</p>';
const erreur = (e) => `<p class="error">${esc(messageErreur(e))}</p>`;
const dateTs = (t) => (t && t.seconds ? new Date(t.seconds * 1000).toLocaleDateString('fr-FR') : '');
const nomService = (id) => (serviceParId(id) ? serviceParId(id).label : id || '');
const classeStatut = (s) => (s === 'actif' ? 'ok' : s === 'suspendu' ? 'off' : 'wait');
const somme = (liste) => liste.reduce((t, c) => t + Number(c.total || 0), 0);

function csv(rows) {
  return rows.map((r) => r.map((v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
}
function telecharger(nom, texte) {
  const url = URL.createObjectURL(new Blob(['﻿' + texte], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = nom;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// ---------- Tableau de bord ----------
export async function pageTableau(el) {
  el.innerHTML = `
    <section class="card"><h1>Tableau de bord</h1><div id="stats">${chargement}</div></section>
    <section class="card"><h2>Raccourcis</h2><div class="shortcuts" id="sc"></div></section>`;
  try {
    const [st, dem, cmds] = await Promise.all([compterCommandes(), listerDemandesLaveur(), listerCommandes()]);
    const ca = somme(cmds.filter((c) => c.statut === 'terminee'));
    el.querySelector('#stats').innerHTML = `
      <div class="stats">
        <div><b>${st.total}</b><span>commandes</span></div>
        <div><b>${st.en_attente}</b><span>en attente</span></div>
        <div><b>${st.en_cours + st.acceptee}</b><span>en cours</span></div>
        <div><b>${st.terminee}</b><span>terminées</span></div>
      </div>
      <p class="ca">Chiffre d'affaires (commandes terminées) : <b>${fcfa(ca)}</b></p>`;
    el.querySelector('#sc').innerHTML = `
      <a class="btn ghost" href="#/admin/demandes">Demandes laveurs (${dem.length})</a>
      <a class="btn ghost" href="#/admin/commandes">Commandes (${st.total})</a>
      <a class="btn ghost" href="#/admin/laveurs">Laveurs</a>
      <a class="btn ghost" href="#/admin/clients">Particuliers</a>
      <a class="btn ghost" href="#/admin/tarifs">Tarifs</a>`;
  } catch (e) { el.querySelector('#stats').innerHTML = erreur(e); }
}

// ---------- Commandes ----------
export async function pageCommandes(el) {
  el.innerHTML = `
    <section class="card"><h1>Commandes</h1>
      <div class="bar">
        <select id="f" aria-label="Filtrer par statut"><option value="">Tous les statuts</option>
          ${Object.entries(STATUTS).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join('')}</select>
        <input id="q" type="search" placeholder="Quartier, service, laveur…" aria-label="Rechercher">
      </div>
      <button class="btn ghost small" id="csv" type="button">Exporter en CSV</button>
      <div id="liste">${chargement}</div>
    </section>`;
  const liste = el.querySelector('#liste');
  let tout = [];

  function afficher() {
    const f = el.querySelector('#f').value;
    const q = el.querySelector('#q').value.trim().toLowerCase();
    const items = tout.filter((c) =>
      (!f || c.statut === f) &&
      (!q || [c.quartier, nomService(c.service), c.laveurNom, c.clientNom].some((v) => String(v || '').toLowerCase().includes(q))));
    liste.innerHTML = items.length ? items.map((c) => {
      const date = typeof c.date === 'string' && c.date.includes('-') ? fmtDate(c.date, c.heure) : dateTs(c.createdAt);
      const actif = c.statut === 'en_attente' || c.statut === 'acceptee' || c.statut === 'en_cours';
      return `<article class="item">
        <header><h3>${esc(nomService(c.service))}</h3>${badge(c.statut, STATUTS)}</header>
        <p class="muted">${esc(c.quartier || '')} · ${esc(date)} · ${esc(c.quantite || '')} ${esc(c.unite || '')}</p>
        <p><b>${fcfa(c.total)}</b>${c.laveurNom ? ` · laveur : ${esc(c.laveurNom)}` : ' · pas encore de laveur'}</p>
        ${actif ? `<div class="actions">
          ${c.statut !== 'en_attente' ? `<button class="btn primary small" data-act="terminer" data-id="${c.id}">Marquer terminée</button>` : ''}
          <button class="btn ghost small" data-act="annuler" data-id="${c.id}">Annuler</button></div>` : ''}
      </article>`;
    }).join('') : '<p class="muted">Aucune commande.</p>';
  }

  el.querySelector('#f').addEventListener('change', afficher);
  el.querySelector('#q').addEventListener('input', afficher);
  el.querySelector('#csv').addEventListener('click', () => {
    const rows = [['id', 'date', 'statut', 'service', 'quantite', 'unite', 'quartier', 'total', 'laveur']]
      .concat(tout.map((c) => [c.id, dateTs(c.createdAt), c.statut, nomService(c.service), c.quantite, c.unite, c.quartier, c.total, c.laveurNom]));
    telecharger('commandes-lav.csv', csv(rows));
  });
  liste.addEventListener('click', async (e) => {
    const { act, id } = e.target.dataset;
    if (!act || !id) return;
    if (act === 'annuler' && !confirm('Annuler cette commande ?')) return;
    e.target.disabled = true;
    try {
      const statut = act === 'annuler' ? 'annulee' : 'terminee';
      await changerStatut(id, { statut });
      const c = tout.find((x) => x.id === id);
      if (c) c.statut = statut;
      toast('Commande mise à jour.', 'ok');
      afficher();
    } catch (err) { toast(messageErreur(err), 'error'); e.target.disabled = false; }
  });
  try { tout = await listerCommandes(); afficher(); } catch (e) { liste.innerHTML = erreur(e); }
}

// ---------- Demandes pour devenir laveur ----------
export async function pageDemandes(el) {
  el.innerHTML = `<section class="card"><h1>Demandes laveurs</h1><div id="liste">${chargement}</div></section>`;
  const liste = el.querySelector('#liste');
  async function charger() {
    try {
      const demandes = await listerDemandesLaveur();
      liste.innerHTML = demandes.length ? demandes.map((u) => `
        <article class="item">
          <header><h3>${esc(u.nom)}</h3><span class="badge wait">Demande</span></header>
          <p class="muted">${esc(u.telephone)} · ${esc(u.email)} · ${esc(u.quartier || '')}</p>
          <div class="actions">
            <button class="btn primary small" data-act="approuver" data-id="${u.id}">Accepter</button>
            <button class="btn ghost small" data-act="refuser" data-id="${u.id}">Refuser</button>
          </div>
        </article>`).join('') : '<p class="muted">Aucune demande en attente.</p>';
    } catch (e) { liste.innerHTML = erreur(e); }
  }
  liste.addEventListener('click', async (e) => {
    const { act, id } = e.target.dataset;
    if (!act || !id) return;
    e.target.disabled = true;
    try {
      if (act === 'approuver') await approuverLaveur(id); else await refuserLaveur(id);
      toast('Mis à jour.', 'ok'); charger();
    } catch (err) { toast(messageErreur(err), 'error'); e.target.disabled = false; }
  });
  charger();
}

// ---------- Laveurs et clients (meme gabarit) ----------
function pageUtilisateurs({ titre, vide, lister, avecDetails }) {
  return async function (el) {
    el.innerHTML = `
      <section class="card"><h1>${titre}</h1>
        <div class="bar"><input id="q" type="search" placeholder="Rechercher (nom, téléphone, quartier)" aria-label="Rechercher"></div>
        <div id="liste">${chargement}</div></section>`;
    const liste = el.querySelector('#liste');
    let tous = [];
    function afficher() {
      const q = el.querySelector('#q').value.trim().toLowerCase();
      const items = tous.filter((u) => !q || [u.nom, u.telephone, u.quartier, u.email].some((v) => String(v || '').toLowerCase().includes(q)));
      liste.innerHTML = items.length ? items.map((u) => `
        <article class="item">
          <header><h3>${esc(u.nom)}</h3><span class="badge ${classeStatut(u.statut)}">${esc(u.statut || '')}</span></header>
          <p class="muted">${esc(u.telephone || '')} · ${esc(u.quartier || '')}${avecDetails ? ` · ${esc(u.sexe || '')} ${u.age ? u.age + ' ans' : ''}` : ` · ${esc(u.email || '')}`}</p>
          <div class="actions">
            ${u.statut !== 'actif' ? `<button class="btn primary small" data-s="actif" data-id="${u.id}">${avecDetails ? 'Valider' : 'Réactiver'}</button>` : ''}
            ${u.statut !== 'suspendu' ? `<button class="btn ghost small" data-s="suspendu" data-id="${u.id}">Suspendre</button>` : ''}
          </div>
        </article>`).join('') : `<p class="muted">${vide}</p>`;
    }
    el.querySelector('#q').addEventListener('input', afficher);
    liste.addEventListener('click', async (e) => {
      const { s, id } = e.target.dataset;
      if (!s || !id) return;
      e.target.disabled = true;
      try {
        await changerStatutUtilisateur(id, s);
        const u = tous.find((x) => x.id === id);
        if (u) u.statut = s;
        toast('Mis à jour.', 'ok'); afficher();
      } catch (err) { toast(messageErreur(err), 'error'); e.target.disabled = false; }
    });
    try { tous = await lister(); afficher(); } catch (e) { liste.innerHTML = erreur(e); }
  };
}

export const pageLaveurs = pageUtilisateurs({ titre: 'Laveurs', vide: 'Aucun laveur inscrit.', lister: listerLaveurs, avecDetails: true });
export const pageClients = pageUtilisateurs({ titre: 'Particuliers', vide: 'Aucun particulier inscrit.', lister: listerClients, avecDetails: false });

// ---------- Tarifs ----------
export async function pageTarifs(el) {
  el.innerHTML = `
    <section class="card"><h1>Tarifs de départ</h1>
      <p class="muted">Prix de référence en ${APP.devise}. Ils s'appliquent quand le laveur n'a pas fixé ses propres tarifs.</p>
      <form id="f">
        ${SERVICES.map((s) => `<fieldset class="tarif"><legend>${esc(s.label)}</legend>
          ${s.unites.map((u) => `<label>Prix par ${esc(u)}
            <input type="number" min="0" step="50" inputmode="numeric" name="${s.id}|${u}" value="${s.prixRef[u]}" required></label>`).join('')}
        </fieldset>`).join('')}
        <button class="btn primary" type="submit">Enregistrer les tarifs</button>
      </form></section>`;
  el.querySelector('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const services = {};
    new FormData(e.target).forEach((v, k) => {
      const [id, u] = k.split('|');
      (services[id] = services[id] || {})[u] = Number(v);
    });
    const bouton = e.target.querySelector('button[type=submit]');
    bouton.disabled = true;
    try {
      await sauverTarifs(services);
      SERVICES.forEach((sv) => sv.unites.forEach((u) => { if (services[sv.id] && services[sv.id][u] > 0) sv.prixRef[u] = services[sv.id][u]; }));
      toast('Tarifs enregistrés.', 'ok');
    } catch (err) { toast(messageErreur(err), 'error'); }
    bouton.disabled = false;
  });
}

// ---------- Notes et avis ----------
export async function pageAvis(el) {
  el.innerHTML = `
    <section class="card"><h1>Notes et avis</h1><div id="resume">${chargement}</div></section>
    <section class="card"><h2>Derniers avis</h2><div id="liste"></div></section>`;
  try {
    const avis = await listerAvis();
    if (!avis.length) {
      el.querySelector('#resume').innerHTML = '<p class="muted">Aucun avis pour le moment.</p>';
      return;
    }
    const moy = (l) => (l.reduce((t, a) => t + Number(a.note || 0), 0) / l.length).toFixed(1);
    const parLaveur = {};
    avis.forEach((a) => {
      const cle = a.laveurNom || a.laveurId || 'Laveur inconnu';
      (parLaveur[cle] = parLaveur[cle] || []).push(a);
    });
    el.querySelector('#resume').innerHTML = `
      <p>Note moyenne : <b>${moy(avis)} / 5</b> (${avis.length} avis)</p>
      ${Object.entries(parLaveur).sort((a, b) => b[1].length - a[1].length).map(([nom, l]) =>
        `<p class="muted">${esc(nom)} : <b>${moy(l)} / 5</b> (${l.length})</p>`).join('')}`;
    el.querySelector('#liste').innerHTML = avis.slice(0, 50).map((a) => `
      <article class="item">
        <header><h3>${'★'.repeat(Number(a.note) || 0)}${'☆'.repeat(5 - (Number(a.note) || 0))}</h3><span class="muted">${esc(dateTs(a.createdAt))}</span></header>
        ${a.laveurNom ? `<p class="muted">${esc(a.laveurNom)}</p>` : ''}
        ${a.commentaire ? `<p>${esc(a.commentaire)}</p>` : ''}
      </article>`).join('');
  } catch (e) { el.querySelector('#resume').innerHTML = erreur(e); }
}

// ---------- Finances ----------
export async function pageFinances(el) {
  el.innerHTML = `
    <section class="card"><h1>Finances</h1><div id="kpi">${chargement}</div></section>
    <section class="card"><h2>Commission</h2>
      <form id="fc" class="bar">
        <input id="taux" type="number" min="0" max="100" step="0.5" inputmode="decimal" aria-label="Taux de commission en pour cent">
        <button class="btn primary small" type="submit">Enregistrer</button>
      </form>
      <p class="muted">Taux en % appliqué au chiffre d'affaires des commandes terminées (10 % par défaut).</p></section>
    <section class="card"><h2>Par laveur</h2><div id="par"></div></section>`;
  let termin = []; let taux = 10;
  const maintenant = new Date();
  const dateFin = (c) => { const t = c.updatedAt || c.createdAt; return t && t.seconds ? new Date(t.seconds * 1000) : null; };

  function afficher() {
    const mois = termin.filter((c) => { const d = dateFin(c); return d && d.getMonth() === maintenant.getMonth() && d.getFullYear() === maintenant.getFullYear(); });
    const ca = somme(termin); const caMois = somme(mois);
    const com = (v) => Math.round(v * taux / 100);
    el.querySelector('#kpi').innerHTML = `
      <p>Chiffre d'affaires total : <b>${fcfa(ca)}</b></p>
      <p>Ce mois-ci : <b>${fcfa(caMois)}</b></p>
      <p>Commission totale (${taux} %) : <b>${fcfa(com(ca))}</b></p>
      <p>Commission ce mois-ci : <b>${fcfa(com(caMois))}</b></p>
      <p class="muted">${termin.length} commandes terminées.</p>`;
    const parL = {};
    termin.forEach((c) => { const n = c.laveurNom || 'Sans nom'; (parL[n] = parL[n] || { nb: 0, total: 0 }); parL[n].nb++; parL[n].total += Number(c.total || 0); });
    const lignes = Object.entries(parL).sort((a, b) => b[1].total - a[1].total);
    el.querySelector('#par').innerHTML = lignes.length ? lignes.map(([n, v]) =>
      `<article class="item"><header><h3>${esc(n)}</h3><b>${fcfa(v.total)}</b></header><p class="muted">${v.nb} commande(s) · commission ${fcfa(Math.round(v.total * taux / 100))}</p></article>`).join('')
      : '<p class="muted">Aucune commande terminée.</p>';
  }

  el.querySelector('#fc').addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = Number(el.querySelector('#taux').value);
    if (!(v >= 0 && v <= 100)) { toast('Taux invalide (0 à 100).', 'error'); return; }
    try { await sauverConfig({ commission: v }); taux = v; afficher(); toast('Taux enregistré.', 'ok'); }
    catch (err) { toast(messageErreur(err), 'error'); }
  });

  try {
    const [cmds, cfg] = await Promise.all([listerCommandes(), lireConfig()]);
    termin = cmds.filter((c) => c.statut === 'terminee');
    if (typeof cfg.commission === 'number') taux = cfg.commission;
    el.querySelector('#taux').value = taux;
    afficher();
  } catch (e) { el.querySelector('#kpi').innerHTML = erreur(e); }
}
