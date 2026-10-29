import { APP } from '../config/constants.js';
import { esc, toast } from '../lib/ui.js';

const CLE = 'lav_guide_check';

const ELEMENTS = [
  ['Le nom de votre activité', 'court, facile à retenir et à écrire'],
  ['Une phrase qui dit ce que vous faites', 'par exemple : « Je lave votre linge à domicile à Charbonnages »'],
  ['Une photo de profil nette', 'de vous ou de votre travail, en pleine lumière'],
  ['Vos services avec un prix de départ', 'kg, pièce ou lot, en FCFA'],
  ['Votre numéro WhatsApp', 'avec l\'indicatif du pays : 241 pour le Gabon']
];

const CHECKS = [
  'Ma photo de profil est nette (lumière du jour, fond simple)',
  'Ma galerie montre mon travail (jusqu\'à 30 photos)',
  'Mes services et mes prix de départ sont clairs',
  'J\'ai coché tous les quartiers que je couvre',
  'Mon lien WhatsApp ouvre bien ma conversation',
  'J\'ai relu mes textes et corrigé les fautes',
  'J\'ai partagé mon lien en statut WhatsApp, sur Facebook et TikTok',
  'J\'ai partagé mon lien à au moins 10 personnes'
];

const MESSAGES = [
  ['Statut WhatsApp ou groupe',
    'Bonjour tout le monde ! Je lave votre linge, lessive ou vaisselle à domicile à [quartier], dès [prix] FCFA. Pour commander, un clic : [votre lien]. Partagez autour de vous, merci !'],
  ['Phrase de présentation (profil, bio)',
    'Laveur à domicile à [quartier]. Linge, lessive, vaisselle dès [prix] FCFA. Voir mes photos et commander : [votre lien]'],
  ['Message à envoyer à un particulier',
    'Bonjour [prénom], je lave à domicile dans votre quartier. Vous pouvez voir mes tarifs et mes photos ici : [votre lien]. Dites-moi ce qui vous convient, je vous réponds directement.']
];

const ERREURS = [
  ['Le profil est lent à charger', 'Évitez les photos en double : l\'application réduit déjà chaque photo, mais 30 photos identiques ne servent à rien.'],
  ['Le bouton WhatsApp ne marche pas', 'Vérifiez l\'indicatif (241), supprimez les espaces et le signe +, puis recopiez le lien entier.'],
  ['Les particuliers ne comprennent pas ce que vous faites', 'Une phrase : ce que vous lavez + pour qui + où.'],
  ['Vos prix manquent', 'Un profil sans prix fait fuir. Affichez au moins « à partir de … FCFA ».'],
  ['Personne ne vous contacte', 'Partagez votre lien chaque jour pendant 7 jours avant de conclure que ça ne marche pas.'],
  ['Vous avez oublié d\'enregistrer', 'Touchez « Enregistrer » après chaque changement de profil ou de tarifs.']
];

function lire() {
  try { return JSON.parse(localStorage.getItem(CLE) || '[]'); } catch (e) { return []; }
}
function ecrire(v) {
  try { localStorage.setItem(CLE, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ }
}

async function copier(texte) {
  try {
    await navigator.clipboard.writeText(texte);
  } catch (e) {
    const t = document.createElement('textarea');
    t.value = texte; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); } catch (err) { /* ignore */ }
    t.remove();
  }
  toast('Copié.', 'ok');
}

