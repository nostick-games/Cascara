# CASCARA - Reference Gameplay

## Vision générale

`CASCARA` est un jeu de conquête tactique au tour par tour sur une grille.
Le joueur contrôle les tuiles rouges et affronte `1` à `3` ennemis IA selon la configuration choisie.

Le coeur du jeu repose sur :

- la prise de territoire ;
- les réactions en chaîne ;
- les bonus de plateau ;
- la jauge de progression ;
- les potions de progression ;
- la lecture du prochain tour ennemi.

## Boucle de jeu

Une partie suit ce rythme :

1. Le joueur choisit un nombre d'IA, une taille de plateau et une difficulté.
2. Le plateau est généré avec une répartition initiale des couleurs.
3. Les zones de couleur s'allument au lancement du plateau.
4. Les joueurs jouent chacun leur tour.
5. Chaque capture peut provoquer une cascade.
6. Les jauges de bonus et de progression se remplissent.
7. Le premier joueur à atteindre l'objectif de domination gagne.

## Écrans et interface

## Écran d'accueil

Au lancement du jeu :

- fond noir ;
- logo `CASCARA` en haut ;
- animation du logo :
  - apparition en noir et blanc ;
  - transition progressive vers la couleur ;
  - léger zoom avant pendant l'animation ;
- deux boutons :
  - `ENGLISH`
  - `FRANÇAIS`

La police utilisée pour l'interface textuelle est `Vollkorn`.

## Écran de sélection

L'écran de sélection contient :

- le logo `CASCARA` ;
- le choix du nombre d'IA ;
- le choix de la taille du plateau ;
- le choix de la difficulté ;
- le rappel de la condition de victoire ;
- un bouton de lancement de partie.

Tous les boutons utilisent le même style visuel :

- bord gauche `off/on`
- fond `off/on`
- bord droit `off/on`

## Plateau

Le plateau est centré et tient dans un format vertical mobile.

Les tuiles sont strictement contenues dans leur cellule logique.
Les débordements visuels ont été supprimés.

Au démarrage d'une partie :

- le plateau est majoritairement gris ;
- chaque joueur commence avec une zone compacte dans un coin ;
- quelques tuiles isolées de chaque couleur sont aussi dispersées dans la zone grise ;
- ces tuiles éparses sont posées seules, sans former de mini-zone adjacente.

## Couleurs des tuiles

- Rouge : joueur humain
- Bleu : ennemi bleu
- Vert : ennemi vert
- Violet : 4e joueur
- Gris : tuile neutre

Valeurs de référence :

- Rouge : `#FF0000`
- Bleu : `#0000FF`
- Vert : `#00FF00`
- Violet : `#76428A`
- Gris : `#808080`

## Règle de capture

Une tuile peut être capturée si elle est adjacente à au moins une tuile du joueur actif.

Le joueur ne peut pas capturer :

- une de ses propres tuiles ;
- une tuile gelée ;
- une tuile rendue indisponible par certaines actions spéciales en cours.

## Cascade

Quand une tuile est capturée :

- elle passe à la couleur du joueur actif ;
- l'animation de capture joue ;
- la cascade vérifie ensuite les effets spéciaux ;
- les conversions successives sont traitées vague par vague.

La transition de capture actuelle est :

- ancienne couleur ;
- flash sombre ;
- nouvelle couleur.

Il n'y a plus d'effet de scale sur la sélection ou la capture standard.

## Tailles de plateau

Tailles jouables :

- `8x8`
- `12x12`
- `14x14`

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
- la pression mise sur le joueur.

En `Facile`, le joueur bénéficie aussi d'un rythme de retour des potions plus favorable.

## Condition de victoire

La victoire ne demande pas nécessairement `100%` du plateau.
La partie se termine lorsqu'un joueur atteint l'objectif de domination correspondant à la configuration.

La jauge de progression du bas représente la progression vers cet objectif réel.

Seuils actuels de domination :

- toutes les configurations sont temporairement testées à `51%`

Anciens seuils de domination avant ce test :

- `8x8`
  - `1 ennemi` : `72%`
  - `2 ennemis` : `68%`
  - `3 ennemis` : `64%`

- `12x12`
  - `1 ennemi` : `61%`
  - `2 ennemis` : `58%`
  - `3 ennemis` : `55%`

- `14x14`
  - `1 ennemi` : `59%`
  - `2 ennemis` : `56%`
  - `3 ennemis` : `53%`

Quand le joueur atteint l'objectif :

- la jauge rouge est d'abord complétée visuellement ;
- puis seulement le message de victoire apparaît.

## Zone morte

Pour éviter les parties qui s'éternisent lorsque les adversaires se neutralisent, une `zone morte` progressive peut se déclencher.

Principe actuel :

- la zone morte rétrécit le plateau depuis les bords vers le centre ;
- les tuiles bloquées deviennent grises, neutres et incapturables ;
- elles ne peuvent plus recevoir de bombes, de bonus de chaos, ni être affectées par les captures normales, cascades ou potions ciblées ;
- après chaque extension, le jeu recalcule immédiatement les pourcentages sur les seules tuiles encore actives.

Déclenchement actuel :

