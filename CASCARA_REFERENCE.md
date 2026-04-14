# CASCARA - Guide de référence

Ce document fusionne les anciens guides Markdown du projet et reprend l'état actuel du jeu ainsi que les directions de design encore utiles.

## Vue d'ensemble

`Cascara` est un jeu de conquête tactique au tour par tour sur grille.

Le joueur contrôle les tuiles rouges et affronte `1` à `3` adversaires IA selon le mode et la configuration.

Le coeur du jeu repose sur :

- la capture de territoire ;
- les réactions en chaîne ;
- la jauge d'objectif ;
- le pouvoir du chaos ;
- les potions ;
- la lecture du prochain tour ennemi ;
- la progression méta via l'Astrolabe.

## Boucle de jeu

Une partie suit ce rythme :

1. Le joueur choisit un mode et, selon le cas, des paramètres de partie.
2. Le plateau apparaît avec une animation d'intro et des zones de départ par couleur.
3. Chaque joueur joue à son tour.
4. Les captures déclenchent des conversions et parfois des cascades.
5. La jauge d'objectif progresse ou recule selon l'évolution du territoire.
6. Le pouvoir du chaos se charge via les captures.
7. Les potions se déverrouillent à certains seuils de progression.
8. Le premier joueur à atteindre l'objectif de domination gagne.

## Plateau et captures

### Tailles jouables

Le jeu principal propose actuellement :

- `8x8`
- `12x12`
- `14x14`

### Couleurs de référence

- Rouge : joueur humain
- Bleu : ennemi bleu
- Vert : ennemi vert
- Scarlet / violet : quatrième joueur
- Gris : tuile neutre

### Règle de capture

Une tuile peut être capturée si elle est adjacente à au moins une tuile du joueur actif.

Le joueur ne peut pas capturer :

- une de ses propres tuiles ;
- une tuile gelée ;
- une tuile rendue indisponible par un effet spécial.

Quand une tuile est capturée :

- la tuile ciblée change de propriétaire ;
- les tuiles voisines concernées sont converties selon les règles normales ;
- les animations `off -> on` jouent sur les spritesheets de tuiles ;
- un son `clap` accompagne le retournement.

Les tuiles utilisent désormais des spritesheets animés carrés en `13x13`, collés bord à bord sans interstice.

### Intro du plateau

Au lancement d'une partie, le plateau gris apparaît avec une animation d'intro choisie aléatoirement dans un pool visuel :

- vague depuis le coin haut gauche ;
- tourbillon depuis le centre ;
- convergence depuis les quatre coins.

Puis les zones de départ des joueurs prennent possession du plateau avec leurs animations `on`.

## Jauge d'objectif

La jauge d'objectif est affichée en bas du plateau.

Elle représente la progression réelle vers la victoire.

Le principe de base :

- capturer des tuiles fait progresser la jauge ;
- perdre des tuiles la fait reculer ;
- atteindre l'objectif met fin à la partie.

Valeur actuellement utilisée comme référence globale :

- objectif temporaire fixé à `51%` sur toutes les configurations

La jauge :

- se remplit avec une animation dédiée ;
- peut entrer dans une animation de tension autour de `90%` pour signaler qu'une fin de partie approche ;
- pilote aussi les seuils de déverrouillage des potions.

## Pouvoir du chaos

Chaque personnage dispose d'un cercle de pouvoir du chaos sous son sprite.

### Chargement

Le pouvoir se charge en capturant des tuiles.

Quand il est plein :

- il reste visuellement chargé ;
- une séquence de roulette se déclenche ;
- la roulette s'arrête sur le bonus réellement choisi par la logique du jeu ;
- le bonus pulse quelques instants ;
- le cercle reste plein jusqu'à l'utilisation effective du bonus.

Quand le joueur ou l'ennemi consomme le bonus :

- la jauge se vide progressivement avec une animation de désemplissage ;
- puis repart sur un cycle normal.

### Bonus disponibles

Le cycle actuel alterne :

1. une super-bombe posable ;
2. puis un bonus aléatoire.

Les bonus aléatoires possibles sont :

- `LIGHTNING`
- `ICE`
- `SWAMP`
- `BOMB`

### Présentation visuelle actuelle

- contour simple et épais, de la couleur du personnage ;
- pas de filet interne parasite ;
- roulette verticale masquée dans le cercle ;
- la foudre est affichée sous forme de `⚡️` dans la jauge ;
- la bombe n'est pas teintée dans la roulette ni dans le bonus sélectionné ;
- la bombe posée sur le plateau, elle, garde sa coloration.

## Potions

Les potions sont liées à la progression de la jauge d'objectif.

