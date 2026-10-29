import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { SERVICES, QUARTIERS } from '../config/constants.js';
import { esc, fcfa, toast } from './ui.js';
import { urlOk, miniature } from './photos.js';
import { positionActuelle } from './geo.js';
import '../styles/annuaire.css';

// Villes du Grand Libreville -> quartiers (modifiable)
const VILLES = {
  'Libreville': ['Louis', 'Glass', 'Mont-Bouët', 'Nombakélé', 'Akébé', 'Batterie IV', 'Lalala', 'Sotega', 'Sablière', 'Nkembo', 'Oloumi', 'Okala', 'PK5', 'PK8', 'Charbonnages', 'Montagne Sainte', 'Cocotiers', 'Plaine Niger'],
  'Akanda': ['Angondjé', 'Akanda'],
  'Owendo': ['Owendo', 'Awendjé']
};
// Coordonnees APPROXIMATIVES des quartiers (pour le tri par distance)
const COORD = {
  'Louis': [0.3925, 9.4500], 'Glass': [0.3935, 9.4565], 'Mont-Bouët': [0.3880, 9.4620],
  'Nombakélé': [0.3790, 9.4510], 'Akébé': [0.3700, 9.4650], 'Batterie IV': [0.3840, 9.4560],
  'Lalala': [0.4030, 9.4590], 'Sotega': [0.3700, 9.4550], 'Sablière': [0.3640, 9.4690],
  'Nkembo': [0.4090, 9.4610], 'Oloumi': [0.4180, 9.4480], 'Okala': [0.4650, 9.4710],
  'Angondjé': [0.5200, 9.4950], 'Akanda': [0.5800, 9.5100], 'Owendo': [0.2870, 9.5000],
  'PK5': [0.3600, 9.4860], 'PK8': [0.3480, 9.4980], 'Charbonnages': [0.3800, 9.4750],
  'Montagne Sainte': [0.3990, 9.4720], 'Awendjé': [0.3000, 9.4900], 'Cocotiers': [0.3920, 9.4720],
  'Plaine Niger': [0.3500, 9.4800]
};

const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const km = (a, b) => {
  const r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};
const zonesDe = (l) => [...new Set([...(l.quartiers || []), l.quartierPrincipal].filter(Boolean))];
const villeDe = (q) => Object.keys(VILLES).find((v) => VILLES[v].includes(q));

export function blocAnnuaire() {
  const opts = (arr) => arr.map((x) => `<option value="${esc(x)}">${esc(x)}</option>`).join('');
  return `<section class="card" id="annuaire">
    <div class="card-head"><h2>Nos laveurs</h2></div>
    <div class="ann-bar">
      <input type="search" id="ann-q" placeholder="Nom, quartier, service…" aria-label="Rechercher un laveur">
      <button class="btn ghost small" id="ann-geo" type="button">Près de moi</button>
    </div>
    <details class="ann-adv"><summary>Recherche avancée</summary>
      <label>Ville<select id="ann-ville"><option value="">Toutes</option>${opts(Object.keys(VILLES))}</select></label>
      <label>Quartier<select id="ann-qrt"><option value="">Tous</option>${opts(QUARTIERS.filter((q) => q !== 'Autre'))}</select></label>
      <label>Service<select id="ann-svc"><option value="">Tous</option>${SERVICES.map((s) => `<option value="${esc(s.id)}">${esc(s.label)}</option>`).join('')}</select></label>
      <label>Sexe<select id="ann-sexe"><option value="">Tous</option><option value="f">Femme</option><option value="h">Homme</option></select></label>
    </details>
    <p class="muted" id="ann-info">Chargement…</p>
    <div class="ann-grid" id="ann-grid"></div>
  </section>`;
}