- la zone morte ne démarre pas automatiquement au simple passage d'un tour seuil ;
- le jeu commence d'abord une phase d'observation à partir d'un tour minimal, selon la taille du plateau et le nombre d'ennemis ;
- à partir de ce seuil, il surveille une stagnation sur `5` tours rouges ;
- la zone morte s'active seulement si :
  - le leader reste le même ;
  - la variation du leader reste dans une marge de `2` tuiles maximum ;
  - la variation du joueur rouge reste elle aussi dans une marge de `2` tuiles maximum.

Règles de victoire pendant la zone morte :

- si un joueur atteint `51%` des tuiles encore actives après une extension, il gagne immédiatement ;
- sinon la partie continue ;
- quand la zone morte atteint `50%` du plateau total, le jeu compare les territoires restants ;
- le joueur qui possède la plus grande zone l'emporte.

Seuil minimal d'observation :

- `8x8`
  - `1 ennemi` : début au tour rouge `8`
  - `2 ennemis` : début au tour rouge `7`
  - `3 ennemis` : début au tour rouge `6`
- `12x12`
  - `1 ennemi` : début au tour rouge `13`
  - `2 ennemis` : début au tour rouge `11`
  - `3 ennemis` : début au tour rouge `9`
- `14x14`
  - `1 ennemi` : début au tour rouge `18`
  - `2 ennemis` : début au tour rouge `15`
  - `3 ennemis` : début au tour rouge `12`

Rythme actuel une fois la zone morte activée :

- extension tous les `5` tours du joueur rouge après le déclenchement initial ;

Présentation actuelle :

- une alerte rouge se déclenche avant la fermeture ;
- les nouvelles tuiles bloquées apparaissent ensuite une par une, depuis le haut gauche du nouvel anneau.

Note :

- la mécanique s'applique actuellement à tous les combats ;
- les combats de boss pourront être traités séparément plus tard si nécessaire.

## Jauges de bonus

Chaque personnage possède une jauge circulaire.

Quand cette jauge se remplit :

1. elle donne une bombe posable ;
2. au cycle suivant, elle donne un bonus aléatoire ;
3. puis le cycle recommence.

### Bombe posable

Quand la jauge donne une bombe posable :

- le joueur peut la placer sur une de ses propres tuiles valides ;
- la pose consomme le tour ;
- l'icône de bombe dans la jauge est teintée à la couleur du personnage ;
- ce comportement vaut pour le joueur et pour les ennemis.

### Bonus aléatoires

Les bonus aléatoires possibles sont :

- `LIGHTNING`
- `ICE`
- `SWAMP`
- `BOMB`

## Boss

Les combats de boss apparaissent en fin de run du mode histoire.

Règles communes actuelles :

- un boss est affronté seul ;
- le plateau de boss est actuellement en `12x12` ;
- la condition de victoire reste temporairement fixée à `51%`, comme pour le reste du jeu ;
- l'ordre de référence des boss est désormais fixe :
  - `Salamandre`
  - `Golem`
  - `Ogre`
- le tirage aléatoire des boss est supprimé dans la logique centrale ;
- le mode histoire est pensé comme une campagne en `3` parcours ;
- la difficulté suit ce tempo :
  - `1er parcours` : combats et boss en `Facile`
  - `2e parcours` : combats et boss en `Normal`
  - `3e parcours` : combats et boss en `Difficile`
- les décors de combat suivent aussi les parcours :
  - `1er parcours` : forêt, nom d'ambiance `Verdombre`
  - `2e parcours` : grotte / volcan, nom d'ambiance `Vulkarn`
  - `3e parcours` : donjon, nom d'ambiance `Drazhul`
- chaque victoire contre un boss ouvre désormais une nouvelle carte pour le parcours suivant, jusqu'au `3e` parcours ;
- entre deux parcours, le joueur conserve son or, ses fragments et ses potions débloquées ;
- les prix des fragments en boutique augmentent avec le parcours :
  - `1er parcours` : prix de base
  - `2e parcours` : `+25%`
  - `3e parcours` : `+50%`
- la progression entre parcours est portée par un `currentPathIndex` dans l'état du mode histoire ;
- le briefing de boss permet toujours :
  - de choisir un fragment ;
  - de choisir une bénédiction du chaos.

### Golem

Identité :

- boss frontal ;
- comportement `Agressif`.

Rôle recherché :

- mettre une pression constante sur le territoire rouge ;
- servir de boss lisible et solide pour les premières runs.

### Ogre

Identité :

- boss chaotique ;
- comportement `Berserk`.

Règles de gameplay :

- l’Ogre peut jouer jusqu’à `2` fois par tour ;
- la qualité réelle de son tour varie selon la difficulté ;
- il peut donc réussir `0`, `1` ou `2` actions selon le niveau.

Gradation actuelle :

- `Hyper facile`
  - peut réussir `0`, `1` ou `2` actions ;
- `Facile`
  - peut réussir `0`, `1` ou `2` actions ;
- `Normal`
  - peut réussir `1` ou `2` actions ;
- `Difficile`
  - réussit toujours `2` actions.

Lecture visuelle :

- quand une action de l’Ogre échoue :
  - sa bulle de pensée affiche `❌` ;
  - la caméra secoue légèrement l’écran.