Principe :

- certaines potions se déverrouillent quand des seuils de progression sont atteints ;
- une potion utilisée devient inactive pendant un certain temps ;
- elle redevient disponible plus tard selon les règles du mode.

Les potions sont affichées au-dessus du décor du bas, avec :

- une ombre sous les potions actives ;
- pas d'ombre pour les potions inactives.

Exemples d'usages :

- capturer une zone `3x3` n'importe où sur le plateau ;
- protéger des tuiles ;
- annuler un bonus ennemi ;
- obtenir une action supplémentaire.

### Déblocage en mode histoire

Ordre de déblocage de référence :

1. `ROSE`
2. `ORANGE`
3. `MENTHE`
4. `MARRON`
5. `BLANCHE`
6. `CYAN`

En mode Arcade, toutes les potions sont débloquées et trois d'entre elles sont tirées avant chaque combat.

## Lecture du tour ennemi

Pendant un combat, le joueur peut toucher un ennemi pour obtenir un indice sur ses intentions au prochain tour.

Règle actuelle :

- une seule consultation par ennemi et par tour

Le système donne volontairement une information vague :

- un petit groupe de tuiles est mis en avant ;
- il ne révèle pas la case exacte avec certitude.

## Difficulté

Trois niveaux de difficulté :

- `Facile`
- `Normal`
- `Difficile`

La difficulté agit sur :

- la répartition initiale du territoire ;
- le niveau d'optimisation de l'IA ;
- le rythme de réflexion ;
- l'utilisation des bonus ;
- la pression globale mise sur le joueur.

## Zone morte

Pour éviter les parties trop longues, une zone morte progressive peut se déclencher.

Principe :

- le plateau se referme depuis les bords vers le centre ;
- les tuiles bloquées deviennent grises, neutres et incapturables ;
- les pourcentages sont recalculés sur les seules tuiles encore actives.

Le jeu ne déclenche pas cette mécanique immédiatement : il attend d'abord une stagnation observée sur plusieurs tours rouges.

## Tutoriel

Le jeu propose maintenant un tutoriel scénarisé.

### Accès

Le tutoriel peut être lancé :

- depuis `Comment jouer ?` via un bouton `Tentez le tuto` ;
- depuis une invite de première partie.

### Invite de première partie

Lors du premier lancement :

- du mode Arcade, l'invite apparaît au briefing, au clic sur `C'est parti !` ;
- du mode `Le Cristal de Cascara`, l'invite apparaît avant le lancement de l'aventure.

Message affiché :

- `C'est votre première fois dans Cascara ? Tentez le tuto !`

Cette invite n'apparaît qu'une seule fois, que le joueur choisisse `Oui` ou `Non`.

### Contenu du tutoriel

Le tutoriel montre successivement :

- la capture de territoire ;
- la progression de la jauge d'objectif ;
- le remplissage du pouvoir du chaos et sa roulette ;
- l'usage des potions.

À la fin du tutoriel, le joueur revient vers la scène qui l'a lancé :

- `Comment jouer ?`
- briefing Arcade ;
- écran d'introduction du Cristal de Cascara

## Modes principaux

### Mode Arcade

Le mode Arcade permet de lancer des combats rapides avec :

- le nombre d'ennemis choisi ;
- la taille du plateau ;
- la difficulté ;
- le royaume / décor souhaité.

Il sert de mode libre principal.

### Le Cristal de Cascara

Le mode histoire repose sur une progression par carte et par chemins.

Il mélange :

- combats ;
- événements ;
- boutiques ;
- boss de fin de parcours.

Le joueur y progresse entre plusieurs royaumes :

- `Verdombre`
- `Vulkarn`
- `Drazhul`

Il y débloque progressivement les potions et compose son run avec des fragments et d'autres bonus de préparation.

### Stratego

`Stratego` est un mini-jeu puzzle territorial.

Règles :

- aucune IA ;
- aucune potion ;
- aucun bonus du chaos ;
- plateau rouge + gris ;
- objectif fixé à `100%` ;
- nombre de coups limité.

Le puzzle est construit à partir d'une solution cachée afin de rester gagnable.

Tailles actuellement proposées :

- `8x8`
- `12x12`
- `14x14`

### Cascara Fight

`Cascara Fight` est un duel rapide `1 contre 1`.

Caractéristiques :

- plateau `8x8` ;
- victoire par points de vie, pas par majorité ;
- pas de potions ;
- pas de fragments ;
- le pouvoir du chaos ne donne qu'une super-bombe.

Chaque tuile ennemie capturée inflige des dégâts.

### Cascara Boss Rush

`Boss Rush` est un mode d'endurance contre les trois boss du jeu :

