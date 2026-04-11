# Référence mini-jeux

## Stratego

### Intention

`Stratego` est un mini-jeu de puzzle territorial.

Le joueur doit remplir `100%` de la jauge de progression en un nombre limité de poses, sans :
- ennemi
- potion
- fragment
- bonus du chaos

Le but est de proposer un vrai puzzle de placement, centré uniquement sur le coeur du gameplay de capture.

### Règle centrale

- le plateau ne contient que des tuiles rouges et grises
- il n'y a aucun adversaire
- chaque tour, le joueur pose une tuile rouge sur une case valide
- la capture et la propagation suivent les règles normales du jeu
- la partie est gagnée si le joueur atteint `100%` avant d'épuiser tous ses coups
- sinon, la partie est perdue

### Contrainte majeure

Chaque puzzle `Stratego` doit toujours être gagnable.

Un puzzle ne doit jamais dépendre :
- d'un aléa favorable
- d'une information cachée
- d'une génération approximative non vérifiée

Le joueur peut perdre parce qu'il joue mal, jamais parce que le puzzle était impossible.

### Méthode retenue

La génération repose sur une solution cachée.

Principe :
- le jeu choisit d'abord la taille du plateau
- il choisit ensuite un nombre cible de coups
- il construit en secret une suite de coups valides menant à `100%`
- à partir de cette solution, il dérive le plateau initial

Conséquence :
- le puzzle final est gagnable par construction
- au moins une solution existe toujours

### Logique de génération

Méthode de référence :
1. définir un plateau final entièrement rouge
2. choisir un nombre de coups cible en fonction de la taille du plateau
3. remonter la solution "à l'envers" en retirant certaines zones ou branches de territoire
4. produire un état initial composé de rouge + gris
5. stocker la séquence de coups qui permet de revenir à `100%`

Autrement dit :
- on ne cherche pas une solution après génération
- on fabrique le puzzle depuis une solution connue

### Paramètres par taille de plateau

Le système doit être pensé dès le départ pour s'adapter à la taille du plateau.

Critères qui varient selon la taille :
- nombre de coups autorisés
- longueur de la solution cachée
- densité du territoire gris initial
- complexité de lecture du puzzle

Base recommandée :

#### Plateau `8x8`

- mode d'entrée
- puzzles plus lisibles
- solution plus courte
- environ `6 à 8` coups

#### Plateau `12x12`

- puzzles intermédiaires
- plus d'espace et plus de branches de territoire
- solution plus longue
- environ `9 à 12` coups

#### Plateau `14x14`

- puzzles avancés / prestige
- lecture plus complexe
- solution plus longue
- environ `12 à 16` coups

### Recommandation de V1

Pour la première version :
- commencer par `8x8` uniquement
- valider la boucle de jeu
- valider la génération depuis une solution cachée
- confirmer que les puzzles sont lisibles et satisfaisants

Puis :
- étendre à `12x12`
- garder `14x14` pour une étape ultérieure

### État actuellement branché

Une première version jouable de `Stratego` est désormais intégrée.

Comportement actuel :
- accès depuis le menu principal une fois le mini-jeu acheté dans l'Astrolabe
- écran de sélection de la taille de plateau : `8x8`, `12x12`, `14x14`
- lancement d'un puzzle sans :
  - ennemi
  - potion
  - fragment
  - bonus du chaos
- objectif de jauge fixé à `100%`
- compteur de `coups restants` affiché en bas de la fenêtre du jeu

### Génération actuellement branchée

La génération produit un puzzle à partir d'une solution connue.

Version actuelle :
- création d'un plateau initial rouge + gris
- construction d'une suite secrète de coups valides
- vérification que cette suite remplit bien tout le plateau
- le nombre de coups disponibles est égal à la longueur de cette solution

Paramètres actuels :
- `8x8` : `6 à 8` coups
- `12x12` : `14 à 18` coups
- `14x14` : `20 à 24` coups

Note :
- cette V1 suit bien l'idée "au moins une solution existe"
- mais elle reste une première version simple du générateur
- la qualité puzzle pourra être raffinée ensuite

### Interface

Le mode `Stratego` doit afficher :
- le plateau
- la jauge de progression avec objectif `100%`
- le nombre de coups restants

Il n'affiche pas :
- jauge du chaos
- potions
- fragments
- informations d'adversaires

### Condition de victoire

- victoire : `100%` de la jauge atteints avant la fin du nombre de coups autorisés
- défaite : plus aucun coup disponible avant `100%`

### Intérêt du mode

`Stratego` doit se distinguer clairement :
- du mode Arcade, plus libre et compétitif
- du Cristal de Cascara, plus riche en systèmes