## Bénédictions du chaos

Les combats de boss disposent d’un carousel spécifique dans le briefing :

- titre : `Les bénédictions du chaos :`
- le joueur choisit au plus `1` bénédiction pour le combat ;
- s’il n’en choisit aucune, le combat démarre sans bonus particulier.

Le bouton associé suit ce comportement :

- `Choisissez une bénédiction`
- puis `Bénédiction choisie` une fois le choix validé.

### Bénédictions actuelles

#### Chaos scellé

Effet :

- la jauge de chaos du boss est désactivée pendant ce combat ;
- elle ne progresse plus ;
- elle ne produit plus de bonus ;
- elle n’est plus affichée visuellement sous le boss.

#### Chaos accéléré

Effet :

- la jauge de chaos du joueur se remplit plus vite pendant le combat de boss ;
- multiplicateur actuel de charge : `x1.5`.

#### Chaos explosif

Effet :

- la jauge de chaos du joueur ne produit que des `super-bombes` pendant le combat de boss ;
- elle ne donne donc plus de bonus aléatoires pendant ce combat.

## 3e boss

### Salamandre

Nom :

- `Salamandre`

Style :

- `Incendiaire`

Rôle recherché :

- boss de contrôle de terrain ;
- moins brutal que l’Ogre ;
- moins frontal que le Golem ;
- plus orienté blocage et pression spatiale.

Pouvoir V1 actuellement implémenté :

- à la fin de son tour, la Salamandre embrase une partie des tuiles qu’elle vient de capturer ;
- ces tuiles deviennent `brûlantes` pendant `2` tours du joueur ;
- une tuile brûlante ne peut pas être recapturée pendant cette durée ;
- au `3e` tour rouge, la flamme s’éteint, la tuile redevient `grise` et redevient disponible ;
- rien ne peut être déposé sur une tuile enflammée :
  - ni super-bombe placée ;
  - ni bonus de chaos ;
- le pouvoir de feu se lit comme un effet de fin de tour, pas comme une seconde action.

Quantité de tuiles embrasées actuellement :

- `Hyper facile` : `1`
- `Facile` : `2`
- `Normal` : `3`
- `Difficile` : `4`

Principes de sélection visés :

- priorité aux tuiles récemment capturées ;
- puis priorité aux tuiles proches du rouge ;
- puis aux zones centrales.

Objectif de design :

- créer un boss qui ralentit la reconquête ;
- introduire un vrai gameplay de contournement ;
- donner une identité élémentaire forte sans multiplier les règles.

## Mode arcade

### Sélection de Royaume

Règle actuelle :

- si le joueur n’a acheté aucun décor arcade dans l’Astrolabe :
  - le briefing ne montre aucun carousel supplémentaire ;
  - le décor de combat reste `Verdombre` par défaut.
- si le joueur a acheté au moins `1` décor arcade :
  - le briefing affiche un carousel `Royaume` ;
  - ce carousel propose :
    - `Verdombre`
    - `Vulkarn` si acheté
    - `Drazhul` si acheté
  - le joueur peut choisir `1` royaume avant le combat ;
  - le bouton devient ensuite grisé.

Comportement par défaut :

- si le joueur ne choisit aucun royaume :
  - le combat utilise `Verdombre`.

Application en combat :

- `Verdombre` : fond forêt
- `Vulkarn` : fond grotte / volcan
- `Drazhul` : fond donjon

## Astrolabe

Principe visé :

- chaque combat terminé, gagné ou perdu, dans le mode arcade comme dans le mode histoire, rapporte des `étoiles` ;
- les étoiles alimentent une méta-progression permanente, distincte d'une run ;
- l'Astrolabe est accessible depuis la page d'accueil du jeu.

Rôle recherché :

- donner une récompense durable à toutes les parties ;
- encourager aussi bien le mode histoire que le mode arcade ;
- proposer des objectifs de long terme sans surcharger une run en cours.

Plan d'implémentation retenu :

- `1.` ajouter la monnaie permanente `étoiles` ;
- `2.` ajouter un bouton `Astrolabe` sur la page d'accueil ;
- `3.` créer une boutique permanente dédiée ;
- `4.` limiter la première version à des bonus économiques et à des déblocages de contenu.

Catégories retenues pour la V1 :

- bonus économiques permanents ;
- déblocages permanents de mini-jeux ;
- déblocages permanents de contenu secondaire.

Exemples d'achats visés :

- `10%` de remise sur les fragments de la boutique du mode histoire ;
- `+10%` de récompenses en cas de réussite dans les événements du mode histoire ;
- déblocage permanent d'accès à des mini-jeux comme `Stratego` ou `Fighter` ;
- déblocage permanent d'un mode `Boss Rush` ;
- déblocage permanent de décors supplémentaires pour le mode arcade.

Décors arcade visés :

- décor standard disponible d'emblée : `forêt` ;
- décor du `2e parcours` du mode histoire : `grotte / volcan` ;
- décor du `3e parcours` du mode histoire : `donjon`.

Intention de déblocage :

