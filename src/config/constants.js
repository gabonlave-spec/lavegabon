export const APP = {
  nom: 'LAV',
  nomLong: 'Lavegabon',
  abrev: 'LAV',
  slogan: 'Du propre, chez vous.',
  studio: 'PC-INFORMATIQUE',
  email: 'gabonlave@gmail.com',
  telephone: '+241 60 14 19 24',
  telephoneLien: '+24160141924',
  devise: 'FCFA',
  // Relais Cloudflare Worker des notifications (phase 6)
  relaisUrl: ''
};

// Photos : compte Cloudinary. Ces deux valeurs ne sont pas secretes (preset NON signe).
export const CLOUDINARY = {
  cloudName: 'lcl4hdv8',
  preset: 'lav_unsigned'
};

// Liens officiels (GitHub). Le proprietaire du depot est a ajuster si besoin.
export const LIENS = {
  github: 'https://github.com/gabonlave-spec/lavegabon',
  site: 'https://gabonlave-spec.github.io/lavegabon/'
};

// Prix de reference (FCFA) a ajuster. Le laveur pourra fixer ses propres tarifs.
export const SERVICES = [
  { id: 'linge',     label: 'Linge et vêtements', unites: ['kg', 'pièce'], prixRef: { kg: 500,  'pièce': 300 } },
  { id: 'lessive',   label: 'Lessive complète (lavage + séchage)', unites: ['kg'], prixRef: { kg: 800 } },
  { id: 'vaisselle', label: 'Vaisselle', unites: ['lot', 'pièce'], prixRef: { lot: 1500, 'pièce': 100 } },
  { id: 'lingerie',  label: 'Lingerie et délicats', unites: ['pièce'], prixRef: { 'pièce': 400 } },
  { id: 'nettoyage', label: 'Nettoyage de la maison', unites: ['pièce'], prixRef: { 'pièce': 3000 } }
];

export const SUPPLEMENT_URGENT = 1000;

export const QUARTIERS = [
  "1er Campement", "Abénélang", "ACAE", "Aérodrome", "Akanda",
  "Akébé", "Akébé Frontière", "Akébé Plaine", "Akébé Ville", "Akémindjogoni",
  "Akournam", "Alénakiri", "Alibandeng", "Ambowè", "Angondjé",
  "Atong Abè", "Avenue de Cointet", "Avorbam", "Awendjé", "Awoungou",
  "Bambou-Chine", "Bangos", "Batavéa", "Batterie IV", "Beau-Séjour",
  "Beaulieu", "Bel-Air", "Belle-Vue", "Belles-Peintures", "Bisségué",
  "Camp de Gaulle", "Camp des Boys", "Cap Caravane", "Cap Estérias", "Cap Santa Clara",
  "Carrefour Hassan", "Centre-ville", "Charbonnages", "Cinq Palmiers", "Cité Amissa",
  "Cité Comilog", "Cité Damas", "Cité OCTRA", "Cité SNI", "Cocotiers",
  "Cosmopark", "Delta Postal", "Derrière l'Hôpital", "Derrière la Prison", "Dragon",
  "Entraco", "Ewoumié", "FOPI", "Gigi", "Glass",
  "Golf", "Gros Bouquet", "Gué-Gué", "IAI", "INJS",
  "Kalikak", "Kinguélé", "La Campagne", "La Peyrie", "Lalala",
  "Lalala Dakar", "Likouala", "London", "Louis", "Malaba",
  "Melen ENA", "Mindoubé", "Mont-Bouët", "Montagne Sainte", "Montalier",
  "Nkembo", "Nombakélé", "Nombakélé Sud", "Nzeng-Ayong", "Nzeng-Miang",
  "Okala", "Oloumi", "Ondogo", "Ongongo", "Owendo",
  "Owendo Port", "Ozangué", "Petit Paris", "Petit Village", "Peyrie Dakar",
  "PK10", "PK11", "PK12", "PK5", "PK6",
  "PK7", "PK8", "PK9", "Plaine Niger", "Plein Ciel",
  "Pont d'Akébé", "Port-Môle", "Quaben", "Razel", "Rio",
  "Sablière", "Saint-Michel", "Sainte-Anne", "Service Civique", "Sherko",
  "Sibang", "SODUCO", "Sogadel", "Sorbonne", "Sotega",
  "STFO", "Terre Nouvelle", "Trois Quartiers", "Vallée Sainte-Marie", "Venez-Voir",
  "Virié", "Autre"
];

export const STATUTS = {
  en_attente: { label: 'En attente', classe: 'wait' },
  acceptee:   { label: 'Acceptée',   classe: 'ok' },
  en_cours:   { label: 'En cours',   classe: 'run' },
  terminee:   { label: 'Terminée',   classe: 'done' },
  annulee:    { label: 'Annulée',    classe: 'off' }
};

export const serviceParId = (id) => SERVICES.find((s) => s.id === id);