Le mini-jeu doit être perçu comme :
- un mode puzzle
- un mode d'optimisation
- un mode de maîtrise pure des captures

## Cascara Fight

### Intention

`Cascara Fight` est un mini-jeu de duel rapide et nerveux.

Le mode doit reprendre le coeur du gameplay de capture, sans réinventer les règles du plateau, mais en remplaçant la logique de majorité territoriale par une logique de dégâts et de points de vie.

L'objectif est de donner une sensation plus directe, plus frontale, proche d'un jeu de combat :
- pression constante
- coups rapides
- temps fort quand la jauge est pleine

### Format retenu

Pour la V1 :
- duel `1 contre 1`
- plateau `8x8` uniquement

Le choix du `8x8` est volontaire :
- combats plus courts
- lecture plus immédiate
- rythme plus nerveux
- meilleure lisibilité des swings de dégâts

### Condition de victoire

Chaque combattant possède une barre de vie.

La partie se gagne :
- quand la barre de vie adverse tombe à `0`

La victoire ne dépend pas :
- du seuil de `51%`
- du contrôle majoritaire du plateau

Le territoire reste important, mais seulement comme moyen de pression et d'attaque.

### Ce que le mode conserve

Le mode conserve :
- les sprites des combattants
- les jauges du chaos
- le plateau
- les captures normales
- les cascades
- l'IA existante pour l'adversaire

### Ce que le mode retire

Pour la V1, le mode retire :
- les fragments
- les potions
- la victoire au `51%`
- les combats à plusieurs adversaires
- la zone morte

### Jauge du chaos

La jauge du chaos est conservée, mais son rôle est simplifié.

Dans `Cascara Fight` :
- la jauge du chaos ne produit qu'un seul bonus
- ce bonus est toujours une `super-bombe`

Il n'y a donc pas de variété de récompenses de chaos dans ce mode.

Objectif :
- garder un système existant
- créer un vrai temps fort offensif
- éviter de multiplier les règles spéciales

### Logique de dégâts

Principe retenu :
- les captures infligent directement des dégâts à l'adversaire

Base retenue pour la V1 :
- chaque tuile ennemie capturée inflige `1` point de dégât

Points de vie de départ :
- `100 PV` pour le joueur
- `100 PV` pour l'adversaire

La super-bombe doit représenter le gros swing du combat.

Le mode peut ensuite être enrichi avec :
- un bonus fixe de dégâts pour la super-bombe
- un bonus léger sur les grosses cascades

Mais la première version doit rester simple et lisible.

### Interface

Le mode doit afficher :
- le sprite du joueur
- le sprite de l'ennemi
- leurs jauges du chaos
- une barre de vie pour chacun, placée sous la jauge du chaos
- le plateau `8x8`

Le mode n'affiche pas :
- la jauge de progression comme objectif de victoire
- les potions
- les fragments

Les barres de vie reprennent visuellement la jauge de progression existante, coupée en deux moitiés :
- barre rouge pour le joueur
- barre bleue pour l'ennemi

### Briefing

Le briefing `Cascara Fight` doit permettre :
- de choisir son adversaire dans un carousel
- de choisir son décor / Royaume

Le carousel des adversaires doit utiliser les spritesheets `idle_face`.

Adversaires disponibles par défaut :
- gobelin
- squelette
- sorcier

Boss sélectionnables ensuite :
- Salamandre
- Golem
- Ogre

Ces boss ne deviennent disponibles qu'après avoir été vaincus dans le mode histoire.

### Plateau initial

Le combat démarre sur un plateau simple et frontal :
- une zone rouge d'un côté
- une zone bleue de l'autre
- un centre gris à conquérir

### Boucle de jeu

Boucle standard :
1. le joueur capture des tuiles
2. les captures infligent des dégâts à l'ennemi
3. la jauge du chaos se remplit
4. quand elle est pleine, le joueur peut utiliser une super-bombe
5. l'adversaire joue à son tour selon la même logique
6. le combat se termine quand une barre de vie atteint `0`

### Positionnement

`Cascara Fight` doit se distinguer :
- du mode Arcade, plus territorial
- de `Stratego`, plus cérébral
- du Cristal de Cascara, plus riche en systèmes

Le mini-jeu doit être perçu comme :
- un duel court
- un mode agressif
- une variation nerveuse du gameplay principal

## Cascara Boss Rush

### Intention

`Cascara Boss Rush` est un mini-jeu d'endurance centré sur les trois boss du jeu.

Le but est de proposer :
- une succession de combats exigeants
- sans fragments
- avec une part d'adaptation avant chaque affrontement grâce à des potions aléatoires

Le mode doit être perçu comme :
- une épreuve de maîtrise
- un défi de régularité
- un contenu final plus exigeant que `Cascara Fight`