- le mode histoire introduit naturellement ces univers au fil des parcours ;
- l'Astrolabe permet ensuite d'acheter leur usage permanent dans le mode arcade ;
- le mode arcade ne propose donc au départ que `forêt`, puis s'enrichit via la méta-progression.

Position actuelle sur les potions et fragments :

- pas d'améliorations permanentes de potions dans la V1 ;
- pas d'améliorations permanentes de fragments dans la V1 ;
- raison : ce type d'upgrade rendrait l'équilibrage du mode histoire et du mode arcade beaucoup plus fragile.

Conclusion de design actuelle :

- l'Astrolabe sert d'abord à débloquer du contenu et à améliorer l'économie ;
- les améliorations directes de gameplay sur potions/fragments sont volontairement écartées pour le moment ;
- une éventuelle V2 pourra les réexaminer plus tard si la méta-progression a besoin de plus de profondeur.

Première grille de prix retenue :

- décor `grotte / volcan` : `30 étoiles`
- décor `donjon` : `60 étoiles`
- `10%` de remise sur les fragments de la boutique du mode histoire : `60 étoiles`
- `+10%` sur les récompenses positives des événements du mode histoire : `70 étoiles`
- déblocage permanent du mini-jeu `Stratego` : `90 étoiles`
- déblocage permanent du mini-jeu `Fighter` : `90 étoiles`
- déblocage permanent du mode `Boss Rush` : `140 étoiles`

Intention économique actuelle :

- permettre un premier achat rapide et gratifiant grâce au décor `grotte / volcan` ;
- garder ensuite des objectifs de moyen terme avec les bonus économiques ;
- réserver les mini-jeux à des objectifs plus longs.

Règle actuelle pour `Faveur Astrale` :

- la réduction de `10%` sur les fragments s'applique dans toutes les boutiques du mode histoire ;
- elle s'applique sur tous les parcours ;
- le calcul se fait après le multiplicateur de parcours, puis le résultat est arrondi à l'entier le plus proche.

Notification one-shot actuelle pour `Faveur Astrale` :

- à la première ouverture de la boutique du mode histoire :
  - notification :
    - `Grâce à la Faveur astrale de l'Astrolabe, vous bénéficiez d'une remise de 10 % sur les fragments.`
  - bouton :
    - `Merci !`

Règle actuelle pour `Bonne étoile` :

- bonus permanent de `+10%` sur les récompenses positives en pièces d’or des événements ;
- le bonus ne s’applique pas :
  - aux pertes d’or ;
  - aux récompenses en potion ;
  - aux récompenses en fragment.

Notification one-shot actuelle pour `Bonne étoile` :

- à la première récompense positive en pièces d’or obtenue dans un événement :
  - notification :
    - `Grâce à la Bonne étoile de l'Astrolabe, vous bénéficiez d'un gain de 10 % sur votre récompense en pièces d'or.`
  - bouton :
    - `Merci !`

Visuels actuellement intégrés dans l’Astrolabe :

- `Faveur Astrale`
- `Bonne étoile`
- `Vulkarn`
- `Drazhul`

Visuels actuellement intégrés dans le carousel `Royaume` du briefing arcade :

- `Verdombre`
- `Vulkarn`
- `Drazhul`

## Événements du mode histoire

Règle actuelle de tirage :

- un événement déjà accompli pendant un parcours ne doit pas réapparaître tant qu’il reste des événements inédits dans le pool ;
- les événements terminés sont mémorisés dans `completedEventIds` ;
- si tous les événements du pool ont déjà été vus, le système peut ensuite retomber sur le pool complet pour éviter de bloquer la progression.

## Bonus de plateau

## Foudre

Effet :

- crée une action de ligne/colonne ;
- bonus orienté impact large.

## Explosion

Effet :

- explosion locale simple ;
- centre + cases adjacentes immédiates ;
- portée de rayon `1`.

## Super-bombe

Effet :

- plus puissant qu'une explosion simple ;
- portée plus large ;
- bombe appartenant à un joueur spécifique ;
- les IA évitent autant que possible de déclencher directement la super-bombe du joueur, sauf en dernier recours.

## Glace

Fonctionnement :

- le bonus glace apparaît sur le plateau sous forme d'icône dédiée ;
- quand il est capturé, il gèle une zone `3x3` ;
- un seul visuel `ice.png` couvre toute la zone ;
- la partie qui dépasse du plateau est masquée ;
- le gel dure `2` tours ;
- au second tour, la glace devient plus translucide.

Effets de gameplay :

- les tuiles gelées sont bloquées temporairement ;
- elles dégèlent ensuite automatiquement.

Durée :

- la glace disparaît après `2` tours du joueur rouge.

## Marais

Fonctionnement :

- le bonus marais apparaît sur le plateau avec son icône dédiée ;
- quand il est capturé, il crée un visuel `swamp.png` couvrant une zone `3x3` ;
- l'effet reste `2` tours ;
- il n'utilise pas de transparence particulière.

Effets de gameplay :

- la zone est bloquée pendant la durée du marais ;
- à l'expiration, les tuiles couvertes deviennent grises ;
- ces tuiles grises restent des tuiles neutres normales et capturables.

Durée :

- le marais disparaît après `2` tours du joueur rouge.

## Tuiles grises

Les tuiles grises sont actuellement :

