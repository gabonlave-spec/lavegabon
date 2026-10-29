import { db } from '../config/firebase.js';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { esc, toast } from '../lib/ui.js';
import { MAX_GALERIE, photosPretes, urlOk, miniature, grande, envoyerPhoto } from '../lib/photos.js';

export default async function photos(el, { state }) {
  const uid = state.user.uid;
  const prof = state.profile || {};
  let photo = urlOk(prof.photoUrl) ? prof.photoUrl : '';
  let galerie = (Array.isArray(prof.galerie) ? prof.galerie : []).filter(urlOk).slice(0, MAX_GALERIE);
  let occupe = false;

  async function sauver(champs) {
    await updateDoc(doc(db, 'users', uid), champs);
    if (prof.role === 'laveur') {
      await setDoc(doc(db, 'laveurs', uid), { ...champs, updatedAt: serverTimestamp() }, { merge: true });
    }
    Object.assign(state.profile, champs);
  }

  el.innerHTML = `
    <section class="card">
      <h1>Mes photos</h1>
      ${photosPretes() ? '' : '<p class="error">Les photos ne sont pas encore configurées (compte Cloudinary à renseigner).</p>'}
      <h2>Photo de profil</h2>
      <div class="avatar-zone" id="av"></div>
      <div class="actions">
        <label class="btn primary small filebtn">Choisir une photo
          <input type="file" id="fav" accept="image/*" hidden></label>
        <button class="btn ghost small" type="button" id="rav">Retirer</button>
      </div>
    </section>
    <section class="card">
      <h2>Galerie <span class="muted" id="cpt"></span></h2>
      <p class="muted">Jusqu'à ${MAX_GALERIE} photos. Elles sont réduites avant l'envoi pour aller vite.</p>
      <div class="actions">
        <label class="btn primary small filebtn">Ajouter des photos
          <input type="file" id="fgal" accept="image/*" multiple hidden></label>
      </div>
      <p class="muted" id="etat" role="status"></p>
      <div class="grille" id="grille"></div>
    </section>`;

  const $ = (s) => el.querySelector(s);

  function afficher() {
    $('#av').innerHTML = photo
      ? `<img class="gros-avatar" src="${esc(miniature(photo, 240))}" alt="Ma photo de profil">`
      : `<div class="gros-avatar vide">${esc((prof.nom || '?').trim().charAt(0).toUpperCase())}</div>`;
    $('#rav').hidden = !photo;
    $('#cpt').textContent = `(${galerie.length}/${MAX_GALERIE})`;
    $('#grille').innerHTML = galerie.length ? galerie.map((u, i) => `
      <figure class="vignette">
        <a href="${esc(grande(u))}" target="_blank" rel="noopener"><img src="${esc(miniature(u, 240))}" alt="Photo ${i + 1}" loading="lazy"></a>
        <button type="button" class="x" data-i="${i}" aria-label="Supprimer la photo ${i + 1}">×</button>
      </figure>`).join('') : '<p class="muted">Aucune photo pour le moment.</p>';
  }

  function bloquer(b) {
    occupe = b;
    el.querySelectorAll('input[type=file], button').forEach((x) => { x.disabled = b; });
  }

  $('#fav').addEventListener('change', async (e) => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f || occupe) return;
    bloquer(true); $('#etat').textContent = 'Envoi de la photo…';
    try {
      const url = await envoyerPhoto(f, { max: 800 });
      await sauver({ photoUrl: url });
      photo = url; toast('Photo de profil mise à jour.', 'ok');
    } catch (err) { toast(err.message || 'Envoi impossible.', 'error'); }
    $('#etat').textContent = ''; bloquer(false); afficher();
  });

  $('#rav').addEventListener('click', async () => {
    if (occupe || !confirm('Retirer la photo de profil ?')) return;
    bloquer(true);
    try { await sauver({ photoUrl: '' }); photo = ''; toast('Photo retirée.', 'ok'); }
    catch (err) { toast('Action refusée. Réessaie.', 'error'); }
    bloquer(false); afficher();
  });

  $('#fgal').addEventListener('change', async (e) => {
    const fichiers = [...e.target.files]; e.target.value = '';
    if (!fichiers.length || occupe) return;
    const place = MAX_GALERIE - galerie.length;
    if (place <= 0) { toast(`Galerie pleine (${MAX_GALERIE} photos maximum).`, 'error'); return; }
    const lot = fichiers.slice(0, place);
    if (fichiers.length > place) toast(`Seulement ${place} photo(s) ajoutée(s) : ${MAX_GALERIE} maximum.`, 'info');
    bloquer(true);
    let ok = 0;
    for (let i = 0; i < lot.length; i++) {
      $('#etat').textContent = `Envoi ${i + 1} sur ${lot.length}…`;
      try {
        const url = await envoyerPhoto(lot[i]);
        const suite = galerie.concat(url);
        await sauver({ galerie: suite });
        galerie = suite; ok++; afficher();
      } catch (err) { toast(err.message || 'Envoi impossible.', 'error'); break; }
    }
    $('#etat').textContent = ''; bloquer(false); afficher();
    if (ok) toast(`${ok} photo(s) ajoutée(s).`, 'ok');
  });

  $('#grille').addEventListener('click', async (e) => {
    const b = e.target.closest('.x');
    if (!b || occupe) return;
    if (!confirm('Supprimer cette photo de la galerie ?')) return;
    const i = Number(b.dataset.i);
    const suite = galerie.filter((_, k) => k !== i);
    bloquer(true);
    try { await sauver({ galerie: suite }); galerie = suite; toast('Photo supprimée.', 'ok'); }
    catch (err) { toast('Action refusée. Réessaie.', 'error'); }
    bloquer(false); afficher();
  });

  afficher();
}