- `Salamandre`
- `Golem`
- `Ogre`

Formats :

- `Facile`
- `Normal`
- `Difficile`
- `Ultime`

Le mode retire :

- fragments
- boutiques
- événements
- progression de carte

Mais conserve les combats standards et les règles de boss.

Avant chaque combat :

- trois potions aléatoires sont proposées

Le mode `Ultime` enchaîne les neuf combats :

- les trois boss en `Facile`
- puis en `Normal`
- puis en `Difficile`

## Mode histoire - structure de référence

La structure cible du Cristal de Cascara est celle d'un run tactique à embranchements.

Boucle haute-niveau :

1. Arrivée sur la carte.
2. Choix d'un noeud.
3. Résolution du noeud.
4. Récompense ou conséquence.
5. Retour à la carte.
6. Progression jusqu'au boss.

### Types de noeuds

- `Combat`
- `Elite`
- `Boutique`
- `Surprise`
- `Boss`

### Économie

L'or est la monnaie principale du mode histoire.

Barèmes de référence :

- `Combat` : `20` à `30` or
- `Elite` : `40` à `60` or
- `Boss` : `80` à `100` or

### Boutique

La boutique propose une offre simple et lisible :

- `3` reliques ;
- `1` bouton de rafraîchissement ;
- achat immédiat si le joueur a assez d'or.

Coût de rafraîchissement de référence :

- `15` or

### Reliques de référence

Catalogue de base retenu :

- `Insigne d'initiative`
- `Éclat d'ambition`
- `Bourse d'alchimiste`
- `Coeur de braise`
- `Batterie runique`
- `Sceau du gardien`
- `Brume d'égarement`
- `Cendre du Phénix`

Ces reliques modifient légèrement la préparation d'un combat sans réécrire les règles fondamentales du jeu.

## Boss

Les boss de référence sont :

- `Salamandre`
- `Golem`
- `Ogre`

Ordre de campagne retenu :

1. `Salamandre`
2. `Golem`
3. `Ogre`

Progression de difficulté par parcours :

- premier parcours : `Facile`
- deuxième parcours : `Normal`
- troisième parcours : `Difficile`

Décors associés :

- `Verdombre`
- `Vulkarn`
- `Drazhul`

## Interface et présentation

### Fenêtre de jeu

Le jeu est pensé d'abord pour iPhone, mais la version desktop est aussi maintenue proprement.

En particulier :

- le décor du bas respecte désormais la largeur de la fenêtre de jeu ;
- les éléments latéraux restent calés sur ce bloc visuel ;
- le plateau garde un fond sombre `#141013` dans le jeu principal ;
- le plateau de test utilise un fond `#AF7E4C`.

### Décor du bas

Le décor du bas est composé de trois éléments :

- `decor_roof.png`
- `decor_books.png`
- `decor_skull.png`

Ordre de profondeur de référence :

1. `decor_roof`
2. décors latéraux (`books`, `skull`)
3. fond noir du plateau
4. plateau et ses tuiles

## Étoiles et Astrolabe

Le joueur commence désormais avec :

- `0` étoile

Puis il reçoit :

- `25` étoiles lors de son premier passage à l'Astrolabe

Les étoiles servent à débloquer :

- des décors ;
- des bonus ;
- des mini-jeux.

Quand les cheats sont activés :

- le compteur passe à `999` étoiles.

## Cheats et debug

Les cheats sont toujours présents mais masqués par défaut.

Ils peuvent être réactivés depuis l'écran de sélection de langue avec un bouton :

- `Cheats : ON / OFF`

Effets du mode cheat :

- boutons de debug visibles au menu ;
- ligne de potions de debug visible en combat ;
- boutons `V / D` visibles en partie ;
- étoiles forcées à `999`.

## Raccourcis utiles

Raccourcis de bonus en partie :

- `L` : foudre
- `I` : glacier
- `M` : marais
- `X` : bombe
- `B` : super-bombe à poser

Raccourcis de fin de partie :

- `V` : victoire immédiate
- `D` : défaite immédiate

## Récompenses méta

Chaque combat gagné ou perdu rapporte des étoiles.

Les mini-jeux possèdent aussi leurs propres récompenses et trophées, notamment :

- `Boss Rush`
- `Stratego`
- `Cascara Fight`

## Remarques d'état

Ce document distingue volontairement :

- les systèmes actuellement jouables et visibles dans le jeu ;
- certaines directions de design encore utilisées comme référence pour la suite, notamment dans le mode histoire.

Quand une section décrit une cible future ou un cadre de design, elle doit être lue comme une référence de production et non comme une promesse déjà entièrement implémentée.