// Lien WhatsApp : https://wa.me/241XXXXXXXX?text=...
export function lienWhatsApp(numero, message) {
  let n = String(numero || '').replace(/\D/g, '');
  if (!n) return '';
  if (!n.startsWith('241')) n = '241' + n.replace(/^0+/, '');
  const txt = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${n}${txt}`;
}

export default async function guide(el) {
  const cochees = lire();
  el.innerHTML = `
    <section class="card guide">
      <h1>Guide du laveur</h1>
      <p class="muted">Réussir sur ${esc(APP.nomLong)} : un profil clair, de bonnes photos, un bouton WhatsApp et un lien à partager.</p>
      <div class="actions">
        <a class="btn primary small" href="./guide-creer-son-site.pdf" download>Télécharger le guide complet (PDF)</a>
      </div>
    </section>

    <section class="card guide">
      <h2>1. Préparez 5 éléments</h2>
      <p class="muted">Notez-les dans votre téléphone avant de remplir votre profil.</p>
      <ol>${ELEMENTS.map(([t, d]) => `<li><b>${esc(t)}</b> : ${esc(d)}</li>`).join('')}</ol>
    </section>

    <section class="card guide">
      <h2>2. De bonnes photos</h2>
      <ul>
        <li>Photographiez près d'une fenêtre, en pleine lumière du jour, sur un fond simple.</li>
        <li>Nettoyez l'objectif avec un chiffon avant la photo : c'est la différence la plus visible.</li>
        <li>Montrez votre travail : linge plié, vaisselle propre, avant et après.</li>
        <li>Photo de profil et galerie (30 photos maximum) : <a href="#/photos">Mes photos</a>.</li>
      </ul>
    </section>

    <section class="card guide">
      <h2>3. Des prix clairs</h2>
      <p>Un profil sans prix fait fuir les particuliers. Affichez vos tarifs de départ, par exemple « linge à partir de 500 FCFA le kilo ». Les prix de référence de ${esc(APP.nomLong)} figurent dans le tableau « Services et prix de départ » de l'accueil.</p>
    </section>

    <section class="card guide wa">
      <h2>4. Votre lien WhatsApp</h2>
      <p class="muted">Entrez votre numéro, sans l'indicatif ni le zéro de tête si possible. Le lien ouvre une conversation avec vous en un clic.</p>
      <label>Votre numéro WhatsApp
        <input id="num" type="tel" inputmode="tel" placeholder="Ex. 60 14 19 24" autocomplete="tel"></label>
      <label>Message de départ (facultatif)
        <input id="msg" type="text" value="Bonjour, je souhaite faire laver mon linge"></label>
      <p class="copybox" id="res">Entrez votre numéro pour voir le lien.</p>
      <div class="actions">
        <button class="btn primary small" type="button" id="cp" disabled>Copier le lien</button>
        <a class="btn ghost small" id="test" href="#/guide" target="_blank" rel="noopener" hidden>Tester le lien</a>
      </div>
      <p class="muted">Test obligatoire : touchez « Tester le lien ». WhatsApp doit s'ouvrir avec votre numéro. Sinon, revoyez les chiffres.</p>
    </section>

    <section class="card guide">
      <h2>5. Faites connaître votre lien</h2>
      <ul>
        <li><b>WhatsApp</b> : mettez-le dans votre profil Business ou vos « Infos », publiez-le en statut, envoyez-le à vos contacts actuels.</li>
        <li><b>Facebook</b> : ajoutez-le dans la section « À propos » et épinglez une publication avec une photo.</li>
        <li><b>TikTok</b> : mettez-le dans votre bio et terminez chaque vidéo par « Le lien est dans ma bio ».</li>
        <li><b>Une habitude simple</b> : pendant 7 jours, publiez chaque jour une photo ou une vidéo avec votre lien.</li>
        <li><b>Le bouche-à-oreille</b> : demandez à vos 5 meilleurs contacts de partager votre lien.</li>
      </ul>
    </section>

    <section class="card guide">
      <h2>Textes prêts à copier</h2>
      ${MESSAGES.map(([t, m], i) => `
        <div class="copybox"><b>${esc(t)}</b><br>${esc(m)}</div>
        <button class="btn ghost small" type="button" data-m="${i}">Copier ce texte</button>`).join('')}
      <p class="muted">Remplacez ce qui est entre crochets avant d'envoyer.</p>
    </section>

    <section class="card guide">
      <h2>Les erreurs fréquentes</h2>
      ${ERREURS.map(([p, s]) => `<article class="item"><h3>${esc(p)}</h3><p class="muted">${esc(s)}</p></article>`).join('')}
    </section>

    <section class="card guide checks">
      <h2>Ma check-list <span class="muted" id="cc"></span></h2>
      ${CHECKS.map((c, i) => `<label><input type="checkbox" data-c="${i}" ${cochees.includes(i) ? 'checked' : ''}> <span>${esc(c)}</span></label>`).join('')}
    </section>

    <section class="card guide">
      <p class="muted">Guide original : Patrick Bertin, ${esc(APP.studio)}. Adapté pour ${esc(APP.nomLong)}.</p>
    </section>`;

  const $ = (s) => el.querySelector(s);

  function maj() {
    const n = $('#num').value.trim();
    const lien = lienWhatsApp(n, $('#msg').value.trim());
    $('#res').textContent = lien || 'Entrez votre numéro pour voir le lien.';
    $('#cp').disabled = !lien;
    const t = $('#test');
    t.hidden = !lien;
    if (lien) t.href = lien;
  }
  $('#num').addEventListener('input', maj);
  $('#msg').addEventListener('input', maj);
  $('#cp').addEventListener('click', () => { const l = lienWhatsApp($('#num').value, $('#msg').value.trim()); if (l) copier(l); });

  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-m]');
    if (b) copier(MESSAGES[Number(b.dataset.m)][1]);
  });

  function compter() {
    $('#cc').textContent = `(${el.querySelectorAll('[data-c]:checked').length}/${CHECKS.length})`;
  }
  el.querySelectorAll('[data-c]').forEach((c) => c.addEventListener('change', () => {
    ecrire([...el.querySelectorAll('[data-c]:checked')].map((x) => Number(x.dataset.c)));
    compter();
  }));
  compter();
}
