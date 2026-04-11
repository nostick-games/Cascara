



# CASCARA - Story Mode Reference

## Statut du document

Ce document décrit la direction retenue pour le `mode histoire`.

Il s'agit d'une référence de design :

- suffisamment précise pour guider l'implémentation ;
- suffisamment simple pour rester réalisable ;
- construite à partir des décisions déjà validées.

Le mode histoire n'est pas encore implémenté dans le jeu au moment de la rédaction de ce document.

## Intention générale

Le mode histoire doit reprendre la structure d'un `run` tactique à embranchements, plus proche de `Slay the Spire` que de `Puzzle Quest`.

Objectifs :

- garder le combat de `CASCARA` comme coeur du jeu ;
- ajouter une couche de progression entre les combats ;
- proposer des choix clairs entre plusieurs types de noeuds ;
- introduire progressivement les potions et les systèmes avancés ;
- préparer l'arrivée future de boss avec leur propre logique.

Le mode histoire ne cherche pas à simuler un monde à explorer librement.
Il repose sur une carte abstraite de progression.

## Structure générale d'une run

Une run correspond à un acte de campagne.

Version cible initiale :

- `1` acte ;
- `6` à `8` noeuds avant le boss ;
- `1` boss final d'acte ;
- plusieurs embranchements simples ;
- progression linéaire par étapes.

Boucle haute-niveau :

1. Le joueur arrive sur la carte d'acte.
2. Il choisit un noeud parmi les chemins disponibles.
3. Il résout le contenu du noeud.
4. Il reçoit une récompense ou une conséquence.
5. Il revient sur la carte.
6. Il progresse jusqu'au boss.

## Types de noeuds

Le mode histoire repose sur `5` types de noeuds.

### Combat

Noeud standard.

Effets :

- lance une partie normale de `CASCARA` ;
- utilise la configuration du run en cours ;
- donne de l'or en cas de victoire ;
- peut aussi donner une récompense secondaire légère.

Rôle :

- base principale du run ;
- source régulière d'or ;
- source de progression.

### Elite

Combat plus difficile qu'un combat standard.

Effets :

- adversaires plus agressifs ou configuration plus dure ;
- récompense en or supérieure ;
- forte probabilité de donner une relique.

Rôle :

- risque plus élevé ;
- récompense plus forte ;
- étape de tension dans le run.

### Boutique

Noeud marchand.

Effets :

- le joueur dépense l'or gagné ;
- il peut acheter des reliques ;
- il peut éventuellement rafraîchir l'offre.

Rôle :

- choix économique ;
- préparation avant les combats suivants ;
- personnalisation du run.

Le noeud boutique remplace utilement un système de repos qui n'a pas de vrai support mécanique dans `CASCARA`.

### Surprise

Noeud événement textuel.

Effets :

- le joueur choisit entre `2` ou `3` options ;
- chaque option donne un gain, un risque, ou un compromis ;
- le résultat est immédiat.

Exemples d'effets possibles :

- gagner de l'or ;
- perdre de l'or ;
- obtenir une relique ;
- débloquer une potion supplémentaire pour le run ;
- recevoir un bonus pour le prochain combat ;
- subir un petit malus pour le prochain combat.

Rôle :

- casser la monotonie ;
- donner de la narration légère ;
- créer des choix non purement combat.

### Boss

Combat de fin d'acte.

Effets :

- rencontre plus difficile ;
- logique IA potentiellement spécifique ;
- récompense majeure ;
- validation de l'acte.

Rôle :

- point culminant de la run ;
- justification des futurs boss à comportement unique.

## Carte d'acte

La carte ne doit pas être un monde libre.

Structure recommandée :

- affichage vertical ;
- `2` ou `3` chemins au choix à chaque étape ;
- quelques croisements ;
- lecture immédiate sur mobile comme sur desktop.

Le joueur doit comprendre rapidement :

- où il est ;
- quels noeuds arrivent ensuite ;
- quel type de récompense ou de risque il choisit.

## Economie

## Or

L'or est la monnaie principale du mode histoire.

Sources prévues :

- victoire sur un noeud `Combat` ;
- victoire sur un noeud `Elite` ;
- victoire sur un `Boss` ;
- certains noeuds `Surprise`.