- des tuiles neutres ;
- capturables normalement ;
- principalement produites par le marais.

Le système expérimental de verrouillage définitif des zones grises a été suspendu.

## Jauge de progression

La jauge du bas représente la progression du joueur rouge vers l'objectif de victoire.

Elle sert aussi de support à un système de progression secondaire de type "battle pass de partie".

## Potions de progression

## Principe général

Trois potions différentes sont choisies pour la partie parmi un pool disponible.

Paliers actuels :

- `50%`
- `65%`
- `80%`

Chaque potion possède :

- un cran coloré dans la jauge ;
- une icône sous la jauge ;
- un état disponible ou indisponible ;
- un éventuel cooldown après consommation.

## Activation

Une potion devient utilisable quand la progression dépasse son cran.

Si la jauge redescend sous ce cran :

- la potion redevient indisponible ;
- elle reste visible mais translucide.

Quand la potion est disponible :

- elle apparaît pleinement visible ;
- elle peut être cliquée.

Si le joueur clique une seconde fois sur une potion déjà sélectionnée avant de l'utiliser :

- la potion est désactivée ;
- le mode potion se ferme ;
- le jeu revient à l'état normal.

## Cooldown et retour

Après consommation :

- animation `pouf` ;
- la potion disparaît ;
- un compteur apparaît ;
- l'icône de potion reste visible en filigrane translucide sous le compteur ;
- plus le retour approche, plus cette icône redevient visible ;
- à `0`, le compteur disparaît et la potion revient.

Le retour dépend de la difficulté :

- `Facile` : `5` tours du joueur
- `Normal` : `10` tours du joueur
- `Difficile` : `15` tours du joueur

Chaque potion possède son propre cooldown indépendant.

## Potions implémentées

## Potion rose

Effet :

- place immédiatement `1` tuile rouge sur le plateau.

Utilisation :

1. le joueur active la potion ;
2. le mode potion s'affiche ;
3. premier clic : prévisualisation de la case ;
4. second clic : validation ;
5. la case devient rouge.

## Potion orange

Effet :

- convertit une zone `3x3` en rouge.

Utilisation :

1. activation de la potion ;
2. mode potion ;
3. premier clic : affichage du voile `3x3` ;
4. second clic : validation ;
5. la zone passe rapidement en rouge.

Le joueur peut cibler n'importe où sur le plateau, sans contrainte d'adjacence.

## Potion menthe

Effet :

- convertit une forme en croix.

La croix couvre :

- la case centrale ;
- haut ;
- bas ;
- gauche ;
- droite.

Utilisation :

1. activation ;
2. mode potion ;
3. premier clic : aperçu de la croix ;
4. second clic : validation ;
5. la croix devient rouge.

## Potion marron

Effet :

- donne une action bonus immédiate avant le tour normal du joueur.

Utilisation :

1. activation de la potion ;
2. entrée en mode potion ;
3. la potion sélectionnée pulse visuellement ;
4. le joueur joue son action bonus ;
5. la potion disparaît avec `pouf` ;
6. le jeu revient à l'état normal ;
7. le joueur joue ensuite son tour normal.

## Potion blanche

Effet :

- supprime un bonus encore présent sur une tuile du plateau ;
- le bonus doit avoir été déposé par un ennemi ;
- la potion ne supprime pas les conséquences déjà déclenchées.

Exemples :

- elle peut retirer une tuile `ICE`, `SWAMP`, `LIGHTNING`, `BOMB` ou une bombe ennemie encore présente ;
- elle peut aussi supprimer une `SUPER_BOMB` ennemie encore présente sur une tuile ;
- elle ne peut pas annuler un marais déjà actif ;
- elle ne peut pas annuler une glace déjà déclenchée.

Utilisation :

1. activation de la potion ;
2. mode potion ;
3. premier clic : prévisualisation d'une tuile portant un bonus ennemi ;
4. second clic : validation ;
5. le bonus ciblé est retiré de la tuile.

## Potion cyan

Effet :

- protège une zone `3x3` du joueur pendant `3` tours ;
- chaque tuile protégée affiche un `🛡️` ;
- les ennemis ne peuvent pas capturer cette zone pendant la durée de protection.

Utilisation :

1. activation de la potion ;
2. mode potion ;
3. sélection d'une zone `3x3` ;
4. validation ;
5. seules les tuiles rouges de cette zone reçoivent un bouclier.

Durée :

- la protection disparaît après `3` tours du joueur rouge.

## Mode potion

Quand une potion est sélectionnée :

- tout l'écran du jeu bascule progressivement en noir et blanc ;
- le plateau reste en couleur ;
- la potion sélectionnée reste en couleur ;
- le héros et sa bulle restent en couleur ;
- la potion active pulse légèrement ;
- quand l'effet se termine, le jeu revient progressivement à la couleur.

Ce mode est géré séparément du monochrome de fin de partie.

## Anticipation ennemie

Pendant le tour du joueur :

- les intentions des ennemis sont calculées en arrière-plan ;
- elles ne sont pas affichées automatiquement ;
- le joueur doit cliquer sur un ennemi pour révéler temporairement son intention.

Quand le joueur clique sur un ennemi :

