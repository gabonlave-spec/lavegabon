import { APP } from '../config/constants.js';

export default function apropos(el) {
  el.innerHTML = `
    <section class="card">
      <h1>À propos et contact</h1>
      <p><b>${APP.nom}</b> (${APP.nomLong}) met en relation les personnes qui veulent faire laver leur linge, leur lessive ou leur vaisselle à domicile avec des laveurs disponibles près de chez elles.</p>
      <p class="slogan-sm">${APP.slogan}</p>
      <ul class="contact">
        <li>E-mail : <a href="mailto:${APP.email}">${APP.email}</a></li>
        <li>Téléphone : <a href="tel:${APP.telephoneLien}">${APP.telephone}</a></li>
        <li><a href="https://wa.me/${APP.telephoneLien.replace('+', '')}">Écrire sur WhatsApp</a></li>
      </ul>
      <p class="muted">Application développée par le studio ${APP.studio}.</p>
    </section>`;
}
