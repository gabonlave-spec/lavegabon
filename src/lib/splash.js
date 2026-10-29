import '../styles/splash.css';

const COL = [['L', '#E8FFF1'], ['A', '#FFD23F'], ['V', '#79ADFF']];
const MIN = 4300;   // duree minimale de l'animation (ms)
const MAX = 8000;   // on ferme quand meme apres ce delai (ms)

function scene() {
  const delaiCol = [0.45, 0.2, 0, 0, 0.2, 0.45];
  const dureeCol = [2.6, 2.3, 2.2, 2.4, 2.5, 2.7];
  const cols = delaiCol.map((d, i) =>
    `<rect class="sp-col" x="${i * 60}" y="0" width="61" height="640" style="animation-delay:${(0.8 + d).toFixed(2)}s;animation-duration:${dureeCol[i]}s"/>`).join('');
  const gouttes = [[26, 1.2, 7], [66, 1.0, 11], [110, 0.9, 6], [148, 0.8, 13], [182, 0.8, 9], [214, 0.85, 12], [252, 1.0, 7], [292, 1.1, 10], [334, 1.3, 6]]
    .map(([x, d, w]) => `<path class="sp-drip" d="M${x} ${Math.round(92 + Math.abs(x - 180) * 0.35)} V 700" style="animation-delay:${(d + 0.3).toFixed(2)}s;stroke-width:${w}"/>`).join('');
  const gouttelettes = [[-34, -22], [-20, -42], [-6, -50], [12, -46], [28, -36], [40, -18], [-42, 4], [42, 6], [-30, 26], [30, 28]]
    .map(([dx, dy], i) => `<circle class="sp-dr" cx="180" cy="92" r="3.5" style="--dx:${dx}px;--dy:${dy}px;--d:${(0.55 + i * 0.04).toFixed(2)}s"/>`).join('');
  const ronds = [0.55, 0.8, 1.05].map((d) => `<circle class="sp-ring" cx="180" cy="92" r="8" style="--d:${d}s"/>`).join('');
  const lettres = COL.map(([l, c], i) => `<span style="color:${c};animation-delay:${(2.5 + i * 0.15).toFixed(2)}s">${l}</span>`).join('');

  return `<svg class="sp-svg" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><pattern id="sp-br" width="60" height="40" patternUnits="userSpaceOnUse">
        <rect width="60" height="40" fill="#9a5a46"/>
        <path d="M0 0H60M0 20H60M0 40H60M0 0V20M30 20V40" stroke="#c9a08f" stroke-width="2" fill="none" opacity=".7"/>
      </pattern></defs>
      <rect width="360" height="640" fill="url(#sp-br)"/>
      ${cols}${gouttes}
      <path class="sp-jet sp-j1" pathLength="1" d="M-30 330 Q 60 60 180 92"/>
      <path class="sp-jet sp-j2" pathLength="1" d="M-30 330 Q 60 60 180 92"/>
      ${ronds}${gouttelettes}
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
      setTimeout(() => ov.remove(), 700);
    };
    ov.addEventListener('click', fermer);

    // L'accueil est considere pret quand la liste des laveurs a fini de charger.
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
