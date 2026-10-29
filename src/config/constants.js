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
  'Louis', 'Glass', 'Mont-Bouët', 'Nombakélé', 'Akébé', 'Batterie IV', 'Lalala',
  'Sotega', 'Sablière', 'Nkembo', 'Oloumi', 'Okala', 'Angondjé', 'Akanda',
  'Owendo', 'PK5', 'PK8', 'Charbonnages', 'Montagne Sainte', 'Awendjé',
  'Cocotiers', 'Plaine Niger', 'Autre'
];

export const STATUTS = {
  en_attente: { label: 'En attente', classe: 'wait' },
  acceptee:   { label: 'Acceptée',   classe: 'ok' },
  en_cours:   { label: 'En cours',   classe: 'run' },
  terminee:   { label: 'Terminée',   classe: 'done' },
  annulee:    { label: 'Annulée',    classe: 'off' }
};

export const serviceParId = (id) => SERVICES.find((s) => s.id === id);
