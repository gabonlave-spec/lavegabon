import { SUPPLEMENT_URGENT, serviceParId } from '../config/constants.js';

export function prixUnitaire(serviceId, unite, tarifsLaveur) {
  if (tarifsLaveur && tarifsLaveur[serviceId] && tarifsLaveur[serviceId][unite]) {
    return Number(tarifsLaveur[serviceId][unite]);
  }
  const s = serviceParId(serviceId);
  return s && s.prixRef[unite] ? s.prixRef[unite] : 0;
}

// Prix total = quantite x prix unitaire (+ supplement urgence). Fige a la commande.
export function calculerPrix({ quantite, prixUnit, urgent }) {
  const q = Number(quantite) > 0 ? Number(quantite) : 0;
  const sousTotal = Math.round(q * prixUnit);
  const supplement = urgent ? SUPPLEMENT_URGENT : 0;
  return { sousTotal, supplement, total: sousTotal + supplement };
}