Barème de référence initial :

- `Combat` : `20` à `30` or ;
- `Elite` : `40` à `60` or ;
- `Boss` : `80` à `100` or.

Ce barème est un point de départ, pas une valeur définitive.

## Boutique

La boutique doit être un noeud simple, lisible et rapide à comprendre.

Elle ne doit pas devenir un sous-jeu complexe.

Objectifs :

- donner une vraie utilité à l'or gagné ;
- permettre au joueur d'orienter son run ;
- offrir un choix intéressant sans casser le rythme ;
- rester très légère en termes d'interface.

## Structure minimale retenue

Contenu recommandé pour la V1 :

- `3` reliques proposées ;
- `1` bouton de rafraîchissement de l'offre ;
- possibilité d'acheter immédiatement une relique.

La boutique ne doit pas être un écran complexe.
Elle doit proposer :

- peu d'éléments ;
- des prix lisibles ;
- des effets compréhensibles en quelques secondes.

## Fonctionnement de l'offre

Principe retenu :

- le marchand propose `3` reliques tirées aléatoirement ;
- chaque relique apparaît avec son icône, son nom, son prix et sa description courte ;
- une relique achetée disparaît de l'offre ;
- si le joueur n'a pas assez d'or, le bouton d'achat est désactivé.

Objectif :

- permettre au joueur de prendre une décision immédiate ;
- éviter une boutique surchargée ;
- conserver de la variété d'une run à l'autre.

## Rafraîchissement de l'offre

La boutique propose un bouton de rafraîchissement.

Règle retenue pour la V1 :

- le joueur peut rafraîchir l'offre pour un coût fixe en or ;
- coût de référence : `15` or ;
- le rafraîchissement remplace les reliques restantes par une nouvelle sélection aléatoire ;
- le coût doit être suffisamment faible pour être tentant, mais pas gratuit.

But du rafraîchissement :

- limiter la frustration d'une offre peu utile ;
- sans permettre de reroll indéfiniment sans contrepartie.

## Rareté

La V1 peut fonctionner avec une rareté très légère.

Répartition recommandée :

- `Commune`
- `Peu commune`
- `Rare`

Usage recommandé :

- les reliques communes apparaissent le plus souvent ;
- les peu communes apparaissent moins souvent ;
- les rares apparaissent rarement et doivent provoquer un vrai choix.

Cette rareté n'a pas besoin d'être très visible au début.
Elle peut simplement influencer les probabilités de tirage du marchand.

## Répartition initiale suggérée

Commune :

- `Insigne d'initiative`
- `Coeur de braise`
- `Eclat d'ambition`

Peu commune :

- `Bourse d'alchimiste`
- `Sceau du gardien`
- `Batterie runique`

Rare :

- `Brume d'égarement`
- `Cendre du Phénix`

## Règles d'achat

Règles recommandées pour la première version :

- une relique achetée rejoint immédiatement les reliques possédées du run ;
- elle n'est pas automatiquement activée ;
- elle pourra être équipée avant un combat suivant ;
- une même relique ne peut pas être achetée deux fois dans le même run ;
- si le joueur possède déjà une relique proposée, elle ne doit pas apparaître.

## Position dans la structure du run

Le noeud `Marchand` doit apparaître à intervalles réguliers, mais pas trop souvent.

Cadre recommandé :

- environ `1` ou `2` noeuds marchand sur une carte courte ;
- plutôt après quelques combats, quand le joueur a déjà gagné de l'or ;
- pas immédiatement au tout début du run.

## Variantes futures possibles

Non retenues pour la V1, mais compatibles plus tard :

- relique très rare à prix élevé ;
- offre spéciale révélée par un événement ;
- réduction temporaire sur une relique ;
- relique unique liée à un biome ;
- marchands thématiques.

## Reliques

## Rôle des reliques

Les reliques donnent de petits avantages.

Elles doivent :

- modifier légèrement la préparation d'un combat ;
- rester simples à comprendre ;
- éviter les effets trop abstraits ;
- être activables avant le combat.

Le joueur ne doit pas nécessairement activer toutes ses reliques à la fois.

Principe retenu :

