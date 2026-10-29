import '../styles/splash.css';

const COL = [['L', '#E8FFF1'], ['A', '#FFD23F'], ['V', '#79ADFF']];
const MIN = 10000;  // duree minimale de l'animation (ms)
const MAX = 13500;  // fermeture forcee apres ce delai (ms)

// [x, y depart, taille, retard (s), duree (s), rythme a|b|c]
const GOUTTES = [
  [24, 140, 1.0, 3.8, 11, 'a'], [336, 170, 1.2, 4.4, 12, 'b'], [18, 260, 1.1, 5.2, 11, 'c'],
  [44, 320, 1.3, 4.2, 10, 'c'], [96, 360, 1.0, 5.0, 11, 'a'], [150, 330, 1.5, 5.4, 12, 'b'],
  [210, 380, 1.1, 4.6, 10, 'c'], [262, 340, 1.4, 5.8, 12, 'a'], [312, 300, 1.0, 4.8, 11, 'b'],
  [70, 450, 1.2, 6.6, 9, 'c'], [180, 430, 0.9, 6.2, 10, 'a'], [290, 470, 1.3, 7.0, 9, 'b'],
  [130, 500, 1.0, 7.4, 8, 'c'], [240, 510, 1.1, 7.2, 8, 'a']
];

function scene() {
  const gouttes = GOUTTES.map(([x, y, s, d, t, p]) => `
    <g transform="translate(${x} ${y})" class="p${p}" style="--d:${d}s;--t:${t}s">
      <rect class="sp-tr" x="${(-1.3 * s).toFixed(2)}" y="0" width="${(2.6 * s).toFixed(2)}" height="560" rx="${(1.3 * s).toFixed(2)}"/>
      <g class="sp-dp"><g transform="scale(${s})">
        <path d="M0 -11 C3 -5 6 -1 6 3 A6 6 0 0 1 -6 3 C-6 -1 -3 -5 0 -11Z" fill="url(#sp-dg)" stroke="rgba(255,255,255,.55)" stroke-width=".6"/>
        <ellipse cx="-2" cy="2" rx="1.5" ry="2.4" fill="#fff" opacity=".8"/>
      </g></g>
    </g>`).join('');
  const gouttelettes = [[-34, -22], [-20, -42], [-6, -50], [12, -46], [28, -36], [40, -18], [-42, 4], [42, 6], [-30, 26], [30, 28]]
    .map(([dx, dy], i) => `<circle class="sp-dr" cx="180" cy="92" r="3.5" style="--dx:${dx}px;--dy:${dy}px;--d:${(1 + i * 0.05).toFixed(2)}s"/>`).join('');
  const ronds = [1, 1.3, 1.6].map((d) => `<circle class="sp-ring" cx="180" cy="92" r="8" style="--d:${d}s"/>`).join('');
  const lettres = COL.map(([l, c], i) => `<span style="color:${c};animation-delay:${(5.4 + i * 0.25).toFixed(2)}s">${l}</span>`).join('');

  return `<svg class="sp-svg" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <pattern id="sp-br" width="60" height="40" patternUnits="userSpaceOnUse">
          <rect width="60" height="40" fill="#9a5a46"/>
          <path d="M0 0H60M0 20H60M0 40H60M0 0V20M30 20V40" stroke="#c9a08f" stroke-width="2" fill="none" opacity=".7"/>
        </pattern>
        <radialGradient id="sp-dg" cx="35%" cy="65%" r="75%">
          <stop offset="0" stop-color="#ffffff" stop-opacity=".95"/>
          <stop offset=".6" stop-color="#a8d6f5" stop-opacity=".78"/>
          <stop offset="1" stop-color="#5fa3dd" stop-opacity=".72"/>
        </radialGradient>
      </defs>
      <rect width="360" height="640" fill="url(#sp-br)"/>
      <g class="sp-cur"><path d="M0 -700 H360 V-10 Q340 40 320 -10 Q300 70 270 -10 Q245 30 225 -10 Q200 90 170 -10 Q150 40 125 -10 Q100 60 80 -10 Q55 25 30 -10 Q15 45 0 -10 Z" fill="rgba(20,75,165,.55)" stroke="rgba(200,232,255,.6)" stroke-width="2"/></g>
      ${gouttes}
      <g class="sp-jetg">
        <path class="sp-jet sp-j1" pathLength="1" d="M-30 330 Q 60 60 180 92"/>
        <path class="sp-jet sp-j2" pathLength="1" d="M-30 330 Q 60 60 180 92"/>
        ${ronds}${gouttelettes}
      </g>
    </svg>
    <div class="sp-brand">
      <img src="./icons/logo.svg" alt="" width="84" height="84">
      <div class="sp-name">${lettres}</div>
      <p>Du propre, chez vous.</p>
    </div>
    <div class="sp-hint">Touchez l'écran pour passer</div>`;
}

function demarrer() {
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ov = document.createElement('div');
    ov.className = 'sp';
    ov.setAttribute('role', 'img');
    ov.setAttribute('aria-label', 'LAV, du propre, chez vous');
    ov.innerHTML = scene();
    document.body.appendChild(ov);

    const t0 = performance.now();
    let fini = false;
    const fermer = () => {
      if (fini) return;
      fini = true;
      ov.classList.add('out');
      setTimeout(() => ov.remove(), 800);
    };
    ov.addEventListener('click', fermer);

    // L'accueil est pret quand la liste des laveurs a fini de charger.
    const pret = () => {
      const h = location.hash.replace(/^#/, '');
      if (h && h !== '/') return true;
      const i = document.getElementById('ann-info');
      return !!i && i.textContent.trim() !== '' && !/Chargement/.test(i.textContent);
    };
    const tick = () => {
      if (fini) return;
      const t = performance.now() - t0;
      if (t >= MAX || (t >= MIN && pret())) return fermer();
      setTimeout(tick, 150);
    };
    setTimeout(tick, MIN);
  } catch { /* l'animation ne doit jamais bloquer l'appli */ }
}

if (document.body) demarrer();
else document.addEventListener('DOMContentLoaded', demarrer);
