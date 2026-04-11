class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.setup = new GameSceneSetup(this);
        this.flow = new GameSceneFlow(this);
        this.outcome = new GameSceneOutcomeHelper(this);
        this.trophies = new TrophyManager(this);
    }

    init(data) {
        this.isStrategoMode = Boolean(data?.strategoConfig);
        this.isFightMode = Boolean(data?.fightConfig);
        this.isBossRushMode = Boolean(data?.bossRushConfig);
        this.strategoConfig = data?.strategoConfig || null;
        this.fightConfig = data?.fightConfig || null;
        this.bossRushConfig = data?.bossRushConfig
            ? {
                ...data.bossRushConfig,
                sequence: (data.bossRushConfig.sequence || []).map((entry) => ({ ...entry })),
                nextProgressPotions: (data.bossRushConfig.nextProgressPotions || []).map((potion) => ({ ...potion }))
            }
            : null;
        this.aiCount = data?.aiCount ?? (this.isStrategoMode ? 0 : (this.isFightMode ? 1 : 2));
        this.boardSize = data?.boardSize ?? (this.isFightMode ? 8 : 14);
        this.difficulty = data?.difficulty || 'NORMAL';
        this.preselectedEnemyAssignments = data?.enemyAssignments || null;
        this.preselectedProgressPotions = data?.progressPotions
            ? data.progressPotions.map((potion) => ({ ...potion }))
            : null;
        this.storyNodeType = data?.storyNodeType || (this.isBossRushMode ? 'boss' : null);
        this.storyContext = data?.storyContext || null;
        this.storyGoldReward = data?.storyGoldReward || 0;
        this.arcadeKingdomId = data?.arcadeKingdomId || 'VERDOMBRE';
        this.storyUnlockedPotionId = null;
        this.storyRewardFragmentId = null;
        this.endStarsRewardByResult = {};
        if (data?.language) {
            TranslationManager.setLanguage(data.language);
        }
    }

    buildAdvancedStoryState() {
        return this.outcome.buildAdvancedStoryState();
    }

    canReturnToStoryMapAfterVictory() {
        return this.outcome.canReturnToStoryMapAfterVictory();
    }

    getCurrentBossTypeKey() {
        return this.outcome.getCurrentBossTypeKey();
    }

    getStoryBossVictoryMessage() {
        return this.outcome.getStoryBossVictoryMessage();
    }

    shouldShowFightBossUnlockMessage() {
        return this.outcome.shouldShowFightBossUnlockMessage();
    }

    markFightBossUnlockMessageSeen() {
        this.outcome.markFightBossUnlockMessageSeen();
    }

    shouldReturnToMainMenuAfterVictory() {
        return this.outcome.shouldReturnToMainMenuAfterVictory();
    }

    canContinueBossRushAfterVictory() {
        return this.outcome.canContinueBossRushAfterVictory();
    }

    getBossRushNextPotions() {
        return this.outcome.getBossRushNextPotions();
    }

    getBossRushContinuationMessage() {
        return this.outcome.getBossRushContinuationMessage();
    }

    continueBossRush() {
        this.outcome.continueBossRush();
    }

    returnToBossRushMenu() {
        this.scene.start('BossRushScene', { language: TranslationManager.getLanguage() });
    }

    getEndStarsReward(resultType) {
        return this.outcome.getEndStarsReward(resultType);
    }

    getOgreGoldConversionStars() {
        return this.outcome.getOgreGoldConversionStars();
    }

    getStoryUnlockedPotionId() {
        return this.outcome.getStoryUnlockedPotionId();
    }

    getStoryUnlockedPotionDefinition() {
        return this.outcome.getStoryUnlockedPotionDefinition();
    }

    getStoryRewardFragmentId() {
        return this.outcome.getStoryRewardFragmentId();
    }

    getStoryRewardFragmentDefinition() {
        return this.outcome.getStoryRewardFragmentDefinition();
    }

    preload() {
        this.setup.preloadEnemyAssets();
    }

    create() {
        this.initializeModules();
        this.initializeGameState();
        this.initializeGrid();
        this.registerCheatKeys();
        this.gameBoard.createUI();
        this.gameBoard.animateBoardReveal(this.gameState.grid, this.playerOrder, () => {
            if (this.isFightMode) {
                this.playFightIntro(() => {
                    this.startRandomFirstPlayerSelection();
                });
                return;
            }

            this.startRandomFirstPlayerSelection();
        });
    }

    playFightIntro(onComplete) {
        const centerX = this.gameBoard.GRID_OFFSET_X + this.gameBoard.GAUGE_WIDTH / 2;
        const bottomY = this.gameBoard.GRID_OFFSET_Y + this.gameBoard.GRID_SIZE * this.gameBoard.CELL_SIZE - Math.round(this.gameBoard.CELL_SIZE * 0.65);
        const isNarrowViewport = this.scale.width < 500;

        const shadowText = this.add.text(centerX + 4, bottomY + 4, 'FIGHT!', {
            fontSize: isNarrowViewport ? '42px' : '58px',
            fill: '#2a0b09',
            fontFamily: 'Vollkorn',
            fontStyle: '900',
            stroke: '#120302',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(32).setAlpha(0);

        const mainText = this.add.text(centerX, bottomY, 'FIGHT!', {
            fontSize: isNarrowViewport ? '42px' : '58px',
            fill: '#ffd76a',
            fontFamily: 'Vollkorn',
            fontStyle: '900',
            stroke: '#8f1d14',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(33).setAlpha(0);

        const accentText = this.add.text(centerX - 2, bottomY - 2, 'FIGHT!', {
            fontSize: isNarrowViewport ? '42px' : '58px',
            fill: '#fff6db',
            fontFamily: 'Vollkorn',
            fontStyle: '900',
            stroke: '#d33b1f',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(34).setAlpha(0);

        [shadowText, mainText, accentText].forEach((text) => {
            text.setScale(1.6);
            text.setAngle(-6);
        });

        this.tweens.add({
            targets: [shadowText, mainText, accentText],
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 260,
            ease: 'Back.easeOut'
        });

        this.tweens.add({
            targets: [mainText, accentText],
            angle: 0,
            duration: 260,
            ease: 'Sine.easeOut'
        });

        this.time.delayedCall(360, () => {
            this.cameras.main.shake(120, 0.004);

            this.tweens.add({
                targets: [shadowText, mainText, accentText],
                y: '-=10',
                alpha: 0,
                scaleX: 1.08,
                scaleY: 1.08,
                duration: 320,
                ease: 'Sine.easeIn',
                onComplete: () => {
                    shadowText.destroy();
                    mainText.destroy();
                    accentText.destroy();
                    if (onComplete) {
                        onComplete();
                    }
                }
            });
        });
    }

    initializeModules() {
        this.setup.initializeModules();
    }

    initializeGameState() {
        this.setup.initializeGameState();
        this.trophies.syncProgressFromScene();
    }

    initializeGrid() {
        this.setup.initializeGrid();
    }

    getGoalGaugeThreshold() {
        if (this.isStrategoMode || this.isFightMode) {
            return 100;
        }

        return GameLogic.getWinThreshold(this.boardSize, this.gameState?.playerOrder?.length || this.aiCount + 1);
    }

    getStrategoMovesRemaining() {
        return this.gameState?.strategoMovesRemaining ?? 0;
    }

    getFightHealth(color) {
        const health = this.gameState?.fightHealth?.[color];
        return Math.max(0, Math.floor(health ?? 0));
    }

    getFightEnemyTypeKey() {
        return this.fightConfig?.enemyTypeKey || this.preselectedEnemyAssignments?.BLEU?.key || null;
    }

    restartCurrentStrategoPuzzle() {
        if (!this.isStrategoMode || !this.strategoConfig) {
            return;
        }

        this.scene.start('GameScene', {
            aiCount: 0,
            boardSize: this.boardSize,
            difficulty: this.difficulty,
            language: TranslationManager.getLanguage(),
            arcadeKingdomId: this.arcadeKingdomId || 'VERDOMBRE',
            strategoConfig: this.strategoConfig
        });
    }

    update(time, delta) {
        this.flow.update(time, delta);
    }

    handleAITurn(time) {
        this.flow.handleAITurn(time);
    }

    handleAIAction(action) {
        this.flow.handleAIAction(action);
    }

    getNextPlayer(currentPlayer) {
        return this.flow.getNextPlayer(currentPlayer);
    }

    handleCascadeAnimation(time) {
        this.flow.handleCascadeAnimation(time);
    }

    handlePionClick(row, col) {
        this.flow.handlePionClick(row, col);
    }

    executeMove(row, col) {
        this.flow.executeMove(row, col);
    }

    finalizeTurn() {
        this.flow.finalizeTurn();
    }

    removeEliminatedAIPlayers(scoreData) {
        this.flow.removeEliminatedAIPlayers(scoreData);
    }

    updateUI() {
        this.flow.updateUI();
    }

    startRandomFirstPlayerSelection() {
        this.flow.startRandomFirstPlayerSelection();
    }

    applyLightningCharge(playerColor, convertedCount, specialActivationCount = 0) {
        this.flow.applyLightningCharge(playerColor, convertedCount, specialActivationCount);
    }

    updateFrozenCells() {
        this.flow.updateFrozenCells();
    }

    handleBonusClick(color) {
        this.flow.handleBonusClick(color);
    }

    handleProgressPotionClick(potionId) {
        this.flow.handleProgressPotionClick(potionId);
    }

    handleEnemyIntentClick(color) {
        this.flow.handleEnemyIntentClick(color);
    }

    registerCheatKeys() {
        if (!this.input?.keyboard) return;

        const cheatMap = {
            I: 'ICE',
            M: 'SWAMP',
            L: 'LIGHTNING',
            X: 'BOMB',
            B: 'PLACE_BOMB'
        };
        const potionCheatMap = {
            '1': 'ROSE',
            '2': 'ORANGE',
            '3': 'MENTHE',
            '4': 'MARRON',
            '5': 'BLANCHE',
            '6': 'CYAN'
        };

        this.input.keyboard.on('keydown', (event) => {
            const potionId = potionCheatMap[event.key];
            if (potionId) {
                this.triggerCheatPotion(potionId);
                return;
            }

            const bonusType = cheatMap[event.key?.toUpperCase()];
            if (event.key?.toUpperCase() === 'V') {
                this.triggerCheatVictory();
                return;
            }
            if (event.key?.toUpperCase() === 'D') {
                this.triggerCheatDefeat();
                return;
            }
            if (!bonusType) return;
            this.grantCheatBonus(bonusType);
        });
    }

    grantCheatBonus(bonusType) {
        if (!this.gameState || this.gameState.gameOver || this.isFightMode) return;

        this.gameState.availableBonuses.ROUGE = bonusType;
        this.gameState.pendingPlacementBonus = null;
        this.gameState.lightningCharge.ROUGE = 0;
        this.flow.resetBonusHoldState('ROUGE');
        this.updateUI();
    }

    grantCheatPotion(potionId) {
        if (!this.gameState || this.gameState.gameOver || this.isFightMode) return;

        const definitions = this.setup.getProgressPotionDefinitions();
        const definition = definitions.find((entry) => entry.id === potionId);
        if (!definition) return;

        let potion = (this.gameState.progressPotions || []).find(
            (entry) => entry.id === potionId
        );

        if (!potion) {
            potion = {
                ...definition,
                unlockThreshold: 0,
                active: true,
                consumed: false,
                cooldownTurnsRemaining: 0,
                cheatInjected: true
            };
            this.gameState.progressPotions.push(potion);
        } else {
            potion.unlockThreshold = 0;
            potion.consumed = false;
            potion.active = true;
            potion.cooldownTurnsRemaining = 0;
            potion.cheatInjected = true;
        }

        this.updateUI();
    }

    triggerCheatPotion(potionId) {
        this.grantCheatPotion(potionId);

        if (potionId === 'ORANGE' || potionId === 'ROSE' || potionId === 'MENTHE' || potionId === 'BLANCHE' || potionId === 'CYAN') {
            this.handleProgressPotionClick(potionId);
        }
    }

    triggerCheatVictory() {
        if (!this.gameState || this.gameState.gameOver) return;
        const scoreData = this.gameLogic.getScoreData(this.gameState.grid);
        this.gameState.gameOver = true;
        if (!this.isStrategoMode) {
            this.trophies.finalizeGame('victory');
        }
        this.gameBoard.showGameOver({
            leader: {
                color: 'ROUGE',
                percentage: scoreData.percentages?.ROUGE || 0
            },
            winThreshold: this.getGoalGaugeThreshold()
        });
    }

    triggerCheatDefeat() {
        if (!this.gameState || this.gameState.gameOver) return;
        const scoreData = this.gameLogic.getScoreData(this.gameState.grid);
        const leader = this.gameLogic.getLeadingPlayer(scoreData);
        this.gameState.gameOver = true;
        if (!this.isStrategoMode) {
            this.trophies.finalizeGame('defeat');
        }
        this.gameBoard.showDefeat(leader?.color || null);
    }
}