- un anneau pulsant apparaît quelques instants sur la zone où cet ennemi envisage de jouer ;
- l'anneau est légèrement plus grand qu'une tuile ;
- il n'affiche qu'un contour, sans disque intérieur ;
- l'anneau est de la couleur de l'ennemi ;
- le violet utilise une teinte plus sombre pour rester lisible ;
- l'anneau est rendu au-dessus des tuiles ;
- après un court moment, l'anneau disparaît.

Limite d'usage :

- chaque ennemi ne peut être consulté qu'une seule fois par tour du joueur.

La taille de cette zone varie selon la difficulté :

- `Facile` : anneau le plus précis ;
- `Normal` : anneau plus large ;
- `Difficile` : anneau encore plus large.

Quand le joueur clique pour commencer une action sur le plateau :

- l'anneau éventuellement visible disparaît progressivement.

Comportement IA associé :

- l'IA mémorise l'action correspondant à l'anneau ;
- quand son tour arrive, elle essaie de jouer dans cette zone ;
- si la case exacte n'est plus valable, elle cherche un coup proche ;
- si la zone a été trop perturbée, elle reprend sa logique normale.

## IA ennemie

Les ennemis ont des profils distincts.
Leur comportement varie selon :

- le style du profil ;
- la difficulté ;
- les bonus disponibles ;
- le contexte du plateau.

Profils observables :

- opportuniste ;
- bâtisseur ;
- agressif.

Les IA disposent aussi :

- d'un temps de réflexion simulé ;
- d'une bulle de réflexion ;
- d'une révélation de pensée avant action.

## Animation de début de partie

Au lancement du plateau :

- les zones de couleur ne s'affichent pas d'un bloc ;
- elles s'allument l'une après l'autre ;
- la zone du joueur rouge apparaît en premier ;
- puis les autres couleurs suivent ;
- ensuite seulement la partie commence réellement.

## Écran de victoire / défaite

Quand la partie se termine :

- toute la fenêtre passe progressivement en noir et blanc ;
- cette fois, tous les éléments sont concernés :
  - plateau ;
  - potions ;
  - héros ;
  - bulle ;
  - interface complète ;
- un parchemin apparaît au centre ;
- le message dépend de la victoire ou de la défaite.

### Victoire

Message :

- `Bravo ! Vous avez gagné !`

### Défaite

Un message est choisi aléatoirement parmi trois variantes traduites.

## Statistiques de fin de partie

Le panneau de fin permet d'afficher des statistiques.

Statistiques actuelles :

- pourcentage de l'objectif atteint ;
- pourcentage maximal du territoire couvert ;
- nombre total de tuiles capturées ;
- potions consommées pendant la partie.

Les potions consommées sont affichées sous forme :

- d'un nombre ;
- suivi de l'icône de la potion ;
- sur une seule ligne.

## Traduction

Le jeu dispose d'un système de traduction centralisé.

Langues actuellement gérées :

- français ;
- anglais.

Tous les textes de l'interface doivent être pilotés par les clés de traduction.

## Police

La police de référence du jeu pour le texte est `Vollkorn`, chargée depuis Google Fonts.

## Cheats et outils de test

Le jeu dispose actuellement d'un panneau de triche en jeu.
Il permet notamment :

- d'activer les potions de progression pour test ;
- de forcer la victoire ;
- de forcer la défaite.

Des raccourcis clavier existent aussi pour plusieurs bonus et potions.

Ce panneau reste un outil de développement temporaire et pourra disparaître plus tard.

## État actuel des grandes mécaniques

## En place

- capture et cascade ;
- difficultés IA ;
- jauges de bonus ;
- bombe posable ;
- bonus foudre, glace, explosion, marais ;
- jauge de progression ;
- potions de progression ;
- cooldown indépendant des potions ;
- mode potion ;
- anticipation ennemie par anneaux pulsants ;
- écran d'accueil ;
- traduction FR / EN ;
- écran de victoire / défaite ;
- statistiques de fin de partie.

## Suspendu

- verrouillage définitif de zones grises ;
- zones grises générées au lancement comme objectif secondaire.

## Trophées

### Liste actuelle

#### Victoires sans ressources

- `tro_0101.png` : `Apprenti ascétique`
  Gagner en mode facile sans potion.
- `tro_0102.png` : `Disciple du vide`
  Gagner en mode normal sans potion.
- `tro_0103.png` : `Maître du dépouillement`
  Gagner en mode difficile sans potion.
- `tro_0104.png` : `Stratège désarmé`
  Gagner sans utiliser de bombe.
- `tro_0105.png` : `Volonté inébranlable`
  Gagner sans utiliser de bonus de chaos.
- `tro_0106.png` : `Ascèse parfaite`
  Gagner sans potion, sans bombe et sans bonus de chaos.

#### Combat et domination

- `tro_0201.png` : `Triomphe des Trois Royaumes`
  Gagner contre `3` ennemis.
- `tro_0202.png` : `Souverain des Trois Couronnes`
  Gagner contre `3` ennemis en mode difficile.
- `tro_0203.png` : `Duel royal`
  Gagner un `8x8` contre `1` ennemi en mode difficile.
