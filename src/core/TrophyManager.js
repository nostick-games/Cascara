class TrophyManager {
    static STORAGE_KEY = 'gridfall_trophies_v1';
    static PROGRESS_STORAGE_KEY = 'gridfall_trophy_progress_v1';

    static getDefinitions() {
        return TrophyDefinitions.getAll();
    }

    constructor(scene) {
        this.scene = scene;
    }

    static loadUnlockedIds() {
        try {
            const raw = window.localStorage.getItem(TrophyManager.STORAGE_KEY);
            const ids = raw ? JSON.parse(raw) : [];
            return Array.isArray(ids) ? ids : [];
        } catch (_error) {
            return [];
        }
    }

    static saveUnlockedIds(ids) {
        try {
            window.localStorage.setItem(TrophyManager.STORAGE_KEY, JSON.stringify(ids));
        } catch (_error) {
            // Ignore storage failures gracefully.
        }
    }

    static loadProgress() {
        const defaultProgress = {
            imperialMarchStep: 0,
            arcadeKingdomWins: {},
            storyCampaignFragmentIds: []
        };

        try {
            const raw = window.localStorage.getItem(TrophyManager.PROGRESS_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : {};
            return {
                imperialMarchStep: Math.max(0, Math.floor(parsed?.imperialMarchStep || 0)),
                arcadeKingdomWins: parsed?.arcadeKingdomWins && typeof parsed.arcadeKingdomWins === 'object'
                    ? { ...parsed.arcadeKingdomWins }
                    : {},
                storyCampaignFragmentIds: Array.isArray(parsed?.storyCampaignFragmentIds)
                    ? [...new Set(parsed.storyCampaignFragmentIds)]
                    : defaultProgress.storyCampaignFragmentIds
            };
        } catch (_error) {
            return defaultProgress;
        }
    }

    static saveProgress(progress) {
        try {
            window.localStorage.setItem(TrophyManager.PROGRESS_STORAGE_KEY, JSON.stringify({
                imperialMarchStep: Math.max(0, Math.floor(progress?.imperialMarchStep || 0)),
                arcadeKingdomWins: progress?.arcadeKingdomWins && typeof progress.arcadeKingdomWins === 'object'
                    ? { ...progress.arcadeKingdomWins }
                    : {},
                storyCampaignFragmentIds: Array.isArray(progress?.storyCampaignFragmentIds)
                    ? [...new Set(progress.storyCampaignFragmentIds)]
                    : []
            }));
        } catch (_error) {
            // Ignore storage failures gracefully.
        }
    }

    static getUnlockedDefinitions() {
        const unlocked = new Set(TrophyManager.loadUnlockedIds());
        return TrophyManager.getDefinitions().filter((definition) => unlocked.has(definition.id));
    }

    preloadAssets(loaderOrScene) {
        const loader = loaderOrScene?.load || loaderOrScene;
        TrophyManager.getDefinitions().forEach((definition) => {
            loader.image(
                definition.imageKey,
                definition.placeholderAssetPath || `assets/images/trophies/${definition.id}.png`
            );
        });
    }

    initializeTracker() {
        return {
            unlockedTrophies: TrophyManager.loadUnlockedIds(),
            metaProgress: TrophyManager.loadProgress(),
            newlyUnlockedTrophies: [],
            hasViewedNewTrophies: false,
            usedGaugeBomb: false,
            usedChaosBonus: false,
            usedAnyBonus: false,
            bombsTriggeredByPlayer: 0,
            triggeredEnemyBomb: false,
            enemyTriggeredPlayerBomb: false,
            lastPlayerCascadeUsedEnemyBomb: false,
            maxPlayerCascadeSize: 0,
            usedPotionIds: [],
            hadUnderThirtyControl: false,
            minControlPercent: 100,
            completedPlayerTurnsAtWin: 0
        };
    }

    getTracker() {
        return this.scene.gameState?.playerStats?.trophyTracker || null;
    }

    getMetaProgress() {
        const tracker = this.getTracker();
        if (!tracker) {
            return null;
        }

        if (!tracker.metaProgress) {
            tracker.metaProgress = TrophyManager.loadProgress();
        }

        return tracker.metaProgress;
    }

    saveMetaProgress() {
        const metaProgress = this.getMetaProgress();
        if (!metaProgress) {
            return;
        }

        TrophyManager.saveProgress(metaProgress);
    }

    syncProgressFromScene() {
        this.syncStoryCampaignFragments();
    }

    syncStoryCampaignFragments() {
        if (this.scene.storyContext?.source !== 'story') {
            return;
        }

        const tracker = this.getTracker();
        const metaProgress = this.getMetaProgress();
        const storyState = this.scene.storyContext?.storyState || {};
        if (!tracker || !metaProgress) {
            return;
        }

        const isFreshCampaignStart =
            StoryMapState.getPathIndex(storyState.currentPathIndex || 0) === 0
            && (storyState.completedNodeIds?.length || 0) === 0;

        if (isFreshCampaignStart) {
            metaProgress.storyCampaignFragmentIds = [];
        }

        const ownedFragmentIds = Object.entries(StoryFragmentInventory.normalizeCounts(storyState.fragments || {}))
            .filter(([, count]) => count > 0)
            .map(([fragmentId]) => fragmentId);
        const activeFragmentIds = Array.isArray(storyState.activeFragmentIds)
            ? storyState.activeFragmentIds
            : [storyState.activeFragmentId].filter(Boolean);
        const seenIds = new Set([
            ...(metaProgress.storyCampaignFragmentIds || []),
            ...ownedFragmentIds,
            ...activeFragmentIds
        ]);
        metaProgress.storyCampaignFragmentIds = [...seenIds];
        this.saveMetaProgress();

        const allFragmentIds = StoryFragmentCatalog.getAll().map((fragment) => fragment.id);
        const ownsAllFragments = allFragmentIds.length > 0 && allFragmentIds.every((fragmentId) => seenIds.has(fragmentId));
        if (ownsAllFragments) {
            this.unlock(['tro_0705']);
        }
    }

    markPlayerControl(scoreData) {
        const tracker = this.getTracker();
        if (!tracker || !scoreData?.percentages) {
            return;
        }

        const controlPercent = scoreData.percentages.ROUGE || 0;
        tracker.minControlPercent = Math.min(
            tracker.minControlPercent ?? 100,
            controlPercent
        );

        if (controlPercent < 30) {
            tracker.hadUnderThirtyControl = true;
        }
    }

    markPotionConsumed(potionId) {
        const tracker = this.getTracker();
        if (!tracker) {
            return;
        }

        if (this.scene.isBossRushMode && this.scene.bossRushConfig) {
            this.scene.bossRushConfig.anyPotionUsed = true;
        }

        if (!tracker.usedPotionIds.includes(potionId)) {
            tracker.usedPotionIds.push(potionId);
        }

        if (tracker.usedPotionIds.length >= 3) {
            this.unlock(['tro_0501']);
        }
    }

    markGaugeBombUsed() {
        const tracker = this.getTracker();
        if (!tracker) {
            return;
        }

        tracker.usedGaugeBomb = true;
        tracker.usedAnyBonus = true;
    }

    markChaosBonusUsed() {
        const tracker = this.getTracker();
        if (!tracker) {
            return;
        }

        tracker.usedChaosBonus = true;
        tracker.usedAnyBonus = true;
    }

    markCascadeResult(playerColor, cascadeResult) {
        const tracker = this.getTracker();
        if (!tracker || !cascadeResult) {
            return;
        }

        const specialEvents = cascadeResult.specialEvents || [];
        if (playerColor === 'ROUGE') {
            tracker.lastPlayerCascadeUsedEnemyBomb = false;
            tracker.maxPlayerCascadeSize = Math.max(
                tracker.maxPlayerCascadeSize || 0,
                cascadeResult.convertedCount || 0
            );
            if ((cascadeResult.convertedCount || 0) >= 10) {
                this.unlock(['tro_0401']);
            }
            if ((cascadeResult.convertedCount || 0) >= 20) {
                this.unlock(['tro_0402']);
            }
        }

        let bombsTriggeredThisCascade = 0;

        specialEvents.forEach((event) => {
            if (event.type !== 'BOMB' && event.type !== 'SUPER_BOMB') {
                return;
            }

            bombsTriggeredThisCascade += 1;

            if (event.triggeredBy === 'ROUGE') {
                tracker.bombsTriggeredByPlayer += 1;
                if (tracker.bombsTriggeredByPlayer >= 5) {
                    this.unlock(['tro_0302']);
                }

                if (event.ownerColor && event.ownerColor !== 'ROUGE') {
                    tracker.triggeredEnemyBomb = true;
                    tracker.lastPlayerCascadeUsedEnemyBomb = true;
                    this.unlock(['tro_0303']);
                }
            } else if (event.ownerColor === 'ROUGE' && event.type === 'SUPER_BOMB') {
                tracker.enemyTriggeredPlayerBomb = true;
                this.unlock(['tro_0304']);
            }
        });

        if (bombsTriggeredThisCascade >= 3) {
            this.unlock(['tro_0305']);
        }
    }

    finalizeGame(resultType) {
        const tracker = this.getTracker();
        if (!tracker) {
            return [];
        }

        if (resultType === 'defeat') {
            this.handleImperialMarchProgress(false);
            return tracker.newlyUnlockedTrophies.slice();
        }

        if (resultType !== 'victory') {
            return tracker.newlyUnlockedTrophies.slice();
        }

        const stats = this.scene.gameState.playerStats || {};
        const consumedPotions = Object.values(stats.consumedPotions || {}).reduce((sum, count) => sum + count, 0);
        const playerCount = this.scene.gameState.playerOrder.length;
        const boardSize = this.scene.boardSize || this.scene.config?.gridSize;
        const completedPlayerTurns = (this.scene.gameState.playerTurnCount || 0) + (this.scene.gameState.currentPlayer === 'ROUGE' ? 1 : 0);
        const bossTypeKey = this.scene.getCurrentBossTypeKey?.() || null;
        const isStoryBoss = this.scene.storyContext?.source === 'story' && this.scene.storyNodeType === 'boss';
        const burningTileCount = this.countBurningTiles();
        tracker.completedPlayerTurnsAtWin = completedPlayerTurns;

        const unlockIds = [];

        if (this.scene.isStrategoMode) {
            this.collectStrategoVictoryUnlocks(unlockIds);
            this.unlock(unlockIds);
            return tracker.newlyUnlockedTrophies.slice();
        }

        if (this.scene.isFightMode) {
            this.collectFightVictoryUnlocks(unlockIds);
            this.unlock(unlockIds);
            return tracker.newlyUnlockedTrophies.slice();
        }

        if (this.scene.isBossRushMode) {
            this.collectBossRushVictoryUnlocks(unlockIds);
            this.unlock(unlockIds);
            return tracker.newlyUnlockedTrophies.slice();
        }

        if (consumedPotions === 0) {
            if (this.scene.difficulty === 'EASY') unlockIds.push('tro_0101');
            if (this.scene.difficulty === 'NORMAL') unlockIds.push('tro_0102');
            if (this.scene.difficulty === 'HARD') unlockIds.push('tro_0103');
        }

        if (consumedPotions === 0 && !tracker.usedGaugeBomb && !tracker.usedChaosBonus) {
            unlockIds.push('tro_0106');
        }

        if (!tracker.usedGaugeBomb) {
            unlockIds.push('tro_0104');
        }

        if (!tracker.usedChaosBonus) {
            unlockIds.push('tro_0105');
        }

        if (playerCount === 4) {
            unlockIds.push('tro_0201');
            if (this.scene.gameState?.battleRoyale?.activationTurn != null) {
                unlockIds.push('tro_0205');
            }
        }

        if (boardSize === 8 && playerCount === 2 && this.scene.difficulty === 'HARD') {
            unlockIds.push('tro_0203');
        }

        if (tracker.lastPlayerCascadeUsedEnemyBomb) {
            unlockIds.push('tro_0301');
        }

        if (consumedPotions >= 4) {
            unlockIds.push('tro_0502');
        }

        if (tracker.hadUnderThirtyControl || (tracker.minControlPercent ?? 100) < 30) {
            unlockIds.push('tro_0601');
        }

        if (completedPlayerTurns < 10) {
            unlockIds.push('tro_0602');
        }

        if (boardSize === 14 && !tracker.usedAnyBonus) {
            unlockIds.push('tro_0603');
        }

        if (boardSize === 8 && completedPlayerTurns < 7) {
            unlockIds.push('tro_0604');
        }

        if (isStoryBoss) {
            if (bossTypeKey === 'SALAMANDER') {
                unlockIds.push('tro_0701');
                if (burningTileCount <= 3) {
                    unlockIds.push('tro_0801');
                }
            }

            if (bossTypeKey === 'GOLEM') {
                unlockIds.push('tro_0702');
                if (!tracker.usedGaugeBomb) {
                    unlockIds.push('tro_0802');
                }
            }

            if (bossTypeKey === 'OGRE') {
                unlockIds.push('tro_0703', 'tro_0704');
                if (!this.scene.storyContext?.storyState?.activeBossBlessingId) {
                    unlockIds.push('tro_0803');
                }
            }
        }

        this.unlock(unlockIds);
        this.handleImperialMarchProgress(true);
        this.handleArcadeKingdomProgress();
        return tracker.newlyUnlockedTrophies.slice();
    }

    collectStrategoVictoryUnlocks(unlockIds) {
        const boardSize = this.scene.boardSize || this.scene.config?.gridSize;
        const patternId = this.scene.strategoConfig?.seedPatternId || null;
        const moveLimit = Math.max(
            0,
            Math.floor(this.scene.strategoConfig?.solutionMoves?.length || this.scene.strategoConfig?.moveLimit || 0)
        );
        const movesRemaining = Math.max(0, Math.floor(this.scene.gameState?.strategoMovesRemaining || 0));
        const moveCountUsed = Math.max(0, moveLimit - movesRemaining);

        if (boardSize === 8) {
            unlockIds.push('tro_0901');
        }

        if (boardSize === 12) {
            unlockIds.push('tro_0903');
        }

        if (boardSize === 14) {
            unlockIds.push('tro_0905');
        }

        if (moveLimit > 0 && moveCountUsed === moveLimit) {
            unlockIds.push('tro_0907');
        }

        if (movesRemaining >= 2) {
            unlockIds.push('tro_0908');
        }

        this.collectStrategoCompletionUnlocks(unlockIds, 8, 'tro_0902');
        this.collectStrategoCompletionUnlocks(unlockIds, 12, 'tro_0904');
        this.collectStrategoCompletionUnlocks(unlockIds, 14, 'tro_0906');
    }

    collectStrategoCompletionUnlocks(unlockIds, boardSize, trophyId) {
        const patternIds = StrategoPuzzleGenerator.getSeedPatternIds(boardSize);
        if (!Array.isArray(patternIds) || patternIds.length < 5) {
            return;
        }

        const completedAll = patternIds.every((patternId) =>
            MetaProgression.hasSolvedStrategoPattern(boardSize, patternId)
        );

        if (completedAll) {
            unlockIds.push(trophyId);
        }
    }

    collectFightVictoryUnlocks(unlockIds) {
        const enemyKey = this.scene.getFightEnemyTypeKey?.() || null;
        if (!enemyKey) {
            return;
        }

        MetaProgression.markFightEnemyDefeated(enemyKey);
        unlockIds.push('tro_1001');

        const requiredEnemyKeys = ['GOBLIN', 'SKULL', 'WIZARD', 'SALAMANDER', 'GOLEM', 'OGRE'];
        const defeatedEnemyKeys = MetaProgression.getFightDefeatedEnemyKeys();
        const defeatedAll = requiredEnemyKeys.every((requiredKey) => defeatedEnemyKeys[requiredKey]);
        if (defeatedAll) {
            unlockIds.push('tro_1002');
        }
    }

    collectBossRushVictoryUnlocks(unlockIds) {
        if (!this.scene.isBossRushMode || this.scene.canContinueBossRushAfterVictory?.()) {
            return;
        }

        const modeId = String(this.scene.bossRushConfig?.modeId || '').toUpperCase();
        if (modeId === 'EASY') {
            unlockIds.push('tro_1101');
        } else if (modeId === 'NORMAL') {
            unlockIds.push('tro_1102');
        } else if (modeId === 'HARD') {
            unlockIds.push('tro_1103');
        } else if (modeId === 'ULTIME') {
            unlockIds.push('tro_1104');
        }

        if (!this.scene.bossRushConfig?.anyPotionUsed) {
            unlockIds.push('tro_1105');
        }
    }

    handleImperialMarchProgress(playerWon) {
        const metaProgress = this.getMetaProgress();
        if (!metaProgress) {
            return;
        }

        if (!playerWon) {
            metaProgress.imperialMarchStep = 0;
            this.saveMetaProgress();
            return;
        }

        const boardSize = this.scene.boardSize || this.scene.config?.gridSize;
        const expectedBoardSizes = [8, 12, 14];
        const currentStep = Math.max(0, Math.floor(metaProgress.imperialMarchStep || 0));
        const expectedBoardSize = expectedBoardSizes[currentStep];

        if (boardSize === expectedBoardSize) {
            metaProgress.imperialMarchStep = currentStep + 1;
            if (metaProgress.imperialMarchStep >= expectedBoardSizes.length) {
                metaProgress.imperialMarchStep = 0;
                this.unlock(['tro_0204']);
            }
        } else if (boardSize === 8) {
            metaProgress.imperialMarchStep = 1;
        } else {
            metaProgress.imperialMarchStep = 0;
        }

        this.saveMetaProgress();
    }

    handleArcadeKingdomProgress() {
        if (this.scene.storyContext?.source === 'story') {
            return;
        }

        const metaProgress = this.getMetaProgress();
        if (!metaProgress) {
            return;
        }

        const kingdomId = this.scene.arcadeKingdomId || 'VERDOMBRE';
        metaProgress.arcadeKingdomWins = {
            ...(metaProgress.arcadeKingdomWins || {}),
            [kingdomId]: true
        };
        this.saveMetaProgress();

        const requiredKingdomIds = ['VERDOMBRE', 'VULKARN', 'DRAZHUL'];
        const hasAllKingdomWins = requiredKingdomIds.every((requiredId) => metaProgress.arcadeKingdomWins?.[requiredId]);
        if (hasAllKingdomWins) {
            this.unlock(['tro_0605']);
        }
    }

    countBurningTiles() {
        const grid = this.scene.gameState?.grid || [];
        let burningTileCount = 0;

        grid.forEach((row) => {
            row.forEach((pion) => {
                if (pion?.isBurning) {
                    burningTileCount += 1;
                }
            });
        });

        return burningTileCount;
    }

    unlock(ids) {
        const tracker = this.getTracker();
        if (!tracker || !Array.isArray(ids) || ids.length === 0) {
            return [];
        }

        const current = new Set(tracker.unlockedTrophies || []);
        const newlyUnlocked = [];

        ids.forEach((id) => {
            if (!id || current.has(id)) {
                return;
            }

            current.add(id);
            newlyUnlocked.push(id);
        });

        if (newlyUnlocked.length === 0) {
            return [];
        }

        tracker.unlockedTrophies = Array.from(current);
        tracker.newlyUnlockedTrophies = [
            ...(tracker.newlyUnlockedTrophies || []),
            ...newlyUnlocked
        ];
        tracker.hasViewedNewTrophies = false;
        TrophyManager.saveUnlockedIds(tracker.unlockedTrophies);
        if (this.scene.gameBoard?.showTrophyUnlockNotification) {
            this.scene.gameBoard.showTrophyUnlockNotification(newlyUnlocked);
        }
        return newlyUnlocked;
    }

    markViewed() {
        const tracker = this.getTracker();
        if (!tracker) {
            return;
        }

        tracker.hasViewedNewTrophies = true;
        tracker.newlyUnlockedTrophies = [];
    }
}
