// Arrondissements du Grand Libreville (sources : Journal officiel, decret 2013, Wikivoyage).
// Modifiable : un quartier ne doit apparaitre que dans UN arrondissement.
export const ARR = {
 "Libreville|1": [
  "Louis",
  "Batterie IV",
  "Charbonnages",
  "Sotega",
  "Gué-Gué",
  "Gros Bouquet",
  "Quaben",
  "Vallée Sainte-Marie",
  "Derrière la Prison",
  "Alibandeng",
  "Ambowè",
  "Camp de Gaulle",
  "Trois Quartiers",
  "Bel-Air",
  "Ongongo",
  "Camp des Boys",
  "Oloumi",
  "Rio",
  "Kalikak"
 ],
 "Libreville|2": [
  "Nkembo",
  "Mont-Bouët",
  "Montagne Sainte",
  "Port-Môle",
  "Cocotiers",
  "Atong Abè",
  "Akémindjogoni",
  "Sorbonne",
  "Sainte-Anne",
  "Abénélang",
  "Cinq Palmiers",
  "Carrefour Hassan",
  "La Campagne"
 ],
 "Libreville|3": [
  "Centre-ville",
  "Glass",
  "Nombakélé",
  "Petit Paris",
  "Akébé",
  "Akébé Ville",
  "Akébé Plaine",
  "Akébé Frontière",
  "Pont d'Akébé",
  "Derrière l'Hôpital",
  "Avenue de Cointet",
  "La Peyrie",
  "Peyrie Dakar",
  "Likouala",
  "Venez-Voir",
  "Belle-Vue",
  "Kinguélé",
  "Awendjé",
  "STFO"
 ],
 "Libreville|4": [
  "London",
  "Nombakélé Sud",
  "Batavéa",
  "Saint-Michel",
  "Plaine Niger",
  "Belles-Peintures",
  "Dragon",
  "Cosmopark",
  "Terre Nouvelle",
  "PK5",
  "PK6",
  "PK7",
  "PK8"
 ],
 "Libreville|5": [
  "Lalala",
  "Lalala Dakar",
  "Plein Ciel",
  "Cité Damas",
  "Bisségué",
  "Beau-Séjour",
  "FOPI",
  "Mindoubé",
  "IAI",
  "Golf",
  "Ozangué",
  "Melen ENA",
  "Nzeng-Miang",
  "Malaba",
  "ACAE",
  "SODUCO",
  "INJS",
  "Bangos"
 ],
 "Libreville|6": [
  "Nzeng-Ayong",
  "Ondogo",
  "Montalier",
  "Sibang",
  "Bambou-Chine",
  "PK9",
  "PK10",
  "PK11",
  "PK12"
 ],
 "Akanda|1": [
  "Cap Estérias",
  "Beaulieu",
  "1er Campement",
  "Cap Santa Clara"
 ],
 "Akanda|2": [
  "Akanda",
  "Angondjé",
  "Okala",
  "Sablière",
  "Avorbam",
  "Delta Postal",
  "Gigi",
  "Sherko",
  "Entraco",
  "Cap Caravane",
  "Cité Amissa"
 ],
 "Owendo|1": [
  "Owendo",
  "Owendo Port",
  "Petit Village",
  "Cité SNI",
  "Cité OCTRA",
  "Cité Comilog",
  "Razel",
  "Sogadel",
  "Aérodrome"
 ],
 "Owendo|2": [
  "Akournam",
  "Ewoumié",
  "Alénakiri",
  "Awoungou",
  "Virié",
  "Service Civique"
 ]
};
export const ARR_VILLE = {
 "Libreville|1": "Libreville",
 "Libreville|2": "Libreville",
 "Libreville|3": "Libreville",
 "Libreville|4": "Libreville",
 "Libreville|5": "Libreville",
 "Libreville|6": "Libreville",
 "Akanda|1": "Akanda",
 "Akanda|2": "Akanda",
 "Owendo|1": "Owendo",
 "Owendo|2": "Owendo"
};
export const ARR_LABEL = {
 "Libreville|1": "1er arr.",
 "Libreville|2": "2e arr.",
 "Libreville|3": "3e arr.",
 "Libreville|4": "4e arr.",
 "Libreville|5": "5e arr.",
 "Libreville|6": "6e arr.",
 "Akanda|1": "1er arr.",
 "Akanda|2": "2e arr.",
 "Owendo|1": "1er arr.",
 "Owendo|2": "2e arr."
};
const CENTRES = {
 "Libreville|1": [
  0.41,
  9.445
 ],
 "Libreville|2": [
  0.4,
  9.462
 ],
 "Libreville|3": [
  0.383,
  9.456
 ],
 "Libreville|4": [
  0.372,
  9.46
 ],
 "Libreville|5": [
  0.415,
  9.475
 ],
 "Libreville|6": [
  0.43,
  9.5
 ],
 "Akanda|1": [
  0.6,
  9.39
 ],
 "Akanda|2": [
  0.53,
  9.49
 ],
 "Owendo|1": [
  0.29,
  9.495
 ],
 "Owendo|2": [
  0.3,
  9.52
 ]
};
export const VILLES = {};
for (const k of Object.keys(ARR)) {
  const v = ARR_VILLE[k];
  if (!VILLES[v]) VILLES[v] = [];
  VILLES[v].push(...ARR[k]);
}
// Position approximative d'un quartier = centre de son arrondissement
export function coordDe(q) {
  const k = Object.keys(ARR).find((x) => ARR[x].includes(q));
  return k ? CENTRES[k] : null;
}