- `tro_0204.png` : `Marche impériale`
  Gagner successivement sur `8x8`, `12x12` et `14x14`.
- `tro_0205.png` : `Roi du chaos`
  Gagner une partie à `4` joueurs après activation de la zone morte.

#### Bombes et manipulation

- `tro_0301.png` : `Retour du destin`
  Profiter d’une bombe adverse pour gagner.
- `tro_0302.png` : `Artificier du chaos`
  Faire exploser `5` bombes dans une partie.
- `tro_0303.png` : `Étincelle volée`
  Déclencher une bombe adverse.
- `tro_0304.png` : `Piège du marionnettiste`
  Laisser un ennemi déclencher une bombe à ton avantage.
- `tro_0305.png` : `Réaction en chaîne`
  Déclencher `3` bombes dans le même tour.

#### Tsunami

- `tro_0401.png` : `Vague montante`
  Déclencher une cascade de `10` tuiles ou plus.
- `tro_0402.png` : `Déluge inarrêtable`
  Déclencher une cascade de `20` tuiles ou plus.

#### L’atelier de l’alchimiste

- `tro_0501.png` : `Alchimie totale`
  Utiliser les `3` potions dans une même partie.
- `tro_0502.png` : `Grand cru`
  Utiliser `4` potions ou plus dans une même partie.

#### Le stratège

- `tro_0601.png` : `Renaissance du conquérant`
  Revenir de moins de `30 %` de contrôle à la victoire.
- `tro_0602.png` : `Blitz royal`
  Gagner une partie en moins de `10` tours.
- `tro_0603.png` : `Empire immaculé`
  Gagner une partie de `14x14` sans utiliser de bonus.
- `tro_0604.png` : `Conquête éclair`
  Gagner un `8x8` en moins de `7` tours.
- `tro_0605.png` : `Maître des Royaumes`
  Gagner au moins une fois sur chacun des `3` Royaumes en mode arcade.

#### Le Cristal de Cascara

- `tro_0701.png` : `Première lumière`
  Vaincre la Salamandre.
- `tro_0702.png` : `Coeur de pierre`
  Vaincre le Golem.
- `tro_0703.png` : `Dernier cristal`
  Vaincre l’Ogre.
- `tro_0704.png` : `Héros de Cascara`
  Terminer les `3` parcours du mode histoire.
- `tro_0705.png` : `Collectionneur de fragments`
  Posséder tous les fragments au moins une fois au cours d’une campagne.

#### Les Trois Couronnes

- `tro_0801.png` : `Brise-feu`
  Battre la Salamandre sans laisser plus de `3` tuiles brûlantes en jeu.
- `tro_0802.png` : `Marteau brisé`
  Battre le Golem sans utiliser de bombe.
- `tro_0803.png` : `Dompteur de chaos`
  Battre l’Ogre sans bénédiction de chaos.

#### Cascara Stratego

- `tro_0901.png` : `Premier casse-tête`
  Gagner un puzzle `Stratego` `8x8`.
- `tro_0902.png` : `Esprit tactique`
  Gagner tous les puzzles `Stratego` `8x8`.
- `tro_0903.png` : `Architecte du territoire`
  Gagner un puzzle `Stratego` `12x12`.
- `tro_0904.png` : `Cartographe d’élite`
  Gagner tous les puzzles `Stratego` `12x12`.
- `tro_0905.png` : `Maître stratège`
  Gagner un puzzle `Stratego` `14x14`.
- `tro_0906.png` : `Souverain du puzzle`
  Gagner tous les puzzles `Stratego` `14x14`.
- `tro_0907.png` : `Coup parfait`
  Gagner un puzzle `Stratego` en utilisant exactement le nombre minimal de coups.
- `tro_0908.png` : `Sans bavure`
  Gagner un puzzle `Stratego` avec au moins `2` coups restants.

#### Cascara Fight

- `placeholder` : `Premier KO`
  Gagner un combat dans `Cascara Fight`.

- `placeholder` : `Maître de l’arène`
  Battre tous les adversaires de `Cascara Fight`, y compris les boss.

#### Cascara Boss Rush

- `tro_1101.png` : `Couronne de braise`
  Terminer un `Boss Rush` en mode facile.

- `tro_1102.png` : `Couronne d’argent`
  Terminer un `Boss Rush` en mode normal.

- `tro_1103.png` : `Couronne de diamants`
  Terminer un `Boss Rush` en mode difficile.

- `tro_1104.png` : `Neuf couronnes`
  Terminer le `Boss Rush` en mode `Ultime`.

- `tro_1105.png` : `Sans filet`
  Terminer un `Boss Rush` sans utiliser de potion.

Trophées `Stratego` actuellement suspendus :

- `tro_0907.png` : `Coup parfait`
  Suspendu tant qu’on ne dispose pas d’une vraie mesure fiable du nombre minimal absolu de coups.

### Avancement visuel

Les trophées suivants ont maintenant leur visuel définitif intégré dans `assets/images/trophies/` :

