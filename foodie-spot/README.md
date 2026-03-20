# FoodieSpot — Application React Native
> Projet ESTIAM E4 — Cross Platform Mobile Apps

---

## Démarrage

### Backend
```bash
cd foodiespot-backend
npm install
npm run dev
# Serveur sur http://localhost:4000
```

### App mobile
```bash
cd foodie-spot
npm install
npx expo start
```

> Modifier `constants/config.ts` ligne `LOCAL_IP` avec votre IP locale (ex: `192.168.1.XX`).

### Tests
```bash
cd foodie-spot
npm test
```

---

## Bugs corrigés

| Bug | Fichier |
|-----|---------|
| `resurantId` → `restaurantId` (faute de frappe) | `types/index.ts` |
| `reviewsCount` → `reviewCount` (mismatch API) | `types/index.ts` |
| `useEffect` sans tableau → boucle infinie | `notifications.tsx` |
| `Promise.all` 3 appels mais 4 destructurations | `use-notifications.ts` |
| Boucle login → tabs → login | `_layout.tsx` + `auth-context.tsx` |
| Bouton "Ajouter au panier" sans `onPress` | `dish/[id].tsx` |
| IDs hardcodés `r1`, `r2` pour charger le plat | `dish/[id].tsx` |
| `marginTop: -100` cassé sur grands écrans | `dish/[id].tsx` |
| Bouton Share appelait `toggleFavorite` | `restaurant/[id].tsx` |
| Boutons Itinéraire et Appeler ne faisaient rien | `restaurant/[id].tsx` |
| Stats profil hardcodées (12 commandes, 4.8) | `profile.tsx` |
| Imports relatifs `../../services/api` | `profile.tsx` |
| `if (!user)` affichait même JSX sans loader | `profile.tsx` |
| Favoris → route `/(tabs)/favorites` inexistante | `profile.tsx` |

---

## Améliorations faites

- **Home** : spinner pendant le chargement, bannière promo depuis l'API (plus hardcodée), géolocalisation pour trier par distance
- **Search** : debounce 400ms (avant : appel API à chaque lettre), catégories depuis `GET /categories` (avant : liste hardcodée), filtres visuellement actifs, FlatList, recherches récentes
- **Orders** : onglets par statut (En cours / Livrées / Annulées), état vide avec icône
- **Profile** : loader propre, stats depuis l'API, déconnexion fiable
- **Restaurant** : skeleton loader, boutons Appeler/Itinéraire avec `Linking`, Share corrigé
- **Tracking** : timeline, infos livreur, polling 10s
- **Login/Register** : validation regex email, erreurs par champ
- **_layout** : guard de navigation sans boucle

---

## Fonctionnalités implémentées (consigne)

### A — Dark Mode
Toggle manuel dans le profil (Clair / Sombre / Auto). Toutes les couleurs passent par un `ThemeContext`. Le choix est sauvegardé dans AsyncStorage.

J'avoue que connecter le contexte à tous les composants a pris du temps, surtout pour les modals qui sont en dehors de la hiérarchie normale.

### B — Panier avec animations
`CartContext` avec un reducer pour gérer les actions (ajout, suppression, quantité). Barre flottante animée qui apparaît avec `Animated.spring` quand le panier n'est pas vide. Badge sur l'onglet Orders.

Le truc chiant c'était de gérer le cas où l'utilisateur ajoute un plat d'un autre restaurant — j'ai choisi de vider le panier automatiquement dans ce cas.

### C — Suivi de livraison temps réel
Polling toutes les 10s sur `GET /orders/:id/track`. Timeline des statuts, infos livreur, barre de progression animée.

La carte avec `react-native-maps` n'est pas intégrée — ça nécessite un prebuild Expo que je n'ai pas configuré. J'ai compensé avec une timeline textuelle détaillée.

### D — Avis avec photos
Note globale + 3 sous-notes (qualité, rapidité, présentation), upload de photos via `expo-image-picker`, envoi en `FormData` sur `POST /reviews`.

### F — Recherches récentes + suggestions
Les dernières recherches sont stockées dans AsyncStorage. Suggestions auto-complétées depuis `GET /search/suggestions`.

### G — Code promo
Validation en temps réel via `POST /promos/validate`. Les réductions (%, fixe, livraison gratuite) sont calculées dynamiquement dans le checkout.

### H — Onboarding
3 slides présentés uniquement au 1er lancement. Le flag `ONBOARDING_DONE` est stocké dans AsyncStorage. Animations avec `Animated.interpolate` sur les dots de pagination.

### I — Gestion des adresses
CRUD complet : liste, ajout, édition, suppression, adresse par défaut. Les endpoints `/users/addresses` existaient dans le backend mais n'étaient pas utilisés.

Pas de carte pour sélectionner l'adresse visuellement — même contrainte que feature C.

### J — Estimation livraison
`GET /restaurants/:id/delivery-estimate` appelé avec les coordonnées GPS de l'utilisateur. Affiche temps estimé, distance et frais avant de commander.

---

## Fonctionnalités ajoutées (hors consigne)

### Multilangue FR/EN
Le multilangue était demandé dans la consigne (section II-1). J'ai fait un système simple sans librairie externe — juste un fichier par langue et un contexte React avec une fonction `t()`.

Pour l'implémentation j'ai suivi ce fil Stack Overflow qui explique bien le pattern : https://stackoverflow.com/questions/55935699/how-to-implement-multi-language-support-in-react-native-without-third-party-lib

Toggle FR/EN dans le profil, persisté en AsyncStorage.

### Auth stricte + mot de passe oublié
Le backend mock de base acceptait n'importe quel mot de passe. J'ai ajouté la vérification email/mdp côté backend et un écran "mot de passe oublié" en 3 étapes (email → code 6 chiffres → nouveau mot de passe).

Le code de réinitialisation s'affiche dans la console du backend en mode test. En prod il faudrait configurer `EMAIL_USER` et `EMAIL_PASS` dans le `.env` pour un vrai envoi email.

Pour comprendre comment implémenter un système de reset password simple côté Express : https://stackoverflow.com/questions/31565871/how-to-reset-password-in-nodejs

---

## Tests

| Fichier | Ce qui est testé |
|---------|-----------------|
| `storage.test.ts` | setItem, getItem, removeItem |
| `cache.test.ts` | stockage, expiration |
| `cart-context.test.ts` | reducer (ajout, suppression, quantité) |
| `auth-validation.test.ts` | regex email, longueur mdp |
| `i18n.test.ts` | traductions FR/EN |

---

## Limites

- **Carte** (features C et I) : `react-native-maps` nécessite un prebuild Expo, pas compatible Expo Go directement. J'ai fait le tracking en mode texte.
- **Recherche vocale** (feature E) : lib incompatible avec Expo Go
- **Notifications push distantes** : Expo Go SDK 53 ne les supporte plus, il faut un Development Build

---

*ESTIAM E4 — FoodieSpot*
