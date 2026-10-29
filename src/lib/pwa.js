// Installation de l'appli (PWA) : Android/Chrome = fenetre native, iPhone = guide en 3 etapes.
let evt = null;
const ua = navigator.userAgent || '';
const estIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const estSafari = /safari/i.test(ua) && !/crios|fxios|edgios|opios|chrome|android/i.test(ua);
const CLE = 'lav-install-masque';

const SVG = (d) => '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
const IC_PARTAGER = SVG('<path d="M12 15V3"/><path d="M8 7l4-4 4 4"/><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/>');
const IC_ECRAN = SVG('<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>');
const IC_AJOUTER = SVG('<rect x="3" y="7" width="18" height="10" rx="5"/><path d="M8 12l3 3 5-6"/>');

const CSS = `
html:not(.lav-peut-installer) [data-lav-install]{display:none!important}
#lav-install-flot{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(80px + env(safe-area-inset-bottom,0px));z-index:9998;display:flex;align-items:center;background:#0B63C5;color:#fff;border-radius:999px;box-shadow:0 6px 20px rgba(0,0,0,.25);font:600 14px system-ui,sans-serif;white-space:nowrap}
#lav-install-flot[hidden]{display:none}
#lav-install-flot button{border:0;background:none;color:inherit;font:inherit;cursor:pointer}
#lav-install-flot .go{padding:12px 8px 12px 18px}
#lav-install-flot .x{padding:12px 16px 12px 8px;opacity:.8;font-size:16px;line-height:1}
#lav-guide{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center}
#lav-guide .carte{background:#fff;color:#12263f;width:100%;max-width:480px;border-radius:20px 20px 0 0;padding:20px 20px calc(20px + env(safe-area-inset-bottom,0px));font:15px/1.4 system-ui,sans-serif}
#lav-guide h3{margin:0 0 12px;font-size:18px}
#lav-guide ol{list-style:none;margin:0 0 14px;padding:0}
#lav-guide li{display:flex;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid #e3ecf7}
#lav-guide .ic{flex:none;width:48px;height:48px;border-radius:12px;background:#EAF3FD;color:#0B63C5;display:flex;align-items:center;justify-content:center}
#lav-guide .n{font-weight:700;color:#0B63C5}
#lav-guide .ok{width:100%;border:0;border-radius:12px;background:#0B63C5;color:#fff;padding:12px;font:600 15px system-ui,sans-serif;cursor:pointer}
#lav-guide .note{font-size:13px;color:#5b6b80;margin:0 0 12px}
`;

function dejaInstallee() {
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
}
function masque() {
  try { return Date.now() - Number(localStorage.getItem(CLE) || 0) < 7 * 864e5; } catch (e) { return false; }
}
function peut() { return !dejaInstallee() && (!!evt || estIOS); }

function maj() {
  const ok = peut();
  document.documentElement.classList.toggle('lav-peut-installer', ok);
  const b = document.getElementById('lav-install-flot');
  if (b) b.hidden = !ok || masque();
}

function fermerGuide() {
  const g = document.getElementById('lav-guide');
  if (g) g.remove();
}
function ouvrirGuide(html) {
  fermerGuide();
  const d = document.createElement('div');
  d.id = 'lav-guide';
  d.innerHTML = '<div class="carte" role="dialog" aria-modal="true">' + html + '<button class="ok" type="button">J\'ai compris</button></div>';
  d.addEventListener('click', (e) => {
    if (e.target === d || (e.target.classList && e.target.classList.contains('ok'))) fermerGuide();
  });
  document.body.appendChild(d);
}

function guideIOS() {
  const note = estSafari ? '' : '<p class="note">Pour installer l\'appli, ouvre cette page dans <b>Safari</b>.</p>';
  ouvrirGuide(
    '<h3>Installer LAV sur ton iPhone</h3>' + note + '<ol>' +
    '<li><span class="ic">' + IC_PARTAGER + '</span><span><span class="n">1.</span> Touche le bouton <b>Partager</b> en bas de Safari</span></li>' +
    '<li><span class="ic">' + IC_ECRAN + '</span><span><span class="n">2.</span> Choisis <b>Sur l\'écran d\'accueil</b></span></li>' +
    '<li><span class="ic">' + IC_AJOUTER + '</span><span><span class="n">3.</span> Touche <b>Ajouter</b> en haut à droite</span></li>' +
    '</ol>'
  );
}
function guideGenerique() {
  ouvrirGuide('<h3>Installer LAV</h3><p>Ouvre le menu du navigateur (<b>⋮</b>) puis choisis <b>Installer l\'application</b> ou <b>Ajouter à l\'écran d\'accueil</b>.</p>');
}

export async function installer() {
  if (evt) {
    const e = evt;
    evt = null;
    try { e.prompt(); await e.userChoice; } catch (err) {}
    maj();
    return;
  }
  if (estIOS) { guideIOS(); return; }
  guideGenerique();
}
window.lavInstall = installer;

window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); evt = e; maj(); });
window.addEventListener('appinstalled', () => { evt = null; fermerGuide(); maj(); });
document.addEventListener('click', (e) => {
  const t = e.target && e.target.closest && e.target.closest('[data-lav-install]');
  if (t) { e.preventDefault(); document.body.classList.remove('menu-open'); installer(); }
});

function init() {
  const st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);
  const b = document.createElement('div');
  b.id = 'lav-install-flot';
  b.hidden = true;
  b.innerHTML = '<button type="button" class="go">📲 Installer l\'application</button><button type="button" class="x" aria-label="Masquer">✕</button>';
  b.querySelector('.go').addEventListener('click', installer);
  b.querySelector('.x').addEventListener('click', () => {
    try { localStorage.setItem(CLE, String(Date.now())); } catch (e) {}
    maj();
  });
  // bouton flottant retire : accueil + menu
  maj();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