- `tro_0106.png`
- `tro_0203.png`
- `tro_0204.png`
- `tro_0205.png`
- `tro_0305.png`
- `tro_0502.png`
- `tro_0604.png`
- `tro_0605.png`
- `tro_0701.png`
- `tro_0702.png`
- `tro_0703.png`
- `tro_0704.png`
- `tro_0705.png`
- `tro_0801.png`
- `tro_0802.png`
- `tro_0803.png`
- `tro_0901.png`
- `tro_0902.png`
- `tro_0903.png`
- `tro_0904.png`
- `tro_0905.png`
- `tro_0906.png`
- `tro_0908.png`
- `tro_1001.png`
- `tro_1002.png`
- `tro_1101.png`
- `tro_1102.png`
- `tro_1103.png`
- `tro_1104.png`
- `tro_1105.png`

Les trophées des mini-jeux `Cascara Stratego`, `Cascara Fight` et `Cascara Boss Rush` sont visibles dans la liste générale des trophées même si les mini-jeux n’ont pas encore été achetés dans l’Astrolabe.

## Comment jouer ?

### Texte de référence actuel

#### Introduction

Avant de partir à l’aventure, voici quelques repères pour jouer à Cascara.

#### Le but du jeu

Étendez votre territoire en capturant un maximum de tuiles adverses ! Sélectionnez une tuile adjacente à votre territoire, et faites tomber toutes les autres aux alentours. Mais attention, vos ennemis aussi peuvent capturez vos tuiles…

Vous gagnez le combat en annihilant complètement le territoire de vos adversaires, ou en contrôlant la majorité du plateau (surveillez votre jauge de progression !).

#### La jauge du chaos

En capturant des tuiles, vous remplissez votre jauge du chaos.
Lorsqu’elle est pleine, elle vous donne un bonus puissant : super-bombe ou effet spécial. À vous de tous les découvrir et d'en tirer profit ! Les ennemis peuvent eux aussi profiter de leur propre jauge du chaos.

#### Les principaux modes

Mode Arcade : lancez des parties rapides avec le nombre d’ennemis, la taille du plateau et la difficulté de votre choix.

Le Cristal de Cascara : traversez les Trois Royaumes parsemés de combats, d'événement, de boutiques et des Trois Couronnes, les boss redoutables à la fin de chaque parcours. L'aventure est à chaque fois différente !

#### Les potions

Les potions donnent un avantage immédiat pendant un combat : capturer une zone, protéger des tuiles, annuler un bonus ennemi ou gagner une action supplémentaire. Elles peuvent être utilisées lorsque la jauge de progression atteint certains seuils pendant un combat.

Les potions se débloquent progressivement dans le Cristal de Cascara. Dans le mode Arcade, elles sont toutes activées, et trois d'entre elles sont choisies aléatoirement avant chaque combat.

#### Les fragments

Les fragments sont des bonus stratégiques avant un combat dans le Cristal de Cascara. Ils permettent par exemple de commencer en premier, d’améliorer une jauge, de renforcer votre territoire de départ ou de perturber un ennemi. Vous pouvez en acheter contre des pièces d'or dans une des boutiques des Trois Royaumes.

#### L’Astrolabe

Chaque combat gagné (ou perdu !) vous fait gagner des étoiles, que ce soit dans le mode Arcade ou dans le Cristal de Cascara. Vous pouvez les dépensez dans l'Astrolabe pour déverrouiller des décors, des bonus utiles et même des mini-jeux !

#### Le stratège

- `Forteresse rouge`
  Gagner sans jamais descendre sous `40 %` de contrôle après le tour `5`.
- `Conquête éclair`
  Gagner un `8x8` en moins de `7` tours.
- `Maître des Royaumes`
  Gagner au moins une fois sur chacun des `3` décors arcade.

#### Le Cristal de Cascara

- `Première lumière`
  Vaincre la Salamandre.
- `Coeur de pierre`
  Vaincre le Golem.
- `Dernier cristal`
  Vaincre l’Ogre.
- `Héros de Cascara`
  Terminer les `3` parcours du mode histoire.
- `Collectionneur de fragments`
  Posséder tous les fragments au moins une fois au cours d’une campagne.

#### Les Trois Couronnes

- `Brise-feu`
  Battre la Salamandre sans laisser plus de `3` tuiles brûlantes en jeu.
- `Marteau brisé`
  Battre le Golem sans utiliser de bombe.
- `Dompteur de chaos`
  Battre l’Ogre sans bénédiction de chaos.

## Fichiers utiles

- logique principale de scène : `src/flow/GameSceneFlow.js`
- potions de progression : `src/flow/ProgressPotionFlow.js`
- mode potion : `src/flow/PotionModeController.js`
- monochrome de fin : `src/flow/EndScreenMonochromeController.js`
- rendu du plateau : `src/board/GameBoardRenderer.js`
- overlays du plateau : `src/board/GameBoardOverlays.js`
- HUD général : `src/hud/GameBoardHUD.js`
- jauge de progression : `src/hud/GameBoardGoalGauge.js`
- panneau de fin : `src/hud/GameBoardEndPanel.js`
- IA : `src/ai/AIPlayer.js`
- traductions : `src/core/I18n.js`

## Note de maintenance

Ce document décrit l'état actuel du jeu et doit être mis à jour à chaque fois qu'une mécanique est :

- ajoutée ;
- remplacée ;
- suspendue ;
- ou refondue visuellement.
