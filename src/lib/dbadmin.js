import { db } from '../config/firebase.js';
import { collection, doc, getDoc, getDocs, setDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { SERVICES } from '../config/constants.js';

const parDateDesc = (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
const lire = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

// Toutes les commandes (admin).
export async function listerCommandes() {
  const s = await getDocs(collection(db, 'commandes'));
  return lire(s).sort(parDateDesc);
}

export async function listerClients() {
  const s = await getDocs(query(collection(db, 'users'), where('role', '==', 'client')));
  return lire(s).sort(parDateDesc);
}

export async function listerAvis() {
  const s = await getDocs(collection(db, 'avis'));
  return lire(s).sort(parDateDesc);
}

// Tarifs de reference modifiables : document tarifs/reference.
export async function chargerTarifs() {
  const s = await getDoc(doc(db, 'tarifs', 'reference'));
  if (!s.exists()) return;
  const t = s.data().services || {};
  SERVICES.forEach((sv) => {
    const o = t[sv.id];
    if (!o) return;
    sv.unites.forEach((u) => {
      const v = Number(o[u]);
      if (v > 0) sv.prixRef[u] = v;
    });
  });
}

export const sauverTarifs = (services) =>
  setDoc(doc(db, 'tarifs', 'reference'), { services, updatedAt: serverTimestamp() });

// Reglages admin (commission) : document tarifs/config.
export async function lireConfig() {
  const s = await getDoc(doc(db, 'tarifs', 'config'));
  return s.exists() ? s.data() : {};
}
export const sauverConfig = (data) =>
  setDoc(doc(db, 'tarifs', 'config'), { ...data, updatedAt: serverTimestamp() }, { merge: true });
