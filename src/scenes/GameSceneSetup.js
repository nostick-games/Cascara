class GameSceneSetup {
    constructor(scene) {
        this.scene = scene;
    }

    preloadEnemyAssets() {
        const enemyDefinitions = EnemyDefinitions.getAll();

        this.scene.load.spritesheet('hero-idle', 'assets/images/hero/idle_right.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.scene.load.spritesheet('hero-idle-face', 'assets/images/hero/idle_face.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.scene.load.image('tile-red', 'assets/images/tiles/tile_red.png');
        this.scene.load.image('tile-blue', 'assets/images/tiles/tile_blue.png');
        this.scene.load.image('tile-green', 'assets/images/tiles/tile_green.png');
        this.scene.load.image('tile-scarlet', 'assets/images/tiles/tile_scarlet.png');
        this.scene.load.image('tile-grey', 'assets/images/tiles/tile_grey.png');
        this.scene.load.spritesheet('tile-red-off', 'assets/images/tiles/tile_red_off.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.scene.load.spritesheet('tile-red-on', 'assets/images/tiles/tile_red_on.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.scene.load.spritesheet('tile-blue-off', 'assets/images/tiles/tile_blue_off.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.scene.load.spritesheet('tile-blue-on', 'assets/images/tiles/tile_blue_on.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.scene.load.spritesheet('tile-green-off', 'assets/images/tiles/tile_green_off.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.scene.load.spritesheet('tile-green-on', 'assets/images/tiles/tile_green_on.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.scene.load.spritesheet('tile-scarlet-off', 'assets/images/tiles/tile_scarlet_off.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.scene.load.spritesheet('tile-scarlet-on', 'assets/images/tiles/tile_scarlet_on.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.scene.load.spritesheet('tile-grey-off', 'assets/images/tiles/tile_grey_off.png', {
            frameWidth: 13,
            frameHeight: 13
        });
        this.scene.load.spritesheet('tile-grey-on', 'assets/images/tiles/tile_grey_on.png', {
            frameWidth: 13,
            frameHeight: 13
        });

        this.scene.load.image('forest-fight-bg', 'assets/images/maps/forest_fight.png');
        this.scene.load.image('cave-fight-bg', 'assets/images/maps/grotte_fight.jpg');
        this.scene.load.image('dungeon-fight-bg', 'assets/images/maps/donjon_fight.jpg');
        this.scene.load.image('forest-edge-top', 'assets/images/maps/Forest/bord_haut.png');
        this.scene.load.image('forest-edge-bottom', 'assets/images/maps/Forest/bord_bas.png');
        this.scene.load.image('forest-edge-left', 'assets/images/maps/Forest/bord_gauche.png');
        this.scene.load.image('forest-edge-right', 'assets/images/maps/Forest/bord_droite.png');
        this.scene.load.image('forest-corner-top-left', 'assets/images/maps/Forest/coin_haut_gauche.png');
        this.scene.load.image('forest-corner-top-right', 'assets/images/maps/Forest/coin_haut_droit.png');
        this.scene.load.image('forest-corner-bottom-left', 'assets/images/maps/Forest/coin_bas_gauche.png');
        this.scene.load.image('forest-corner-bottom-right', 'assets/images/maps/Forest/coin_bas_droit.png');
        this.scene.load.image('ui-goal-gauge-empty', 'assets/images/UI/jauge_vide.png');
        this.scene.load.image('ui-goal-gauge-full', 'assets/images/UI/jauge_pleine.png');
        this.scene.load.image('ui-goal-gauge-blue', 'assets/images/UI/jauge_bleue.png');
        this.scene.load.image('ui-bottom-decor-books', 'assets/images/UI/decor_books.png');
        this.scene.load.image('ui-bottom-decor-roof', 'assets/images/UI/decor_roof.png');
        this.scene.load.image('ui-bottom-decor-skull', 'assets/images/UI/decor_skull.png');
        this.scene.load.image('ui-parchment', 'assets/images/UI/parchemin.png');
        this.scene.load.image('ui-button-left-off', 'assets/images/UI/bouton_bord_gauche_off.png');
        this.scene.load.image('ui-button-fill-off', 'assets/images/UI/bouton_fond_off.png');
        this.scene.load.image('ui-button-right-off', 'assets/images/UI/bouton_bord_droite_off.png');
        this.scene.load.image('ui-button-left-on', 'assets/images/UI/bouton_bord_gauche_on.png');
        this.scene.load.image('ui-button-fill-on', 'assets/images/UI/bouton_fond_on.png');
        this.scene.load.image('ui-button-right-on', 'assets/images/UI/bouton_bord_droite_on.png');
        this.scene.load.image('story-gold', 'assets/images/story/gold.png');
        this.scene.load.image('meta-star', 'assets/images/bonus/star.png');
        this.scene.load.image('story-fragment-initiative', 'assets/images/fragments/fragment_initiative.png');
        this.scene.load.image('story-fragment-ambition', 'assets/images/fragments/fragment_ambition.png');
        this.scene.load.image('story-fragment-alchemist', 'assets/images/fragments/fragment_alchemist.png');
        this.scene.load.image('story-fragment-fire', 'assets/images/fragments/fragment_fire.png');
        this.scene.load.image('story-fragment-rune', 'assets/images/fragments/fragment_rune.png');
        this.scene.load.image('story-fragment-guardian', 'assets/images/fragments/fragment_guardian.png');
        this.scene.load.image('story-fragment-lost', 'assets/images/fragments/fragment_lost.png');
        this.scene.load.image('story-fragment-phoenix', 'assets/images/fragments/fragment_phoenix.png');
        this.scene.load.audio('tile-clap', 'assets/sounds/clap.mp3');
        this.scene.load.image('bonus-bomb-icon', 'assets/images/bonus/bomb_icon.png');
        this.scene.load.image('bonus-explosion-icon', 'assets/images/bonus/explosion_icon.png');
        this.scene.load.spritesheet('bonus-lightning-tile', 'assets/images/bonus/lightning/tile_lightning.png', {
            frameWidth: 256,
            frameHeight: 256
        });
        this.scene.load.image('bonus-lightning-clouds-left', 'assets/images/bonus/lightning/lightning_clouds_left.png');
        this.scene.load.image('bonus-lightning-clouds-right', 'assets/images/bonus/lightning/lightning_clouds_right.png');
        this.scene.load.image('bonus-lightning-1', 'assets/images/bonus/lightning/lightning.png');
        this.scene.load.image('bonus-lightning-2', 'assets/images/bonus/lightning/lightning2.png');
        this.scene.load.image('bonus-lightning-3', 'assets/images/bonus/lightning/lightning3.png');
        this.scene.load.image('bonus-ice', 'assets/images/bonus/ice.png');
        this.scene.load.image('bonus-ice-icon', 'assets/images/bonus/ice_icon.png');
        this.scene.load.image('bonus-swamp', 'assets/images/bonus/swamp.png');
        this.scene.load.image('bonus-swamp-icon', 'assets/images/bonus/swamp_icon.png');
        this.scene.load.image('progress-potion-rose', 'assets/images/bonus/potion_rose.png');
        this.scene.load.image('progress-potion-orange', 'assets/images/bonus/potion_orange.png');
        this.scene.load.image('progress-potion-menthe', 'assets/images/bonus/potion_menthe.png');
        this.scene.load.image('progress-potion-marron', 'assets/images/bonus/potion_marron.png');
        this.scene.load.image('progress-potion-blanche', 'assets/images/bonus/potion_white.png');
        this.scene.load.image('progress-potion-cyan', 'assets/images/bonus/potion_cyan.png');
        this.scene.load.image('progress-potion-shadow', 'assets/images/bonus/potion_shadow.png');
        this.scene.load.spritesheet('progress-potion-pouf', 'assets/images/bonus/pouf.png', {
            frameWidth: 72,
            frameHeight: 72
        });
        this.scene.load.image('progress-notch-rose', 'assets/images/UI/jauge_rose.png');
        this.scene.load.image('progress-notch-orange', 'assets/images/UI/jauge_orange.png');
        this.scene.load.image('progress-notch-menthe', 'assets/images/UI/jauge_menthe.png');
        this.scene.load.image('progress-notch-marron', 'assets/images/UI/jauge_.marron.png');
        this.scene.load.image('progress-notch-blanche', 'assets/images/UI/jauge_white.png');
        this.scene.load.image('progress-notch-cyan', 'assets/images/UI/jauge_cyan.png');
        this.scene.trophies.preloadAssets(this.scene);

        Object.values(enemyDefinitions).forEach((enemy) => {
            this.scene.load.spritesheet(enemy.idleTexture, enemy.idleAssetPath || `assets/images/enemies/${enemy.key.toLowerCase()}_idle_left.png`, {
                frameWidth: enemy.frameWidth || 64,
                frameHeight: enemy.frameHeight || 64
            });
            this.scene.load.spritesheet(enemy.deathTexture, enemy.deathAssetPath || `assets/images/enemies/${enemy.key.toLowerCase()}_death.png`, {
                frameWidth: enemy.frameWidth || 64,
                frameHeight: enemy.frameHeight || 64
            });
        });
    }

    initializeModules() {
        const config = this.buildBoardConfig();
        const playerOrder = GameSceneModeHelper.resolvePlayerOrder(this.scene);
        const enemyAssignments = GameSceneModeHelper.resolveEnemyAssignments(this.scene, playerOrder);

        this.scene.config = config;
        this.scene.playerOrder = playerOrder;
        this.scene.enemyAssignments = enemyAssignments;
        this.scene.gameLogic = new GameLogic(
            config.gridSize,
            playerOrder,
            config.specialCellCount,
            this.scene.difficulty
        );
        this.ensureEnemyAnimations();
        this.ensureBoardTileTextures(config.gridSize);
        this.ensureProgressPotionTextures();
        this.scene.gameBoard = new GameBoard(this.scene, config);
        this.scene.cascadeAnimation = new CascadeAnimation(config.gridSize);
        this.scene.aiControllers = this.createAIControllers(playerOrder, enemyAssignments);
    }

    initializeGameState() {
        this.scene.gameState = {
            grid: [],
            currentPlayer: null,
            gameOver: false,
            cascadeActive: false,
            playerOrder: this.scene.playerOrder.slice(),
            selectingStartingPlayer: !this.scene.isStrategoMode,
            lightningCharge: this.createInitialCounterMap(),
            availableBonuses: this.createInitialAvailableBonusMap(),
            bonusHoldTurns: this.createInitialCounterMap(),
            bonusUseThresholds: this.createInitialBonusThresholdMap(),
            nextBonusStage: this.createInitialBonusStageMap(),
            progressPotions: (this.scene.isStrategoMode || this.scene.isFightMode)
                ? []
                : this.scene.preselectedProgressPotions
                ? this.scene.preselectedProgressPotions.map((potion) => ({ ...potion }))
                : this.selectProgressPotions(),
            aiIntentPreviewActions: {},
            aiIntentPreviewRevealed: {},
            pendingPlacementBonus: null,
            pendingProgressPotion: null,
            pendingProgressPotionTarget: null,
            specialActionInProgress: false,
            extraTurnCount: 0,
            playerTurnCount: 0,
            battleRoyale: {
                lockedRingCount: 0,
                lockedTileCount: 0,
                finalClosureReached: false,
                activationTurn: null,
                stagnationHistory: []
            },
            objectiveProgressBonusPercent: 0,
            pendingObjectiveProgressBonusPercent: 0,
            firstPotionUnlockOffsetSegments: 0,
            berserkExtraActionsRemaining: 0,
            berserkSkipCurrentAction: false,
            berserkMissedExtraActionCue: false,
            berserkMissedActionEmoji: null,
            strategoMovesRemaining: this.scene.isStrategoMode
                ? Math.max(0, Math.floor(this.scene.strategoConfig?.moveLimit || 0))
                : null,
            fightHealth: this.scene.isFightMode
                ? { ROUGE: 100, BLEU: 100 }
                : null,
            fightTurnStartTileCounts: this.scene.isFightMode
                ? { ROUGE: 0, BLEU: 0 }
                : null,
            playerStats: {
                maxProgressPercent: 0,
                maxObjectiveProgressPercent: 0,
                totalCapturedTiles: 0,
                consumedPotions: {
                    ROSE: 0,
                    ORANGE: 0,
                    MENTHE: 0,
                    MARRON: 0,
                    BLANCHE: 0,
                    CYAN: 0
                },
                trophyTracker: this.scene.trophies.initializeTracker()
            }
        };
    }

    initializeGrid() {
        if (this.scene.isStrategoMode && this.scene.strategoConfig?.initialGrid) {
            this.scene.gameState.grid = this.scene.strategoConfig.initialGrid.map((row) =>
                row.map((cell) => ({ ...cell }))
            );
            return;
        }

        if (this.scene.isFightMode) {
            this.scene.gameState.grid = GameSceneModeHelper.createFightInitialGrid(
                this.scene.gameLogic,
                this.scene.config.gridSize
            );
            return;
        }

        this.scene.gameState.grid = this.scene.gameLogic.initializeGrid();
    }

    buildBoardConfig() {
        const boardPresets = {
            8: { gridSize: 8, specialCellCount: 1, bombBonusSpawnCount: 2 },
            12: { gridSize: 12, specialCellCount: 2, bombBonusSpawnCount: 3 },
            14: { gridSize: 14, specialCellCount: 3, bombBonusSpawnCount: 4 }
        };
        const preset = boardPresets[this.scene.boardSize] || boardPresets[14];
        const viewportWidth = Math.floor(window.innerWidth || this.scene.scale.width || 800);
        const viewportHeight = Math.floor(window.innerHeight || this.scene.scale.height || 700);
        const isMobileViewport = viewportWidth <= 500;
        const backgroundSourceWidth = 400;
        const backgroundSourceHeight = 576;
        const plateauTopRatio = isMobileViewport ? 0.40 : 0.44;
        const frameOuterRatio = 0.45;
        const horizontalPadding = isMobileViewport ? 0 : 24;
        const bottomSafeSpace = isMobileViewport ? 30 : 40;
        const availableWidth = Math.max(200, viewportWidth - horizontalPadding * 2);
        const maxBackgroundWidthByHeight = isMobileViewport
            ? availableWidth
            : Math.floor(
                (viewportHeight - bottomSafeSpace) /
                (1 + ((backgroundSourceHeight / backgroundSourceWidth) * plateauTopRatio))
            );
        const targetBackgroundWidth = isMobileViewport
            ? availableWidth
            : Math.min(availableWidth, maxBackgroundWidthByHeight);
        const dynamicCellSize = Math.floor(
            targetBackgroundWidth / (preset.gridSize + frameOuterRatio * 2)
        );
        const maxDesktopCellSizeByBoard = {
            8: 56,
            12: 42,
            14: 36
        };
        const maxCellSize = isMobileViewport
            ? dynamicCellSize
            : (maxDesktopCellSizeByBoard[preset.gridSize] || 36);
        const cellSize = Math.min(
            maxCellSize,
            Math.max(isMobileViewport ? 22 : 28, dynamicCellSize)
        );
        const boardWidth = preset.gridSize * cellSize;
        const frameOuterOffset = Math.round(cellSize * frameOuterRatio);
        const frameBackgroundWidth = boardWidth + frameOuterOffset * 2;
        const backgroundWidth = isMobileViewport
            ? Math.max(frameBackgroundWidth, viewportWidth + 4)
            : frameBackgroundWidth;
        const offsetX = Math.floor((viewportWidth - boardWidth) / 2);
        const backgroundScaleWithFrame = backgroundWidth / backgroundSourceWidth;
        const offsetY = Math.round(backgroundSourceHeight * backgroundScaleWithFrame * plateauTopRatio);

        return {
            gridSize: preset.gridSize,
            cellSize,
            offsetX,
            offsetY,
            showBoardFrame: false,
            viewportWidth,
            viewportHeight,
            frameOuterOffset,
            battleBackgroundKey: GameSceneModeHelper.resolveBattleBackgroundKey(this.scene),
            battleBackgroundX: Math.floor(viewportWidth / 2),
            battleBackgroundWidth: backgroundWidth,
            battleBackgroundHeight: backgroundSourceHeight * backgroundScaleWithFrame,
            battleBackgroundTop: 0,
            specialCellCount: preset.specialCellCount,
            bombBonusSpawnCount: preset.bombBonusSpawnCount,
            colors: {
                ROUGE: 0xff0000,
                BLEU: 0x0000ff,
                VERT: 0x00ff00,
                JAUNE: 0x76428A,
                BLANC: 0xffffff,
                GRIS: 0x808080,
                NOIR: 0x000000
            }
        };
    }

    createAIControllers(playerOrder, enemyAssignments) {
        const controllers = {};
        const activeFragmentIds = Array.isArray(this.scene.storyContext?.storyState?.activeFragmentIds)
            ? this.scene.storyContext.storyState.activeFragmentIds
            : [this.scene.storyContext?.storyState?.activeFragmentId].filter(Boolean);
        const confusedEnemyColor = this.scene.storyContext?.storyState?.confusedEnemyColor || null;

        for (const color of playerOrder) {
            if (color !== 'ROUGE') {
                const enemyDifficulty = activeFragmentIds.includes('LOST') && confusedEnemyColor === color
                    ? this.getReducedDifficulty(this.scene.difficulty)
                    : this.scene.difficulty;
                controllers[color] = new AIPlayer(
                    this.scene.gameLogic,
                    enemyAssignments[color],
                    enemyDifficulty,
                    true
                );
            }
        }

        return controllers;
    }

    getReducedDifficulty(difficulty) {
        const downgradeMap = {
            HARD: 'NORMAL',
            NORMAL: 'EASY',
            EASY: 'HYPER_EASY'
        };

        return downgradeMap[difficulty] || 'EASY';
    }

    createInitialCounterMap() {
        const counterMap = {};

        this.scene.playerOrder.forEach((color) => {
            counterMap[color] = 0;
        });

        return counterMap;
    }

    createInitialAvailableBonusMap() {
        const bonusMap = {};

        this.scene.playerOrder.forEach((color) => {
            bonusMap[color] = null;
        });

        return bonusMap;
    }

    createInitialBonusStageMap() {
        const stageMap = {};

        this.scene.playerOrder.forEach((color) => {
            stageMap[color] = 'PLACE_BOMB';
        });

        return stageMap;
    }

    createInitialBonusThresholdMap() {
        const thresholdMap = {};

        this.scene.playerOrder.forEach((color) => {
            thresholdMap[color] = 0;
        });

        return thresholdMap;
    }

    getProgressPotionDefinitions() {
        return ProgressPotionCatalog.getDefinitions();
    }

    selectProgressPotionsFromPool(allowedPotionIds = null) {
        return ProgressPotionCatalog.selectFromPool(allowedPotionIds);
    }

    selectProgressPotions() {
        return this.selectProgressPotionsFromPool(null);
    }

    ensureEnemyAnimations() {
        const enemyDefinitions = EnemyDefinitions.getAll();

        if (!this.scene.anims.exists('hero-idle')) {
            this.scene.anims.create({
                key: 'hero-idle',
                frames: this.scene.anims.generateFrameNumbers('hero-idle', {
                    start: 0,
                    end: 3
                }),
                frameRate: 7,
                repeat: -1
            });
        }

        if (!this.scene.anims.exists('hero-idle-face')) {
            this.scene.anims.create({
                key: 'hero-idle-face',
                frames: this.scene.anims.generateFrameNumbers('hero-idle-face', {
                    start: 0,
                    end: 3
                }),
                frameRate: 7,
                repeat: -1
            });
        }

        Object.values(enemyDefinitions).forEach((enemy) => {
            const idleAnimationKey = this.getIdleAnimationKey(enemy.key);
            const deathAnimationKey = this.getDeathAnimationKey(enemy.key);

            if (!this.scene.anims.exists(idleAnimationKey)) {
                this.scene.anims.create({
                    key: idleAnimationKey,
                    frames: this.scene.anims.generateFrameNumbers(enemy.idleTexture, {
                        start: 0,
                        end: enemy.idleFrames - 1
                    }),
                    frameRate: 7,
                    repeat: -1
                });
            }

            if (!this.scene.anims.exists(deathAnimationKey)) {
                this.scene.anims.create({
                    key: deathAnimationKey,
                    frames: this.scene.anims.generateFrameNumbers(enemy.deathTexture, {
                        start: 0,
                        end: enemy.deathFrames - 1
                    }),
                    frameRate: 10,
                    repeat: 0
                });
            }
        });

        if (!this.scene.anims.exists('progress-potion-pouf')) {
            this.scene.anims.create({
                key: 'progress-potion-pouf',
                frames: this.scene.anims.generateFrameNumbers('progress-potion-pouf', {
                    start: 0,
                    end: 9
                }),
                frameRate: 18,
                repeat: 0
            });
        }

        if (!this.scene.anims.exists('bonus-lightning-tile-idle')) {
            this.scene.anims.create({
                key: 'bonus-lightning-tile-idle',
                frames: this.scene.anims.generateFrameNumbers('bonus-lightning-tile', {
                    start: 0,
                    end: 9
                }),
                frameRate: 12,
                repeat: -1
            });
        }
    }

    getIdleAnimationKey(enemyType) {
        return `enemy-${enemyType.toLowerCase()}-idle`;
    }

    getDeathAnimationKey(enemyType) {
        return `enemy-${enemyType.toLowerCase()}-death`;
    }

    ensureBoardTileTextures(gridSize) {
        // Les tuiles utilisent désormais directement les sprites pixel art dédiés.
    }

    ensureProgressPotionTextures() {
        // Les crans de potion sont désormais fournis comme assets UI dédiés.
    }
}
