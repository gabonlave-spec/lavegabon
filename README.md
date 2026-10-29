# Lavegabon (LAV) — Du propre, chez vous.

Application web installable (PWA) qui met en relation des personnes qui veulent faire laver leur linge, lessive ou vaisselle à domicile avec des laveurs de leur quartier, à Libreville puis dans tout le Gabon.

## Liens officiels

- Code : https://github.com/gabonlave-spec/lavegabon
- E-mail : gabonlave@gmail.com
- Téléphone et WhatsApp : +241 60 14 19 24

## Technologies

Vite et JavaScript, Firebase (Authentication, Firestore), Cloudinary pour les photos, hébergement Cloudflare Pages.

## Lancer en local (Termux)

```
npm install
npm run dev
```

## Sécurité

Aucune clé secrète dans ce dépôt. La configuration Firebase Web n'est pas secrète : elle est protégée par les règles Firestore (`firestore.rules`) et la liste des domaines autorisés.

Développé par le studio PC-INFORMATIQUE.
