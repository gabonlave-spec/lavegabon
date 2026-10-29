import { doc, updateDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { esc, toast, messageErreur } from './ui.js';

const ROLE = { client: 'Particulier', laveur: 'Laveur', admin: 'Administrateur' };
const ST = { actif: ['Actif', 'ok', ''], en_attente: ['En attente', 'wait', 'wait'], suspendu: ['Suspendu', 'off', 'off'] };

// Fiche d'un compte, reservee a l'admin (les regles Firestore font foi).
export function ouvrirFiche(u, cb = {}) {
  document.querySelector('.fiche-ov')?.remove();
  const ov = document.createElement('div');
  ov.className = 'fiche-ov';
  document.body.appendChild(ov);

  function rendre() {
    const [lib, cl, pt] = ST[u.statut] || [u.statut || '—', 'wait', 'wait'];
    ov.innerHTML = `<div class="fiche" role="dialog" aria-modal="true">
      <h2>${esc(u.nom || '')}</h2>
      <p class="fiche-st"><span class="pres-in ${pt}"></span><b>${esc(ROLE[u.role] || u.role || '')}</b> · <span class="badge ${cl}">${esc(lib)}</span>${u.masque ? ' · <span class="badge off">Masqué</span>' : ''}</p>
      <p class="muted">${esc(u.email || '')}</p>
      <div class="form">
        <label>Nom<input id="f-nom" value="${esc(u.nom || '')}"></label>
        <label>Téléphone<input id="f-tel" value="${esc(u.telephone || '')}"></label>
        <label>Quartier<input id="f-qrt" value="${esc(u.quartier || '')}"></label>
        <button class="btn primary" data-a="save" type="button">Enregistrer les modifications</button>
      </div>
      <div class="actions">
        <button class="btn ghost small" data-a="masque" type="button">${u.masque ? 'Afficher' : 'Masquer'}</button>
        ${u.statut === 'suspendu' ? '<button class="btn primary small" data-a="actif" type="button">Réactiver</button>' : '<button class="btn ghost small" data-a="suspendre" type="button">Suspendre</button>'}
        ${u.statut === 'en_attente' ? '<button class="btn primary small" data-a="actif" type="button">Valider</button>' : ''}
        <button class="btn ghost small fiche-del" data-a="suppr" type="button">Supprimer</button>
      </div>
      <button class="btn ghost" data-a="fermer" type="button">Fermer</button>
    </div>`;
  }

  async function maj(champs, msg) {
    try {
      await updateDoc(doc(db, 'users', u.id), champs);
      if (u.role === 'laveur' && ('masque' in champs || 'nom' in champs)) {
        const l = {};
        if ('masque' in champs) l.masque = champs.masque;
        if ('nom' in champs) l.nom = champs.nom;
        try { await setDoc(doc(db, 'laveurs', u.id), { ...l, updatedAt: serverTimestamp() }, { merge: true }); }
        catch (e) { toast('Profil public non mis à jour (règles « laveurs »).', 'error'); }
      }
      Object.assign(u, champs);
      toast(msg, 'ok'); rendre(); cb.maj && cb.maj();
    } catch (e) { toast(messageErreur(e), 'error'); }
  }

  ov.addEventListener('click', async (e) => {
    if (e.target === ov) return ov.remove();
    const a = e.target.dataset && e.target.dataset.a;
    if (!a) return;
    if (a === 'fermer') return ov.remove();
    if (a === 'save') {
      const nom = ov.querySelector('#f-nom').value.trim();
      if (!nom) return toast('Le nom est obligatoire.', 'error');
      return maj({ nom, telephone: ov.querySelector('#f-tel').value.trim(), quartier: ov.querySelector('#f-qrt').value.trim() }, 'Modifications enregistrées.');
    }
    if (a === 'masque') return maj({ masque: !u.masque }, u.masque ? 'Compte à nouveau visible.' : 'Compte masqué.');
    if (a === 'suspendre') { if (!confirm('Suspendre ce compte ?')) return; return maj({ statut: 'suspendu' }, 'Compte suspendu.'); }
    if (a === 'actif') return maj({ statut: 'actif' }, 'Compte actif.');
    if (a === 'suppr') {
      if (!confirm('Supprimer définitivement le profil de ' + (u.nom || 'ce compte') + ' ? Action irréversible.')) return;
      try {
        await deleteDoc(doc(db, 'users', u.id));
        try { await deleteDoc(doc(db, 'laveurs', u.id)); } catch (x) { /* pas de profil public */ }
        toast('Profil supprimé.', 'ok'); ov.remove(); cb.supprime && cb.supprime();
      } catch (err) { toast(messageErreur(err), 'error'); }
    }
  });
  rendre();
}
