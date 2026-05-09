# bigdom-legacy

Bigdom Legacy est un jeu de cartes médiéval développé en HTML5, JavaScript et CSS.

## Description

Ce projet propose une expérience de jeu de cartes inspirée de l'univers médiéval. Il est composé de plusieurs fichiers JavaScript pour la logique du jeu, de fichiers de données de cartes et d'un fichier HTML principal.

## Contenu du projet

- `index.html` : point d'entrée principal du jeu.
- `kingdom-legacy.html` : version alternative ou page secondaire du jeu.
- `style.css` : styles visuels et mise en forme.
- `cartes-tuto.js`, `cartes-decouverte.js`, `cartes-heritage.js` : définitions des cartes et mécaniques de jeu.
- `game-init.js` : initialisation du jeu et démarrage de la partie.
- `game-state.js` : gestion de l'état global du jeu.
- `game-actions.js` : actions liées aux tours, cartes et interactions.
- `game-round.js` : logique de déroulement des tours.
- `game-heritage.js` : mécanique de l'héritage et du royaume.
- `game-bandit.js` : logique liée aux brigands et événements spéciaux.
- `game-staging.js` : gestion des phases de préparation et de transition.
- `game-save.js` : sauvegarde et chargement de l'état de la partie.
- `game-ui.js` : affichage de l'interface utilisateur et mise à jour du DOM.
- `game-music.js` : gestion sonore et musique du jeu.
- `level-1.js` : niveau d'apprentissage ou configuration de campagne.
- `stickers.js` : éléments décoratifs et badges visuels.

## Objectif

L'objectif principal est de fournir une base de jeu de cartes médiéval, facile à personnaliser et à enrichir. Le code est structuré autour de l'état du jeu (`gameState`), de la gestion des cartes et des phases de tour.

## Mécanismes principaux

- Les cartes sont définies dans des fichiers séparés selon leur type ou leur mode.
- La logique de jeu s'appuie sur des états globaux (`gameState`, `cardStateMap`, `choiceNeeded`, etc.).
- La sauvegarde et le chargement de la partie sont gérés dans `game-save.js`.
- L'interface utilise jQuery et Bootstrap 5 pour les interactions et les composants.

## Lancer le jeu

1. Ouvrir `index.html` dans un navigateur compatible.
2. Si une version alternative existe, ouvrir `kingdom-legacy.html`.
3. Utiliser le navigateur pour démarrer la partie et suivre les instructions à l'écran.

## Contribution

- Respecter les conventions existantes et ne pas réécrire un fichier entier sans raison.
- Ajouter des commentaires en français lorsque cela aide à comprendre la mécanique du jeu.
- Vérifier que les fichiers de sauvegarde restent compatibles après modification.

## Notes

Ce projet est conçu pour être extensible : on peut ajouter de nouvelles cartes, de nouvelles mécaniques de tour et des événements narratifs tout en gardant l'esprit médiéval.
