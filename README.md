# 🏐 VolleyStat

Application mobile (web / PWA) pour suivre le score, les rotations et les statistiques d'un match de volley.
Pas de compte : toutes les données restent sur le téléphone (avec export/import de sauvegarde).

## Fonctionnalités

**Paramétrage**
- Création d'équipes : nom, niveau (M11 → Ligue A : M15, M18, Départemental, Régional, Pré-National, Nationale…), catégorie féminine / masculine / mixte.
- Joueurs avec numéro de maillot et poste (optionnel, le libéro est mis en évidence).

**Match**
1. Choix de l'équipe, de l'adversaire et de son niveau, date.
2. Sélection des joueurs présents.
3. Placement des 6 de départ (P1 à P6) et choix du premier service.

**En direct**
- Haut de l'écran : score avec boutons `+` / `−`, indicateur de service, temps morts (chrono 30 s), changements, annuler.
- Rotation automatique : quand l'équipe reprend le service, les joueurs tournent (P2 → P1, P1 → P6…).
- Onglet **Positions** : le terrain avec la position de chaque joueur. Toucher un joueur → **Faute** / **Échec** / **Réussite** → type d'action
  (filet, pénétration, mordu au service, mordu aux 3 m, double touche… / service, réception, attaque… / ace, attaque, contre…).
  Option « point automatique » : une faute ou un échec donne le point à l'adversaire, un ace / attaque / contre gagnant nous le donne.
- Onglet **Stats** : stats par joueur et par type, par set ou sur le match.
- Changements (6 par set, le libéro ne compte pas), temps morts notés avec le score.
- Fin de set automatique à 25 (15 au tie-break) avec 2 points d'écart, puis nouvelle composition pour le set suivant
  (premier service alterné, tirage au sort au 5e set). Le match s'arrête à 3 sets gagnés.

**Historique** : résumé de chaque match (sets, déroulé des points, six de départ, changements, temps morts, stats)
et stats cumulées par équipe.

## Lancer en local

```bash
npm install
npm run dev      # http://localhost:5173 (accessible depuis le téléphone sur le même Wi-Fi)
npm run build    # version de production dans dist/
```

## Mettre en ligne (GitHub Pages)

Le workflow `.github/workflows/deploy.yml` publie l'appli à chaque push sur `main`.
Dans *Settings → Pages* du dépôt, choisir **Source : GitHub Actions**.
Sur le téléphone, ouvrir l'URL puis « Ajouter à l'écran d'accueil » : l'appli s'ouvre en plein écran et fonctionne hors-ligne.
