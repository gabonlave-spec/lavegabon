import { db } from '../config/firebase.js';
import {
  collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc,
  query, where, onSnapshot, serverTimestamp
} from 'firebase/firestore';

const parDateDesc = (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
const lire = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

// ----- Commandes -----
export async function creerCommande(data, contact) {
  const ref = await addDoc(collection(db, 'commandes'), {
    ...data, statut: 'en_attente', laveurId: null, laveurNom: null,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  });
  // Le telephone du client est stocke a part (visible seulement par le client et son laveur).
  await setDoc(doc(db, 'commandes', ref.id, 'prive', 'contact'), contact);
  return ref.id;
}

export function ecouterCommandesClient(uid, cb, onErr) {
  const q = query(collection(db, 'commandes'), where('clientId', '==', uid));
  return onSnapshot(q, (s) => cb(lire(s).sort(parDateDesc)), onErr);
}

export function ecouterDemandesOuvertes(cb, onErr) {
  const q = query(collection(db, 'commandes'), where('statut', '==', 'en_attente'));
  return onSnapshot(q, (s) => cb(lire(s).sort(parDateDesc)), onErr);
}

export function ecouterMissions(uid, cb, onErr) {
  const q = query(collection(db, 'commandes'), where('laveurId', '==', uid));
  return onSnapshot(q, (s) => cb(lire(s).sort(parDateDesc)), onErr);
}

export const changerStatut = (id, champs) =>
  updateDoc(doc(db, 'commandes', id), { ...champs, updatedAt: serverTimestamp() });

export async function lireContact(id) {
  const s = await getDoc(doc(db, 'commandes', id, 'prive', 'contact'));
  return s.exists() ? s.data() : null;
}

// ----- Profil laveur -----
export async function lireLaveur(uid) {
  const s = await getDoc(doc(db, 'laveurs', uid));
  return s.exists() ? s.data() : null;
}
export const sauverLaveur = (uid, data) =>
  setDoc(doc(db, 'laveurs', uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });

// ----- Admin -----
export async function listerLaveurs() {
  const s = await getDocs(query(collection(db, 'users'), where('role', '==', 'laveur')));
  return lire(s).sort(parDateDesc);
}
// Un client demande a devenir laveur ; l'admin valide.
export const demanderLaveur = (uid) => updateDoc(doc(db, 'users', uid), { demandeLaveur: true });
export async function listerDemandesLaveur() {
  const s = await getDocs(query(collection(db, 'users'), where('demandeLaveur', '==', true)));
  return lire(s).sort(parDateDesc);
}
export const approuverLaveur = (uid) =>
  updateDoc(doc(db, 'users', uid), { role: 'laveur', statut: 'actif', demandeLaveur: false });
export const refuserLaveur = (uid) => updateDoc(doc(db, 'users', uid), { demandeLaveur: false });

// Demandes visibles pour un laveur (selon ses quartiers et services).
export function filtrerPourLaveur(items, prof = {}) {
  const q = prof.quartiers || [];
  const s = prof.services || [];
  return items.filter((c) =>
    (!q.length || q.includes(c.quartier) || c.quartier === 'Autre') &&
    (!s.length || s.includes(c.service)));
}

export const changerStatutUtilisateur = (uid, statut) => updateDoc(doc(db, 'users', uid), { statut });

export async function compterCommandes() {
  const s = await getDocs(collection(db, 'commandes'));
  const total = { total: 0, en_attente: 0, acceptee: 0, en_cours: 0, terminee: 0, annulee: 0 };
  s.forEach((d) => { total.total++; const st = d.data().statut; if (st in total) total[st]++; });
  return total;
}