### Format retenu

Le mode oppose toujours le joueur aux trois boss du jeu, dans cet ordre :
- `Salamandre`
- `Golem`
- `Ogre`

Il n'y a :
- ni map
- ni boutique
- ni event
- ni fragment

### Choix de difficulté

Au lancement, le joueur choisit l'un des modes suivants :
- `Facile`
- `Normal`
- `Difficile`
- `Ultime`

#### Mode `Facile`

- `Salamandre`, `Golem`, `Ogre`
- tous en difficulté `Facile`

#### Mode `Normal`

- `Salamandre`, `Golem`, `Ogre`
- tous en difficulté `Normal`

#### Mode `Difficile`

- `Salamandre`, `Golem`, `Ogre`
- tous en difficulté `Difficile`

#### Mode `Ultime`

Le mode `Ultime` est la run complète.

Ordre exact :
- `Salamandre`, `Golem`, `Ogre` en `Facile`
- puis `Salamandre`, `Golem`, `Ogre` en `Normal`
- puis `Salamandre`, `Golem`, `Ogre` en `Difficile`

Soit :
- `9` combats au total

Le mode `Ultime` doit être présenté comme :
- le défi final du mini-jeu
- avec un trophée dédié
- et une récompense en étoiles particulièrement généreuse

### Potions

Le mode n'utilise pas les fragments.

En revanche, avant chaque combat :
- `3` potions sont tirées aléatoirement

Le tirage est refait avant chaque boss.

Conséquence :
- le joueur ne conserve pas le même set de potions sur toute la run
- chaque combat demande une nouvelle adaptation

Objectif :
- introduire de la variété
- éviter que la run soit entièrement résolue dès le premier combat

### Ce que le mode conserve

Le mode conserve :
- les combats standards du jeu
- les pouvoirs spéciaux de chaque boss
- l'interface de combat existante
- les règles de victoire habituelles du mode histoire / arcade

### Ce que le mode retire

Le mode retire :
- les fragments
- les boutiques
- les events
- la progression de carte
- les bénédictions de boss

### Structure d'une run

Boucle type :
1. choix du mode de difficulté
2. tirage de `3` potions aléatoires
3. combat contre le boss courant
4. nouveau tirage de `3` potions
5. combat suivant

Et ainsi de suite jusqu'à :
- victoire finale sur toute la run
- ou défaite, qui met fin à la tentative

### Écran d'accueil actuellement branché

L'écran d'accueil `Cascara Boss Rush` affiche actuellement :
- le nom du mini-jeu
- sa description
- `4` boutons de difficulté : `Facile`, `Normal`, `Difficile`, `Ultime`
- une phrase de présentation du mode sélectionné
- les `3` potions du premier combat
- le carousel `Royaume` si le joueur a acheté plusieurs décors
- le bouton `C'est parti !`

Sur mobile :
- la page d'accueil du mini-jeu est scrollable verticalement
- pour garder tous les éléments accessibles sur iPhone

### Panneau de fin actuellement branché

En fin de combat `Boss Rush` :
- le panneau affiche un message de victoire ou de défaite choisi aléatoirement dans un petit pool dédié
- en cas de victoire avec run encore en cours, il affiche aussi :
  - `Poursuivez votre épopée avec le prochain combat en mode facile / normal / difficile`
- en cas de victoire sur le dernier combat d'une série `Facile`, `Normal` ou `Difficile`, il affiche :
  - `Vous en avez terminé avec cette série de boss !`
- le panneau liste ensuite les `3` potions du combat suivant si la run continue
- le bouton principal devient `COMBAT SUIVANT` si un autre boss doit être lancé
- le bouton `Statistiques` est masqué dans ce mini-jeu

### Récompenses

Principe retenu :
- la grosse récompense en étoiles doit être accordée uniquement si la run sélectionnée est terminée

Le mode `Ultime` doit être :
- nettement plus généreux que les autres
- assez attractif pour représenter un vrai objectif de fin de jeu

Valeurs actuellement branchées :
- `Facile` : `20` étoiles
- `Normal` : `35` étoiles
- `Difficile` : `50` étoiles
- `Ultime` : `120` étoiles

### Trophées

Trophées actuellement branchés :
- `Couronne de braise`
  - terminer un `Boss Rush` en `Facile`
- `Couronne d’argent`
  - terminer un `Boss Rush` en `Normal`
- `Couronne de diamants`
  - terminer un `Boss Rush` en `Difficile`
- `Neuf couronnes`
  - terminer le `Boss Rush` en `Ultime`
- `Sans filet`
  - terminer un `Boss Rush` sans utiliser de potion sur toute la run
