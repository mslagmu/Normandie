# Normandie · Plages du Débarquement (6 Juin 1944)

Carte interactive et guide de visite des plages du Débarquement en Normandie (**Utah**, **Pointe du Hoc & Secteur Aéroporté**, **Omaha**, **Gold**, **Juno**, **Sword**), avec découverte des sites historiques et planificateur d’itinéraire routier via Google Maps Platform.

---

## Fonctionnalités

- **Carte interactive du littoral normand** (`@vis.gl/react-google-maps`, marqueurs cartographiques `AdvancedMarker`, modes Plan / Satellite / Relief).
- **Recherche et filtrage des lieux à visiter** via **Places API (New)** (`Place.searchByText`) : plages, musées, mémoriaux, cimetières et batteries côtières triés d’Ouest en Est.
- **Fiches détaillées** : photographie, adresse, note Google, résumé, horaires d’ouverture et lien direct Google Maps.
- **Planificateur de circuit routier** via **Routes API** (`Route.computeRoutes`) : ajout/réorganisation d’étapes, génération automatique d’un parcours Ouest → Est, tracé sur carte, distance totale et durée de conduite estimée.

---

## Prérequis

- **Node.js** `v20` ou supérieur (avec `npm`)
- Un projet **Google Cloud** avec une clé API Google Maps Platform ayant activé les API suivantes :
  - **Maps JavaScript API**
  - **Places API (New)**
  - **Routes API**

---

## Installation

1. **Cloner le dépôt et accéder au dossier du projet :**

   ```bash
   git clone <url-du-depot>
   cd <nom-du-dossier>
   ```

2. **Installer les dépendances :**

   ```bash
   npm install
   ```

3. **Configurer les variables d’environnement :**

   Copiez le fichier `.env.example` vers `.env` à la racine du projet :

   ```bash
   cp .env.example .env
   ```

   Renseignez ensuite votre clé Google Maps Platform dans `.env` :

   ```env
   VITE_GOOGLE_MAPS_API_KEY="VOTRE_CLE_API_GOOGLE_MAPS"
   ```

   > **Sécurité :** Ne partagez jamais votre clé API publiquement et configurez des restrictions par référent HTTP (ex. `http://localhost:3000/*` et votre domaine de production) ainsi qu’une limitation aux API activées dans la console Google Cloud.

4. **Lancer le serveur de développement :**

   ```bash
   npm run dev
   ```

   L’application sera accessible sur [http://localhost:3000](http://localhost:3000).

---

## Scripts disponibles

| Commande | Description |
| :--- | :--- |
| `npm run dev` | Lance le serveur de développement Vite sur le port `3000`. |
| `npm run build` | Génère le bundle de production dans le dossier `dist/`. |
| `npm run preview` | Prévisualise localement le build de production. |
| `npm run lint` | Vérifie les types TypeScript sans émettre de fichiers (`tsc --noEmit`). |

---

## Technologies utilisées

- **React 19** & **TypeScript**
- **Vite** & **Tailwind CSS v4**
- **Google Maps Platform** (`@vis.gl/react-google-maps`, Maps JavaScript API, Places API (New), Routes API)
- **Lucide React** pour l’iconographie