export function brancherAnnuaire(el, state) {
  const $ = (s) => el.querySelector(s);
  if (!$('#annuaire')) return;
  let tous = [], pos = null;

  const filtrer = () => {
    const q = norm($('#ann-q').value), v = $('#ann-ville').value, qr = $('#ann-qrt').value, sv = $('#ann-svc').value, sx = $('#ann-sexe').value;
    let L = tous.filter((l) => {
      const z = zonesDe(l);
      if (v && !z.some((x) => VILLES[v].includes(x))) return false;
      if (qr && !z.includes(qr)) return false;
      if (sv && !(l.services || []).includes(sv)) return false;
      if (sx && !(sx === 'f' ? norm(l.sexe).startsWith('f') : /^(h|m)/.test(norm(l.sexe)))) return false;
      if (q && !norm([l.nom, l.bio, z.join(' '), (l.services || []).join(' ')].join(' ')).includes(q)) return false;
      return true;
    });
    L = L.map((l) => {
      let d = null;
      if (pos) {
        const ds = zonesDe(l).filter((x) => COORD[x]).map((x) => km([pos.lat, pos.lng], COORD[x]));
        d = ds.length ? Math.min(...ds) : null;
      }
      return { ...l, _d: d };
    });
    if (pos) L.sort((a, b) => (a._d ?? 1e9) - (b._d ?? 1e9));
    else L.sort((a, b) => String(a.nom || '').localeCompare(String(b.nom || '')));
    afficher(L);
  };

  const afficher = (L) => {
    $('#ann-info').textContent = L.length ? `${L.length} laveur(s)${pos ? ' · triés par distance (approx.)' : ''}` : 'Aucun laveur ne correspond.';
    $('#ann-grid').innerHTML = L.map((l) => {
      const ini = esc((l.nom || '?').trim().charAt(0).toUpperCase());
      const img = urlOk(l.photoUrl) ? `<img src="${esc(miniature(l.photoUrl, 200))}" alt="" loading="lazy">` : ini;
      const lieu = l.quartierPrincipal || (l.quartiers || [])[0] || '';
      const dist = l._d != null ? `<small>≈ ${l._d < 1 ? '< 1' : l._d.toFixed(1)} km</small>` : '';
      return `<button type="button" class="ann-item" data-id="${esc(l._id)}">
        <span class="ann-av">${img}</span><b>${esc(l.nom || 'Laveur')}</b><small>${esc(lieu)}</small>${dist}</button>`;
    }).join('');
  };

  ['#ann-q', '#ann-ville', '#ann-qrt', '#ann-svc', '#ann-sexe'].forEach((s) => $(s).addEventListener('input', filtrer));
  $('#ann-ville').addEventListener('change', () => {
    const v = $('#ann-ville').value;
    const liste = (v ? VILLES[v] : QUARTIERS.filter((q) => q !== 'Autre'));
    $('#ann-qrt').innerHTML = '<option value="">Tous</option>' + liste.map((x) => `<option value="${esc(x)}">${esc(x)}</option>`).join('');
    filtrer();
  });
  $('#ann-geo').addEventListener('click', async () => {
    const b = $('#ann-geo');
    if (pos) { pos = null; b.classList.remove('on'); return filtrer(); }
    b.disabled = true;
    try { pos = await positionActuelle(); b.classList.add('on'); }
    catch { toast('Position refusée ou indisponible. Utilise la ville et le quartier.', 'info'); }
    b.disabled = false; filtrer();
  });
  $('#ann-grid').addEventListener('click', (e) => {
    const it = e.target.closest('.ann-item');
    const l = it && tous.find((x) => x._id === it.dataset.id);
    if (l) fiche(l, state);
  });

  getDocs(collection(db, 'laveurs')).then((s) => {
    tous = s.docs.map((d) => ({ _id: d.id, ...d.data() }))
      .filter((l) => l.nom && zonesDe(l).length);
    filtrer();
  }).catch(() => { $('#ann-info').textContent = "Liste indisponible pour l'instant."; });
}

function fiche(l, state) {
  const svc = (l.services || []).map((id) => SERVICES.find((s) => s.id === id)).filter(Boolean).map((s) =>
    `<li><b>${esc(s.label)}</b> : ${s.unites.map((u) => { const p = l.tarifs?.[s.id]?.[u]; return p ? `${esc(u)} ${fcfa(p)}` : ''; }).filter(Boolean).join(' · ')}</li>`).join('');
  const gal = (Array.isArray(l.galerie) ? l.galerie : []).filter(urlOk).slice(0, 6)
    .map((u) => `<img src="${esc(miniature(u, 220))}" alt="" loading="lazy">`).join('');
  const grand = urlOk(l.photoUrl) ? `<img class="ann-big" src="${esc(miniature(l.photoUrl, 400))}" alt="">` : '';
  const role = state.user ? state.profile?.role : null;
  const lien = role === 'client' ? '#/commander' : (state.user ? '#/' : '#/inscription');
  const cta = role === 'laveur' || role === 'admin' ? '' : `<a class="btn primary" href="${lien}">${role === 'client' ? 'Faire une demande' : 'Créer un compte pour commander'}</a>`;
  const contact = !state.user
    ? `<div class="ann-lock"><p><b>Veuillez vous inscrire pour contacter ce laveur.</b></p><a class="btn primary" href="#/inscription">Créer un compte</a><a class="btn ghost" href="#/connexion">Se connecter</a></div>`
    : cta;
  const m = document.createElement('div');
  m.className = 'ann-modal';
  m.innerHTML = `<div class="ann-sheet" role="dialog" aria-modal="true">
    <button class="ann-x" type="button" aria-label="Fermer">×</button>
    ${grand}<h2>${esc(l.nom)}</h2>
    <p class="muted">${esc(zonesDe(l).join(', '))}</p>
    ${l.sexe ? `<p class="muted">${esc(l.sexe)}</p>` : ''}
    ${l.disponibilites ? `<p><b>Disponibilités :</b> ${esc(l.disponibilites)}</p>` : ''}
    ${l.bio ? `<p>${esc(l.bio)}</p>` : ''}
    ${svc ? `<h3>Services et tarifs</h3><ul class="ann-svc">${svc}</ul>` : ''}
    ${gal ? `<h3>Photos</h3><div class="ann-gal">${gal}</div>` : ''}
    ${contact}</div>`;
  const fermer = () => m.remove();
  m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('.ann-x') || e.target.closest('a')) fermer(); });
  document.body.appendChild(m);
}
