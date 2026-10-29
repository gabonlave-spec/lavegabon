import { auth, db } from '../config/firebase.js';
import { pingRelais, desactiverPush } from './push.js';
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export const state = { user: null, profile: null, ready: false };
const listeners = new Set();
let registering = false;

export const onState = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach((f) => f(state));

export function initAuth() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (u) => {
      state.user = u;
      if (!registering) {
        state.profile = null;
        if (u) {
          try {
            const s = await getDoc(doc(db, 'users', u.uid));
            state.profile = s.exists() ? { id: s.id, ...s.data() } : null;
          } catch (e) { console.error('profil', e); }
        }
      }
      state.ready = true;
      emit();
      resolve();
    });
  });
}

export const login = (email, mdp) => signInWithEmailAndPassword(auth, email, mdp);
export const logout = async () => { await desactiverPush(); return signOut(auth); };

export async function inscrire({ email, mdp, nom, telephone, role, quartier, sexe, age }) {
  registering = true;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, mdp);
    const profil = {
      nom, telephone, email, role, quartier, sexe, age: Number(age) || null,
      statut: role === 'client' ? 'actif' : 'en_attente',
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, 'users', cred.user.uid), profil);
    if (role === 'laveur') pingRelais('/notify-laveur', cred.user.uid);
    await updateProfile(cred.user, { displayName: nom });
    state.user = cred.user;
    state.profile = { id: cred.user.uid, ...profil };
    emit();
  } finally {
    registering = false;
  }
}

export async function rafraichirProfil() {
  if (!state.user) return;
  const s = await getDoc(doc(db, 'users', state.user.uid));
  const neuf = s.exists() ? { id: s.id, ...s.data() } : null;
  const cle = (p) => (p ? [p.role, p.statut, !!p.demandeLaveur].join('|') : '');
  const change = cle(neuf) !== cle(state.profile);
  state.profile = neuf;
  if (change) emit();
}
