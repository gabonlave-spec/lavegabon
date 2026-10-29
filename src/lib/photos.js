import { CLOUDINARY } from '../config/constants.js';

export const MAX_GALERIE = 30;
const MAX_OCTETS = 20 * 1024 * 1024; // photo d'origine : 20 Mo maximum

export const photosPretes = () => !!(CLOUDINARY.cloudName && CLOUDINARY.preset);

// Seules les images hebergees sur Cloudinary sont affichees.
export const urlOk = (u) => typeof u === 'string' && /^https:\/\/res\.cloudinary\.com\//.test(u);

const transf = (u, t) => (urlOk(u) ? u.replace('/upload/', `/upload/${t}/`) : '');
export const miniature = (u, c = 300) => transf(u, `c_fill,g_auto,w_${c},h_${c},q_auto,f_auto`);
export const grande = (u, w = 1200) => transf(u, `c_limit,w_${w},q_auto,f_auto`);

async function ouvrir(file) {
  if (window.createImageBitmap) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { /* repli */ }
  }
  return new Promise((ok, ko) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); ok(img); };
    img.onerror = () => { URL.revokeObjectURL(url); ko(new Error('Image illisible.')); };
    img.src = url;
  });
}

// Reduit la photo avant l'envoi (connexion lente) : cote max 1280 px, JPEG.
async function reduire(file, max = 1280, qualite = 0.82) {
  const img = await ouvrir(file);
  const l = img.width; const h = img.height;
  const k = Math.min(1, max / Math.max(l, h));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(l * k));
  c.height = Math.max(1, Math.round(h * k));
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  if (img.close) img.close();
  return new Promise((ok, ko) => c.toBlob((b) => (b ? ok(b) : ko(new Error('Compression impossible.'))), 'image/jpeg', qualite));
}

// Envoie une photo vers Cloudinary (preset non signe) et renvoie son adresse https.
export async function envoyerPhoto(file, { max = 1280 } = {}) {
  if (!photosPretes()) throw new Error('Les photos ne sont pas encore configurees.');
  if (!file || !/^image\//.test(file.type)) throw new Error('Ce fichier n\'est pas une image.');
  if (file.size > MAX_OCTETS) throw new Error('Photo trop lourde (20 Mo maximum).');
  const blob = await reduire(file, max);
  const fd = new FormData();
  fd.append('file', blob, 'photo.jpg');
  fd.append('upload_preset', CLOUDINARY.preset);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`, { method: 'POST', body: fd });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.secure_url) throw new Error((j.error && j.error.message) || 'Envoi impossible. Verifie ta connexion.');
  return j.secure_url;
}
