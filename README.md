<div align="center">

# 🍔 FoodieSpot

### Application mobile de commande de repas — React Native & Expo

**Réalisé par [KoRaNé](https://github.com/TcKoRaNe) — Kouamo Randy Neil**
*ESTIAM E4 — Année académique 2025/2026*

---

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

</div>

---

## 📱 Aperçu

FoodieSpot est une application mobile complète de commande de repas, inspirée d'Uber Eats. Elle permet aux utilisateurs de découvrir des restaurants, commander des plats, suivre leurs livraisons en temps réel et gérer leur profil.

---

## 🚀 Lancer le projet

### Prérequis
- Node.js 18+
- Expo Go sur votre téléphone (iOS ou Android)
- Les deux appareils sur le même réseau Wi-Fi

### 1. Cloner le repo
```bash
git clone https://github.com/TcKoRaNe/estiam-e4-react-native.git
cd estiam-e4-react-native
git checkout foodiespot-fullstack
```

### 2. Lancer le backend
```bash
cd foodiespot-backend
npm install
npm start
# Le serveur démarre sur http://localhost:4000
```

### 3. Configurer l'IP locale
Dans `foodie-spot/constants/config.ts`, remplacez l'IP par la vôtre :
```typescript
// Trouvez votre IP avec : ipconfig (Windows) ou ifconfig (Mac/Linux)
API_URL: 'http://VOTRE_IP_LOCALE:4000/',
```

### 4. Lancer l'application
```bash
cd foodie-spot
npm install
npx expo start --clear
```
Scannez le QR code avec **Expo Go** sur votre téléphone.

---

## 🏗️ Architecture du projet

```
foodie-spot/
├── app/                          # Écrans (Expo Router)
│   ├── _layout.tsx               # Layout racine + Navigation Guard
│   ├── onboarding.tsx            # Onboarding premier lancement ✨
│   ├── cart.tsx                  # Panier
│   ├── checkout.tsx              # Validation commande + Code promo ✨
│   ├── addresses.tsx             # Gestion adresses
│   ├── (auth)/
│   │   ├── login.tsx             # Connexion
│   │   └── register.tsx          # Inscription
│   ├── (tabs)/
│   │   ├── index.tsx             # Accueil
│   │   ├── search.tsx            # Recherche + Vocal + Historique ✨
│   │   ├── orders.tsx            # Mes commandes
│   │   ├── profile.tsx           # Profil + Dark Mode
│   │   └── notifications.tsx     # Notifications
│   ├── restaurant/[id].tsx       # Détail restaurant + Estimation livraison ✨
│   ├── dish/[id].tsx             # Détail plat
│   ├── tracking/[orderId].tsx    # Suivi commande temps réel
│   └── review/[orderId].tsx      # Laisser un avis
├── contexts/
│   ├── auth-context.tsx          # Authentification globale
│   ├── cart-context.tsx          # Panier global (reducer + persistance)
│   └── theme-context.tsx         # Thème clair/sombre/système
├── services/
│   ├── api.ts                    # Tous les appels API (axios)
│   ├── storage.ts                # AsyncStorage wrapper
│   ├── location.ts               # Géolocalisation GPS
│   └── cache.ts                  # Cache offline
├── components/                   # Composants réutilisables
├── constants/
│   └── theme.ts                  # Palette de couleurs
└── types/
    └── index.ts                  # Types TypeScript partagés
```

---

## ✨ Fonctionnalités innovantes implémentées

### 1. 🎬 Onboarding au premier lancement
- 3 slides animés présentant l'application
- Dots animés avec `Animated.Value` synchronisés au scroll
- Persistance via `AsyncStorage` — ne s'affiche qu'une seule fois
- Bouton "Passer" pour les utilisateurs pressés
- Couleurs d'accent différentes par slide

**Justification :** L'onboarding améliore significativement le taux de rétention. Un utilisateur qui comprend l'application dès le premier lancement est plus susceptible de l'utiliser régulièrement.

---

### 2. 🎤 Recherche vocale
- Bouton microphone intégré dans la barre de recherche
- Enregistrement audio via `expo-av`
- Arrêt automatique après 4 secondes
- Bandeau visuel d'écoute active
- Injection automatique du résultat dans le champ de recherche
- Architecture prête pour Google Speech-to-Text ou Whisper API

**Justification :** La recherche vocale améliore l'accessibilité et la rapidité d'utilisation, particulièrement utile en mobilité (dans les transports, les mains occupées).

---

### 3. 🕐 Historique de recherches + Suggestions
- Sauvegarde des dernières recherches dans `AsyncStorage`
- Affichage sous la barre de recherche quand le champ est vide
- Suggestions auto-complétées en temps réel depuis l'API (`GET /search/suggestions`)
- Suppression individuelle ou globale de l'historique
- Debounce 400ms pour limiter les appels réseau

**Justification :** L'historique réduit la friction pour les recherches répétées. Les suggestions guident l'utilisateur vers du contenu pertinent et augmentent l'engagement.

---

### 4. 📍 Estimation dynamique temps et coût de livraison
- Récupération des coordonnées GPS de l'utilisateur via `expo-location`
- Appel à `GET /restaurants/:id/delivery-estimate` avec les coordonnées
- Affichage : temps estimé, distance, frais de livraison, seuil livraison gratuite
- Mise à jour en temps réel selon l'adresse de livraison sélectionnée
- Fallback gracieux si GPS non disponible

**Justification :** La transparence sur les frais et délais de livraison est un facteur clé dans la décision de commander. Afficher ces informations avant la commande réduit les abandons de panier.

---

### 5. 💰 Code promo interactif
- Champ de saisie avec validation en temps réel via `POST /promos/validate`
- Affichage dynamique du montant de la réduction avant confirmation
- Gestion des types de réduction : pourcentage, montant fixe, livraison gratuite
- Messages d'erreur clairs (code invalide, montant minimum non atteint, expiré)
- Suppression facile du code appliqué
- Intégré au récapitulatif de commande avec calcul du total en temps réel

**Justification :** Les codes promo sont un levier marketing puissant pour la fidélisation et l'acquisition. Une UX fluide sur cette fonctionnalité augmente le taux de conversion.

---

## 🔧 Améliorations techniques réalisées

### Bugs corrigés
| Fichier | Bug | Correction |
|--------|-----|-----------|
| `notifications.tsx` | `useEffect` sans dépendances = boucle infinie | Ajout de `[]` |
| `use-notifications.ts` | `Promise.all` avec destructuration incorrecte | Alignement des variables |
| `search.tsx` | Appel API à chaque frappe | Debounce 400ms |
| `search.tsx` | Filtres catégories hardcodés | Chargement depuis `GET /categories` |
| `restaurant/[id].tsx` | Boutons Itinéraire/Appeler inertes | `Linking.openURL` Maps + tel |
| `restaurant/[id].tsx` | Bouton Share appelait toggleFavorite | `Share.share()` natif |
| `types/index.ts` | Typo `resurantId` | Corrigé → `restaurantId` |

### Bonnes pratiques appliquées
- ✅ Séparation des responsabilités (services, contexts, components)
- ✅ Typage TypeScript renforcé sur tous les modèles
- ✅ Gestion d'erreurs user-friendly (toasts, alerts)
- ✅ États de chargement sur tous les écrans (ActivityIndicator)
- ✅ États vides avec illustrations
- ✅ `FlatList` au lieu de `ScrollView + .map()` pour les performances
- ✅ Alias `@/` pour tous les imports (pas de `../../`)
- ✅ Dark mode complet via `ThemeContext`
- ✅ Support offline avec cache local

---

## 🔑 Endpoints API utilisés

```
Backend : http://localhost:4000

Auth
POST /auth/login               Connexion
POST /auth/register            Inscription
POST /auth/refresh             Refresh token

Restaurants
GET  /restaurants              Liste avec filtres
GET  /restaurants/:id          Détail restaurant
GET  /restaurants/:id/menu     Menu par catégories
GET  /restaurants/:id/reviews  Avis
GET  /restaurants/:id/delivery-estimate  Estimation livraison
GET  /categories               Catégories cuisine

Commandes
GET  /orders                   Mes commandes
POST /orders                   Créer une commande
GET  /orders/:id               Détail commande
GET  /orders/:id/track         Suivi en temps réel

Autres
POST /promos/validate          Valider code promo
GET  /search/suggestions       Suggestions de recherche
POST /reviews                  Créer un avis
POST /uploads                  Upload photo
```

---

## 📦 Dépendances principales

```json
{
  "expo": "~52.0.0",
  "expo-router": "~4.0.0",
  "expo-location": "~18.0.0",
  "expo-av": "~15.0.0",
  "expo-image-picker": "~16.0.0",
  "react-native-reanimated": "~3.16.0",
  "@react-native-async-storage/async-storage": "^2.1.0",
  "axios": "^1.7.0",
  "lucide-react-native": "^0.475.0"
}
```

---



---

<div align="center">

**Fait avec ❤️ par [KoRaNé](https://github.com/TcKoRaNe) — Kouamo Randy Neil**

*ESTIAM Paris — Promotion 2025/2026*

</div>
