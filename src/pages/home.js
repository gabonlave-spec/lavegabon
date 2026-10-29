import { APP, SERVICES, STATUTS } from '../config/constants.js';
import { fcfa, fmtDate, esc, badge, messageErreur, nomHtml } from '../lib/ui.js';
import { ecouterCommandesClient, ecouterDemandesOuvertes, lireLaveur, filtrerPourLaveur } from '../lib/db.js';
import { rafraichirProfil } from '../lib/auth.js';
import { blocDevenirLaveur, brancherDevenirLaveur } from '../lib/devenir.js';
import { blocAnnuaire, brancherAnnuaire } from '../lib/annuaire.js';
import { tuilesAccueil, brancherTuiles } from '../lib/tuiles.js';

const MAX = 3;

export default async function home(el, { state }) {
  const p = state.profile;
  const role = state.user ? p?.role : null;
  if (state.user && p && (p.demandeLaveur || p.statut === 'en_attente')) rafraichirProfil().catch(() => {});

  let cta = `<a class="btn primary" href="#/inscription">Créer un compte</a><a class="btn ghost" href="#/connexion">Se connecter</a>`;
  if (role === 'client') cta = `<a class="btn primary" href="#/commander">Nouvelle demande</a><a class="btn ghost" href="#/commandes">Mes commandes</a>`;
  if (role === 'laveur') cta = `<a class="btn primary" href="#/demandes">Voir les demandes</a><a class="btn ghost" href="#/missions">Mes missions</a>`;
  if (role === 'admin') cta = `<a class="btn primary" href="#/admin">Espace admin</a>`;

  const lignes = SERVICES.map((s) => s.unites.map((u, i) => `
    <tr>${i === 0 ? `<th scope="row" rowspan="${s.unites.length}">${s.label}</th>` : ''}
      <td>${u}</td><td><b>${fcfa(s.prixRef[u])}</b></td></tr>`).join('')).join('');

  // Bloc "demandes" selon le role
  let blocDemandes = '';
  if (role === 'client') {
    blocDemandes = `<section class="card"><div class="card-head"><h2>Mes demandes</h2><a href="#/commandes">Tout voir</a></div><div id="dem"><p class="muted">Chargement…</p></div></section>`;
  } else if (role === 'laveur' && p.statut === 'actif') {
    blocDemandes = `<section class="card"><div class="card-head"><h2>Demandes ouvertes</h2><a href="#/demandes">Tout voir</a></div><div id="dem"><p class="muted">Chargement…</p></div></section>`;
  } else if (role === 'laveur') {
    blocDemandes = `<section class="card"><h2>Demandes</h2><p>Ton compte est <b>${p.statut === 'suspendu' ? 'suspendu' : 'en attente de validation'}</b>. Complète ton profil : notre équipe te valide rapidement.</p><a class="btn primary" href="#/profil">Compléter mon profil</a></section>`;
  }

  const blocLaveur = role === 'client' ? blocDevenirLaveur(p)
    : !state.user ? `<section class="card">
        <h2>Vous voulez laver pour les autres ?</h2>
        <p>Inscrivez-vous comme laveur : choisissez vos services, vos tarifs et vos quartiers.</p>
        <a class="btn ghost" href="#/inscription">Devenir laveur</a>
      </section>` : '';

  el.innerHTML = `
    <section class="hero">
      <h1>${nomHtml()}</h1>
      <p class="slogan">${APP.slogan}</p>
      <p>Faites laver votre linge, votre lessive ou votre vaisselle par un laveur de votre quartier, directement à la maison.</p>
      
    </section>

    ${tuilesAccueil(role)}

    ${blocAnnuaire()}

    ${blocDemandes}

    <section class="card" id="comment">
      <h2>Comment ça marche</h2>
      <ol class="steps">
        <li><b>Décrivez</b> ce qu'il y a à laver : service, quantité, quartier, date et heure.</li>
        <li><b>Un laveur accepte</b> votre demande. Le prix total est affiché avant d'envoyer.</li>
        <li><b>Le laveur passe chez vous</b>, vous suivez l'avancement et vous le notez.</li>
      </ol>
    </section>

    <section class="card">
      <h2>Services et prix de départ</h2>
      <div class="table-wrap">
        <table class="tarifs">
          <caption class="sr">Services et prix de départ</caption>
          <thead><tr><th scope="col">Service</th><th scope="col">Unité</th><th scope="col">Prix dès</th></tr></thead>
          <tbody>${lignes}</tbody>
        </table>
      </div>
      <p class="muted">Le prix final dépend du laveur et de la quantité. Il est figé au moment de la demande.</p>
    </section>

    ${blocLaveur}`;

  brancherDevenirLaveur(el, state);
  brancherAnnuaire(el, state);
  brancherTuiles(el);

  const dem = el.querySelector('#dem');
  if (!dem) return;
  const erreur = (e) => { dem.innerHTML = `<p class="error">${messageErreur(e)}</p>`; };

  if (role === 'client') {
    return ecouterCommandesClient(state.user.uid, (items) => {
      if (!items.length) {
        dem.innerHTML = '<p class="muted">Aucune demande pour le moment.</p><a class="btn primary small" href="#/commander">Faire une demande</a>';
        return;
      }
      dem.innerHTML = items.slice(0, MAX).map((c) => `
        <article class="mini-item">
          <header><b>${esc(c.serviceLabel)}</b>${badge(c.statut, STATUTS)}</header>
          <p>${c.quantite} ${esc(c.unite)} · <b>${fcfa(c.total)}</b></p>
          <p class="muted">${fmtDate(c.date, c.heure)} · ${esc(c.quartier)}${c.laveurNom ? ' · ' + esc(c.laveurNom) : ''}</p>
        </article>`).join('') + (items.length > MAX ? `<p class="muted">+ ${items.length - MAX} autre(s) demande(s)</p>` : '');
    }, erreur);
  }

  // Laveur actif
  const profilLaveur = (await lireLaveur(state.user.uid)) || {};
  return ecouterDemandesOuvertes((items) => {
    const vues = filtrerPourLaveur(items, profilLaveur);
    if (!vues.length) { dem.innerHTML = '<p class="muted">Aucune demande dans tes quartiers pour le moment.</p>'; return; }
    dem.innerHTML = vues.slice(0, MAX).map((c) => `
      <article class="mini-item">
        <header><b>${esc(c.serviceLabel)}</b><b>${fcfa(c.total)}</b></header>
        <p>${c.quantite} ${esc(c.unite)}${c.urgent ? ' · <span class="badge wait">Urgent</span>' : ''}</p>
        <p class="muted">${fmtDate(c.date, c.heure)} · ${esc(c.quartier)}</p>
      </article>`).join('') + `<a class="btn primary small" href="#/demandes">${vues.length > MAX ? `Voir les ${vues.length} demandes` : 'Voir et accepter'}</a>`;
  }, erreur);
}