- le joueur possède un ensemble de reliques acquises ;
- avant un combat, il choisit quelles reliques activer ;
- la limite d'activation recommandée est `1` ou `2` reliques pour une première version.

## Philosophie de design des reliques

Les reliques doivent être :

- petites ;
- lisibles ;
- directement reliées aux systèmes existants ;
- faciles à implémenter.

Elles ne doivent pas :

- réécrire entièrement les règles du combat ;
- introduire des sous-systèmes trop lourds ;
- transformer le combat en puzzle opaque.

## Catalogue de reliques retenu pour la V1

Les reliques suivantes sont retenues comme base de travail pour le mode histoire.

Les prix indiqués servent de référence de départ pour la boutique.

### Insigne d'initiative

Effet :

- le joueur commence toujours la partie.

Prix de référence :

- `45` or.

Implémentation :

- force le premier joueur à `ROUGE`.

### Eclat d'ambition

Effet :

- la jauge d'objectif du joueur commence avec un bonus fixe.

Prix de référence :

- `55` or.

Valeur de départ recommandée :

- `+10%` de progression vers l'objectif.

### Bourse d'alchimiste

Effet :

- la première potion de progression du combat se débloque plus tôt.

Prix de référence :

- `60` or.

Version simple :

- réduire le premier seuil de déblocage de potion.

### Coeur de braise

Effet :

- le joueur commence avec quelques tuiles rouges supplémentaires sur le plateau.

Prix de référence :

- `50` or.

Version simple :

- augmenter légèrement le noyau de départ du joueur.

### Batterie runique

Effet :

- la jauge bonus circulaire du joueur commence partiellement remplie.

Prix de référence :

- `65` or.

### Sceau du gardien

Effet :

- le joueur commence avec une petite protection sur une partie de son territoire.

Prix de référence :

- `60` or.

Version simple :

- appliquer une protection légère sur quelques tuiles rouges de départ.

### Brume d’égarement

- choisissez un ennemi ;
- cet ennemi agit comme s'il était d'une difficulté inférieure pendant ce combat.

Prix de référence :

- `75` or.

Parcours d'activation retenu :

- le joueur active la relique dans le panneau de reliques avant le combat ;
- si la relique est active, la cible est choisie dans le panneau de briefing ;
- le joueur clique sur l'ennemi concerné parmi les ennemis affichés ;
- l'effet s'applique uniquement à cet ennemi pour ce combat.

Conséquence de design :

- `Brume d'égarement` est une relique activable avec ciblage ;
- ce modèle pourra être réutilisé plus tard pour d'autres reliques à cible.

### Cendre du Phénix

Effet :

- si le joueur tombe au combat, il peut reprendre immédiatement la partie une seule fois.

Prix de référence :

- `110` or.

Parcours d'activation retenu :

- la relique est équipée avant le combat ;
- en cas de défaite, le panneau de fin propose de l'utiliser ;
- si le joueur accepte, le même combat est relancé immédiatement ;
- la relique est consommée pour ce run.

Note d'implémentation :

- la reprise doit relancer le combat depuis son état initial ;
- elle ne doit pas ressusciter le joueur au milieu d'une partie déjà perdue.

## Ecran de préparation avant combat

Avant de lancer un combat dans le mode histoire, le joueur doit voir un panneau de préparation.

Ce panneau doit permettre :

- de voir le prochain noeud ;
- de voir les ennemis concernés ;
- de voir les potions disponibles dans le pool courant ;
- d'activer les reliques choisies ;
- de lancer le combat.

Ce panneau est distinct du briefing actuel du mode libre.

## Progression et déblocage des potions

Le mode histoire doit introduire les potions progressivement.

Objectif :

- ne pas noyer le joueur au début ;
- créer une vraie sensation de progression ;
- réserver les effets les plus complexes aux étapes plus avancées.

## Ordre de déblocage recommandé

Ordre retenu :

1. `ROSE`
2. `ORANGE`
3. `MENTHE`
4. `MARRON`
5. `BLANCHE`
6. `CYAN`

## Effet sur le pool de potions

Au début du mode histoire :

- seules les premières potions débloquées peuvent apparaître dans la jauge d'objectif.

Puis, à mesure de la progression :

- le pool s'élargit ;
- les potions nouvellement débloquées deviennent candidates au tirage des `3` potions de partie.

Cela implique qu'un combat d'histoire ne pioche jamais dans l'ensemble total des potions si le joueur ne les a pas encore débloquées.

## Progression méta

Le mode histoire doit contenir deux niveaux de progression.

### Progression de run

Valable uniquement pendant le run en cours :

- or ;
- reliques achetées ou obtenues ;
- avantages temporaires ;
- état de la carte.

### Progression méta

Conservée entre les runs :

- potions débloquées ;
- éventuellement reliques permanentes débloquées ;
- éventuellement boss débloqués ;
- éventuellement événements débloqués.

La progression méta doit rester légère dans la première version.

Le point le plus important est le déblocage progressif des potions.

## Exemples de noeuds Surprise

### Autel oublié

Choix :

- perdre de l'or et gagner une relique ;
- repartir sans rien prendre.

### Marchand ambulant

Choix :

- payer une petite somme pour révéler une offre rare ;
- garder son or.

### Source d'étincelles

Choix :

- commencer le prochain combat avec une jauge bonus partiellement chargée ;
- ou obtenir davantage d'or.

### Laboratoire fendu

Choix :

- ajouter temporairement une potion au pool du run ;
- ou renforcer une relique déjà possédée.

## Boss

Le mode histoire doit préparer l'arrivée de `3` à `4` boss avec leur propre logique.

Conséquence directe sur l'architecture :

- les comportements IA doivent être extensibles ;
- un boss doit pouvoir brancher sa propre logique sans casser le flux commun.

Cette direction est déjà prise en compte par le refactoring de l'IA basé sur un `behaviorKey`.

Un boss pourra plus tard définir :

- son comportement ;
- ses règles particulières ;
- ses avantages de départ ;
- son plateau spécial ;
- ses conditions de combat spécifiques.

## Difficulté du mode histoire

Le mode histoire ne doit pas obligatoirement réutiliser à l'identique le trio `Facile / Normal / Difficile`.

Deux approches sont possibles :

- garder les trois difficultés du mode libre ;
- ou faire porter la difficulté surtout par la structure du run.

Pour une première version, la solution la plus simple est :

- conserver `Facile / Normal / Difficile` ;
- mais laisser le run, les reliques et les boss ajouter leur propre pression.

## Données minimales à stocker

## Données de progression méta

Exemples de structure :

```js
storyMeta = {
  unlockedPotions: ['ROSE', 'ORANGE'],
  unlockedRelics: ['INITIATIVE_SIGIL'],
  completedActs: 0,
  unlockedBosses: []
};
```

## Données de run

Exemples de structure :

```js
storyRun = {
  actIndex: 1,
  currentNodeId: 'node_03',
  gold: 55,
  ownedRelics: ['INITIATIVE_SIGIL', 'RUNIC_BATTERY'],
  equippedRelics: ['INITIATIVE_SIGIL'],
  availablePotionPool: ['ROSE', 'ORANGE', 'MENTHE'],
  nodeHistory: ['node_01', 'node_02'],
  nextBattleModifiers: []
};
```

## Règles d'implémentation recommandées

Pour rester réaliste, l'ordre de production recommandé est :

1. carte simple du run ;
2. noeuds `Combat`, `Boutique`, `Surprise`, `Boss` ;
3. or ;
4. reliques simples ;
5. écran de préparation avant combat ;
6. déblocage progressif des potions ;
7. premiers boss spécifiques.

## Ce qui n'est pas retenu à ce stade

Les éléments suivants ne sont pas retenus pour la première version :

- exploration libre d'une carte ;
- quêtes RPG ;
- inventaire complexe ;
- repos type `Slay the Spire` ;
- arbre de talents profond ;
- dialogues lourds ;
- ville persistante ou hub narratif complet.

## Résumé de la direction retenue

Le mode histoire de `CASCARA` est pensé comme :

- un mode `run-based` ;
- avec carte à embranchements ;
- or et boutique ;
- événements surprise ;
- boss ;
- reliques activables avant combat ;
- déblocage progressif des potions ;
- montée en puissance lisible du système.

Le but est de prolonger le gameplay tactique existant sans l'alourdir avec une structure d'aventure trop coûteuse à produire.
